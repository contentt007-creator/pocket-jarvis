const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Bills', 'Other'],
    required: true,
  },
  limit: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
}, { _id: false });

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  month: { type: String, required: true }, // YYYY-MM
  categories: [categorySchema],
}, { timestamps: true });

budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
