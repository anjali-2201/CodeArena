const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });

module.exports = {
  // General API — 100 req / 15 min
  general: createLimiter(15 * 60 * 1000, 100, 'Too many requests. Please slow down.'),

  // Auth endpoints — 10 attempts / 15 min (brute-force protection)
  auth: createLimiter(15 * 60 * 1000, 10, 'Too many login attempts. Try again in 15 minutes.'),

  // Code execution — 20 submissions / 5 min per user
  submission: createLimiter(5 * 60 * 1000, 20, 'Submission rate limit exceeded. Wait a few minutes.'),

  // Run (lighter) — 40 runs / 5 min
  run: createLimiter(5 * 60 * 1000, 40, 'Run rate limit exceeded. Wait a few minutes.'),
};
