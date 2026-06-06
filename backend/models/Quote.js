const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  expert: { type: String, required: true },
  title: { type: String, required: true },
  quote: { type: String, required: true },
  method: { type: String, required: true },
  category: {
    type: String,
    enum: ['saving', 'spending', 'mindset', 'investing', 'budgeting'],
    required: true,
  },
  avatarColor: { type: String, required: true },
  situation: {
    type: [String],
    enum: ['overspending', 'on-track', 'goal-reached', 'new-month', 'under-budget', 'regret', 'grade-ab', 'grade-c', 'grade-df', 'milestone', 'any'],
    default: ['any'],
  },
});

module.exports = mongoose.model('Quote', quoteSchema);
