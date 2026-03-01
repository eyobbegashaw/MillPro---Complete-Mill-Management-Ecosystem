const mongoose = require('mongoose');

const warehouseItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['Grain', 'Legume', 'Other'],
    required: true
  },
  subcategory: String,
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    default: 'kg'
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellPrice: {
    type: Number,
    required: true,
    min: 0
  },
  alertLevel: {
    type: Number,
    required: true,
    min: 0
  },
  description: String,
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  location: {
    aisle: String,
    shelf: String,
    bin: String
  },
  batchNumber: String,
  expiryDate: Date,
  quality: {
    type: String,
    enum: ['Grade A', 'Grade B', 'Grade C'],
    default: 'Grade A'
  },
  origin: String,
  images: [String],
  lastChecked: Date,
  transactions: [{
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment']
    },
    quantity: Number,
    previousQuantity: Number,
    newQuantity: Number,
    reason: String,
    reference: String, // order ID, purchase ID, etc.
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Check alert level before saving
warehouseItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if stock is low
warehouseItemSchema.methods.isLowStock = function() {
  return this.quantity <= this.alertLevel;
};

module.exports = mongoose.model('WarehouseItem', warehouseItemSchema);