const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  deviceInfo: { type: String, default: 'Unknown Device' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Prevent duplicate exact subscriptions for the same user
pushSubscriptionSchema.index({ user: 1, endpoint: 1 }, { unique: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
