const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// Get user's conversations
exports.getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const conversations = await Conversation.find({
      participants: req.user.id,
      isArchived: false
    })
      .populate('participants', 'name email profilePicture')
      .populate('lastMessage')
      .sort('-lastMessageAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Conversation.countDocuments({
      participants: req.user.id,
      isArchived: false
    });

    // Add unread count for each conversation
    const conversationsWithUnread = conversations.map(conv => {
      const unreadCount = conv.unreadCount.get(req.user.id.toString()) || 0;
      return {
        ...conv.toObject(),
        unreadCount
      };
    });

    res.json({
      success: true,
      data: conversationsWithUnread,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
};

// Get single conversation
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name email profilePicture role phone')
      .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation'
    });
  }
};

// Create new conversation
exports.createConversation = async (req, res) => {
  try {
    const { participantId, type, name, metadata } = req.body;

    // Check if conversation already exists (for direct messages)
    if (type === 'direct') {
      const existingConversation = await Conversation.findOne({
        type: 'direct',
        participants: { $all: [req.user.id, participantId], $size: 2 }
      });

      if (existingConversation) {
        return res.json({
          success: true,
          data: existingConversation,
          message: 'Conversation already exists'
        });
      }
    }

    const conversation = new Conversation({
      participants: [req.user.id, participantId],
      type: type || 'direct',
      name,
      metadata
    });

    await conversation.save();
    await conversation.populate('participants', 'name email profilePicture');

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
};

// Get messages in conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    const query = { conversation: conversationId, isDeleted: false };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email profilePicture')
      .populate('replyTo')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', attachments, location, metadata, replyTo } = req.body;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: req.user.id,
      content,
      type,
      attachments,
      location,
      metadata,
      replyTo
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    
    // Increment unread count for all other participants
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        conversation.incrementUnread(participantId);
      }
    });
    
    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'name email profilePicture');
    await message.populate('replyTo');

    // Send real-time notification
    if (global.io) {
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== req.user.id) {
          global.io.to(`user-${participantId}`).emit('new-message', {
            conversationId,
            message
          });
        }
      });
    }

    // Send push notifications to other participants
    conversation.participants.forEach(async (participantId) => {
      if (participantId.toString() !== req.user.id) {
        const user = await User.findById(req.user.id);
        await notificationService.notifyNewMessage(conversation, user, participantId);
      }
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.markAsRead(req.user.id);

    // Update conversation unread count
    const conversation = await Conversation.findById(message.conversation);
    conversation.resetUnread(req.user.id);
    await conversation.save();

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read'
    });
  }
};

// Mark message as delivered
exports.markAsDelivered = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.markAsDelivered(req.user.id);

    res.json({
      success: true,
      message: 'Message marked as delivered'
    });
  } catch (error) {
    console.error('Mark as delivered error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as delivered'
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Can only delete your own messages'
      });
    }

    message.isDeleted = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

// Add reaction
exports.addReaction = async (req, res) => {
  try {
    const { reaction } = req.body;
    
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.addReaction(req.user.id, reaction);

    res.json({
      success: true,
      message: 'Reaction added'
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction'
    });
  }
};

// Remove reaction
exports.removeReaction = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.removeReaction(req.user.id);

    res.json({
      success: true,
      message: 'Reaction removed'
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction'
    });
  }
};

// Archive conversation
exports.archiveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    conversation.isArchived = true;
    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation archived'
    });
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive conversation'
    });
  }
};

// Mute conversation
exports.muteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!conversation.isMuted.includes(req.user.id)) {
      conversation.isMuted.push(req.user.id);
      await conversation.save();
    }

    res.json({
      success: true,
      message: 'Conversation muted'
    });
  } catch (error) {
    console.error('Mute conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mute conversation'
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
      isArchived: false
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      totalUnread += conv.unreadCount.get(req.user.id.toString()) || 0;
    });

    res.json({
      success: true,
      data: { totalUnread }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const { q, conversationId } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const query = {
      content: { $regex: q, $options: 'i' },
      isDeleted: false
    };

    if (conversationId) {
      query.conversation = conversationId;
    } else {
      // Only search conversations user is part of
      const conversations = await Conversation.find({
        participants: req.user.id
      }).select('_id');
      
      query.conversation = { $in: conversations.map(c => c._id) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email profilePicture')
      .populate('conversation')
      .sort('-createdAt')
      .limit(50);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
};

    