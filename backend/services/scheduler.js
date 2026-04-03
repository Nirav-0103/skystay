const cron = require('node-cron');
const Booking = require('../models/Booking');
const User = require('../models/User');
const emailService = require('./emailService');

// ─── 1. AUTO COMPLETE BOOKINGS (runs every hour) ───────────────
const autoCompleteBookings = async () => {
  try {
    const now = new Date();
    const expiredBookings = await Booking.find({
      bookingType: 'hotel',
      status: 'confirmed',
      checkOut: { $lt: now }
    });
    if (expiredBookings.length === 0) return;
    const ids = expiredBookings.map(b => b._id);
    await Booking.updateMany({ _id: { $in: ids } }, { status: 'completed' });
    console.log(`✅ [CRON] Auto-completed ${expiredBookings.length} hotel booking(s)`);
  } catch (err) {
    console.error('❌ [CRON] Auto-complete error:', err.message);
  }
};

// ─── 2. DAILY REPORT (runs every day at 8:00 AM) ──────────────
const sendDailyReport = async () => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const CANCELLED_STATUSES = ['cancelled', 'refund_requested', 'refunded'];
    const [
      todayBookings,
      todayCancellations,
      todayRevenueData,
      totalUsers,
      totalBookings,
      totalRevenueData,
      hotelBookings,
      flightBookings,
      pendingBookings,
    ] = await Promise.all([
      Booking.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
      Booking.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay }, status: { $in: CANCELLED_STATUSES } }),
      Booking.find({ createdAt: { $gte: startOfDay, $lt: endOfDay }, status: { $nin: CANCELLED_STATUSES } }),
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments(),
      Booking.find({ status: { $nin: CANCELLED_STATUSES } }),
      Booking.countDocuments({ bookingType: 'hotel', status: { $nin: CANCELLED_STATUSES } }),
      Booking.countDocuments({ bookingType: 'flight', status: { $nin: CANCELLED_STATUSES } }),
      Booking.countDocuments({ status: 'pending' }),
    ]);
    const todayRevenue = todayRevenueData.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalRevenue = totalRevenueData.reduce((sum, b) => sum + b.totalAmount, 0);
    const stats = { todayBookings, todayCancellations, todayRevenue, totalUsers, totalBookings, totalRevenue, hotelBookings, flightBookings, pendingBookings };
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await emailService.sendDailyReport(stats, admin.email);
    }
    console.log(`✅ [CRON] Daily report sent to ${admins.length} admin(s)`);
  } catch (err) {
    console.error('❌ [CRON] Daily report error:', err.message);
  }
};

// ─── 3. AUTO CONFIRM PENDING BOOKINGS (older than 10h) ────────
const autoConfirmBookings = async () => {
  try {
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);
    const pendingBookings = await Booking.find({ status: 'pending', createdAt: { $lt: tenHoursAgo } });
    if (pendingBookings.length === 0) return;
    const POINTS_RATE = 0.01;
    for (const booking of pendingBookings) {
      booking.status = 'confirmed';
      if (!booking.pointsAwarded) {
        const points = Math.floor(booking.totalAmount * POINTS_RATE);
        const user = await User.findById(booking.user);
        if (user) {
          user.skyPoints = (user.skyPoints || 0) + points;
          user.skyPointsHistory = user.skyPointsHistory || [];
          user.skyPointsHistory.push({ points, type: 'earned', description: `Auto-Confirmed: Booking #${booking.bookingId || booking._id}` });
          await user.save();
          booking.pointsAwarded = true;
          booking.pointsEarned = points;
        }
      }
      await booking.save();
      try {
        const populated = await Booking.findById(booking._id).populate('user hotel flight');
        if (populated.user) {
          await emailService.sendBookingConfirmed(populated, populated.user);
          await emailService.sendBookingInvoice(populated, populated.user);
        }
      } catch (e) { console.error(`❌ [CRON] Email error for booking ${booking._id}:`, e.message); }
    }
    console.log(`✅ [CRON] Auto-confirmed ${pendingBookings.length} booking(s).`);
  } catch (err) {
    console.error('❌ [CRON] Auto-confirm error:', err.message);
  }
};

// ─── START ALL CRON JOBS ───────────────────────────────────────
exports.startScheduler = () => {
  // Every hour: Auto-complete and Auto-confirm
  cron.schedule('0 * * * *', () => {
    autoCompleteBookings();
    autoConfirmBookings();
  }, { timezone: 'Asia/Kolkata' });

  // Daily report at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    sendDailyReport();
  }, { timezone: 'Asia/Kolkata' });

  console.log('✅ Automation scheduler started');
};

exports.runAutoComplete = autoCompleteBookings;
exports.runDailyReport = sendDailyReport;
exports.runAutoConfirm = autoConfirmBookings;
