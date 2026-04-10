const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

try {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} catch (e) {
  console.error("VAPID Keys poorly configured. Push will fail.");
}

// ─── Reusable helper: call from any controller to push to a user's devices ───
exports.sendPushToUser = async (userId, { title, message, url = '/' }) => {
  try {
    const subs = await PushSubscription.find({ user: userId, isActive: true });
    if (!subs.length) return;
    const payload = JSON.stringify({ title, message, url });
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
      } catch (err) {
        // 410 Gone or 404 = subscription expired, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.findByIdAndDelete(sub._id);
        }
      }
    }
  } catch (err) {
    console.error('sendPushToUser error:', err.message);
  }
};

exports.subscribe = async (req, res) => {
  try {
    const { subscription, deviceInfo } = req.body;
    await PushSubscription.findOneAndUpdate(
      { user: req.user._id, endpoint: subscription.endpoint },
      { keys: subscription.keys, deviceInfo, isActive: true },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, message: 'Push subscription saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.findOneAndDelete({ user: req.user._id, endpoint });
    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendTest = async (req, res) => {
  try {
    const subs = await PushSubscription.find({ user: req.user._id, isActive: true });
    if (!subs.length) return res.status(400).json({ success: false, message: 'No active push subscriptions' });

    const payload = JSON.stringify({
      title: 'SkyStay Push Notifications',
      message: 'Push notifications are successfully set up!',
      url: '/profile'
    });

    let sentCount = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
        sentCount++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.findByIdAndDelete(sub._id);
        }
      }
    }
    res.json({ success: true, message: `Test push sent to ${sentCount} devices` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
