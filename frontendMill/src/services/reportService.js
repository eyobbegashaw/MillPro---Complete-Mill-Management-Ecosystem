import api from './api';

class ReportService {
  // Generate custom report
  async generateReport(type, startDate, endDate, format = 'pdf', filters = {}) {
    try {
      const response = await api.post('/reports/generate', {
        type,
        startDate,
        endDate,
        format,
        filters
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Generate sales report
  async generateSalesReport(startDate, endDate, format = 'pdf') {
    try {
      const response = await api.post('/reports/sales', {
        startDate,
        endDate,
        format
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Generate inventory report
  async generateInventoryReport(format = 'pdf') {
    try {
      const response = await api.post('/reports/inventory', { format });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Generate financial report
  async generateFinancialReport(startDate, endDate, format = 'pdf') {
    try {
      const response = await api.post('/reports/financial', {
        startDate,
        endDate,
        format
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Generate customer report
  async generateCustomerReport(startDate, endDate, format = 'pdf') {
    try {
      const response = await api.post('/reports/customer', {
        startDate,
        endDate,
        format
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Generate operator report
  async generateOperatorReport(startDate, endDate, format = 'pdf') {
    try {
      const response = await api.post('/reports/operator', {
        startDate,
        endDate,
        format
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Generate delivery report
  async generateDeliveryReport(startDate, endDate, format = 'pdf') {
    try {
      const response = await api.post('/reports/delivery', {
        startDate,
        endDate,
        format
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get all reports
  async getReports(params = {}) {
    try {
      const response = await api.get('/reports', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get single report
  async getReport(id) {
    try {
      const response = await api.get(`/reports/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete report
  async deleteReport(id) {
    try {
      const response = await api.delete(`/reports/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Download report
  async downloadReport(id) {
    try {
      const response = await api.get(`/reports/${id}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Schedule report
  async scheduleReport(type, frequency, recipients, format = 'pdf', filters = {}) {
    try {
      const response = await api.post('/reports/schedule', {
        type,
        frequency,
        recipients,
        format,
        filters
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get scheduled reports
  async getScheduledReports() {
    try {
      const response = await api.get('/reports/scheduled/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Cancel scheduled report
  async cancelScheduledReport(id) {
    try {
      const response = await api.delete(`/reports/schedule/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get report templates
  async getReportTemplates() {
    try {
      const response = await api.get('/reports/templates/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Save report template
  async saveReportTemplate(name, type, config) {
    try {
      const response = await api.post('/reports/templates', {
        name,
        type,
        config
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get report statistics
  async getReportStats() {
    try {
      const response = await api.get('/reports/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Export report data
  async exportData(type, startDate, endDate, format = 'csv') {
    try {
      const response = await api.get('/reports/export', {
        params: { type, startDate, endDate, format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get sales analytics
  async getSalesAnalytics(params = {}) {
    try {
      const response = await api.get('/reports/analytics/sales', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get inventory analytics
  async getInventoryAnalytics(params = {}) {
    try {
      const response = await api.get('/reports/analytics/inventory', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get customer analytics
  async getCustomerAnalytics(params = {}) {
    try {
      const response = await api.get('/reports/analytics/customer', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get financial analytics
  async getFinancialAnalytics(params = {}) {
    try {
      const response = await api.get('/reports/analytics/financial', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(params = {}) {
    try {
      const response = await api.get('/reports/performance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Generate daily report
  async generateDailyReport(date = new Date()) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    return this.generateSalesReport(startDate, endDate);
  }

  // Generate weekly report
  async generateWeeklyReport(date = new Date()) {
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    return this.generateSalesReport(startDate, endDate);
  }

  // Generate monthly report
  async generateMonthlyReport(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.generateSalesReport(startDate, endDate);
  }

  // Generate quarterly report
  async generateQuarterlyReport(year, quarter) {
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);

    return this.generateSalesReport(startDate, endDate);
  }

  // Generate yearly report
  async generateYearlyReport(year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    return this.generateSalesReport(startDate, endDate);
  }

  // Get report preview
  async getPreview(type, params = {}) {
    try {
      const response = await api.get('/reports/preview', {
        params: { type, ...params }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Send report by email
  async sendReportByEmail(reportId, emails) {
    try {
      const response = await api.post(`/reports/${reportId}/send`, { emails });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Compare reports
  async compareReports(reportIds) {
    try {
      const response = await api.post('/reports/compare', { reportIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get report history
  async getReportHistory(params = {}) {
    try {
      const response = await api.get('/reports/history', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new ReportService();