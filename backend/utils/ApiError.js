/**
 * Custom API Error class.
 * Throw this anywhere in the app — the global error handler picks it up.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.message    = message;
    this.success    = false;
    this.errors     = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Common factory helpers
  static badRequest(msg, errors = [])  { return new ApiError(400, msg, errors); }
  static unauthorized(msg = 'Unauthorized') { return new ApiError(401, msg); }
  static forbidden(msg = 'Forbidden')       { return new ApiError(403, msg); }
  static notFound(msg = 'Not found')        { return new ApiError(404, msg); }
  static internal(msg = 'Internal server error') { return new ApiError(500, msg); }
}

module.exports = ApiError;
