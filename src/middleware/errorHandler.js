const { sendError } = require('../utils/apiResponse');

/**
 * Centralized error handling middleware.
 * Must be registered AFTER all routes.
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(res, messages.join(', '), 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, `${field} already exists.`, 409);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, 'Invalid resource ID.', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired.', 401);
  }

  // Custom application errors
  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode);
  }

  // Default 500
  return sendError(res, 'Internal server error.', 500);
};

/**
 * Create a custom operational error.
 */
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
};

module.exports = { errorHandler, createError };
