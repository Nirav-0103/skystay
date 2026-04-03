const User = require('../models/User');
const emailService = require('../services/emailService');
const Hotel = require('../models/Hotel');
const Flight = require('../models/Flight');
const Booking = require('../models/Booking');

const crypto = require('crypto');

// Statuses that should NOT count towards revenue
const CANCELLED_STATUSES = ['cancelled', 'refund_requested', 'refunded'];

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalAdmins,
      totalHotels,
      totalFlights,
      totalBookings,
      bookings,
      todayStats,
      bookingTypeStats
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' }),
      Hotel.countDocuments({ isActive: true }),
      Flight.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.find({ status: 'confirmed' }),
      Booking.aggregate([
        { $match: { createdAt: { $gte: today }, status: 'confirmed' } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: '$bookingType', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
      ])
    ]);

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const pendingRefunds = await Booking.countDocuments({ 'refund.status': 'pending' });

    // ✅ Advanced Analytics: Top Destinations
    const topDestinations = await Booking.aggregate([
      { $match: { bookingType: 'hotel', status: 'confirmed' } },
      { $lookup: { from: 'hotels', localField: 'hotel', foreignField: '_id', as: 'hotelInfo' } },
      { $unwind: '$hotelInfo' },
      { $group: { _id: '$hotelInfo.city', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // ✅ Advanced Analytics: Revenue by Category
    const categoryRevenue = await Booking.aggregate([
      { $match: { bookingType: 'hotel', status: 'confirmed' } },
      { $lookup: { from: 'hotels', localField: 'hotel', foreignField: '_id', as: 'hotelInfo' } },
      { $unwind: '$hotelInfo' },
      { $group: { _id: '$hotelInfo.category', revenue: { $sum: '$totalAmount' } } }
    ]);

    // Efficiently get last 12 months revenue using aggregation
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyStats = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format monthly stats for frontend
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = d.toLocaleString('default', { month: 'short' }) + ' ' + y;
      
      const stat = monthlyStats.find(s => s._id.month === m && s._id.year === y);
      monthlyRevenue.push({
        month: label,
        revenue: stat ? stat.revenue : 0,
        bookings: stat ? stat.count : 0
      });
    }

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalHotels,
        totalFlights,
        totalBookings,
        totalRevenue,
        pendingBookings,
        pendingRefunds,
        topDestinations,
        categoryRevenue,
        todayBookings: todayStats[0]?.count || 0,
        todayRevenue: todayStats[0]?.revenue || 0,
        bookingTypeStats: {
          hotel: bookingTypeStats.find(s => s._id === 'hotel')?.count || 0,
          flight: bookingTypeStats.find(s => s._id === 'flight')?.count || 0,
          hotelRevenue: bookingTypeStats.find(s => s._id === 'hotel')?.revenue || 0,
          flightRevenue: bookingTypeStats.find(s => s._id === 'flight')?.revenue || 0
        },
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'user' };
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const users = await User.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

    const userIds = users.map(u => u._id);
    const bookingCounts = await Booking.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } }
    ]);
    const bookingMap = {};
    bookingCounts.forEach(b => { bookingMap[b._id.toString()] = b; });

    const enrichedUsers = users.map(u => ({
      ...u.toJSON(),
      bookingCount: bookingMap[u._id.toString()]?.count || 0,
      totalSpent: bookingMap[u._id.toString()]?.totalSpent || 0
    }));

    res.json({ success: true, count: users.length, total, users: enrichedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
    res.json({ success: true, count: admins.length, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const admin = await User.create({ name, email, password, phone, role: 'admin' });
    res.status(201).json({ success: true, admin, message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, phone, role: 'user' });
    res.status(201).json({ success: true, user, message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    if (user.isDefaultAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete the default admin. Please set another admin as default first.' 
      });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.setAsDefaultAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    // Remove default status from others
    await User.updateMany({ role: 'admin' }, { isDefaultAdmin: false });
    
    // Set new default
    admin.isDefaultAdmin = true;
    await admin.save();
    
    res.json({ success: true, message: `${admin.name} is now the default admin.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendResetPasswordEmail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:42011'}/reset-password/${resetToken}`;

    await emailService.sendForgotPasswordEmail(user, resetUrl);
    res.json({ success: true, message: `Password reset link sent to ${user.email}!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .populate('hotel', 'name city images pricePerNight')
      .populate('flight', 'flightNumber airline from to departureTime arrivalTime')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    booking.status = 'confirmed';
    
    // Award SkyPoints if not already awarded
    if (!booking.pointsAwarded) {
      const POINTS_RATE = 0.01;
      const points = Math.floor(booking.totalAmount * POINTS_RATE);
      const user = await User.findById(booking.user);
      if (user) {
        user.skyPoints = (user.skyPoints || 0) + points;
        user.skyPointsHistory = user.skyPointsHistory || [];
        user.skyPointsHistory.push({ 
          points, 
          type: 'earned', 
          description: `Booking #${booking.bookingId || booking._id} (Confirmed by Admin)` 
        });
        
        user.notifications.push({
          title: 'SkyPoints Earned! ✨',
          message: `You earned ${points} SkyPoints for booking #${booking.bookingId}.`,
          type: 'loyalty'
        });
        
        await user.save();
        booking.pointsAwarded = true;
        booking.pointsEarned = points;
      }
    }
    
    await booking.save();

    // Send confirmation email & invoice
    try {
      const populated = await Booking.findById(booking._id)
        .populate('user', 'name email phone')
        .populate('hotel', 'name city address images')
        .populate('flight', 'flightNumber airline from to departureTime arrivalTime');
      
      if (populated.user) {
        await emailService.sendBookingConfirmed(populated, populated.user);
        await emailService.sendBookingInvoice(populated, populated.user);
      }
    } catch (e) { 
      console.error('Email/Invoice error:', e.message); 
    }

    res.json({ success: true, booking, message: 'Booking confirmed and points awarded!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', cancelReason: req.body.reason || 'Rejected by admin', cancelledAt: new Date() },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    // Send cancellation email
    try {
      const user = await User.findById(booking.user);
      if (user) {
        await emailService.sendBookingCancelled(booking, user);
      }
    } catch (e) { 
      console.error('Cancellation Email error:', e.message); 
    }
    
    res.json({ success: true, booking, message: 'Booking rejected and user notified' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncSkyPoints = async (req, res) => {
  try {
    const confirmedBookings = await Booking.find({ 
      status: 'confirmed', 
      pointsAwarded: { $ne: true } 
    });
    
    let awardedCount = 0;
    let totalPointsAwarded = 0;
    const POINTS_RATE = 0.01;

    for (const booking of confirmedBookings) {
      const points = Math.floor(booking.totalAmount * POINTS_RATE);
      const user = await User.findById(booking.user);
      
      if (user) {
        user.skyPoints = (user.skyPoints || 0) + points;
        user.skyPointsHistory = user.skyPointsHistory || [];
        user.skyPointsHistory.push({ 
          points, 
          type: 'earned', 
          description: `Sync: Booking #${booking.bookingId || booking._id}` 
        });
        
        await user.save();
        
        booking.pointsAwarded = true;
        booking.pointsEarned = points;
        await booking.save();
        
        awardedCount++;
        totalPointsAwarded += points;
      }
    }

    res.json({ 
      success: true, 
      message: `Successfully synced SkyPoints for ${awardedCount} bookings. Total points: ${totalPointsAwarded}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const { type = 'bookings' } = req.query;

    if (type === 'bookings') {
      const bookings = await Booking.find()
        .populate('user', 'name email phone')
        .populate('hotel', 'name city')
        .populate('flight', 'flightNumber airline from to')
        .sort({ createdAt: -1 });

      const rows = [['Booking ID','Type','User Name','User Email','Hotel/Flight','Status','Amount (INR)','Payment Method','Date','Created At']];
      bookings.forEach(b => rows.push([
        b.bookingId || b._id, b.bookingType,
        b.user?.name || '', b.user?.email || '',
        b.bookingType === 'hotel' ? (b.hotel?.name || '') : (b.flight?.flightNumber || ''),
        b.status, b.totalAmount, b.paymentMethod || '',
        b.bookingType === 'hotel' ? (b.checkIn ? new Date(b.checkIn).toLocaleDateString() : '') : (b.travelDate ? new Date(b.travelDate).toLocaleDateString() : ''),
        new Date(b.createdAt).toLocaleString()
      ]));

      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="skystay-bookings-${Date.now()}.csv"`);
      return res.send(csv);
    }

    if (type === 'users') {
      const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
      const userIds = users.map(u => u._id);
      const bookingCounts = await Booking.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: '$user', count: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } }
      ]);
      const bookingMap = {};
      bookingCounts.forEach(b => { bookingMap[b._id.toString()] = b; });

      const rows = [['Name','Email','Phone','Status','Total Bookings','Total Spent (INR)','Joined']];
      users.forEach(u => {
        const bData = bookingMap[u._id.toString()] || {};
        rows.push([u.name, u.email, u.phone || '', u.isActive ? 'Active' : 'Inactive', bData.count || 0, bData.totalSpent || 0, new Date(u.createdAt).toLocaleDateString()]);
      });

      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="skystay-users-${Date.now()}.csv"`);
      return res.send(csv);
    }

    if (type === 'revenue') {
      const rows = [['Month','Bookings','Revenue (INR)']];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthBookings = await Booking.find({
          createdAt: { $gte: new Date(date.getFullYear(), date.getMonth(), 1), $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1) },
          // FIX: exclude all cancelled/refund statuses from revenue CSV too
          status: { $nin: CANCELLED_STATUSES }
        });
        const revenue = monthBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        rows.push([date.toLocaleString('default', { month: 'long' }) + ' ' + date.getFullYear(), monthBookings.length, revenue]);
      }

      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="skystay-revenue-${Date.now()}.csv"`);
      return res.send(csv);
    }

    res.status(400).json({ success: false, message: 'Invalid export type' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};