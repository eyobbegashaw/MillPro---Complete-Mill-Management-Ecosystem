const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Delivery = require('../models/Delivery');
const Notification = require('../models/Notification');
const warehouseController = require('./warehouseController');
const notificationService = require('../services/notificationService');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      pickupAddress,
      schedule,
      payment,
      specialInstructions,
      orderType = 'regular'
    } = req.body;

    // Validate items and check stock
    let subtotal = 0;
    let millingTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is not available`
        });
      }

      if (item.quantity < product.minQuantity) {
        return res.status(400).json({
          success: false,
          message: `Minimum quantity for ${product.name} is ${product.minQuantity}kg`
        });
      }

      // Check stock (if tracking inventory)
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}kg`
        });
      }

      const itemSubtotal = item.quantity * product.price;
      const itemMilling = item.quantity * (product.millingFee || 0);

      subtotal += itemSubtotal;
      millingTotal += itemMilling;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        pricePerKg: product.price,
        millingFee: product.millingFee || 0,
        subtotal: itemSubtotal + itemMilling
      });

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculate totals
    const deliveryFee = 50; // Fixed delivery fee for now
    const orderFee = 20; // Fixed order fee
    const total = subtotal + millingTotal + deliveryFee + orderFee;

    // Create order
    const order = new Order({
      customer: req.user.id,
      customerInfo: {
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email
      },
      items: orderItems,
      orderType,
      deliveryAddress,
      pickupAddress,
      schedule,
      payment: {
        method: payment.method,
        status: payment.method === 'cash' ? 'pending' : 'pending'
      },
      specialInstructions,
      totals: {
        subtotal,
        millingTotal,
        deliveryFee,
        orderFee,
        total
      },
      status: 'pending'
    });

    await order.save();

    // Check for low stock and notify admin
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product.isLowStock()) {
        const admins = await User.find({ role: 'admin' });
        await notificationService.notifyLowStock(product, admins.map(a => a._id));
      }
    }

    // Notify customer
    await notificationService.notifyOrderCreated(order, req.user.id);
    
    // Send SMS
    await smsService.sendOrderConfirmation(order, req.user);
    
    // Send Email
    await emailService.sendOrderConfirmation(order, req.user);

    // Notify available operators
    const operators = await User.find({ 
      role: 'operator',
      'operatorData.currentStatus': 'available'
    });
    
    if (operators.length > 0) {
      await notificationService.notifyNewOrderToOperators(
        order, 
        operators.map(o => o._id)
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
};

// Get all orders (admin/operator)
exports.getOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      startDate, 
      endDate,
      customerId,
      operatorId,
      type 
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (customerId) {
      query.customer = customerId;
    }

    if (operatorId) {
      query.operator = operatorId;
    }

    if (type) {
      query.orderType = type;
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('operator', 'name email')
      .populate('driver', 'name phone')
      .populate('items.product', 'name category image')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('operator', 'name email phone')
      .populate('driver', 'name phone')
      .populate('items.product', 'name category image price')
      .populate('delivery');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'operator' && order.operator && order.operator._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'driver' && order.driver && order.driver._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order'
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id)
      .populate('customer');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    
    // Add to tracking history
    order.trackingHistory.push({
      status,
      timestamp: new Date(),
      note,
      updatedBy: req.user.id
    });

    if (status === 'completed') {
      order.completedAt = new Date();
    }

    await order.save();

    // Notify customer
    await notificationService.notifyOrderStatusChange(order, order.customer._id);
    await smsService.sendOrderStatusUpdate(order, order.customer);
    await emailService.sendOrderStatusUpdate(order, order.customer);

    // If status changed to ready, create delivery
    if (status === 'ready' && order.deliveryRequired && !order.delivery) {
      const delivery = new Delivery({
        order: order._id,
        customer: order.customer._id,
        pickupLocation: order.pickupAddress || {
          address: 'MillPro Warehouse',
          lat: 9.0245,
          lng: 38.7468
        },
        deliveryLocation: order.deliveryAddress,
        estimatedPickupTime: new Date(),
        estimatedDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // +2 hours
      });
      
      await delivery.save();
      order.delivery = delivery._id;
      await order.save();
    }

    // Emit real-time update
    if (global.io) {
      global.io.to(`user-${order.customer._id}`).emit('order-update', {
        orderId: order._id,
        status,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

// Assign operator to order
exports.assignOperator = async (req, res) => {
  try {
    const { operatorId } = req.body;

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const operator = await User.findById(operatorId);
    
    if (!operator || operator.role !== 'operator') {
      return res.status(404).json({
        success: false,
        message: 'Operator not found'
      });
    }

    order.operator = operatorId;
    await order.save();

    // Notify operator
    await notificationService.createNotification({
      userId: operatorId,
      title: 'Order Assigned',
      message: `Order #${order.orderNumber} has been assigned to you`,
      type: 'order',
      data: { orderId: order._id, orderNumber: order.orderNumber }
    });

    res.json({
      success: true,
      message: 'Operator assigned successfully',
      data: order
    });
  } catch (error) {
    console.error('Assign operator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign operator'
    });
  }
};

// Assign driver to order
exports.assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.delivery) {
      return res.status(400).json({
        success: false,
        message: 'Delivery not created for this order'
      });
    }

    const driver = await User.findById(driverId);
    
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    order.driver = driverId;
    await order.save();

    // Update delivery
    await Delivery.findByIdAndUpdate(order.delivery, {
      driver: driverId,
      status: 'assigned'
    });

    // Notify driver
    await notificationService.createNotification({
      userId: driverId,
      title: 'Delivery Assigned',
      message: `You have been assigned to deliver order #${order.orderNumber}`,
      type: 'delivery',
      data: { orderId: order._id, deliveryId: order.delivery }
    });

    // Notify customer
    await notificationService.createNotification({
      userId: order.customer,
      title: 'Driver Assigned',
      message: `A driver has been assigned to your order #${order.orderNumber}`,
      type: 'delivery',
      data: { orderId: order._id }
    });

    await smsService.sendDriverAssigned(order, order.customer, driver);

    res.json({
      success: true,
      message: 'Driver assigned successfully',
      data: order
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign driver'
    });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id)
      .populate('customer');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if cancellable
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.status = 'cancelled';
    order.trackingHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason,
      updatedBy: req.user.id
    });

    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    // Notify customer
    await notificationService.createNotification({
      userId: order.customer._id,
      title: 'Order Cancelled',
      message: `Your order #${order.orderNumber} has been cancelled. ${reason ? 'Reason: ' + reason : ''}`,
      type: 'order',
      priority: 'high',
      data: { orderId: order._id }
    });

    await smsService.sendOrderStatusUpdate(order, order.customer);

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
};

