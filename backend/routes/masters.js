const router = require('express').Router();
const Quote = require('../models/Quote');
const UserMethod = require('../models/UserMethod');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const EXPERTS = require('../data/experts');

// GET /api/masters/quote/random
router.get('/quote/random', async (req, res) => {
  try {
    const count = await Quote.countDocuments();
    const random = await Quote.findOne().skip(Math.floor(Math.random() * count));
    res.json(random);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/masters/quote/contextual?situation=overspending
router.get('/quote/contextual', async (req, res) => {
  try {
    const { situation } = req.query;
    const quotes = await Quote.find({ situation: { $in: [situation, 'any'] } });
    if (!quotes.length) {
      const count = await Quote.countDocuments();
      const fallback = await Quote.findOne().skip(Math.floor(Math.random() * count));
      return res.json(fallback);
    }
    res.json(quotes[Math.floor(Math.random() * quotes.length)]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/masters/experts
router.get('/experts', (req, res) => {
  res.json(EXPERTS.map(e => ({
    slug: e.slug,
    name: e.name,
    title: e.title,
    avatarColor: e.avatarColor,
    category: e.category,
    methodSummary: e.methodSummary,
    featuredQuote: e.quotes[0]?.quote || '',
  })));
});

// GET /api/masters/experts/:slug
router.get('/experts/:slug', auth, async (req, res) => {
  try {
    const expert = EXPERTS.find(e => e.slug === req.params.slug);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    // Build financial snapshot for "how this applies to you"
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const txns = await Transaction.find({ userId: req.user._id, date: { $gte: start, $lt: end } });
    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    res.json({
      ...expert,
      userSnapshot: { month, income, expense, net: income - expense },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/masters/method/active
router.get('/method/active', auth, async (req, res) => {
  try {
    let userMethod = await UserMethod.findOne({ userId: req.user._id });
    if (!userMethod) return res.json({ activeMethod: null, richLifePriorities: [] });
    res.json(userMethod);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/masters/method/active
router.put('/method/active', auth, async (req, res) => {
  try {
    const { activeMethod, richLifePriorities } = req.body;
    const update = { activeMethod, updatedAt: new Date() };
    if (richLifePriorities) update.richLifePriorities = richLifePriorities;
    const userMethod = await UserMethod.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update },
      { upsert: true, new: true }
    );
    res.json(userMethod);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/masters/rolling-income — 3-month rolling average (for Friedman method)
router.get('/rolling-income', auth, async (req, res) => {
  try {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const txns = await Transaction.find({
      userId: req.user._id,
      type: 'income',
      date: { $gte: threeMonthsAgo },
    });
    const total = txns.reduce((s, t) => s + t.amount, 0);
    const avg = Math.round(total / 3);
    res.json({ rollingAverage: avg, totalIncome3Mo: total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
