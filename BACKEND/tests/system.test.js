/**
 * SIES GST CSE-IoT LED Display Management System
 * Comprehensive Automated System Test Suite
 */

const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const env = require('../src/config/env');
const Announcement = require('../src/models/Announcement');
const ActivityLog = require('../src/models/ActivityLog');
const AdminUser = require('../src/models/AdminUser');
const seedAdminUser = require('../src/utils/seedAdmin');
const { _resetHardwareState } = require('../src/controllers/hardwareController');

describe('SIES GST Smart Digital Notice Board - Complete System Tests', () => {
  let mongod;
  let adminToken;

  before(async () => {
    mongod = await MongoMemoryServer.create({
      spawn: { timeout: 60000 }
    });
    const uri = mongod.getUri();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(uri);
    await seedAdminUser();

    // Acquire admin token
    const admin = await AdminUser.findOne({ email: env.adminEmail });
    adminToken = admin.generateAuthToken();
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  });

  // =========================================================================
  // 1. HEALTH AND SERVICE STATUS TESTS
  // =========================================================================
  describe('1. Health and Service Status', () => {
    test('GET /api/health returns 200 with healthy database status', async () => {
      const res = await request(app).get('/api/health');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.status, 'healthy');
      assert.equal(res.body.service, 'SIES GST CSE-IoT LED Display Management API');
      assert.equal(res.body.database.connected, true);
      assert.ok(res.body.timestamp);
    });

    test('GET /unknown-endpoint returns 404 with structured JSON error', async () => {
      const res = await request(app).get('/api/unknown-endpoint-test');

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Endpoint not found/i);
    });
  });

  // =========================================================================
  // 2. ADMIN AUTHENTICATION TESTS
  // =========================================================================
  describe('2. Admin Authentication', () => {
    test('POST /api/auth/login succeeds with valid seeded credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: env.adminEmail,
          password: env.adminPassword
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);
      assert.equal(res.body.user.email, env.adminEmail);
      assert.equal(res.body.user.role, 'admin');
    });

    test('POST /api/auth/login fails with invalid password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: env.adminEmail,
          password: 'IncorrectPassword!99'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Invalid credentials/i);
    });

    test('POST /api/auth/login fails with unknown email (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown.user@sies.edu.in',
          password: env.adminPassword
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    test('GET /api/auth/me rejects request without Bearer token (401)', async () => {
      const res = await request(app).get('/api/auth/me');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Authentication required/i);
    });

    test('GET /api/auth/me succeeds with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.email, env.adminEmail);
    });
  });

  // =========================================================================
  // 3. ANNOUNCEMENT CRUD TESTS
  // =========================================================================
  describe('3. Announcement CRUD Operations', () => {
    let createdId = null;

    beforeEach(async () => {
      // Clear announcements between tests
      await Announcement.deleteMany({});
      await ActivityLog.deleteMany({});
    });

    test('POST /api/messages creates an announcement and records audit log', async () => {
      const payload = {
        text: 'SIES GST Smart India Hackathon Winners Announced',
        effect: 'scroll-left',
        duration: 15,
        status: 'active'
      };

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.text, payload.text);
      assert.equal(res.body.data.effect, payload.effect);
      assert.equal(res.body.data.duration, payload.duration);
      assert.ok(res.body.data.id);

      createdId = res.body.data.id;

      // Verify persistence in MongoDB
      const dbDoc = await Announcement.findById(createdId);
      assert.ok(dbDoc);
      assert.equal(dbDoc.text, payload.text);

      // Verify Activity audit log was created
      const log = await ActivityLog.findOne({ action: 'CREATED', messageId: dbDoc._id });
      assert.ok(log);
      assert.equal(log.messageText, payload.text);
    });

    test('POST /api/messages without auth token is rejected with 401', async () => {
      const res = await request(app)
        .post('/api/messages')
        .send({
          text: 'Unauthorized Message',
          effect: 'static',
          duration: 10
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    test('GET /api/messages retrieves all announcements', async () => {
      await Announcement.create([
        { text: 'Message 1', effect: 'static', duration: 10, status: 'active', displayOrder: 1 },
        { text: 'Message 2', effect: 'blink', duration: 5, status: 'active', displayOrder: 2 }
      ]);

      const res = await request(app).get('/api/messages');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.count, 2);
      assert.equal(res.body.data.length, 2);
    });

    test('GET /api/messages/:id retrieves a single announcement', async () => {
      const doc = await Announcement.create({
        text: 'Specific Message By ID',
        effect: 'scroll-right',
        duration: 10,
        status: 'active'
      });

      const res = await request(app).get(`/api/messages/${doc._id}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.text, doc.text);
    });

    test('PUT /api/messages/:id updates existing announcement without creating duplicate', async () => {
      const doc = await Announcement.create({
        text: 'Initial Announcement Text',
        effect: 'static',
        duration: 5,
        status: 'active'
      });

      const updatePayload = {
        text: 'Updated Announcement Text',
        effect: 'scroll-left',
        duration: 12
      };

      const res = await request(app)
        .put(`/api/messages/${doc._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatePayload);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.text, updatePayload.text);
      assert.equal(res.body.data.duration, 12);

      // Verify no duplicate was created
      const totalCount = await Announcement.countDocuments();
      assert.equal(totalCount, 1);

      // Verify updated directly in MongoDB
      const updatedDoc = await Announcement.findById(doc._id);
      assert.equal(updatedDoc.text, updatePayload.text);
      assert.equal(updatedDoc.effect, updatePayload.effect);

      // Verify update audit log
      const log = await ActivityLog.findOne({ action: 'UPDATED', messageId: doc._id });
      assert.ok(log);
    });

    test('DELETE /api/messages/:id deletes the announcement from database', async () => {
      const doc = await Announcement.create({
        text: 'Announcement to Delete',
        effect: 'blink',
        duration: 5,
        status: 'active'
      });

      const res = await request(app)
        .delete(`/api/messages/${doc._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify deleted from MongoDB
      const checkDoc = await Announcement.findById(doc._id);
      assert.equal(checkDoc, null);

      // Verify delete audit log
      const log = await ActivityLog.findOne({ action: 'DELETED', messageText: 'Announcement to Delete' });
      assert.ok(log);
    });

    test('GET /api/messages/:id returns 404 for non-existent record', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/messages/${nonExistentId}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /not found/i);
    });
  });

  // =========================================================================
  // 4. SERVER-SIDE VALIDATION & ERROR HANDLING TESTS
  // =========================================================================
  describe('4. Server-Side Validation and Error Handling', () => {
    test('Rejects empty announcement text with 400', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: '', effect: 'static', duration: 10 });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /empty or whitespace/i);
    });

    test('Rejects whitespace-only announcement text with 400', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: '       ', effect: 'static', duration: 10 });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /empty or whitespace/i);
    });

    test('Rejects announcement text exceeding 100 characters with 400', async () => {
      const longText = 'A'.repeat(101);
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: longText, effect: 'static', duration: 10 });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /cannot exceed 100 characters/i);
    });

    test('Accepts announcement text of exactly 100 characters', async () => {
      const maxText = 'A'.repeat(100);
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: maxText, effect: 'scroll-left', duration: 10 });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.text.length, 100);
    });

    test('Rejects unsupported display effect with 400', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Valid message', effect: 'invalid-effect-type', duration: 10 });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /unsupported display effect/i);
    });

    test('Rejects out-of-range duration (< 3s or > 120s) with 400', async () => {
      const resLow = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Valid message', effect: 'static', duration: 2 });
      assert.equal(resLow.status, 400);

      const resHigh = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Valid message', effect: 'static', duration: 300 });
      assert.equal(resHigh.status, 400);
    });

    test('Rejects invalid MongoDB ObjectId with 400', async () => {
      const res = await request(app).get('/api/messages/123-invalid-id');

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Invalid announcement ID format/);
    });

    test('Rejects malformed JSON with 400', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('{ "text": "unclosed json string');

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /Malformed JSON/i);
    });
  });

  // =========================================================================
  // 5. HARDWARE & ESP32 TELEMETRY TESTS
  // =========================================================================
  describe('5. Hardware & ESP32 Integration', () => {
    beforeEach(async () => {
      await Announcement.deleteMany({});
      _resetHardwareState();
    });

    test('GET /api/hardware/display returns microcontroller-optimized format', async () => {
      await Announcement.create([
        { text: 'Active Matrix Message 1', effect: 'scroll-left', duration: 10, status: 'active', displayOrder: 1 },
        { text: 'Inactive Message', effect: 'static', duration: 5, status: 'inactive', displayOrder: 2 },
        { text: 'Active Matrix Message 2', effect: 'blink', duration: 8, status: 'active', displayOrder: 3 }
      ]);

      const res = await request(app).get('/api/hardware/display');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.count, 2); // Only active messages
      assert.equal(res.body.refreshInterval, 30);
      assert.ok(Array.isArray(res.body.messages));

      const firstMsg = res.body.messages[0];
      assert.equal(firstMsg.text, 'Active Matrix Message 1');
      assert.equal(firstMsg.effect, 'scroll-left');
      assert.equal(firstMsg.duration, 10);
      assert.equal(firstMsg.order, 1);
    });

    test('GET /api/hardware/status reports STANDBY when hardware is not connected', async () => {
      const res = await request(app).get('/api/hardware/status');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.hardware.isConnected, false);
      assert.match(res.body.hardware.statusText, /STANDBY/);
    });

    test('POST /api/hardware/ping acknowledges heartbeat and transitions to ONLINE', async () => {
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

      // Verify status endpoint reflects connection
      const statusRes = await request(app).get('/api/hardware/status');
      assert.equal(statusRes.status, 200);
      assert.equal(statusRes.body.hardware.isConnected, true);
      assert.match(statusRes.body.hardware.statusText, /ONLINE/);
      assert.equal(statusRes.body.hardware.deviceId, telemetry.deviceId);
      assert.equal(statusRes.body.hardware.rssi, -58);
    });
  });

  // =========================================================================
  // 6. STATS & AUDIT LOGGING TESTS
  // =========================================================================
  describe('6. Stats and Audit History', () => {
    test('GET /api/stats returns accurate real backend counts', async () => {
      await Announcement.deleteMany({});
      await Announcement.create([
        { text: 'A1', effect: 'static', duration: 5, status: 'active' },
        { text: 'A2', effect: 'blink', duration: 10, status: 'active' },
        { text: 'A3', effect: 'scroll-left', duration: 15, status: 'queued' }
      ]);

      const res = await request(app).get('/api/stats');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.stats.totalMessages, 3);
      assert.equal(res.body.stats.activeMessages, 2);
      assert.equal(res.body.stats.queuedMessages, 1);
    });

    test('GET /api/activity retrieves recorded audit changes from MongoDB', async () => {
      await ActivityLog.deleteMany({});
      const t1 = new Date(Date.now() - 5000);
      const t2 = new Date();
      await ActivityLog.create([
        { action: 'CREATED', messageText: 'First announcement', effect: 'static', details: 'Created by Admin', timestamp: t1, createdAt: t1 },
        { action: 'UPDATED', messageText: 'First announcement edited', effect: 'scroll-left', details: 'Updated duration', timestamp: t2, createdAt: t2 }
      ]);

      const res = await request(app).get('/api/activity');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.count, 2);
      assert.equal(res.body.data[0].action, 'UPDATED');
    });
  });
});
