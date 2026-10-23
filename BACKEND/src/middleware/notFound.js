/**
 * SIES GST CSE-IoT LED Display Management System
 * 404 Route Not Found Middleware
 */

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = notFoundHandler;
