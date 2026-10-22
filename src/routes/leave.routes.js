const express = require('express');
const router = express.Router();
const { getLeaves, getLeave, createLeave, reviewLeave, cancelLeave } = require('../controllers/leave.controller');
const { protect, authorize } = require('../middleware/auth');
const { createLeaveValidator, reviewLeaveValidator } = require('../validators/leave.validator');
const validate = require('../middleware/validate');

router.get('/', protect, getLeaves);
router.post('/', protect, createLeaveValidator, validate, createLeave);

router.get('/:id', protect, getLeave);
router.patch('/:id/status', protect, authorize('admin'), reviewLeaveValidator, validate, reviewLeave);
router.delete('/:id', protect, cancelLeave);

module.exports = router;
