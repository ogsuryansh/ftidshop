const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Order = require('./models/Order');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    let user = await User.findOne({ email: 'test_deduct_2@example.com' });
    if (!user) {
        user = new User({
            name: "Test User 2",
            email: "test_deduct_2@example.com",
            password: "password",
            credits: 100
        });
        await user.save();
    }
    console.log("Initial credits:", user.credits);

    const reqBody = {
        paymentMethod: 'Wallet Balance',
        price: undefined,
        userId: user._id,
        type: 'FTID'
    };

    if (reqBody.paymentMethod === 'Wallet Balance' && reqBody.type !== 'deposit' && reqBody.type !== 'Deposit') {
        const foundUser = await User.findById(reqBody.userId);
        if (!foundUser) console.log('User not found');
        else if (foundUser.credits < reqBody.price) console.log('Insufficient balance');
        else {
            console.log("Found user credits:", foundUser.credits);
            foundUser.credits -= reqBody.price;
            console.log("Credits after minus:", foundUser.credits);
            try {
                await foundUser.save();
                console.log("Saved credits:", foundUser.credits);
            } catch(e) {
                console.log("Save error:", e.message);
            }
        }
    }

    process.exit(0);
});
