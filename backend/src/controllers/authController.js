const User = require('../models/User');
const { createOTP, verifyOTP } = require('../utils/otpUtils');
const { sendOTPEmail } = require('../utils/emailUtils');
const { generateToken } = require('../utils/jwtUtils');

// ─── DEV MODE: set to true to skip OTP for testing ───────────────────────────
const SKIP_OTP = true;
// ─────────────────────────────────────────────────────────────────────────────

// Temporary store for pending 2FA logins (userId waiting for OTP)
// In production use Redis; here we use in-memory Map with expiry
const pendingLogins = new Map();

const setPendingLogin = (email, userId) => {
  pendingLogins.set(email, { userId, expiresAt: Date.now() + 10 * 60 * 1000 });
};

const getPendingLogin = (email) => {
  const entry = pendingLogins.get(email);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pendingLogins.delete(email);
    return null;
  }
  return entry.userId;
};

// @desc  Register new user
// @route POST /api/auth/register
// @access Public
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password, phone, role: 'monitor' });

    // Send verification OTP
    const otp = await createOTP(user.email, 'email_verify');
    try {
      await sendOTPEmail(user.email, otp, 'email_verify');
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
      // Don't fail registration if email fails; log for admin
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the verification OTP.',
      data: { email: user.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Verify email with OTP
// @route POST /api/auth/verify-email
// @access Public
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOTP(email, otp, 'email_verify');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Login - step 1: validate credentials & send OTP
// @route POST /api/auth/login
// @access Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isVerified && !SKIP_OTP) {
      // Resend verification OTP
      const otp = await createOTP(user.email, 'email_verify');
      try { await sendOTPEmail(user.email, otp, 'email_verify'); } catch (_) {}
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new verification OTP has been sent.',
        requiresVerification: true,
        email: user.email,
      });
    }

    // DEV MODE: skip OTP, return JWT directly
    if (SKIP_OTP) {
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
      const token = generateToken(user._id);
      return res.json({
        success: true,
        message: 'Login successful (OTP disabled for testing).',
        data: {
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
          },
        },
      });
    }

    // Send 2FA OTP
    const otp = await createOTP(user.email, 'login_2fa');
    try {
      await sendOTPEmail(user.email, otp, 'login_2fa');
    } catch (emailErr) {
      console.error('OTP email failed:', emailErr.message);
    }

    setPendingLogin(user.email, user._id.toString());

    res.json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete login.',
      requires2FA: true,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Login - step 2: verify OTP & return JWT
// @route POST /api/auth/verify-otp
// @access Public
const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const userId = getPendingLogin(email);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'No pending login found. Please log in again.',
      });
    }

    const result = await verifyOTP(email, otp, 'login_2fa');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    pendingLogins.delete(email);

    const user = await User.findByIdAndUpdate(userId, { lastLogin: new Date() }, { new: true });
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Resend OTP
// @route POST /api/auth/resend-otp
// @access Public
const resendOTP = async (req, res) => {
  try {
    const { email, type } = req.body;

    const validTypes = ['email_verify', 'login_2fa', 'password_reset'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP type.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    }

    const otp = await createOTP(user.email, type);
    try {
      await sendOTPEmail(user.email, otp, type);
    } catch (emailErr) {
      console.error('Resend OTP email failed:', emailErr.message);
    }

    res.json({ success: true, message: 'OTP resent successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Forgot password - send reset OTP
// @route POST /api/auth/forgot-password
// @access Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const otp = await createOTP(user.email, 'password_reset');
      try { await sendOTPEmail(user.email, otp, 'password_reset'); } catch (_) {}
    }

    res.json({ success: true, message: 'If that email is registered, a reset OTP has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reset password with OTP
// @route POST /api/auth/reset-password
// @access Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const result = await verifyOTP(email, otp, 'password_reset');
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get current user
// @route GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = {
  register,
  verifyEmail,
  login,
  verifyLoginOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  getMe,
};
