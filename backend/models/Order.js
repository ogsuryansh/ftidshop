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
    status: { type: String, default: 'Pending Payment', enum: ['Pending Payment', 'Pending', 'Processing', 'Completed', 'Cancelled'] }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
