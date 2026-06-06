const router = require('express').Router();
const Debt = require('../models/Debt');
const auth = require('../middleware/auth');

// GET /api/debts
router.get('/', auth, async (req, res) => {
  try {
    const debts = await Debt.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(debts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/debts
router.post('/', auth, async (req, res) => {
  try {
    const debt = await Debt.create({ ...req.body, userId: req.user._id });
    res.status(201).json(debt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/debts/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    res.json(debt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/debts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
