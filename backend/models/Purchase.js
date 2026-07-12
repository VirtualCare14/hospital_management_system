const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
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
  pack: {
    type: String,
    default: '0',
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  free: {
    type: Number,
    default: 0,
    min: 0
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  mrp: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  sgst: {
    type: Number,
    default: 0,
    min: 0
  },
  cgst: {
    type: Number,
    default: 0,
    min: 0
  },
  igst: {
    type: Number,
    default: 0,
    min: 0
  },
  hsn: {
    type: String,
    default: '0',
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  returnedQty: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  purchaseInvoiceNumber: {
    type: String,
    required: true,
    trim: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierName: {
    type: String,
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  receiveDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentType: {
    type: String,
    enum: ['Cash', 'Credit', 'UPI', 'Bank Transfer', 'Card'],
    required: true
  },
  dueDate: {
    type: Date
  },
  purchaseStatus: {
    type: String,
    enum: ['Completed', 'Returned', 'Partially Returned', 'Cancelled'],
    default: 'Completed'
  },
  notes: {
    type: String,
    default: ''
  },
  items: [purchaseItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

purchaseSchema.index(
  { hospitalId: 1, purchaseInvoiceNumber: 1, supplierId: 1 },
  { 
    unique: true,
    partialFilterExpression: { supplierId: { $exists: true, $ne: null } }
  }
);
purchaseSchema.index(
  { hospitalId: 1, purchaseInvoiceNumber: 1, supplierName: 1 },
  { 
    unique: true,
    partialFilterExpression: { supplierId: null }
  }
);
purchaseSchema.index({ hospitalId: 1, invoiceDate: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
