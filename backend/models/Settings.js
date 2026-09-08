const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    minDeposit: { type: Number, default: 20 },
    depositBonusThreshold: { type: Number, default: 100 },
    depositBonusPercentage: { type: Number, default: 20 },
    adminEmail: { type: String, default: 'vishalgiri0044@gmail.com' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
