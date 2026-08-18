const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function checkAdmins() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://vishalgiri0044_db_user:QKx6CHwd0yXdfa7r@ac-j0ezqav-shard-00-00.ahz11bx.mongodb.net:27017,ac-j0ezqav-shard-00-01.ahz11bx.mongodb.net:27017,ac-j0ezqav-shard-00-02.ahz11bx.mongodb.net:27017/arpanFtid?ssl=true&replicaSet=atlas-13luhs-shard-0&authSource=admin&retryWrites=true&w=majority';
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        
        const admins = await Admin.find({});
        if (admins.length === 0) {
            console.log('No admin users found in the database.');
        } else {
            console.log('Admin Users Found:');
            admins.forEach(admin => {
                console.log(`- Username: ${admin.username}`);
                console.log(`  Password Hash: ${admin.password}`);
            });
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkAdmins();
