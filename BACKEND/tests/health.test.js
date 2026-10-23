const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { setupTestDb, teardownTestDb } = require('./helpers/testDb');

describe('Health & Service Endpoints', () => {
  before(async () => {
    await setupTestDb();
  });

  after(async () => {
    await teardownTestDb();
  });

  test('GET /api/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.service, 'SIES GST CSE-IoT LED Display Management API');
    assert.equal(res.body.database.connected, true);
    assert.ok(res.body.timestamp);
  });

  test('GET /unknown-route returns 404 with structured error', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /Endpoint not found/);
  });
});
