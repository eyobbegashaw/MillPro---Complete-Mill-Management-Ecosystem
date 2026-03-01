const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerInfo: {
    name: String,
    phone: String,
    email: String
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    quantity: {
      type: Number,
      required: true,
      min: 0.1
    },
    pricePerKg: Number,
    millingFee: Number,
    subtotal: Number
  }],
  orderType: {
    type: String,
    enum: ['regular', 'special', 'offline', 'cart'],
    default: 'regular'
  },
  status: {
    type: String,
    enum: [
      'pending',        // Order received
      'processing',     // Being processed by operator
      'ready',          // Ready for pickup/delivery
      'assigned',       // Driver assigned
      'picked-up',      // Picked up from operator
      'in-transit',     // On the way to customer
      'delivered',      // Successfully delivered
      'cancelled',      // Cancelled by customer/admin
      'failed'          // Delivery failed
    ],
    default: 'pending'
  },
  delivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  deliveryRequired: {
    type: Boolean,
    default: true
  },
  deliveryAddress: {
    address: String,
    lat: Number,
    lng: Number,
    instructions: String
  },
  pickupAddress: {
    address: String,
    lat: Number,
    lng: Number,
    instructions: String
  },
  schedule: {
    pickupDate: Date,
    deliveryDate: Date,
    preferredTime: String
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'cbe', 'telebirr', 'bank', 'card']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  totals: {
    subtotal: Number,
    millingTotal: Number,
    deliveryFee: Number,
    orderFee: {
      type: Number,
      default: 20
    },
    total: Number
  },
  specialInstructions: String,
  operatorNotes: String,
  trackingHistory: [{
    status: String,
    timestamp: Date,
    location: {
      lat: Number,
      lng: Number
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  completedAt: Date
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);