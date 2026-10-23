/**
 * SIES GST CSE-IoT LED Display Management System
 * Frontend Runtime Configuration
 *
 * Easily switch between local development and cloud-hosted backends.
 */

window.APP_CONFIG = {
  // Base URL for the Express REST API
  // Automatically detects local vs remote environments
  API_BASE_URL: (function() {
    // 1. Check if user configured a custom URL in localStorage
    const savedCustomUrl = localStorage.getItem('sies_custom_api_url');
    if (savedCustomUrl) return savedCustomUrl;

    // 2. Local development on localhost or 127.0.0.1
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }

    // 3. Fallback / Default for production / GitHub Pages
    return 'http://localhost:5000';
  })(),

  // College & Department Context
  COLLEGE_NAME: 'SIES Graduate School of Technology',
  DEPARTMENT: 'CSE IoT Department',
  SYSTEM_TITLE: 'LED Display Management System',

  // Periodic Telemetry / Message Sync Interval (milliseconds)
  SYNC_INTERVAL_MS: 15000
};
