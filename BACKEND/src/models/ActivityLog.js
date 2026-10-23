/**
 * SIES GST CSE-IoT LED Display Management System
 * Activity / Audit Log Data Model
 */

const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../config/constants');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: Object.values(AUDIT_ACTIONS)
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcement',
      default: null
    },
    messageText: {
      type: String,
      default: ''
    },
    effect: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      default: ''
    },
    details: {
      type: String,
      default: ''
    },
    actor: {
      type: String,
      default: 'SIES GST Admin'
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
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
    }
  }
);

activityLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
