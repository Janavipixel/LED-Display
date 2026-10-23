/**
 * SIES GST CSE-IoT LED Display Management System
 * Hardware & ESP32 Integration Routes
 */

const express = require('express');
const {
  getHardwareDisplay,
  recordHardwarePing,
  getHardwareStatus
} = require('../controllers/hardwareController');
const { optionalHardwareAuth } = require('../middleware/auth');

const router = express.Router();

// Retrieve announcements formatted for microcontroller / ESP32
router.get('/display', optionalHardwareAuth, getHardwareDisplay);

// ESP32 Heartbeat Telemetry Ping
router.post('/ping', optionalHardwareAuth, recordHardwarePing);

// Check hardware online / connection status
router.get('/status', getHardwareStatus);

module.exports = router;
