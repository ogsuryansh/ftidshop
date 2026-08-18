const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const svgCaptcha = require('svg-captcha');
const { randomUUID: uuidv4 } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');
const otpStore = new Map(); // Key: adminId (string), Value: { otp, expiresAt }

const User = require('./models/User');
const Admin = require('./models/Admin');
const Order = require('./models/Order');
const Product = require('./models/Product');
const Settings = require('./models/Settings');
const { verifyPayment } = require('./services/cryptoVerifier');

// ─── Wallet addresses (set in .env) ──────────────────────────────────────────
const WALLET_ADDRESSES = {
    USDT_TRC20: process.env.WALLET_USDT_TRC20 || 'TBtgkq5GTy1q4thASK23hmfRrJ8grLD4FR',
    BTC:        process.env.WALLET_BTC        || '1F5Y3DYgZtTNLGkiyPz4vt762665qgnBpJ',
    LTC:        process.env.WALLET_LTC        || 'Lhkby8mb1DgZfVsQWrSopScTeNf252qi9Q',
    SOL:        process.env.WALLET_SOL        || 'AigcpMzqZw9asMFVSdNi8T4MAHHujykEUdyUjTH9F6JG',
    ETH:        process.env.WALLET_ETH        || '0x54defcf541d174e7443c1ada58875e3e04ca5178',
    TON:        process.env.WALLET_TON        || 'UQDxZ_1B6JccNyqYpXLnKFK-McmvtMOesfP06av73h-CYNFM'
};

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB Atlas (Serverless compatible)
const DEFAULT_MONGO_URI = 'mongodb://vishalgiri0044_db_user:QKx6CHwd0yXdfa7r@ac-j0ezqav-shard-00-00.ahz11bx.mongodb.net:27017,ac-j0ezqav-shard-00-01.ahz11bx.mongodb.net:27017,ac-j0ezqav-shard-00-02.ahz11bx.mongodb.net:27017/arpanFtid?ssl=true&replicaSet=atlas-13luhs-shard-0&authSource=admin&retryWrites=true&w=majority';

