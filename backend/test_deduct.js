const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Order = require('./models/Order');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    let user = await User.findOne({ email: 'test_deduction@example.com' });
    if (!user) {
        user = new User({
            name: "Test User",
            email: "test_deduction@example.com",
            password: "password",
            credits: 100
        });
        await user.save();
    } else {
        user.credits = 100;
        await user.save();
    }
    console.log("Initial credits:", user.credits);

    // mock the server logic
    const reqBody = {
        paymentMethod: 'Wallet Balance',
        price: 30,
        userId: user._id,
        type: 'FTID'
    };

    if (reqBody.paymentMethod === 'Wallet Balance' && reqBody.type !== 'deposit' && reqBody.type !== 'Deposit') {
        const foundUser = await User.findById(reqBody.userId);
        if (!foundUser) console.log('User not found');
        else if (foundUser.credits < reqBody.price) console.log('Insufficient balance');
        else {
            foundUser.credits -= reqBody.price;
            await foundUser.save();
            console.log("Credits deducted successfully. New credits:", foundUser.credits);
        }
    }

    process.exit(0);
});
