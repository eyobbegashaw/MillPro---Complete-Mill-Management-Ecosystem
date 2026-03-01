module.exports = {
  // SMTP Configuration
  smtp: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
    pool: true, // Use pooled connections
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000, // 1 second
    rateLimit: 5 // 5 emails per second
  },

  // Default Email Settings
  defaults: {
    from: `"MillPro" <${process.env.EMAIL_FROM || 'noreply@millpro.com'}>`,
    replyTo: process.env.EMAIL_REPLY_TO || 'support@millpro.com',
    headers: {
      'X-Mailer': 'MillPro Mail Service',
      'X-Priority': '3'
    }
  },

  // Templates Directory
  templates: {
    path: './src/templates/email',
    cache: process.env.NODE_ENV === 'production',
    engine: 'handlebars'
  },

  // Queue Configuration
  queue: {
    enabled: true,
    concurrency: 3,
    attempts: 3,
    backoff: 5000 // 5 seconds
  },

  // Rate Limiting
  rateLimit: {
    enabled: true,
    maxPerMinute: 30,
    maxPerHour: 500,
    maxPerDay: 1000
  },

  // Email Types and Their Templates
  emailTypes: {
    welcome: {
      subject: 'Welcome to MillPro!',
      template: 'welcome',
      category: 'transactional',
      priority: 'high'
    },
    orderConfirmation: {
      subject: 'Order Confirmation - #{orderNumber}',
      template: 'order-confirmation',
      category: 'order',
      priority: 'high'
    },
    orderStatusUpdate: {
      subject: 'Order Status Update - #{orderNumber}',
      template: 'order-status',
      category: 'order',
      priority: 'medium'
    },
    deliveryUpdate: {
      subject: 'Delivery Update - Order #{orderNumber}',
      template: 'delivery-update',
      category: 'delivery',
      priority: 'medium'
    },
    passwordReset: {
      subject: 'Password Reset Request',
      template: 'password-reset',
      category: 'security',
      priority: 'high'
    },
    emailVerification: {
      subject: 'Verify Your Email Address',
      template: 'email-verification',
      category: 'security',
      priority: 'high'
    },
    invoice: {
      subject: 'Invoice - Order #{orderNumber}',
      template: 'invoice',
      category: 'billing',
      priority: 'high'
    },
    paymentReceipt: {
      subject: 'Payment Receipt - #{paymentNumber}',
      template: 'payment-receipt',
      category: 'billing',
      priority: 'high'
    },
    lowStockAlert: {
      subject: '⚠️ Low Stock Alert - #{productName}',
      template: 'low-stock',
      category: 'alert',
      priority: 'urgent'
    },
    report: {
      subject: 'MillPro Report - #{reportTitle}',
      template: 'report',
      category: 'report',
      priority: 'low'
    },
    newsletter: {
      subject: 'MillPro Newsletter - #{month} #{year}',
      template: 'newsletter',
      category: 'marketing',
      priority: 'low'
    },
    feedback: {
      subject: 'We Value Your Feedback',
      template: 'feedback',
      category: 'marketing',
      priority: 'low'
    }
  },

  // Attachments
  attachments: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    storagePath: './uploads/email-attachments'
  },

  // Tracking
  tracking: {
    enabled: true,
    openTracking: true,
    clickTracking: true,
    utmSource: 'email'
  },

  // Bounce Handling
  bounceHandling: {
    enabled: true,
    maxBounces: 3,
    action: 'mark_inactive'
  },

  // Unsubscribe
  unsubscribe: {
    enabled: true,
    header: true,
    link: '/unsubscribe',
    oneClick: true
  },

  // DKIM Signing
  dkim: {
    enabled: process.env.NODE_ENV === 'production',
    domain: process.env.EMAIL_DOMAIN || 'millpro.com',
    selector: 'mail',
    privateKey: process.env.DKIM_PRIVATE_KEY
  },

  // Helper function to get email config for type
  getEmailConfig: (type) => {
    return module.exports.emailTypes[type] || module.exports.emailTypes.welcome;
  },

  // Helper function to format email address
  formatAddress: (name, email) => {
    return `"${name}" <${email}>`;
  },

  // Helper function to create unsubscribe link
  createUnsubscribeLink: (userId) => {
    const crypto = require('crypto');
    const token = crypto.createHash('sha256')
      .update(`${userId}-${process.env.EMAIL_SECRET}`)
      .digest('hex')
      .substring(0, 16);
    
    return `${process.env.CLIENT_URL}/unsubscribe?user=${userId}&token=${token}`;
  },

  // Preview configuration (for development)
  preview: {
    enabled: process.env.NODE_ENV !== 'production',
    dir: './previews/email',
    open: false
  },

  // Test configuration
  test: {
    enabled: process.env.NODE_ENV === 'test',
    preview: false,
    sendRealEmails: false
  }
};