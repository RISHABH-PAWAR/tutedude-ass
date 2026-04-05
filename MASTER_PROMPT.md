# 🤖 MASTER_PROMPT — For Claude AI

> **How to use:** Paste this file along with all other spec files into a new Claude conversation. Claude will read all specs and build the entire project file by file.

---

## Instructions for Claude

You are building **Virtual Cosmos** — a production-grade 2D multiplayer virtual space from scratch.

Read all 5 documentation files in order before writing any code:
1. `README.md` — project overview, folder structure, quick start
2. `ARCHITECTURE.md` — system design, socket event map, data flows, state shape
3. `BACKEND_SPEC.md` — complete backend: every file with full code
4. `FRONTEND_SPEC.md` — complete frontend: every file with full code
5. `DEPLOYMENT.md` — MongoDB Atlas + Render + Vercel deployment

---

## Your Task

Build the **complete project** by creating every file listed in `README.md`'s folder structure. Do NOT skip any file. Do NOT summarize — write full working code for each file.

**Build order:**
1. Create the monorepo root (`/virtual-cosmos`)
2. Build `/server` first (backend) — all files in `BACKEND_SPEC.md`
3. Build `/client` next (frontend) — all files in `FRONTEND_SPEC.md`
4. Create `.github/workflows/ci.yml` from `DEPLOYMENT.md`
5. Write a final `README.md` at root with setup instructions

---

## Non-Negotiable Rules

### Tech Stack — Use EXACTLY these versions (no substitutions):
```
FRONTEND:
  react@19.1.0
  react-dom@19.1.0
  vite@6.3.1
  @vitejs/plugin-react@4.4.1
  pixi.js@8.17.1
  tailwindcss@4.1.3        ← v4 ONLY — NO tailwind.config.js
  @tailwindcss/vite@4.1.3  ← Vite plugin, not PostCSS plugin
  socket.io-client@4.8.1
  zustand@5.0.3

BACKEND:
  node 22.x LTS
  express@5.1.0
  socket.io@4.8.1
  mongoose@8.13.2
  dotenv@16.5.0
  cors@2.8.5
  helmet@8.0.0
  nodemon@3.1.9 (devDep)
```

### PixiJS v8 API Rules (CRITICAL — v7 API will break):
- Use `await app.init({ ... })` — async initialization
- Use `new Graphics().circle(x,y,r).fill({ color })` — method chaining
- Do NOT use `beginFill()`, `drawCircle()`, `endFill()` — those are v7
- Use `new Text({ text: 'hello', style: new TextStyle({...}) })` — v8 API
- Import: `import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js'`

### Tailwind v4 Rules (CRITICAL — v3 setup will break):
- In `index.css`: write `@import "tailwindcss"` — NOT `@tailwind base/components/utilities`
- In `vite.config.js`: add `tailwindcss()` to plugins (from `@tailwindcss/vite`)
- NO `tailwind.config.js` file needed
- NO `postcss.config.js` needed

### Socket Rules:
- Event names must EXACTLY match the table in `ARCHITECTURE.md`
- `PROXIMITY_RADIUS = 150` — same value on both client and server
- `getRoomId`: `[idA, idB].sort().join('_')` — deterministic, used on both sides
- Server uses `"type": "module"` — ES modules only, no `require()`

### State Rules:
- All global state lives in Zustand store (`cosmosStore.js`)
- PixiJS scene reads from Zustand via `useCosmosStore.getState()` inside the ticker
- React components use `useCosmosStore(selector)` for reactive updates

---

## What "Complete" Means

Every file in this structure must exist with full, working code:

```
virtual-cosmos/
├── server/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/User.js
│   │   ├── models/Message.js
│   │   ├── routes/health.js
│   │   ├── socket/index.js
│   │   ├── socket/state/roomState.js
│   │   ├── socket/handlers/movement.js
│   │   ├── socket/handlers/chat.js
│   │   ├── socket/handlers/proximity.js
│   │   └── index.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/cosmos/CosmosCanvas.jsx
│   │   ├── components/cosmos/useCosmosScene.js
│   │   ├── components/cosmos/AvatarSprite.js
│   │   ├── components/chat/ChatPanel.jsx
│   │   ├── components/chat/ChatMessage.jsx
│   │   ├── components/chat/ChatInput.jsx
│   │   ├── components/ui/NameEntry.jsx
│   │   ├── components/ui/ConnectionBadge.jsx
│   │   ├── components/ui/UserCount.jsx
│   │   ├── components/layout/AppShell.jsx
│   │   ├── hooks/useSocket.js
│   │   ├── hooks/useKeyboard.js
│   │   ├── store/cosmosStore.js
│   │   ├── socket/socketClient.js
│   │   ├── utils/proximity.js
│   │   ├── utils/avatarColor.js
│   │   ├── constants/config.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── .env
│   └── package.json
│
├── .github/
│   └── workflows/ci.yml
│
└── README.md
```

---

## Final README.md (write this at the root)

The root README must include:
1. Project title + description
2. Screenshot/GIF placeholder
3. Tech stack with versions
4. Local development setup (step by step)
5. Deployment guide link
6. Features list
7. How proximity chat works (brief explanation)

---

## Start Building Now

Begin with: `server/package.json` → then every server file → then `client/package.json` → then every client file → then CI → then root README.

Write complete, production-ready code. No placeholders. No `// TODO` comments. Every file must work.
