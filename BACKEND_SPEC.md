# ⚙️ BACKEND_SPEC — Virtual Cosmos Server

> Write every file listed here exactly. Node.js 22 LTS + Express 5 + Socket.IO 4 + Mongoose 8.

---

## package.json

```json
{
  "name": "virtual-cosmos-server",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "helmet": "^8.0.0",
    "mongoose": "^8.13.2",
    "socket.io": "^4.8.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.9"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

---

## .env.example

```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/virtual-cosmos?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## .gitignore

```
node_modules/
.env
dist/
*.log
```

---

## src/index.js

```javascript
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import healthRouter from './routes/health.js';
import { initSocket } from './socket/index.js';

const app = express();
const server = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/health', healthRouter);

// ── Socket.IO ───────────────────────────────────────────────
initSocket(server);

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 ENV: ${process.env.NODE_ENV}`);
  });
}).catch((err) => {
  console.error('❌ DB connection failed:', err.message);
  process.exit(1);
});
```

---

## src/config/db.js

```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not defined in .env');

  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
};

export default connectDB;
```

---

## src/routes/health.js

```javascript
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

export default router;
```

---

## src/models/User.js

```javascript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  socketId: { type: String, required: true, index: true },
  username: { type: String, required: true, trim: true, maxlength: 32 },
  joinedAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
```

---

## src/models/Message.js

```javascript
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now },
});

// Auto-delete messages older than 24 hours (TTL index)
messageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model('Message', messageSchema);
```

---

## src/socket/state/roomState.js

```javascript
/**
 * In-memory state for all connected users.
 * Key: socket.id
 * Value: { socketId, username, x, y, connections: Set<socketId> }
 *
 * This resets on server restart — that is fine for a real-time session app.
 */

const users = new Map();

export const addUser = (socketId, username, x, y) => {
  users.set(socketId, {
    socketId,
    username,
    x,
    y,
    connections: new Set(),
  });
};

export const removeUser = (socketId) => {
  users.delete(socketId);
};

export const updatePosition = (socketId, x, y) => {
  const user = users.get(socketId);
  if (user) {
    user.x = x;
    user.y = y;
  }
};

export const getUser = (socketId) => users.get(socketId);

export const getAllUsers = () => Array.from(users.values()).map(u => ({
  socketId: u.socketId,
  username: u.username,
  x: u.x,
  y: u.y,
}));

export const getAllUsersRaw = () => users;

export const addConnection = (socketIdA, socketIdB) => {
  const a = users.get(socketIdA);
  const b = users.get(socketIdB);
  if (a) a.connections.add(socketIdB);
  if (b) b.connections.add(socketIdA);
};

export const removeConnection = (socketIdA, socketIdB) => {
  const a = users.get(socketIdA);
  const b = users.get(socketIdB);
  if (a) a.connections.delete(socketIdB);
  if (b) b.connections.delete(socketIdA);
};

export const areConnected = (socketIdA, socketIdB) => {
  const a = users.get(socketIdA);
  return a ? a.connections.has(socketIdB) : false;
};

export const getUserCount = () => users.size;
```

---

## src/socket/handlers/proximity.js

```javascript
/**
 * Pure utility — no side effects.
 * Calculates Euclidean distance between two users.
 */

export const PROXIMITY_RADIUS = 150;

export const distance = (userA, userB) => {
  const dx = userA.x - userB.x;
  const dy = userA.y - userB.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Returns a deterministic room ID for any two socket IDs.
 * Sorting ensures A+B and B+A produce same roomId.
 */
export const getRoomId = (socketIdA, socketIdB) =>
  [socketIdA, socketIdB].sort().join('_');

/**
 * Checks all user pairs and returns:
 * { toConnect: [{a, b}], toDisconnect: [{a, b}] }
 */
export const calculateProximityChanges = (usersMap) => {
  const ids = Array.from(usersMap.keys());
  const toConnect = [];
  const toDisconnect = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = usersMap.get(ids[i]);
      const b = usersMap.get(ids[j]);
      if (!a || !b) continue;

      const dist = distance(a, b);
      const connected = a.connections.has(ids[j]);

      if (dist < PROXIMITY_RADIUS && !connected) {
        toConnect.push({ a, b });
      } else if (dist >= PROXIMITY_RADIUS && connected) {
        toDisconnect.push({ a, b });
      }
    }
  }

  return { toConnect, toDisconnect };
};
```

---

## src/socket/handlers/movement.js

```javascript
import {
  updatePosition,
  getAllUsers,
  getAllUsersRaw,
  addConnection,
  removeConnection,
} from '../state/roomState.js';
import { calculateProximityChanges, getRoomId } from './proximity.js';

