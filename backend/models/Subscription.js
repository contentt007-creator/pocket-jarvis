const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  plan:         { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
  status:       { type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'active' },
  startDate:    { type: Date, default: Date.now },
  endDate:      { type: Date },                   // null = free forever
  autoRenew:    { type: Boolean, default: false },

  // SSLCommerz payment tracking
  payments: [{
    transactionId: String,                         // SSLCommerz tran_id
    valId:         String,                         // SSLCommerz val_id after validation
    amount:        Number,
    plan:          String,
    status:        { type: String, enum: ['pending', 'success', 'failed', 'cancelled'] },
    paidAt:        Date,
    gateway:       String,                         // bkash / nagad / card / etc
    cardType:      String,
  }],
}, { timestamps: true });

// Check if subscription is currently active
subscriptionSchema.virtual('isActive').get(function () {
  if (this.plan === 'free') return true;
  if (this.status !== 'active') return false;
  if (!this.endDate) return true;
  return new Date() < new Date(this.endDate);
});

subscriptionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
