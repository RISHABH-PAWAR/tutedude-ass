# 🎨 FRONTEND_SPEC — Virtual Cosmos Client

> React 19 + Vite 6 + PixiJS 8.17.1 + Tailwind CSS 4 + Zustand 5 + Socket.IO client 4

---

## package.json

```json
{
  "name": "virtual-cosmos-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "pixi.js": "^8.17.1",
    "socket.io-client": "^4.8.1",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.4.1",
    "@tailwindcss/vite": "^4.1.3",
    "tailwindcss": "^4.1.3",
    "vite": "^6.3.1"
  }
}
```

---

## vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),   // Tailwind v4 — no tailwind.config.js needed
  ],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
```

---

## src/index.css

```css
@import "tailwindcss";

/* Custom CSS variables */
:root {
  --cosmos-bg: #0f0f1a;
  --cosmos-grid: #1a1a2e;
  --panel-bg: rgba(15, 15, 26, 0.92);
  --panel-border: rgba(99, 102, 241, 0.3);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--cosmos-bg);
  color: #e2e8f0;
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}

/* Scrollbar for chat */
.chat-scroll::-webkit-scrollbar { width: 4px; }
.chat-scroll::-webkit-scrollbar-track { background: transparent; }
.chat-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 4px; }
```

---

## src/main.jsx

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

---

## src/constants/config.js

```javascript
// ── Canvas ────────────────────────────────────────────────────
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 700;

// ── Avatar ────────────────────────────────────────────────────
export const AVATAR_RADIUS = 24;
export const PROXIMITY_RADIUS = 150;   // MUST match server value

// ── Movement ─────────────────────────────────────────────────
export const MOVE_SPEED = 3;           // pixels per frame at 60fps
export const POSITION_THROTTLE_MS = 50; // emit to server every 50ms max

// ── Avatar Colors (by hash) ───────────────────────────────────
export const AVATAR_COLORS = [
  0x6366f1, // indigo
  0x22c55e, // green
  0xf59e0b, // amber
  0xef4444, // red
  0x3b82f6, // blue
  0xa855f7, // purple
  0xf97316, // orange
  0x06b6d4, // cyan
];

// ── Server ────────────────────────────────────────────────────
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
```

---

## src/utils/proximity.js

```javascript
import { PROXIMITY_RADIUS } from '../constants/config.js';

export const distance = (userA, userB) => {
  const dx = userA.x - userB.x;
  const dy = userA.y - userB.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const isNear = (userA, userB) =>
  distance(userA, userB) < PROXIMITY_RADIUS;

export const getRoomId = (idA, idB) =>
  [idA, idB].sort().join('_');
```

---

## src/utils/avatarColor.js

```javascript
import { AVATAR_COLORS } from '../constants/config.js';

// Deterministic color from username string
export const getAvatarColor = (username = '') => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
```

---

## src/socket/socketClient.js

```javascript
import { io } from 'socket.io-client';
import { SERVER_URL } from '../constants/config.js';

// Singleton — created once, reused everywhere
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,        // connect manually on user:join
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};
```

---

## src/store/cosmosStore.js

```javascript
import { create } from 'zustand';

