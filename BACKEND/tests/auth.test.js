const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const env = require('../src/config/env');
const { setupTestDb, teardownTestDb, getAdminToken } = require('./helpers/testDb');

describe('Admin Authentication Endpoints', () => {
  before(async () => {
    await setupTestDb();
  });

  after(async () => {
    await teardownTestDb();
  });

  test('POST /api/auth/login succeeds with seeded credentials', async () => {
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

  test('POST /api/auth/login fails with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: env.adminEmail,
        password: 'WrongPassword@123'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /Invalid credentials/);
  });

  test('POST /api/auth/login fails with unregistered email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unknown.prof@sies.edu.in',
        password: 'Password@123'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/auth/me rejects request without Bearer token', async () => {
    const res = await request(app).get('/api/auth/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /Authentication required/);
  });

  test('GET /api/auth/me succeeds with valid Bearer token', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, env.adminEmail);
  });
});
