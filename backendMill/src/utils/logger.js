const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { NODE_ENV } = require('./constants');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log formats
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'millpro-api' },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Write error logs to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Write debug logs to debug.log (only in development)
    ...(process.env.NODE_ENV === NODE_ENV.DEVELOPMENT ? [
      new winston.transports.File({
        filename: path.join(logDir, 'debug.log'),
        level: 'debug',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 3
      })
    ] : [])
  ]
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== NODE_ENV.PRODUCTION) {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Create request logger middleware
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?._id,
      userRole: req.user?.role
    };

    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request warning', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// Create error logger
logger.errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.originalUrl || req.url,
      body: req.body,
      params: req.params,
      query: req.query,
      userId: req.user?._id
    }
  });
  
  next(err);
};

// Create database query logger
logger.dbLogger = (collection, operation, query, duration, error = null) => {
  const logData = {
    collection,
    operation,
    query,
    duration: `${duration}ms`
  };

  if (error) {
    logData.error = error.message;
    logger.error('Database operation failed', logData);
  } else {
    logger.debug('Database operation', logData);
  }
};

// Create socket event logger
logger.socketLogger = (event, data, socketId, userId = null) => {
  logger.debug('Socket event', {
    event,
    socketId,
    userId,
    data
  });
};

// Create performance logger
logger.performanceLogger = (operation, duration, metadata = {}) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    ...metadata
  };

  if (duration > 1000) {
    logger.warn('Slow operation detected', logData);
  } else {
    logger.debug('Performance', logData);
  }
};

// Create audit logger
logger.auditLogger = async (action, userId, details, ip = null) => {
  try {
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      action,
      user: userId,
      details,
      ip,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to create audit log', { error, action, userId });
  }

  logger.info('Audit', { action, userId, details, ip });
};

// Create security logger
logger.securityLogger = (event, userId, details, ip = null) => {
  logger.warn('Security event', {
    event,
    userId,
    details,
    ip,
    timestamp: new Date().toISOString()
  });
};

// Create payment logger
logger.paymentLogger = (event, paymentId, amount, status, metadata = {}) => {
  const logData = {
    event,
    paymentId,
    amount,
    status,
    ...metadata
  };

  if (status === 'failed') {
    logger.error('Payment failed', logData);
  } else {
    logger.info('Payment', logData);
  }
};

// Create order logger
logger.orderLogger = (event, orderId, customerId, status, metadata = {}) => {
  logger.info('Order', {
    event,
    orderId,
    customerId,
    status,
    ...metadata
  });
};

// Create delivery logger
logger.deliveryLogger = (event, deliveryId, driverId, status, metadata = {}) => {
  logger.info('Delivery', {
    event,
    deliveryId,
    driverId,
    status,
    ...metadata
  });
};

// Create API call logger
logger.apiLogger = (service, endpoint, method, duration, status, metadata = {}) => {
  const logData = {
    service,
    endpoint,
    method,
    duration: `${duration}ms`,
    status,
    ...metadata
  };

  if (status >= 400) {
    logger.error('External API call failed', logData);
  } else {
    logger.debug('External API call', logData);
  }
};

// Create user activity logger
logger.userActivityLogger = (userId, action, metadata = {}) => {
  logger.info('User activity', {
    userId,
    action,
    ...metadata,
    timestamp: new Date().toISOString()
  });
};

// Create system logger
logger.systemLogger = (event, level = 'info', metadata = {}) => {
  logger.log(level, 'System', {
    event,
    ...metadata,
    timestamp: new Date().toISOString()
  });
};

// Create batch job logger
logger.jobLogger = (jobName, status, duration, metadata = {}) => {
  const logData = {
    job: jobName,
    status,
    duration: duration ? `${duration}ms` : undefined,
    ...metadata
  };

  if (status === 'failed') {
    logger.error('Job failed', logData);
  } else {
    logger.info('Job completed', logData);
  }
};

// Create cache logger
logger.cacheLogger = (operation, key, hit = false, duration = null) => {
  logger.debug('Cache', {
    operation,
    key,
    hit,
    duration: duration ? `${duration}ms` : undefined
  });
};

// Get logs for admin
logger.getLogs = async (options = {}) => {
  const {
    level = 'info',
    from = new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    to = new Date(),
    limit = 100,
    offset = 0,
    search = null
  } = options;

  try {
    // This is a simplified version - in production you might want to read from files or database
    const logFile = path.join(logDir, `${level}.log`);
    
    if (!fs.existsSync(logFile)) {
      return { logs: [], total: 0 };
    }

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const logs = lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      })
      .filter(log => {
        if (!log.timestamp) return true;
        const logTime = new Date(log.timestamp);
        return logTime >= from && logTime <= to;
      })
      .filter(log => {
        if (!search) return true;
        const logStr = JSON.stringify(log).toLowerCase();
        return logStr.includes(search.toLowerCase());
      })
      .reverse()
      .slice(offset, offset + limit);

    return {
      logs,
      total: lines.length,
      offset,
      limit,
      hasMore: offset + limit < lines.length
    };
  } catch (error) {
    logger.error('Failed to get logs', { error });
    return { logs: [], total: 0 };
  }
};

// Create child logger with context
logger.child = (context) => {
  return logger.child(context);
};

// Export logger
module.exports = logger;