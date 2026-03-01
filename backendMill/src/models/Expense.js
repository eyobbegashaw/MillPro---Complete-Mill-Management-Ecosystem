const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    enum: [
      'salaries',
      'rent',
      'utilities',
      'maintenance',
      'transport',
      'supplies',
      'marketing',
      'insurance',
      'tax',
      'other'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'cbe', 'telebirr', 'card'],
    required: true
  },
  paymentReference: String,
  vendor: {
    name: String,
    contact: String,
    email: String,
    taxId: String
  },
  receipt: {
    url: String,
    uploadedAt: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  notes: String,
  attachments: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  recurring: {
    isRecurring: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    nextDate: Date,
    endDate: Date
  },
  taxDeductible: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Generate expense number before saving
expenseSchema.pre('save', async function(next) {
  if (!this.expenseNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await mongoose.model('Expense').countDocuments();
    this.expenseNumber = `EXP-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);