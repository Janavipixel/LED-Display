/**
 * SIES GST CSE-IoT LED Display Management System
 * Hardware Integration Controller (ESP32 & LED Matrix)
 */

const Announcement = require('../models/Announcement');
const { HARDWARE_STATUS } = require('../config/constants');

// In-memory hardware telemetry state (updated when physical/simulated ESP32 pings)
let hardwareState = {
  lastSeen: null,
  deviceId: null,
  ip: null,
  rssi: null,
  uptime: null,
  firmware: null
};

/**
 * GET /api/hardware/display
 * Stable endpoint for ESP32 and preview simulator to fetch active announcements.
 * Returns a lightweight, high-performance JSON structure optimized for ArduinoJson on ESP32.
 */
async function getHardwareDisplay(req, res, next) {
  try {
    const activeMessages = await Announcement.find({ status: 'active' })
      .sort({ displayOrder: 1, createdAt: 1 })
      .select('_id text effect duration displayOrder updatedAt');

    // Format for microcontroller ingestion (compact, low memory overhead)
    const formattedMessages = activeMessages.map(msg => ({
      id: msg._id.toString(),
      text: msg.text,
      effect: msg.effect,
      duration: msg.duration,
      order: msg.displayOrder,
      updatedAt: msg.updatedAt ? msg.updatedAt.getTime() : Date.now()
    }));

    res.status(200).json({
      success: true,
      count: formattedMessages.length,
      timestamp: Date.now(),
      refreshInterval: 30, // Recommended polling interval in seconds for ESP32
      messages: formattedMessages
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/hardware/ping
 * Heartbeat endpoint for physical ESP32 to announce connectivity, Wi-Fi RSSI and health
 */
async function recordHardwarePing(req, res, next) {
  try {
    const { deviceId, ip, rssi, uptime, firmware } = req.body || {};

    hardwareState = {
      lastSeen: new Date(),
      deviceId: deviceId || 'ESP32_MATRIX_01',
      ip: ip || req.ip || req.connection.remoteAddress,
      rssi: typeof rssi === 'number' ? rssi : null,
      uptime: typeof uptime === 'number' ? uptime : null,
      firmware: firmware || 'v1.0.0-sies'
    };

    res.status(200).json({
      success: true,
      message: 'Hardware heartbeat acknowledged',
      serverTime: Date.now(),
      status: 'ONLINE'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/hardware/status
 * Returns real hardware connectivity status based on recent heartbeat
 */
async function getHardwareStatus(req, res, next) {
  try {
    const now = Date.now();
    const isConnected = !!(
      hardwareState.lastSeen &&
      now - new Date(hardwareState.lastSeen).getTime() < HARDWARE_STATUS.ONLINE_TIMEOUT_MS
    );

    res.status(200).json({
      success: true,
      hardware: {
        isConnected,
        statusText: isConnected ? 'ONLINE (ESP32 Connected)' : 'STANDBY (Hardware Not Connected)',
        lastSeen: hardwareState.lastSeen,
        deviceId: hardwareState.deviceId,
        ip: hardwareState.ip,
        rssi: hardwareState.rssi,
        uptime: hardwareState.uptime,
        firmware: hardwareState.firmware
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHardwareDisplay,
  recordHardwarePing,
  getHardwareStatus,
  // Exported for testing/inspection
  _resetHardwareState: () => {
    hardwareState = {
      lastSeen: null,
      deviceId: null,
      ip: null,
      rssi: null,
      uptime: null,
      firmware: null
    };
  }
};
