module.exports = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    algorithm: 'HS256'
  },

  // Google OAuth Configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  },

  // Password Configuration
  password: {
    minLength: 6,
    maxLength: 50,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
    bcryptRounds: 10
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'session-secret-key-change-in-production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  },

  // Rate Limiting for Auth
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later'
  },

  // Account Lockout
  lockout: {
    maxAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15 minutes
    incrementOnFailure: true
  },

  // Email Verification
  emailVerification: {
    enabled: true,
    tokenExpiresIn: 24 * 60 * 60 * 1000, // 24 hours
    baseUrl: process.env.CLIENT_URL || 'http://localhost:3000'
  },

  // Password Reset
  passwordReset: {
    tokenExpiresIn: 1 * 60 * 60 * 1000, // 1 hour
    baseUrl: process.env.CLIENT_URL || 'http://localhost:3000'
  },

  // Two-Factor Authentication
  twoFactor: {
    enabled: true,
    appName: 'MillPro',
    issuer: 'MillPro Systems',
    digits: 6,
    step: 30, // seconds
    window: 1
  },

  // Roles and Permissions
  roles: {
    admin: {
      permissions: [
        'users:read',
        'users:write',
        'users:delete',
        'orders:read',
        'orders:write',
        'orders:delete',
        'products:read',
        'products:write',
        'products:delete',
        'warehouse:read',
        'warehouse:write',
        'warehouse:delete',
        'finance:read',
        'finance:write',
        'reports:read',
        'reports:generate',
        'settings:read',
        'settings:write',
        'drivers:read',
        'drivers:write',
        'drivers:delete'
      ]
    },
    operator: {
      permissions: [
        'orders:read',
        'orders:write',
        'products:read',
        'warehouse:read',
        'warehouse:write',
        'customers:read'
      ]
    },
    driver: {
      permissions: [
        'deliveries:read',
        'deliveries:write',
        'orders:read'
      ]
    },
    customer: {
      permissions: [
        'orders:read',
        'orders:write',
        'products:read',
        'profile:read',
        'profile:write'
      ]
    }
  },

  // Token Blacklist (for logout)
  tokenBlacklist: {
    enabled: true,
    cleanupInterval: 24 * 60 * 60 * 1000 // 24 hours
  },

  // CORS Configuration
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // Security Headers
  securityHeaders: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.API_URL || 'http://localhost:5000']
      }
    },
    xssProtection: true,
    noSniff: true,
    frameguard: 'deny',
    hidePoweredBy: true
  },

  // Helper function to validate password strength
  validatePasswordStrength: (password) => {
    const errors = [];
    
    if (password.length < module.exports.password.minLength) {
      errors.push(`Password must be at least ${module.exports.password.minLength} characters`);
    }
    
    if (password.length > module.exports.password.maxLength) {
      errors.push(`Password cannot exceed ${module.exports.password.maxLength} characters`);
    }
    
    if (module.exports.password.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (module.exports.password.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (module.exports.password.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (module.exports.password.requireSymbols && !/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Helper function to generate OTP
  generateOTP: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Helper function to generate random token
  generateToken: (length = 32) => {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }
};