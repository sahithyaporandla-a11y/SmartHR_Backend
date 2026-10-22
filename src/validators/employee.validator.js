const { body } = require('express-validator');
const { DEPARTMENTS, EMPLOYMENT_TYPES, EMPLOYMENT_STATUS } = require('../models/Employee');

const createEmployeeValidator = [
  body('employeeId').notEmpty().withMessage('Employee ID is required').trim(),
  body('fullName').notEmpty().withMessage('Full name is required').trim(),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('department')
    .notEmpty().withMessage('Department is required')
    .isIn(DEPARTMENTS).withMessage(`Department must be one of: ${DEPARTMENTS.join(', ')}`),
  body('jobTitle').notEmpty().withMessage('Job title is required').trim(),
  body('employmentType')
    .optional()
    .isIn(EMPLOYMENT_TYPES).withMessage(`Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}`),
  body('joiningDate')
    .notEmpty().withMessage('Joining date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(EMPLOYMENT_STATUS).withMessage(`Status must be one of: ${EMPLOYMENT_STATUS.join(', ')}`),
];

const updateEmployeeValidator = [
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty').trim(),
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('department')
    .optional()
    .isIn(DEPARTMENTS).withMessage(`Invalid department`),
  body('jobTitle').optional().notEmpty().withMessage('Job title cannot be empty').trim(),
  body('employmentType')
    .optional()
    .isIn(EMPLOYMENT_TYPES).withMessage(`Invalid employment type`),
  body('joiningDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(EMPLOYMENT_STATUS).withMessage(`Invalid status`),
];

module.exports = { createEmployeeValidator, updateEmployeeValidator };
