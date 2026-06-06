const router = require('express').Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { checkTransactionLimit } = require('../middleware/planGate');

// GET /api/transactions
router.get('/', auth, async (req, res) => {
  try {
    const { month, type, category, search, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (month) {
      const [year, mon] = month.split('-');
      query.date = {
        $gte: new Date(year, mon - 1, 1),
        $lt: new Date(year, mon, 1),
      };
    }
    if (type) query.type = type;
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(query),
    ]);
    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/transactions/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { month } = req.query;
    const [year, mon] = (month || new Date().toISOString().slice(0, 7)).split('-');
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);

    const txns = await Transaction.find({ userId: req.user._id, date: { $gte: start, $lt: end } });
    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const categoryBreakdown = {};
    txns.filter(t => t.type === 'expense').forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

    res.json({ income, expense, net: income - expense, categoryBreakdown });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transactions
router.post('/', auth, checkTransactionLimit, async (req, res) => {
  try {
    const txn = await Transaction.create({ ...req.body, userId: req.user._id });
    res.status(201).json(txn);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/transactions/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const txn = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });
    res.json(txn);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const txn = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!txn) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
