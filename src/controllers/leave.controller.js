const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

// GET /api/leaves
const getLeaves = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, employeeId, leaveType } = req.query;
    const query = {};

    // Employee: only own leave requests
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (!emp) return sendSuccess(res, [], 'No employee profile found.');
      query.employee = emp._id;
    } else {
      if (employeeId) query.employee = employeeId;
    }

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate('employee', 'fullName employeeId department profileImage')
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return sendPaginated(res, leaves, total, page, limit);
  } catch (error) {
    next(error);
  }
};

// GET /api/leaves/:id
const getLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employee', 'fullName employeeId department profileImage')
      .populate('reviewedBy', 'email');

    if (!leave) return sendError(res, 'Leave request not found.', 404);

    // Employee: only own
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (!emp || leave.employee._id.toString() !== emp._id.toString()) {
        return sendError(res, 'Access forbidden.', 403);
      }
    }

    return sendSuccess(res, { leave });
  } catch (error) {
    next(error);
  }
};

// POST /api/leaves
const createLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    // Get employee profile
    const emp = await Employee.findOne({ user: req.user._id });
    if (!emp) return sendError(res, 'Employee profile not found.', 404);

    // Check for overlapping pending/approved leaves
    const overlap = await Leave.findOne({
      employee: emp._id,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
      ],
    });

    if (overlap) {
      return sendError(res, 'You have an overlapping leave request for this period.', 409);
    }

    const leave = await Leave.create({
      employee: emp._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    });

    return sendSuccess(res, { leave }, 'Leave request submitted successfully.', 201);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/leaves/:id/status  (admin only)
const reviewLeave = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) return sendError(res, 'Leave request not found.', 404);

    if (leave.status !== 'Pending') {
      return sendError(res, 'This leave request has already been reviewed.', 400);
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewNotes = reviewNotes || '';
    await leave.save();

    const populated = await leave.populate('employee', 'fullName department');
    return sendSuccess(res, { leave: populated }, `Leave request ${status.toLowerCase()}.`);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/leaves/:id (cancel own pending request)
const cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return sendError(res, 'Leave request not found.', 404);

    const emp = await Employee.findOne({ user: req.user._id });
    if (!emp || leave.employee.toString() !== emp._id.toString()) {
      return sendError(res, 'Access forbidden.', 403);
    }

    if (leave.status !== 'Pending') {
      return sendError(res, 'Only pending requests can be cancelled.', 400);
    }

    leave.status = 'Cancelled';
    await leave.save();

    return sendSuccess(res, {}, 'Leave request cancelled.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeaves, getLeave, createLeave, reviewLeave, cancelLeave };
