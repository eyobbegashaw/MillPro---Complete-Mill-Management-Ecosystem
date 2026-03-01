module.exports = {
  // Currency Configuration
  currency: {
    code: 'ETB',
    symbol: 'Br',
    name: 'Ethiopian Birr',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.'
  },

  // Payment Methods
  methods: {
    cash: {
      enabled: true,
      name: 'Cash on Delivery',
      icon: 'cash',
      fees: {
        type: 'fixed',
        amount: 0
      },
      processingTime: 'Immediate'
    },
    cbe: {
      enabled: true,
      name: 'CBE Birr',
      icon: 'cbe',
      fees: {
        type: 'percentage',
        amount: 0 // No fee for CBE
      },
      minAmount: 1,
      maxAmount: 100000,
      processingTime: 'Instant',
      api: {
        baseUrl: process.env.CBE_API_URL,
        merchantId: process.env.CBE_MERCHANT_ID,
        apiKey: process.env.CBE_API_KEY,
        timeout: 30000
      }
    },
    telebirr: {
      enabled: true,
      name: 'Telebirr',
      icon: 'telebirr',
      fees: {
        type: 'percentage',
        amount: 0.5 // 0.5% fee
      },
      minAmount: 1,
      maxAmount: 50000,
      processingTime: 'Instant',
      api: {
        baseUrl: process.env.TELEBIRR_API_URL,
        appId: process.env.TELEBIRR_APP_ID,
        appKey: process.env.TELEBIRR_APP_KEY,
        publicKey: process.env.TELEBIRR_PUBLIC_KEY,
        timeout: 30000
      }
    },
    bank: {
      enabled: true,
      name: 'Bank Transfer',
      icon: 'bank',
      fees: {
        type: 'fixed',
        amount: 0
      },
      processingTime: '1-2 business days',
      bankAccounts: [
        {
          bank: 'Commercial Bank of Ethiopia',
          accountName: 'MillPro PLC',
          accountNumber: '1000123456789',
          branch: 'Head Office'
        },
        {
          bank: 'Dashen Bank',
          accountName: 'MillPro PLC',
          accountNumber: '1234567890',
          branch: 'Main Branch'
        }
      ]
    },
    card: {
      enabled: true,
      name: 'Credit/Debit Card',
      icon: 'card',
      fees: {
        type: 'percentage',
        amount: 2.5 // 2.5% fee
      },
      minAmount: 10,
      maxAmount: 50000,
      processingTime: 'Instant',
      supportedCards: ['Visa', 'Mastercard', 'Amex', 'Discover'],
      api: {
        provider: 'stripe', // or 'chapa'
        apiKey: process.env.STRIPE_API_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        timeout: 30000
      }
    }
  },

  // Transaction Configuration
  transaction: {
    prefix: 'TXN',
    referenceLength: 12,
    timeout: 30 * 60 * 1000, // 30 minutes
    maxRetries: 3,
    retryDelay: 5000 // 5 seconds
  },

  // Fees Configuration
  fees: {
    orderFee: {
      type: 'fixed',
      amount: 20,
      name: 'Order Processing Fee'
    },
    deliveryFee: {
      type: 'dynamic',
      baseAmount: 30,
      perKm: 5,
      minAmount: 30,
      maxAmount: 200,
      name: 'Delivery Fee'
    },
    tax: {
      rate: 0.15, // 15% VAT
      name: 'VAT',
      included: true // Tax included in price
    }
  },

  // Discount Configuration
  discounts: {
    enabled: true,
    types: {
      percentage: {
        maxDiscount: 50, // Max 50% off
        minOrderAmount: 100
      },
      fixed: {
        maxDiscount: 500, // Max 500 Birr off
        minOrderAmount: 200
      },
      freeShipping: {
        minOrderAmount: 1000
      }
    },
    codes: {
      length: 8,
      characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      caseSensitive: false
    }
  },

  // Refund Configuration
  refunds: {
    enabled: true,
    maxDays: 30, // Can refund within 30 days
    methods: ['original', 'store_credit', 'bank_transfer'],
    fees: {
      type: 'percentage',
      amount: 0 // No refund fee
    },
    reasons: [
      'customer_request',
      'wrong_item',
      'damaged_item',
      'late_delivery',
      'other'
    ]
  },

  // Webhook Configuration
  webhooks: {
    enabled: true,
    secret: process.env.PAYMENT_WEBHOOK_SECRET,
    timeout: 10000,
    maxRetries: 3,
    retryDelay: 5000
  },

  // Receipt Configuration
  receipt: {
    enabled: true,
    format: 'pdf',
    includeLogo: true,
    includeSignature: true,
    footer: 'Thank you for choosing MillPro!',
    storeInfo: {
      name: 'MillPro PLC',
      address: 'Addis Ababa, Ethiopia',
      phone: '+251 911 223344',
      email: 'finance@millpro.com',
      taxId: '1234567890'
    }
  },

  // Invoice Configuration
  invoice: {
    prefix: 'INV',
    numberLength: 8,
    dueDays: 7,
    notes: 'Payment is due within 7 days. Late payments may incur additional fees.'
  },

  // Payment Gateway Providers
  providers: {
    chapa: {
      enabled: true,
      apiUrl: process.env.CHAPA_API_URL || 'https://api.chapa.co/v1',
      secretKey: process.env.CHAPA_SECRET_KEY,
      webhookSecret: process.env.CHAPA_WEBHOOK_SECRET,
      timeout: 30000
    },
    stripe: {
      enabled: false,
      apiUrl: 'https://api.stripe.com/v1',
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      timeout: 30000
    }
  },

  // Settlement Configuration
  settlement: {
    enabled: true,
    schedule: 'daily', // daily, weekly, monthly
    dayOfWeek: 1, // Monday for weekly
    dayOfMonth: 1, // 1st for monthly
    method: 'bank_transfer',
    minimumAmount: 500
  },

  // Fraud Detection
  fraudDetection: {
    enabled: true,
    maxTransactionsPerDay: 10,
    maxAmountPerDay: 50000,
    velocityCheck: true,
    ipCheck: true,
    deviceFingerprinting: true,
    binCheck: true
  },

  // PCI Compliance
  pci: {
    enabled: true,
    dontStoreCVV: true,
    tokenization: true,
    encryptionLevel: 'AES-256',
    keyRotation: 30 // days
  },

  // Helper function to calculate fees
  calculateFees: (amount, method) => {
    const methodConfig = module.exports.methods[method];
    if (!methodConfig || !methodConfig.fees) return 0;

    if (methodConfig.fees.type === 'percentage') {
      return (amount * methodConfig.fees.amount) / 100;
    } else {
      return methodConfig.fees.amount;
    }
  },

  // Helper function to calculate tax
  calculateTax: (amount) => {
    if (!module.exports.fees.tax.included) {
      return amount * module.exports.fees.tax.rate;
    }
    return 0;
  },

  // Helper function to validate payment method
  validatePaymentMethod: (method, amount) => {
    const methodConfig = module.exports.methods[method];
    
    if (!methodConfig || !methodConfig.enabled) {
      return {
        valid: false,
        error: 'Payment method not available'
      };
    }

    if (methodConfig.minAmount && amount < methodConfig.minAmount) {
      return {
        valid: false,
        error: `Minimum amount for ${methodConfig.name} is ${methodConfig.minAmount} ${module.exports.currency.code}`
      };
    }

    if (methodConfig.maxAmount && amount > methodConfig.maxAmount) {
      return {
        valid: false,
        error: `Maximum amount for ${methodConfig.name} is ${methodConfig.maxAmount} ${module.exports.currency.code}`
      };
    }

    return { valid: true };
  },

  // Helper function to generate transaction reference
  generateReference: (prefix = module.exports.transaction.prefix) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  },

  // Helper function to format amount
  formatAmount: (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: module.exports.currency.code,
      minimumFractionDigits: module.exports.currency.decimals,
      maximumFractionDigits: module.exports.currency.decimals
    }).format(amount);
  }
};