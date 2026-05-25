# CodeArena

An advanced online coding platform and competitive programming judge built using the MERN stack with secure Docker-based code execution, BullMQ queue processing, Redis caching, and multi-language support.


# Features

* User Authentication & Authorization (JWT)
* Secure code execution using Docker sandboxing
* Multi-language support

  * C++
  * Python
  * Java
  * JavaScript
* Problem management system
* Hidden & sample test cases
* Real-time verdict generation
* Queue-based asynchronous submission processing using BullMQ + Redis
* Leaderboard system
* Submission history tracking
* Time limit & memory limit handling
* Runtime error / compilation error handling
* Output normalization for cross-platform consistency
* Docker-isolated execution environment
* Scalable backend architecture



# Tech Stack

## Frontend

* React.js
* Tailwind CSS
* Axios
* React Router

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

## Execution & Infrastructure

* Docker
* Redis
* BullMQ
* Child Processes


# Architecture Overview (Upcoming)

<img width="1693" height="929" alt="ChatGPT Image May 22, 2026, 08_30_02 PM" src="https://github.com/user-attachments/assets/56728c94-8e13-40ca-a5aa-4a7e3327d025" />




# Submission Workflow

```text
1. User submits code
        ↓
2. Backend validates request
        ↓
3. Submission stored in MongoDB
        ↓
4. BullMQ job added to Redis queue
        ↓
5. Worker picks submission job
        ↓
6. Docker sandbox created
        ↓
7. Code compiled and executed
        ↓
8. Output compared with expected output
        ↓
9. Verdict generated
        ↓
10. Result stored in database
        ↓
11. Frontend polls and displays verdict
```



# Why BullMQ + Redis?

Direct execution blocks the request cycle and reduces scalability.

Using BullMQ:

* keeps the API responsive,
* processes submissions asynchronously,
* supports concurrent users,
* improves scalability.



# Why Docker?

Docker is used to securely execute untrusted user code.

Benefits:

* Isolation
* Security
* Resource limiting
* CPU & memory restrictions
* Timeout handling



# Why Child Processes?

The backend uses Node.js, but users submit code in multiple languages.

Child processes are used to:

* compile C++ code,
* execute Python scripts,
* run Java programs,
* start Docker containers.

This allows the backend to interact with operating-system-level programs safely.



# Supported Verdicts

* Accepted
* Wrong Answer
* Compilation Error
* Runtime Error
* Time Limit Exceeded



# Environment Variables

Create a `.env` file in the backend root:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

REDIS_HOST=localhost
REDIS_PORT=6379

USE_CACHE=true
USE_QUEUE=true
USE_DOCKER=true

EXEC_TIME_LIMIT=10000
EXEC_MEM_LIMIT=256m
EXEC_CPU_LIMIT=0.5

WORKER_CONCURRENCY=3
```



# Installation

## Clone Repository

```bash
git clone <repo-url>
cd CodeArena
```

---

# Backend Setup

```bash
cd backend
npm install
```

Start backend:

```bash
npm run dev
```



# Frontend Setup

```bash
cd frontend
npm install
npm run dev
```



# Redis Setup

Run Redis using Docker:

```bash
docker run -d --name redis -p 6379:6379 redis
```



# Docker Requirement

Ensure Docker Desktop is installed and running.

Verify Docker:

```bash
docker ps
```



# Folder Structure

```text
CodeArena/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   ├── workers/
│   ├── queues/
│   ├── temp/
│   └── utils/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
│
└── README.md
```



# Security Features

* Docker sandbox isolation
* Execution timeout limits
* CPU & memory limits
* JWT authentication
* Input validation
* Queue-based execution isolation



# Future Improvements

* Contest mode
* Real-time collaborative coding
* WebSocket verdict updates
* Kubernetes scaling
* AI-based code analysis
* Plagiarism detection
* Multi-worker distributed execution



# Key Learning Outcomes

This project demonstrates:

* System design fundamentals
* Queue architecture
* Scalable backend engineering
* Secure code execution
* Docker orchestration
* Distributed processing concepts
* Real-world online judge architecture



# Author

Developed by Anjali Sahu.
