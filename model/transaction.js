const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  description: { type: String },
  referenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
}, {timestamps: true});

module.exports = mongoose.model('Transaction', transactionSchema);