const useCosmosStore = create((set, get) => ({
  // ── Identity ───────────────────────────────────────────────
  mySocketId: null,
  myUsername: '',
  hasJoined: false,

  // ── World ─────────────────────────────────────────────────
  myPosition: { x: 400, y: 300 },
  users: [],

  // ── Proximity / Chat ───────────────────────────────────────
  connections: [],      // [{ roomId, peerId, peerName }]
  activeRoomId: null,
  messages: {},         // { [roomId]: [...] }

  // ── Actions ───────────────────────────────────────────────
  setMySocketId: (id) => set({ mySocketId: id }),
  setMyUsername: (name) => set({ myUsername: name }),
  setHasJoined: (bool) => set({ hasJoined: bool }),

  setMyPosition: ({ x, y }) => set({ myPosition: { x, y } }),

  setUsers: (users) => set({ users }),

  addConnection: ({ roomId, peerId, peerName }) => {
    const existing = get().connections.find(c => c.roomId === roomId);
    if (existing) return;
    set(state => ({
      connections: [...state.connections, { roomId, peerId, peerName }],
      activeRoomId: roomId,   // auto-open most recent connection
    }));
  },

  removeConnection: ({ roomId }) => {
    set(state => {
      const next = state.connections.filter(c => c.roomId !== roomId);
      return {
        connections: next,
        activeRoomId: next.length > 0 ? next[next.length - 1].roomId : null,
      };
    });
  },

  setActiveRoomId: (roomId) => set({ activeRoomId: roomId }),

  addMessage: ({ roomId, message }) => {
    set(state => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), message],
      },
    }));
  },

  setMessages: ({ roomId, messages }) => {
    set(state => ({
      messages: {
        ...state.messages,
        [roomId]: messages,
      },
    }));
  },

  // Called on full reset (e.g., user leaves)
  reset: () => set({
    mySocketId: null,
    myUsername: '',
    hasJoined: false,
    myPosition: { x: 400, y: 300 },
    users: [],
    connections: [],
    activeRoomId: null,
    messages: {},
  }),
}));

export default useCosmosStore;
```

---

## src/hooks/useSocket.js

```javascript
import { useEffect } from 'react';
import { connectSocket, getSocket } from '../socket/socketClient.js';
import useCosmosStore from '../store/cosmosStore.js';

export const useSocket = () => {
  const {
    setMySocketId, setHasJoined, setUsers,
    addConnection, removeConnection,
    addMessage, setMessages,
  } = useCosmosStore();

  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => {
      setMySocketId(socket.id);
    });

    socket.on('user:joined', ({ userId, username, x, y, allUsers }) => {
      useCosmosStore.getState().setMyPosition({ x, y });
      setUsers(allUsers);
      setHasJoined(true);
    });

    socket.on('position:broadcast', ({ users }) => {
      setUsers(users);
    });

    socket.on('user:disconnected', ({ socketId }) => {
      setUsers(useCosmosStore.getState().users.filter(u => u.socketId !== socketId));
    });

    socket.on('proximity:connect', ({ roomId, peerId, peerName }) => {
      addConnection({ roomId, peerId, peerName });
      // Request chat history for this room
      socket.emit('chat:request_history', { roomId });
    });

    socket.on('proximity:disconnect', ({ roomId }) => {
      removeConnection({ roomId });
    });

    socket.on('chat:receive', ({ roomId, senderId, senderName, text, timestamp }) => {
      addMessage({ roomId, message: { senderId, senderName, text, timestamp } });
    });

    socket.on('chat:history', ({ roomId, messages }) => {
      setMessages({ roomId, messages });
    });

    socket.on('disconnect', () => {
      setHasJoined(false);
    });

    return () => {
      socket.off('connect');
      socket.off('user:joined');
      socket.off('position:broadcast');
      socket.off('user:disconnected');
      socket.off('proximity:connect');
      socket.off('proximity:disconnect');
      socket.off('chat:receive');
      socket.off('chat:history');
      socket.off('disconnect');
    };
  }, []);

  return getSocket();
};
```

---

## src/hooks/useKeyboard.js

```javascript
import { useEffect, useRef } from 'react';

