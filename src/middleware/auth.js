const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * Protect route — verifies JWT and attaches user to req.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return sendError(res, 'User not found.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account is deactivated.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize by role(s).
 * Usage: authorize('admin') or authorize('admin', 'employee')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to perform this action.', 403);
    }
    next();
  };
};

module.exports = { protect, authorize };
