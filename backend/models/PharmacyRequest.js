const mongoose = require('mongoose');

const requestItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  requestedQty: {
    type: Number,
    required: true,
    min: 1
  },
  approvedQty: {
    type: Number,
    default: 0
  },
  issuedQty: {
    type: Number,
    default: 0
  },
  usedQty: {
    type: Number,
    default: 0
  },
  returnedQty: {
    type: Number,
    default: 0
  },
  damagedQty: {
    type: Number,
    default: 0
  },
  pendingQty: {
    type: Number,
    default: 0
  },
  rejectedQty: {
    type: Number,
    default: 0
  },
  batch: {
    type: String,
    default: '',
    trim: true
  }
}, { _id: false });

const auditLogSchema = new mongoose.Schema({
  status: {
    type: String
  },
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

const pharmacyRequestSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  requestNumber: {
    type: String,
    required: true
  },
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IpdAdmission',
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
  procedureName: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: [
      'Pending',
      'Approved',
      'Partially Approved',
      'Rejected',
      'Issued',
      'Return Requested',
      'Return Accepted',
      'Return Rejected',
      'Remaining Items Issued',
      'Completed'
    ],
    default: 'Pending'
  },
  remarks: {
    type: String,
    default: ''
  },
  issuedTo: {
    type: String,
    default: ''
  },
  items: [requestItemSchema],
  auditTrail: [auditLogSchema]
}, { timestamps: true });

// Index for fast lookups per hospital and patient/admission
pharmacyRequestSchema.index({ hospitalId: 1, admissionId: 1 });
pharmacyRequestSchema.index({ hospitalId: 1, requestNumber: 1 }, { unique: true });

module.exports = mongoose.model('PharmacyRequest', pharmacyRequestSchema);
