const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountPercentage: { type: Number, required: true, min: 1, max: 100 },
  maxDiscount: { type: Number, required: true, min: 1 },
  minBookingAmount: { type: Number, default: 0 },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number, default: 1000 },
  timesUsed: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
