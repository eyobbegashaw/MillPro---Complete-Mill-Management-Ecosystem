const Driver = require('../models/Driver');
const User = require('../models/User');
const Delivery = require('../models/Delivery');
const Notification = require('../models/Notification');

// Get all drivers (admin)
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate('user', 'name email phone profilePicture isActive')
      .populate('assignedDeliveries');
    
    res.json({
      success: true,
      drivers
    });
    
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch drivers' 
    });
  }
};
 
// Get driver by ID
exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('user', 'name email phone profilePicture isActive')
      .populate('assignedDeliveries');
    
    if (!driver) {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver not found' 
      });
    }
    
    res.json({
      success: true,
      driver
    });
    
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch driver' 
    });
  }
};

// Get current driver profile
exports.getMyDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id })
      .populate('user', 'name email phone profilePicture')
      .populate({
        path: 'assignedDeliveries',
        populate: {
          path: 'order',
          populate: {
            path: 'customer',
            select: 'name phone address'
          }
        }
      });
    
    if (!driver) {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver profile not found' 
      });
    }
    
    res.json({
      success: true,
      driver
    });
    
  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch driver profile' 
    });
  }
};

// Create/Register driver (admin)
exports.createDriver = async (req, res) => {
  try {
    const {
      email,
      name,
      phone,
      licenseNumber,
      licenseExpiry,
      vehicle,
      documents
    } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user to driver role
      user.role = 'driver';
      user.name = name;
      user.phone = phone;
      await user.save();
    } else {
      // Create new user
      user = new User({
        email,
        name,
        phone,
        role: 'driver',
        password: Math.random().toString(36).slice(-8) // Random password
      });
      await user.save();
    }
    
    // Create driver profile
    const driver = new Driver({
      user: user._id,
      licenseNumber,
      licenseExpiry,
      vehicle,
      documents,
      status: 'offline'
    });
    
    await driver.save();
    
    // Send notification to driver
    const notification = new Notification({
      user: user._id,
      title: 'Driver Account Created',
      message: 'Your driver account has been created. Please login to complete your profile.',
      type: 'system'
    });
    await notification.save();
    
    res.status(201).json({
      success: true,
      driver: await driver.populate('user', 'name email phone')
    });
    
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create driver' 
    });
  }
};
 
// Update driver
exports.updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver not found' 
      });
    }
    
    const updatedDriver = await Driver.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('user', 'name email phone profilePicture');
    
    res.json({
      success: true,
      driver: updatedDriver
    });
    
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update driver' 
    });
  }
};

// Update driver status
exports.updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const driver = await Driver.findOneAndUpdate(
      { user: req.user.id },
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver not found' 
      });
    }
    
    // Emit status update via socket
    req.app.get('io').emit('driver-status-update', {
      driverId: driver._id,
      status
    });
    
    res.json({
      success: true,
      status: driver.status
    });
    
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update status' 
    });
  }
};

// Update current location
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    
    const driver = await Driver.findOneAndUpdate(
      { user: req.user.id },
      {
        currentLocation: {
          lat,
          lng,
          address,
          updatedAt: new Date()
        },
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver not found' 
      });
    }
    
    // Emit location update for active deliveries
    const deliveries = await Delivery.find({
      driver: driver._id,
      status: { $in: ['assigned', 'in-transit', 'pickup-arrived', 'delivery-arrived'] }
    });
    
    deliveries.forEach(delivery => {
      req.app.get('io').to(`delivery-${delivery._id}`).emit('driver-location-update', {
        deliveryId: delivery._id,
        location: { lat, lng, address },
        timestamp: new Date()
      });
    });
    
    res.json({
      success: true,
      location: driver.currentLocation
    });
    
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update location' 
    });
  }
};

// Get available drivers
exports.getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ 
      status: 'available'
    }).populate('user', 'name phone profilePicture');
    
    res.json({
      success: true,
      drivers
    });
    
  } catch (error) {
    console.error('Get available drivers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch available drivers' 
    });
  }
};

// Get driver deliveries
exports.getDriverDeliveries = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id });
    
    if (!driver) {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver not found' 
      });
    }
    
    const deliveries = await Delivery.find({
      driver: driver._id
    })
    .populate({
      path: 'order',
      populate: {
        path: 'customer',
        select: 'name phone address'
      }
    })
    .sort('-createdAt');
    
    res.json({
      success: true,
      deliveries
    });
    
  } catch (error) {
    console.error('Get driver deliveries error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch deliveries' 
    });
  }
};

