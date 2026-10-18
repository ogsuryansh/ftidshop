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
    walletTON: { type: String, default: 'UQDxZ_1B6JccNyqYpXLnKFK-McmvtMOesfP06av73h-CYNFM' },
    // Payment coin toggles (checkpoints in Admin Panel)
    enableBTC: { type: Boolean, default: true },
    enableLTC: { type: Boolean, default: true },
    enableUSDT_TRC20: { type: Boolean, default: false },
    enableSOL: { type: Boolean, default: false },
    enableETH: { type: Boolean, default: false },
    enableTON: { type: Boolean, default: false },
    // Telegram Stars payment settings (dynamic)
    enableTelegramStars: { type: Boolean, default: true },
    telegramStarsRate: { type: Number, default: 90 }, // 90 Stars = $1 USD
    telegramBotToken: { type: String, default: '' },
    telegramBotUsername: { type: String, default: 'Shopstarsh1_bot' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
