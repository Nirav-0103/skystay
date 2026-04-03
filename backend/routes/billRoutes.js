const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Booking = require('../models/Booking');

// Generate Bill for a booking
router.get('/:id/bill', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('hotel', 'name city address images pricePerNight amenities')
      .populate('flight', 'flightNumber airline from to departureTime arrivalTime duration aircraft');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    // Check if user is the owner or an admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Calculate bill breakdown
    const taxRate = 0.12; // 12% GST
    const baseAmount = booking.totalAmount / (1 + taxRate);
    const taxAmount = booking.totalAmount - baseAmount;
    const convenienceFee = 99;
    const grandTotal = booking.totalAmount + convenienceFee;

    const bill = {
      billNumber: `BILL-${booking.bookingId}`,
      generatedAt: new Date(),
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        type: booking.bookingType,
        status: booking.status,
        createdAt: booking.createdAt,
      },
      customer: {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone || 'N/A',
      },
      details: booking.bookingType === 'hotel' ? {
        hotelName: booking.hotel?.name,
        city: booking.hotel?.city,
        address: booking.hotel?.address,
        roomType: booking.roomType,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        guests: booking.guests,
        pricePerNight: booking.hotel?.pricePerNight,
        image: booking.hotel?.images?.[0],
      } : {
        flightNumber: booking.flight?.flightNumber,
        airline: booking.flight?.airline,
        from: booking.from || booking.flight?.from,
        to: booking.to || booking.flight?.to,
        departureTime: booking.flight?.departureTime,
        arrivalTime: booking.flight?.arrivalTime,
        duration: booking.flight?.duration,
        aircraft: booking.flight?.aircraft,
        seatClass: booking.seatClass,
        passengers: booking.passengers,
        travelDate: booking.travelDate,
      },
      pricing: {
        baseAmount: Math.round(baseAmount),
        gst: Math.round(taxAmount),
        gstRate: '12%',
        convenienceFee,
        totalAmount: booking.totalAmount,
        grandTotal,
        paymentMethod: booking.paymentMethod,
        // ✅ FIX: paymentStatus correctly based on booking's actual paymentStatus field
        paymentStatus: booking.status === 'cancelled' || booking.status === 'refunded'
          ? 'Refunded'
          : booking.paymentStatus === 'paid'
            ? 'Paid'
            : booking.paymentStatus === 'refunded'
              ? 'Refunded'
              : 'Pending',
      },
      company: {
        name: 'SkyStay Premium Travel',
        address: 'Surat, India 395010',
        email: 'support@skystay.com',
        phone: '1800-123-4567',
        gstNumber: 'GSTIN: 27AABCS1429B1Z1',
        website: 'www.skystay.com',
      }
    };

    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;