// Returns a ref containing a Set of currently pressed keys
export const useKeyboard = () => {
  const keysRef = useRef(new Set());

  useEffect(() => {
    const onKeyDown = (e) => {
      keysRef.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return keysRef;
};
```

---

## src/components/cosmos/AvatarSprite.js

```javascript
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { AVATAR_RADIUS, PROXIMITY_RADIUS } from '../../constants/config.js';
import { getAvatarColor } from '../../utils/avatarColor.js';

/**
 * Creates a PixiJS Container representing a single user avatar.
 * Call update(x, y, isNear) on each frame to reposition.
 */
export class AvatarSprite {
  constructor({ username, socketId, isSelf = false }) {
    this.username = username;
    this.socketId = socketId;
    this.isSelf = isSelf;
    this.color = getAvatarColor(username);

    this.container = new Container();
    this._buildGraphics();
  }

  _buildGraphics() {
    // Proximity ring (dashed feel via alpha)
    this.ring = new Graphics();
    this.ring.alpha = 0;
    this.container.addChild(this.ring);

    // Body circle
    this.body = new Graphics();
    this._drawBody(false);
    this.container.addChild(this.body);

    // Username label
    const style = new TextStyle({
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 12,
      fill: '#e2e8f0',
      fontWeight: '500',
    });
    this.label = new Text({ text: this.username, style });
    this.label.anchor.set(0.5, 0);
    this.label.y = AVATAR_RADIUS + 6;
    this.container.addChild(this.label);
  }

  _drawBody(connected) {
    this.body.clear();

    // Outer glow ring for self or connected
    if (this.isSelf) {
      this.body
        .circle(0, 0, AVATAR_RADIUS + 4)
        .stroke({ color: 0xffffff, width: 2, alpha: 0.6 });
    }

    if (connected) {
      this.body
        .circle(0, 0, AVATAR_RADIUS + 3)
        .stroke({ color: 0x22c55e, width: 2, alpha: 0.9 });
    }

    // Main filled circle
    this.body
      .circle(0, 0, AVATAR_RADIUS)
      .fill({ color: this.color });

    // Initial letter
    // (drawn via Text child — see constructor)
  }

  _drawRing(visible) {
    this.ring.clear();
    if (!visible) return;

    // Dashed proximity circle (approximated with segments)
    const segments = 32;
    for (let i = 0; i < segments; i++) {
      if (i % 2 === 0) continue; // skip alternate segments = dashed
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      this.ring
        .moveTo(
          Math.cos(a1) * PROXIMITY_RADIUS,
          Math.sin(a1) * PROXIMITY_RADIUS
        )
        .lineTo(
          Math.cos(a2) * PROXIMITY_RADIUS,
          Math.sin(a2) * PROXIMITY_RADIUS
        );
    }
    this.ring
      .stroke({ color: 0x6366f1, width: 1.5, alpha: 0.5 });
  }

  update(x, y, isConnected = false) {
    this.container.x = x;
    this.container.y = y;

    this._drawBody(isConnected);
    this._drawRing(isConnected || this.isSelf);
    this.ring.alpha = isConnected ? 1 : this.isSelf ? 0.4 : 0;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
```

---

## src/components/cosmos/useCosmosScene.js

```javascript
import { useEffect, useRef, useCallback } from 'react';
import { Application, Graphics } from 'pixi.js';
import { AvatarSprite } from './AvatarSprite.js';
import { getSocket } from '../../socket/socketClient.js';
import useCosmosStore from '../../store/cosmosStore.js';
import { useKeyboard } from '../../hooks/useKeyboard.js';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  MOVE_SPEED, POSITION_THROTTLE_MS,
  AVATAR_RADIUS,
} from '../../constants/config.js';

export const useCosmosScene = (canvasRef) => {
  const appRef = useRef(null);
  const spritesRef = useRef(new Map()); // socketId → AvatarSprite
  const lastEmitRef = useRef(0);
  const keysRef = useKeyboard();

  const { mySocketId, myPosition, users, connections } = useCosmosStore();

  // ── Init PixiJS App ──────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application();

    (async () => {
      await app.init({
        canvas: canvasRef.current,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        background: 0x0f0f1a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      appRef.current = app;

      // Draw grid background
      _drawGrid(app);
    })();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(false, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  // ── Sync users → sprites ─────────────────────────────────
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    const connectedIds = new Set(connections.map(c => c.peerId));

    // Add / update sprites
    for (const user of users) {
      const isSelf = user.socketId === mySocketId;
      const pos = isSelf ? myPosition : user;

      if (!spritesRef.current.has(user.socketId)) {
        const sprite = new AvatarSprite({
          username: user.username,
          socketId: user.socketId,
          isSelf,
        });
        app.stage.addChild(sprite.container);
        spritesRef.current.set(user.socketId, sprite);
      }

      const sprite = spritesRef.current.get(user.socketId);
      sprite.update(pos.x, pos.y, connectedIds.has(user.socketId));
    }

    // Remove stale sprites
    for (const [id, sprite] of spritesRef.current.entries()) {
      if (!users.find(u => u.socketId === id)) {
        sprite.destroy();
        spritesRef.current.delete(id);
      }
    }
  }, [users, connections, myPosition, mySocketId]);

  // ── Game loop — movement ─────────────────────────────────
  useEffect(() => {
    const app = appRef.current;
    if (!app || !mySocketId) return;

    const onTick = () => {
      const keys = keysRef.current;
      const store = useCosmosStore.getState();
      let { x, y } = store.myPosition;

      let moved = false;

      if (keys.has('w') || keys.has('arrowup')) { y = Math.max(AVATAR_RADIUS, y - MOVE_SPEED); moved = true; }
      if (keys.has('s') || keys.has('arrowdown')) { y = Math.min(CANVAS_HEIGHT - AVATAR_RADIUS, y + MOVE_SPEED); moved = true; }
      if (keys.has('a') || keys.has('arrowleft')) { x = Math.max(AVATAR_RADIUS, x - MOVE_SPEED); moved = true; }
      if (keys.has('d') || keys.has('arrowright')) { x = Math.min(CANVAS_WIDTH - AVATAR_RADIUS, x + MOVE_SPEED); moved = true; }

      if (moved) {
        store.setMyPosition({ x, y });

        // Throttle emit to server
        const now = Date.now();
        if (now - lastEmitRef.current > POSITION_THROTTLE_MS) {
          lastEmitRef.current = now;
          getSocket().emit('position:update', { x, y });
        }
      }
    };

    app.ticker.add(onTick);
    return () => app.ticker.remove(onTick);
  }, [mySocketId]);
};

// ── Internal helpers ─────────────────────────────────────────
const _drawGrid = (app) => {
  const grid = new Graphics();
  const gridSize = 60;
  const cols = Math.ceil(CANVAS_WIDTH / gridSize);
  const rows = Math.ceil(CANVAS_HEIGHT / gridSize);

  for (let i = 0; i <= cols; i++) {
    grid.moveTo(i * gridSize, 0).lineTo(i * gridSize, CANVAS_HEIGHT);
  }
  for (let j = 0; j <= rows; j++) {
    grid.moveTo(0, j * gridSize).lineTo(CANVAS_WIDTH, j * gridSize);
  }
  grid.stroke({ color: 0x1a1a2e, width: 1 });
  app.stage.addChild(grid);
};
```

---

## src/components/cosmos/CosmosCanvas.jsx

```jsx
import { useRef } from 'react';
import { useCosmosScene } from './useCosmosScene.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants/config.js';

const CosmosCanvas = () => {
  const canvasRef = useRef(null);
  useCosmosScene(canvasRef);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block rounded-lg border border-indigo-900/30 shadow-2xl"
      style={{ maxWidth: '100%', maxHeight: '100%' }}
    />
  );
};

export default CosmosCanvas;
```

---

## src/components/ui/NameEntry.jsx

```jsx
import { useState } from 'react';
import { connectSocket } from '../../socket/socketClient.js';
import useCosmosStore from '../../store/cosmosStore.js';

const NameEntry = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const setMyUsername = useCosmosStore(s => s.setMyUsername);

  const handleJoin = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) return;

    setLoading(true);
    setMyUsername(trimmed);

    const socket = connectSocket();

    socket.once('connect', () => {
      socket.emit('user:join', { username: trimmed });
    });

    // If already connected
    if (socket.connected) {
      socket.emit('user:join', { username: trimmed });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-indigo-500/30 p-8"
        style={{ background: 'rgba(15,15,26,0.97)' }}>

        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌌</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Virtual Cosmos</h1>
          <p className="text-slate-400 text-sm mt-2">Move close to others to start chatting</p>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Enter your name..."
            maxLength={32}
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500
                       border border-indigo-500/30 outline-none
                       focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400
                       transition-all"
            style={{ background: 'rgba(30,30,50,0.8)' }}
          />

          <button
            onClick={handleJoin}
            disabled={name.trim().length < 2 || loading}
            className="w-full py-3 rounded-xl font-semibold text-white
                       bg-indigo-600 hover:bg-indigo-500
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all active:scale-95"
          >
            {loading ? 'Entering...' : 'Enter Cosmos →'}
          </button>
        </div>

        {/* Controls hint */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="text-center text-slate-500 text-xs">
            Move with <kbd className="px-1 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-xs">WASD</kbd> or
            <kbd className="px-1 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-xs ml-1">↑↓←→</kbd>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NameEntry;
```

---

## src/components/ui/ConnectionBadge.jsx

```jsx
import useCosmosStore from '../../store/cosmosStore.js';

const ConnectionBadge = () => {
  const connections = useCosmosStore(s => s.connections);

  if (connections.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {connections.map(({ roomId, peerName }) => (
        <div
          key={roomId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-green-300"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {peerName}
        </div>
      ))}
    </div>
  );
};

export default ConnectionBadge;
```

---

## src/components/ui/UserCount.jsx

```jsx
import useCosmosStore from '../../store/cosmosStore.js';

const UserCount = () => {
  const users = useCosmosStore(s => s.users);
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm">
      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
      <span>{users.length} online</span>
    </div>
  );
};

export default UserCount;
```

---

## src/components/chat/ChatMessage.jsx

```jsx
import useCosmosStore from '../../store/cosmosStore.js';

const ChatMessage = ({ message }) => {
  const mySocketId = useCosmosStore(s => s.mySocketId);
  const isMine = message.senderId === mySocketId;

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[80%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {!isMine && (
          <span className="text-xs text-slate-500 px-1">{message.senderName}</span>
        )}
        <div
          className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
            isMine
              ? 'text-white rounded-br-sm'
              : 'text-slate-200 rounded-bl-sm'
          }`}
          style={{
            background: isMine
              ? 'rgba(99,102,241,0.7)'
              : 'rgba(255,255,255,0.08)',
          }}
        >
          {message.text}
        </div>
        <span className="text-xs text-slate-600 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
```

---

## src/components/chat/ChatInput.jsx

```jsx
import { useState } from 'react';
import { getSocket } from '../../socket/socketClient.js';

const ChatInput = ({ roomId }) => {
  const [text, setText] = useState('');

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !roomId) return;
    getSocket().emit('chat:message', { roomId, text: trimmed });
    setText('');
  };

  return (
    <div className="flex gap-2 p-3 border-t"
      style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && send()}
        placeholder="Message..."
        maxLength={500}
        className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500
                   border border-indigo-500/20 outline-none focus:border-indigo-400
                   transition-colors"
        style={{ background: 'rgba(30,30,50,0.8)' }}
      />
      <button
        onClick={send}
        disabled={!text.trim()}
        className="px-4 py-2 rounded-lg text-sm font-medium text-white
                   bg-indigo-600 hover:bg-indigo-500
                   disabled:opacity-30 disabled:cursor-not-allowed
                   transition-all active:scale-95"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
```

---

## src/components/chat/ChatPanel.jsx

```jsx
import { useEffect, useRef } from 'react';
import useCosmosStore from '../../store/cosmosStore.js';
import ChatMessage from './ChatMessage.jsx';
import ChatInput from './ChatInput.jsx';

const ChatPanel = () => {
  const connections = useCosmosStore(s => s.connections);
  const activeRoomId = useCosmosStore(s => s.activeRoomId);
  const messages = useCosmosStore(s => s.messages);
  const setActiveRoomId = useCosmosStore(s => s.setActiveRoomId);
  const scrollRef = useRef(null);

  const activeConnection = connections.find(c => c.roomId === activeRoomId);
  const roomMessages = messages[activeRoomId] || [];

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [roomMessages]);

  if (connections.length === 0) return null;

  return (
    <div
      className="flex flex-col rounded-xl border overflow-hidden"
      style={{
        width: 300,
        height: 400,
        background: 'rgba(13,13,22,0.95)',
        borderColor: 'rgba(99,102,241,0.3)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-semibold text-white">
            {activeConnection?.peerName || 'Chat'}
          </span>
        </div>

        {/* Tab switcher if multiple connections */}
        {connections.length > 1 && (
          <div className="flex gap-1">
            {connections.map(c => (
              <button
                key={c.roomId}
                onClick={() => setActiveRoomId(c.roomId)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  c.roomId === activeRoomId
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c.peerName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 chat-scroll"
      >
        {roomMessages.length === 0 ? (
          <p className="text-center text-slate-600 text-xs mt-4">
            Say hello! 👋
          </p>
        ) : (
          roomMessages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))
        )}
      </div>

      {/* Input */}
      <ChatInput roomId={activeRoomId} />
    </div>
  );
};

export default ChatPanel;
```

---

## src/components/layout/AppShell.jsx

```jsx
import useCosmosStore from '../../store/cosmosStore.js';
import CosmosCanvas from '../cosmos/CosmosCanvas.jsx';
import ChatPanel from '../chat/ChatPanel.jsx';
import ConnectionBadge from '../ui/ConnectionBadge.jsx';
import UserCount from '../ui/UserCount.jsx';

const AppShell = () => {
  const myUsername = useCosmosStore(s => s.myUsername);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: '#0a0a14' }}>

      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(99,102,241,0.2)', background: 'rgba(10,10,20,0.9)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">🌌</span>
          <span className="text-white font-semibold tracking-tight">Virtual Cosmos</span>
        </div>

        <ConnectionBadge />

        <div className="flex items-center gap-4">
          <UserCount />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {myUsername.charAt(0).toUpperCase()}
            </div>
            <span className="text-slate-300 text-sm">{myUsername}</span>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex items-center justify-center gap-4 p-4 overflow-hidden relative">
        <CosmosCanvas />

        {/* Chat panel — absolutely positioned to bottom-right of canvas */}
        <div className="absolute bottom-6 right-6 z-10">
          <ChatPanel />
        </div>
      </main>

      {/* Bottom hint */}
      <footer className="text-center py-2 text-slate-600 text-xs flex-shrink-0">
        Use <kbd className="px-1 rounded bg-slate-800 text-slate-400 font-mono">WASD</kbd> or arrow keys to move
        · Approach others to chat
      </footer>
    </div>
  );
};

export default AppShell;
```

---

## src/App.jsx

```jsx
import { useSocket } from './hooks/useSocket.js';
import useCosmosStore from './store/cosmosStore.js';
import NameEntry from './components/ui/NameEntry.jsx';
import AppShell from './components/layout/AppShell.jsx';

const App = () => {
  useSocket(); // registers all socket event listeners

  const hasJoined = useCosmosStore(s => s.hasJoined);

  return (
    <>
      {!hasJoined && <NameEntry />}
      <AppShell />
    </>
  );
};

export default App;
```

---

## index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Virtual Cosmos</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌌</text></svg>" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## .env (client)

```
VITE_SERVER_URL=http://localhost:5000
```

## .env.production (client — set on Vercel)

```
VITE_SERVER_URL=https://virtual-cosmos-api.onrender.com
```

---

## CRITICAL — Things Claude Must NOT Change

1. **PixiJS 8 API** — uses `app.init()` async (not constructor-only), `Graphics` uses method chaining `.circle().fill()` NOT `beginFill/drawCircle/endFill` (that's v7)
2. **Tailwind v4** — NO `tailwind.config.js`, NO `@tailwind base/components/utilities`, just `@import "tailwindcss"` in CSS + `@tailwindcss/vite` in vite.config.js
3. **Zustand v5** — `create((set, get) => ...)` signature, no `devtools` import change
4. **React 19** — `createRoot` from `react-dom/client`, StrictMode is fine
5. **`PROXIMITY_RADIUS = 150`** must match server exactly
6. **Socket singleton** — `getSocket()` must never create duplicate connections
7. **Movement is client-authoritative** — server only broadcasts, client drives position
