const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAny } = require('../middleware/roleCheck');
const { validateIdParam, validatePagination } = require('../middleware/validation');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
  getNotificationSettings,
  updateNotificationSettings,
  subscribePush,
  unsubscribePush
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);
router.use(isAny);

// Main routes
router.get('/', validatePagination, getNotifications);
router.get('/unread/count', getUnreadCount);
router.put('/:id/read', validateIdParam, markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', validateIdParam, deleteNotification);
router.delete('/clear-all', clearAll);

// Settings routes
router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);

// Push notification subscription
router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);

module.exports = router;