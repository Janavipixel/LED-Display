const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const Announcement = require('../src/models/Announcement');
const ActivityLog = require('../src/models/ActivityLog');
const { setupTestDb, teardownTestDb, clearCollections, getAdminToken } = require('./helpers/testDb');

describe('Announcement & Message CRUD Endpoints', () => {
  let adminToken;

  before(async () => {
    await setupTestDb();
    adminToken = await getAdminToken();
  });

  after(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  test('POST /api/messages creates a new announcement in MongoDB', async () => {
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

    // Verify database record exists directly in MongoDB
    const doc = await Announcement.findById(res.body.data.id);
    assert.ok(doc);
    assert.equal(doc.text, payload.text);

    // Verify activity audit log was created
    const log = await ActivityLog.findOne({ action: 'CREATED', messageId: doc._id });
    assert.ok(log);
    assert.equal(log.messageText, payload.text);
  });

  test('POST /api/messages without auth token is rejected with 401', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({
        text: 'Unauthorized attempt',
        effect: 'static',
        duration: 10
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/messages retrieves all announcements', async () => {
    await Announcement.create([
      { text: 'Message A', effect: 'static', duration: 10, status: 'active', displayOrder: 1 },
      { text: 'Message B', effect: 'blink', duration: 5, status: 'active', displayOrder: 2 }
    ]);

    const res = await request(app).get('/api/messages');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 2);
    assert.equal(res.body.data.length, 2);
  });

  test('GET /api/messages/:id retrieves single announcement', async () => {
    const doc = await Announcement.create({
      text: 'Single Announcement Test',
      effect: 'scroll-right',
      duration: 10,
      status: 'active'
    });

    const res = await request(app).get(`/api/messages/${doc._id}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.text, doc.text);
  });

  test('PUT /api/messages/:id updates existing announcement without duplicate', async () => {
    const doc = await Announcement.create({
      text: 'Original Text',
      effect: 'static',
      duration: 5,
      status: 'active'
    });

    const updatePayload = {
      text: 'Updated Text for SIES Notice Board',
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

    // Verify existing record was updated and total count remains 1
    const totalCount = await Announcement.countDocuments();
    assert.equal(totalCount, 1);

    const updatedDoc = await Announcement.findById(doc._id);
    assert.equal(updatedDoc.text, updatePayload.text);
    assert.equal(updatedDoc.effect, updatePayload.effect);

    // Verify activity audit log was created
    const log = await ActivityLog.findOne({ action: 'UPDATED', messageId: doc._id });
    assert.ok(log);
  });

  test('DELETE /api/messages/:id removes the announcement from MongoDB', async () => {
    const doc = await Announcement.create({
      text: 'To Be Deleted',
      effect: 'blink',
      duration: 5,
      status: 'active'
    });

    const res = await request(app)
      .delete(`/api/messages/${doc._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify removed from database
    const checkDoc = await Announcement.findById(doc._id);
    assert.equal(checkDoc, null);

    // Verify activity audit log was created
    const log = await ActivityLog.findOne({ action: 'DELETED', messageText: 'To Be Deleted' });
    assert.ok(log);
  });

  test('GET /api/messages/:id with non-existent ObjectId returns 404', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011';
    const res = await request(app).get(`/api/messages/${nonExistentId}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /not found/);
  });
});
