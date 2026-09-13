const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: String, required: true },
  movieTitle: { type: String, default: '' },
  watchedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
