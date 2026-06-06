const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, monthlyIncome, initialBalance } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password, monthlyIncome: monthlyIncome || 0, initialBalance: initialBalance || 0 });
    res.status(201).json({ token: signToken(user._id), user: { _id: user._id, name: user.name, email: user.email, monthlyIncome: user.monthlyIncome, initialBalance: user.initialBalance } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: signToken(user._id), user: { _id: user._id, name: user.name, email: user.email, monthlyIncome: user.monthlyIncome, initialBalance: user.initialBalance } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => res.json(req.user));

// PUT /api/auth/me
router.put('/me', auth, async (req, res) => {
  try {
    const { name, monthlyIncome, initialBalance } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (monthlyIncome !== undefined) updates.monthlyIncome = monthlyIncome;
    if (initialBalance !== undefined) updates.initialBalance = initialBalance;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
