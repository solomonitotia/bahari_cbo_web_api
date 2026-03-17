const Device = require('../models/Device');

// @desc  Get all devices (filtered by group for non-admins)
// @route GET /api/devices
const getDevices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.location) filter.location = req.query.location;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    // Group-based access control
    if (req.groupFilter) {
      if (req.groupFilter.deviceIds.length === 0) {
        return res.json({ success: true, count: 0, data: [] });
      }
      filter._id = { $in: req.groupFilter.deviceIds };
    }

    const devices = await Device.find(filter)
      .populate('location', 'name type')
      .populate('registeredBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: devices.length, data: devices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single device
// @route GET /api/devices/:id
const getDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('location', 'name type tempMin tempMax')
      .populate('registeredBy', 'name email');

    if (!device) return res.status(404).json({ success: false, message: 'Device not found.' });

    // Group access check
    if (req.groupFilter && !req.groupFilter.deviceIds.includes(device._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied to this device.' });
    }

    res.json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Register new device (Admin only)
// @route POST /api/devices
const createDevice = async (req, res) => {
  try {
    const { name, type, location, firmware } = req.body;
    const device = await Device.create({ name, type, location, firmware, registeredBy: req.user._id });
    const deviceWithKey = await Device.findById(device._id).select('+apiKey').populate('location', 'name type');
    res.status(201).json({
      success: true,
      message: 'Device registered. Save the API key — it will not be shown again.',
      data: deviceWithKey,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update device (Admin only)
// @route PUT /api/devices/:id
const updateDevice = async (req, res) => {
  try {
    const { name, type, location, status, firmware } = req.body;
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { name, type, location, status, firmware },
      { new: true, runValidators: true }
    ).populate('location', 'name type');
    if (!device) return res.status(404).json({ success: false, message: 'Device not found.' });
    res.json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Regenerate device API key (Admin only)
// @route POST /api/devices/:id/regenerate-key
const regenerateApiKey = async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { apiKey: uuidv4().replace(/-/g, '') },
      { new: true }
    ).select('+apiKey');
    if (!device) return res.status(404).json({ success: false, message: 'Device not found.' });
    res.json({
      success: true,
      message: 'API key regenerated. Save it — it will not be shown again.',
      data: { deviceId: device.deviceId, apiKey: device.apiKey },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete device (Admin only)
// @route DELETE /api/devices/:id
const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ success: false, message: 'Device not found.' });
    res.json({ success: true, message: 'Device deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDevices, getDevice, createDevice, updateDevice, regenerateApiKey, deleteDevice };