let isConnected = false;
const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        isConnected = true;
        return;
    }
    const mongoUri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    isConnected = true;
    console.log('MongoDB Connected to Atlas...');
    
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            const newAdmin = new Admin({ username: 'admin', password: hashedPassword });
            await newAdmin.save();
            console.log('Default admin created: username (admin) password (admin123)');
        }

        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            const initialProducts = [
                // Insider Scans
                { category: 'Insider Scans "Only tracking needed"', courier: 'UPS', name: 'Rts insider city/any state', price: 70, desc: 'RTS Insider scan update for any city or state.', badge: null, active: true },
                { category: 'Insider Scans "Only tracking needed"', courier: 'UPS', name: 'Ap lit ups any city', price: 25, desc: 'AP LIT UPS scan update for any city.', badge: 'Click to read description', badgeColor: '#d9534f', active: true },
                { category: 'Insider Scans "Only tracking needed"', courier: 'FedEx', name: 'Fedex driver lit', price: 80, desc: 'FedEx Driver Lost In Transit scan update.', badge: null, active: true },
                { category: 'Insider Scans "Only tracking needed"', courier: 'UPS', name: 'ap lit worldwide', price: 25, desc: 'Worldwide Access Point LIT service for international tracking.', badge: 'Click to read description', badgeColor: '#d9534f', active: true },
                { category: 'Insider Scans "Only tracking needed"', courier: 'UPS', name: 'manual rts', price: 35, desc: 'Manual Return To Sender scan service.', badge: null, active: true },
                // United States US
                { category: 'United States US', courier: 'UPS', name: 'Cali LIT (Very Limited)', price: 45, desc: 'Specialized Lost In Transit method for California region shipments with high success rate.', badge: 'Click to read description', badgeColor: '#d9534f', active: true },
                { category: 'United States US', courier: 'UPS', name: 'UPS UTD (must be in transit = yes)', price: 60, desc: 'Unable To Deliver scan update for active UPS packages currently in transit.', badge: null, active: true },
                { category: 'United States US', courier: 'UPS', name: 'UPS RTS', price: 60, desc: 'Return To Sender scan process for UPS packages.', badge: null, active: true },
                { category: 'United States US', courier: 'UPS', name: 'UPS LIT Store', price: 45, desc: 'Lost In Transit method performed via physical UPS Store dropoffs.', badge: 'Click to read description', badgeColor: '#d9534f', active: true },
                { category: 'United States US', courier: 'UPS', name: 'AP LIT WORLDWIDE', price: 30, desc: 'Worldwide Access Point LIT service for international UPS tracking.', badge: 'Click to read description', badgeColor: '#d9534f', active: true },
                // Canada CA
                { category: 'Canada CA', courier: 'Canada Post', name: 'FTIDV3', price: 20, desc: 'FTID Version 3 processing. High speed delivery status update.', badge: 'Label is required', badgeColor: '#4caf50', active: true },
                { category: 'Canada CA', courier: 'Canada Post', name: 'LIT', price: 35, desc: 'Lost in Transit scan update for Canadian courier shipments.', badge: 'Label is required', badgeColor: '#4caf50', active: true },
                { category: 'Canada CA', courier: 'Canada Post', name: 'FTIDNA', price: 35, desc: 'FTID No Access / No Arrival update for Canadian carriers.', badge: 'Label is required', badgeColor: '#4caf50', active: true },
                // Germany DE
                { category: 'Germany DE', courier: 'DHL', name: 'FTIDV3', price: 25, desc: 'FTID Version 3 processing for EU / Germany shipments.', badge: 'Label is required', badgeColor: '#4caf50', active: true },
                { category: 'Germany DE', courier: 'DHL', name: 'LIT', price: 40, desc: 'Lost in Transit scan update for German couriers.', badge: 'Label is required', badgeColor: '#4caf50', active: true },
                { category: 'Germany DE', courier: 'DHL', name: 'FTIDNA', price: 40, desc: 'FTID No Arrival update for European carriers.', badge: 'Label is required', badgeColor: '#4caf50', active: true }
            ];
            await Product.insertMany(initialProducts);
            console.log('Initial product catalog seeded successfully.');
        }

        const settingsCount = await Settings.countDocuments();
        if (settingsCount === 0) {
            await new Settings().save();
            console.log('Default settings created.');
        }
    } catch (err) {
        console.error('MongoDB seeding error:', err);
    }
};

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('MongoDB connection error:', err);
        res.status(500).json({ error: 'Database connection error: ' + err.message });
    }
});

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

app.post('/api/register', async (req, res) => {
    const { name, email, password, captchaToken } = req.body;
    
    if (!captchaToken) return res.status(400).json({ error: 'Security verification required' });
    
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        
        res.json({ message: 'Registration successful!', token, user: { id: newUser._id, name: newUser.name, email: newUser.email, credits: newUser.credits, twoFactorEnabled: false, joined: newUser.createdAt } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password, twoFactorCode } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
        
        if (user.twoFactorEnabled) {
            if (!twoFactorCode) {
                return res.status(200).json({ requires2FA: true, message: '2FA authentication code required' });
            }
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorCode,
                window: 1
            });
            if (!verified) {
                return res.status(400).json({ error: 'Invalid 2FA code' });
            }
        }

        const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, credits: user.credits, twoFactorEnabled: user.twoFactorEnabled || false, joined: user.createdAt } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// User Authentication Middleware
const authUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

// Fetch current user details
app.get('/api/user/me', authUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -twoFactorSecret -tempTwoFactorSecret');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 2FA: Generate QR Code & Secret
app.post('/api/2fa/generate', authUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const secret = speakeasy.generateSecret({
            name: `FTID.SHOP (${user.email})`
        });

        user.tempTwoFactorSecret = secret.base32;
        await user.save();

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            qrCode: qrCodeUrl,
            secret: secret.base32
        });
    } catch (err) {
        console.error('2FA generate error:', err);
        res.status(500).json({ error: 'Server error generating 2FA' });
    }
});

