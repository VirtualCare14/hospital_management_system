const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cheque'],
    required: true
  },
  transactionRef: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedByName: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  time: {
    type: String,
    default: ''
  }
});

const labBillSchema = new mongoose.Schema({
  billNo: {
    type: String,
    unique: true,
    sparse: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  },
  labRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabRequest',
    required: true
  },
  labId: {
    type: String,
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testDetails: [{
    name: String,
    category: String,
    basePrice: Number,
    taxPercentage: Number,
    taxAmount: Number,
    totalAmount: Number
  }],
  baseAmount: {
    type: Number,
    default: 0
  },
  taxPercentage: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partial', 'Paid'],
    default: 'Unpaid'
  },
  payments: [paymentSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const generateBillNo = () => `BILL${Math.floor(100000 + Math.random() * 900000)}`;

labBillSchema.pre('validate', async function() {
  if (this.billNo) return;

  let billNo = generateBillNo();
  while (await mongoose.models.LabBill.exists({ billNo })) {
    billNo = generateBillNo();
  }
  this.billNo = billNo;
});

module.exports = mongoose.model('LabBill', labBillSchema);
