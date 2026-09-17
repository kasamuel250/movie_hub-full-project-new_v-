const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userId: { type: String, default: '' },
  method: { type: String, default: 'manual' },
  provider: { type: String, default: 'MTN' },
  number: { type: String, default: '' },
  name: { type: String, default: '' },
  plan: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'RWF' },
  transactionId: { type: String, default: '' },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  note: { type: String, default: '' },
  handledAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);