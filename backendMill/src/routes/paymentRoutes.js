const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin, isCustomer, isAdminOrOperator } = require('../middleware/roleCheck');
const { validatePayment, validateIdParam, validatePagination } = require('../middleware/validation');
const {
  initiatePayment,
  processPayment,
  verifyPayment,
  getPayments,
  getPayment,
  getCustomerPayments,
  refundPayment,
  generateReceipt,
  getPaymentStats,
  getPaymentMethods,
  savePaymentMethod,
  deletePaymentMethod
} = require('../controllers/paymentController');

// All payment routes require authentication
router.use(protect);

// Customer payment routes
router.post('/initiate', isCustomer, validatePayment, initiatePayment);
router.post('/process', isCustomer, processPayment);
router.get('/verify/:reference', verifyPayment);
router.get('/my-payments', isCustomer, getCustomerPayments);
router.get('/methods', isCustomer, getPaymentMethods);
router.post('/methods', isCustomer, savePaymentMethod);
router.delete('/methods/:id', isCustomer, validateIdParam, deletePaymentMethod);

// Admin/Operator routes
router.get('/', isAdminOrOperator, validatePagination, getPayments);
router.get('/stats', isAdminOrOperator, getPaymentStats);
router.get('/:id', isAdminOrOperator, validateIdParam, getPayment);
router.post('/:id/refund', isAdmin, validateIdParam, refundPayment);
router.get('/:id/receipt', validateIdParam, generateReceipt);

module.exports = router;