const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const Announcement = require('../src/models/Announcement');
const { _resetHardwareState } = require('../src/controllers/hardwareController');
const { setupTestDb, teardownTestDb, clearCollections } = require('./helpers/testDb');

describe('Hardware Integration & Telemetry Endpoints', () => {
  before(async () => {
    await setupTestDb();
  });

  after(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearCollections();
    _resetHardwareState();
  });

  test('GET /api/hardware/display returns microcontroller-optimized format', async () => {
    await Announcement.create([
      { text: 'Notice 1 for LED Matrix', effect: 'scroll-left', duration: 10, status: 'active', displayOrder: 1 },
      { text: 'Notice 2 Inactive', effect: 'static', duration: 5, status: 'inactive', displayOrder: 2 },
      { text: 'Notice 3 Active', effect: 'blink', duration: 8, status: 'active', displayOrder: 3 }
    ]);

    const res = await request(app).get('/api/hardware/display');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 2); // Only the 2 active messages
    assert.equal(res.body.refreshInterval, 30);
    assert.ok(Array.isArray(res.body.messages));

    const firstMsg = res.body.messages[0];
    assert.equal(firstMsg.text, 'Notice 1 for LED Matrix');
    assert.equal(firstMsg.effect, 'scroll-left');
    assert.equal(firstMsg.duration, 10);
    assert.equal(firstMsg.order, 1);
  });

  test('GET /api/hardware/status reports STANDBY when hardware is disconnected', async () => {
    const res = await request(app).get('/api/hardware/status');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.hardware.isConnected, false);
    assert.match(res.body.hardware.statusText, /STANDBY/);
  });

  test('POST /api/hardware/ping acknowledges ESP32 heartbeat and transitions to ONLINE', async () => {
    const telemetry = {
      deviceId: 'ESP32_SIES_LAB_01',
      ip: '192.168.1.105',
      rssi: -58,
      uptime: 3600,
      firmware: 'v1.0.0-sies'
    };

    const pingRes = await request(app)
      .post('/api/hardware/ping')
      .send(telemetry);

    assert.equal(pingRes.status, 200);
    assert.equal(pingRes.body.success, true);
    assert.equal(pingRes.body.status, 'ONLINE');

    // Check status endpoint
    const statusRes = await request(app).get('/api/hardware/status');
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.hardware.isConnected, true);
    assert.match(statusRes.body.hardware.statusText, /ONLINE/);
    assert.equal(statusRes.body.hardware.deviceId, telemetry.deviceId);
    assert.equal(statusRes.body.hardware.rssi, -58);
  });
});
