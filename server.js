require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const { errorHandler } = require('./src/middleware/errorHandler');
const { sendError } = require('./src/utils/apiResponse');

// Route imports
const authRoutes        = require('./src/routes/auth.routes');
const dashboardRoutes   = require('./src/routes/dashboard.routes');
const employeeRoutes    = require('./src/routes/employee.routes');
const attendanceRoutes  = require('./src/routes/attendance.routes');
const leaveRoutes       = require('./src/routes/leave.routes');
const payrollRoutes     = require('./src/routes/payroll.routes');
const announcementRoutes = require('./src/routes/announcement.routes');

const app = express();

// Connect to MongoDB
connectDB();

// Security & utility middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Mount routes
app.use('/api/auth',          authRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/employees',     employeeRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/leaves',        leaveRoutes);
app.use('/api/payroll',       payrollRoutes);
app.use('/api/announcements', announcementRoutes);

// 404 handler
app.use((req, res) => {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found.`, 404);
});

// Centralized error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SmartHR API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
