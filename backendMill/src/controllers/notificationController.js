const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, read } = req.query;
    
    const query = { user: req.user.id };
    
    if (type) {
      query.type = type;
    }
    
    if (read !== undefined) {
      query.read = read === 'true';
    }

    // Exclude expired notifications
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ];

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read'
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// Clear all notifications
exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });

    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    console.error('Clear all error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications'
    });
  }
};

// Get notification settings
exports.getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferences.notifications pushSubscription');

    res.json({
      success: true,
      data: {
        email: user.preferences?.notifications?.email ?? true,
        sms: user.preferences?.notifications?.sms ?? false,
        push: user.preferences?.notifications?.push ?? true,
        hasPushSubscription: !!user.pushSubscription
      }
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification settings'
    });
  }
};

// Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { email, sms, push } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      'preferences.notifications': { email, sms, push }
    });

    res.json({
      success: true,
      message: 'Notification settings updated'
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
};

// Subscribe to push notifications
exports.subscribePush = async (req, res) => {
  try {
    const subscription = req.body;
    
    await notificationService.saveSubscription(req.user.id, subscription);

    res.json({
      success: true,
      message: 'Push subscription saved'
    });
  } catch (error) {
    console.error('Subscribe push error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save push subscription'
    });
  }
};

// Unsubscribe from push notifications
exports.unsubscribePush = async (req, res) => {
  try {
    await notificationService.removeSubscription(req.user.id);

    res.json({
      success: true,
      message: 'Push subscription removed'
    });
  } catch (error) {
    console.error('Unsubscribe push error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove push subscription'
    });
  }
};

 
   