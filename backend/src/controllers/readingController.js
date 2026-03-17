const Reading = require('../models/Reading');
const mongoose = require('mongoose');

// @desc  Post temperature reading (IoT device)
// @route POST /api/readings
const postReading = async (req, res) => {
  try {
    const { temperature, unit = 'C', humidity } = req.body;
    const device = req.device;
    const location = device.location;

    let alert = false;
    let alertType = null;
    if (location && location.tempMin !== undefined && location.tempMax !== undefined) {
      if (temperature < location.tempMin) { alert = true; alertType = 'low'; }
      else if (temperature > location.tempMax) { alert = true; alertType = 'high'; }
    }

    const reading = await Reading.create({
      device: device._id, location: location._id,
      temperature, unit, humidity, alert, alertType,
    });

    const io = req.app.get('io');
    if (io) {
      const payload = {
        _id: reading._id,
        device: { _id: device._id, name: device.name, deviceId: device.deviceId },
        location: { _id: location._id, name: location.name, type: location.type },
        temperature, unit, humidity, alert, alertType,
        timestamp: reading.timestamp,
      };
      io.to(`location_${location._id}`).emit('new_reading', payload);
      io.emit('reading_update', payload);
    }

    res.status(201).json({ success: true, data: reading });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Apply group filter to a reading filter object
const applyGroupFilter = (filter, groupFilter) => {
  if (!groupFilter) return filter; // admin - no filter
  if (groupFilter.deviceIds.length === 0) return null; // no access
  filter.device = { $in: groupFilter.deviceIds };
  return filter;
};

// @desc  Get readings (with filters)
// @route GET /api/readings
const getReadings = async (req, res) => {
  try {
    const { device, location, from, to, alert, limit = 100, page = 1 } = req.query;
    let filter = {};
    if (device) filter.device = device;
    if (location) filter.location = location;
    if (alert === 'true') filter.alert = true;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    filter = applyGroupFilter(filter, req.groupFilter);
    if (filter === null) return res.json({ success: true, total: 0, data: [] });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Reading.countDocuments(filter);
    const readings = await Reading.find(filter)
      .populate('device', 'name deviceId type')
      .populate('location', 'name type')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), data: readings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get latest reading per device
// @route GET /api/readings/latest
const getLatestReadings = async (req, res) => {
  try {
    const { location } = req.query;
    const matchBase = location
      ? { location: mongoose.Types.ObjectId.createFromHexString(location) }
      : {};

    // Apply group filter
    if (req.groupFilter) {
      if (req.groupFilter.deviceIds.length === 0) return res.json({ success: true, count: 0, data: [] });
      matchBase.device = { $in: req.groupFilter.deviceIds.map((id) => mongoose.Types.ObjectId.createFromHexString(id)) };
    }

    const latest = await Reading.aggregate([
      { $match: matchBase },
      { $sort: { device: 1, timestamp: -1 } },
      { $group: { _id: '$device', reading: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$reading' } },
      { $lookup: { from: 'bahari_cbo_devices', localField: 'device', foreignField: '_id', as: 'device' } },
      { $unwind: '$device' },
      { $lookup: { from: 'bahari_cbo_locations', localField: 'location', foreignField: '_id', as: 'location' } },
      { $unwind: '$location' },
      { $sort: { timestamp: -1 } },
    ]);

    res.json({ success: true, count: latest.length, data: latest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get temperature stats
// @route GET /api/readings/stats
const getStats = async (req, res) => {
  try {
    const { location, device, from, to, interval = 'hour' } = req.query;

    const match = {};
    if (location) match.location = mongoose.Types.ObjectId.createFromHexString(location);
    if (device) match.device = mongoose.Types.ObjectId.createFromHexString(device);

    const now = new Date();
    match.timestamp = {
      $gte: from ? new Date(from) : new Date(now.getTime() - 24 * 60 * 60 * 1000),
      $lte: to ? new Date(to) : now,
    };

    // Apply group filter
    if (req.groupFilter) {
      if (req.groupFilter.deviceIds.length === 0) return res.json({ success: true, count: 0, data: [] });
      match.device = { $in: req.groupFilter.deviceIds.map((id) => mongoose.Types.ObjectId.createFromHexString(id)) };
    }

    const groupFormats = {
      minute: { year: '$year', month: '$month', day: '$dayOfMonth', hour: '$hour', minute: '$minute' },
      hour: { year: '$year', month: '$month', day: '$dayOfMonth', hour: '$hour' },
      day: { year: '$year', month: '$month', day: '$dayOfMonth' },
    };
    const groupId = groupFormats[interval] || groupFormats.hour;

    const stats = await Reading.aggregate([
      { $match: match },
      {
        $group: {
          _id: Object.fromEntries(Object.entries(groupId).map(([k, v]) => [k, { [v]: '$timestamp' }])),
          avgTemp: { $avg: '$temperature' },
          minTemp: { $min: '$temperature' },
          maxTemp: { $max: '$temperature' },
          count: { $sum: 1 },
          alertCount: { $sum: { $cond: ['$alert', 1, 0] } },
          timestamp: { $first: '$timestamp' },
        },
      },
      { $sort: { timestamp: 1 } },
    ]);

    res.json({ success: true, count: stats.length, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get active alerts
// @route GET /api/readings/alerts
const getAlerts = async (req, res) => {
  try {
    const { location, limit = 50 } = req.query;
    let filter = { alert: true };
    if (location) filter.location = location;

    filter = applyGroupFilter(filter, req.groupFilter);
    if (filter === null) return res.json({ success: true, count: 0, data: [] });

    const alerts = await Reading.find(filter)
      .populate('device', 'name deviceId type')
      .populate('location', 'name type tempMin tempMax')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Public summary stats for landing page (no auth)
// @route GET /api/readings/public-stats
const getPublicStats = async (req, res) => {
  try {
    const Device = require('../models/Device');
    const total  = await Device.countDocuments({ isActive: true });

    // Devices that have a reading in the last 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentReadings = await Reading.aggregate([
      { $match: { timestamp: { $gte: tenMinsAgo } } },
      { $group: { _id: '$device' } },
    ]);
    const online  = recentReadings.length;
    const warning = await Reading.countDocuments({ alert: true, timestamp: { $gte: tenMinsAgo } });
    const offline = Math.max(0, total - online);

    res.json({ success: true, data: { total, online, warning, offline } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { postReading, getReadings, getLatestReadings, getStats, getAlerts, getPublicStats };
