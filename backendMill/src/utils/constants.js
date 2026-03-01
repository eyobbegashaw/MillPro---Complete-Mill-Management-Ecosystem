// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  CUSTOMER: 'customer',
  DRIVER: 'driver'
};

// Order Statuses
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  READY: 'ready',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked-up',
  IN_TRANSIT: 'in-transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  COMPLETED: 'completed'
};

// Delivery Statuses
const DELIVERY_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKUP_ARRIVED: 'pickup-arrived',
  PICKED_UP: 'picked-up',
  IN_TRANSIT: 'in-transit',
  DELIVERY_ARRIVED: 'delivery-arrived',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Payment Statuses
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

// Payment Methods
const PAYMENT_METHODS = {
  CASH: 'cash',
  CBE: 'cbe',
  TELEBIRR: 'telebirr',
  BANK: 'bank',
  CARD: 'card'
};

// Product Categories
const PRODUCT_CATEGORIES = {
  GRAIN: 'Grain',
  LEGUME: 'Legume',
  OTHER: 'Other'
};

// Quality Grades
const QUALITY_GRADES = {
  A: 'Grade A',
  B: 'Grade B',
  C: 'Grade C'
};

// Notification Types
const NOTIFICATION_TYPES = {
  ORDER: 'order',
  DELIVERY: 'delivery',
  MESSAGE: 'message',
  INVENTORY: 'inventory',
  PAYMENT: 'payment',
  SYSTEM: 'system',
  PROMOTION: 'promotion',
  ALERT: 'alert'
};

// Notification Priorities
const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Message Types
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  LOCATION: 'location',
  ORDER_UPDATE: 'order_update',
  DELIVERY_UPDATE: 'delivery_update'
};

// Conversation Types
const CONVERSATION_TYPES = {
  DIRECT: 'direct',
  GROUP: 'group',
  SUPPORT: 'support'
};

// Driver Statuses
const DRIVER_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  ON_DELIVERY: 'on-delivery',
  OFFLINE: 'offline'
};

// Operator Statuses
const OPERATOR_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  BREAK: 'break',
  OFFLINE: 'offline'
};

// Vehicle Types
const VEHICLE_TYPES = {
  TRUCK: 'truck',
  VAN: 'van',
  MOTORCYCLE: 'motorcycle'
};

// Expense Categories
const EXPENSE_CATEGORIES = {
  SALARIES: 'salaries',
  RENT: 'rent',
  UTILITIES: 'utilities',
  MAINTENANCE: 'maintenance',
  TRANSPORT: 'transport',
  SUPPLIES: 'supplies',
  MARKETING: 'marketing',
  INSURANCE: 'insurance',
  TAX: 'tax',
  OTHER: 'other'
};

// Report Types
const REPORT_TYPES = {
  SALES: 'sales',
  INVENTORY: 'inventory',
  FINANCIAL: 'financial',
  CUSTOMER: 'customer',
  OPERATOR: 'operator',
  DELIVERY: 'delivery',
  CUSTOM: 'custom'
};

// Report Formats
const REPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json'
};

// Schedule Frequencies
const SCHEDULE_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly'
};

// Time Periods
const TIME_PERIODS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom'
};

// Sort Orders
const SORT_ORDERS = {
  ASC: 1,
  DESC: -1
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error Messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  DUPLICATE_ENTRY: 'Duplicate entry found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed attempts',
  ACCOUNT_INACTIVE: 'Account is inactive. Please contact support',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  INSUFFICIENT_STOCK: 'Insufficient stock available',
  PAYMENT_FAILED: 'Payment processing failed',
  ORDER_NOT_FOUND: 'Order not found',
  PRODUCT_NOT_FOUND: 'Product not found',
  USER_NOT_FOUND: 'User not found',
  DELIVERY_NOT_FOUND: 'Delivery not found'
};

// Success Messages
const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',
  PAYMENT_SUCCESS: 'Payment processed successfully',
  PAYMENT_REFUNDED: 'Payment refunded successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  MESSAGE_SENT: 'Message sent successfully',
  DELIVERY_UPDATED: 'Delivery status updated',
  PRODUCT_ADDED: 'Product added successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully'
};

