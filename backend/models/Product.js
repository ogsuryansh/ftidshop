const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    category: { type: String, required: true }, // e.g. 'Insider Scans "Only tracking needed"', 'United States US'
    courier: { type: String, required: true },  // e.g. 'UPS', 'FedEx', 'USPS'
    name: { type: String, required: true },     // e.g. 'Rts insider city/any state'
    price: { type: Number, required: true },    // e.g. 70
    desc: { type: String, default: '' },        // Optional description
    badge: { type: String, default: null },     // Optional badge text, e.g. 'Click to read description'
    badgeColor: { type: String, default: '#d9534f' },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
