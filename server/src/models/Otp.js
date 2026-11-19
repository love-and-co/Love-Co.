const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema(
  {
    target: {
      type: String,
      index: true,
    },
    phone: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      enum: ['email', 'phone'],
      default: 'phone',
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedToken: {
      type: String,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000),
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // 10 minutes TTL index (allows token verification window)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Otp', OtpSchema);
