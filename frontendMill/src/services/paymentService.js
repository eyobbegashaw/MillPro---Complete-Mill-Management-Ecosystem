import api from './api';

class PaymentService {
  // Initiate payment
  async initiatePayment(orderId, method) {
    try {
      const response = await api.post('/payments/initiate', { orderId, method });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Process payment (for cash on delivery)
  async processPayment(orderId, method, amount, reference = '') {
    try {
      const response = await api.post('/payments/process', {
        orderId,
        method,
        amount,
        reference
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Verify payment
  async verifyPayment(reference) {
    try {
      const response = await api.get(`/payments/verify/${reference}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get all payments (admin/operator)
  async getPayments(params = {}) {
    try {
      const response = await api.get('/payments', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get single payment
  async getPayment(id) {
    try {
      const response = await api.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get customer payments
  async getCustomerPayments(params = {}) {
    try {
      const response = await api.get('/payments/my-payments', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Refund payment (admin only)
  async refundPayment(id, amount, reason) {
    try {
      const response = await api.post(`/payments/${id}/refund`, { amount, reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Generate receipt
  async generateReceipt(id) {
    try {
      const response = await api.get(`/payments/${id}/receipt`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Download receipt
  async downloadReceipt(id) {
    try {
      const response = await api.get(`/payments/${id}/receipt/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get payment stats (admin only)
  async getPaymentStats(params = {}) {
    try {
      const response = await api.get('/payments/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get payment methods for user
  async getPaymentMethods() {
    try {
      const response = await api.get('/payments/methods');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Save payment method
  async savePaymentMethod(methodData) {
    try {
      const response = await api.post('/payments/methods', methodData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete payment method
  async deletePaymentMethod(id) {
    try {
      const response = await api.delete(`/payments/methods/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Set default payment method
  async setDefaultMethod(id) {
    try {
      const response = await api.put(`/payments/methods/${id}/default`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // CBE Birr payment
  async cbePayment(orderId, phoneNumber) {
    try {
      const response = await api.post('/payments/cbe', { orderId, phoneNumber });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Telebirr payment
  async telebirrPayment(orderId, phoneNumber) {
    try {
      const response = await api.post('/payments/telebirr', { orderId, phoneNumber });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Bank transfer payment
  async bankTransfer(orderId, bankAccount) {
    try {
      const response = await api.post('/payments/bank-transfer', { orderId, bankAccount });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Card payment
  async cardPayment(orderId, cardDetails) {
    try {
      const response = await api.post('/payments/card', { orderId, ...cardDetails });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Verify CBE payment
  async verifyCBEPayment(transactionId) {
    try {
      const response = await api.get(`/payments/cbe/verify/${transactionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Verify Telebirr payment
  async verifyTelebirrPayment(transactionId) {
    try {
      const response = await api.get(`/payments/telebirr/verify/${transactionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get payment history
  async getPaymentHistory(params = {}) {
    try {
      const response = await api.get('/payments/history', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get payment summary
  async getPaymentSummary(params = {}) {
    try {
      const response = await api.get('/payments/summary', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Calculate payment fees
  async calculateFees(amount, method) {
    try {
      const response = await api.get('/payments/calculate-fees', {
        params: { amount, method }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Validate payment method
  async validateMethod(method, amount) {
    try {
      const response = await api.post('/payments/validate-method', { method, amount });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get payment gateway status
  async getGatewayStatus(gateway) {
    try {
      const response = await api.get(`/payments/gateway/${gateway}/status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Retry failed payment
  async retryPayment(paymentId) {
    try {
      const response = await api.post(`/payments/${paymentId}/retry`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get payment receipt by order
  async getOrderReceipt(orderId) {
    try {
      const response = await api.get(`/payments/order/${orderId}/receipt`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new PaymentService();