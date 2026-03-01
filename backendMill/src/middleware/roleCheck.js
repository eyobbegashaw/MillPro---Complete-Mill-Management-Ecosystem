const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Specific role checkers
const isAdmin = roleCheck('admin');
const isOperator = roleCheck('operator');
const isCustomer = roleCheck('customer');
const isDriver = roleCheck('driver');

const isAdminOrOperator = roleCheck('admin', 'operator');
const isAdminOrDriver = roleCheck('admin', 'driver');
const isAny = roleCheck('admin', 'operator', 'customer', 'driver');

// Check if user is accessing their own resource
const isOwner = (paramIdField = 'id') => {
  return (req, res, next) => {
    const resourceId = req.params[paramIdField];
    
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.id.toString() === resourceId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources'
    });
  };
};

// Check if operator is assigned to order
const isAssignedOperator = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next();
    }

    const Order = require('../models/Order');
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.operator && order.operator.toString() === req.user.id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not assigned to this order'
    });
  } catch (error) {
    next(error);
  }
};

// Check if driver is assigned to delivery
const isAssignedDriver = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next();
    }

    const Delivery = require('../models/Delivery');
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (delivery.driver && delivery.driver.toString() === req.user.id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not assigned to this delivery'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  roleCheck,
  isAdmin,
  isOperator,
  isCustomer,
  isDriver,
  isAdminOrOperator,
  isAdminOrDriver,
  isAny,
  isOwner,
  isAssignedOperator,
  isAssignedDriver
};