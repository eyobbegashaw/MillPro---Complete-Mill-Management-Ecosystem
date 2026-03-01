const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    unique: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'ETB'
  },
  method: {
    type: String,
    enum: ['cash', 'cbe', 'telebirr', 'bank', 'card'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  transactionId: String,
  reference: String,
  provider: String,
  
  // CBE/Telebirr specific
  phoneNumber: String,
  
  // Bank transfer specific
  bankName: String,
  accountNumber: String,
  accountName: String,
  swiftCode: String,
  
  // Card specific
  cardLastFour: String,
  cardType: String,
  
  // Payment processing
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  
  // Receipt
  receipt: {
    url: String,
    generatedAt: Date
  },
  
  // Metadata
  metadata: {
    ip: String,
    userAgent: String,
    location: String
  },
  
  // Refund
  refund: {
    amount: Number,
    reason: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: Date,
    transactionId: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  completedAt: Date
});

// Generate payment number before saving
paymentSchema.pre('save', async function(next) {
  if (!this.paymentNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.paymentNumber = `PAY-${year}${month}${day}-${random}`;
  }
  this.updatedAt = new Date();
  next();
});

// Mark as completed
paymentSchema.methods.markAsCompleted = function(processedBy) {
  this.status = 'completed';
  this.processedBy = processedBy;
  this.processedAt = new Date();
  this.completedAt = new Date();
  return this.save();
};

// Mark as failed
paymentSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.metadata = { ...this.metadata, failureReason: reason };
  return this.save();
};

// Process refund
paymentSchema.methods.processRefund = function(amount, reason, processedBy) {
  if (amount > this.amount) {
    throw new Error('Refund amount cannot exceed payment amount');
  }
  
  this.refund = {
    amount,
    reason,
    processedBy,
    processedAt: new Date()
  };
  
  this.status = 'refunded';
  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);