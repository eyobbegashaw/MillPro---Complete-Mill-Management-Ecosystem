import api from './api';

class ProductService {
  // Get all products
  async getProducts(params = {}) {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get single product
  async getProduct(id) {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Create product (admin only)
  async createProduct(productData, images = []) {
    try {
      const formData = new FormData();
      
      // Append product data
      Object.keys(productData).forEach(key => {
        if (productData[key] !== undefined && productData[key] !== null) {
          formData.append(key, productData[key]);
        }
      });

      // Append images
      images.forEach((image, index) => {
        formData.append('images', image);
      });

      const response = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update product (admin only)
  async updateProduct(id, productData, newImages = [], imagesToRemove = []) {
    try {
      const formData = new FormData();
      
      // Append product data
      Object.keys(productData).forEach(key => {
        if (productData[key] !== undefined && productData[key] !== null) {
          formData.append(key, productData[key]);
        }
      });

      // Append new images
      newImages.forEach((image, index) => {
        formData.append('newImages', image);
      });

      // Append images to remove
      imagesToRemove.forEach((imageUrl, index) => {
        formData.append('removeImages[]', imageUrl);
      });

      const response = await api.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete product (admin only)
  async deleteProduct(id) {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Toggle product post status
  async togglePost(id) {
    try {
      const response = await api.put(`/products/${id}/toggle-post`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Toggle featured status
  async toggleFeatured(id) {
    try {
      const response = await api.put(`/products/${id}/toggle-featured`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get categories
  async getCategories() {
    try {
      const response = await api.get('/products/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Search products
  async searchProducts(query, params = {}) {
    try {
      const response = await api.get('/products/search', {
        params: { q: query, ...params }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Add rating/review
  async addRating(id, rating, review = '') {
    try {
      const response = await api.post(`/products/${id}/rate`, { rating, review });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get product reviews
  async getReviews(id, params = {}) {
    try {
      const response = await api.get(`/products/${id}/reviews`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get product stats (admin only)
  async getProductStats() {
    try {
      const response = await api.get('/products/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get low stock alerts (admin only)
  async getLowStockAlerts() {
    try {
      const response = await api.get('/products/low-stock');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Bulk update products (admin only)
  async bulkUpdate(updates) {
    try {
      const response = await api.put('/products/bulk-update', { updates });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Import products (admin only)
  async importProducts(products) {
    try {
      const response = await api.post('/products/import', { products });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Export products (admin only)
  async exportProducts(params = {}) {
    try {
      const response = await api.get('/products/export', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Clone product (admin only)
  async cloneProduct(id) {
    try {
      const response = await api.post(`/products/${id}/clone`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get related products
  async getRelatedProducts(id, limit = 4) {
    try {
      const response = await api.get(`/products/${id}/related`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get featured products
  async getFeatured(limit = 8) {
    try {
      const response = await api.get('/products/featured', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get new arrivals
  async getNewArrivals(limit = 8) {
    try {
      const response = await api.get('/products/new-arrivals', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get products by category
  async getByCategory(category, params = {}) {
    try {
      const response = await api.get(`/products/category/${category}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get price range for category
  async getPriceRange(category) {
    try {
      const response = await api.get(`/products/price-range/${category}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Check availability
  async checkAvailability(id, quantity) {
    try {
      const response = await api.get(`/products/${id}/availability`, {
        params: { quantity }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get product recommendations
  async getRecommendations(limit = 6) {
    try {
      const response = await api.get('/products/recommendations', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Upload product images
  async uploadImages(id, images) {
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append('images', image);
      });

      const response = await api.post(`/products/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete product image
  async deleteImage(id, imageUrl) {
    try {
      const response = await api.delete(`/products/${id}/images`, {
        data: { imageUrl }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Set primary image
  async setPrimaryImage(id, imageUrl) {
    try {
      const response = await api.put(`/products/${id}/images/primary`, { imageUrl });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get product by barcode/SKU
  async getByBarcode(barcode) {
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Generate barcode
  async generateBarcode(id) {
    try {
      const response = await api.post(`/products/${id}/generate-barcode`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new ProductService();