// 2FA: Verify & Enable
app.post('/api/2fa/enable', authUser, async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: '2FA token required' });

    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.tempTwoFactorSecret) {
            return res.status(400).json({ error: 'No active 2FA setup request found' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.tempTwoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ error: 'Invalid 2FA verification code' });
        }

        user.twoFactorSecret = user.tempTwoFactorSecret;
        user.tempTwoFactorSecret = null;
        user.twoFactorEnabled = true;
        await user.save();

        res.json({
            message: '2FA Security enabled successfully!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                twoFactorEnabled: user.twoFactorEnabled,
                joined: user.createdAt
            }
        });
    } catch (err) {
        console.error('2FA enable error:', err);
        res.status(500).json({ error: 'Server error enabling 2FA' });
    }
});

// 2FA: Disable
app.post('/api/2fa/disable', authUser, async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: '2FA token required to disable' });

    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ error: '2FA is not enabled for this account' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({ error: 'Invalid 2FA verification code' });
        }

        user.twoFactorSecret = null;
        user.twoFactorEnabled = false;
        await user.save();

        res.json({
            message: '2FA Security disabled',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                twoFactorEnabled: user.twoFactorEnabled,
                joined: user.createdAt
            }
        });
    } catch (err) {
        console.error('2FA disable error:', err);
        res.status(500).json({ error: 'Server error disabling 2FA' });
    }
});

