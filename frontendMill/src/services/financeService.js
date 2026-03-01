import api from './api';

class FinanceService {
  // Get financial summary
  async getSummary(params = {}) {
    try {
      const response = await api.get('/finance/summary', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get income vs expenses
  async getIncomeExpense(params = {}) {
    try {
      const response = await api.get('/finance/income-expense', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get profit/loss report
  async getProfitLoss(params = {}) {
    try {
      const response = await api.get('/finance/profit-loss', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get expenses list
  async getExpenses(params = {}) {
    try {
      const response = await api.get('/finance/expenses', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Add expense
  async addExpense(expenseData) {
    try {
      const response = await api.post('/finance/expenses', expenseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update expense
  async updateExpense(id, expenseData) {
    try {
      const response = await api.put(`/finance/expenses/${id}`, expenseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete expense
  async deleteExpense(id) {
    try {
      const response = await api.delete(`/finance/expenses/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get expense categories
  async getExpenseCategories() {
    try {
      const response = await api.get('/finance/expenses/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get monthly report
  async getMonthlyReport(year, month) {
    try {
      const response = await api.get(`/finance/reports/monthly/${year}/${month}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get yearly report
  async getYearlyReport(year) {
    try {
      const response = await api.get(`/finance/reports/yearly/${year}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get tax report
  async getTaxReport(year) {
    try {
      const response = await api.get(`/finance/reports/tax/${year}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Export financial data
  async exportData(params = {}) {
    try {
      const response = await api.get('/finance/export', { 
        params,
        responseType: 'blob' 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get revenue by period
  async getRevenueByPeriod(period, year) {
    try {
      const response = await api.get('/finance/revenue/by-period', {
        params: { period, year }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get top expenses
  async getTopExpenses(limit = 10) {
    try {
      const response = await api.get('/finance/expenses/top', { 
        params: { limit } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get cash flow
  async getCashFlow(params = {}) {
    try {
      const response = await api.get('/finance/cash-flow', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get financial ratios
  async getFinancialRatios(params = {}) {
    try {
      const response = await api.get('/finance/ratios', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get budget vs actual
  async getBudgetVariance(params = {}) {
    try {
      const response = await api.get('/finance/budget-variance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Create budget
  async createBudget(budgetData) {
    try {
      const response = await api.post('/finance/budget', budgetData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update budget
  async updateBudget(id, budgetData) {
    try {
      const response = await api.put(`/finance/budget/${id}`, budgetData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get budget list
  async getBudgets(params = {}) {
    try {
      const response = await api.get('/finance/budgets', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get invoice list
  async getInvoices(params = {}) {
    try {
      const response = await api.get('/finance/invoices', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Generate invoice
  async generateInvoice(orderId) {
    try {
      const response = await api.post('/finance/invoices/generate', { orderId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Download invoice
  async downloadInvoice(invoiceId) {
    try {
      const response = await api.get(`/finance/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get tax summary
  async getTaxSummary(year) {
    try {
      const response = await api.get('/finance/tax/summary', { 
        params: { year } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // File tax return
  async fileTaxReturn(taxData) {
    try {
      const response = await api.post('/finance/tax/file', taxData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new FinanceService();