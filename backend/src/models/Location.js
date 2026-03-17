const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['fish_cage', 'seaweed_farm'],
      required: [true, 'Location type is required'],
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    description: {
      type: String,
      trim: true,
    },
    tempMin: {
      type: Number,
      default: 20, // °C - alert if below
    },
    tempMax: {
      type: Number,
      default: 32, // °C - alert if above
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true, collection: 'bahari_cbo_locations' }
);

module.exports = mongoose.model('Location', locationSchema);
