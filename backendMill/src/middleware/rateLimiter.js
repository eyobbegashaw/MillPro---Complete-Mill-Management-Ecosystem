const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');

// General API rate limiter
const apiLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    expireTimeMs: 15 * 60 * 1000 // 15 minutes
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    expireTimeMs: 60 * 60 * 1000 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login/register attempts per hour
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after an hour'
  }
});

// Order creation rate limiter
const orderLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    expireTimeMs: 60 * 60 * 1000 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 orders per hour
  message: {
    success: false,
    message: 'Order creation limit reached, please try again later'
  }
});

// Message rate limiter
const messageLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    expireTimeMs: 60 * 1000 // 1 minute
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 messages per minute
  message: {
    success: false,
    message: 'Message limit reached, please slow down'
  }
});

// Location update rate limiter (for drivers)
const locationLimiter = rateLimit({
  store: new MongoStore({
    uri: process.env.MONGODB_URI,
    expireTimeMs: 60 * 1000 // 1 minute
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 location updates per minute (once per second)
  message: {
    success: false,
    message: 'Location update limit reached'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  orderLimiter,
  messageLimiter,
  locationLimiter
};