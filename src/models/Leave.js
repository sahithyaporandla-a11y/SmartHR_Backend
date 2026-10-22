const mongoose = require('mongoose');

const LEAVE_TYPES = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid', 'Emergency', 'Other'];
const LEAVE_STATUS = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    leaveType: {
      type: String,
      enum: LEAVE_TYPES,
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    // Number of working days (calculated, not user-provided)
    totalDays: {
      type: Number,
      min: 0,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: LEAVE_STATUS,
      default: 'Pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });

// Calculate total days before save
leaveSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
module.exports.LEAVE_TYPES = LEAVE_TYPES;
module.exports.LEAVE_STATUS = LEAVE_STATUS;
