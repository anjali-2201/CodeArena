<div align="center">

# ⚡ CodeArena — Online Judge Platform

**A production-quality, full-stack competitive programming platform built with the MERN stack.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Docker](https://img.shields.io/badge/Docker-Optional-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [JavaScript I/O Guide](#-javascript-io-guide) · [API Reference](#-api-reference) · [Docker Sandbox](#-docker-sandbox-optional)

</div>

---

## 📸 Overview

CodeArena is a LeetCode/Codeforces-inspired platform where users can:

- Browse and solve algorithmic problems across three difficulty tiers
- Submit code in **C++17, Python 3, Java 17, and Node.js 20**
- Get instant verdicts (AC / WA / CE / RE / TLE / MLE) judged against hidden test cases
- **Run** code against visible sample inputs without affecting stats
- Track solving progress with a **GitHub-style activity heatmap** and **streak system**
- Climb the **global leaderboard** with difficulty-weighted scoring
- Earn **achievement badges** for milestones
- Bookmark problems and engage in **per-problem discussions**

---

## ✨ Features

### 🧩 Core Judge

| Feature | Details |
|---|---|
| **Problem Set** | 10 seeded problems — Easy / Medium / Hard |
| **Code Editor** | Monaco Editor (VS Code engine) with syntax highlighting, ligatures, and smooth scrolling |
| **Multi-language** | C++17 · Python 3.11 · Java 17 · Node.js 20 |
| **Run Code** | Test against visible sample cases — not saved, no stat impact |
| **Submit** | Judge against hidden test cases, get verdict in real time |
| **Verdicts** | `Accepted` · `Wrong Answer` · `Compilation Error` · `Runtime Error` · `Time Limit Exceeded` · `Memory Limit Exceeded` |
| **Output Normalization** | `\r\n` → `\n` conversion + trailing-space strip prevents false Wrong Answers on Windows |

### 👤 User System

| Feature | Details |
|---|---|
| **JWT Auth** | Signup / Login with bcrypt (12 rounds) + 7-day tokens |
| **RBAC** | `user` and `admin` roles with protected API routes |
| **Profile Page** | LeetCode-style — solved count, difficulty rings, acceptance rate |
| **Activity Heatmap** | 52-week GitHub-style contribution graph |
| **Streaks** | Current streak + longest streak tracking with daily reset logic |
| **Badges** | First Solve · Hard Hitter · Streak 7 · Streak 30 · Centurion · Century Solver |
| **Bookmarks** | Save problems for later with toggle endpoint |

### 🏆 Leaderboard

| Feature | Details |
|---|---|
| **Global Leaderboard** | Ranked users by score (Easy = 10 · Medium = 20 · Hard = 30) |
| **Tiebreaker** | Score → Problems Solved → Acceptance Rate |
| **Per-user Stats** | Accuracy %, solved count, difficulty breakdown visible on profile |

### 🔒 Security & Performance

| Feature | Details |
|---|---|
| **Rate Limiting** | Per-route limits (auth: 10/15 min · submissions: 20/5 min) |
| **Helmet** | Full suite of HTTP security headers on all responses |
| **Input Validation** | `express-validator` on all mutation endpoints |
| **Redis Cache** | Configurable caching layer with transparent no-op fallback |
| **Docker Sandbox** | Fully isolated code execution (`USE_DOCKER=true`) |
| **BullMQ Queue** | Async submission processing with inline fallback (`USE_QUEUE=true`) |

### 💬 Community

| Feature | Details |
|---|---|
| **Discussions** | Per-problem threaded comments |
| **Voting** | Upvote / downvote with duplicate prevention |
| **Daily Challenge** | Deterministic daily problem (rotates each day) |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   React Frontend (Vite)                   │
│   Home · Problems · ProblemDetail · Leaderboard · Profile │
└──────────────────────────┬───────────────────────────────┘
                            │  HTTP  (Vite proxy → :5000)
┌──────────────────────────▼───────────────────────────────┐
│                  Express API Server (:5000)               │
│  Helmet → Rate Limit → JWT Auth → RBAC → Controllers     │
│                                                           │
│  /api/auth           JWT signup / login / me              │
│  /api/problems       List · detail · daily challenge      │
│  /api/submissions    Run (no save) · Submit (judged)      │
│  /api/leaderboard    Aggregated user rankings             │
│  /api/profile        Stats · activity heatmap · solved    │
│  /api/bookmarks      Toggle · list                        │
│  /api/problems/:id/discussions  Comments · voting         │
└──────┬────────────────────────────────────┬──────────────┘
       │                                    │
       ▼                                    ▼
┌─────────────┐                  ┌────────────────────────┐
│   MongoDB   │                  │   Redis + BullMQ        │
│  (Mongoose) │                  │  (optional — graceful   │
│             │                  │   inline fallback)      │
│  Users      │                  └────────────┬───────────┘
│  Problems   │                               │
│  Solutions  │                  ┌────────────▼───────────┐
│  TestCases  │                  │   Judge Worker          │
│  Discussions│                  │  verdict + streak/badge │
└─────────────┘                  └────────────┬───────────┘
                                              │
                                 ┌────────────▼───────────┐
                                 │   Code Executor         │
                                 │  ┌──────────────────┐  │
                                 │  │  Docker Sandbox   │  │
                                 │  │  (USE_DOCKER=true)│  │
                                 │  └────────┬─────────┘  │
                                 │           │ fallback     │
                                 │  ┌────────▼─────────┐  │
                                 │  │ child_process     │  │
                                 │  │ (default/local)   │  │
                                 │  └──────────────────┘  │
                                 └────────────────────────┘
```

---

## 📁 Project Structure

```
online-judge/
├── backend/
│   ├── compiler/                   ← Legacy runner (kept for reference)
│   │   └── index.js
│   ├── controllers/
│   │   ├── auth.controller.js      ← signup, login, me
│   │   ├── problem.controller.js   ← list, detail, daily
│   │   ├── submission.controller.js← run + submit + judge
│   │   ├── leaderboard.controller.js
│   │   ├── profile.controller.js   ← stats, activity, solved
│   │   └── features.controller.js  ← bookmarks, discussions, votes
│   ├── middleware/
│   │   ├── auth.middleware.js       ← JWT verification
│   │   ├── rbac.middleware.js       ← requireRole('admin')
│   │   ├── rateLimit.middleware.js  ← per-route Express rate limits
│   │   ├── validate.middleware.js   ← express-validator runner
│   │   └── errorHandler.middleware.js
│   ├── models/
│   │   ├── User.js                 ← role, streak, badges, bookmarks
│   │   ├── Problem.js
│   │   ├── Solution.js
│   │   ├── TestCase.js
│   │   └── Discussion.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── problem.routes.js
│   │   ├── submission.routes.js
│   │   ├── leaderboard.routes.js
│   │   ├── profile.routes.js
│   │   └── features.routes.js
│   ├── services/
│   │   ├── executor/
│   │   │   ├── index.js            ← auto-routes Docker ↔ local
│   │   │   ├── docker.executor.js  ← sandboxed Docker execution
│   │   │   └── local.executor.js   ← child_process fallback
│   │   ├── cache.service.js        ← Redis with transparent no-op fallback
│   │   ├── queue.service.js        ← BullMQ with inline fallback
│   │   └── judge.worker.js         ← verdict logic + streak/badge updates
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── logger.js
│   │   └── seed.js                 ← seed 10 problems + test cases
│   ├── temp/                       ← runtime-created; auto-cleaned after each run
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── Heatmap.jsx          ← 52-week GitHub activity graph
    │   ├── context/
    │   │   └── AuthContext.jsx      ← JWT state + Axios interceptors
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Problems.jsx         ← searchable, filterable problem list
    │   │   ├── ProblemDetail.jsx    ← Monaco editor + Run + Submit
    │   │   ├── Leaderboard.jsx
    │   │   └── Profile.jsx          ← stats rings + heatmap + badges
    │   ├── services/
    │   │   └── api.js               ← Axios instance + JWT interceptors
    │   ├── App.jsx                  ← routes + protected route guard
    │   ├── main.jsx
    │   └── index.css                ← dark design system (CSS variables)
    ├── vite.config.js               ← dev proxy /api → localhost:5000
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Required | Notes |
|------|----------|-------|
| Node.js ≥ 18 | ✅ | `node --version` |
| MongoDB | ✅ | Local install or Atlas free tier |
| g++ | ✅ | For C++ execution |
| Python 3 | ✅ | For Python execution |
| Java / javac | ✅ | For Java execution |
| Redis | ⚙️ Optional | Enables caching + BullMQ queue |
| Docker Desktop | ⚙️ Optional | Enables fully sandboxed execution |

---

### Step 1 — Clone & Install

```bash
git clone https://github.com/anjali-2201/online-judge.git
cd online-judge

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

---

### Step 2 — Configure Environment

Create / edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/online-judge
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ── Redis (leave false if Redis is not installed) ─────────
REDIS_HOST=localhost
REDIS_PORT=6379
USE_CACHE=false
USE_QUEUE=false

# ── Docker sandbox (leave false if Docker is not running) ─
USE_DOCKER=false

# ── Execution limits ──────────────────────────────────────
EXEC_TIME_LIMIT=10000    # milliseconds per test case
EXEC_MEM_LIMIT=256m
EXEC_CPU_LIMIT=0.5

# ── Worker concurrency (when USE_QUEUE=true) ──────────────
WORKER_CONCURRENCY=3
```

> ⚠️ **Never commit `.env` to version control. Always change `JWT_SECRET` before deploying.**

---

### Step 3 — Start MongoDB

```bash
# Windows (if installed as a service)
net start MongoDB

# Or start manually
mongod --dbpath C:\data\db

# Using MongoDB Atlas: paste your connection string into MONGO_URI in .env
```

---

### Step 4 — Seed the Database

```bash
cd backend
node utils/seed.js
```

Expected output:
```
✅ Connected to MongoDB for seeding
🗑️  Cleared existing problems and test cases
✅ Seeded: Two Sum (3 test cases)
✅ Seeded: Reverse String (3 test cases)
...
🎉 Seeding complete! 10 problems added.
```

---

### Step 5 — Run the App

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# ✅ Connected to MongoDB
# 🚀 CodeArena API running on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

## 🟨 JavaScript I/O Guide

JavaScript submissions run inside Node.js (v20). The executor automatically prepends the following preamble **before your code**:

```js
'use strict';
const fs = require('fs');
const input = fs.readFileSync(0, 'utf8').trimEnd(); // reads all of stdin
const lines = input.split(/\r?\n/);                 // pre-split line array
let _rl = 0;
function readline() { return lines[_rl++] ?? ''; }  // pop one line at a time
```

This means three I/O patterns are available out of the box — **pick whichever you prefer**:

### Pattern 1 — `readline()` (most common in competitive programming)

```js
const n = parseInt(readline());
const arr = readline().split(' ').map(Number);
console.log(arr.reduce((a, b) => a + b, 0));
```

### Pattern 2 — `lines[]` (indexed access to all lines)

```js
const n = parseInt(lines[0]);
const arr = lines[1].split(' ').map(Number);
console.log(arr.reduce((a, b) => a + b, 0));
```

### Pattern 3 — `input` / `fs.readFileSync` (full string manipulation)

```js
// Via the pre-loaded `input` variable
const [a, b] = input.trim().split('\n').map(Number);

// Or directly — both are equivalent
const raw = fs.readFileSync(0, 'utf8').trim();
```

### Multi-line / Multiple Test Cases

```js
const t = parseInt(readline());       // number of test cases
for (let i = 0; i < t; i++) {
  const [a, b] = readline().split(' ').map(Number);
  console.log(a + b);
}
```

### Why Not `process.stdin` or `prompt()`?

`process.stdin` is asynchronous and requires event listeners, which is awkward in CP-style solutions. `fs.readFileSync(0, 'utf8')` reads all stdin synchronously before your logic runs — exactly what competitive programmers expect. The executor pipes input via `child.stdin` and closes it immediately, so `readFileSync` never blocks.

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/auth/signup` | ❌ | `{ fullName, email, password, dob }` | Register new user |
| `POST` | `/api/auth/login` | ❌ | `{ email, password }` | Login → JWT |
| `GET` | `/api/auth/me` | ✅ | — | Get current user |

### Problems

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/problems` | ❌ | List all problems (supports `?search=` and `?difficulty=`) |
| `GET` | `/api/problems/:id` | ❌ | Problem detail + examples + constraints |
| `GET` | `/api/problems/daily` | ❌ | Today's daily challenge |

### Submissions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/submissions` | ✅ | Submit code → hidden test cases → verdict (saved to DB) |
| `POST` | `/api/submissions/run` | ✅ | Run against sample cases only (not saved) |
| `GET` | `/api/submissions/my` | ✅ | My submission history |

### Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/profile/stats` | ✅ | Solved counts, accuracy %, current/longest streak |
| `GET` | `/api/profile/solved` | ✅ | List of uniquely solved problems |
| `GET` | `/api/profile/activity` | ✅ | Daily submission counts for heatmap |

### Leaderboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/leaderboard` | ❌ | Ranked users by score (paginated) |

### Features

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/bookmarks/:problemId` | ✅ | Toggle bookmark on/off |
| `GET` | `/api/bookmarks` | ✅ | My bookmarked problems |
| `GET` | `/api/problems/:id/discussions` | ❌ | List comments for a problem |
| `POST` | `/api/problems/:id/discussions` | ✅ | Post a comment |
| `POST` | `/api/problems/:id/discussions/:dId/vote` | ✅ | Upvote or downvote |

---

## 🐳 Docker Sandbox (Optional)

When `USE_DOCKER=true`, every submission runs inside a fully isolated container:

```
--rm                          auto-remove after exit
--network=none                no internet access
--memory=256m                 hard RAM cap
--memory-swap=256m            swap disabled
--cpus=0.5                    CPU fraction cap
--read-only                   no filesystem writes
--tmpfs /tmp:size=64m         writable scratch space only
--pids-limit=50               prevents fork bombs
--cap-drop=ALL                drops every Linux capability
--security-opt=no-new-privileges
```

**Setup:**

```bash
# 1. Install Docker Desktop
#    https://docs.docker.com/desktop/install/windows-install/

# 2. Pull language images
docker pull gcc:12
docker pull python:3.11-slim
docker pull eclipse-temurin:17-jdk-alpine
docker pull node:20-slim

# 3. Enable in backend/.env
USE_DOCKER=true
```

**How stdin works with Docker:**

The executor uses `docker run -i` (interactive stdin) and pipes input via Node.js's `child.stdin.write()` / `child.stdin.end()`. This is the only correct cross-platform approach — shell redirects (`< file`) don't work reliably on Windows with Docker, and Docker has no `--timeout` flag.

---

## ⚡ Redis / BullMQ Queue (Optional)

When `USE_QUEUE=true`, submissions are processed asynchronously via BullMQ:

```
POST /api/submissions
  → Creates solution with verdict = "Pending"
  → Enqueues job → Returns immediately to client

BullMQ Worker
  → Dequeues job → Executes code → Updates verdict in DB
```

When Redis is unavailable, the system falls back to **inline synchronous execution** — no configuration change needed.

**Setup:**

```bash
# Windows — run Redis via Docker
docker run -d -p 6379:6379 redis:7-alpine

# Enable in backend/.env
USE_CACHE=true
USE_QUEUE=true
```

---

## 🧩 Seeded Problems

| # | Problem | Difficulty | Points |
|---|---------|------------|--------|
| 1 | Two Sum | Easy | 10 |
| 2 | Reverse String | Easy | 10 |
| 3 | Palindrome Number | Easy | 10 |
| 4 | FizzBuzz | Easy | 10 |
| 5 | Maximum Subarray | Medium | 20 |
| 6 | Valid Parentheses | Medium | 20 |
| 7 | Merge Sorted Array | Medium | 20 |
| 8 | Longest Common Subsequence | Hard | 30 |
| 9 | N-Queens | Hard | 30 |
| 10 | Median of Two Sorted Arrays | Hard | 30 |

---

## 🏅 Leaderboard Scoring

```
Score = Σ (difficulty points for each uniquely solved problem)

  Easy   =  10 pts
  Medium =  20 pts
  Hard   =  30 pts

Each problem is counted ONCE (first Accepted submission only).

Tiebreaker: Score ↓ → Problems Solved ↓ → Acceptance Rate ↓
```

---

## 🥇 Badges

| Badge | Trigger |
|-------|---------|
| 🎯 First Solve | Submit first ever Accepted solution |
| 💎 Hard Hitter | Solve 5+ Hard problems |
| 🔥 Streak 7 | Maintain a 7-day solving streak |
| 🌟 Streak 30 | Maintain a 30-day solving streak |
| 💯 Centurion | Make 100+ total submissions |
| 🏆 Century Solver | Solve 100+ unique problems |

---

## 🔐 Security

- **Passwords** — bcrypt (12 salt rounds), never returned in API responses
- **JWTs** — HS256, 7-day expiry, automatically cleared on 401 response
- **Rate Limiting** — per-route (auth: 10/15 min · submissions: 20/5 min)
- **Helmet** — HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- **RBAC** — admin routes protected by `requireRole('admin')` middleware
- **Input Validation** — `express-validator` on all write endpoints
- **Code Isolation** — Docker sandbox prevents any filesystem or network access from user code

---

## 📜 Scripts

```bash
# ── Backend ──────────────────────────────────────────
npm run dev        # Start with nodemon (hot reload)
npm start          # Production start (no reload)
node utils/seed.js # Seed 10 problems into MongoDB

# ── Frontend ─────────────────────────────────────────
npm run dev        # Start Vite dev server (localhost:5173)
npm run build      # Production bundle → dist/
npm run preview    # Preview production build locally
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat: add X"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request against `main`

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with ❤️ using the MERN Stack
  <br/>
  <strong>MongoDB · Express · React · Node.js</strong>
</div>
