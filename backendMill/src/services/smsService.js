const axios = require('axios');

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'africastalking';
    this.apiKey = process.env.SMS_API_KEY;
    this.username = process.env.SMS_USERNAME;
    this.senderId = process.env.SMS_SENDER_ID || 'MillPro';
  }

  async sendSMS(phoneNumber, message) {
    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      switch (this.provider) {
        case 'africastalking':
          return await this.sendViaAfricaIsTalking(formattedPhone, message);
        case 'twilio':
          return await this.sendViaTwilio(formattedPhone, message);
        case 'infobip':
          return await this.sendViaInfoBip(formattedPhone, message);
        default:
          // Mock sending for development
          console.log(`[SMS Mock] To: ${formattedPhone}, Message: ${message}`);
          return { success: true, messageId: `mock-${Date.now()}` };
      }
    } catch (error) {
      console.error('Send SMS error:', error);
      // Don't throw - fail silently in production
      return { success: false, error: error.message };
    }
  }

  async sendViaAfricaIsTalking(phoneNumber, message) {
    try {
      const response = await axios.post('https://api.africastalking.com/version1/messaging', {
        username: this.username,
        to: phoneNumber,
        message: message,
        from: this.senderId
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.apiKey
        }
      });

      return {
        success: true,
        messageId: response.data.SMSMessageData?.Recipients?.[0]?.messageId
      };
    } catch (error) {
      console.error('AfricaIsTalking SMS error:', error);
      throw error;
    }
  }

  async sendViaTwilio(phoneNumber, message) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      
      const client = require('twilio')(accountSid, authToken);
      
      const response = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: response.sid
      };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      throw error;
    }
  }

  async sendViaInfoBip(phoneNumber, message) {
    try {
      const response = await axios.post('https://api.infobip.com/sms/2/text/advanced', {
        messages: [{
          from: this.senderId,
          destinations: [{
            to: phoneNumber
          }],
          text: message
        }]
      }, {
        headers: {
          'Authorization': `App ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.data.messages[0]?.messageId
      };
    } catch (error) {
      console.error('InfoBip SMS error:', error);
      throw error;
    }
  }

  formatPhoneNumber(phone) {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Ethiopian numbers
    if (cleaned.startsWith('251')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+251' + cleaned.substring(1);
    } else {
      return '+251' + cleaned;
    }
  }

  async sendOrderConfirmation(order, customer) {
    const message = `MillPro: Your order #${order.orderNumber} has been confirmed. Total: ${order.totals.total} Birr. Track at: ${process.env.CLIENT_URL}/orders/${order._id}`;
    return this.sendSMS(customer.phone, message);
  }

  async sendOrderStatusUpdate(order, customer) {
    const statusMessages = {
      pending: 'is pending',
      processing: 'is being processed',
      ready: 'is ready for pickup/delivery',
      assigned: 'has been assigned to a driver',
      'in-transit': 'is on the way',
      delivered: 'has been delivered',
      cancelled: 'has been cancelled'
    };

    const message = `MillPro: Your order #${order.orderNumber} ${statusMessages[order.status] || 'has been updated'}.`;
    return this.sendSMS(customer.phone, message);
  }

  async sendDeliveryUpdate(delivery, customer) {
    const message = `MillPro: Your delivery for order #${delivery.order.orderNumber} is ${delivery.status}. Track live: ${process.env.CLIENT_URL}/track/${delivery.trackingCode}`;
    return this.sendSMS(customer.phone, message);
  }

  async sendDriverAssigned(order, customer, driver) {
    const message = `MillPro: Driver ${driver.name} (${driver.phone}) has been assigned to your order #${order.orderNumber}.`;
    return this.sendSMS(customer.phone, message);
  }

  async sendPaymentConfirmation(payment, customer) {
    const message = `MillPro: Payment of ${payment.amount} Birr for order #${payment.order} has been received. Thank you!`;
    return this.sendSMS(customer.phone, message);
  }

  async sendLowStockAlert(item, admin) {
    const message = `MillPro Alert: ${item.name} is low in stock (${item.quantity} ${item.unit} remaining). Please restock.`;
    return this.sendSMS(admin.phone, message);
  }

  async sendWelcomeMessage(user) {
    const message = `Welcome to MillPro, ${user.name}! Start ordering fresh grains and milling services at ${process.env.CLIENT_URL}`;
    return this.sendSMS(user.phone, message);
  }

  async sendPasswordResetCode(user, code) {
    const message = `MillPro: Your password reset code is: ${code}. This code expires in 10 minutes.`;
    return this.sendSMS(user.phone, message);
  }

  async sendVerificationCode(user, code) {
    const message = `MillPro: Your verification code is: ${code}.`;
    return this.sendSMS(user.phone, message);
  }
}

module.exports = new SMSService();