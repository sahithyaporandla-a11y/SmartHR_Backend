const Employee = require('../models/Employee');
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { createError } = require('../middleware/errorHandler');

// GET /api/employees
const getEmployees = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      department,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Role-based: employee can only see their own profile
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (!emp) return sendSuccess(res, [], 'No employee profile found.');
      return sendSuccess(res, [emp]);
    }

    // Search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) query.department = department;
    if (status) query.status = status;

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortDir };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('manager', 'fullName jobTitle')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    return sendPaginated(res, employees, total, page, limit);
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:id
const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).populate(
      'manager',
      'fullName jobTitle department'
    );

    if (!employee) {
      return sendError(res, 'Employee not found.', 404);
    }

    // Employee role: only own profile
    if (req.user.role === 'employee') {
      const myEmp = await Employee.findOne({ user: req.user._id });
      if (!myEmp || myEmp._id.toString() !== employee._id.toString()) {
        return sendError(res, 'Access forbidden.', 403);
      }
    }

    return sendSuccess(res, { employee });
  } catch (error) {
    next(error);
  }
};

// POST /api/employees
const createEmployee = async (req, res, next) => {
  try {
    const {
      employeeId, fullName, email, phone, department, jobTitle,
      employmentType, joiningDate, status, manager, profileImage,
      // User account fields
      password,
    } = req.body;

    // Check for duplicate
    const existing = await Employee.findOne({ $or: [{ email }, { employeeId }] });
    if (existing) {
      return sendError(res, 'An employee with this email or employee ID already exists.', 409);
    }

    // Create employee
    const employee = await Employee.create({
      employeeId, fullName, email, phone, department, jobTitle,
      employmentType, joiningDate, status, manager, profileImage,
    });

    // Create associated User account
    const userPassword = password || 'Employee@123';
    const user = await User.create({
      email,
      password: userPassword,
      role: 'employee',
      employee: employee._id,
    });

    // Link user back to employee
    employee.user = user._id;
    await employee.save();

    return sendSuccess(res, { employee }, 'Employee created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res, next) => {
  try {
    const {
      fullName, phone, department, jobTitle, employmentType,
      joiningDate, status, manager, profileImage,
    } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return sendError(res, 'Employee not found.', 404);
    }

    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { fullName, phone, department, jobTitle, employmentType, joiningDate, status, manager, profileImage },
      { new: true, runValidators: true }
    ).populate('manager', 'fullName jobTitle');

    // If deactivated, deactivate associated user account too
    if (status === 'Inactive' || status === 'Terminated') {
      await User.findOneAndUpdate({ employee: employee._id }, { isActive: false });
    } else if (status === 'Active') {
      await User.findOneAndUpdate({ employee: employee._id }, { isActive: true });
    }

    return sendSuccess(res, { employee: updated }, 'Employee updated successfully.');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/employees/:id/status
const updateEmployeeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Active', 'Inactive', 'On Leave', 'Terminated'];

    if (!validStatuses.includes(status)) {
      return sendError(res, 'Invalid status.', 400);
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!employee) {
      return sendError(res, 'Employee not found.', 404);
    }

    // Sync user account activation
    const isActive = status === 'Active';
    await User.findOneAndUpdate({ employee: employee._id }, { isActive });

    return sendSuccess(res, { employee }, `Employee status updated to ${status}.`);
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/meta/options
const getEmployeeOptions = async (req, res, next) => {
  try {
    const { DEPARTMENTS, EMPLOYMENT_TYPES, EMPLOYMENT_STATUS } = require('../models/Employee');
    return sendSuccess(res, { departments: DEPARTMENTS, employmentTypes: EMPLOYMENT_TYPES, statuses: EMPLOYMENT_STATUS });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, updateEmployeeStatus, getEmployeeOptions };
