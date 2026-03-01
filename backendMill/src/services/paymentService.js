const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

class PaymentService {
  constructor() {
    this.providers = {
      cbe: {
        apiUrl: process.env.CBE_API_URL,
        merchantId: process.env.CBE_MERCHANT_ID,
        apiKey: process.env.CBE_API_KEY
      },
      telebirr: {
        apiUrl: process.env.TELEBIRR_API_URL,
        appId: process.env.TELEBIRR_APP_ID,
        appKey: process.env.TELEBIRR_APP_KEY,
        publicKey: process.env.TELEBIRR_PUBLIC_KEY
      },
      chapa: {
        apiUrl: process.env.CHAPA_API_URL,
        secretKey: process.env.CHAPA_SECRET_KEY
      }
    };
  }

  // Initialize payment
  async initiatePayment(orderId, method, customerData) {
    try {
      const order = await Order.findById(orderId).populate('customer');
      
      if (!order) {
        throw new Error('Order not found');
      }

      const paymentData = {
        amount: order.totals.total,
        currency: 'ETB',
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: order.customer.email,
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        method
      };

      let result;

      switch (method) {
        case 'cbe':
          result = await this.initiateCBE(paymentData);
          break;
        case 'telebirr':
          result = await this.initiateTelebirr(paymentData);
          break;
        case 'chapa':
          result = await this.initiateChapa(paymentData);
          break;
        case 'cash':
          result = await this.initiateCash(paymentData);
          break;
        default:
          throw new Error('Invalid payment method');
      }

      // Create payment record
      const payment = new Payment({
        order: orderId,
        customer: order.customer._id,
        amount: order.totals.total,
        method,
        status: 'pending',
        transactionId: result.transactionId,
        reference: result.reference,
        provider: result.provider,
        metadata: {
          ...result.metadata,
          initiatedAt: new Date()
        }
      });

      await payment.save();

      return {
        success: true,
        payment: {
          id: payment._id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          transactionId: payment.transactionId,
          reference: payment.reference
        },
        providerData: result.providerData
      };
    } catch (error) {
      console.error('Initiate payment error:', error);
      throw error;
    }
  }

  // Initialize CBE payment
  async initiateCBE(data) {
    try {
      const transactionId = 'CBE' + Date.now() + crypto.randomBytes(4).toString('hex');
      
      // In production, make actual API call to CBE
      // const response = await axios.post(`${this.providers.cbe.apiUrl}/payment`, {
      //   merchantId: this.providers.cbe.merchantId,
      //   amount: data.amount,
      //   currency: data.currency,
      //   orderId: data.orderNumber,
      //   customerEmail: data.customerEmail,
      //   customerPhone: data.customerPhone,
      //   transactionId
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${this.providers.cbe.apiKey}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

      return {
        transactionId,
        reference: `CBE-REF-${Date.now()}`,
        provider: 'cbe',
        metadata: {
          // responseData: response.data
        },
        providerData: {
          checkoutUrl: `https://cbe.com.et/checkout/${transactionId}`,
          transactionId
        }
      };
    } catch (error) {
      console.error('CBE payment error:', error);
      throw error;
    }
  }

  // Initialize Telebirr payment
  async initiateTelebirr(data) {
    try {
      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(16).toString('hex');
      
      // Generate signature
      const signString = `${this.providers.telebirr.appId}${timestamp}${nonce}${data.amount}`;
      const signature = crypto
        .createHmac('sha256', this.providers.telebirr.appKey)
        .update(signString)
        .digest('hex');

      // In production, make actual API call to Telebirr
      // const response = await axios.post(`${this.providers.telebirr.apiUrl}/payment`, {
      //   appId: this.providers.telebirr.appId,
      //   timestamp,
      //   nonce,
      //   signature,
      //   amount: data.amount,
      //   currency: data.currency,
      //   orderId: data.orderNumber,
      //   customerPhone: data.customerPhone
      // });

      return {
        transactionId: `TB-${Date.now()}`,
        reference: `TB-REF-${Date.now()}`,
        provider: 'telebirr',
        metadata: {
          // responseData: response.data
        },
        providerData: {
          paymentUrl: `https://telebirr.et/pay/${Date.now()}`,
          transactionId: `TB-${Date.now()}`
        }
      };
    } catch (error) {
      console.error('Telebirr payment error:', error);
      throw error;
    }
  }

  // Initialize Chapa payment
  async initiateChapa(data) {
    try {
      const txRef = `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      // In production, make actual API call to Chapa
      // const response = await axios.post(`${this.providers.chapa.apiUrl}/transaction/initialize`, {
      //   amount: data.amount,
      //   currency: data.currency,
      //   email: data.customerEmail,
      //   first_name: data.customerName.split(' ')[0],
      //   last_name: data.customerName.split(' ')[1] || '',
      //   tx_ref: txRef,
      //   callback_url: `${process.env.API_URL}/api/payments/verify/${txRef}`,
      //   return_url: `${process.env.CLIENT_URL}/payment/success`,
      //   customization: {
      //     title: 'MillPro Payment',
      //     description: `Payment for order #${data.orderNumber}`
      //   }
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${this.providers.chapa.secretKey}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

      return {
        transactionId: txRef,
        reference: txRef,
        provider: 'chapa',
        metadata: {
          // responseData: response.data
        },
        providerData: {
          checkoutUrl: `https://api.chapa.co/checkout/${txRef}`,
          txRef
        }
      };
    } catch (error) {
      console.error('Chapa payment error:', error);
      throw error;
    }
  }

