const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  assignments: [{
    type: String,
    enum: ['Teff', 'Barley', 'Wheat', 'Sorghum', 'Peas', 'Beans', 'Other']
  }],
  shift: {
    start: String,
    end: String,
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }]
  },
  performance: {
    ordersProcessed: {
      type: Number,
      default: 0
    },
    avgProcessingTime: Number,
    customerRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    completedToday: {
      type: Number,
      default: 0
    }
  },
  currentStatus: {
    type: String,
    enum: ['available', 'busy', 'offline', 'break'],
    default: 'offline'
  },
  assignedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  completedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  workstation: {
    type: String,
    default: 'Main Station'
  },
  skills: [String],
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    document: String
  }],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Update performance stats
operatorSchema.methods.updatePerformance = async function(order) {
  this.performance.ordersProcessed += 1;
  
  if (order.status === 'completed') {
    this.performance.completedToday += 1;
    
    // Calculate processing time
    const startTime = new Date(order.createdAt);
    const endTime = new Date();
    const processingTime = (endTime - startTime) / (1000 * 60); // in minutes
    
    if (this.performance.avgProcessingTime) {
      this.performance.avgProcessingTime = 
        (this.performance.avgProcessingTime + processingTime) / 2;
    } else {
      this.performance.avgProcessingTime = processingTime;
    }
  }
  
  return this.save();
};

// Add rating
operatorSchema.methods.addRating = function(rating) {
  const newRating = 
    ((this.performance.customerRating * this.performance.totalRatings) + rating) /
    (this.performance.totalRatings + 1);
  
  this.performance.customerRating = newRating;
  this.performance.totalRatings += 1;
  
  return this.save();
};

module.exports = mongoose.model('Operator', operatorSchema);