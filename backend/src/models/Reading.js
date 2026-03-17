const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema(
  {
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    temperature: {
      type: Number,
      required: [true, 'Temperature value is required'],
    },
    unit: {
      type: String,
      enum: ['C', 'F'],
      default: 'C',
    },
    humidity: {
      type: Number, // optional, if sensor supports it
    },
    alert: {
      type: Boolean,
      default: false,
    },
    alertType: {
      type: String,
      enum: ['high', 'low', null],
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true, collection: 'bahari_cbo' } // uses the existing collection name
);

readingSchema.index({ device: 1, timestamp: -1 });
readingSchema.index({ location: 1, timestamp: -1 });

module.exports = mongoose.model('Reading', readingSchema);
