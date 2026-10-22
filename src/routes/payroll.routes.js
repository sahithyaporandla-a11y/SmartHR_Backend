const express = require('express');
const router = express.Router();
const {
  getPayrolls, getPayroll, createPayroll, updatePayroll,
  updatePayrollStatus, getPayrollSummary,
} = require('../controllers/payroll.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/summary', authorize('admin'), getPayrollSummary);
router.get('/', getPayrolls);
router.get('/:id', getPayroll);
router.post('/', authorize('admin'), createPayroll);
router.put('/:id', authorize('admin'), updatePayroll);
router.patch('/:id/status', authorize('admin'), updatePayrollStatus);

module.exports = router;
