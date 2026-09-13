const mongoose = require('mongoose');

const songPlaylistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: '', maxlength: 300 },
  coverVideoId: { type: String, default: '' },
  songs: [
    {
      videoId: { type: String, required: true },
      title: { type: String, default: '' },
      channelTitle: { type: String, default: '' },
      thumbnail: { type: String, default: '' },
      duration: { type: String, default: '' },
      viewCount: { type: String, default: '' },
      addedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.models.SongPlaylist || mongoose.model('SongPlaylist', songPlaylistSchema);