const mongoose = require('mongoose');

const pharmacyStockMovementSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Excel Upload', 'Sale', 'Sales Return', 'Manual Adjustment'],
    required: true
  },
  quantity: {
    type: Number,
    required: true // can be positive or negative
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null // can point to PharmacyBill, PharmacyRequest, or PharmacyUploadHistory
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

pharmacyStockMovementSchema.index({ hospitalId: 1, itemName: 1, batch: 1 });
pharmacyStockMovementSchema.index({ hospitalId: 1, timestamp: 1 });

module.exports = mongoose.model('PharmacyStockMovement', pharmacyStockMovementSchema);
