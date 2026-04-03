const express = require('express');
const router = express.Router();
const { 
  register, login, getMe, updateProfile, changePassword, 
  forgotPassword, resetPassword, toggleWishlist, getWishlist,
  markNotificationRead, markAllNotificationsRead, clearAllNotifications, deleteNotification
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/wishlist/toggle', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);

// Notification routes
router.put('/notifications/:id/read', protect, markNotificationRead);
router.put('/notifications/read-all', protect, markAllNotificationsRead);
router.delete('/notifications/clear-all', protect, clearAllNotifications);
router.delete('/notifications/:id', protect, deleteNotification);

module.exports = router;
