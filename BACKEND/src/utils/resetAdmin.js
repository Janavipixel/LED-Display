/**
 * SIES GST CSE-IoT LED Display Management System
 * Admin Account Initialization & Password Reset CLI Tool
 *
 * Usage:
 *   node src/utils/resetAdmin.js
 *   node src/utils/resetAdmin.js <email> <password>
 *   npm run admin:reset
 */

const { connectDB, disconnectDB } = require('../config/db');
const AdminUser = require('../models/AdminUser');
const env = require('../config/env');

async function main() {
  const args = process.argv.slice(2);
  const targetEmail = (args[0] || env.adminEmail || 'admin@sies.edu.in').toLowerCase().trim();
  const targetPassword = args[1] || env.adminPassword || 'Admin@123';
  const targetName = args[2] || env.adminName || 'SIES GST IoT Admin';

  console.log('='.repeat(65));
  console.log('  SIES GST CSE-IoT - Admin Account Setup / Password Reset');
  console.log('='.repeat(65));
  console.log(`Target Email:    ${targetEmail}`);
  console.log(`Password Length: ${targetPassword.length} characters`);

  try {
    await connectDB();

    let admin = await AdminUser.findOne({ email: targetEmail });
    const passwordHash = await AdminUser.hashPassword(targetPassword);

    if (admin) {
      admin.passwordHash = passwordHash;
      admin.name = targetName;
      admin.role = 'admin';
      await admin.save();
      console.log(`[Success] Existing administrator account updated successfully!`);
      console.log(`[Details] ID: ${admin._id} | Email: ${admin.email}`);
    } else {
      admin = new AdminUser({
        email: targetEmail,
        passwordHash,
        name: targetName,
        role: 'admin'
      });
      await admin.save();
      console.log(`[Success] New administrator account created successfully!`);
      console.log(`[Details] ID: ${admin._id} | Email: ${admin.email}`);
    }

    // Verify hash verification immediately
    const verifySuccess = await admin.comparePassword(targetPassword);
    if (verifySuccess) {
      console.log(`[Verification] Password verification test: PASSED (Bcrypt hash verified)`);
    } else {
      console.error(`[Verification] Password verification test: FAILED!`);
    }

    console.log('='.repeat(65));
  } catch (error) {
    console.error(`[Error] Failed to initialize/reset admin account: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
