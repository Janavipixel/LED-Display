/**
 * SIES GST CSE-IoT LED Display Management System
 * Announcement / Message Controller
 */

const Announcement = require('../models/Announcement');
const ActivityLog = require('../models/ActivityLog');
const { AUDIT_ACTIONS } = require('../config/constants');

/**
 * GET /api/messages
 * Retrieve all announcements (optionally filtered by status)
 */
async function getMessages(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status.toLowerCase();
    }

    const announcements = await Announcement.find(filter)
      .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/messages/:id
 * Retrieve a single announcement by ID
 */
async function getMessageById(req, res, next) {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: `Announcement with ID '${req.params.id}' not found`
      });
    }

    res.status(200).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/messages
 * Create a new announcement
 */
async function createMessage(req, res, next) {
  try {
    const payload = req.sanitizedAnnouncement;

    // If displayOrder not specified, set it to the next available order
    if (payload.displayOrder === 0) {
      const highestOrderDoc = await Announcement.findOne().sort({ displayOrder: -1 });
      payload.displayOrder = highestOrderDoc ? highestOrderDoc.displayOrder + 1 : 1;
    }

    const newAnnouncement = new Announcement(payload);
    await newAnnouncement.save();

    // Log the creation activity
    await ActivityLog.create({
      action: AUDIT_ACTIONS.CREATED,
      messageId: newAnnouncement._id,
      messageText: newAnnouncement.text,
      effect: newAnnouncement.effect,
      status: newAnnouncement.status,
      actor: req.user ? req.user.email : 'SIES GST Admin',
      details: `Created announcement with effect '${newAnnouncement.effect}' (${newAnnouncement.duration}s)`
    }).catch(err => console.error('[ActivityLog] Could not log creation:', err.message));

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: newAnnouncement
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/messages/:id
 * Update an existing announcement
 */
async function updateMessage(req, res, next) {
  try {
    const { id } = req.params;
    const payload = req.sanitizedAnnouncement;

    const existing = await Announcement.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Announcement with ID '${id}' not found`
      });
    }

    // Apply updates
    existing.text = payload.text;
    existing.effect = payload.effect;
    existing.duration = payload.duration;
    if (payload.status) {
      existing.status = payload.status;
    }
    if (typeof payload.displayOrder === 'number') {
      existing.displayOrder = payload.displayOrder;
    }

    await existing.save();

    // Log the update activity
    await ActivityLog.create({
      action: AUDIT_ACTIONS.UPDATED,
      messageId: existing._id,
      messageText: existing.text,
      effect: existing.effect,
      status: existing.status,
      actor: req.user ? req.user.email : 'SIES GST Admin',
      details: `Updated announcement: "${existing.text.substring(0, 30)}..."`
    }).catch(err => console.error('[ActivityLog] Could not log update:', err.message));

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: existing
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/messages/:id
 * Delete an announcement permanently
 */
async function deleteMessage(req, res, next) {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: `Announcement with ID '${id}' not found`
      });
    }

    await Announcement.findByIdAndDelete(id);

    // Log the deletion activity
    await ActivityLog.create({
      action: AUDIT_ACTIONS.DELETED,
      messageId: announcement._id,
      messageText: announcement.text,
      effect: announcement.effect,
      status: 'removed',
      actor: req.user ? req.user.email : 'SIES GST Admin',
      details: `Deleted announcement: "${announcement.text.substring(0, 30)}..."`
    }).catch(err => console.error('[ActivityLog] Could not log deletion:', err.message));

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
      data: announcement
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage
};
