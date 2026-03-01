const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pickupLocation: {
    address: String,
    lat: Number,
    lng: Number,
    instructions: String
  },
  deliveryLocation: {
    address: String,
    lat: Number,
    lng: Number,
    instructions: String
  },
  status: {
    type: String,
    enum: [
      'pending',           // Waiting for driver assignment
      'assigned',          // Driver assigned
      'pickup-arrived',    // Driver arrived at pickup
      'picked-up',         // Items picked up
      'in-transit',        // On the way to delivery
      'delivery-arrived',  // Driver arrived at delivery
      'delivered',         // Successfully delivered
      'failed',            // Delivery failed
      'cancelled'          // Cancelled
    ],
    default: 'pending'
  },
  route: [{
    lat: Number,
    lng: Number,
    timestamp: Date
  }],
  estimatedPickupTime: Date,
  estimatedDeliveryTime: Date,
  actualPickupTime: Date,
  actualDeliveryTime: Date,
  distance: Number, // in km
  duration: Number, // in minutes
  deliveryFee: {
    type: Number,
    default: 0
  },
  trackingCode: {
    type: String,
    unique: true
  },
  customerSignature: String,
  deliveryPhoto: String,
  notes: String,
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    givenAt: Date
  },
  timeline: [{
    status: String,
    timestamp: Date,
    location: {
      lat: Number,
      lng: Number
    },
    note: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Generate tracking code before saving
deliverySchema.pre('save', async function(next) {
  if (!this.trackingCode) {
    this.trackingCode = 'DEL' + Date.now().toString(36).toUpperCase() + 
                        Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);