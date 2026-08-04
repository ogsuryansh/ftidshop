const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('../models/Admin');

const newPassword = process.argv[2];

if (!newPassword) {
    console.log('\n❌ Usage error: Please provide a new password as an argument.\n');
    console.log('   Example: node scripts/resetAdminPassword.js MyNewPass123\n');
    process.exit(1);
}

async function resetPassword() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://vishalgiri0044_db_user:QKx6CHwd0yXdfa7r@ac-j0ezqav-shard-00-00.ahz11bx.mongodb.net:27017,ac-j0ezqav-shard-00-01.ahz11bx.mongodb.net:27017,ac-j0ezqav-shard-00-02.ahz11bx.mongodb.net:27017/arpanFtid?ssl=true&replicaSet=atlas-13luhs-shard-0&authSource=admin&retryWrites=true&w=majority';
    
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        const updated = await Admin.findOneAndUpdate(
            { username: 'admin' },
            { password: hashedPassword },
            { returnDocument: 'after', upsert: true }
        );
        
        console.log(`\n✅ Success! Admin password for user '${updated.username}' has been updated to: ${newPassword}\n`);
    } catch (err) {
        console.error('❌ Error resetting admin password:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

resetPassword();
