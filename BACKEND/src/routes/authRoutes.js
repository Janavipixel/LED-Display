/**
 * SIES GST CSE-IoT LED Display Management System
 * Authentication Routes
 */

const express = require('express');
const { login, getMe } = require('../controllers/authController');
const { requireAdminAuth } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');

const router = express.Router();

router.post('/login', validateLogin, login);
router.get('/me', requireAdminAuth, getMe);

module.exports = router;
