/**
 * SIES GST CSE-IoT LED Display Management System
 * Authentication & Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Middleware to protect administrative routes using JWT Bearer tokens
 */
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing or malformed Bearer token.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.'
    });
  }
}

/**
 * Middleware for future ESP32 hardware authentication
 * Can be relaxed or enforced via BACKEND/.env HARDWARE_API_KEY
 */
function optionalHardwareAuth(req, res, next) {
  if (!env.hardwareApiKey) {
    return next();
  }

  const clientKey = req.headers['x-hardware-token'] || req.query.api_key;
  if (clientKey && clientKey === env.hardwareApiKey) {
    req.isHardwareAuthenticated = true;
  }
  next();
}

module.exports = {
  requireAdminAuth,
  optionalHardwareAuth
};
