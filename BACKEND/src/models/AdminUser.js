/**
 * SIES GST CSE-IoT LED Display Management System
 * Admin User Data Model
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const adminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    name: {
      type: String,
      default: 'SIES GST IoT Admin'
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin'
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        ret.id = ret._id.toString();
        return ret;
      }
    }
  }
);

// Method to verify password
adminUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to sign JWT token
adminUserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id.toString(),
      email: this.email,
      role: this.role
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

// Static helper to hash passwords
adminUserSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model('AdminUser', adminUserSchema);
