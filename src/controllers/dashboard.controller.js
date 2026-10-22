const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/dashboard/stats
const getStats = async (req, res, next) => {
  try {
    // --- Employee stats ---
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });

    // --- Today's attendance (UTC date range) ---
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const presentToday = await Attendance.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['Present', 'Late', 'Half Day'] },
    });

    // --- Pending leave requests ---
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    // --- Department-wise distribution ---
    const departmentStats = await Employee.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // --- Attendance trend (last 7 days) ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const attendanceTrend = await Attendance.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['Present', 'Late', 'Half Day']] }, 1, 0],
            },
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
          },
          onLeave: {
            $sum: { $cond: [{ $eq: ['$status', 'On Leave'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // --- Recent employees (last 5) ---
    const recentEmployees = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName department jobTitle status profileImage createdAt');

    // --- Recent leave requests (last 5) ---
    const recentLeaves = await Leave.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employee', 'fullName department profileImage');

    return sendSuccess(res, {
      stats: {
        totalEmployees,
        activeEmployees,
        presentToday,
        pendingLeaves,
        attendanceRate: activeEmployees > 0
          ? Math.round((presentToday / activeEmployees) * 100)
          : 0,
      },
      departmentStats: departmentStats.map((d) => ({
        department: d._id,
        count: d.count,
      })),
      attendanceTrend,
      recentEmployees,
      recentLeaves,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
