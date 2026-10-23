/**
 * SIES GST CSE-IoT LED Display Management System
 * Activity & Audit History Controller
 */

const ActivityLog = require('../models/ActivityLog');

/**
 * GET /api/activity
 * Retrieve the persistent audit trail of display modifications
 */
async function getActivity(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActivity
};