  // Initialize cash payment
  async initiateCash(data) {
    return {
      transactionId: `CASH-${Date.now()}`,
      reference: `CASH-REF-${Date.now()}`,
      provider: 'cash',
      metadata: {},
      providerData: {
        message: 'Pay with cash on delivery'
      }
    };
  }

  // Verify payment
  async verifyPayment(reference, provider) {
    try {
      const payment = await Payment.findOne({ reference });
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      let verificationResult;

      switch (provider) {
        case 'cbe':
          verificationResult = await this.verifyCBE(payment);
          break;
        case 'telebirr':
          verificationResult = await this.verifyTelebirr(payment);
          break;
        case 'chapa':
          verificationResult = await this.verifyChapa(payment);
          break;
        case 'cash':
          verificationResult = { status: 'completed' };
          break;
        default:
          throw new Error('Invalid provider');
      }

      if (verificationResult.status === 'completed') {
        payment.status = 'completed';
        payment.completedAt = new Date();
        await payment.save();

        // Update order payment status
        await Order.findByIdAndUpdate(payment.order, {
          'payment.status': 'paid',
          'payment.transactionId': payment.transactionId,
          'payment.paidAt': new Date()
        });

        return {
          success: true,
          payment
        };
      } else {
        payment.status = 'failed';
        await payment.save();

        return {
          success: false,
          message: 'Payment verification failed',
          payment
        };
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      throw error;
    }
  }

  // Verify CBE payment
  async verifyCBE(payment) {
    // In production, make API call to CBE to verify
    // const response = await axios.get(`${this.providers.cbe.apiUrl}/payment/${payment.transactionId}/status`);
    // return { status: response.data.status };
    
    return { status: 'completed' };
  }

  // Verify Telebirr payment
  async verifyTelebirr(payment) {
    // In production, make API call to Telebirr to verify
    // const response = await axios.get(`${this.providers.telebirr.apiUrl}/payment/${payment.transactionId}/status`);
    // return { status: response.data.status };
    
    return { status: 'completed' };
  }

  // Verify Chapa payment
  async verifyChapa(payment) {
    // In production, make API call to Chapa to verify
    // const response = await axios.get(`${this.providers.chapa.apiUrl}/transaction/verify/${payment.transactionId}`, {
    //   headers: {
    //     'Authorization': `Bearer ${this.providers.chapa.secretKey}`
    //   }
    // });
    // return { status: response.data.status };
    
    return { status: 'completed' };
  }

  // Process refund
  async processRefund(paymentId, amount, reason) {
    try {
      const payment = await Payment.findById(paymentId);
      
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Cannot refund incomplete payment');
      }

      if (amount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
      }

      let refundResult;

      switch (payment.method) {
        case 'cbe':
          refundResult = await this.refundCBE(payment, amount);
          break;
        case 'telebirr':
          refundResult = await this.refundTelebirr(payment, amount);
          break;
        case 'chapa':
          refundResult = await this.refundChapa(payment, amount);
          break;
        default:
          refundResult = { success: true };
      }

      if (refundResult.success) {
        payment.status = 'refunded';
        payment.refund = {
          amount,
          reason,
          processedAt: new Date(),
          transactionId: refundResult.transactionId
        };
        await payment.save();

        return {
          success: true,
          payment
        };
      } else {
        throw new Error('Refund failed');
      }
    } catch (error) {
      console.error('Process refund error:', error);
      throw error;
    }
  }

  // Refund CBE payment
  async refundCBE(payment, amount) {
    // In production, make API call to CBE for refund
    return { success: true, transactionId: `REF-${Date.now()}` };
  }

  // Refund Telebirr payment
  async refundTelebirr(payment, amount) {
    // In production, make API call to Telebirr for refund
    return { success: true, transactionId: `REF-${Date.now()}` };
  }

  // Refund Chapa payment
  async refundChapa(payment, amount) {
    // In production, make API call to Chapa for refund
    return { success: true, transactionId: `REF-${Date.now()}` };
  }

  // Generate receipt
  async generateReceipt(paymentId) {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('order')
        .populate('customer');

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Generate receipt number
      const receiptNumber = `RCT-${payment.paymentNumber}`;

      const receipt = {
        receiptNumber,
        paymentNumber: payment.paymentNumber,
        orderNumber: payment.order.orderNumber,
        date: payment.completedAt || payment.createdAt,
        customer: {
          name: payment.customer.name,
          email: payment.customer.email,
          phone: payment.customer.phone
        },
        items: payment.order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.pricePerKg,
          total: item.quantity * item.pricePerKg
        })),
        subtotal: payment.order.totals.subtotal,
        millingFee: payment.order.totals.millingTotal,
        deliveryFee: payment.order.totals.deliveryFee,
        orderFee: payment.order.totals.orderFee,
        total: payment.amount,
        paymentMethod: payment.method,
        transactionId: payment.transactionId,
        status: payment.status
      };

      return receipt;
    } catch (error) {
      console.error('Generate receipt error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();