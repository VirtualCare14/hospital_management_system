const mongoose = require('mongoose');

const PharmacyAdjustmentSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  batch: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Increase', 'Decrease'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  remarks: {
    type: String
  },
  approvedBy: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PharmacyAdjustment', PharmacyAdjustmentSchema);
