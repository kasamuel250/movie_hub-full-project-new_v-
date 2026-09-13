const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  data: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);