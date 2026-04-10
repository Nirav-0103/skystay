const Booking = require('../models/Booking');
const User = require('../models/User');
const emailService = require('../services/emailService');
const Hotel = require('../models/Hotel');
const Flight = require('../models/Flight');
const { sendPushToUser } = require('./pushController');

const POINTS_RATE = 0.01;

exports.createBooking = async (req, res) => {
  try {
    const bookingData = { ...req.body, user: req.user._id };

    // Hotel booking calculations
    if (bookingData.bookingType === 'hotel') {
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);

      const hotel = await Hotel.findById(bookingData.hotel);
      if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      bookingData.nights = nights;
      const roomType = hotel.roomTypes?.find(r => r.name === bookingData.roomType);
      bookingData.baseAmount = (roomType ? roomType.price : hotel.pricePerNight) * nights;
    }

    // Flight booking
    if (bookingData.bookingType === 'flight') {
      if (!bookingData.date) {
        return res.status(400).json({ success: false, message: 'Please select a flight date' });
      }
      const flight = await Flight.findById(bookingData.flight);
      if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });
      const seatClass = flight.seatClasses.find(s => s.className === bookingData.seatClass);
      if (!seatClass || seatClass.seatsAvailable < bookingData.passengers) {
        return res.status(400).json({ success: false, message: 'Not enough seats available' });
      }
      bookingData.baseAmount = seatClass.price * bookingData.passengers;

      // Calculate add-ons total
      const addonsTotal = (bookingData.addons || []).reduce((sum, a) => {
        const multiplier = a.per === '/person' ? bookingData.passengers : 1;
        return sum + (a.price * multiplier);
      }, 0);
      bookingData.addonsAmount = addonsTotal;

      // Apply discount
      bookingData.totalAmount = bookingData.baseAmount + addonsTotal - (bookingData.discount || 0);

      // Reduce available seats
      seatClass.seatsAvailable -= bookingData.passengers;
      await flight.save();
    }

    if (bookingData.paymentDetails?.status === 'failed') {
      bookingData.status = 'cancelled';
      bookingData.paymentStatus = 'pending';
      const booking = await Booking.create(bookingData);
      
      // Trigger automatic refund process for failed payment
      booking.refund = {
        status: 'pending',
        amount: booking.totalAmount,
        reason: 'Automatic: Payment Failed at Gateway',
        requestedAt: new Date(),
        currentStage: 0,
        history: [{
          stage: 'Refund Requested',
          message: 'System initiated refund due to payment failure.',
          timestamp: new Date()
        }]
      };
      await booking.save();

      return res.status(201).json({ 
        success: true, 
        message: 'Payment failed. Refund initiated automatically.', 
        booking 
      });
    }

    bookingData.status = 'pending';
    const booking = await Booking.create(bookingData);
    const populated = await Booking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate('hotel', 'name city address images')
      .populate('flight', 'flightNumber airline from to departureTime arrivalTime');

    // Await email delivery in background to avoid exiting before it fires
    emailService.sendBookingInvoice(populated, populated.user).catch(e => console.error('Invoice email err:', e));

    const user = await User.findById(req.user._id);
    if (user) {
      // ── Deduct wallet balance if paid via SkyPay Wallet ──
      if (bookingData.paymentMethod === 'wallet') {
        const totalToPay = bookingData.totalAmount || bookingData.baseAmount || 0;
        if ((user.walletBalance || 0) < totalToPay) {
          // Delete the booking we just created and reject
          await Booking.findByIdAndDelete(booking._id);
          return res.status(400).json({ success: false, message: 'Insufficient SkyPay Wallet balance' });
        }
        user.walletBalance = (user.walletBalance || 0) - totalToPay;
        user.skyPointsHistory = user.skyPointsHistory || [];
        user.skyPointsHistory.push({
          points: -totalToPay,
          type: 'spent',
          description: `Booking #${booking.bookingId} paid via SkyPay Wallet`
        });
      }

      user.notifications.push({
        title: 'Booking Created! 📋',
        message: `Your booking for ${bookingData.bookingType === 'hotel' ? populated.hotel?.name : populated.flight?.airline} has been received.`,
        type: 'booking'
      });
      await user.save();

      // 🔔 Fire real browser push notification (background)
      sendPushToUser(user._id, {
        title: 'Booking Created! 📋',
        message: `Your ${bookingData.bookingType} booking has been received and is pending confirmation.`,
        url: '/bookings'
      });
    }

    res.status(201).json({ success: true, booking: populated, walletBalance: user?.walletBalance });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('hotel', 'name city images')
      .populate('flight', 'flightNumber airline from to departureTime arrivalTime status delayMinutes')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hotel').populate('flight').populate('user', 'name email phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this booking' });
    }
    booking.status = 'cancelled';
    booking.cancelReason = req.body.reason || 'Cancelled by user';
    booking.cancelledAt = Date.now();
    await booking.save();

    const user = await User.findById(req.user._id);
    emailService.sendBookingCancelled(booking, user).catch(e => console.error('Cancel email err:', e));

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW: Web Check-in
exports.checkIn = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.bookingType !== 'flight') {
      return res.status(400).json({ success: false, message: 'Check-in only for flight bookings' });
    }
    if (booking.checkedIn) {
      return res.status(400).json({ success: false, message: 'Already checked in' });
    }

    booking.checkedIn = true;
    booking.checkinTime = new Date();
    booking.boardingPass = `BP-${booking.bookingId}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await booking.save();

    const user = await User.findById(req.user._id);
    if (user) {
      user.notifications.push({
        title: '✅ Check-in Successful!',
        message: `Boarding pass generated for booking #${booking.bookingId}`,
        type: 'success'
      });
      await user.save();
    }

    res.json({ success: true, boardingPass: booking.boardingPass, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.bookingType = type;
    const skip = (page - 1) * limit;
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('hotel', 'name city')
      .populate('flight', 'flightNumber airline from to')
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, count: bookings.length, total, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status, refundAmount: req.body.refundAmount }, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Award SkyPoints on confirmation
    if (req.body.status === 'confirmed' && !booking.pointsAwarded) {
      const points = Math.floor(booking.totalAmount * POINTS_RATE);
      const userToUpdate = await User.findById(booking.user);
      if (userToUpdate) {
        userToUpdate.skyPoints = (userToUpdate.skyPoints || 0) + points;
        userToUpdate.skyPointsHistory = userToUpdate.skyPointsHistory || [];
        userToUpdate.skyPointsHistory.push({ points, type: 'earned', description: `Booking #${booking.bookingId}` });
        booking.pointsAwarded = true;
        booking.pointsEarned = points;
        userToUpdate.notifications.push({
          title: 'SkyPoints Earned! ✨',
          message: `You earned ${points} SkyPoints for booking #${booking.bookingId}.`,
          type: 'loyalty'
        });
        await userToUpdate.save();
        await booking.save();
      }
      
      // ✅ Send Confirmation Email with Invoice
      const populated = await Booking.findById(booking._id)
        .populate('user', 'name email phone')
        .populate('hotel', 'name city address images')
        .populate('flight', 'flightNumber airline from to departureTime arrivalTime');
      
      // Fire emails in background - do NOT await (instant API response)
      emailService.sendBookingConfirmed(populated, populated.user).catch(e => console.error('Confirmed email err:', e));
      emailService.sendBookingInvoice(populated, populated.user).catch(e => console.error('Invoice email err:', e));
    }

    const user = await User.findById(booking.user);
    if (user) {
      const emoji = req.body.status === 'confirmed' ? '✅' : req.body.status === 'cancelled' ? '❌' : 'ℹ️';
      user.notifications.push({
        title: `Booking Update ${emoji}`,
        message: `Booking #${booking.bookingId} is now ${req.body.status.toUpperCase()}.`,
        type: 'booking'
      });
      await user.save();

      // 🔔 Fire real browser push notification (background)
      sendPushToUser(user._id, {
        title: `Booking ${req.body.status === 'confirmed' ? 'Confirmed ✅' : req.body.status === 'cancelled' ? 'Cancelled ❌' : 'Updated ℹ️'}`,
        message: `Booking #${booking.bookingId} is now ${req.body.status.toUpperCase()}.`,
        url: '/bookings'
      });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
