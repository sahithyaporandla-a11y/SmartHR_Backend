const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: Number, // 1–12
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    // Earnings
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: {
      housing: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    bonus: { type: Number, default: 0 },
    // Deductions
    deductions: {
      tax: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    leaveDaysDeducted: { type: Number, default: 0 },
    // Computed
    grossSalary: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    // Meta
    status: {
      type: String,
      enum: ['Draft', 'Processed', 'Paid'],
      default: 'Draft',
    },
    paymentDate: { type: Date },
    notes: { type: String, maxlength: 500 },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Unique per employee per month/year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Auto-calculate totals before save
payrollSchema.pre('save', function (next) {
  const a = this.allowances;
  const d = this.deductions;
  const totalAllowances = (a.housing || 0) + (a.transport || 0) + (a.medical || 0) + (a.other || 0);
  this.grossSalary = this.basicSalary + totalAllowances + (this.bonus || 0);
  this.totalDeductions = (d.tax || 0) + (d.insurance || 0) + (d.other || 0);
  // Deduct unpaid leave days proportionally (basic / 30 * days)
  const perDayRate = this.basicSalary / 30;
  this.totalDeductions += perDayRate * (this.leaveDaysDeducted || 0);
  this.netSalary = this.grossSalary - this.totalDeductions;
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema);
