const { body } = require('express-validator');
const { LEAVE_TYPES } = require('../models/Leave');

const createLeaveValidator = [
  body('leaveType')
    .notEmpty().withMessage('Leave type is required')
    .isIn(LEAVE_TYPES).withMessage(`Leave type must be one of: ${LEAVE_TYPES.join(', ')}`),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid start date format'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
];

const reviewLeaveValidator = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Approved', 'Rejected']).withMessage('Status must be Approved or Rejected'),
  body('reviewNotes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

module.exports = { createLeaveValidator, reviewLeaveValidator };
