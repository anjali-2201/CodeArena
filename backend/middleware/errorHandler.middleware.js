const { logger } = require('../utils/logger');

/**
 * Global async error handler.
 * Must be registered LAST in Express middleware chain.
 *
 * Handles:
 *   - ApiError instances (operational errors)
 *   - Mongoose ValidationError / CastError
 *   - JWT errors
 *   - Generic errors (500)
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';
  let errors     = err.errors     || [];

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `${field} already exists`;
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors     = Object.values(err.errors).map((e) => e.message);
    message    = 'Validation failed';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token expired';
  }

  // Log unexpected server errors
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.url} →`, err.message, '\n', err.stack);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

/**
 * Wrap async route handlers to auto-forward errors to the error handler.
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
