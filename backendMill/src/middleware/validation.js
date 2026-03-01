const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validations
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
  body('phone')
    .optional()
    .matches(/^\+251[97]\d{8}$/).withMessage('Please enter a valid Ethiopian phone number (+2519/7XXXXXXXX)'),
  body('role')
    .optional()
    .isIn(['customer', 'operator', 'driver']).withMessage('Invalid role'),
  validate
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

// Product validations
const validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2 and 100 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Grain', 'Legume', 'Other']).withMessage('Invalid category'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('millingFee')
    .optional()
    .isFloat({ min: 0 }).withMessage('Milling fee must be greater than or equal to 0'),
  body('minQuantity')
    .optional()
    .isFloat({ min: 0.1 }).withMessage('Minimum quantity must be at least 0.1 kg'),
  validate
];

// Order validations
const validateOrder = [
  body('items')
    .isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId')
    .notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity')
    .isFloat({ min: 0.1 }).withMessage('Quantity must be at least 0.1 kg'),
  body('deliveryAddress')
    .notEmpty().withMessage('Delivery address is required'),
  body('payment.method')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['cash', 'cbe', 'telebirr', 'bank', 'card']).withMessage('Invalid payment method'),
  validate
];

// Warehouse validations
const validateWarehouseItem = [
  body('name')
    .trim()
    .notEmpty().withMessage('Item name is required'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Grain', 'Legume', 'Other']).withMessage('Invalid category'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isFloat({ min: 0 }).withMessage('Quantity must be greater than or equal to 0'),
  body('purchasePrice')
    .notEmpty().withMessage('Purchase price is required')
    .isFloat({ min: 0 }).withMessage('Purchase price must be greater than or equal to 0'),
  body('sellPrice')
    .notEmpty().withMessage('Sell price is required')
    .isFloat({ min: 0 }).withMessage('Sell price must be greater than or equal to 0'),
  body('alertLevel')
    .notEmpty().withMessage('Alert level is required')
    .isFloat({ min: 0 }).withMessage('Alert level must be greater than or equal to 0'),
  validate
];

// Driver validations
const validateDriver = [
  body('licenseNumber')
    .notEmpty().withMessage('License number is required'),
  body('licenseExpiry')
    .notEmpty().withMessage('License expiry date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('vehicle.type')
    .notEmpty().withMessage('Vehicle type is required')
    .isIn(['truck', 'van', 'motorcycle']).withMessage('Invalid vehicle type'),
  body('vehicle.plateNumber')
    .notEmpty().withMessage('Plate number is required'),
  validate
];

// Message validations
const validateMessage = [
  body('receiverId')
    .notEmpty().withMessage('Receiver ID is required'),
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
  validate
];

// Payment validations
const validatePayment = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('method')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['cash', 'cbe', 'telebirr', 'bank', 'card']).withMessage('Invalid payment method'),
  validate
];

// ID param validation
const validateIdParam = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  validate
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate
];

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  validateProduct,
  validateOrder,
  validateWarehouseItem,
  validateDriver,
  validateMessage,
  validatePayment,
  validateIdParam,
  validatePagination
};