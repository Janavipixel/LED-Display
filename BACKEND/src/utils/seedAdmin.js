/**
 * SIES GST CSE-IoT LED Display Management System
 * Admin Seeder Utility
 *
 * Ensures the configured administrator exists in MongoDB and keeps
 * password hashes synchronized with BACKEND/.env in development.
 */

const AdminUser = require('../models/AdminUser');
const env = require('../config/env');

async function seedAdminUser() {
  try {
    const adminEmail = env.adminEmail.toLowerCase().trim();
    const adminPassword = env.adminPassword;

    let existingAdmin = await AdminUser.findOne({ email: adminEmail });

    if (!existingAdmin) {
      // Create new administrator account
      const passwordHash = await AdminUser.hashPassword(adminPassword);
      existingAdmin = new AdminUser({
        email: adminEmail,
        passwordHash,
        name: env.adminName || 'SIES GST IoT Admin',
        role: 'admin'
      });
      await existingAdmin.save();
      console.log(`[Seed] Initial administrator account created: ${adminEmail}`);
    } else {
      // Verify if password hash matches current environment configuration
      const isPasswordMatching = await existingAdmin.comparePassword(adminPassword);
      if (!isPasswordMatching) {
        // Automatically sync password hash with configured environment password
        existingAdmin.passwordHash = await AdminUser.hashPassword(adminPassword);
        if (env.adminName) existingAdmin.name = env.adminName;
        await existingAdmin.save();
        console.log(`[Seed] Administrator password re-synchronized with environment for: ${adminEmail}`);
      } else {
        console.log(`[Seed] Administrator account verified and ready: ${adminEmail}`);
      }
    }

    return existingAdmin;
  } catch (error) {
    console.error(`[Seed Error] Could not seed admin user: ${error.message}`);
    throw error;
  }
}

module.exports = seedAdminUser;
