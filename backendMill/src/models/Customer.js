const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  defaultAddress: {
    address: String,
    lat: Number,
    lng: Number,
    label: String
  },
  savedAddresses: [{
    address: String,
    lat: Number,
    lng: Number,
    label: String,
    isDefault: Boolean
  }],
  paymentMethods: [{
    type: {
      type: String,
      enum: ['cbe', 'telebirr', 'card', 'bank'],
      required: true
    },
    accountNumber: String,
    accountName: String,
    bankName: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    lastUsed: Date
  }],
  favorites: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.1
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  orderStats: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    lastOrderDate: Date
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    language: {
      type: String,
      enum: ['en', 'am'],
      default: 'en'
    },
    currency: {
      type: String,
      default: 'ETB'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Update cart total
customerSchema.methods.getCartTotal = async function() {
  await this.populate('cart.product');
  
  let total = 0;
  for (const item of this.cart) {
    if (item.product) {
      total += item.quantity * item.product.price;
    }
  }
  return total;
};

// Clear cart
customerSchema.methods.clearCart = function() {
  this.cart = [];
  return this.save();
};

// Add to favorites
customerSchema.methods.toggleFavorite = function(productId) {
  const index = this.favorites.findIndex(f => f.product.toString() === productId.toString());
  
  if (index === -1) {
    this.favorites.push({ product: productId });
    return true; // Added
  } else {
    this.favorites.splice(index, 1);
    return false; // Removed
  }
};

// Update order stats
customerSchema.methods.updateOrderStats = function(orderTotal) {
  this.orderStats.totalOrders += 1;
  this.orderStats.totalSpent += orderTotal;
  this.orderStats.averageOrderValue = this.orderStats.totalSpent / this.orderStats.totalOrders;
  this.orderStats.lastOrderDate = new Date();
  return this.save();
};

module.exports = mongoose.model('Customer', customerSchema);