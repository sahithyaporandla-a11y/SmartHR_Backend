const express = require('express');
const router = express.Router();
const {
  getEmployees, getEmployee, createEmployee, updateEmployee,
  updateEmployeeStatus, getEmployeeOptions,
} = require('../controllers/employee.controller');
const { protect, authorize } = require('../middleware/auth');
const { createEmployeeValidator, updateEmployeeValidator } = require('../validators/employee.validator');
const validate = require('../middleware/validate');

router.get('/meta/options', protect, getEmployeeOptions);

router.get('/', protect, getEmployees);
router.post('/', protect, authorize('admin'), createEmployeeValidator, validate, createEmployee);

router.get('/:id', protect, getEmployee);
router.put('/:id', protect, authorize('admin'), updateEmployeeValidator, validate, updateEmployee);
router.patch('/:id/status', protect, authorize('admin'), updateEmployeeStatus);

module.exports = router;
