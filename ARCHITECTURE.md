# 🏗️ ARCHITECTURE — Virtual Cosmos

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                          │
│                                                                   │
│  ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐  │
│  │  PixiJS 8    │    │  React 19 UI  │    │  Zustand Store   │  │
│  │  Canvas      │◄──►│  (Chat Panel, │◄──►│  (users, myPos,  │  │
│  │  (2D Space)  │    │   Name Entry) │    │   connections,   │  │
│  └──────┬───────┘    └───────┬───────┘    │   messages)      │  │
│         │                    │             └──────────────────┘  │
│         └──────────┬─────────┘                                   │
│                    │                                              │
│            useSocket Hook + socketClient.js                       │
│                    │ (Socket.IO client v4)                        │
└────────────────────┼─────────────────────────────────────────────┘
                     │ WebSocket / Long-poll fallback
                     │
┌────────────────────┼─────────────────────────────────────────────┐
│                    │       SERVER (Node.js 22 + Express 5)        │
│                    │                                              │
│         ┌──────────▼──────────┐                                  │
│         │    Socket.IO v4     │                                   │
│         │    Server           │                                   │
│         │                     │                                   │
│         │  ┌───────────────┐  │    ┌─────────────────────────┐  │
│         │  │ roomState.js  │  │    │     MongoDB Atlas        │  │
│         │  │ (In-memory    │  │    │                          │  │
│         │  │  users Map)   │  │    │  users collection        │  │
│         │  └───────────────┘  │    │  messages collection     │  │
│         │                     │    │                          │  │
│         │  ┌───────────────┐  │    └─────────────────────────┘  │
│         │  │ movement.js   │  │              ▲                    │
│         │  │ chat.js       │◄─┼──────────────┘ Mongoose 8        │
│         │  │ proximity.js  │  │                                   │
│         │  └───────────────┘  │                                   │
│         └─────────────────────┘                                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow — User Movement

```
User presses W/A/S/D
        │
        ▼
useKeyboard hook (client) → updates localPosition in Zustand
        │
        ▼
socketClient.emit('position:update', { x, y })   [throttled: 50ms]
        │
        ▼ WebSocket
Server: movement.js handler
  → Updates roomState Map[socketId] = { userId, username, x, y }
  → Calculates proximity for ALL pairs in room
  → socket.broadcast.emit('position:broadcast', allUsers[])
  → For each proximate pair → emits 'proximity:connect' or 'proximity:disconnect'
        │
        ▼
Client: receives 'position:broadcast'
  → Updates users[] in Zustand
  → PixiJS scene re-renders avatars at new positions
        │
Client: receives 'proximity:connect' | 'proximity:disconnect'
  → Updates connections[] in Zustand
  → ChatPanel shows/hides based on connections
```

---

## 3. Data Flow — Chat

```
User types message + presses Enter
        │
        ▼
ChatInput.jsx → socketClient.emit('chat:message', { roomId, text })
        │
        ▼ WebSocket
Server: chat.js handler
  → Saves Message doc to MongoDB (async, non-blocking)
  → io.to(roomId).emit('chat:receive', { senderId, senderName, text, timestamp })
        │
        ▼
Both clients in the room receive 'chat:receive'
  → messages[] updated in Zustand
  → ChatPanel re-renders new message
```

---

## 4. Proximity Logic

```
PROXIMITY_RADIUS = 150  (pixels, defined in client/src/constants/config.js)
                        (mirrored on server in socket/index.js)

distance(userA, userB) = Math.sqrt((ax - bx)² + (ay - by)²)

if distance < PROXIMITY_RADIUS:
  → roomId = [socketIdA, socketIdB].sort().join('_')  // deterministic room ID
  → Both users join Socket.IO room: io.sockets.get(sid).join(roomId)
  → Emit 'proximity:connect' to both with { roomId, peerId, peerName }

if distance >= PROXIMITY_RADIUS AND previously connected:
  → Both users leave room: io.sockets.get(sid).leave(roomId)
  → Emit 'proximity:disconnect' to both with { roomId, peerId }
```

---

## 5. In-Memory State Schema (Server)

