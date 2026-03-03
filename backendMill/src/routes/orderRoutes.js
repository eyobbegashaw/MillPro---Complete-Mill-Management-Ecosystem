const express = require('express');
const router = express.Router();
const { protect,isAny } = require('../middleware/auth');

const { isAdmin, isOperator, isCustomer, isAdminOrOperator, isAssignedOperator } = require('../middleware/roleCheck');
const { validateOrder, validateIdParam, validatePagination } = require('../middleware/validation');
const { orderLimiter } = require('../middleware/rateLimiter');
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  assignOperator,
  assignDriver,
  cancelOrder,
  getCustomerOrders,
  getOperatorOrders,
  getOrderStats,
  trackOrder,
  addTrackingUpdate,
  getDeliveryStatus,
  rateOrder
} = require('../controllers/orderController');

// All order routes require authentication
router.use(protect);

// Public order routes (for customers)
router.post('/', isCustomer, orderLimiter, validateOrder, createOrder);
router.get('/my-orders', isCustomer, getCustomerOrders);
router.get('/track/:trackingNumber', trackOrder);

// Operator/Admin routes
router.get('/', isAdminOrOperator, validatePagination, getOrders);
router.get('/stats', isAdminOrOperator, getOrderStats);
router.get('/operator', isOperator, getOperatorOrders);

// Order details (accessible based on role)
router.get('/:id', validateIdParam, getOrder);

// Status updates (role-based)
router.put('/:id/status', isAdminOrOperator, validateIdParam, updateOrderStatus);
router.put('/:id/assign-operator', isAdmin, validateIdParam, assignOperator);
router.put('/:id/assign-driver', isAdminOrOperator, validateIdParam, assignDriver);
router.put('/:id/cancel', isAny, validateIdParam, cancelOrder);
router.put('/:id/tracking', isAssignedOperator, validateIdParam, addTrackingUpdate);
router.put('/:id/delivery-status', isAny, getDeliveryStatus);

// Customer actions
router.post('/:id/rate', isCustomer, validateIdParam, rateOrder);

module.exports = router;