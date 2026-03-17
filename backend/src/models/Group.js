const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['custodian', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    description: { type: String, trim: true },
    members: [memberSchema],
    devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'bahari_cbo_groups' }
);

// Get all device IDs for a user across their groups
groupSchema.statics.getDeviceIdsForUser = async function (userId) {
  const groups = await this.find({
    'members.user': userId,
    isActive: true,
  }).select('devices');
  const deviceIds = groups.flatMap((g) => g.devices.map((d) => d.toString()));
  return [...new Set(deviceIds)];
};

// Get all location IDs for a user across their groups
groupSchema.statics.getLocationIdsForUser = async function (userId) {
  const groups = await this.find({
    'members.user': userId,
    isActive: true,
  }).select('locations');
  const locationIds = groups.flatMap((g) => g.locations.map((l) => l.toString()));
  return [...new Set(locationIds)];
};

module.exports = mongoose.model('Group', groupSchema);
