/**
 * SIES GST CSE-IoT LED Display Management System
 * Announcement Data Model
 */

const mongoose = require('mongoose');
const { ALLOWED_EFFECTS, ALLOWED_STATUS, MESSAGE_LIMITS } = require('../config/constants');

const announcementSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      minlength: [MESSAGE_LIMITS.MIN_LENGTH, `Message cannot be empty`],
      maxlength: [MESSAGE_LIMITS.MAX_LENGTH, `Message text cannot exceed ${MESSAGE_LIMITS.MAX_LENGTH} characters`]
    },
    effect: {
      type: String,
      required: [true, 'Display effect is required'],
      enum: {
        values: ALLOWED_EFFECTS,
        message: 'Unsupported display effect. Allowed effects: {VALUES}'
      },
      default: 'scroll-left'
    },
    duration: {
      type: Number,
      required: [true, 'Display duration is required'],
      min: [MESSAGE_LIMITS.MIN_DURATION, `Duration must be at least ${MESSAGE_LIMITS.MIN_DURATION} seconds`],
      max: [MESSAGE_LIMITS.MAX_DURATION, `Duration cannot exceed ${MESSAGE_LIMITS.MAX_DURATION} seconds`],
      default: MESSAGE_LIMITS.DEFAULT_DURATION
    },
    status: {
      type: String,
      enum: {
        values: ALLOWED_STATUS,
        message: 'Invalid status. Allowed values: {VALUES}'
      },
      default: 'active'
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      }
    }
  }
);

// Index to quickly fetch active messages in order
announcementSchema.index({ status: 1, displayOrder: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
