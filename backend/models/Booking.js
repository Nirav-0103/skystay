const mongoose = require('mongoose');
const crypto = require('crypto');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingType: { type: String, enum: ['hotel', 'flight'], required: true },
  bookingId: { type: String, unique: true },

  // Hotel
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
  roomType: String,
  checkIn: { type: Date },
  checkOut: { type: Date },
  guests: { type: Number, default: 1, min: 1, max: 30 },
  nights: Number,

  // Flight
  flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight' },
  seatClass: String,
  passengers: { type: Number, default: 1, min: 1, max: 30 },
  selectedSeats: [String],
  passengerDetails: [{
    name: String, age: Number, gender: String,
    idType: String, idNumber: String
  }],
  // NEW: Add-ons & special requests
  addons: [{
    id: String, label: String, price: Number, per: String
  }],
  assistance: [{
    code: String, label: String, passengerIndex: Number
  }],
  specialRequests: String,
  promoCode: String,
  discount: { type: Number, default: 0 },

  // Common
  totalAmount: { type: Number, required: true },
  baseAmount: Number,
  addonsAmount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refund_requested', 'refunded'],
    default: 'pending'
  },
  paymentMethod: { type: String, enum: ['card', 'upi', 'cod', 'netbanking', 'wallet'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'paid' },
  paymentDetails: { transactionId: String, upiId: String, cardLast4: String },
  billingAddress: { street: String, city: String, state: String, pincode: String },
  cancelReason: String,
  cancelledAt: Date,
  refundAmount: Number,
  pointsAwarded: { type: Boolean, default: false },
  pointsEarned: { type: Number, default: 0 },
  // Refund System
  refund: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'processing', 'completed', 'rejected'],
      default: 'none'
    },
    amount: { type: Number, default: 0 },
    reason: String,
    requestedAt: Date,
    processedAt: Date,
    currentStage: { type: Number, default: 0 }, // 0: Requested, 1: Approved, 2: Bank Processing, 3: Completed
    history: [{
      stage: String,
      message: String,
      timestamp: { type: Date, default: Date.now }
    }]
  },
  // Check-in
  checkedIn: { type: Boolean, default: false },
  checkinTime: Date,
  boardingPass: String,
}, { timestamps: true });

bookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    const prefix = this.bookingType === 'hotel' ? 'HTL' : 'FLT';
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.bookingId = `${prefix}${Date.now()}${randomHex}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
