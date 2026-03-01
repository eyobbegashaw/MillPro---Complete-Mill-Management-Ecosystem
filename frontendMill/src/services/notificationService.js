import api from './api';

class NotificationService {
  // Get all notifications for current user
  async getNotifications(params = {}) {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread/count');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mark notification as read
  async markAsRead(id) {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete notification
  async deleteNotification(id) {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Clear all notifications
  async clearAll() {
    try {
      const response = await api.delete('/notifications/clear-all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get notification settings
  async getSettings() {
    try {
      const response = await api.get('/notifications/settings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update notification settings
  async updateSettings(settings) {
    try {
      const response = await api.put('/notifications/settings', settings);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Subscribe to push notifications
  async subscribePush(subscription) {
    try {
      const response = await api.post('/notifications/subscribe', subscription);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribePush() {
    try {
      const response = await api.post('/notifications/unsubscribe');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get notification preferences
  async getPreferences() {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Test notification (for development)
  async sendTestNotification() {
    try {
      const response = await api.post('/notifications/test');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get notification history
  async getHistory(params = {}) {
    try {
      const response = await api.get('/notifications/history', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Schedule notification
  async scheduleNotification(notificationData) {
    try {
      const response = await api.post('/notifications/schedule', notificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Cancel scheduled notification
  async cancelScheduled(scheduleId) {
    try {
      const response = await api.delete(`/notifications/schedule/${scheduleId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get scheduled notifications
  async getScheduled() {
    try {
      const response = await api.get('/notifications/scheduled');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mark notifications as read by type
  async markTypeAsRead(type) {
    try {
      const response = await api.put(`/notifications/type/${type}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete notifications by type
  async deleteByType(type) {
    try {
      const response = await api.delete(`/notifications/type/${type}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get notification stats
  async getStats() {
    try {
      const response = await api.get('/notifications/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Create custom notification (admin only)
  async createCustomNotification(notificationData) {
    try {
      const response = await api.post('/notifications/custom', notificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Broadcast notification to all users (admin only)
  async broadcastNotification(title, message, type = 'system', data = {}) {
    try {
      const response = await api.post('/notifications/broadcast', {
        title,
        message,
        type,
        data
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Send notification to specific role (admin only)
  async notifyRole(role, title, message, type = 'system', data = {}) {
    try {
      const response = await api.post('/notifications/role', {
        role,
        title,
        message,
        type,
        data
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new NotificationService();