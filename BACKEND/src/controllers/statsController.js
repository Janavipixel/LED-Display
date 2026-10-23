/**
 * SIES GST CSE-IoT LED Display Management System
 * System Statistics Controller
 */

const Announcement = require('../models/Announcement');
const ActivityLog = require('../models/ActivityLog');
const { getHardwareStatus } = require('./hardwareController');

/**
 * GET /api/stats
 * Returns live, database-backed statistics for the dashboard
 */
async function getStats(req, res, next) {
  try {
    const [totalMessages, activeMessages, queuedMessages, totalActivity] = await Promise.all([
      Announcement.countDocuments(),
      Announcement.countDocuments({ status: 'active' }),
      Announcement.countDocuments({ status: { $in: ['queued', 'inactive'] } }),
      ActivityLog.countDocuments()
    ]);

    // Retrieve current hardware connection status
    let hardwareStatus = { isConnected: false, statusText: 'STANDBY (Hardware Not Connected)' };
    try {
      // Mock req/res to reuse hardware controller helper
      const fakeRes = {
        status: () => ({
          json: (data) => { hardwareStatus = data.hardware; }
        })
      };
      await getHardwareStatus({}, fakeRes, () => {});
    } catch (_) {}

    res.status(200).json({
      success: true,
      stats: {
        totalMessages,
        activeMessages,
        queuedMessages,
        recordedChanges: totalActivity,
        hardware: hardwareStatus
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats
};
