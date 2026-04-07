const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide your name'], minlength: [3, 'Name must be at least 3 characters'], trim: true },
  email: { type: String, required: [true, 'Please provide your email'], unique: true, lowercase: true, match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'] },
  password: { type: String, required: [true, 'Please provide a password'], minlength: [6, 'Password must be at least 6 characters'], select: false },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  address: { street: String, city: String, state: String, pincode: String },
  savedCards: [{ cardNumber: String, cardHolder: String, expiry: String, cardType: String }],
  savedPassengers: [{
    name: String, age: Number, gender: String,
    idType: String, idNumber: String, isDefault: Boolean
  }],
  wishlistHotels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }],
  wishlistFlights: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flight' }],
  walletBalance: { type: Number, default: 0 },
  skyPoints: { type: Number, default: 0 },
  skyPointsHistory: [{
    points: Number,
    type: { type: String, enum: ['earned', 'redeemed'] },
    description: String,
    createdAt: { type: Date, default: Date.now }
  }],
  loyaltyTier: { type: String, enum: ['Blue', 'Silver', 'Gold', 'Platinum'], default: 'Blue' },
  // Price alerts
  priceAlerts: [{
    from: String, to: String,
    targetPrice: Number, currentPrice: Number,
    email: String, active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  notifications: [{
    title: String, message: String,
    type: { type: String, enum: ['info', 'success', 'warning', 'error', 'booking', 'loyalty', 'alert'], default: 'info' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  // Referral
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  welcomeEmailSent: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isDefaultAdmin: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-calculate loyalty tier based on skyPoints
userSchema.pre('save', async function(next) {
  if (this.isModified('skyPoints')) {
    if (this.skyPoints >= 15000) this.loyaltyTier = 'Platinum';
    else if (this.skyPoints >= 5000) this.loyaltyTier = 'Gold';
    else if (this.skyPoints >= 1000) this.loyaltyTier = 'Silver';
    else this.loyaltyTier = 'Blue';
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
