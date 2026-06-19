const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  gstPercentage: {
    type: Number,
    default: 0,
    min: 0
  },
  gstAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  amount: {
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

const mixedPaymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const billAuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByName: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    default: ''
  }
}, { _id: false });

const pharmacyBillSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  billNumber: {
    type: String,
    required: true
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    default: null
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  customerDetails: {
    name: { type: String, default: '' },
    mobile: { type: String, default: '' },
    age: { type: Number },
    gender: { type: String, enum: ['', 'Male', 'Female', 'Other'], default: '' }
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  doctorName: {
    type: String,
    default: ''
  },
  billDate: {
    type: Date,
    default: Date.now
  },
  items: [billItemSchema],
  subTotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  gstAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Mixed Payment'],
    required: true
  },
  mixedPayments: [mixedPaymentSchema],
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Partially Paid', 'Unpaid'],
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Returned', 'Partially Returned', 'Cancelled'],
    default: 'Active'
  },
  auditTrail: [billAuditLogSchema]
}, { timestamps: true });

pharmacyBillSchema.index({ hospitalId: 1, billNumber: 1 }, { unique: true });
pharmacyBillSchema.index({ hospitalId: 1, patientId: 1 });
pharmacyBillSchema.index({ hospitalId: 1, billDate: 1 });

module.exports = mongoose.model('PharmacyBill', pharmacyBillSchema);
