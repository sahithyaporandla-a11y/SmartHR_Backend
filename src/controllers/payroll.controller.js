const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');


// GET /api/payroll — list payrolls (admin: all, employee: own)
const getPayrolls = async (req, res, next) => {
  try {
    const { month, year, status, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (req.user.role !== 'admin') {
      // Employee sees only their own
      const emp = await Employee.findOne({ user: req.user._id });
      if (!emp) return sendSuccess(res, [], 'No payroll records.');
      filter.employee = emp._id;
    } else if (req.query.employee) {
      filter.employee = req.query.employee;
    }

    if (month) filter.month = parseInt(month);
    if (year)  filter.year  = parseInt(year);
    if (status) filter.status = status;

    const total = await Payroll.countDocuments(filter);
    const payrolls = await Payroll.find(filter)
      .populate('employee', 'fullName employeeId department jobTitle')
      .populate('processedBy', 'email')
      .sort({ year: -1, month: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return sendPaginated(res, payrolls, total, page, limit, 'Payrolls retrieved.');

  } catch (error) { next(error); }
};

// GET /api/payroll/:id
const getPayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'fullName employeeId department jobTitle email phone joiningDate')
      .populate('processedBy', 'email');
    if (!payroll) return sendError(res, 'Payroll record not found.', 404);
    return sendSuccess(res, payroll, 'Payroll retrieved.');
  } catch (error) { next(error); }
};

// POST /api/payroll — create (admin only)
const createPayroll = async (req, res, next) => {
  try {
    const existing = await Payroll.findOne({
      employee: req.body.employee,
      month: req.body.month,
      year: req.body.year,
    });
    if (existing) return sendError(res, 'Payroll for this employee/month already exists.', 409);

    const payroll = new Payroll({ ...req.body, processedBy: req.user._id });
    await payroll.save();
    await payroll.populate('employee', 'fullName employeeId department jobTitle');
    return sendSuccess(res, payroll, 'Payroll created.', 201);
  } catch (error) { next(error); }
};

// PUT /api/payroll/:id — update (admin only)
const updatePayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { ...req.body, processedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('employee', 'fullName employeeId department jobTitle');
    if (!payroll) return sendError(res, 'Payroll record not found.', 404);
    return sendSuccess(res, payroll, 'Payroll updated.');
  } catch (error) { next(error); }
};

// PATCH /api/payroll/:id/status — mark as Paid
const updatePayrollStatus = async (req, res, next) => {
  try {
    const { status, paymentDate } = req.body;
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status, paymentDate: paymentDate || new Date() },
      { new: true }
    ).populate('employee', 'fullName employeeId');
    if (!payroll) return sendError(res, 'Payroll not found.', 404);
    return sendSuccess(res, payroll, `Payroll marked as ${status}.`);
  } catch (error) { next(error); }
};

// GET /api/payroll/summary — aggregate stats (admin)
const getPayrollSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year)  filter.year  = parseInt(year);

    const summary = await Payroll.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalGross:      { $sum: '$grossSalary' },
          totalNet:        { $sum: '$netSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalBonus:      { $sum: '$bonus' },
          count:           { $sum: 1 },
          paid:            { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] } },
          draft:           { $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] } },
        },
      },
    ]);

    return sendSuccess(res, summary[0] || {}, 'Payroll summary retrieved.');
  } catch (error) { next(error); }
};

module.exports = { getPayrolls, getPayroll, createPayroll, updatePayroll, updatePayrollStatus, getPayrollSummary };
