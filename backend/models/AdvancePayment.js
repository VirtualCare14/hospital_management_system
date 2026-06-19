const mongoose = require('mongoose');

const advancePaymentSchema = new mongoose.Schema({
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
  uhid: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: String, // format YYYY-MM-DD or readable
    required: true
  },
  time: {
    type: String, // format HH:MM
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Net Banking', 'Cheque', 'Insurance'],
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collectedByName: {
    type: String,
    required: true
  },
  isAdjusted: {
    type: Boolean,
    default: false
  },
  adjustedInInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
    default: null
  }
}, { timestamps: true });

advancePaymentSchema.index({ hospitalId: 1, patientId: 1 });
advancePaymentSchema.index({ hospitalId: 1, uhid: 1 });
advancePaymentSchema.index({ isAdjusted: 1 });

module.exports = mongoose.model('AdvancePayment', advancePaymentSchema);
