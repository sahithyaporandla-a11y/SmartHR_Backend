const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

// GET /api/attendance
const getAttendance = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, employeeId, date, startDate, endDate, status } = req.query;

    const query = {};

    // Employee can only see own attendance
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (!emp) return sendSuccess(res, [], 'No employee profile found.');
      query.employee = emp._id;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    // Date filters
    if (date) {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      const dEnd = new Date(date);
      dEnd.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: d, $lte: dEnd };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate('employee', 'fullName employeeId department profileImage')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return sendPaginated(res, records, total, page, limit);
  } catch (error) {
    next(error);
  }
};

// POST /api/attendance/check-in
const checkIn = async (req, res, next) => {
  try {
    const emp = await Employee.findOne({ user: req.user._id });
    if (!emp) return sendError(res, 'Employee profile not found.', 404);

    const now = new Date();
    // Build today's date at local midnight (avoids UTC offset issues)
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Prevent duplicate check-in
    const existing = await Attendance.findOne({ employee: emp._id, date: dateOnly });
    if (existing) {
      return sendError(res, 'You have already checked in today.', 409);
    }

    // Determine if late (after 09:00 UTC)
    const hour = now.getUTCHours();
    const status = hour >= 9 ? 'Late' : 'Present';

    const record = await Attendance.create({
      employee: emp._id,
      date: dateOnly,
      checkIn: now,
      status,
    });

    return sendSuccess(res, { record }, 'Check-in recorded.', 201);
  } catch (error) {
    next(error);
  }
};

// POST /api/attendance/check-out
const checkOut = async (req, res, next) => {
  try {
    const emp = await Employee.findOne({ user: req.user._id });
    if (!emp) return sendError(res, 'Employee profile not found.', 404);

    const now = new Date();
    // Build today's date at local midnight (avoids UTC offset issues)
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const record = await Attendance.findOne({ employee: emp._id, date: dateOnly });
    if (!record) {
      return sendError(res, 'No check-in found for today.', 400);
    }
    if (record.checkOut) {
      return sendError(res, 'You have already checked out today.', 409);
    }

    record.checkOut = now;
    const diffMs = now - record.checkIn;
    record.workedHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    if (record.workedHours < 4) record.status = 'Half Day';
    await record.save();

    return sendSuccess(res, { record }, 'Check-out recorded.');
  } catch (error) {
    next(error);
  }
};

// POST /api/attendance (admin — manually create a record)
const createAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, notes } = req.body;

    const d = new Date(date);
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let workedHours;
    if (checkIn && checkOut) {
      const diff = new Date(checkOut) - new Date(checkIn);
      workedHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
    }

    const record = await Attendance.create({
      employee: employeeId,
      date: dateOnly,
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
      workedHours,
      status: status || 'Present',
      notes,
    });

    const populated = await record.populate('employee', 'fullName employeeId department');
    return sendSuccess(res, { record: populated }, 'Attendance record created.', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAttendance, checkIn, checkOut, createAttendance };
