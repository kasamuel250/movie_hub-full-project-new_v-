const mongoose = require('mongoose');

const musicPlaySchema = new mongoose.Schema({
  videoId: { type: String, default: '' },
  title: { type: String, default: '' },
  channelTitle: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.MusicPlay || mongoose.model('MusicPlay', musicPlaySchema);