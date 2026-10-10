const mongoose = require('mongoose');
require('dotenv').config();
const Settings = require('./models/Settings');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    let settings = await Settings.findOne();
    if (settings) {
        settings.walletLTC = 'ltc1qd909zrrfr7s4ys0zt8rlcxjvu9j5p3w6rpjcwa';
        settings.walletSOL = '6SthbfqV4pG7Gs74cZwVv6n4vtuKPWk3ByRNABk71Az3';
        await settings.save();
        console.log('Database wallet addresses updated successfully.');
    }
    process.exit(0);
});
