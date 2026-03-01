const webpush = require('web-push');
const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  constructor() {
    // Configure web push for browser notifications
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:' + process.env.EMAIL_FROM,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  // Create notification
  async createNotification(data) {
    try {
      const notification = new Notification({
        user: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'medium',
        data: data.data || {},
        actions: data.actions || [],
        image: data.image,
        link: data.link,
        expiresAt: data.expiresAt
      });

      await notification.save();

      // Send real-time notification via socket if available
      if (global.io) {
        global.io.to(`user-${data.userId}`).emit('notification', notification);
      }

      // Send push notification if user has subscription
      await this.sendPushNotification(data.userId, notification);

      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  // Create bulk notifications
  async createBulkNotifications(notificationsData) {
    try {
      const notifications = await Notification.insertMany(
        notificationsData.map(data => ({
          user: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 'medium',
          data: data.data || {},
          actions: data.actions || [],
          image: data.image,
          link: data.link,
          expiresAt: data.expiresAt
        }))
      );

      // Send real-time notifications
      if (global.io) {
        notifications.forEach(notification => {
          global.io.to(`user-${notification.user}`).emit('notification', notification);
        });
      }

      return notifications;
    } catch (error) {
      console.error('Create bulk notifications error:', error);
      throw error;
    }
  }

  // Send push notification
  async sendPushNotification(userId, notification) {
    try {
      const user = await User.findById(userId);
      
      if (!user || !user.pushSubscription) return;

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        icon: notification.image || '/logo192.png',
        badge: '/badge.png',
        data: {
          url: notification.link || `/notifications/${notification._id}`,
          notificationId: notification._id,
          ...notification.data
        },
        actions: notification.actions.map(action => ({
          action: action.action,
          title: action.label
        }))
      });

      await webpush.sendNotification(user.pushSubscription, payload);
    } catch (error) {
      console.error('Send push notification error:', error);
      // Remove invalid subscription
      if (error.statusCode === 410) {
        await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
      }
    }
  }

  // Save push subscription
  async saveSubscription(userId, subscription) {
    try {
      await User.findByIdAndUpdate(userId, {
        pushSubscription: subscription
      });
      return true;
    } catch (error) {
      console.error('Save subscription error:', error);
      return false;
    }
  }

  // Remove push subscription
  async removeSubscription(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        $unset: { pushSubscription: 1 }
      });
      return true;
    } catch (error) {
      console.error('Remove subscription error:', error);
      return false;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true, readAt: new Date() },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }

  // Mark all as read
  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { user: userId, read: false },
        { read: true, readAt: new Date() }
      );
      return true;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({
        user: userId,
        read: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  // Delete expired notifications
  async deleteExpired() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      console.log(`Deleted ${result.deletedCount} expired notifications`);
      return result;
    } catch (error) {
      console.error('Delete expired notifications error:', error);
      throw error;
    }
  }

  // Create order notification
  async notifyOrderCreated(order, customerId) {
    return this.createNotification({
      userId: customerId,
      title: 'Order Received',
      message: `Your order #${order.orderNumber} has been received.`,
      type: 'order',
      priority: 'high',
      data: { orderId: order._id, orderNumber: order.orderNumber },
      link: `/customer/orders/${order._id}`
    });
  }

  // Notify order status change
  async notifyOrderStatusChange(order, customerId) {
    const statusMessages = {
      pending: 'Your order is pending.',
      processing: 'Your order is now being processed.',
      ready: 'Your order is ready for pickup/delivery.',
      assigned: 'A driver has been assigned.',
      'in-transit': 'Your order is on the way!',
      delivered: 'Your order has been delivered.',
      cancelled: 'Your order has been cancelled.'
    };

    return this.createNotification({
      userId: customerId,
      title: `Order ${order.status}`,
      message: statusMessages[order.status] || `Order #${order.orderNumber} status updated to ${order.status}`,
      type: 'order',
      priority: order.status === 'delivered' ? 'high' : 'medium',
      data: { orderId: order._id, orderNumber: order.orderNumber, status: order.status },
      link: `/customer/orders/${order._id}`
    });
  }

  // Notify new order to operators
  async notifyNewOrderToOperators(order, operatorIds) {
    const notifications = operatorIds.map(operatorId => ({
      userId: operatorId,
      title: 'New Order Assigned',
      message: `New order #${order.orderNumber} has been assigned to you.`,
      type: 'order',
      priority: 'high',
      data: { orderId: order._id, orderNumber: order.orderNumber },
      link: `/operator/orders/${order._id}`
    }));

    return this.createBulkNotifications(notifications);
  }

  // Create delivery notification
  async notifyDeliveryUpdate(delivery, customerId) {
    const statusMessages = {
      assigned: 'A driver has been assigned.',
      'in-transit': 'Your delivery is on the way!',
      delivered: 'Your delivery is complete.'
    };

    return this.createNotification({
      userId: customerId,
      title: `Delivery ${delivery.status}`,
      message: statusMessages[delivery.status] || `Delivery status updated to ${delivery.status}`,
      type: 'delivery',
      priority: delivery.status === 'delivered' ? 'high' : 'medium',
      data: { 
        deliveryId: delivery._id, 
        orderId: delivery.order,
        trackingCode: delivery.trackingCode 
      },
      link: `/track/${delivery.trackingCode}`
    });
  }

  // Create low stock alert
  async notifyLowStock(item, adminIds) {
    const notifications = adminIds.map(adminId => ({
      userId: adminId,
      title: '⚠️ Low Stock Alert',
      message: `${item.name} is running low (${item.quantity} ${item.unit} remaining)`,
      type: 'inventory',
      priority: 'urgent',
      data: { itemId: item._id, itemName: item.name },
      link: '/admin/warehouse'
    }));

    return this.createBulkNotifications(notifications);
  }

  // Create payment notification
  async notifyPaymentReceived(payment, customerId) {
    return this.createNotification({
      userId: customerId,
      title: 'Payment Received',
      message: `Payment of ${payment.amount} Birr for order #${payment.order} has been received.`,
      type: 'payment',
      priority: 'high',
      data: { paymentId: payment._id, orderId: payment.order },
      link: `/customer/orders/${payment.order}`
    });
  }

  // Create message notification
  async notifyNewMessage(conversation, sender, recipientId) {
    return this.createNotification({
      userId: recipientId,
      title: `New message from ${sender.name}`,
      message: 'You have a new message.',
      type: 'message',
      priority: 'medium',
      data: { 
        conversationId: conversation._id,
        senderId: sender._id,
        senderName: sender.name
      },
      link: `/messages?conversation=${conversation._id}`
    });
  }
}

module.exports = new NotificationService();