const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, sendOTP, verifyOTP } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { loginValidator } = require('../validators/auth.validator');
const validate = require('../middleware/validate');

router.post('/login', loginValidator, validate, login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

module.exports = router;

