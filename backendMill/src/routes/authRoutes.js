const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  googleAuth,
  localLogin,
  register,
  verifyToken,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword
} = require('../controllers/authController');

// Public routes with rate limiting
router.post('/google', authLimiter, googleAuth);
router.post('/login', authLimiter, validateLogin, localLogin);
router.post('/register', authLimiter, validateRegister, register);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// Protected routes
router.get('/verify', protect, verifyToken);
router.post('/logout', protect, logout);
router.post('/refresh-token', protect, refreshToken);
router.post('/change-password', protect, changePassword);

module.exports = router;