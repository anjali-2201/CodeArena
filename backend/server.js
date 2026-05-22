const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');

dotenv.config();

const { createLoggers, logger } = require('./utils/logger');
const { initRedis }    = require('./services/cache.service');
const { initExecutor } = require('./services/executor');
const { initQueue }    = require('./services/queue.service');
const { errorHandler } = require('./middleware/errorHandler.middleware');

const app = express();


// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json());


// ── HTTP Logging ──────────────────────────────────────────────────────────
const [consoleLogger, fileLogger] = createLoggers();
app.use(consoleLogger);
app.use(fileLogger);



// ── Routes ────────────────────────────────────────────────────────────────
const authRoutes       = require('./routes/auth.routes');
const problemRoutes    = require('./routes/problem.routes');
const submissionRoutes = require('./routes/submission.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const profileRoutes    = require('./routes/profile.routes');

// Tighter rate limits on auth + submissions
app.use('/api/auth',        authRoutes);
app.use('/api/problems',    problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile',     profileRoutes);


// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CodeArena API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────
const PORT      = process.env.PORT      || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-judge';

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    logger.info('✅ Connected to MongoDB');

    // 2. Init Redis cache (graceful fallback if unavailable)
    await initRedis();

    // 3. Init code executor (Docker or local)
    await initExecutor();

    // 4. Init BullMQ queue (graceful fallback if Redis unavailable)
    await initQueue();

    // 5. Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 CodeArena API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('❌ Bootstrap error:', err.message);
    process.exit(1);
  }
}

bootstrap();