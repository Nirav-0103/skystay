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

// ─── 4. EMAIL AUTOMATION ORCHESTRATORS ────────────────────────
const sendPreTripReminders = async () => {
  try {
    const now = new Date();
    const future = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours
    const bookings = await Booking.find({
      status: 'confirmed',
      'emailsSent.preTrip': false,
    }).populate('user hotel flight');

    let count = 0;
    for (const b of bookings) {
      let tripDate = null;
      if (b.bookingType === 'hotel' && b.checkIn) tripDate = new Date(b.checkIn);
      if (b.bookingType === 'flight' && b.flight?.departureTime) tripDate = new Date(b.flight.departureTime);
      
      if (tripDate && tripDate > now && tripDate < future) {
        if (b.user?.email && typeof emailService.sendPreTripReminder === 'function') {
          await emailService.sendPreTripReminder(b, b.user);
        }
        b.emailsSent.preTrip = true;
        await b.save();
        count++;
      }
    }
    if(count > 0) console.log(`✅ [CRON] Sent ${count} Pre-Trip Reminder emails.`);
  } catch (err) { console.error('❌ [CRON] Pre-trip error:', err.message); }
};

const sendPostTripReviews = async () => {
  try {
    const bookings = await Booking.find({
      status: 'completed',
      'emailsSent.postTrip': false,
    }).populate('user hotel flight');

    let count = 0;
    for (const b of bookings) {
       if (b.user?.email && typeof emailService.sendPostTripReview === 'function') {
         await emailService.sendPostTripReview(b, b.user);
       }
       b.emailsSent.postTrip = true;
       await b.save();
       count++;
    }
    if(count > 0) console.log(`✅ [CRON] Sent ${count} Post-Trip Review emails.`);
  } catch (err) { console.error('❌ [CRON] Post-trip error:', err.message); }
};

const sendAbandonedCartReminders = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const bookings = await Booking.find({
      status: 'pending',
      'emailsSent.abandonedCart': false,
      createdAt: { $lt: oneHourAgo, $gt: twentyFourHoursAgo }
    }).populate('user hotel flight');

    let count = 0;
    for (const b of bookings) {
      if (b.user?.email && typeof emailService.sendAbandonedCartReminder === 'function') {
         await emailService.sendAbandonedCartReminder(b, b.user);
      }
      b.emailsSent.abandonedCart = true;
      await b.save();
      count++;
    }
    if(count > 0) console.log(`✅ [CRON] Sent ${count} Abandoned Cart emails.`);
  } catch (err) { console.error('❌ [CRON] Abandoned Cart error:', err.message); }
};

// ─── START ALL CRON JOBS ───────────────────────────────────────
exports.startScheduler = () => {
  // Every hour: Auto-complete, auto-confirm, abandoned carts
  cron.schedule('0 * * * *', () => {
    autoCompleteBookings();
    autoConfirmBookings();
    sendAbandonedCartReminders();
  }, { timezone: 'Asia/Kolkata' });

  // Daily report at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    sendDailyReport();
  }, { timezone: 'Asia/Kolkata' });

  // Pre-Trip Reminders at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    sendPreTripReminders();
  }, { timezone: 'Asia/Kolkata' });

  // Post-Trip Reviews at 10:00 AM
  cron.schedule('0 10 * * *', () => {
    sendPostTripReviews();
  }, { timezone: 'Asia/Kolkata' });

  console.log('✅ Automation scheduler started');
};

exports.runAutoComplete = autoCompleteBookings;
exports.runDailyReport = sendDailyReport;
exports.runAutoConfirm = autoConfirmBookings;
