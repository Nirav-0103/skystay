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

// SkyPay Wallet - Razorpay Integration
const axios = require('axios');
const crypto = require('crypto');

router.post('/wallet/razorpay-order', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const rzpId = process.env.RAZORPAY_KEY_ID;
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;

    if (!rzpId || !rzpSecret) {
      return res.status(500).json({ success: false, message: 'Payment gateway not configured' });
    }

    // Use official Razorpay SDK
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({ key_id: rzpId, key_secret: rzpSecret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${String(req.user._id).slice(-8)}_${Date.now().toString().slice(-8)}`
    });

    res.json({ success: true, order, key: rzpId });

  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ success: false, message: error?.error?.description || error.message || 'Payment gateway error' });
  }
});


router.post('/wallet/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // Verify signature using built-in Crypto module
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    // Signature matches, safely add funds
    const user = await User.findById(req.user._id);
    user.walletBalance = (user.walletBalance || 0) + Number(amount);
    
    // Add transaction history for wallet
    user.skyPointsHistory.push({
      points: amount,
      type: 'earned',
      description: `Added ₹${amount} via Razorpay (ID: ${razorpay_payment_id})`
    });

    await user.save();
    
    // Send Automated Email Receipt
    const emailService = require('../services/emailService');
    emailService.sendWalletTransactionEmail(user, amount, user.walletBalance).catch(e => console.error('Wallet email err:', e));

    res.json({ success: true, walletBalance: user.walletBalance });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
