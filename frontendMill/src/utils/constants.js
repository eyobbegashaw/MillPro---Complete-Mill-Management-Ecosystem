// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  CUSTOMER: 'customer',
  DRIVER: 'driver'
};

// Order Statuses
export const ORDER_STATUS = {
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
export const DELIVERY_STATUS = {
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
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CBE: 'cbe',
  TELEBIRR: 'telebirr',
  BANK: 'bank',
  CARD: 'card'
};

// Product Categories
export const PRODUCT_CATEGORIES = {
  GRAIN: 'Grain',
  LEGUME: 'Legume',
  OTHER: 'Other'
};

// Quality Grades
export const QUALITY_GRADES = {
  A: 'Grade A',
  B: 'Grade B',
  C: 'Grade C'
};

// Notification Types
export const NOTIFICATION_TYPES = {
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
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  LOCATION: 'location',
  ORDER_UPDATE: 'order_update',
  DELIVERY_UPDATE: 'delivery_update'
};

// Conversation Types
export const CONVERSATION_TYPES = {
  DIRECT: 'direct',
  GROUP: 'group',
  SUPPORT: 'support'
};

// Driver Statuses
export const DRIVER_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  ON_DELIVERY: 'on-delivery',
  OFFLINE: 'offline'
};

// Operator Statuses
export const OPERATOR_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  BREAK: 'break',
  OFFLINE: 'offline'
};

// Vehicle Types
export const VEHICLE_TYPES = {
  TRUCK: 'truck',
  VAN: 'van',
  MOTORCYCLE: 'motorcycle'
};

// Expense Categories
export const EXPENSE_CATEGORIES = {
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
export const REPORT_TYPES = {
  SALES: 'sales',
  INVENTORY: 'inventory',
  FINANCIAL: 'financial',
  CUSTOMER: 'customer',
  OPERATOR: 'operator',
  DELIVERY: 'delivery',
  CUSTOM: 'custom'
};

// Report Formats
export const REPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json'
};

// Schedule Frequencies
export const SCHEDULE_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly'
};

// Time Periods
export const TIME_PERIODS = {
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

// HTTP Status Codes
export const HTTP_STATUS = {
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

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  CART: 'cart',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS: 'notifications'
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY HH:mm',
  DISPLAY_SHORT: 'MMM DD',
  TIME: 'HH:mm',
  TIME_12H: 'hh:mm A',
  ISO: 'YYYY-MM-DD',
  ISO_TIME: 'YYYY-MM-DD HH:mm:ss',
  FILENAME: 'YYYY-MM-DD-HH-mm-ss',
  API: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};

// Currency
export const CURRENCY = {
  CODE: 'ETB',
  SYMBOL: 'Br',
  NAME: 'Ethiopian Birr',
  DECIMALS: 2
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  PAGE_SIZES: [10, 25, 50, 100]
};

// File Upload
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGES_PER_PRODUCT: 5,
  MAX_FILES_PER_MESSAGE: 3,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Map Defaults
export const MAP_DEFAULTS = {
  CENTER: { lat: 9.0245, lng: 38.7468 }, // Addis Ababa
  ZOOM: 12,
  MAX_ZOOM: 18,
  MIN_ZOOM: 5
};

// Delivery
export const DELIVERY = {
  BASE_FEE: 30,
  PER_KM_FEE: 5,
  MAX_FEE: 200,
  ESTIMATED_SPEED: 30, // km/h
  PICKUP_TIME: 15, // minutes
  DROPOFF_TIME: 10 // minutes
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 50,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_REGEX: /^\+251[97]\d{8}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  OBJECT_ID_REGEX: /^[0-9a-fA-F]{24}$/
};

// Socket Events
export const SOCKET_EVENTS = {
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

// App Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ABOUT: '/about',
  SERVICES: '/services',
  CONTACT: '/contact',
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_WAREHOUSE: '/admin/warehouse',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_OPERATORS: '/admin/operators',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_FINANCE: '/admin/finance',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_MESSAGES: '/admin/messages',
  ADMIN_DRIVERS: '/admin/drivers',
  
  // Customer routes
  CUSTOMER: '/customer',
  CUSTOMER_DASHBOARD: '/customer',
  CUSTOMER_PRODUCTS: '/customer/products',
  CUSTOMER_CART: '/customer/cart',
  CUSTOMER_ORDERS: '/customer/orders',
  CUSTOMER_SPECIAL: '/customer/special-orders',
  CUSTOMER_MESSAGES: '/customer/messages',
  CUSTOMER_SETTINGS: '/customer/settings',
  
  // Operator routes
  OPERATOR: '/operator',
  OPERATOR_DASHBOARD: '/operator',
  OPERATOR_ORDERS: '/operator/orders',
  OPERATOR_OFFLINE: '/operator/offline',
  OPERATOR_MESSAGES: '/operator/messages',
  OPERATOR_HISTORY: '/operator/history',
  OPERATOR_SETTINGS: '/operator/settings',
  
  // Driver routes
  DRIVER: '/driver',
  DRIVER_DASHBOARD: '/driver',
  DRIVER_TASKS: '/driver/tasks',
  DRIVER_ACTIVE: '/driver/active',
  DRIVER_HISTORY: '/driver/history',
  DRIVER_MESSAGES: '/driver/messages',
  DRIVER_SETTINGS: '/driver/settings'
};