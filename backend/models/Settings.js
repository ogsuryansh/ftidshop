const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    minDeposit: { type: Number, default: 20 },
    depositBonusThreshold: { type: Number, default: 100 },
    depositBonusPercentage: { type: Number, default: 20 },
    adminEmail: { type: String, default: 'vishalgiri0044@gmail.com' },
    walletUSDT_TRC20: { type: String, default: 'TBtgkq5GTy1q4thASK23hmfRrJ8grLD4FR' },
    walletBTC: { type: String, default: '1F5Y3DYgZtTNLGkiyPz4vt762665qgnBpJ' },
    walletLTC: { type: String, default: 'Lhkby8mb1DgZfVsQWrSopScTeNf252qi9Q' },
    walletSOL: { type: String, default: 'AigcpMzqZw9asMFVSdNi8T4MAHHujykEUdyUjTH9F6JG' },
    walletETH: { type: String, default: '0x54defcf541d174e7443c1ada58875e3e04ca5178' },
    walletTON: { type: String, default: 'UQDxZ_1B6JccNyqYpXLnKFK-McmvtMOesfP06av73h-CYNFM' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
