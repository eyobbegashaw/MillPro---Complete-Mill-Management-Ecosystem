const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin, isOperator, isAdminOrOperator } = require('../middleware/roleCheck');
const { validateWarehouseItem, validateIdParam, validatePagination } = require('../middleware/validation');
const {
  getItems,
  getItem,
  addItem,
  updateItem,
  deleteItem,
  updateQuantity,
  getLowStockItems,
  getInventoryValue,
  getInventoryByCategory,
  getTransactionHistory,
  bulkUpdateItems,
  importInventory,
  exportInventory,
  getInventoryStats,
  setAlertLevel
} = require('../controllers/warehouseController');

// All warehouse routes require authentication
router.use(protect);

// Read routes (accessible by admin and operator)
router.get('/', isAdminOrOperator, validatePagination, getItems);
router.get('/low-stock', isAdminOrOperator, getLowStockItems);
router.get('/value', isAdminOrOperator, getInventoryValue);
router.get('/by-category', isAdminOrOperator, getInventoryByCategory);
router.get('/stats', isAdminOrOperator, getInventoryStats);
router.get('/:id', isAdminOrOperator, validateIdParam, getItem);
router.get('/:id/transactions', isAdminOrOperator, validateIdParam, getTransactionHistory);

// Write routes (admin only)
router.post('/', isAdmin, validateWarehouseItem, addItem);
router.put('/:id', isAdmin, validateIdParam, validateWarehouseItem, updateItem);
router.delete('/:id', isAdmin, validateIdParam, deleteItem);
router.put('/:id/quantity', isAdmin, validateIdParam, updateQuantity);
router.put('/:id/alert-level', isAdmin, validateIdParam, setAlertLevel);
router.post('/bulk-update', isAdmin, bulkUpdateItems);
router.post('/import', isAdmin, importInventory);
router.get('/export/all', isAdmin, exportInventory);

module.exports = router;