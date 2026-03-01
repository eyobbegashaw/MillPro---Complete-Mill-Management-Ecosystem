const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const Driver = require('../models/Driver');
const Notification = require('../models/Notification');

// Create delivery for order (admin/operator)
exports.createDelivery = async (req, res) => {
  try {
    const { orderId, pickupLocation, deliveryLocation, schedule } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    const delivery = new Delivery({
      order: orderId,
      customer: order.customer,
      pickupLocation,
      deliveryLocation,
      estimatedPickupTime: schedule?.pickupDate,
      estimatedDeliveryTime: schedule?.deliveryDate,
      status: 'pending'
    });
    
    await delivery.save();
    
    // Update order with delivery reference
    order.delivery = delivery._id;
    order.deliveryRequired = true;
    await order.save();
    
    // Notify admin/operator
    const notification = new Notification({
      title: 'New Delivery Created',
      message: `Delivery created for order #${order.orderNumber}`,
      type: 'delivery',
      data: { orderId, deliveryId: delivery._id }
    });
    await notification.save();
    
    res.status(201).json({
      success: true,
      delivery
    });
    
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create delivery' 
    });
  }
};

// Assign driver to delivery (admin/operator)
exports.assignDriver = async (req, res) => {
  try {
    const { deliveryId, driverId } = req.params;
    
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery not found' 
      });
    }
    
    const driver = await Driver.findById(driverId).populate('user');
    
    if (!driver) {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver not found' 
      });
    }
    
    // Update delivery
    delivery.driver = driverId;
    delivery.status = 'assigned';
    await delivery.save();
    
    // Add to driver's assigned deliveries
    driver.assignedDeliveries.push(deliveryId);
    driver.status = 'busy';
    await driver.save();
    
    // Update order
    const order = await Order.findById(delivery.order);
    order.driver = driverId;
    order.status = 'assigned';
    await order.save();
    
    // Notify driver
    const notification = new Notification({
      user: driver.user._id,
      title: 'New Delivery Assigned',
      message: `You have been assigned a new delivery for order #${order.orderNumber}`,
      type: 'delivery',
      data: { deliveryId }
    });
    await notification.save();
    
    // Emit socket event
    req.app.get('io').to(`driver-${driverId}`).emit('delivery-assigned', {
      deliveryId,
      orderNumber: order.orderNumber,
      pickupLocation: delivery.pickupLocation,
      deliveryLocation: delivery.deliveryLocation
    });
    
    res.json({
      success: true,
      delivery
    });
    
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to assign driver' 
    });
  }
};

// Update delivery status (driver)
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, location, note } = req.body;
    
    const delivery = await Delivery.findById(deliveryId)
      .populate('order');
    
    if (!delivery) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery not found' 
      });
    }
    
    // Update status and timeline
    delivery.status = status;
    delivery.timeline.push({
      status,
      timestamp: new Date(),
      location,
      note
    });
    
    // Update specific timestamps based on status
    switch(status) {
      case 'pickup-arrived':
        // No special handling
        break;
      case 'picked-up':
        delivery.actualPickupTime = new Date();
        break;
      case 'delivery-arrived':
        // No special handling
        break;
      case 'delivered':
        delivery.actualDeliveryTime = new Date();
        
        // Update order status
        await Order.findByIdAndUpdate(delivery.order._id, {
          status: 'delivered',
          completedAt: new Date()
        });
        
        // Update driver stats
        await Driver.findByIdAndUpdate(delivery.driver, {
          $inc: { completedDeliveries: 1 }
        });
        break;
    }
    
    await delivery.save();
    
    // Notify customer
    if (['picked-up', 'in-transit', 'delivered'].includes(status)) {
      const notification = new Notification({
        user: delivery.customer,
        title: 'Delivery Update',
        message: `Your order #${delivery.order.orderNumber} is ${status}`,
        type: 'delivery',
        data: { deliveryId }
      });
      await notification.save();
      
      // Emit to customer
      req.app.get('io').to(`customer-${delivery.customer}`).emit('delivery-update', {
        deliveryId,
        status,
        location,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      delivery
    });
    
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update delivery status' 
    });
  }
};

// Track delivery (customer)
exports.trackDelivery = async (req, res) => {
  try {
    const { trackingCode } = req.params;
    
    const delivery = await Delivery.findOne({ trackingCode })
      .populate({
        path: 'order',
        populate: {
          path: 'items.product',
          select: 'name image'
        }
      })
      .populate({
        path: 'driver',
        populate: {
          path: 'user',
          select: 'name phone'
        }
      });
    
    if (!delivery) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery not found' 
      });
    }
    
    res.json({
      success: true,
      delivery
    });
    
  } catch (error) {
    console.error('Track delivery error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to track delivery' 
    });
  }
};

// Rate delivery (customer)
exports.rateDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { score, comment } = req.body;
    
    const delivery = await Delivery.findById(deliveryId);
    
    if (!delivery) {
      return res.status(404).json({ 
        success: false, 
        message: 'Delivery not found' 
      });
    }
    
    delivery.rating = {
      score,
      comment,
      givenAt: new Date()
    };
    
    await delivery.save();
    
    // Update driver rating
    const driver = await Driver.findById(delivery.driver);
    const newRating = ((driver.rating * driver.totalRatings) + score) / (driver.totalRatings + 1);
    driver.rating = newRating;
    driver.totalRatings += 1;
    await driver.save();
    
    res.json({
      success: true,
      message: 'Rating submitted successfully'
    });
    
  } catch (error) {
    console.error('Rate delivery error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit rating' 
    });
  }
};

// Get delivery history for customer
exports.getCustomerDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ customer: req.user.id })
      .populate({
        path: 'order',
        populate: {
          path: 'items.product',
          select: 'name image'
        }
      })
      .populate({
        path: 'driver',
        populate: {
          path: 'user',
          select: 'name phone'
        }
      })
      .sort('-createdAt');
    
    res.json({
      success: true,
      deliveries
    });
    
  } catch (error) {
    console.error('Get customer deliveries error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch deliveries' 
    });
  }
};