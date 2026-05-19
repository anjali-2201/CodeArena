const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Run after express-validator chains.
 * Returns a 400 with all field errors if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msgs = errors.array().map((e) => `${e.path}: ${e.msg}`);
    return next(ApiError.badRequest('Validation failed', msgs));
  }
  next();
};

module.exports = { validate };
