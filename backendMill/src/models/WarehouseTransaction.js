const mongoose = require('mongoose');

const WarehouseTransactionSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  type: {
    type: String,
    enum: ['in', 'out', 'adjustment', 'transfer_in', 'transfer_out'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousQuantity: {
    type: Number,
    required: true
  },
  newQuantity: {
    type: Number,
    required: true
  },
  reference: {
    type: String,
    enum: ['order', 'purchase', 'return', 'damage', 'adjustment', 'transfer', 'initial_stock', 'manual_adjustment', 'bulk_update'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Order', 'Purchase', 'Return']
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
WarehouseTransactionSchema.index({ itemId: 1, createdAt: -1 });
WarehouseTransactionSchema.index({ type: 1 });
WarehouseTransactionSchema.index({ reference: 1 });
WarehouseTransactionSchema.index({ createdAt: 1 });

const WarehouseTransaction = mongoose.model('WarehouseTransaction', WarehouseTransactionSchema);
module.exports = { WarehouseTransaction };