import api from './api';

class UserService {
  // Get all users (admin only)
  async getUsers(params = {}) {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get single user (admin only)
  async getUser(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Upload avatar
  async uploadAvatar(file, onProgress = null) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        };
      }

      const response = await api.post('/users/profile/avatar', formData, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update user (admin only)
  async updateUser(id, userData) {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete user (admin only)
  async deleteUser(id) {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Toggle user status (admin only)
  async toggleUserStatus(id) {
    try {
      const response = await api.put(`/users/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get activity log
  async getActivityLog(params = {}) {
    try {
      const response = await api.get('/users/activity', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get user stats (admin only)
  async getUserStats() {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get users by role (admin only)
  async getUsersByRole(role, params = {}) {
    try {
      const response = await api.get(`/users/role/${role}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Search users (admin only)
  async searchUsers(query, role = null) {
    try {
      const params = { q: query };
      if (role) params.role = role;
      
      const response = await api.get('/users/search', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Export users (admin only)
  async exportUsers(params = {}) {
    try {
      const response = await api.get('/users/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get online users
  async getOnlineUsers() {
    try {
      const response = await api.get('/users/online');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Bulk update users (admin only)
  async bulkUpdateUsers(userIds, updates) {
    try {
      const response = await api.put('/users/bulk-update', { userIds, updates });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update user role (admin only)
  async updateUserRole(id, role) {
    try {
      const response = await api.put(`/users/${id}/role`, { role });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get user notifications
  async getUserNotifications(params = {}) {
    try {
      const response = await api.get('/users/notifications', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId) {
    try {
      const response = await api.put(`/users/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsRead() {
    try {
      const response = await api.put('/users/notifications/read-all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get user addresses
  async getAddresses() {
    try {
      const response = await api.get('/users/addresses');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Add address
  async addAddress(addressData) {
    try {
      const response = await api.post('/users/addresses', addressData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update address
  async updateAddress(addressId, addressData) {
    try {
      const response = await api.put(`/users/addresses/${addressId}`, addressData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete address
  async deleteAddress(addressId) {
    try {
      const response = await api.delete(`/users/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Set default address
  async setDefaultAddress(addressId) {
    try {
      const response = await api.put(`/users/addresses/${addressId}/default`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get user preferences
  async getPreferences() {
    try {
      const response = await api.get('/users/preferences');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update user preferences
  async updatePreferences(preferences) {
    try {
      const response = await api.put('/users/preferences', preferences);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Change email
  async changeEmail(newEmail, password) {
    try {
      const response = await api.post('/users/change-email', {
        newEmail,
        password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Verify email change
  async verifyEmailChange(token) {
    try {
      const response = await api.post('/users/verify-email-change', { token });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Deactivate account
  async deactivateAccount(password) {
    try {
      const response = await api.post('/users/deactivate', { password });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Reactivate account
  async reactivateAccount(email, password) {
    try {
      const response = await api.post('/users/reactivate', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get user permissions
  async getPermissions() {
    try {
      const response = await api.get('/users/permissions');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Check permission
  async checkPermission(permission) {
    try {
      const response = await api.get('/users/check-permission', {
        params: { permission }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get user sessions
  async getSessions() {
    try {
      const response = await api.get('/users/sessions');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Revoke session
  async revokeSession(sessionId) {
    try {
      const response = await api.delete(`/users/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Revoke all sessions
  async revokeAllSessions() {
    try {
      const response = await api.delete('/users/sessions');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new UserService();