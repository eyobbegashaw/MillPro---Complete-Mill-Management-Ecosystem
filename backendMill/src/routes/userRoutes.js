const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin, isOwner } = require('../middleware/roleCheck');
const { validateIdParam, validatePagination } = require('../middleware/validation');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  uploadAvatar,
  getActivityLog,
  getUserStats,
  toggleUserStatus,
  getUsersByRole,
  searchUsers,
  exportUsers
} = require('../controllers/userController');

// Profile routes (accessible by authenticated user)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/profile/avatar', protect, uploadAvatar);
router.get('/activity', protect, getActivityLog);

// Admin only routes
router.use(protect);
router.use(isAdmin);

// User management
router.get('/', validatePagination, getUsers);
router.get('/stats', getUserStats);
router.get('/role/:role', getUsersByRole);
router.get('/search', searchUsers);
router.get('/export', exportUsers);
router.get('/:id', validateIdParam, getUser);
router.put('/:id', validateIdParam, updateUser);
router.delete('/:id', validateIdParam, deleteUser);
router.put('/:id/toggle-status', validateIdParam, toggleUserStatus);

module.exports = router;