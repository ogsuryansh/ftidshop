const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const orders = await Order.find({ paymentMethod: 'Wallet Balance' }).sort({createdAt: -1}).limit(10);
    console.log("Recent wallet orders:");
    orders.forEach(o => {
        console.log(`Order ID: ${o._id}, Price: ${o.price}, Status: ${o.status}, Date: ${o.createdAt}`);
    });
    process.exit(0);
});
