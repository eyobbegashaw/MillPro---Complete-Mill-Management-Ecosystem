const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group', 'support'],
    default: 'direct'
  },
  name: {
    type: String,
    trim: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isMuted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  metadata: {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Update last message
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Get unread count for user
conversationSchema.methods.getUnreadCount = function(userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

// Increment unread count
conversationSchema.methods.incrementUnread = function(userId) {
  const userIdStr = userId.toString();
  const currentCount = this.unreadCount.get(userIdStr) || 0;
  this.unreadCount.set(userIdStr, currentCount + 1);
};

// Reset unread count
conversationSchema.methods.resetUnread = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
};

// Get conversation title for display
conversationSchema.methods.getDisplayName = function(currentUserId) {
  if (this.name) return this.name;
  
  if (this.type === 'direct') {
    const otherParticipant = this.participants.find(
      p => p.toString() !== currentUserId.toString()
    );
    return otherParticipant ? otherParticipant.name : 'Conversation';
  }
  
  return this.type === 'support' ? 'Support Chat' : 'Group Chat';
};

module.exports = mongoose.model('Conversation', conversationSchema);