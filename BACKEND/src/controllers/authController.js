/**
 * SIES GST CSE-IoT LED Display Management System
 * Authentication Controller
 */

const AdminUser = require('../models/AdminUser');
const ActivityLog = require('../models/ActivityLog');
const { AUDIT_ACTIONS } = require('../config/constants');

/**
 * Handle Admin Sign In
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both administrator email and password.'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 1. Query database for administrator account
    const admin = await AdminUser.findOne({ email: normalizedEmail });

    if (!admin) {
      console.warn(`[Auth Diagnostic] Sign-in rejected: Account "${normalizedEmail}" does not exist in database.`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email and password or contact the department administrator.'
      });
    }

    // 2. Verify salted bcrypt hash
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      console.warn(`[Auth Diagnostic] Sign-in rejected: Password mismatch for registered administrator "${normalizedEmail}".`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email and password or contact the department administrator.'
      });
    }

    // 3. Update last login timestamp
    admin.lastLogin = new Date();
    await admin.save();

    // 4. Generate signed JWT token
    const token = admin.generateAuthToken();

    console.log(`[Auth] Administrator "${admin.email}" (${admin.name}) authenticated successfully.`);

    // 5. Record administrative access in audit log
    await ActivityLog.create({
      action: AUDIT_ACTIONS.ADMIN_LOGIN,
      actor: admin.email,
      details: `Administrator ${admin.name} signed in successfully`,
      timestamp: new Date()
    }).catch(err => console.error('[ActivityLog] Could not log login event:', err.message));

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('[Auth Error] Exception during login processing:', error);
    next(error);
  }
}

/**
 * Get currently authenticated admin details
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    const admin = await AdminUser.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Administrator user not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: admin._id.toString(),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getMe
};
