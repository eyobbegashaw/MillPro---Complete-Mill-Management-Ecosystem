const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin, isAdminOrOperator } = require('../middleware/roleCheck');
const { validateIdParam, validatePagination } = require('../middleware/validation');
const {
  getFinancialSummary,
  getIncomeExpense,
  getProfitLoss,
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  getMonthlyReport,
  getYearlyReport,
  getTaxReport,
  exportFinancialData
} = require('../controllers/financeController');

// All finance routes require authentication and admin/operator role
router.use(protect);
router.use(isAdminOrOperator);

// Summary routes
router.get('/summary', getFinancialSummary);
router.get('/income-expense', getIncomeExpense);
router.get('/profit-loss', getProfitLoss);

// Expense routes
router.get('/expenses', validatePagination, getExpenses);
router.post('/expenses', addExpense);
router.put('/expenses/:id', validateIdParam, updateExpense);
router.delete('/expenses/:id', isAdmin, validateIdParam, deleteExpense);
router.get('/expenses/categories', getExpenseCategories);

// Report routes
router.get('/reports/monthly/:year/:month', getMonthlyReport);
router.get('/reports/yearly/:year', getYearlyReport);
router.get('/reports/tax/:year', getTaxReport);

// Export routes
router.get('/export', exportFinancialData);

module.exports = router;