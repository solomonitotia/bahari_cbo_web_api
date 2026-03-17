const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP');

const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES) || 5;
const MAX_ATTEMPTS = 5;

// Generate a 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Create and store OTP (hashed)
const createOTP = async (email, type) => {
  // Invalidate any existing OTP of same type
  await OTP.deleteMany({ email: email.toLowerCase(), type });

  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  await OTP.create({
    email: email.toLowerCase(),
    otp: hashedOtp,
    type,
    expiresAt,
  });

  return otp; // return plain OTP to be sent via email
};

// Verify OTP
const verifyOTP = async (email, otp, type) => {
  const record = await OTP.findOne({
    email: email.toLowerCase(),
    type,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    return { valid: false, message: 'OTP not found or has expired.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await OTP.deleteOne({ _id: record._id });
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(otp, record.otp);

  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    const remaining = MAX_ATTEMPTS - record.attempts;
    return { valid: false, message: `Invalid OTP. ${remaining} attempt(s) remaining.` };
  }

  // Delete OTP after successful verification
  await OTP.deleteOne({ _id: record._id });
  return { valid: true };
};

module.exports = { createOTP, verifyOTP };
