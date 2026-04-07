const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, getAllAdmins, createAdmin, createUser,
  deleteUser, toggleUserStatus, getPendingBookings, confirmBooking,
  rejectBooking, exportCSV, syncSkyPoints, setAsDefaultAdmin,
  sendResetPasswordEmail
} = require('../controllers/adminController');
const { getAllRefunds, updateRefundStage, rejectRefund } = require('../controllers/refundController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/users', protect, adminOnly, getAllUsers);
router.post('/users', protect, adminOnly, createUser);
router.get('/admins', protect, adminOnly, getAllAdmins);
router.post('/admins', protect, adminOnly, createAdmin);
router.put('/admins/:id/default', protect, adminOnly, setAsDefaultAdmin);
router.post('/users/:id/reset-password', protect, adminOnly, sendResetPasswordEmail);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.put('/users/:id/toggle', protect, adminOnly, toggleUserStatus);
router.get('/pending-bookings', protect, adminOnly, getPendingBookings);
router.put('/bookings/:id/confirm', protect, adminOnly, confirmBooking);
router.put('/bookings/:id/reject', protect, adminOnly, rejectBooking);
router.post('/sync-skypoints', protect, adminOnly, syncSkyPoints);
router.get('/export', protect, adminOnly, exportCSV);

// Refund routes
router.get('/refunds', protect, adminOnly, getAllRefunds);
router.put('/refunds/:id/stage', protect, adminOnly, updateRefundStage);
router.put('/refunds/:id/reject', protect, adminOnly, rejectRefund);

// ─── Admin Wallet Credit (bypass Razorpay - admin only) ──────────────────────
router.post('/users/:id/wallet-credit', protect, adminOnly, async (req, res) => {
  try {
    const { amount, note } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid amount' });
    }
    const User = require('../models/User');
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const creditAmount = Number(amount);
    user.walletBalance = (user.walletBalance || 0) + creditAmount;

    // Log in skyPointsHistory for transparency
    user.skyPointsHistory = user.skyPointsHistory || [];
    user.skyPointsHistory.push({
      points: creditAmount,
      type: 'earned',
      description: `💳 Admin credit: ₹${creditAmount}${note ? ` — ${note}` : ''} (by ${req.user.name})`
    });

    await user.save();

    // Send email notification to user
    try {
      const emailService = require('../services/emailService');
      emailService.sendWalletTransactionEmail(user, creditAmount, user.walletBalance);
    } catch (e) { /* email failure shouldn't block */ }

    res.json({
      success: true,
      message: `₹${creditAmount} credited to ${user.name}'s wallet`,
      newBalance: user.walletBalance
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ─── One-time image migration: removes broken local /uploads/ URLs ───────────
router.post('/fix-images', protect, adminOnly, async (req, res) => {
  try {
    const Hotel = require('../models/Hotel');

    // Find hotels that have local/localhost image URLs
    const hotels = await Hotel.find({
      images: {
        $elemMatch: {
          $regex: /^\/uploads\/|localhost|^hotel-/
        }
      }
    });

    let fixedCount = 0;
    for (const hotel of hotels) {
      const before = hotel.images.length;
      // Keep only valid external URLs (Cloudinary, Unsplash, etc.)
      hotel.images = hotel.images.filter(img =>
        img &&
        typeof img === 'string' &&
        img.startsWith('http') &&
        !img.includes('localhost')
      );
      if (hotel.images.length !== before) {
        await hotel.save();
        fixedCount++;
      }
    }

    res.json({
      success: true,
      message: `Scanned ${hotels.length} hotels, fixed ${fixedCount} hotels with broken images.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;