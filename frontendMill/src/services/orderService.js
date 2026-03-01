import api from './api';

class OrderService {
  // Create new order
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get all orders (admin/operator)
  async getOrders(params = {}) {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get single order
  async getOrder(id) {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update order status
  async updateOrderStatus(id, status, note = '') {
    try {
      const response = await api.put(`/orders/${id}/status`, { status, note });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Assign operator to order
  async assignOperator(id, operatorId) {
    try {
      const response = await api.put(`/orders/${id}/assign-operator`, { operatorId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Assign driver to order
  async assignDriver(id, driverId) {
    try {
      const response = await api.put(`/orders/${id}/assign-driver`, { driverId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Cancel order
  async cancelOrder(id, reason = '') {
    try {
      const response = await api.put(`/orders/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get customer orders
  async getCustomerOrders(params = {}) {
    try {
      const response = await api.get('/orders/my-orders', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get operator orders
  async getOperatorOrders(params = {}) {
    try {
      const response = await api.get('/orders/operator', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get order stats
  async getOrderStats(params = {}) {
    try {
      const response = await api.get('/orders/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Track order
  async trackOrder(trackingNumber) {
    try {
      const response = await api.get(`/orders/track/${trackingNumber}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Add tracking update
  async addTrackingUpdate(id, status, location, note = '') {
    try {
      const response = await api.put(`/orders/${id}/tracking`, {
        status,
        location,
        note
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get delivery status
  async getDeliveryStatus(id) {
    try {
      const response = await api.get(`/orders/${id}/delivery-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Rate order
  async rateOrder(id, rating, review = '') {
    try {
      const response = await api.post(`/orders/${id}/rate`, { rating, review });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Reorder (place same order again)
  async reorder(id) {
    try {
      const response = await api.post(`/orders/${id}/reorder`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get order invoice
  async getInvoice(id) {
    try {
      const response = await api.get(`/orders/${id}/invoice`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Download invoice
  async downloadInvoice(id) {
    try {
      const response = await api.get(`/orders/${id}/invoice/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get order timeline
  async getTimeline(id) {
    try {
      const response = await api.get(`/orders/${id}/timeline`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get order history for customer
  async getOrderHistory(params = {}) {
    try {
      const response = await api.get('/orders/history', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Bulk update orders (admin only)
  async bulkUpdateOrders(updates) {
    try {
      const response = await api.put('/orders/bulk-update', { updates });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Export orders (admin only)
  async exportOrders(params = {}) {
    try {
      const response = await api.get('/orders/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get order analytics
  async getAnalytics(params = {}) {
    try {
      const response = await api.get('/orders/analytics', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get top selling products
  async getTopProducts(params = {}) {
    try {
      const response = await api.get('/orders/top-products', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get customer order summary
  async getCustomerSummary(customerId) {
    try {
      const response = await api.get(`/orders/customer/${customerId}/summary`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Schedule order
  async scheduleOrder(orderData) {
    try {
      const response = await api.post('/orders/schedule', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get scheduled orders
  async getScheduledOrders(params = {}) {
    try {
      const response = await api.get('/orders/scheduled', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update scheduled order
  async updateScheduledOrder(id, orderData) {
    try {
      const response = await api.put(`/orders/scheduled/${id}`, orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Cancel scheduled order
  async cancelScheduledOrder(id) {
    try {
      const response = await api.delete(`/orders/scheduled/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new OrderService();