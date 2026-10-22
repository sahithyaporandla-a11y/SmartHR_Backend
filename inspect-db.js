/**
 * SmartHR — Database Inspector
 * Run: node inspect-db.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smarthr';

async function inspect() {
  await mongoose.connect(MONGO_URI);
  console.log('\n✅ Connected to MongoDB:', MONGO_URI);
  console.log('📦 Database: smarthr\n');

  const db = mongoose.connection.db;

  // List all collections
  const collections = await db.listCollections().toArray();
  console.log('📂 Collections found:', collections.map(c => c.name).join(', '), '\n');

  // Count documents in each
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  📋 ${col.name.padEnd(15)} → ${count} documents`);
  }

  console.log('\n--- USERS ---');
  const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
  users.forEach(u => console.log(`  [${u.role.toUpperCase()}] ${u.email} | active: ${u.isActive}`));

  console.log('\n--- EMPLOYEES ---');
  const employees = await db.collection('employees').find({}).toArray();
  employees.forEach(e => console.log(`  ${e.employeeId} | ${e.fullName.padEnd(20)} | ${e.department.padEnd(18)} | ${e.status}`));

  console.log('\n--- LEAVE REQUESTS ---');
  const leaves = await db.collection('leaves').find({}).toArray();
  leaves.forEach(l => console.log(`  ${l.leaveType.padEnd(12)} | ${l.status.padEnd(10)} | ${String(l.totalDays).padEnd(3)} days | ${l.reason.slice(0, 40)}`));

  console.log('\n--- ATTENDANCE SUMMARY ---');
  const attendances = await db.collection('attendances').find({}).toArray();
  const statusCount = attendances.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  Object.entries(statusCount).forEach(([s, c]) => console.log(`  ${s.padEnd(12)}: ${c} records`));

  console.log('\n✅ Inspection complete!\n');
  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
