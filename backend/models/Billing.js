const mongoose = require('mongoose');

const billingItemSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['OPD', 'IPD', 'Lab', 'Medicine', 'Consumable', 'SameDayTreatment', 'BedCharge', 'OT', 'Other'],
    required: true
  },
  date: { type: String, default: '' },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  total: { type: Number, required: true, min: 0 },
  // Reference to source record
  sourceId: { type: mongoose.Schema.Types.ObjectId },
  sourceModel: { type: String },
  // For removal tracking
  isRemoved: { type: Boolean, default: false }
});

const billingSchema = new mongoose.Schema({
  billNo: {
    type: String,
    sparse: true
  },
  invoiceNo: {
    type: String,
    sparse: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  uhid: { type: String, required: true },
  patientName: { type: String, default: '' },
  patientMobile: { type: String, default: '' },
  patientGender: { type: String, default: '' },
  patientAge: { type: Number },
  doctorName: { type: String, default: '' },
  billType: {
    type: String,
    enum: ['OPD', 'SameDayTreatment', 'Lab', 'IPD', 'All'],
    required: true
  },
  items: [billingItemSchema],
  subtotal: { type: Number, default: 0 },
  gstPercentage: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  
  // Payment Details
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Net Banking', 'Cheque', 'Insurance', 'Mixed Payment', ''],
    default: ''
  },
  transactionRef: {
    type: String,
    default: ''
  },
  mixedPayments: [{
    method: { type: String, enum: ['Cash', 'UPI', 'Card', 'Net Banking', 'Cheque', 'Insurance'] },
    amount: { type: Number, default: 0 }
  }],
  remarks: {
    type: String,
    default: ''
  },
  advanceAdjusted: {
    type: Number,
    default: 0
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  
  // Track removed items for admin
  removedItems: [billingItemSchema],
  status: {
    type: String,
    enum: ['Draft', 'Final', 'Cancelled'],
    default: 'Draft'
  },
  discountRequestStatus: {
    type: String,
    enum: ['None', 'Pending', 'Approved', 'Rejected'],
    default: 'None'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Partially Paid', 'Unpaid', 'Cancelled'],
    default: 'Unpaid'
  },
  
  auditTrail: [{
    action: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    performedByName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    remarks: { type: String, default: '' }
  }],
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

billingSchema.index({ uhid: 1 });
billingSchema.index({ patientId: 1 });
billingSchema.index({ hospitalId: 1 });
billingSchema.index({ hospitalId: 1, billNo: 1 }, { unique: true, sparse: true });
billingSchema.index({ hospitalId: 1, invoiceNo: 1 }, { unique: true, sparse: true, name: 'hospital_invoiceNo_unique' });


const generateBillNo = () => `INV${Math.floor(100000 + Math.random() * 900000)}`;

billingSchema.pre('validate', async function() {
  if (this.billNo) return;
  let billNo = generateBillNo();
  while (await mongoose.models.Billing.exists({ billNo })) {
    billNo = generateBillNo();
  }
  this.billNo = billNo;
});

module.exports = mongoose.model('Billing', billingSchema);
