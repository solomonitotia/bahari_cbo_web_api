const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['email_verify', 'login_2fa', 'password_reset'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL: MongoDB removes doc when expiresAt passes
    },
  },
  { timestamps: true, collection: 'bahari_cbo_otps' }
);

otpSchema.index({ email: 1, type: 1 });

module.exports = mongoose.model('OTP', otpSchema);
