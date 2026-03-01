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