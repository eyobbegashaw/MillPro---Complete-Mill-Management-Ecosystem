const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  department: {
    type: String,
    enum: ['management', 'finance', 'operations', 'hr', 'it'],
    default: 'management'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users',
      'manage_products',
      'manage_orders',
      'manage_finance',
      'manage_reports',
      'manage_settings',
      'manage_drivers',
      'view_analytics'
    ]
  }],
  secretKey: {
    type: String,
    required: true
  },
  lastLogin: Date,
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: Date,
    success: Boolean
  }],
  activityLog: [{
    action: String,
    details: mongoose.Schema.Types.Mixed,
    ip: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Log activity
adminSchema.methods.logActivity = function(action, details, ip) {
  this.activityLog.push({
    action,
    details,
    ip,
    timestamp: new Date()
  });
  return this.save();
};

// Check permission
adminSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.permissions.includes('*');
};

module.exports = mongoose.model('Admin', adminSchema);