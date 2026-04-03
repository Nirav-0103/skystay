const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  capacity: { type: Number, default: 2 },
  available: { type: Number, default: 10 },
  amenities: [String]
});

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  rating: { type: Number, min: 1, max: 5 },
  comment: String
}, { timestamps: true });

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  description: { type: String, required: true },
  images: [String],
  coordinates: {
    lat: { type: Number, default: 20.5937 }, // India center default
    lng: { type: Number, default: 78.9629 }
  },
  rating: { type: Number, default: 4.0, min: 1, max: 5 },
  reviewCount: { type: Number, default: 0 },
  amenities: [String],
  roomTypes: [roomTypeSchema],
  pricePerNight: { type: Number, required: true },
  category: { type: String, enum: ['budget', 'standard', 'luxury', 'boutique', 'business'], default: 'standard' },
  tags: [String],
  isActive: { type: Boolean, default: true },
  reviews: [reviewSchema],
  featured: { type: Boolean, default: false }
}, { timestamps: true });

hotelSchema.index({ city: 1, pricePerNight: 1 });
hotelSchema.index({ name: 'text', description: 'text', city: 'text' });

module.exports = mongoose.model('Hotel', hotelSchema);