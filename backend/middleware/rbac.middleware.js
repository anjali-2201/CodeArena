const ApiError = require('../utils/ApiError');

/**
 * Role-based access control middleware factory.
 * Usage: router.post('/admin/...', auth, requireRole('admin'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());

  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(
      `Access denied. Required role: ${roles.join(' or ')}`
    ));
  }
  next();
};

module.exports = { requireRole };
