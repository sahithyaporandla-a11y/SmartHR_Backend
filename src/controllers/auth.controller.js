const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendOTPEmail } = require('../utils/email');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password included
    const user = await User.findOne({ email }).select('+password').populate('employee');

    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Please contact HR.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employee: user.employee,
        },
      },
      'Login successful.',
      200
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'employee',
      populate: { path: 'manager', select: 'fullName jobTitle' },
    });

    return sendSuccess(res, { user }, 'User profile retrieved.');
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect.', 400);
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, {}, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/send-otp
const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return sendError(res, 'Email is required.', 400);

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('employee');
    if (!user) {
      // Don't reveal whether user exists — same response
      return sendSuccess(res, {}, 'If this email is registered, an OTP has been sent.');
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Contact HR.', 403);
    }

    // Generate 6-digit OTP
    const rawOTP = String(Math.floor(100000 + Math.random() * 900000));
    const expiresMin = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;

    // Hash OTP before storing
    const hashedOTP = await bcrypt.hash(rawOTP, 10);
    user.otp = hashedOTP;
    user.otpExpires = new Date(Date.now() + expiresMin * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send OTP via email (or console in dev mode)
    const name = user.employee?.fullName || '';
    await sendOTPEmail({ to: email, otp: rawOTP, name });

    // In development: include raw OTP in response for easy testing
    const isDev = process.env.NODE_ENV !== 'production';
    const responseData = isDev
      ? { email, devOTP: rawOTP, devNote: 'OTP shown here because NODE_ENV=development. Remove in production.' }
      : { email };

    return sendSuccess(res, responseData, 'If this email is registered, an OTP has been sent.');

  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-otp
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) return sendError(res, 'Email and OTP are required.', 400);

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+otp +otpExpires')
      .populate('employee');

    if (!user) return sendError(res, 'Invalid or expired OTP.', 401);
    if (!user.isActive) return sendError(res, 'Account is deactivated.', 403);

    // Check expiry
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return sendError(res, 'OTP has expired. Please request a new one.', 401);
    }

    // Verify OTP
    if (!user.otp) return sendError(res, 'No OTP found. Please request a new one.', 401);
    const isValid = await bcrypt.compare(String(otp).trim(), user.otp);
    if (!isValid) return sendError(res, 'Invalid OTP. Please try again.', 401);

    // Clear OTP after successful use
    user.otp = undefined;
    user.otpExpires = undefined;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          employee: user.employee,
        },
      },
      'Login successful.',
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, changePassword, sendOTP, verifyOTP };
