const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // 'FTID' or 'Receipt'
    country: { type: String },
    courier: { type: String },
    method: { type: String },
    trackingNumber: { type: String },
    note: { type: String },
    fileData: mongoose.Schema.Types.Mixed, // Can be object (old orders) or array of objects (new bulk orders)
    price: { type: Number, default: 0 },
    paymentStatus: { type: String, default: 'Pending Payment', enum: ['Pending Payment', 'Paid', 'Failed'] },
    status: { type: String, default: 'Pending Payment', enum: ['Pending Payment', 'Pending', 'Processing', 'Completed', 'Cancelled'] },
    // Payment verification fields (Crypto & Telegram Stars)
    paymentCurrency: { type: String, default: null }, // 'USDT_TRC20', 'BTC', 'LTC', 'SOL', 'ETH', 'TON', 'TELEGRAM_STARS'
    paymentAddress: { type: String, default: null }, // wallet address shown to user
    expectedCrypto: { type: Number, default: null }, // exact crypto amount expected
    txHash: { type: String, default: null }, // confirmed transaction hash
    verificationAttempts: { type: Number, default: 0 },
    lastChecked: { type: Date, default: null },
    // Telegram Stars payment fields
    telegramInvoiceLink: { type: String, default: null },
    telegramStarsAmount: { type: Number, default: null },
    telegramPaymentChargeId: { type: String, default: null },
    // Trybit gateway fields
    paymentProvider: { type: String, default: null }, // 'telegram_stars' | 'manual' | 'trybit'
    trybitInvoiceId: { type: String, default: null },
    trybitLink: { type: String, default: null },
    trybitCurrency: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
