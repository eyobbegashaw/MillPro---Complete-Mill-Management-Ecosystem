const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: true
  },
  licenseExpiry: {
    type: Date,
    required: true
  },
  vehicle: {
    type: {
      type: String,
      enum: ['truck', 'van', 'motorcycle'],
      required: true
    },
    plateNumber: {
      type: String,
      required: true
    },
    model: String,
    capacity: Number // in kg
  },
  currentLocation: {
    type: {
      lat: Number,
      lng: Number,
      address: String,
      updatedAt: Date
    },
    default: null
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline', 'on-delivery'],
    default: 'offline'
  },
  assignedDeliveries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  }],
  completedDeliveries: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  documents: {
    licenseFront: String,
    licenseBack: String,
    vehicleRegistration: String,
    insurance: String
  },
  availabilityHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Index for geospatial queries
driverSchema.index({ 'currentLocation': '2dsphere' });

module.exports = mongoose.model('Driver', driverSchema);