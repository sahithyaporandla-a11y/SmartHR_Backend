const express = require('express');
const router = express.Router();
const { getAttendance, checkIn, checkOut, createAttendance } = require('../controllers/attendance.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getAttendance);
router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.post('/', protect, authorize('admin'), createAttendance);

module.exports = router;
