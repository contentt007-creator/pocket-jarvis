const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  personName: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['owe', 'owed'], required: true }, // owe = I owe them, owed = they owe me
  dueDate: { type: Date },
  isSettled: { type: Boolean, default: false },
  notes: { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Debt', debtSchema);
