const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Bills', 'Other'],
    default: 'Other',
  },
  date: { type: Date, default: Date.now },
  tag: { type: String, enum: ['Need', 'Want', 'Regret', null], default: null },
  notes: { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
