const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    minDeposit: { type: Number, default: 20 },
    depositBonusThreshold: { type: Number, default: 100 },
    depositBonusPercentage: { type: Number, default: 20 }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
