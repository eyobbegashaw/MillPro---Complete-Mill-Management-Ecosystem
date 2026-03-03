const mongoose = require('mongoose');

module.exports = {
  // MongoDB Connection URI
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/millpro',

  // Connection Options
  options: {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    autoIndex: process.env.NODE_ENV !== 'production', // Don't auto-index in production
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
    retryWrites: true,
    retryReads: true,
    heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    maxIdleTimeMS: 30000, // Close idle sockets after 30 seconds
    compressors: ['snappy', 'zlib'], // Enable compression
    writeConcern: {
      w: 'majority', // Wait for write to propagate to majority of nodes
      j: true, // Wait for journal write
      wtimeout: 5000 // Timeout after 5 seconds
    }
  },

  // Database Name
  name: process.env.DB_NAME || 'millpro',

  // Connection Events
  events: {
    connected: () => {
      console.log('✅ MongoDB connected successfully');
    },
    error: (err) => {
      console.error('❌ MongoDB connection error:', err);
    },
    disconnected: () => {
      console.log('⚠️ MongoDB disconnected');
    },
    reconnected: () => {
      console.log('🔄 MongoDB reconnected');
    },
    timeout: () => {
      console.error('⏰ MongoDB connection timeout');
    },
    close: () => {
      console.log('🔚 MongoDB connection closed');
    }
  },

  // Collections
  collections: {
    users: 'users',
    customers: 'customers',
    operators: 'operators',
    drivers: 'drivers',
    admins: 'admins',
    products: 'products',
    orders: 'orders',
    warehouse: 'warehouseitems',
    messages: 'messages',
    conversations: 'conversations',
    deliveries: 'deliveries',
    payments: 'payments',
    expenses: 'expenses',
    notifications: 'notifications',
    reports: 'reports'
  },

  // Indexes
  indexes: {
    users: [
      { fields: { email: 1 }, options: { unique: true } },
      { fields: { phone: 1 }, options: { sparse: true } },
      { fields: { role: 1 } },
      { fields: { isActive: 1 } },
      { fields: { createdAt: -1 } }
    ],
    orders: [
      { fields: { orderNumber: 1 }, options: { unique: true } },
      { fields: { customer: 1 } },
      { fields: { operator: 1 } },
      { fields: { driver: 1 } },
      { fields: { status: 1 } },
      { fields: { createdAt: -1 } },
      { fields: { 'deliveryLocation.lat': 1, 'deliveryLocation.lng': 1 } }
    ],
    products: [
      { fields: { name: 1 }, options: { unique: true } },
      { fields: { category: 1 } },
      { fields: { price: 1 } },
      { fields: { stock: 1 } },
      { fields: { posted: 1 } }
    ],
    deliveries: [
      { fields: { trackingCode: 1 }, options: { unique: true } },
      { fields: { driver: 1 } },
      { fields: { status: 1 } },
      { fields: { 'currentLocation.lat': 1, 'currentLocation.lng': 1 } }
    ]
  },

  // Query Options
  query: {
    defaultLimit: 20,
    maxLimit: 100,
    sortDefault: { createdAt: -1 }
  },

  // Pagination
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100
  },

  // Aggregation
  aggregation: {
    allowDiskUse: process.env.NODE_ENV !== 'production',
    maxTimeMS: 60000 // 60 seconds
  },

  // Backup Configuration
  backup: {
    enabled: true,
    path: './backups',
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 12
    }
  },

  // Connection Helper Functions
  connect: async () => {
    try {
      await mongoose.connect(module.exports.uri, module.exports.options);
      
      // Set up event listeners
      mongoose.connection.on('connected', module.exports.events.connected);
      mongoose.connection.on('error', module.exports.events.error);
      mongoose.connection.on('disconnected', module.exports.events.disconnected);
      mongoose.connection.on('reconnected', module.exports.events.reconnected);
      mongoose.connection.on('timeout', module.exports.events.timeout);
      mongoose.connection.on('close', module.exports.events.close);

      // Create indexes
      if (process.env.NODE_ENV !== 'production') {
        await module.exports.createIndexes();
      }

      return mongoose.connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  },

  disconnect: async () => {
    try {
      await mongoose.disconnect();
      console.log('MongoDB disconnected gracefully');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  },

  // Create indexes
  createIndexes: async () => {
    try {
      for (const [collectionName, indexes] of Object.entries(module.exports.indexes)) {
        const collection = mongoose.connection.collection(collectionName);
        if (collection) {
          for (const index of indexes) {
            await collection.createIndex(index.fields, index.options);
          }
          console.log(`Indexes created for ${collectionName}`);
        }
      }
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      return {
        status: states[state] || 'unknown',
        readyState: state,
        db: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  },

  // Transaction helper
  withTransaction: async (callback) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
};