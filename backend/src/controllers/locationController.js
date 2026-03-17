const Location = require('../models/Location');

// @desc  Get all locations
// @route GET /api/locations
// @access Private
const getLocations = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.type) filter.type = req.query.type;

    const locations = await Location.find(filter).populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: locations.length, data: locations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single location
// @route GET /api/locations/:id
// @access Private
const getLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id).populate('createdBy', 'name email');
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found.' });
    }
    res.json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create location
// @route POST /api/locations
// @access Private/Admin
const createLocation = async (req, res) => {
  try {
    const { name, type, coordinates, description, tempMin, tempMax } = req.body;
    const location = await Location.create({
      name,
      type,
      coordinates,
      description,
      tempMin,
      tempMax,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update location
// @route PUT /api/locations/:id
// @access Private/Admin
const updateLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found.' });
    }
    res.json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete location (soft delete)
// @route DELETE /api/locations/:id
// @access Private/Admin
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found.' });
    }
    res.json({ success: true, message: 'Location deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLocations, getLocation, createLocation, updateLocation, deleteLocation };
