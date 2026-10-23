/**
 * SIES GST CSE-IoT LED Display Management System
 * Environment Configuration Loader
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from BACKEND/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sies_gst_led',
  jwtSecret: process.env.JWT_SECRET || 'sies_gst_default_dev_secret_change_in_production_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@sies.edu.in').toLowerCase().trim(),
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123',
  adminName: process.env.ADMIN_NAME || 'SIES GST IoT Admin',
  hardwareApiKey: process.env.HARDWARE_API_KEY || 'sies_esp32_matrix_secret_key_2026'
};

module.exports = config;
