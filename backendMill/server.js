require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');

// Import utilities
const logger = require('./src/utils/logger');
const { NODE_ENV, HTTP_STATUS } = require('./src/utils/constants');
const database = require('./src/config/database');
const backupJob = require('./src/jobs/backup');
const notificationCleanupJob = require('./src/jobs/notificationCleanup');
const reportGeneratorJob = require('./src/jobs/reportGenerator');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./src/middleware/rateLimiter');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Make io accessible to routes
app.set('io', io);

// Database connection
database.connect()
  .then(() => {
    logger.systemLogger('Database connected successfully', 'info');
    
    // Start scheduled jobs after database connection
    if (process.env.NODE_ENV !== NODE_ENV.TEST) {
      backupJob.scheduleBackups();
      notificationCleanupJob.scheduleCleanup();
      reportGeneratorJob.scheduleReports();
      logger.systemLogger('Scheduled jobs started', 'info');
    }
  })
  .catch((err) => {
    logger.systemLogger('Database connection failed', 'error', { error: err.message });
    process.exit(1);
  });

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      connectSrc: ["'self'", process.env.API_URL || 'http://localhost:5000']
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 100 * 1000, // 100kb
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // 10 minutes
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  immutable: true
}));
app.use('/reports', express.static(path.join(__dirname, 'reports'), {
  maxAge: '1d'
}));

// Request logging
if (process.env.NODE_ENV !== NODE_ENV.PRODUCTION) {
  app.use(morgan('dev', {
    stream: { write: (message) => logger.http(message.trim()) }
  }));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
    skip: (req, res) => res.statusCode < 400
  }));
}

// Custom request logger
app.use(logger.requestLogger);

// Rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/warehouse', require('./src/routes/warehouseRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));
app.use('/api/finance', require('./src/routes/financeRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/drivers', require('./src/routes/driverRoutes'));
app.use('/api/deliveries', require('./src/routes/deliveryRoutes'));

// Socket.io connection handling
require('./src/socket')(io);

// Error handling middleware
app.use(logger.errorLogger);
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.systemLogger(`Received ${signal}, starting graceful shutdown...`, 'info');
  
  // Close server
  server.close(async () => {
    logger.systemLogger('HTTP server closed', 'info');
    
    // Close database connection
    try {
      await database.disconnect();
      logger.systemLogger('Database connection closed', 'info');
    } catch (err) {
      logger.systemLogger('Error closing database connection', 'error', { error: err.message });
    }
    
    // Close other connections (Redis, etc.)
    logger.systemLogger('Graceful shutdown completed', 'info');
    process.exit(0);
  });

  // Force close after timeout
  setTimeout(() => {
    logger.systemLogger('Forced shutdown due to timeout', 'error');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.systemLogger('Uncaught Exception', 'error', {
    error: err.message,
    stack: err.stack,
    name: err.name
  });
  
  // Gracefully shutdown on uncaught exceptions
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.systemLogger('Unhandled Rejection', 'error', {
    reason: reason?.message || reason,
    promise
  });
  
  // Gracefully shutdown on unhandled rejections
  gracefulShutdown('unhandledRejection');
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  logger.systemLogger(`Server started`, 'info', {
    port: PORT,
    host: HOST,
    environment: process.env.NODE_ENV,
    apiUrl: `http://localhost:${PORT}/api`,
    clientUrl: process.env.CLIENT_URL,
    nodeVersion: process.version,
    pid: process.pid
  });
  
  // Create required directories
  const dirs = [
    'uploads/products',
    'uploads/avatars',
    'uploads/driver-licenses',
    'uploads/vehicle-docs',
    'uploads/delivery-photos',
    'uploads/signatures',
    'uploads/invoices',
    'reports',
    'logs',
    'backups'
  ];
  
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.systemLogger(`Created directory: ${dir}`, 'info');
    }
  });
});

// Export for testing
module.exports = { app, server, io };