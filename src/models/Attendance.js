const mongoose = require('mongoose');

/**
 * Attendance Model
 *
 * Timezone: All dates/times are stored in UTC.
 * "Present today" is determined by comparing check-in date (UTC) with the current UTC date.
 * If a check-out is missing, the employee is still counted as present for that day.
 * Approved leave days do NOT count as attendance records — they are tracked in the Leave model.
 */
const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    // Worked hours computed from checkIn/checkOut; null if check-out missing
    workedHours: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'],
      default: 'Present',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance records per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