// File Upload Limits
const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGES_PER_PRODUCT: 5,
  MAX_FILES_PER_MESSAGE: 3
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Cache Keys
const CACHE_KEYS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
  USER_PROFILE: (userId) => `user:${userId}:profile`,
  USER_PERMISSIONS: (userId) => `user:${userId}:permissions`,
  ORDER: (orderId) => `order:${orderId}`,
  DELIVERY: (deliveryId) => `delivery:${deliveryId}`
};

// Socket Events
const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Order events
  ORDER_CREATED: 'order-created',
  ORDER_UPDATED: 'order-updated',
  ORDER_STATUS_CHANGED: 'order-status-changed',
  
  // Delivery events
  DELIVERY_ASSIGNED: 'delivery-assigned',
  DELIVERY_UPDATED: 'delivery-updated',
  DRIVER_LOCATION_UPDATED: 'driver-location-updated',
  
  // Message events
  NEW_MESSAGE: 'new-message',
  MESSAGE_READ: 'message-read',
  TYPING: 'typing',
  
  // Notification events
  NOTIFICATION: 'notification',
  
  // Tracking events
  TRACK_DELIVERY: 'track-delivery',
  TRACKING_UPDATE: 'tracking-update'
};

// Queue Names
const QUEUES = {
  EMAIL: 'email',
  SMS: 'sms',
  NOTIFICATION: 'notification',
  REPORT: 'report',
  BACKUP: 'backup',
  CLEANUP: 'cleanup'
};

// Job Names
const JOB_NAMES = {
  SEND_EMAIL: 'send-email',
  SEND_SMS: 'send-sms',
  SEND_NOTIFICATION: 'send-notification',
  GENERATE_REPORT: 'generate-report',
  CREATE_BACKUP: 'create-backup',
  CLEANUP_NOTIFICATIONS: 'cleanup-notifications',
  UPDATE_INVENTORY: 'update-inventory'
};

// Environment
const NODE_ENV = {
  DEVELOPMENT: 'development',
  TEST: 'test',
  PRODUCTION: 'production'
};

// Date Formats
const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY HH:mm',
  TIME: 'HH:mm',
  FILENAME: 'YYYY-MM-DD-HH-mm-ss'
};

// Regular Expressions
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_ETHIOPIA: /^\+251[97]\d{8}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
  ONLY_NUMBERS: /^\d+$/,
  ONLY_LETTERS: /^[A-Za-z]+$/,
  ALPHANUMERIC: /^[A-Za-z0-9]+$/,
  OBJECT_ID: /^[0-9a-fA-F]{24}$/
};

// Default Settings
const DEFAULT_SETTINGS = {
  THEME: 'light',
  LANGUAGE: 'en',
  NOTIFICATIONS: {
    email: true,
    sms: false,
    push: true
  },
  CURRENCY: 'ETB',
  TIMEZONE: 'Africa/Addis_Ababa'
};

// Distance Units
const DISTANCE_UNITS = {
  KM: 'km',
  M: 'm'
};

// Weight Units
const WEIGHT_UNITS = {
  KG: 'kg',
  G: 'g',
  TON: 'ton'
};

module.exports = {
  USER_ROLES,
  ORDER_STATUS,
  DELIVERY_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  PRODUCT_CATEGORIES,
  QUALITY_GRADES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  MESSAGE_TYPES,
  CONVERSATION_TYPES,
  DRIVER_STATUS,
  OPERATOR_STATUS,
  VEHICLE_TYPES,
  EXPENSE_CATEGORIES,
  REPORT_TYPES,
  REPORT_FORMATS,
  SCHEDULE_FREQUENCIES,
  TIME_PERIODS,
  SORT_ORDERS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FILE_LIMITS,
  PAGINATION,
  CACHE_KEYS,
  SOCKET_EVENTS,
  QUEUES,
  JOB_NAMES,
  NODE_ENV,
  DATE_FORMATS,
  REGEX,
  DEFAULT_SETTINGS,
  DISTANCE_UNITS,
  WEIGHT_UNITS
};