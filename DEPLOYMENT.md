# 🚀 DEPLOYMENT — Virtual Cosmos

> MongoDB Atlas (DB) → Render (Backend) → Vercel (Frontend)
> All free tiers. Zero cost to deploy.

---

## Overview

```
GitHub Repo (monorepo)
        │
        ├── /server  ──→  Render (Web Service, Node 22)
        │                    URL: https://virtual-cosmos-api.onrender.com
        │
        └── /client  ──→  Vercel (Static + Edge)
                             URL: https://virtual-cosmos.vercel.app
                          connects to ↑ Render URL via VITE_SERVER_URL
```

---

## Step 1 — MongoDB Atlas

1. Go to https://cloud.mongodb.com → Create free account
2. Create a **free M0 cluster** (choose Singapore / Mumbai region for lowest latency from India)
3. **Database Access** → Add database user:
   - Username: `cosmos-admin`
   - Password: generate a strong one, copy it
   - Role: `Atlas Admin`
4. **Network Access** → Add IP Address → `0.0.0.0/0` (allow all — needed for Render dynamic IPs)
5. **Connect** → Drivers → Node.js → Copy connection string:
   ```
   mongodb+srv://cosmos-admin:<password>@cluster0.xxxxx.mongodb.net/virtual-cosmos?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password. **Save this string.**

---

## Step 2 — GitHub Repository Setup

### Repository structure (monorepo)

```
virtual-cosmos/              ← root of repo
├── server/
│   ├── src/...
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/...
│   ├── package.json
│   └── vite.config.js
└── README.md
```

### Create repo

```bash
git init
git add .
git commit -m "feat: initial Virtual Cosmos implementation"
git remote add origin https://github.com/<your-username>/virtual-cosmos.git
git push -u origin main
```

### .gitignore (root level)

```
# Dependencies
node_modules/

# Env files
.env
.env.local
.env.production

# Build output
dist/
build/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
```

---

## Step 3 — Deploy Backend to Render

1. Go to https://render.com → Sign up with GitHub
2. **New → Web Service**
3. Connect your `virtual-cosmos` repo
4. Configure:

   | Field | Value |
   |-------|-------|
   | **Name** | `virtual-cosmos-api` |
   | **Region** | Singapore (closest to India) |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Plan** | Free |

5. **Environment Variables** → Add:

   | Key | Value |
   |-----|-------|
   | `PORT` | `5000` |
   | `MONGO_URI` | your Atlas connection string |
   | `CLIENT_URL` | `https://virtual-cosmos.vercel.app` *(add this after Vercel deploy)* |
   | `NODE_ENV` | `production` |

6. Click **Create Web Service** → wait ~3 mins for first deploy
7. Visit `https://virtual-cosmos-api.onrender.com/health` → should return `{"status":"ok",...}`

> **Note:** Render free tier spins down after 15min inactivity (cold start ~30s). For demo purposes this is fine. For production upgrade to $7/mo Starter plan.

---

## Step 4 — Deploy Frontend to Vercel

1. Go to https://vercel.com → Sign up with GitHub
2. **New Project** → Import `virtual-cosmos`
3. Configure:

   | Field | Value |
   |-------|-------|
   | **Framework Preset** | `Vite` |
   | **Root Directory** | `client` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |
   | **Install Command** | `npm install` |

4. **Environment Variables** → Add:

   | Key | Value |
   |-----|-------|
   | `VITE_SERVER_URL` | `https://virtual-cosmos-api.onrender.com` |

5. Click **Deploy** → wait ~1 min
6. Visit your Vercel URL → the app should load

---

## Step 5 — Update Backend CORS (Critical)

Once you have your Vercel URL, go back to **Render → Environment**:

```
CLIENT_URL = https://virtual-cosmos.vercel.app
```

Render will auto-redeploy. This is required for Socket.IO CORS to work.

---

## Step 6 — Verify Full Stack Works

1. Open `https://virtual-cosmos.vercel.app` in Tab 1 → Enter name "Alice"
2. Open same URL in Tab 2 (or different browser) → Enter name "Bob"
3. Move Alice close to Bob using WASD
4. Chat panel should appear on both screens
5. Send a message → it appears on both sides
6. Move away → chat panel disappears

---

## CI/CD — GitHub Actions (Optional but Recommended)

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check-server:
    name: Server Build Check
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: server
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: server/package-lock.json
      - run: npm ci
      - run: node --check src/index.js

  check-client:
    name: Client Build Check
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: client
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: client/package-lock.json
      - run: npm ci
      - run: npm run build
        env:
          VITE_SERVER_URL: https://virtual-cosmos-api.onrender.com
```

Every push to `main` will verify both the server parses and client builds successfully.

---

## Render Auto-Deploy Setup

Render auto-deploys on every push to `main` by default. To confirm:
- Render Dashboard → your service → **Settings → Build & Deploy → Auto-Deploy**: ON

Vercel also auto-deploys on every push. No extra config needed.

---

## Common Deployment Issues & Fixes

### Issue: WebSocket connection fails on production
**Cause:** Vercel serverless doesn't support persistent WebSocket connections.
**Fix:** Backend MUST be on Render (or Railway/Fly.io), NOT on Vercel. Frontend only on Vercel.

### Issue: CORS error in browser console
**Cause:** `CLIENT_URL` env var on Render doesn't match actual Vercel URL.
**Fix:** Make sure `CLIENT_URL=https://your-actual-app.vercel.app` (no trailing slash).

### Issue: "Cannot connect to server" on first load
**Cause:** Render free tier cold start (first request after 15min idle takes 20–30s).
**Fix:** Add a connection timeout UI message: "Connecting to cosmos..." with spinner.

### Issue: PixiJS canvas is blank / shows wrong size
**Cause:** `CANVAS_WIDTH/HEIGHT` constants don't match canvas element attributes.
**Fix:** Ensure `CosmosCanvas.jsx` uses the same `CANVAS_WIDTH`/`CANVAS_HEIGHT` from `config.js`.

### Issue: Positions jitter / lag on production
**Cause:** Render free tier has higher latency (~100–200ms vs localhost ~1ms).
**Fix:** This is expected on free tier. Upgrade to $7/mo Starter for ~40ms latency.

### Issue: Chat history not loading
**Cause:** Room ID mismatch — client and server computing different roomIds.
**Fix:** Both must use `[idA, idB].sort().join('_')` — verify this in both `proximity.js` files.

---

## Monitoring (Post-Deployment)

### Check logs
```bash
# Render → your service → Logs tab
# Look for:
# ✅ MongoDB connected
# 🚀 Server running on port 5000
# 🔌 Socket connected: <id>
```

### Check health endpoint
```
GET https://virtual-cosmos-api.onrender.com/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-04T10:00:00.000Z",
  "uptime": 3600
}
```

---

## Environment Variables Summary

### server/.env (local)
```
PORT=5000
MONGO_URI=mongodb+srv://cosmos-admin:<password>@cluster0.xxxxx.mongodb.net/virtual-cosmos
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Render Environment (production)
```
PORT=5000
MONGO_URI=mongodb+srv://cosmos-admin:<password>@cluster0.xxxxx.mongodb.net/virtual-cosmos
CLIENT_URL=https://virtual-cosmos.vercel.app
NODE_ENV=production
```

### client/.env (local)
```
VITE_SERVER_URL=http://localhost:5000
```

### Vercel Environment (production)
```
VITE_SERVER_URL=https://virtual-cosmos-api.onrender.com
```
