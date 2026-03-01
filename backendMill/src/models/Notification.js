const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'order',
      'delivery',
      'message',
      'inventory',
      'payment',
      'system',
      'promotion',
      'alert'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actions: [{
    label: String,
    action: String,
    data: mongoose.Schema.Types.Mixed
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  expiresAt: Date,
  image: String,
  link: String,
  category: String,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Mark as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.delivered = true;
  this.deliveredAt = new Date();
  return this.save();
};

// Check if expired
notificationSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

// Static method to create order notification
notificationSchema.statics.createOrderNotification = async function(order, type, user) {
  const titles = {
    pending: 'New Order Received',
    processing: 'Order Processing',
    completed: 'Order Completed',
    cancelled: 'Order Cancelled'
  };

  const messages = {
    pending: `Order #${order.orderNumber} has been placed.`,
    processing: `Order #${order.orderNumber} is now being processed.`,
    completed: `Order #${order.orderNumber} has been completed.`,
    cancelled: `Order #${order.orderNumber} has been cancelled.`
  };

  return this.create({
    user,
    title: titles[type] || 'Order Update',
    message: messages[type] || `Order #${order.orderNumber} status updated to ${type}`,
    type: 'order',
    priority: type === 'cancelled' ? 'high' : 'medium',
    data: { orderId: order._id, orderNumber: order.orderNumber }
  });
};

// Static method to create delivery notification
notificationSchema.statics.createDeliveryNotification = async function(delivery, type, user) {
  const titles = {
    assigned: 'Delivery Assigned',
    'in-transit': 'Delivery In Transit',
    delivered: 'Delivery Completed'
  };

  const messages = {
    assigned: `A driver has been assigned to your delivery.`,
    'in-transit': `Your delivery is on the way!`,
    delivered: `Your delivery has been completed.`
  };

  return this.create({
    user,
    title: titles[type] || 'Delivery Update',
    message: messages[type] || `Delivery status updated to ${type}`,
    type: 'delivery',
    priority: type === 'delivered' ? 'high' : 'medium',
    data: { deliveryId: delivery._id, orderId: delivery.order }
  });
};

// Static method to create inventory alert
notificationSchema.statics.createInventoryAlert = async function(item, adminUsers) {
  const notifications = adminUsers.map(admin => ({
    user: admin._id,
    title: 'Low Stock Alert',
    message: `${item.name} is running low (${item.quantity} ${item.unit} remaining)`,
    type: 'inventory',
    priority: 'urgent',
    data: { itemId: item._id, itemName: item.name }
  }));

  return this.insertMany(notifications);
};

module.exports = mongoose.model('Notification', notificationSchema);