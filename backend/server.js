const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const svgCaptcha = require('svg-captcha');
const { randomUUID: uuidv4 } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Admin = require('./models/Admin');
const Order = require('./models/Order');
const { verifyPayment } = require('./services/cryptoVerifier');

// ─── Wallet addresses (set in .env) ──────────────────────────────────────────
const WALLET_ADDRESSES = {
    USDT_TRC20: process.env.WALLET_USDT_TRC20 || '',
    BTC:        process.env.WALLET_BTC        || '',
    TON:        process.env.WALLET_TON        || 'UQDxZ_1B6JccNyqYpXLnKFK-McmvtMOesfP06av73h-CYNFM'
};

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB Atlas (Serverless compatible)
let isConnected = false;
const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        isConnected = true;
        return;
    }
    try {
        await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log('MongoDB Connected to Atlas...');
        
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            const newAdmin = new Admin({ username: 'admin', password: hashedPassword });
            await newAdmin.save();
            console.log('Default admin created: username (admin) password (admin123)');
        }
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

app.use(async (req, res, next) => {
    await connectDB();
    next();
});

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
        
        res.json({ message: 'Registration successful!', token, user: { id: newUser._id, name: newUser.name, email: newUser.email, credits: newUser.credits, joined: newUser.createdAt } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, credits: user.credits, joined: user.createdAt } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(400).json({ error: 'Invalid admin credentials' });
        
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid admin credentials' });
        
        const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        
        res.json({ token, admin: { id: admin._id, username: admin.username } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin endpoints
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/admin/order/:id/status', async (req, res) => {
    try {
        const updateData = {};
        if (req.body.status !== undefined) updateData.status = req.body.status;
        if (req.body.paymentStatus !== undefined) updateData.paymentStatus = req.body.paymentStatus;
        
        const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(order);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// User Order endpoints
app.post('/api/orders', async (req, res) => {
    try {
        const { paymentCurrency } = req.body;
        const orderData = { ...req.body };
        // Attach the real wallet address for the chosen currency
        if (paymentCurrency && WALLET_ADDRESSES[paymentCurrency]) {
            orderData.paymentAddress = WALLET_ADDRESSES[paymentCurrency];
        }
        const newOrder = new Order(orderData);
        await newOrder.save();
        res.json(newOrder);
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
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
                await Order.findByIdAndUpdate(order._id, {
                    paymentStatus: 'Paid',
                    status: 'Pending',
                    txHash: result.txHash
                });
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
