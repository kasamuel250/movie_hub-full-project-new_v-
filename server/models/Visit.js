const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  page: { type: String, default: '/' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  source: { type: String, default: 'web' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Visit || mongoose.model('Visit', visitSchema);