/**
 * SIES GST CSE-IoT LED Display Management System
 * Health Check Routes
 */

const express = require('express');
const { getConnectionStatus } = require('../config/db');

const router = express.Router();

/**
 * GET /api/health
 * Returns service status, uptime and database health
 */
router.get('/', (req, res) => {
  const isDbHealthy = getConnectionStatus();

  res.status(200).json({
    success: true,
    status: isDbHealthy ? 'healthy' : 'degraded',
    service: 'SIES GST CSE-IoT LED Display Management API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: isDbHealthy,
      status: isDbHealthy ? 'CONNECTED' : 'DISCONNECTED'
    }
  });
});

module.exports = router;
