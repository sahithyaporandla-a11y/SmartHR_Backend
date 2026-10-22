const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: ['Normal', 'Important', 'Urgent'],
      default: 'Normal',
    },
    targetAudience: {
      type: String,
      enum: ['All', 'Admin', 'Employee'],
      default: 'All',
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
