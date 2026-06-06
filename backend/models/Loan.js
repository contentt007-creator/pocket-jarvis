const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  note: { type: String, trim: true, default: '' },
}, { _id: true, timestamps: false });

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  personName: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },           // original loan amount
  amountRepaid: { type: Number, default: 0 },                 // running total of repayments
  purpose: { type: String, trim: true, default: '' },         // what the money was for
  dueDate: { type: Date },
  notes: { type: String, trim: true, default: '' },
  isSettled: { type: Boolean, default: false },
  repayments: [repaymentSchema],
}, { timestamps: true });

// Virtual: amount still outstanding
loanSchema.virtual('outstanding').get(function () {
  return Math.max(this.amount - this.amountRepaid, 0);
});

loanSchema.set('toJSON', { virtuals: true });
loanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Loan', loanSchema);
