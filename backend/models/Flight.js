const mongoose = require('mongoose');

const seatClassSchema = new mongoose.Schema({
  className: { type: String, enum: ['Economy', 'Business', 'First Class'], required: true },
  price: { type: Number, required: true },
  seatsAvailable: { type: Number, required: true },
  totalSeats: { type: Number, required: true }
});

const flightSchema = new mongoose.Schema({
  flightNumber: { type: String, required: true, unique: true },
  airline: { type: String, required: true },
  airlineCode: { type: String, required: true },
  from: { type: String, required: true },
  fromCode: { type: String, required: true },
  to: { type: String, required: true },
  toCode: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  duration: { type: String, required: true },
  date: { type: Date, required: true },
  stops: { type: Number, default: 0 },
  stopDetails: [String],
  seatClasses: [seatClassSchema],
  basePrice: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  aircraft: { type: String, default: 'Boeing 737' },
  // NEW FIELDS
  amenities: [String],
  onTimePerformance: { type: Number, default: 85 }, // percentage
  status: { type: String, enum: ['scheduled', 'delayed', 'cancelled', 'boarding', 'departed', 'arrived'], default: 'scheduled' },
  delayMinutes: { type: Number, default: 0 },
  priceAlerts: [{
    email: String,
    targetPrice: Number,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

flightSchema.index({ from: 1, to: 1, date: 1 });

module.exports = mongoose.model('Flight', flightSchema);
