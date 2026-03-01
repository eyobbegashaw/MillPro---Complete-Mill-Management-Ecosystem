import api from './api';

class WarehouseService {
  // Get all warehouse items
  async getItems(params = {}) {
    try {
      const response = await api.get('/warehouse', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get single warehouse item
  async getItem(id) {
    try {
      const response = await api.get(`/warehouse/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Add new item (admin only)
  async addItem(itemData) {
    try {
      const response = await api.post('/warehouse', itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update item (admin only)
  async updateItem(id, itemData) {
    try {
      const response = await api.put(`/warehouse/${id}`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete item (admin only)
  async deleteItem(id) {
    try {
      const response = await api.delete(`/warehouse/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update quantity (admin only)
  async updateQuantity(id, quantity, type, reason = '', reference = '') {
    try {
      const response = await api.put(`/warehouse/${id}/quantity`, {
        quantity,
        type,
        reason,
        reference
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get low stock items
  async getLowStockItems() {
    try {
      const response = await api.get('/warehouse/low-stock');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get inventory value
  async getInventoryValue() {
    try {
      const response = await api.get('/warehouse/value');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get inventory by category
  async getInventoryByCategory() {
    try {
      const response = await api.get('/warehouse/by-category');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get transaction history for item
  async getTransactionHistory(id, params = {}) {
    try {
      const response = await api.get(`/warehouse/${id}/transactions`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get inventory stats
  async getInventoryStats() {
    try {
      const response = await api.get('/warehouse/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Set alert level (admin only)
  async setAlertLevel(id, alertLevel) {
    try {
      const response = await api.put(`/warehouse/${id}/alert-level`, { alertLevel });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Bulk update items (admin only)
  async bulkUpdateItems(updates) {
    try {
      const response = await api.post('/warehouse/bulk-update', { updates });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Import inventory (admin only)
  async importInventory(items) {
    try {
      const response = await api.post('/warehouse/import', { items });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Export inventory (admin only)
  async exportInventory(params = {}) {
    try {
      const response = await api.get('/warehouse/export/all', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Search inventory
  async searchInventory(query) {
    try {
      const response = await api.get('/warehouse/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get inventory by location
  async getByLocation(aisle, shelf = null) {
    try {
      const params = { aisle };
      if (shelf) params.shelf = shelf;
      
      const response = await api.get('/warehouse/by-location', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get expiring items
  async getExpiringItems(days = 30) {
    try {
      const response = await api.get('/warehouse/expiring', {
        params: { days }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Receive stock (admin only)
  async receiveStock(id, quantity, batchNumber, expiryDate = null) {
    try {
      const response = await api.post(`/warehouse/${id}/receive`, {
        quantity,
        batchNumber,
        expiryDate
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Transfer stock between locations
  async transferStock(id, quantity, fromLocation, toLocation) {
    try {
      const response = await api.post(`/warehouse/${id}/transfer`, {
        quantity,
        fromLocation,
        toLocation
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Adjust stock (admin only)
  async adjustStock(id, quantity, reason) {
    try {
      const response = await api.post(`/warehouse/${id}/adjust`, {
        quantity,
        reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get stock movement report
  async getStockMovementReport(startDate, endDate, params = {}) {
    try {
      const response = await api.get('/warehouse/reports/movement', {
        params: { startDate, endDate, ...params }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get valuation report
  async getValuationReport() {
    try {
      const response = await api.get('/warehouse/reports/valuation');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get reorder suggestions
  async getReorderSuggestions() {
    try {
      const response = await api.get('/warehouse/reorder-suggestions');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Create purchase order
  async createPurchaseOrder(items, supplierId) {
    try {
      const response = await api.post('/warehouse/purchase-order', {
        items,
        supplierId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get suppliers
  async getSuppliers() {
    try {
      const response = await api.get('/warehouse/suppliers');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Add supplier
  async addSupplier(supplierData) {
    try {
      const response = await api.post('/warehouse/suppliers', supplierData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update supplier
  async updateSupplier(id, supplierData) {
    try {
      const response = await api.put(`/warehouse/suppliers/${id}`, supplierData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete supplier
  async deleteSupplier(id) {
    try {
      const response = await api.delete(`/warehouse/suppliers/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get categories
  async getCategories() {
    try {
      const response = await api.get('/warehouse/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Add category
  async addCategory(categoryData) {
    try {
      const response = await api.post('/warehouse/categories', categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update category
  async updateCategory(id, categoryData) {
    try {
      const response = await api.put(`/warehouse/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete category
  async deleteCategory(id) {
    try {
      const response = await api.delete(`/warehouse/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get inventory turnover
  async getInventoryTurnover(startDate, endDate) {
    try {
      const response = await api.get('/warehouse/analytics/turnover', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get ABC analysis
  async getABCAnalysis() {
    try {
      const response = await api.get('/warehouse/analytics/abc');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get inventory forecast
  async getInventoryForecast(itemId, months = 3) {
    try {
      const response = await api.get('/warehouse/analytics/forecast', {
        params: { itemId, months }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new WarehouseService();