# CodeArena 

CodeArena is a modern full-stack online coding platform inspired by platforms like LeetCode, HackerRank, and Codeforces. It allows users to solve programming problems, run code in multiple languages, submit solutions, and receive real-time verdicts through a secure Docker-based judging system.

The project focuses on:

* Secure code execution
* Scalable submission processing
* Clean frontend experience
* Real-world backend architecture
* Competitive programming workflow

---

# Features

## User Features

* User Authentication (JWT)
* Solve coding problems
* Multi-language code execution
* Real-time submission verdicts
* Online code editor
* User profiles
* Activity heatmap
* Leaderboard system

##  System Features

* Docker-based sandbox execution
* Queue-based judging system
* Secure API architecture
* MongoDB database integration
* Rate limiting & security middleware
* Modular scalable backend

---

# Tech Stack

## Frontend

* React
* Vite
* React Router DOM
* Axios
* Monaco Editor
* Framer Motion

## Backend

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT Authentication
* BullMQ
* Redis
* Docker
* bcryptjs
* Helmet
* Express Rate Limit

---

#  System Architecture

```text
Frontend (React)
        ↓
REST API Requests
        ↓
Backend Server (Express)
        ↓
MongoDB Database
        ↓
Submission Queue (BullMQ + Redis)
        ↓
Docker Sandbox / Compiler
        ↓
Execution Result & Verdict
```

---

# Project Structure

```text
CodeArena/
│
├── backend/
│   ├── compiler/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
│
└── README.md
```

---

# Authentication Flow

```text
User Login/Register
        ↓
Backend validates credentials
        ↓
JWT Token generated
        ↓
Frontend stores token
        ↓
Protected API requests use token
        ↓
Backend verifies token
```

---

# Submission Flow

```text
1. User writes code
2. Submission sent to backend
3. Submission added to queue
4. Worker picks submission
5. Docker sandbox compiles code
6. Code runs against test cases
7. Output compared
8. Verdict generated
9. Result stored in database
10. Response returned to frontend
```

---

# Secure Code Execution

Code execution is isolated using Docker containers to prevent:

* Infinite loops
* Memory abuse
* File system access
* Server crashes
* Malicious code execution

Supported languages:

* C++
* Java
* Python
* JavaScript

---

# Scalability Features

* Queue-based submission processing
* Worker architecture
* Stateless JWT authentication
* Modular backend structure
* Isolated execution environment
* Secure middleware integration

---

# Security Features

* JWT Authentication
* Password Hashing using bcrypt
* Helmet security headers
* API rate limiting
* Docker sandbox isolation
* Environment variable protection

---

# Getting Started

## 1. Clone Repository

```bash
git clone https://github.com/anjali-2201/CodeArena
cd CodeArena
```

---

## 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
```

Start backend server:

```bash
npm run dev
```

---

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

# Future Improvements

* Contest system
* Real-time updates with WebSockets
* AI-generated hints
* Editorial section
* Discussion forums
* Code analytics
* Advanced leaderboard system
* Multi-file code submissions

---

# What This Project Demonstrates

* Full-stack web development
* REST API architecture
* Secure authentication systems
* Queue-based processing
* Docker sandboxing
* Database modeling
* Real-world scalable backend design
* Online judge system architecture

---

# Author

Created by Anjali.

---

# Inspiration

Inspired by platforms like:

* LeetCode
* HackerRank
* Codeforces
* HackerEarth
