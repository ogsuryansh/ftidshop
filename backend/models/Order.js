const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // 'FTID' or 'Receipt'
    country: { type: String },
    courier: { type: String },
    method: { type: String },
    trackingNumber: { type: String },
    note: { type: String },
    fileData: {
        filename: { type: String },
        data: { type: String }, // Base64 encoded file string
        mimeType: { type: String }
    },
    price: { type: Number, default: 0 },
    paymentStatus: { type: String, default: 'Pending Payment', enum: ['Pending Payment', 'Paid', 'Failed'] },
    status: { type: String, default: 'Pending Payment', enum: ['Pending Payment', 'Pending', 'Processing', 'Completed', 'Cancelled'] },
    // Crypto payment verification fields
    paymentCurrency: { type: String, enum: ['USDT_TRC20', 'BTC', 'TON'], default: null },
    paymentAddress: { type: String, default: null }, // wallet address shown to user
    txHash: { type: String, default: null }, // confirmed transaction hash
    verificationAttempts: { type: Number, default: 0 },
    lastChecked: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
