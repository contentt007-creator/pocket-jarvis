const router = require('express').Router();
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

// GET /api/subscriptions
router.get('/', auth, async (req, res) => {
  try {
    const subs = await Subscription.find({ userId: req.user._id }).sort({ renewalDate: 1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/subscriptions/upcoming
router.get('/upcoming', auth, async (req, res) => {
  try {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const subs = await Subscription.find({
      userId: req.user._id,
      isActive: true,
      renewalDate: { $gte: now, $lte: in7 },
    }).sort({ renewalDate: 1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/subscriptions
router.post('/', auth, async (req, res) => {
  try {
    const sub = await Subscription.create({ ...req.body, userId: req.user._id });
    res.status(201).json(sub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/subscriptions/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json(sub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/subscriptions/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
