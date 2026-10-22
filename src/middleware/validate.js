const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to run after express-validator checks.
 * Returns formatted errors if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return sendError(res, 'Validation failed.', 422, messages);
  }
  next();
};

module.exports = validate;
