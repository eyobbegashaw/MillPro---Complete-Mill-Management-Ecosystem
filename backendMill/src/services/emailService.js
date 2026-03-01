const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"MillPro" <${process.env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      };

      if (options.attachments) {
        mailOptions.attachments = options.attachments;
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Welcome to MillPro!</h1>
        <p>Dear ${user.name},</p>
        <p>Thank you for registering with MillPro. We're excited to have you on board!</p>
        <p>With your account, you can:</p>
        <ul>
          <li>Browse our fresh grains and legumes</li>
          <li>Place orders online</li>
          <li>Track your deliveries in real-time</li>
          <li>Communicate with operators</li>
        </ul>
        <p>Get started by visiting our <a href="${process.env.CLIENT_URL}/products">products page</a>.</p>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The MillPro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to MillPro!',
      html
    });
  }

  async sendOrderConfirmation(order, user) {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity} kg</td>
        <td>${item.pricePerKg} Birr/kg</td>
        <td>${(item.quantity * item.pricePerKg).toFixed(2)} Birr</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Order Confirmation</h1>
        <p>Dear ${user.name},</p>
        <p>Thank you for your order! Your order has been received and is being processed.</p>
        
        <h2>Order Details</h2>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        
        <h3>Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #4CAF50;">Product</th>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #4CAF50;">Quantity</th>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #4CAF50;">Price</th>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #4CAF50;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; padding: 8px;"><strong>Subtotal:</strong></td>
              <td style="padding: 8px;">${order.totals.subtotal.toFixed(2)} Birr</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right; padding: 8px;"><strong>Milling Fee:</strong></td>
              <td style="padding: 8px;">${order.totals.millingTotal.toFixed(2)} Birr</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right; padding: 8px;"><strong>Delivery Fee:</strong></td>
              <td style="padding: 8px;">${order.totals.deliveryFee.toFixed(2)} Birr</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right; padding: 8px;"><strong>Order Fee:</strong></td>
              <td style="padding: 8px;">${order.totals.orderFee.toFixed(2)} Birr</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right; padding: 8px; border-top: 2px solid #4CAF50;">
                <strong>Total:</strong>
              </td>
              <td style="padding: 8px; border-top: 2px solid #4CAF50;">
                <strong>${order.totals.total.toFixed(2)} Birr</strong>
              </td>
            </tr>
          </tfoot>
        </table>
        
        <h3>Delivery Address</h3>
        <p>${order.deliveryAddress.address}</p>
        
        <p>You can track your order <a href="${process.env.CLIENT_URL}/orders/${order._id}">here</a>.</p>
        
        <p>Thank you for choosing MillPro!</p>
        <p>Best regards,<br>The MillPro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Order Confirmation #${order.orderNumber}`,
      html
    });
  }

  async sendOrderStatusUpdate(order, user) {
    const statusMessages = {
      pending: 'Your order has been received and is waiting to be processed.',
      processing: 'Your order is now being processed by our team.',
      ready: 'Your order is ready for pickup/delivery.',
      assigned: 'A driver has been assigned to your delivery.',
      'in-transit': 'Your order is on the way!',
      delivered: 'Your order has been delivered successfully.',
      cancelled: 'Your order has been cancelled.'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Order Status Update</h1>
        <p>Dear ${user.name},</p>
        <p>Your order #${order.orderNumber} has been updated.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0;">Status: ${order.status.toUpperCase()}</h2>
          <p style="margin: 0;">${statusMessages[order.status] || 'Your order status has been updated.'}</p>
        </div>
        
        <p>Click <a href="${process.env.CLIENT_URL}/orders/${order._id}">here</a> to view your order details.</p>
        
        <p>Thank you for choosing MillPro!</p>
        <p>Best regards,<br>The MillPro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Order Update #${order.orderNumber}`,
      html
    });
  }

  async sendDeliveryUpdate(delivery, user) {
    const statusMessages = {
      assigned: 'A driver has been assigned to your delivery.',
      'in-transit': 'Your delivery is on the way!',
      delivered: 'Your delivery has been completed.'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Delivery Update</h1>
        <p>Dear ${user.name},</p>
        <p>Your delivery for order #${delivery.order.orderNumber} has been updated.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0;">Status: ${delivery.status.toUpperCase()}</h2>
          <p style="margin: 0;">${statusMessages[delivery.status] || 'Your delivery status has been updated.'}</p>
        </div>
        
        <p>Track your delivery in real-time <a href="${process.env.CLIENT_URL}/track/${delivery.trackingCode}">here</a>.</p>
        
        <p>Thank you for choosing MillPro!</p>
        <p>Best regards,<br>The MillPro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Delivery Update - Order #${delivery.order.orderNumber}`,
      html
    });
  }

  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Password Reset Request</h1>
        <p>Dear ${user.name},</p>
        <p>We received a request to reset your password.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p>If you didn't request this, please ignore this email. The link will expire in 1 hour.</p>
        <p>For security, never share this link with anyone.</p>
        
        <p>Best regards,<br>The MillPro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html
    });
  }

  async sendInvoice(order, user, pdfBuffer) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Invoice for Order #${order.orderNumber}</h1>
        <p>Dear ${user.name},</p>
        <p>Thank you for your order. Please find your invoice attached.</p>
        <p>You can also view your invoice online <a href="${process.env.CLIENT_URL}/orders/${order._id}/invoice">here</a>.</p>
        <p>Thank you for choosing MillPro!</p>
        <p>Best regards,<br>The MillPro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Invoice for Order #${order.orderNumber}`,
      html,
      attachments: [{
        filename: `invoice-${order.orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
  }

  async sendLowStockAlert(item, admins) {
    const adminEmails = admins.map(admin => admin.email).join(', ');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f44336;">⚠️ Low Stock Alert</h1>
        <p>The following item is running low in inventory:</p>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${item.name}</h3>
          <p><strong>Current Stock:</strong> ${item.quantity} ${item.unit}</p>
          <p><strong>Alert Level:</strong> ${item.alertLevel} ${item.unit}</p>
          <p><strong>Category:</strong> ${item.category}</p>
        </div>
        
        <p>Please restock this item as soon as possible.</p>
        <p>View inventory <a href="${process.env.CLIENT_URL}/admin/warehouse">here</a>.</p>
        
        <p>Best regards,<br>MillPro System</p>
      </div>
    `;

    return this.sendEmail({
      to: adminEmails,
      subject: `⚠️ Low Stock Alert: ${item.name}`,
      html
    });
  }
}

module.exports = new EmailService();