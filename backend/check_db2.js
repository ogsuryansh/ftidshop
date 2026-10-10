const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const orders = await Order.find({}).sort({createdAt: -1}).limit(10);
    console.log("All recent orders:");
    orders.forEach(o => {
        console.log(`Order ID: ${o._id}, Price: ${o.price}, Status: ${o.status}, Payment Method: '${o.paymentMethod}', Type: ${o.type}`);
    });
    process.exit(0);
});
