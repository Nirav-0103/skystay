const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/notifications', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    res.json({ success: true, notifications: user.notifications.sort((a,b) => b.createdAt - a.createdAt) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const notif = user.notifications.id(req.params.id);
    if (notif) {
      notif.read = true;
      await user.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.notifications.forEach(n => n.read = true);
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/notifications/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.notifications.pull(req.params.id);
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Saved Passengers
router.get('/saved-passengers', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedPassengers');
    res.json({ success: true, savedPassengers: user.savedPassengers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/saved-passengers', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // Check if already exists by name to avoid duplicates
    const exists = user.savedPassengers.find(p => p.name.toLowerCase() === req.body.name.toLowerCase());
    if (exists) {
      // Update existing
      Object.assign(exists, req.body);
    } else {
      user.savedPassengers.push(req.body);
    }
    await user.save();
    res.json({ success: true, savedPassengers: user.savedPassengers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SkyPay Wallet
router.post('/wallet/add', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    const user = await User.findById(req.user._id);
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    
    // Add transaction history for wallet (optional, appending to skyPointsHistory for now)
    user.skyPointsHistory.push({
      points: amount,
      type: 'earned',
      description: `Added ₹${amount} to SkyPay Wallet`
    });

    await user.save();
    res.json({ success: true, walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
