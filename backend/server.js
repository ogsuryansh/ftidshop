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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
.then(async () => {
    console.log('MongoDB Connected to Atlas...');
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        const newAdmin = new Admin({ username: 'admin', password: hashedPassword });
        await newAdmin.save();
        console.log('Default admin created: username (admin) password (admin123)');
    }

    // Create dummy orders if none exist
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
        // Create a dummy user first
        const dummyUser = new User({ name: 'John Doe', email: 'john.doe@example.com', password: 'password123', credits: 150 });
        await dummyUser.save();

        const dummyOrders = [
            { userId: dummyUser._id, type: 'FTID', country: 'US', courier: 'UPS', method: 'AMAZON (FTID V6)', trackingNumber: '1Z9999999999999999', note: 'Please process ASAP', price: 45, status: 'Pending' },
            { userId: dummyUser._id, type: 'FTID', country: 'UK', courier: 'Royal Mail', method: 'UPS RTS', trackingNumber: 'GB123456789', note: 'RTS requested', price: 55, status: 'Processing' },
            { userId: dummyUser._id, type: 'Receipt', country: 'Canada', courier: 'FedEx', method: 'AP LIT WORLDWIDE', trackingNumber: 'FDX987654321', note: 'Receipt for electronics', price: 20, status: 'Completed' }
        ];

        await Order.insertMany(dummyOrders);
        console.log('Dummy orders created successfully');
    }
})
.catch(err => console.log('MongoDB connection error:', err));

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
        const newOrder = new Order(req.body);
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

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`); });
}

module.exports = app;
