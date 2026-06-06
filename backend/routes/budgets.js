const router = require('express').Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const ALL_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Bills', 'Other'];

async function getOrCreateBudget(userId, month) {
  let budget = await Budget.findOne({ userId, month });
  if (!budget) {
    budget = await Budget.create({
      userId,
      month,
      categories: ALL_CATEGORIES.map(name => ({ name, limit: 0, spent: 0 })),
    });
  }
  return budget;
}

async function syncSpent(userId, month, budget) {
  const [year, mon] = month.split('-');
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);
  const txns = await Transaction.find({ userId, type: 'expense', date: { $gte: start, $lt: end } });

  const spentMap = {};
  txns.forEach(t => { spentMap[t.category] = (spentMap[t.category] || 0) + t.amount; });

  budget.categories.forEach(cat => { cat.spent = spentMap[cat.name] || 0; });
  await budget.save();
  return budget;
}

// GET /api/budgets/:month
router.get('/:month', auth, async (req, res) => {
  try {
    const budget = await getOrCreateBudget(req.user._id, req.params.month);
    const synced = await syncSpent(req.user._id, req.params.month, budget);
    res.json(synced);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/budgets/:month
router.put('/:month', auth, async (req, res) => {
  try {
    const { categories } = req.body; // array of { name, limit }
    let budget = await getOrCreateBudget(req.user._id, req.params.month);
    categories.forEach(({ name, limit }) => {
      const cat = budget.categories.find(c => c.name === name);
      if (cat) cat.limit = limit;
    });
    await budget.save();
    const synced = await syncSpent(req.user._id, req.params.month, budget);
    res.json(synced);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/budgets/:month/status
router.get('/:month/status', auth, async (req, res) => {
  try {
    const budget = await getOrCreateBudget(req.user._id, req.params.month);
    const synced = await syncSpent(req.user._id, req.params.month, budget);
    const status = synced.categories.map(cat => ({
      name: cat.name,
      limit: cat.limit,
      spent: cat.spent,
      percentage: cat.limit > 0 ? Math.round((cat.spent / cat.limit) * 100) : 0,
      overBudget: cat.limit > 0 && cat.spent > cat.limit,
    }));
    res.json({ month: req.params.month, categories: status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