```javascript
// roomState.js — server/src/socket/state/roomState.js

const users = new Map()
// Key: socket.id
// Value:
{
  socketId: "abc123",
  userId: "abc123",          // same as socketId for simplicity
  username: "Rishabh",
  x: 400,                    // canvas x position
  y: 300,                    // canvas y position
  connections: new Set()     // Set of connected socketIds
}
```

---

## 6. MongoDB Schema

### users collection (optional persistence — for username lookup)
```javascript
{
  _id: ObjectId,
  socketId: String,          // index
  username: String,
  joinedAt: Date,
  lastSeen: Date
}
```

### messages collection
```javascript
{
  _id: ObjectId,
  roomId: String,            // e.g. "abc123_def456" — sorted socketIds
  senderId: String,          // socket.id
  senderName: String,
  text: String,              // max 500 chars
  timestamp: Date            // default: Date.now
}
```

---

## 7. Complete Socket Event Map

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `user:join` | `{ username: string }` | User enters cosmos |
| `position:update` | `{ x: number, y: number }` | Movement update (throttled 50ms) |
| `chat:message` | `{ roomId: string, text: string }` | Send chat message |
| `user:leave` | `{}` | Explicit disconnect (optional, disconnect covers it) |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `user:joined` | `{ userId, username, x, y, allUsers[] }` | Confirmation + current world state |
| `position:broadcast` | `{ users: [{socketId, username, x, y}] }` | All user positions |
| `user:disconnected` | `{ socketId: string }` | A user left |
| `proximity:connect` | `{ roomId, peerId, peerName }` | Chat should open |
| `proximity:disconnect` | `{ roomId, peerId }` | Chat should close |
| `chat:receive` | `{ roomId, senderId, senderName, text, timestamp }` | Incoming message |
| `chat:history` | `{ roomId, messages: [] }` | Last 50 messages on connect |

---

## 8. Zustand Store Shape

```javascript
// client/src/store/cosmosStore.js

{
  // Identity
  mySocketId: null,
  myUsername: '',
  hasJoined: false,

  // World state
  myPosition: { x: 400, y: 300 },
  users: [],                     // [{ socketId, username, x, y }]

  // Proximity / Chat
  connections: [],               // [{ roomId, peerId, peerName }]
  activeRoomId: null,            // currently open chat room
  messages: {},                  // { [roomId]: [{ senderId, senderName, text, timestamp }] }

  // Actions
  setMySocketId: (id) => ...,
  setMyUsername: (name) => ...,
  setHasJoined: (bool) => ...,
  setMyPosition: ({ x, y }) => ...,
  setUsers: (users) => ...,
  addConnection: ({ roomId, peerId, peerName }) => ...,
  removeConnection: ({ roomId }) => ...,
  setActiveRoomId: (roomId) => ...,
  addMessage: ({ roomId, message }) => ...,
  setMessages: ({ roomId, messages }) => ...,
}
```

---

## 9. Canvas Coordinate System

```
(0,0) ────────────────────────── (CANVAS_WIDTH, 0)
  │                                      │
  │        2D Cosmos Space                │
  │        CANVAS_WIDTH  = 1200px         │
  │        CANVAS_HEIGHT = 700px          │
  │                                       │
  │    Avatar initial spawn:              │
  │    x = random(100, CANVAS_WIDTH-100)  │
  │    y = random(100, CANVAS_HEIGHT-100) │
  │                                       │
(0, CANVAS_HEIGHT) ───────── (CANVAS_WIDTH, CANVAS_HEIGHT)

Avatar radius = 24px
Proximity radius = 150px (visual ring shown as dashed circle)
Movement speed = 3px per frame (at 60fps)
Position throttle = 50ms (20 updates/sec to server)
```

---

## 10. Avatar Rendering (PixiJS 8)

Each avatar is a PixiJS `Container` with:
- `Graphics` circle (filled color, radius 24)
- `Graphics` dashed proximity ring (radius 150, shows when near someone)
- `Text` username label (below circle)
- Own avatar has white border outline to distinguish

Color assignment: deterministic from username hash → one of 8 preset colors
```javascript
const AVATAR_COLORS = [
  0x6366f1, // indigo
  0x22c55e, // green
  0xf59e0b, // amber
  0xef4444, // red
  0x3b82f6, // blue
  0xa855f7, // purple
  0xf97316, // orange
  0x06b6d4, // cyan
]
```
