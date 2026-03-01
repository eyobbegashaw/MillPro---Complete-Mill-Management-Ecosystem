import api from './api';

class MessageService {
  // Get all conversations for current user
  async getConversations(params = {}) {
    try {
      const response = await api.get('/messages/conversations', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get single conversation
  async getConversation(id) {
    try {
      const response = await api.get(`/messages/conversations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Create new conversation
  async createConversation(participantId, type = 'direct', metadata = {}) {
    try {
      const response = await api.post('/messages/conversations', {
        participantId,
        type,
        metadata
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get messages in conversation
  async getMessages(conversationId, params = {}) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Send message
  async sendMessage(conversationId, content, type = 'text', attachments = []) {
    try {
      const response = await api.post(`/messages/conversations/${conversationId}/messages`, {
        content,
        type,
        attachments
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Upload file attachment
  async uploadAttachment(conversationId, file, onProgress = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        };
      }

      const response = await api.post(
        `/messages/conversations/${conversationId}/upload`,
        formData,
        config
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mark message as read
  async markAsRead(messageId) {
    try {
      const response = await api.put(`/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mark all messages in conversation as read
  async markConversationAsRead(conversationId) {
    try {
      const response = await api.put(`/messages/conversations/${conversationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete message
  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Archive conversation
  async archiveConversation(conversationId) {
    try {
      const response = await api.put(`/messages/conversations/${conversationId}/archive`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mute conversation
  async muteConversation(conversationId) {
    try {
      const response = await api.put(`/messages/conversations/${conversationId}/mute`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Add reaction to message
  async addReaction(messageId, reaction) {
    try {
      const response = await api.post(`/messages/${messageId}/reactions`, { reaction });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Remove reaction from message
  async removeReaction(messageId) {
    try {
      const response = await api.delete(`/messages/${messageId}/reactions`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await api.get('/messages/unread');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Search messages
  async searchMessages(query, conversationId = null) {
    try {
      const params = { q: query };
      if (conversationId) {
        params.conversationId = conversationId;
      }
      const response = await api.get('/messages/search', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Typing indicator
  async sendTypingIndicator(conversationId, isTyping) {
    try {
      const response = await api.post(`/messages/conversations/${conversationId}/typing`, {
        isTyping
      });
      return response.data;
    } catch (error) {
      // Silent fail for typing indicator
      console.error('Typing indicator error:', error);
    }
  }

  // Get conversation participants
  async getParticipants(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/participants`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Add participant to conversation (group)
  async addParticipant(conversationId, userId) {
    try {
      const response = await api.post(`/messages/conversations/${conversationId}/participants`, {
        userId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Remove participant from conversation (group)
  async removeParticipant(conversationId, userId) {
    try {
      const response = await api.delete(`/messages/conversations/${conversationId}/participants/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Forward message
  async forwardMessage(messageId, conversationId) {
    try {
      const response = await api.post(`/messages/${messageId}/forward`, {
        conversationId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Pin message
  async pinMessage(conversationId, messageId) {
    try {
      const response = await api.post(`/messages/conversations/${conversationId}/pin`, {
        messageId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Unpin message
  async unpinMessage(conversationId, messageId) {
    try {
      const response = await api.delete(`/messages/conversations/${conversationId}/pin/${messageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get pinned messages
  async getPinnedMessages(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/pinned`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new MessageService();