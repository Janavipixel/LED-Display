/**
 * SIES GST CSE-IoT LED Display Management System
 * Message & Announcement Routes
 */

const express = require('express');
const {
  getMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage
} = require('../controllers/messageController');
const { requireAdminAuth } = require('../middleware/auth');
const { validateObjectId, validateAnnouncement } = require('../middleware/validation');

const router = express.Router();

// Public / Display endpoints
router.get('/', getMessages);
router.get('/:id', validateObjectId('id'), getMessageById);

// Protected Admin Operations
router.post('/', requireAdminAuth, validateAnnouncement, createMessage);
router.put('/:id', requireAdminAuth, validateObjectId('id'), validateAnnouncement, updateMessage);
router.delete('/:id', requireAdminAuth, validateObjectId('id'), deleteMessage);

module.exports = router;
