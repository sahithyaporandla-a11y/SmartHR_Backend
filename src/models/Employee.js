const mongoose = require('mongoose');

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Finance',
  'Human Resources',
  'Operations',
  'Legal',
  'Customer Support',
];

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'];
const EMPLOYMENT_STATUS = ['Active', 'Inactive', 'On Leave', 'Terminated'];

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: DEPARTMENTS,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    employmentType: {
      type: String,
      enum: EMPLOYMENT_TYPES,
      default: 'Full-time',
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    status: {
      type: String,
      enum: EMPLOYMENT_STATUS,
      default: 'Active',
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    profileImage: {
      type: String,
      default: '',
    },
    // Back-reference to User account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Indexes for efficient searching
employeeSchema.index({ fullName: 'text', email: 'text', employeeId: 'text' });
employeeSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
module.exports.DEPARTMENTS = DEPARTMENTS;
module.exports.EMPLOYMENT_TYPES = EMPLOYMENT_TYPES;
module.exports.EMPLOYMENT_STATUS = EMPLOYMENT_STATUS;
