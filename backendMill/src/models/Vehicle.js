const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  // Vehicle identification
  plateNumber: {
    type: String,
    required: [true, 'Plate number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['motorcycle', 'car', 'truck', 'van'],
    required: true
  },
  brand: String,
  model: String,
  year: Number,
  color: String,

  // Images
  images: [{
    url: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Specifications
  specifications: {
    capacity: {
      type: Number, // in kg
      required: true
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid']
    },
    consumption: Number // km per liter
  },

  // Documents
  documents: {
    registration: {
      number: String,
      expiryDate: Date,
      file: String
    },
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
      file: String
    },
    inspection: {
      lastDate: Date,
      nextDate: Date,
      certificate: String
    }
  },

  // Ownership
  owner: {
    type: {
      type: String,
      enum: ['company', 'driver', 'third_party']
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    name: String,
    contact: String
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive', 'retired'],
    default: 'active'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },

  // Maintenance
  maintenance: [{
    date: Date,
    type: {
      type: String,
      enum: ['routine', 'repair', 'emergency']
    },
    description: String,
    cost: Number,
    odometer: Number,
    performedBy: String,
    nextDue: Date,
    receipt: String
  }],

  // Tracking
  tracking: {
    gpsDeviceId: String,
    lastKnownLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    },
    lastUpdated: Date
  },

  // Usage statistics
  statistics: {
    totalTrips: {
      type: Number,
      default: 0
    },
    totalDistance: {
      type: Number, // in km
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    fuelConsumed: {
      type: Number,
      default: 0
    },
    lastOdometer: {
      type: Number,
      default: 0
    }
  },

  // Assigned driver
  currentDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  drivers: [{
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    assignedFrom: Date,
    assignedTo: Date,
    isActive: Boolean
  }],

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for geolocation queries
VehicleSchema.index({ 'tracking.lastKnownLocation': '2dsphere' });

// Get vehicle status display
VehicleSchema.methods.getStatusDisplay = function() {
  const statusMap = {
    active: '✅ Active',
    maintenance: '🔧 In Maintenance',
    inactive: '⏸️ Inactive',
    retired: '📦 Retired'
  };
  return statusMap[this.status] || this.status;
};

// Check if vehicle needs maintenance
VehicleSchema.methods.needsMaintenance = function() {
  const lastMaintenance = this.maintenance[this.maintenance.length - 1];
  if (!lastMaintenance) return true;
  
  const daysSinceMaintenance = Math.floor((Date.now() - lastMaintenance.date) / (1000 * 60 * 60 * 24));
  return daysSinceMaintenance > 90; // 3 months
};

const Vehicle = mongoose.model('Vehicle', VehicleSchema);

module.exports = { Vehicle };