// Get customer orders
exports.getCustomerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: req.user.id };
    
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name image')
      .populate('driver', 'name phone')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
};

// Get operator orders
exports.getOperatorOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { operator: req.user.id };
    
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get operator orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
};

// Get order stats
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {};
    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$totals.total' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments(match);
    const totalRevenue = await Order.aggregate([
      { $match: { ...match, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totals.total' } } }
    ]);

    // Get recent trends
    const last7Days = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totals.total' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        total: totalOrders,
        revenue: totalRevenue[0]?.total || 0,
        trends: last7Days
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order stats'
    });
  }
};

// Track order
exports.trackOrder = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const order = await Order.findOne({ orderNumber: trackingNumber })
      .populate('customer', 'name')
      .populate('driver', 'name phone')
      .populate('delivery');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedDelivery: order.schedule?.deliveryDate,
        trackingHistory: order.trackingHistory,
        delivery: order.delivery
      }
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track order'
    });
  }
};

// Add tracking update
exports.addTrackingUpdate = async (req, res) => {
  try {
    const { status, location, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.trackingHistory.push({
      status,
      location,
      note,
      timestamp: new Date(),
      updatedBy: req.user.id
    });

    await order.save();

    // Emit real-time update
    if (global.io) {
      global.io.to(`user-${order.customer}`).emit('tracking-update', {
        orderId: order._id,
        status,
        location,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Tracking update added'
    });
  } catch (error) {
    console.error('Add tracking update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add tracking update'
    });
  }
};

// Get delivery status
exports.getDeliveryStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('delivery')
      .populate('driver', 'name phone currentLocation');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.delivery) {
      return res.status(404).json({
        success: false,
        message: 'No delivery found for this order'
      });
    }

    res.json({
      success: true,
      data: {
        delivery: order.delivery,
        driver: order.driver,
        estimatedDelivery: order.delivery.estimatedDeliveryTime,
        currentLocation: order.driver?.currentLocation
      }
    });
  } catch (error) {
    console.error('Get delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery status'
    });
  }
};

// Rate order
exports.rateOrder = async (req, res) => {
  try {
    const { rating, review } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to customer
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate delivered orders'
      });
    }

    // Check if already rated
    if (order.rating) {
      return res.status(400).json({
        success: false,
        message: 'Order already rated'
      });
    }

    order.rating = { score: rating, review, givenAt: new Date() };
    await order.save();

    // Update operator rating if assigned
    if (order.operator) {
      const Operator = require('../models/Operator');
      const operator = await Operator.findOne({ user: order.operator });
      if (operator) {
        await operator.addRating(rating);
      }
    }

    // Update driver rating if assigned
    if (order.driver) {
      const Driver = require('../models/Driver');
      const driver = await Driver.findOne({ user: order.driver });
      if (driver) {
        const newRating = ((driver.rating * driver.totalRatings) + rating) / (driver.totalRatings + 1);
        driver.rating = newRating;
        driver.totalRatings += 1;
        await driver.save();
      }
    }

    res.json({
      success: true,
      message: 'Order rated successfully'
    });
  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate order'
    });
  }
};