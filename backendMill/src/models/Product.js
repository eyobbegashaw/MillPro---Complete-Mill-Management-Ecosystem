const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Grain', 'Legume', 'Other'],
    required: true
  },
  subcategory: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  millingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  minQuantity: {
    type: Number,
    default: 1,
    min: 0.1
  },
  maxQuantity: {
    type: Number,
    min: 0
  },
  unit: {
    type: String,
    default: 'kg'
  },
  images: [String],
  description: String,
  origin: String,
  quality: {
    type: String,
    enum: ['Grade A', 'Grade B', 'Grade C'],
    default: 'Grade A'
  },
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbohydrates: Number,
    fat: Number,
    fiber: Number
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  alertLevel: {
    type: Number,
    default: 100,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  posted: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Update timestamps
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate average rating
productSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const sum = this.ratings.reduce((total, rating) => total + rating.rating, 0);
    this.averageRating = sum / this.ratings.length;
    this.totalReviews = this.ratings.length;
  }
  return this.save();
};

// Add rating
productSchema.methods.addRating = function(userId, rating, review) {
  const existingRating = this.ratings.find(r => r.user.toString() === userId.toString());
  
  if (existingRating) {
    existingRating.rating = rating;
    existingRating.review = review;
    existingRating.createdAt = new Date();
  } else {
    this.ratings.push({ user: userId, rating, review });
  }
  
  return this.calculateAverageRating();
};

// Check if low stock
productSchema.methods.isLowStock = function() {
  return this.stock <= this.alertLevel;
};

module.exports = mongoose.model('Product', productSchema);