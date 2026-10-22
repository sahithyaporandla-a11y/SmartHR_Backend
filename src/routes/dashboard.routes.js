const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), getStats);

module.exports = router;
