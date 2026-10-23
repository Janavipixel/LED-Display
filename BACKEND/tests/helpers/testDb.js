/**
 * SIES GST CSE-IoT LED Display Management System
 * Shared Test Database Helper using MongoMemoryServer
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const AdminUser = require('../../src/models/AdminUser');
const seedAdminUser = require('../../src/utils/seedAdmin');

let mongodInstance = null;
let isStarting = false;

async function getOrCreateMemoryServer() {
  if (mongodInstance) {
    return mongodInstance;
  }
  if (isStarting) {
    while (isStarting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return mongodInstance;
  }

  isStarting = true;
  try {
    mongodInstance = await MongoMemoryServer.create({
      spawn: {
        timeout: 60000 // Allow up to 60s on Windows for binary startup
      }
    });
    return mongodInstance;
  } finally {
    isStarting = false;
  }
}

async function setupTestDb() {
  const mongod = await getOrCreateMemoryServer();
  const uri = mongod.getUri();

  if (mongoose.connection.readyState !== 1) {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri);
  }

  await seedAdminUser();
  return mongod;
}

async function teardownTestDb() {
  // Do not kill the singleton prematurely if other test suites are running
}

async function forceStopTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
}

async function clearCollections() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      if (key !== 'adminusers') {
        await collections[key].deleteMany({});
      }
    }
  }
}

async function getAdminToken() {
  let admin = await AdminUser.findOne();
  if (!admin) {
    await seedAdminUser();
    admin = await AdminUser.findOne();
  }
  return admin.generateAuthToken();
}

module.exports = {
  setupTestDb,
  teardownTestDb,
  forceStopTestDb,
  clearCollections,
  getAdminToken
};
