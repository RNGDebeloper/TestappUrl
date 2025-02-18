// backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Link = require('./models/Link');
const Withdrawal = require('./models/Withdrawal');
const authMiddleware = require('./middleware/auth');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Load environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// User Registration
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, balance: 0 });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// User Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, balance: user.balance } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Create Short Link
app.post('/create-link', authMiddleware, async (req, res) => {
  try {
    const { originalUrl } = req.body;
    const shortCode = Math.random().toString(36).substring(2, 8);
    const newLink = new Link({ userId: req.user.id, originalUrl, shortCode, clicks: 0 });
    await newLink.save();
    res.status(201).json({ shortCode });
  } catch (error) {
    res.status(500).json({ message: 'Error creating link', error });
  }
});

// Track Clicks and Reward User
app.get('/visit/:shortCode', async (req, res) => {
  try {
    const link = await Link.findOne({ shortCode: req.params.shortCode });
    if (!link) return res.status(404).json({ message: 'Link not found' });
    link.clicks += 1;
    await link.save();
    const user = await User.findById(link.userId);
    user.balance += 0.2;
    await user.save();
    res.redirect(link.originalUrl);
  } catch (error) {
    res.status(500).json({ message: 'Error tracking click', error });
  }
});

// Request Withdrawal
app.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.balance < 10) return res.status(400).json({ message: 'Minimum withdrawal is ₹10' });
    const newWithdrawal = new Withdrawal({ userId: user._id, amount: user.balance, status: 'Pending' });
    await newWithdrawal.save();
    user.balance = 0;
    await user.save();
    res.json({ message: 'Withdrawal request submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing withdrawal', error });
  }
});

// Admin - Approve Withdrawal
app.post('/admin/approve-withdrawal/:id', async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal request not found' });
    withdrawal.status = 'Approved';
    await withdrawal.save();
    res.json({ message: 'Withdrawal approved' });
  } catch (error) {
    res.status(500).json({ message: 'Error approving withdrawal', error });
  }
});

// Basic Route
app.get('/', (req, res) => {
  res.send('URL Shortener Reward API');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
