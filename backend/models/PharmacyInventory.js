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
  description: {
    type: String,
    trim: true,
    default: ''
  },
  dosageForm: {
    type: String,
    trim: true,
    default: ''
  },
  packType: {
    type: String,
    trim: true,
    default: ''
  },
  unitsPerPack: {
    type: Number,
    default: 1
  },
  quantityPacks: {
    type: Number,
    default: 0
  },
  quantityUnits: {
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
  rateExGst: {
    type: Number,
    default: 0
  },
  perUnitRate: {
    type: Number,
    default: 0
  },
  sgst: {
    type: Number,
    default: 0
  },
  cgst: {
    type: Number,
    default: 0
  },
  mrp: {
    type: Number,
    default: 0
  },
  perUnitRateWithGst: {
    type: Number,
    default: 0
  },
  hsn: {
    type: String,
    default: '0',
    trim: true
  },
  thresholdMedicineNumber: {
    type: Number,
    default: 10
  },
  // Backward compatibility fields:
  oldMrp: {
    type: Number,
    default: 0
  },
  pack: {
    type: String,
    default: '0',
    trim: true
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
  nRate: {
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
  },
  amountExGst: {
    type: Number,
    default: 0
  },
  amountIncGst: {
    type: Number,
    default: 0
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null
  },
  supplierName: {
    type: String,
    trim: true,
    default: ''
  },
  lastPurchaseDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Pre-save middleware to keep quantity, quantityUnits, quantityPacks, rates, and amounts automatically synchronized
pharmacyInventorySchema.pre('save', function() {
  // Sync quantity and quantityUnits
  if (this.isModified('quantity')) {
    this.quantityUnits = this.quantity;
  } else if (this.isModified('quantityUnits')) {
    this.quantity = this.quantityUnits;
  }

  // Recalculate quantityPacks (number of packs available)
  const up = this.unitsPerPack > 0 ? this.unitsPerPack : 1;
  this.quantityPacks = Math.round((this.quantityUnits / up) * 10000) / 10000;

  // Recalculate MRP if 0 or empty
  if (!this.mrp) {
    this.mrp = this.rateExGst * (1 + ((this.sgst + this.cgst) / 100));
  }

  // Recalculate rates
  this.perUnitRate = this.rateExGst / up;
  this.perUnitRateWithGst = this.mrp / up;

  // Sync backward compatibility fields
  this.rate = this.rateExGst;
  this.cst = this.cgst;
  this.pack = this.packType || '0';

  // Sync amount fields
  this.amount = this.quantityPacks * this.rateExGst;
  this.amountExGst = this.rateExGst * this.quantityPacks;
  this.amountIncGst = this.mrp * this.quantityPacks;
});

// Compound index for unique check per hospital, medicine name and batch number
pharmacyInventorySchema.index({ hospitalId: 1, itemName: 1, batch: 1 }, { unique: true, name: 'hospital_medicine_batch_unique' });

module.exports = mongoose.model('PharmacyInventory', pharmacyInventorySchema);
