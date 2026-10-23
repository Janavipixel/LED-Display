const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { setupTestDb, teardownTestDb, getAdminToken } = require('./helpers/testDb');

describe('Server-Side Validation & Error Rejections', () => {
  let adminToken;

  before(async () => {
    await setupTestDb();
    adminToken = await getAdminToken();
  });

  after(async () => {
    await teardownTestDb();
  });

  test('Rejects empty announcement text with 400', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        text: '',
        effect: 'static',
        duration: 10
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /empty or whitespace/i);
  });

  test('Rejects whitespace-only announcement text with 400', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        text: '        ',
        effect: 'static',
        duration: 10
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /empty or whitespace/i);
  });

  test('Rejects announcement text exceeding 100 characters with 400', async () => {
    const longText = 'A'.repeat(101);
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        text: longText,
        effect: 'static',
        duration: 10
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /cannot exceed 100 characters/i);
  });

  test('Accepts announcement text of exactly 100 characters', async () => {
    const maxText = 'A'.repeat(100);
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        text: maxText,
        effect: 'scroll-left',
        duration: 10
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.text.length, 100);
  });

  test('Rejects unsupported display effect with 400', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        text: 'Valid announcement',
        effect: 'rainbow-fireworks-unsupported',
        duration: 10
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /unsupported display effect/i);
  });

  test('Rejects out-of-range duration (< 3s or > 120s) with 400', async () => {
    const resLow = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        text: 'Valid text',
        effect: 'static',
        duration: 1
      });

    assert.equal(resLow.status, 400);
    assert.equal(resLow.body.success, false);

    const resHigh = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        text: 'Valid text',
        effect: 'static',
        duration: 500
      });

    assert.equal(resHigh.status, 400);
    assert.equal(resHigh.body.success, false);
  });

  test('Rejects invalid MongoDB ObjectId format with 400', async () => {
    const invalidId = 'not-a-valid-id-12345';
    const res = await request(app).get(`/api/messages/${invalidId}`);

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /Invalid announcement ID format/);
  });

  test('Rejects malformed JSON body with 400', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send('{ "text": "bad json');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /Malformed JSON/i);
  });
});