export const registerMovementHandlers = (io, socket) => {
  socket.on('position:update', ({ x, y }) => {
    // Validate input — clamp to canvas bounds
    const clampedX = Math.max(0, Math.min(Number(x) || 0, 1200));
    const clampedY = Math.max(0, Math.min(Number(y) || 0, 700));

    updatePosition(socket.id, clampedX, clampedY);

    // Broadcast all positions to all clients
    const allUsers = getAllUsers();
    io.emit('position:broadcast', { users: allUsers });

    // Run proximity check
    const usersMap = getAllUsersRaw();
    const { toConnect, toDisconnect } = calculateProximityChanges(usersMap);

    // Handle new connections
    for (const { a, b } of toConnect) {
      const roomId = getRoomId(a.socketId, b.socketId);
      addConnection(a.socketId, b.socketId);

      // Both users join the chat room
      const socketA = io.sockets.sockets.get(a.socketId);
      const socketB = io.sockets.sockets.get(b.socketId);
      if (socketA) socketA.join(roomId);
      if (socketB) socketB.join(roomId);

      // Notify both
      io.to(a.socketId).emit('proximity:connect', {
        roomId,
        peerId: b.socketId,
        peerName: b.username,
      });
      io.to(b.socketId).emit('proximity:connect', {
        roomId,
        peerId: a.socketId,
        peerName: a.username,
      });
    }

    // Handle disconnections
    for (const { a, b } of toDisconnect) {
      const roomId = getRoomId(a.socketId, b.socketId);
      removeConnection(a.socketId, b.socketId);

      const socketA = io.sockets.sockets.get(a.socketId);
      const socketB = io.sockets.sockets.get(b.socketId);
      if (socketA) socketA.leave(roomId);
      if (socketB) socketB.leave(roomId);

      io.to(a.socketId).emit('proximity:disconnect', {
        roomId,
        peerId: b.socketId,
      });
      io.to(b.socketId).emit('proximity:disconnect', {
        roomId,
        peerId: a.socketId,
      });
    }
  });
};
```

---

## src/socket/handlers/chat.js

```javascript
import Message from '../../models/Message.js';
import { getUser } from '../state/roomState.js';

export const registerChatHandlers = (io, socket) => {
  // Send a message to a proximity chat room
  socket.on('chat:message', async ({ roomId, text }) => {
    const user = getUser(socket.id);
    if (!user) return;

    // Validate
    if (!roomId || typeof text !== 'string') return;
    const trimmed = text.trim().slice(0, 500);
    if (!trimmed) return;

    // Check socket is actually in that room (security)
    if (!socket.rooms.has(roomId)) return;

    const message = {
      roomId,
      senderId: socket.id,
      senderName: user.username,
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to everyone in room (including sender)
    io.to(roomId).emit('chat:receive', message);

    // Persist async (fire and forget — don't block socket)
    Message.create(message).catch(err =>
      console.error('Message save error:', err.message)
    );
  });

  // When proximity:connect fires, server sends chat history
  socket.on('chat:request_history', async ({ roomId }) => {
    if (!socket.rooms.has(roomId)) return;

    try {
      const messages = await Message.find({ roomId })
        .sort({ timestamp: 1 })
        .limit(50)
        .lean();

      socket.emit('chat:history', { roomId, messages });
    } catch (err) {
      console.error('History fetch error:', err.message);
    }
  });
};
```

---

## src/socket/index.js

```javascript
import { Server } from 'socket.io';
import {
  addUser,
  removeUser,
  getAllUsers,
  getAllUsersRaw,
  getUser,
  removeConnection,
  getUserCount,
} from './state/roomState.js';
import { registerMovementHandlers } from './handlers/movement.js';
import { registerChatHandlers } from './handlers/chat.js';
import { getRoomId, calculateProximityChanges } from './handlers/proximity.js';
import User from '../models/User.js';

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Reconnection settings
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (total: ${getUserCount() + 1})`);

    // ── User Join ──────────────────────────────────────────
    socket.on('user:join', async ({ username }) => {
      if (!username || typeof username !== 'string') return;
      const safeName = username.trim().slice(0, 32);

      // Spawn at random position
      const x = Math.floor(Math.random() * 1000) + 100;
      const y = Math.floor(Math.random() * 500) + 100;

      addUser(socket.id, safeName, x, y);

      // Persist to DB (fire and forget)
      User.create({ socketId: socket.id, username: safeName }).catch(() => {});

      // Send confirmation + current world
      socket.emit('user:joined', {
        userId: socket.id,
        username: safeName,
        x,
        y,
        allUsers: getAllUsers(),
      });

      // Broadcast updated positions to everyone
      io.emit('position:broadcast', { users: getAllUsers() });

      console.log(`👤 ${safeName} joined (${socket.id})`);
    });

    // ── Register handlers ──────────────────────────────────
    registerMovementHandlers(io, socket);
    registerChatHandlers(io, socket);

    // ── Disconnect ─────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      const user = getUser(socket.id);
      if (!user) return;

      console.log(`🔴 ${user.username} disconnected (${reason})`);

      // Clean up connections: notify all connected peers
      const usersMap = getAllUsersRaw();
      for (const [otherId, otherUser] of usersMap.entries()) {
        if (otherUser.connections.has(socket.id)) {
          const roomId = getRoomId(socket.id, otherId);
          removeConnection(socket.id, otherId);

          const otherSocket = io.sockets.sockets.get(otherId);
          if (otherSocket) otherSocket.leave(roomId);

          io.to(otherId).emit('proximity:disconnect', {
            roomId,
            peerId: socket.id,
          });
        }
      }

      removeUser(socket.id);

      // Notify everyone this user left
      io.emit('user:disconnected', { socketId: socket.id });
      io.emit('position:broadcast', { users: getAllUsers() });

      // Update DB lastSeen
      User.updateOne(
        { socketId: socket.id },
        { lastSeen: new Date() }
      ).catch(() => {});
    });
  });

  return io;
};
```

---

## CRITICAL — Things Claude Must NOT Change

1. **Event names must exactly match** the Socket Event Map in ARCHITECTURE.md
2. `type: "module"` in package.json — use `import`/`export` everywhere, NOT `require()`
3. `PROXIMITY_RADIUS = 150` must be the same on both client and server
4. `getRoomId` must use `.sort().join('_')` — deterministic, both sides compute same ID
5. Position update is throttled on the **client side** (50ms), NOT the server
6. Message validation: check `socket.rooms.has(roomId)` before broadcasting
