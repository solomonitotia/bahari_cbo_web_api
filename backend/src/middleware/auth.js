const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Device = require('../models/Device');
const Group = require('../models/Group');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Device authentication via API key (for IoT devices posting readings)
const deviceAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-device-key'];

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'Device API key required.' });
    }

    const device = await Device.findOne({ apiKey }).select('+apiKey').populate('location');
    if (!device) {
      return res.status(401).json({ success: false, message: 'Invalid device API key.' });
    }

    if (device.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Device is inactive.' });
    }

    // Update last seen
    device.lastSeen = new Date();
    await device.save();

    req.device = device;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Device auth error.' });
  }
};

// Role authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

// Must be verified (email OTP confirmed)
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address first.',
    });
  }
  next();
};

// Attach group-based device/location filter to req
// Admins: req.groupFilter = null (see everything)
// Others: req.groupFilter = { deviceIds: [...], locationIds: [...] }
const attachGroupFilter = async (req, res, next) => {
  try {
    if (!req.user || req.user.role === 'admin') {
      req.groupFilter = null;
      return next();
    }
    const deviceIds = await Group.getDeviceIdsForUser(req.user._id);
    const locationIds = await Group.getLocationIdsForUser(req.user._id);
    req.groupFilter = { deviceIds, locationIds };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect, deviceAuth, authorize, requireVerified, attachGroupFilter };
