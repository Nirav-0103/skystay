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

    // Amount is received in INR from frontend, convert to Paise for Razorpay
    const amountInPaise = amount * 100;

    const rzpId = process.env.RAZORPAY_KEY_ID;
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;

    if (!rzpId || !rzpSecret || rzpId.startsWith('rzp_test_z4Fk2j7aY2aXzV')) {
      // NOTE: If generic test keys are present, we can either throw error or mock. 
      // But we will hit the Razorpay genuine test API, which requires valid test keys!
      // If the user's test keys are totally fake, Axios will throw 401 Unauthorized.
      // That's fine, it behaves exactly like a real API failure.
    }

    const auth = Buffer.from(`${rzpId}:${rzpSecret}`).toString('base64');

    const response = await axios.post('https://api.razorpay.com/v1/orders', {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${req.user._id}_${Date.now()}`
    }, {
      headers: { Authorization: `Basic ${auth}` }
    });

    res.json({
      success: true,
      order: response.data,
      key: rzpId // Frontend needs the generic key to invoke checkout
    });

  } catch (error) {
    console.error('Razorpay Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.response?.data?.error?.description || error.message });
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
    res.json({ success: true, walletBalance: user.walletBalance });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
