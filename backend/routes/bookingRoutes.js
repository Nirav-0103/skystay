const express = require('express');
const router = express.Router();
const { 
  createBooking, getUserBookings, getBookingById, cancelBooking, 
  getAllBookings, updateBookingStatus, checkIn 
} = require('../controllers/bookingController');
const { requestRefund, getMyRefunds } = require('../controllers/refundController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, createBooking);
router.get('/my', protect, getUserBookings);
router.get('/my/refunds', protect, getMyRefunds);
router.get('/:id', protect, getBookingById);
router.post('/:id/refund', protect, requestRefund);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/checkin', protect, checkIn);
router.get('/', protect, adminOnly, getAllBookings);
router.put('/:id/status', protect, adminOnly, updateBookingStatus);

module.exports = router;