// Get active delivery
exports.getActiveDelivery = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id });
    
    if (!driver) {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver not found' 
      });
    }
    
    const activeDelivery = await Delivery.findOne({
      driver: driver._id,
      status: { 
        $in: ['assigned', 'pickup-arrived', 'picked-up', 'in-transit', 'delivery-arrived'] 
      }
    })
    .populate({
      path: 'order',
      populate: {
        path: 'customer',
        select: 'name phone address'
      }
    });
    
    res.json({
      success: true,
      delivery: activeDelivery
    });
    
  } catch (error) {
    console.error('Get active delivery error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch active delivery' 
    });
  }
};

 

exports.updateLocation = async(req,res) =>{

};

 

exports.getDeliveryHistory = async(req,res) =>{

};


exports.assignDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryId } = req.body;
    
    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }
    
    delivery.driver = driver._id;
    delivery.status = 'assigned';
    await delivery.save();
    
    driver.assignedDeliveries = driver.assignedDeliveries || [];
    driver.assignedDeliveries.push(deliveryId);
    driver.status = 'busy';
    await driver.save();
    
    res.json({
      success: true,
      message: 'Delivery assigned successfully',
      delivery
    });
    
  } catch (error) {
    console.error('Assign delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign delivery'
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const driver = await Driver.findOne({ user: req.user.id });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    driver.status = status;
    driver.updatedAt = new Date();
    await driver.save();
    
    res.json({
      success: true,
      status: driver.status
    });
    
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

exports.getCurrentDelivery = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    const currentDelivery = await Delivery.findOne({
      driver: driver._id,
      status: { $in: ['assigned', 'pickup-arrived', 'picked-up', 'in-transit', 'delivery-arrived'] }
    }).populate({
      path: 'order',
      populate: {
        path: 'customer',
        select: 'name phone address'
      }
    });
    
    res.json({
      success: true,
      delivery: currentDelivery
    });
    
  } catch (error) {
    console.error('Get current delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current delivery'
    });
  }
};

exports.getDeliveryHistory = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    const deliveries = await Delivery.find({
      driver: driver._id,
      status: 'delivered'
    })
    .populate({
      path: 'order',
      populate: {
        path: 'customer',
        select: 'name'
      }
    })
    .sort('-createdAt');
    
    res.json({
      success: true,
      deliveries
    });
    
  } catch (error) {
    console.error('Get delivery history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery history'
    });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Toggle between available and offline
    driver.status = driver.status === 'available' ? 'offline' : 'available';
    driver.updatedAt = new Date();
    await driver.save();
    
    res.json({
      success: true,
      status: driver.status
    });
    
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle availability'
    });
  }
};

exports.rateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    const newRating = ((driver.rating * driver.totalRatings) + rating) / (driver.totalRatings + 1);
    driver.rating = newRating;
    driver.totalRatings += 1;
    await driver.save();
    
    res.json({
      success: true,
      message: 'Driver rated successfully'
    });
    
  } catch (error) {
    console.error('Rate driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate driver'
    });
  }
};

exports.getDrivers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const drivers = await Driver.find(query)
      .populate('user', 'name email phone profilePicture isActive')
      .populate('assignedDeliveries')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Driver.countDocuments(query);
    
    res.json({
      success: true,
      drivers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers'
    });
  }
};

exports.getDriverStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    const deliveries = await Delivery.find({ driver: id });
    
    const completedDeliveries = deliveries.filter(d => d.status === 'delivered').length;
    const totalDeliveries = deliveries.length;
    const avgDeliveryTime = calculateAvgDeliveryTime(deliveries); // You'd implement this
    
    res.json({
      success: true,
      stats: {
        totalDeliveries,
        completedDeliveries,
        pendingDeliveries: totalDeliveries - completedDeliveries,
        rating: driver.rating,
        totalRatings: driver.totalRatings,
        avgDeliveryTime
      }
    });
    
  } catch (error) {
    console.error('Get driver stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get driver stats'
    });
  }
};

// Helper function
function calculateAvgDeliveryTime(deliveries) {
  // Implementation for calculating average delivery time
  return 0;
}