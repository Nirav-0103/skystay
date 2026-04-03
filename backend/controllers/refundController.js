const Booking = require('../models/Booking');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Stages definition
const REFUND_STAGES = [
  { id: 0, label: 'Refund Requested', message: 'Your refund request has been received.' },
  { id: 1, label: 'Approved', message: 'Refund request approved by admin.' },
  { id: 2, label: 'Processing', message: 'Refund is being processed with the bank.' },
  { id: 3, label: 'Completed', message: 'Refund has been successfully credited to your account.' }
];

// @desc    Request a refund
// @route   POST /api/bookings/:id/refund
// @access  Private
exports.requestRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.refund.status !== 'none' && booking.refund.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Refund already in progress' });
    }

    booking.refund = {
      status: 'pending',
      amount: req.body.amount || booking.totalAmount,
      reason: req.body.reason || 'Payment Failure / User Request',
      requestedAt: new Date(),
      currentStage: 0,
      history: [{
        stage: 'Refund Requested',
        message: req.body.reason || 'Refund request initiated.',
        timestamp: new Date()
      }]
    };

    await booking.save();

    // Notify Admin via Notification system (if exists) or logging
    console.log(`🔔 Refund requested for Booking #${booking.bookingId}`);

    res.json({ success: true, message: 'Refund request submitted successfully', refund: booking.refund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all refund requests (Admin only)
// @route   GET /api/admin/refunds
// @access  Private/Admin
exports.getAllRefunds = async (req, res) => {
  try {
    const refunds = await Booking.find({ 'refund.status': { $ne: 'none' } })
      .populate('user', 'name email phone')
      .populate('hotel', 'name city')
      .populate('flight', 'flightNumber airline')
      .sort({ 'refund.requestedAt': -1 });

    res.json({ success: true, count: refunds.length, refunds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update refund stage (Admin only)
// @route   PUT /api/admin/refunds/:id/stage
// @access  Private/Admin
exports.updateRefundStage = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const { stage, message } = req.body;
    if (stage < 0 || stage > 3) return res.status(400).json({ success: false, message: 'Invalid stage' });

    booking.refund.currentStage = stage;
    
    // Update main refund status based on stage
    if (stage === 1) booking.refund.status = 'approved';
    if (stage === 2) booking.refund.status = 'processing';
    if (stage === 3) {
      booking.refund.status = 'completed';
      booking.refund.processedAt = new Date();
      booking.paymentStatus = 'refunded';
      booking.status = 'refunded';
    }

    booking.refund.history.push({
      stage: REFUND_STAGES[stage].label,
      message: message || REFUND_STAGES[stage].message,
      timestamp: new Date()
    });

    await booking.save();

    // Notify User
    const user = await User.findById(booking.user);
    if (user) {
      user.notifications.push({
        title: `Refund Update: ${REFUND_STAGES[stage].label}`,
        message: message || `Your refund for booking #${booking.bookingId} is now in '${REFUND_STAGES[stage].label}' stage.`,
        type: 'info'
      });
      await user.save();
    }

    res.json({ success: true, message: `Refund stage updated to ${REFUND_STAGES[stage].label}`, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject refund (Admin only)
// @route   PUT /api/admin/refunds/:id/reject
// @access  Private/Admin
exports.rejectRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.refund.status = 'rejected';
    booking.refund.history.push({
      stage: 'Rejected',
      message: req.body.reason || 'Refund request rejected by administrator.',
      timestamp: new Date()
    });

    await booking.save();

    // Notify User
    const user = await User.findById(booking.user);
    if (user) {
      user.notifications.push({
        title: 'Refund Request Rejected',
        message: `Your refund request for booking #${booking.bookingId} was rejected. Reason: ${req.body.reason || 'Contact support for details.'}`,
        type: 'error'
      });
      await user.save();
    }

    res.json({ success: true, message: 'Refund request rejected', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user refunds
// @route   GET /api/bookings/my/refunds
// @access  Private
exports.getMyRefunds = async (req, res) => {
  try {
    const refunds = await Booking.find({ 
      user: req.user._id, 
      'refund.status': { $ne: 'none' } 
    })
    .populate('hotel', 'name city images')
    .populate('flight', 'flightNumber airline from to departureTime')
    .sort({ 'refund.requestedAt': -1 });

    res.json({ success: true, count: refunds.length, refunds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
