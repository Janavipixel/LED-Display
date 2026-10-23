/**
 * SIES GST CSE-IoT LED Display Management System
 * Production-Grade Server Entrypoint
 */

const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const seedAdminUser = require('./utils/seedAdmin');

let memoryMongoServer = null;

async function startServer() {
  console.log('='.repeat(65));
  console.log('  SIES GST - CSE IoT Department');
  console.log('  Smart Digital Notice Board & LED Matrix Display Server');
  console.log('='.repeat(65));

  // Connect to Database
  try {
    await connectDB();
    await seedAdminUser();
  } catch (error) {
    console.warn('\n[Database Warning] Could not connect to primary MongoDB URI.');
    console.warn(`[Database Warning] Error: ${error.message}`);

    // If in development mode and mongodb-memory-server is installed, attempt fallback
    if (env.nodeEnv === 'development') {
      try {
        console.log('[Database] Attempting to start local in-memory MongoDB fallback...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryMongoServer = await MongoMemoryServer.create();
        const memUri = memoryMongoServer.getUri();
        console.log(`[Database] In-memory MongoDB instance started at: ${memUri}`);
        await connectDB(memUri);
        await seedAdminUser();
        console.log('[Database] MongoDB connected via in-memory server.');
      } catch (memErr) {
        console.error(`[Database Error] Could not initialize fallback database: ${memErr.message}`);
        console.error('[Database Notice] Please install/start MongoDB locally or update MONGODB_URI in BACKEND/.env with your MongoDB Atlas connection string.');
      }
    } else {
      console.error('[Database Notice] Please verify MONGODB_URI in your environment.');
    }
  }

  // Create HTTP Server
  const server = http.createServer(app);

  server.listen(env.port, () => {
    console.log(`\n[Server] SIES GST LED Board API listening on port: ${env.port}`);
    console.log(`[Server] Local URL:   http://localhost:${env.port}`);
    console.log(`[Server] Health:      http://localhost:${env.port}/api/health`);
    console.log(`[Server] Hardware:    http://localhost:${env.port}/api/hardware/display`);
    console.log(`[Server] Environment: ${env.nodeEnv}\n`);
  });

  // Graceful shutdown handling
  const handleShutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      if (memoryMongoServer) {
        await memoryMongoServer.stop();
        console.log('[Database] In-memory MongoDB stopped.');
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  return server;
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('[Fatal Error] Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { startServer };
