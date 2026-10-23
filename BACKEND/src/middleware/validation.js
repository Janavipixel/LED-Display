/**
 * SIES GST CSE-IoT LED Display Management System
 * Request Validation & Sanitization Middleware
 */

const mongoose = require('mongoose');
const { ALLOWED_EFFECTS, ALLOWED_STATUS, MESSAGE_LIMITS } = require('../config/constants');

/**
 * Validates MongoDB ObjectId in route parameters (:id)
 */
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid announcement ID format. Expected 24-character hex ObjectId, got '${id}'`
      });
    }
    next();
  };
}

/**
 * Validates Announcement payload for POST and PUT
 */
function validateAnnouncement(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Request body must be a valid JSON object'
    });
  }

  // Accept either 'text' or 'message' for maximum frontend compatibility
  const rawText = body.text !== undefined ? body.text : body.message;

  if (rawText === undefined || rawText === null) {
    return res.status(400).json({
      success: false,
      error: 'Announcement text is required'
    });
  }

  if (typeof rawText !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Announcement text must be a string'
    });
  }

  const trimmedText = rawText.trim();

  if (trimmedText.length < MESSAGE_LIMITS.MIN_LENGTH) {
    return res.status(400).json({
      success: false,
      error: 'Announcement text cannot be empty or whitespace only'
    });
  }

  if (trimmedText.length > MESSAGE_LIMITS.MAX_LENGTH) {
    return res.status(400).json({
      success: false,
      error: `Announcement text cannot exceed ${MESSAGE_LIMITS.MAX_LENGTH} characters (current: ${trimmedText.length})`
    });
  }

  // Validate effect
  const effect = body.effect;
  if (!effect) {
    return res.status(400).json({
      success: false,
      error: `Display effect is required. Allowed values: ${ALLOWED_EFFECTS.join(', ')}`
    });
  }

  if (!ALLOWED_EFFECTS.includes(effect)) {
    return res.status(400).json({
      success: false,
      error: `Unsupported display effect '${effect}'. Allowed values: ${ALLOWED_EFFECTS.join(', ')}`
    });
  }

  // Validate duration
  const duration = Number(body.duration);
  if (isNaN(duration) || duration < MESSAGE_LIMITS.MIN_DURATION || duration > MESSAGE_LIMITS.MAX_DURATION) {
    return res.status(400).json({
      success: false,
      error: `Display duration must be a number between ${MESSAGE_LIMITS.MIN_DURATION} and ${MESSAGE_LIMITS.MAX_DURATION} seconds`
    });
  }

  // Validate status if provided
  let status = body.status ? body.status.toLowerCase() : 'active';
  if (body.status && !ALLOWED_STATUS.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status '${body.status}'. Allowed values: ${ALLOWED_STATUS.join(', ')}`
    });
  }

  // Normalize sanitized payload
  req.sanitizedAnnouncement = {
    text: trimmedText,
    effect,
    duration,
    status,
    displayOrder: typeof body.displayOrder === 'number' ? body.displayOrder : 0
  };

  next();
}

/**
 * Validates Login payload
 */
function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Email address is required'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid email address'
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Password is required'
    });
  }

  next();
}

module.exports = {
  validateObjectId,
  validateAnnouncement,
  validateLogin
};