// Admin Authentication Middleware
const authAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Access forbidden. Admin authorization required.' });
        }
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(400).json({ error: 'Invalid admin credentials' });
        
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid admin credentials' });
        
        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration
        
        otpStore.set(admin._id.toString(), { otp: otpCode, expiresAt });
        
        // Setup Nodemailer transporter
        let transporter;
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true', // true for 465
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // Fallback to Ethereal
            let testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: { user: testAccount.user, pass: testAccount.pass }
            });
            console.warn("Using Ethereal for email. Add SMTP_* env vars for real emails.");
        }
        
        let info = await transporter.sendMail({
            from: '"ArpanFtid Admin" <admin@arpanftid.com>',
            to: process.env.ADMIN_EMAIL || "vishalgiri0044@gmail.com",
            subject: "Admin Login OTP Code",
            text: `Your 2-step verification code is: ${otpCode}`,
            html: `<b>Your 2-step verification code is: ${otpCode}</b>`,
        });
        
        console.log("OTP sent. Message ID:", info.messageId);
        if (!process.env.SMTP_HOST) {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        res.json({ step: '2FA_REQUIRED', adminId: admin._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/admin/verify-2fa', async (req, res) => {
    const { adminId, otp } = req.body;
    try {
        if (!adminId || !otp) return res.status(400).json({ error: 'Missing adminId or otp' });
        
        const store = otpStore.get(adminId);
        if (!store) return res.status(400).json({ error: 'OTP expired or invalid' });
        
        if (Date.now() > store.expiresAt) {
            otpStore.delete(adminId);
            return res.status(400).json({ error: 'OTP expired' });
        }
        
        if (store.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        
        // OTP valid, issue token
        otpStore.delete(adminId);
        const admin = await Admin.findById(adminId);
        if (!admin) return res.status(400).json({ error: 'Admin not found' });
        
        const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, admin: { id: admin._id, username: admin.username } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin change password endpoint (Protected)
app.put('/api/admin/change-password', authAdmin, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    try {
        let admin;
        if (req.admin && req.admin.id) {
            admin = await Admin.findById(req.admin.id);
        }
        if (!admin) {
            admin = await Admin.findOne({ username: 'admin' });
        }
        if (!admin) {
            admin = await Admin.findOne();
        }
        
        if (!admin) {
            console.error('[ChangePassword] Admin user not found in database.');
            return res.status(404).json({ error: 'Admin user not found' });
        }

        console.log(`[ChangePassword] Attempting password update for admin: ${admin.username}`);

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            console.warn(`[ChangePassword] Password mismatch for admin: ${admin.username}`);
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();

        console.log(`[ChangePassword] Admin password updated successfully for ${admin.username}`);
        res.json({ message: 'Admin password updated successfully!' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Server error updating password' });
    }
});

// Admin endpoints (Protected)
app.get('/api/admin/users', authAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/admin/orders', authAdmin, async (req, res) => {
    try {
        const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/admin/order/:id/status', authAdmin, async (req, res) => {
    try {
        const updateData = {};
        if (req.body.status !== undefined) updateData.status = req.body.status;
        if (req.body.paymentStatus !== undefined) updateData.paymentStatus = req.body.paymentStatus;
        if (req.body.paymentCurrency !== undefined) updateData.paymentCurrency = req.body.paymentCurrency;
        
        const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(order);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/admin/order/:id', authAdmin, async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        if (!deletedOrder) return res.status(404).json({ error: 'Order not found' });
        res.json({ message: 'Order deleted successfully', id: req.params.id });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ─── Product Management Endpoints ─────────────────────────────────────────────
// Public endpoint to fetch active store catalog for users
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({ active: true }).sort({ category: 1, courier: 1, name: 1 });
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching products' });
    }
});

// ─── Settings Endpoints ─────────────────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching settings' });
    }
});

app.put('/api/admin/settings', authAdmin, async (req, res) => {
    try {
        const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating settings' });
    }
});

app.put('/api/admin/users/:id/balance', authAdmin, async (req, res) => {
    try {
        const { action, amount } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (action === 'add') {
            user.credits += Number(amount);
        } else if (action === 'cut') {
            user.credits -= Number(amount);
            if (user.credits < 0) user.credits = 0;
        }
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating balance' });
    }
});

// Admin endpoints (Protected)
app.get('/api/admin/products', authAdmin, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching products' });
    }
});

app.post('/api/admin/products', authAdmin, async (req, res) => {
    try {
        const { category, courier, name, price, desc, badge, badgeColor, active } = req.body;
        if (!category || !courier || !name || price === undefined) {
            return res.status(400).json({ error: 'Category, courier, name, and price are required' });
        }
        const newProduct = new Product({
            category,
            courier,
            name,
            price: Number(price),
            desc: desc || '',
            badge: badge || null,
            badgeColor: badgeColor || '#d9534f',
            active: active !== undefined ? active : true
        });
        await newProduct.save();
        res.json(newProduct);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating product' });
    }
});

app.put('/api/admin/products/:id', authAdmin, async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'Product not found' });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating product' });
    }
});

app.delete('/api/admin/products/:id', authAdmin, async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product deleted successfully', id: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting product' });
    }
});

// User Order endpoints
app.post('/api/orders', async (req, res) => {
    try {
        const { paymentCurrency, paymentMethod, price, userId, type } = req.body;
        const orderData = { ...req.body };
        
        // If user pays with wallet balance
        if (paymentMethod === 'Wallet Balance' && type !== 'deposit' && type !== 'Deposit') {
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: 'User not found' });
            
            if (user.credits < price) {
                return res.status(400).json({ error: 'Insufficient wallet balance.' });
            }
            
            // Deduct balance
            user.credits -= price;
            await user.save();
            
            orderData.paymentStatus = 'Paid';
            orderData.status = 'Pending';
        } else if (paymentCurrency && WALLET_ADDRESSES[paymentCurrency]) {
            // Attach the real wallet address for the chosen currency
            orderData.paymentAddress = WALLET_ADDRESSES[paymentCurrency];
        }
        
        const newOrder = new Order(orderData);
        await newOrder.save();
        res.json(newOrder);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Server error' }); 
    }
});

