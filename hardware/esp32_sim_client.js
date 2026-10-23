/**
 * SIES GST CSE-IoT LED Display Management System
 * ESP32 Hardware Simulator Client (Node.js)
 *
 * Simulates a physical ESP32 microcontroller with a MAX7219 LED Matrix:
 * 1. Sends periodic telemetry heartbeats (POST /api/hardware/ping)
 * 2. Fetches active announcements (GET /api/hardware/display)
 * 3. Simulates sequential rendering in console
 *
 * Usage: node hardware/esp32_sim_client.js
 */

const http = require('http');

const SERVER_HOST = process.env.API_HOST || 'localhost';
const SERVER_PORT = process.env.API_PORT || 5000;
const HARDWARE_KEY = process.env.HARDWARE_KEY || 'sies_esp32_matrix_secret_key_2026';
const DEVICE_ID = 'ESP32_SIMULATOR_V1';

console.log('='.repeat(65));
console.log('  SIES GST - CSE IoT Hardware Simulator');
console.log('  Simulating ESP32 connected to MAX7219 Dot Matrix Display');
console.log('='.repeat(65));
console.log(`Target Backend: http://${SERVER_HOST}:${SERVER_PORT}`);

function sendHeartbeat() {
  const payload = JSON.stringify({
    deviceId: DEVICE_ID,
    ip: '192.168.1.199',
    rssi: -55,
    uptime: Math.floor(process.uptime()),
    firmware: 'v1.0.0-sim-node'
  });

  const options = {
    hostname: SERVER_HOST,
    port: SERVER_PORT,
    path: '/api/hardware/ping',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'x-hardware-token': HARDWARE_KEY
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`[ESP32 SIM] Heartbeat sent successfully -> Backend acknowledged ONLINE status.`);
      } else {
        console.warn(`[ESP32 SIM] Heartbeat failed with HTTP ${res.statusCode}: ${body}`);
      }
    });
  });

  req.on('error', err => {
    console.error(`[ESP32 SIM] Connection error during ping: ${err.message}`);
  });

  req.write(payload);
  req.end();
}

function fetchDisplayMessages() {
  const options = {
    hostname: SERVER_HOST,
    port: SERVER_PORT,
    path: '/api/hardware/display',
    method: 'GET',
    headers: {
      'x-hardware-token': HARDWARE_KEY
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.success) {
          console.log(`\n[ESP32 SIM] Retrieved ${data.count} active announcements for display:`);
          data.messages.forEach((msg, idx) => {
            console.log(`  [Slot ${idx + 1}] "${msg.text}" | Effect: ${msg.effect} | Duration: ${msg.duration}s`);
          });
        }
      } catch (e) {
        console.warn(`[ESP32 SIM] Could not parse display payload: ${e.message}`);
      }
    });
  });

  req.on('error', err => {
    console.error(`[ESP32 SIM] Error fetching display messages: ${err.message}`);
  });

  req.end();
}

// Initial cycle
sendHeartbeat();
fetchDisplayMessages();

// Set interval timers
setInterval(sendHeartbeat, 25000); // Heartbeat every 25s
setInterval(fetchDisplayMessages, 15000); // Poll every 15s
