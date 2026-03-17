const Group = require('../models/Group');
const User = require('../models/User');

// @desc  Get all groups (admin sees all, others see their own)
// @route GET /api/groups
const getGroups = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.role !== 'admin') {
      filter['members.user'] = req.user._id;
    }
    const groups = await Group.find(filter)
      .populate('members.user', 'name email phone')
      .populate('devices', 'name deviceId type status lastSeen')
      .populate('locations', 'name type')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: groups.length, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single group
// @route GET /api/groups/:id
const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email phone role isVerified')
      .populate('devices', 'name deviceId type status firmware lastSeen location')
      .populate('locations', 'name type description tempMin tempMax')
      .populate('createdBy', 'name email');

    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    // Non-admin can only view their own group
    if (req.user.role !== 'admin') {
      const isMember = group.members.some((m) => m.user._id.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create group
// @route POST /api/groups
const createGroup = async (req, res) => {
  try {
    const { name, description, devices, locations } = req.body;
    const group = await Group.create({
      name, description, devices: devices || [], locations: locations || [],
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update group (name, description, devices, locations)
// @route PUT /api/groups/:id
const updateGroup = async (req, res) => {
  try {
    const { name, description, devices, locations } = req.body;
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { name, description, devices, locations },
      { new: true, runValidators: true }
    )
      .populate('devices', 'name deviceId type status')
      .populate('locations', 'name type');

    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete group (soft delete)
// @route DELETE /api/groups/:id
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    res.json({ success: true, message: 'Group deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Add member to group
// @route POST /api/groups/:id/members
const addMember = async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const alreadyMember = group.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this group.' });
    }

    group.members.push({ user: userId, role });
    await group.save();

    const updated = await Group.findById(group._id).populate('members.user', 'name email phone');
    res.json({ success: true, message: `${user.name} added to group as ${role}.`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update member role in group (member ↔ custodian)
// @route PUT /api/groups/:id/members/:userId
const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    const member = group.members.find((m) => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found in group.' });

    member.role = role;
    await group.save();

    const updated = await Group.findById(group._id).populate('members.user', 'name email phone');
    res.json({ success: true, message: 'Member role updated.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Remove member from group
// @route DELETE /api/groups/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    group.members = group.members.filter((m) => m.user.toString() !== req.params.userId);
    await group.save();

    res.json({ success: true, message: 'Member removed from group.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Assign devices to group
// @route PUT /api/groups/:id/devices
const assignDevices = async (req, res) => {
  try {
    const { deviceIds } = req.body; // array of device IDs
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { devices: deviceIds },
      { new: true }
    ).populate('devices', 'name deviceId type status location');

    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getGroups, getGroup, createGroup, updateGroup, deleteGroup,
  addMember, updateMemberRole, removeMember, assignDevices,
};
