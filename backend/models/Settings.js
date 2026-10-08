const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    minDeposit: { type: Number, default: 20 },
    depositBonusThreshold: { type: Number, default: 100 },
    depositBonusPercentage: { type: Number, default: 20 },
    adminEmail: { type: String, default: 'vishalgiri0044@gmail.com' },
    walletUSDT_TRC20: { type: String, default: 'TBtgkq5GTy1q4thASK23hmfRrJ8grLD4FR' },
    walletBTC: { type: String, default: '1F5Y3DYgZtTNLGkiyPz4vt762665qgnBpJ' },
    walletLTC: { type: String, default: 'ltc1qd909zrrfr7s4ys0zt8rlcxjvu9j5p3w6rpjcwa' },
    walletSOL: { type: String, default: '6SthbfqV4pG7Gs74cZwVv6n4vtuKPWk3ByRNABk71Az3' },
    walletETH: { type: String, default: '0x54defcf541d174e7443c1ada58875e3e04ca5178' },
    walletTON: { type: String, default: 'UQDxZ_1B6JccNyqYpXLnKFK-McmvtMOesfP06av73h-CYNFM' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
