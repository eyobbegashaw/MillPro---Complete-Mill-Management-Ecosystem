const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'location', 'order_update', 'delivery_update'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'audio']
    },
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  }],
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  metadata: {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery'
    },
    status: String,
    update: mongoose.Schema.Types.Mixed
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reaction: {
      type: String,
      enum: ['👍', '❤️', '😂', '😮', '😢', '😡']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Mark as read
messageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(r => r.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId });
  }
  return this.save();
};

// Mark as delivered
messageSchema.methods.markAsDelivered = function(userId) {
  if (!this.deliveredTo.some(d => d.user.toString() === userId.toString())) {
    this.deliveredTo.push({ user: userId });
  }
  return this.save();
};

// Add reaction
messageSchema.methods.addReaction = function(userId, reaction) {
  const existingReaction = this.reactions.find(
    r => r.user.toString() === userId.toString()
  );
  
  if (existingReaction) {
    existingReaction.reaction = reaction;
    existingReaction.createdAt = new Date();
  } else {
    this.reactions.push({ user: userId, reaction });
  }
  
  return this.save();
};

// Remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);