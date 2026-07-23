const mongoose = require('mongoose');

const purchaseReturnItemSchema = new mongoose.Schema({
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
  expiry: {
    type: Date,
    required: true
  },
  quantityReturned: {
    type: Number,
    required: true,
    min: 1
  },
  rate: {
    type: Number,
    required: true
  },
  mrp: {
    type: Number,
    required: true
  },
  gst: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const purchaseReturnSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierName: {
    type: String,
    trim: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  items: [purchaseReturnItemSchema],
  returnDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);
