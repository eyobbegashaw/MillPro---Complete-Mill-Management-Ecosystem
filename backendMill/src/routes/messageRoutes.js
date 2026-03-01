const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAny } = require('../middleware/roleCheck');
const { validateMessage, validateIdParam, validatePagination } = require('../middleware/validation');
const { messageLimiter } = require('../middleware/rateLimiter');
const {
  getConversations,
  getConversation,
  createConversation,
  getMessages,
  sendMessage,
  markAsRead,
  markAsDelivered,
  deleteMessage,
  addReaction,
  removeReaction,
  archiveConversation,
  muteConversation,
  getUnreadCount,
  searchMessages
} = require('../controllers/messageController');

// All message routes require authentication
router.use(protect);
router.use(isAny);

// Conversation routes
router.get('/conversations', validatePagination, getConversations);
router.get('/conversations/:id', validateIdParam, getConversation);
router.post('/conversations', createConversation);
router.put('/conversations/:id/archive', validateIdParam, archiveConversation);
router.put('/conversations/:id/mute', validateIdParam, muteConversation);

// Message routes
router.get('/conversations/:conversationId/messages', validateIdParam, validatePagination, getMessages);
router.post('/conversations/:conversationId/messages', messageLimiter, validateMessage, sendMessage);
router.put('/messages/:id/read', validateIdParam, markAsRead);
router.put('/messages/:id/delivered', validateIdParam, markAsDelivered);
router.delete('/messages/:id', validateIdParam, deleteMessage);
router.post('/messages/:id/reactions', validateIdParam, addReaction);
router.delete('/messages/:id/reactions', validateIdParam, removeReaction);

// Utility routes
router.get('/unread', getUnreadCount);
router.get('/search', searchMessages);

module.exports = router;