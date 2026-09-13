const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: '' },
  username: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  bio: { type: String, default: '' },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  active: { type: Boolean, default: true },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  notificationsEnabled: { type: Boolean, default: true },
  subscriptionTier: { type: String, enum: ['free', 'premium'], default: 'free' },
  subscriptionExpiry: { type: Date, default: null },
  lifetimeFree: { type: Boolean, default: false },
  trialEndsAt: { type: Date, default: null },
  paymentMethod: {
    provider: { type: String, default: '' },
    number: { type: String, default: '' },
    name: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);