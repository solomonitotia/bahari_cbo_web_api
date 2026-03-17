const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const deviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Device name is required'],
      trim: true,
    },
    deviceId: {
      type: String,
      unique: true,
      default: () => `DEV-${uuidv4().split('-')[0].toUpperCase()}`,
    },
    apiKey: {
      type: String,
      unique: true,
      default: () => uuidv4().replace(/-/g, ''),
      select: false, // hidden by default
    },
    type: {
      type: String,
      enum: ['fish_cage', 'seaweed_farm'],
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
    lastSeen: {
      type: Date,
    },
    firmware: {
      type: String,
      default: '1.0.0',
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true, collection: 'bahari_cbo_devices' }
);

module.exports = mongoose.model('Device', deviceSchema);
