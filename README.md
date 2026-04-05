# 🌌 Virtual Cosmos

A production-grade 2D multiplayer virtual space where proximity unlocks chat. Move your avatar close to someone — a chat panel appears. Walk away — it closes.

Built with React 19, PixiJS 8, Socket.IO 4, Express 5, MongoDB.

---

## Features

- **Proximity chat** — chat rooms open and close based on your canvas position
- **Real-time movement** — 60fps avatar movement, positions broadcast at 20 updates/sec
- **Persistent messages** — last 50 messages per room loaded from MongoDB (auto-delete after 24h)
- **Deterministic room IDs** — `[idA, idB].sort().join('_')` ensures both clients agree
- **Multi-peer** — handles multiple simultaneous proximity connections
- **Scaliq design system** — DM Sans, #00E87A green, dark surfaces, framer-motion animations

---

## Tech Stack

| Layer | Tech | Version |
|-------|------|---------|
| Frontend framework | React | 19.1.0 |
| Build tool | Vite | 6.3.1 |
| 2D canvas | PixiJS | 8.17.1 |
| Styling | Tailwind CSS | 4.1.3 |
| Animation | Framer Motion | 11.x |
| State | Zustand | 5.0.3 |
| Realtime | Socket.IO client | 4.8.1 |
| Backend | Express | 5.1.0 |
| Realtime server | Socket.IO | 4.8.1 |
| Database | Mongoose + MongoDB Atlas | 8.13.2 |
| Runtime | Node.js | 22 LTS |

---

## Local Development

### Prerequisites
- Node.js 22+
- MongoDB Atlas account (free M0 tier works)

### 1. Clone and install

```bash
git clone https://github.com/your-username/virtual-cosmos.git
cd virtual-cosmos

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 2. Configure server env

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://cosmos-admin:<password>@cluster0.xxxxx.mongodb.net/virtual-cosmos
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Run everything

Terminal 1 — server:
```bash
cd server && npm run dev
```

Terminal 2 — client:
```bash
cd client && npm run dev
```

Open `http://localhost:5173` in two tabs. Enter different names and move the avatars close together.

---

## Deployment

### MongoDB Atlas
1. Create free M0 cluster at https://cloud.mongodb.com
2. Database Access → add user `cosmos-admin`
3. Network Access → allow `0.0.0.0/0`
4. Copy the connection string

### Render (Backend)
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment variables:
  - `MONGO_URI` → your Atlas string
  - `CLIENT_URL` → your Vercel URL (add after deploy)
  - `NODE_ENV` → `production`

### Vercel (Frontend)
- Root Directory: `client`
- Framework: Vite
- Build Command: `npm run build`
- Output: `dist`
- Environment variables:
  - `VITE_SERVER_URL` → your Render URL

### After both are deployed
Go back to Render and set `CLIENT_URL` to your actual Vercel URL. Render auto-redeploys.

---

## How Proximity Chat Works

```
PROXIMITY_RADIUS = 150px (canvas units)

Every position update:
  distance(userA, userB) = √((ax-bx)² + (ay-by)²)

  if distance < 150 AND not connected:
    roomId = [idA, idB].sort().join('_')  // same on client + server
    both join Socket.IO room
    emit proximity:connect to both → ChatPanel appears

  if distance >= 150 AND was connected:
    both leave Socket.IO room
    emit proximity:disconnect → ChatPanel closes
```

---

## Project Structure

```
virtual-cosmos/
├── server/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/User.js
│   │   ├── models/Message.js
│   │   ├── routes/health.js
│   │   ├── socket/
│   │   │   ├── index.js
│   │   │   ├── state/roomState.js
│   │   │   └── handlers/
│   │   │       ├── movement.js
│   │   │       ├── chat.js
│   │   │       └── proximity.js
│   │   └── index.js
│   └── package.json
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── cosmos/   ← PixiJS canvas + avatars
    │   │   ├── chat/     ← ChatPanel, ChatMessage, ChatInput
    │   │   ├── ui/       ← NameEntry, ConnectionBadge, UserCount
    │   │   └── layout/   ← AppShell (header + main)
    │   ├── hooks/        ← useSocket, useKeyboard
    │   ├── store/        ← Zustand cosmosStore
    │   ├── socket/       ← socketClient singleton
    │   ├── utils/        ← proximity math, avatar colors
    │   └── constants/    ← config.js (shared constants)
    └── package.json
```
