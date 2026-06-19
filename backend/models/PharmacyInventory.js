const mongoose = require('mongoose');

const pharmacyInventorySchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  sNo: {
    type: Number,
    default: 0
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  oldMrp: {
    type: Number,
    default: 0
  },
  pack: {
    type: String,
    default: '0',
    trim: true
  },
  mrp: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    default: 0
  },
  free: {
    type: Number,
    default: 0
  },
  rate: {
    type: Number,
    default: 0
  },
  dis: {
    type: Number,
    default: 0
  },
  batch: {
    type: String,
    required: true,
    trim: true
  },
  expiry: {
    type: Date,
    required: true
  },
  nRate: {
    type: Number,
    default: 0
  },
  hsn: {
    type: String,
    default: '0',
    trim: true
  },
  sgst: {
    type: Number,
    default: 0
  },
  cst: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound index for unique check per hospital, medicine name and batch number
pharmacyInventorySchema.index({ hospitalId: 1, itemName: 1, batch: 1 }, { unique: true, name: 'hospital_medicine_batch_unique' });

module.exports = mongoose.model('PharmacyInventory', pharmacyInventorySchema);
