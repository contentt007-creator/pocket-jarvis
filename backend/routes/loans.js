const router = require('express').Router();
const Loan = require('../models/Loan');
const auth = require('../middleware/auth');

// GET /api/loans  — all loans for the user
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query; // 'active' | 'settled' | all
    const query = { userId: req.user._id };
    if (status === 'active') query.isSettled = false;
    if (status === 'settled') query.isSettled = true;
    const loans = await Loan.find(query).sort({ createdAt: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/loans/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user._id });
    const totalLent = loans.reduce((s, l) => s + l.amount, 0);
    const totalRepaid = loans.reduce((s, l) => s + l.amountRepaid, 0);
    const totalOutstanding = loans.filter(l => !l.isSettled).reduce((s, l) => s + Math.max(l.amount - l.amountRepaid, 0), 0);
    const activeCount = loans.filter(l => !l.isSettled).length;
    const overdueCount = loans.filter(l => !l.isSettled && l.dueDate && new Date(l.dueDate) < new Date()).length;
    res.json({ totalLent, totalRepaid, totalOutstanding, activeCount, overdueCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/loans/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/loans  — create a new loan
router.post('/', auth, async (req, res) => {
  try {
    const loan = await Loan.create({ ...req.body, userId: req.user._id, amountRepaid: 0, repayments: [] });
    res.status(201).json(loan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/loans/:id  — edit loan details
router.put('/:id', auth, async (req, res) => {
  try {
    const { personName, amount, purpose, dueDate, notes } = req.body;
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { personName, amount, purpose, dueDate, notes },
      { new: true }
    );
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json(loan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/loans/:id/repayment  — record a repayment
router.post('/:id/repayment', auth, async (req, res) => {
  try {
    const { amount, note, date } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ message: 'Valid amount required' });

    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const repayment = { amount: Number(amount), note: note || '', date: date ? new Date(date) : new Date() };
    loan.repayments.push(repayment);
    loan.amountRepaid = Math.min(loan.amountRepaid + Number(amount), loan.amount);

    // Auto-settle if fully repaid
    if (loan.amountRepaid >= loan.amount) loan.isSettled = true;

    await loan.save();
    res.json(loan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/loans/:id/repayment/:repaymentId  — undo a repayment
router.delete('/:id/repayment/:repaymentId', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const repayment = loan.repayments.id(req.params.repaymentId);
    if (!repayment) return res.status(404).json({ message: 'Repayment not found' });

    loan.amountRepaid = Math.max(loan.amountRepaid - repayment.amount, 0);
    repayment.deleteOne();
    if (loan.amountRepaid < loan.amount) loan.isSettled = false;
    await loan.save();
    res.json(loan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/loans/:id/settle  — manually mark as settled
router.put('/:id/settle', auth, async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isSettled: true, amountRepaid: (await Loan.findById(req.params.id)).amount },
      { new: true }
    );
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/loans/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const loan = await Loan.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