app.get('/api/orders/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ─── Payment verification endpoints ──────────────────────────────────────────

// GET wallet address for selected currency
app.get('/api/payment/address/:currency', (req, res) => {
    const { currency } = req.params;
    const address = WALLET_ADDRESSES[currency];
    if (!address) return res.status(404).json({ error: 'Currency not supported or wallet not configured' });
    res.json({ currency, address });
});

// Manually trigger payment check for a specific order
app.post('/api/verify-payment/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.paymentStatus === 'Paid') return res.json({ verified: true, order });
        if (!order.paymentCurrency || !order.paymentAddress) {
            return res.status(400).json({ error: 'Order has no payment currency/address set' });
        }

        const result = await verifyPayment(order.paymentCurrency, order.paymentAddress, order.price);
        
        await Order.findByIdAndUpdate(order._id, {
            $inc: { verificationAttempts: 1 },
            lastChecked: new Date()
        });

        if (result.verified) {
            const updated = await Order.findByIdAndUpdate(
                order._id,
                { paymentStatus: 'Paid', status: 'Pending', txHash: result.txHash },
                { new: true }
            );
            
            // Deposit Auto-Processing
            if (updated.type === 'deposit' || updated.type === 'Deposit') {
                const settings = await Settings.findOne() || new Settings();
                let bonus = 0;
                if (updated.price >= settings.depositBonusThreshold) {
                    bonus = (updated.price * settings.depositBonusPercentage) / 100;
                }
                const totalAmount = updated.price + bonus;
                await User.findByIdAndUpdate(updated.userId, { $inc: { credits: totalAmount } });
                await Order.findByIdAndUpdate(updated._id, { status: 'Completed' });
                updated.status = 'Completed';
            }

            return res.json({ verified: true, order: updated, txHash: result.txHash });
        }

        res.json({ verified: false, order, message: 'Payment not detected yet' });
    } catch (err) {
        console.error('[VerifyPayment]', err);
        res.status(500).json({ error: 'Verification error' });
    }
});

// Get payment status for an order
app.get('/api/payment-status/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).select('paymentStatus status txHash paymentCurrency paymentAddress price');
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ─── Background auto-polling job (every 60 seconds) ──────────────────────────
async function runPaymentPoller() {
    try {
        if (!isConnected) return;
        const pendingOrders = await Order.find({
            paymentStatus: 'Pending Payment',
            paymentCurrency: { $ne: null },
            paymentAddress: { $ne: null },
            verificationAttempts: { $lt: 30 } // stop after 30 attempts (~30 min)
        });

        if (pendingOrders.length === 0) return;
        console.log(`[Poller] Checking ${pendingOrders.length} pending payment(s)...`);

        for (const order of pendingOrders) {
            const result = await verifyPayment(order.paymentCurrency, order.paymentAddress, order.price);
            await Order.findByIdAndUpdate(order._id, {
                $inc: { verificationAttempts: 1 },
                lastChecked: new Date()
            });

            if (result.verified) {
                const updated = await Order.findByIdAndUpdate(order._id, {
                    paymentStatus: 'Paid',
                    status: 'Pending',
                    txHash: result.txHash
                }, { new: true });
                
                // Deposit Auto-Processing
                if (updated.type === 'deposit' || updated.type === 'Deposit') {
                    const settings = await Settings.findOne() || new Settings();
                    let bonus = 0;
                    if (updated.price >= settings.depositBonusThreshold) {
                        bonus = (updated.price * settings.depositBonusPercentage) / 100;
                    }
                    const totalAmount = updated.price + bonus;
                    await User.findByIdAndUpdate(updated.userId, { $inc: { credits: totalAmount } });
                    await Order.findByIdAndUpdate(updated._id, { status: 'Completed' });
                }

                console.log(`[Poller] ✅ Payment confirmed for order ${order._id} | TX: ${result.txHash}`);
            }
        }
    } catch (err) {
        console.error('[Poller] Error:', err.message);
    }
}

// Start polling only in non-serverless environments
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    setInterval(runPaymentPoller, 60 * 1000); // every 60 seconds
    console.log('[Poller] Payment auto-verification job started (60s interval)');
}

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });
}

module.exports = app;
