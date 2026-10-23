/**
 * SIES GST CSE-IoT LED Display Management System
 * Express Application Configuration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const hardwareRoutes = require('./routes/hardwareRoutes');
const activityRoutes = require('./routes/activityRoutes');
const statsRoutes = require('./routes/statsRoutes');

const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFound');

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
  })
);

// Cross-Origin Resource Sharing
const corsOptions = {
  origin: env.corsOrigin === '*' ? '*' : env.corsOrigin.split(',').map(s => s.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-hardware-token']
};
app.use(cors(corsOptions));

// Body Parsing Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logging (suppressed in test environment)
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Serve Frontend Static Files
const frontendDir = path.resolve(__dirname, '../../FRONTEND');
app.use(express.static(frontendDir));

// REST API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/stats', statsRoutes);

// Convenience alias: /api/display -> /api/hardware/display
app.use('/api/display', hardwareRoutes);

// Backward-compatibility alias: /messages -> /api/messages
app.use('/messages', messageRoutes);

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
