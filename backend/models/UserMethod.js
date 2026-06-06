const mongoose = require('mongoose');

const userMethodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  activeMethod: { type: String, default: null }, // expert slug e.g. 'warren-buffett'
  richLifePriorities: { type: [String], default: [] }, // for Ramit Sethi
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserMethod', userMethodSchema);
