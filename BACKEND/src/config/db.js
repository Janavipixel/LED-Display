/**
 * SIES GST CSE-IoT LED Display Management System
 * Database Connection Module
 */

const mongoose = require('mongoose');
const env = require('./env');

async function connectDB(customUri = null) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = customUri || env.mongodbUri;

  const options = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  };

  try {
    const conn = await mongoose.connect(uri, options);
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.error(`[MongoDB] Current URI: ${uri}`);
    console.error(`[MongoDB] Tip: Ensure MongoDB service is running locally ('mongod') or provide a valid MongoDB Atlas URI in BACKEND/.env (MONGODB_URI=mongodb+srv://...)`);
    throw error;
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected.');
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost. Waiting for reconnect...');
});

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus: () => mongoose.connection.readyState === 1
};
