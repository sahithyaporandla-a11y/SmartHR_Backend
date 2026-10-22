const Announcement = require('../models/Announcement');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/announcements
const getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, priority } = req.query;
    const filter = { isActive: true };

    // Filter by audience
    if (req.user.role === 'employee') {
      filter.targetAudience = { $in: ['All', 'Employee'] };
    }
    if (priority) filter.priority = priority;

    // Filter out expired
    filter.$or = [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }];

    const total = await Announcement.countDocuments(filter);
    const announcements = await Announcement.find(filter)
      .populate('postedBy', 'email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return sendSuccess(res, announcements, 'Announcements retrieved.', 200, {
      total, page: parseInt(page), pages: Math.ceil(total / limit),
    });
  } catch (error) { next(error); }
};

// POST /api/announcements (admin only)
const createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      postedBy: req.user._id,
    });
    return sendSuccess(res, announcement, 'Announcement created.', 201);
  } catch (error) { next(error); }
};

// PUT /api/announcements/:id (admin only)
const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!announcement) return sendError(res, 'Announcement not found.', 404);
    return sendSuccess(res, announcement, 'Announcement updated.');
  } catch (error) { next(error); }
};

// DELETE /api/announcements/:id (admin only)
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!announcement) return sendError(res, 'Announcement not found.', 404);
    return sendSuccess(res, {}, 'Announcement removed.');
  } catch (error) { next(error); }
};

module.exports = { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
