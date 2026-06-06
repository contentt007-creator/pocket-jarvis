const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '🎯' },
  targetAmount: { type: Number, required: true, min: 1 },
  savedAmount: { type: Number, default: 0 },
  targetDate: { type: Date, required: true },
  milestonesSeen: { type: [Number], default: [] }, // [25, 50, 75, 100]
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
