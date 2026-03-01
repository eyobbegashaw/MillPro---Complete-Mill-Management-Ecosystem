const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);
    
    // Join user-specific room
    socket.join(`user-${socket.userId}`);
    socket.join(`role-${socket.userRole}`);
    
    // Join delivery rooms for drivers
    if (socket.userRole === 'driver') {
      socket.join(`driver-${socket.userId}`);
    }
    
    // Handle location updates from drivers
    socket.on('driver-location-update', async (data) => {
      const { deliveryId, location } = data;
      
      // Emit to customer if delivery is active
      socket.to(`delivery-${deliveryId}`).emit('driver-location-updated', {
        driverId: socket.userId,
        location,
        timestamp: new Date()
      });
      
      // Also emit to admin/operator for monitoring
      socket.to('role-admin').to('role-operator').emit('driver-tracking-update', {
        driverId: socket.userId,
        deliveryId,
        location,
        timestamp: new Date()
      });
    });
    
    // Join delivery tracking room (customer)
    socket.on('track-delivery', (deliveryId) => {
      socket.join(`delivery-${deliveryId}`);
    });
    
    // Handle chat messages
    socket.on('send-message', (data) => {
      const { recipientId, message } = data;
      socket.to(`user-${recipientId}`).emit('new-message', {
        senderId: socket.userId,
        message,
        timestamp: new Date()
      });
    });
    
    // Handle order status updates
    socket.on('order-status-update', (data) => {
      const { orderId, status, customerId } = data;
      socket.to(`user-${customerId}`).emit('order-status-changed', {
        orderId,
        status,
        timestamp: new Date()
      });
    });
    
    // Handle delivery status updates
    socket.on('delivery-status-update', (data) => {
      const { deliveryId, status, customerId } = data;
      socket.to(`user-${customerId}`).emit('delivery-status-changed', {
        deliveryId,
        status,
        timestamp: new Date()
      });
    });
    
    // Handle driver assignment
    socket.on('assign-driver', (data) => {
      const { deliveryId, driverId } = data;
      socket.to(`driver-${driverId}`).emit('delivery-assigned', {
        deliveryId,
        assignedBy: socket.userId,
        timestamp: new Date()
      });
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      const { recipientId, isTyping } = data;
      socket.to(`user-${recipientId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // If driver, update status to offline
      if (socket.userRole === 'driver') {
        // You might want to update driver status in database here
        io.to('role-admin').to('role-operator').emit('driver-offline', {
          driverId: socket.userId,
          timestamp: new Date()
        });
      }
    });
  });
  
  return io;
};