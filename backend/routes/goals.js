const router = require('express').Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const { checkGoalLimit } = require('../middleware/planGate');

// GET /api/goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/goals
router.post('/', auth, checkGoalLimit, async (req, res) => {
  try {
    const goal = await Goal.create({ ...req.body, userId: req.user._id });
    res.status(201).json(goal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/goals/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/goals/:id/deposit
router.post('/:id/deposit', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Valid amount required' });

    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    goal.savedAmount = Math.min(goal.savedAmount + amount, goal.targetAmount);
    const pct = (goal.savedAmount / goal.targetAmount) * 100;
    const newMilestones = [25, 50, 75, 100].filter(m => pct >= m && !goal.milestonesSeen.includes(m));
    goal.milestonesSeen.push(...newMilestones);

    await goal.save();
    res.json({ goal, newMilestones });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
