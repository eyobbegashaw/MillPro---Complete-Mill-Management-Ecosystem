const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// Initiate payment
exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;

    const order = await Order.findById(orderId).populate('customer');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to customer
    if (order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ 
      order: orderId,
      status: { $in: ['pending', 'processing'] }
    });

    if (existingPayment) {
      return res.json({
        success: true,
        message: 'Payment already initiated',
        data: existingPayment
      });
    }

    const result = await paymentService.initiatePayment(orderId, method, {
      customerEmail: order.customer.email,
      customerName: order.customer.name,
      customerPhone: order.customer.phone
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment'
    });
  }
};

// Process payment (for cash on delivery)
exports.processPayment = async (req, res) => {
  try {
    const { orderId, amount, method, reference } = req.body;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Create payment record
    const payment = new Payment({
      order: orderId,
      customer: req.user.id,
      amount: amount || order.totals.total,
      method,
      status: 'completed',
      reference,
      processedBy: req.user.id,
      processedAt: new Date()
    });

    await payment.save();

    // Update order payment status
    order.payment.status = 'paid';
    order.payment.transactionId = payment.transactionId;
    order.payment.paidAt = new Date();
    await order.save();

    // Send notifications
    await notificationService.notifyPaymentReceived(payment, req.user.id);
    await smsService.sendPaymentConfirmation(payment, req.user);
    await emailService.sendInvoice(order, req.user, null); // Generate and attach PDF

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment'
    });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const payment = await Payment.findOne({ reference });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const result = await paymentService.verifyPayment(reference, payment.method);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

// Get all payments (admin/operator)
exports.getPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      method,
      startDate, 
      endDate 
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (method) {
      query.method = method;
    }

    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const payments = await Payment.find(query)
      .populate('customer', 'name email phone')
      .populate('order', 'orderNumber totals')
      .populate('processedBy', 'name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    // Calculate totals
    const totals = await Payment.aggregate([
      { $match: query },
      { $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }}
    ]);

    res.json({
      success: true,
      data: payments,
      summary: {
        totalAmount: totals[0]?.totalAmount || 0,
        totalCount: totals[0]?.count || 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments'
    });
  }
};

// Get single payment
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('order')
      .populate('processedBy', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment'
    });
  }
};

// Get customer payments
exports.getCustomerPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ customer: req.user.id })
      .populate('order', 'orderNumber totals')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({ customer: req.user.id });

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments'
    });
  }
};

// Refund payment
exports.refundPayment = async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const payment = await Payment.findById(req.params.id)
      .populate('customer');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    const refundAmount = amount || payment.amount;

    const result = await paymentService.processRefund(payment._id, refundAmount, reason);

    // Update order status if full refund
    if (refundAmount === payment.amount) {
      await Order.findByIdAndUpdate(payment.order, {
        'payment.status': 'refunded'
      });
    }

    // Notify customer
    await notificationService.createNotification({
      userId: payment.customer._id,
      title: 'Payment Refunded',
      message: `Your payment of ${refundAmount} Birr has been refunded. ${reason ? 'Reason: ' + reason : ''}`,
      type: 'payment',
      priority: 'high',
      data: { paymentId: payment._id }
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
};

// Generate receipt
exports.generateReceipt = async (req, res) => {
  try {
    const receipt = await paymentService.generateReceipt(req.params.id);

    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt'
    });
  }
};

// Get payment stats
exports.getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {};
    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    const dailyStats = await Payment.aggregate([
      {
        $match: {
          ...match,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        byMethod: stats,
        daily: dailyStats,
        totalPayments: await Payment.countDocuments(match),
        totalAmount: (await Payment.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]))[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment stats'
    });
  }
};

// Get payment methods
exports.getPaymentMethods = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('paymentMethods');

    res.json({
      success: true,
      data: user.paymentMethods || []
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods'
    });
  }
};

// Save payment method
exports.savePaymentMethod = async (req, res) => {
  try {
    const { type, accountNumber, accountName, bankName, isDefault } = req.body;

    const user = await User.findById(req.user.id);

    if (!user.paymentMethods) {
      user.paymentMethods = [];
    }

    const newMethod = {
      type,
      accountNumber,
      accountName,
      bankName,
      isDefault: isDefault || false,
      lastUsed: new Date()
    };

    if (isDefault) {
      user.paymentMethods.forEach(m => m.isDefault = false);
    }

    user.paymentMethods.push(newMethod);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Payment method saved',
      data: newMethod
    });
  } catch (error) {
    console.error('Save payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save payment method'
    });
  }
};

// Delete payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);

    if (!user.paymentMethods || !user.paymentMethods[id]) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    user.paymentMethods.splice(id, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Payment method deleted'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method'
    });
  }
};

  
   