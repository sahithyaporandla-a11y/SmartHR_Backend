/**
 * SmartHR Demo Data Seeder
 *
 * SAFE: Checks for existing data before inserting.
 * Will NOT overwrite existing records.
 *
 * Run: npm run seed
 *
 * Demo Credentials:
 * ─────────────────────────────────────────────
 * Role     │ Email                  │ Password
 * ─────────────────────────────────────────────
 * Admin    │ admin@smarthr.com      │ Admin@123
 * Employee │ john.doe@smarthr.com   │ Employee@123
 * Employee │ jane.smith@smarthr.com │ Employee@123
 * Employee │ alice.johnson@smarthr.com│Employee@123
 * Employee │ bob.wilson@smarthr.com │ Employee@123
 * ─────────────────────────────────────────────
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Employee = require('../src/models/Employee');
const Attendance = require('../src/models/Attendance');
const Leave = require('../src/models/Leave');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smarthr';

const generatePastDates = (daysBack) => {
  const dates = [];
  for (let i = daysBack; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    // Skip weekends
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) {
      dates.push(d);
    }
  }
  return dates;
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Check if data already exists
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    console.log(`⚠️  Database already has ${existingUsers} users. Seeder will not overwrite existing data.`);
    console.log('   To re-seed, drop the database first: use smarthr; db.dropDatabase()');
    await mongoose.disconnect();
    return;
  }

  console.log('🌱 Seeding demo data...');

  // ── 1. Create Admin ──────────────────────────────────────
  const adminUser = await User.create({
    email: 'admin@smarthr.com',
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
  });
  console.log('  ✓ Admin user created');

  // ── 2. Create Employees ───────────────────────────────────
  const employeesData = [
    {
      employeeId: 'EMP001',
      fullName: 'John Doe',
      email: 'john.doe@smarthr.com',
      phone: '+1-555-0101',
      department: 'Engineering',
      jobTitle: 'Senior Frontend Developer',
      employmentType: 'Full-time',
      joiningDate: new Date('2022-03-15'),
      status: 'Active',
    },
    {
      employeeId: 'EMP002',
      fullName: 'Jane Smith',
      email: 'jane.smith@smarthr.com',
      phone: '+1-555-0102',
      department: 'Product',
      jobTitle: 'Product Manager',
      employmentType: 'Full-time',
      joiningDate: new Date('2021-08-01'),
      status: 'Active',
    },
    {
      employeeId: 'EMP003',
      fullName: 'Alice Johnson',
      email: 'alice.johnson@smarthr.com',
      phone: '+1-555-0103',
      department: 'Design',
      jobTitle: 'UX Designer',
      employmentType: 'Full-time',
      joiningDate: new Date('2023-01-10'),
      status: 'Active',
    },
    {
      employeeId: 'EMP004',
      fullName: 'Bob Wilson',
      email: 'bob.wilson@smarthr.com',
      phone: '+1-555-0104',
      department: 'Engineering',
      jobTitle: 'Backend Developer',
      employmentType: 'Full-time',
      joiningDate: new Date('2022-11-20'),
      status: 'Active',
    },
    {
      employeeId: 'EMP005',
      fullName: 'Carol Martinez',
      email: 'carol.martinez@smarthr.com',
      phone: '+1-555-0105',
      department: 'Marketing',
      jobTitle: 'Marketing Specialist',
      employmentType: 'Full-time',
      joiningDate: new Date('2023-05-15'),
      status: 'Active',
    },
    {
      employeeId: 'EMP006',
      fullName: 'David Lee',
      email: 'david.lee@smarthr.com',
      phone: '+1-555-0106',
      department: 'Finance',
      jobTitle: 'Financial Analyst',
      employmentType: 'Full-time',
      joiningDate: new Date('2020-07-01'),
      status: 'Active',
    },
    {
      employeeId: 'EMP007',
      fullName: 'Eva Brown',
      email: 'eva.brown@smarthr.com',
      phone: '+1-555-0107',
      department: 'Human Resources',
      jobTitle: 'HR Coordinator',
      employmentType: 'Full-time',
      joiningDate: new Date('2021-03-22'),
      status: 'Active',
    },
    {
      employeeId: 'EMP008',
      fullName: 'Frank Garcia',
      email: 'frank.garcia@smarthr.com',
      phone: '+1-555-0108',
      department: 'Sales',
      jobTitle: 'Sales Representative',
      employmentType: 'Full-time',
      joiningDate: new Date('2023-09-01'),
      status: 'Active',
    },
    {
      employeeId: 'EMP009',
      fullName: 'Grace Chen',
      email: 'grace.chen@smarthr.com',
      phone: '+1-555-0109',
      department: 'Engineering',
      jobTitle: 'DevOps Engineer',
      employmentType: 'Full-time',
      joiningDate: new Date('2022-06-14'),
      status: 'Active',
    },
    {
      employeeId: 'EMP010',
      fullName: 'Henry Kim',
      email: 'henry.kim@smarthr.com',
      phone: '+1-555-0110',
      department: 'Customer Support',
      jobTitle: 'Support Specialist',
      employmentType: 'Part-time',
      joiningDate: new Date('2024-01-08'),
      status: 'Inactive',
    },
  ];

  const createdEmployees = [];
  const empUserEmails = ['john.doe@smarthr.com', 'jane.smith@smarthr.com', 'alice.johnson@smarthr.com', 'bob.wilson@smarthr.com'];

  for (const empData of employeesData) {
    const employee = await Employee.create(empData);
    createdEmployees.push(employee);

    // Create user accounts for the first 4 employees
    if (empUserEmails.includes(empData.email)) {
      const user = await User.create({
        email: empData.email,
        password: 'Employee@123',
        role: 'employee',
        employee: employee._id,
        isActive: true,
      });
      employee.user = user._id;
      await employee.save();
    }
  }

  // Set manager relationships
  const eng1 = createdEmployees[0]; // John
  const eng4 = createdEmployees[3]; // Bob — John is manager
  const eng9 = createdEmployees[8]; // Grace — John is manager
  eng4.manager = eng1._id;
  eng9.manager = eng1._id;
  await eng4.save();
  await eng9.save();

  console.log(`  ✓ ${createdEmployees.length} employees created`);

  // ── 3. Seed Attendance (last 14 working days) ─────────────
  const workingDates = generatePastDates(14);
  const activeEmployees = createdEmployees.filter((e) => e.status === 'Active');
  let attendanceCount = 0;

  for (const date of workingDates) {
    for (let i = 0; i < activeEmployees.length; i++) {
      const emp = activeEmployees[i];
      // Randomly absent 10% of the time
      if (Math.random() < 0.1) continue;

      const checkInHour = 8 + Math.floor(Math.random() * 2); // 8–9
      const checkInMin = Math.floor(Math.random() * 60);
      const checkIn = new Date(date);
      checkIn.setUTCHours(checkInHour, checkInMin, 0, 0);

      const workedHrs = 7 + Math.random() * 2; // 7–9 hrs
      const checkOut = new Date(checkIn.getTime() + workedHrs * 60 * 60 * 1000);

      const status = checkInHour >= 9 ? 'Late' : 'Present';

      try {
        await Attendance.create({
          employee: emp._id,
          date,
          checkIn,
          checkOut,
          workedHours: parseFloat(workedHrs.toFixed(2)),
          status,
        });
        attendanceCount++;
      } catch (e) {
        // Skip duplicates silently
      }
    }
  }
  console.log(`  ✓ ${attendanceCount} attendance records created`);

  // ── 4. Seed Leave Requests ────────────────────────────────
  const leavesData = [
    {
      employee: createdEmployees[0]._id,
      leaveType: 'Annual',
      startDate: new Date('2026-10-20'),
      endDate: new Date('2026-10-24'),
      reason: 'Family vacation planned in advance.',
      status: 'Pending',
    },
    {
      employee: createdEmployees[1]._id,
      leaveType: 'Sick',
      startDate: new Date('2026-10-10'),
      endDate: new Date('2026-10-11'),
      reason: 'Doctor appointment and recovery.',
      status: 'Approved',
      reviewedBy: adminUser._id,
      reviewedAt: new Date('2026-10-09'),
      reviewNotes: 'Approved. Get well soon.',
    },
    {
      employee: createdEmployees[2]._id,
      leaveType: 'Emergency',
      startDate: new Date('2026-10-16'),
      endDate: new Date('2026-10-17'),
      reason: 'Family emergency.',
      status: 'Pending',
    },
    {
      employee: createdEmployees[3]._id,
      leaveType: 'Annual',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-05'),
      reason: 'Annual leave.',
      status: 'Pending',
    },
    {
      employee: createdEmployees[4]._id,
      leaveType: 'Annual',
      startDate: new Date('2026-09-15'),
      endDate: new Date('2026-09-19'),
      reason: 'Personal travel.',
      status: 'Rejected',
      reviewedBy: adminUser._id,
      reviewedAt: new Date('2026-09-12'),
      reviewNotes: 'Critical project deadline during this period.',
    },
  ];

  for (const leaveData of leavesData) {
    const diff = Math.abs(leaveData.endDate - leaveData.startDate);
    const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    await Leave.create({ ...leaveData, totalDays });
  }
  console.log(`  ✓ ${leavesData.length} leave requests created`);

  console.log('\n✅ Seeding complete!\n');
  console.log('Demo Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ADMIN:    admin@smarthr.com        / Admin@123');
  console.log('  EMPLOYEE: john.doe@smarthr.com     / Employee@123');
  console.log('  EMPLOYEE: jane.smith@smarthr.com   / Employee@123');
  console.log('  EMPLOYEE: alice.johnson@smarthr.com/ Employee@123');
  console.log('  EMPLOYEE: bob.wilson@smarthr.com   / Employee@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seeder error:', err);
  process.exit(1);
});
