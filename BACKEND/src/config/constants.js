/**
 * SIES GST CSE-IoT LED Display Management System
 * System Constants
 */

const DISPLAY_EFFECTS = {
  SCROLL_LEFT: 'scroll-left',
  SCROLL_RIGHT: 'scroll-right',
  STATIC: 'static',
  BLINK: 'blink'
};

const ALLOWED_EFFECTS = Object.values(DISPLAY_EFFECTS);

const MESSAGE_STATUS = {
  ACTIVE: 'active',
  QUEUED: 'queued',
  INACTIVE: 'inactive'
};

const ALLOWED_STATUS = Object.values(MESSAGE_STATUS);

const MESSAGE_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 100,
  MIN_DURATION: 3,    // in seconds
  MAX_DURATION: 120,  // in seconds
  DEFAULT_DURATION: 10
};

const AUDIT_ACTIONS = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  DELETED: 'DELETED',
  REORDERED: 'REORDERED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  ADMIN_LOGIN: 'ADMIN_LOGIN'
};

const HARDWARE_STATUS = {
  ONLINE_TIMEOUT_MS: 60000 // 60 seconds threshold to consider hardware connected
};

module.exports = {
  DISPLAY_EFFECTS,
  ALLOWED_EFFECTS,
  MESSAGE_STATUS,
  ALLOWED_STATUS,
  MESSAGE_LIMITS,
  AUDIT_ACTIONS,
  HARDWARE_STATUS
};
