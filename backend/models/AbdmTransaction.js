const mongoose = require('mongoose');

const abdmTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  requestId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  consentId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  consentRequestId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  moduleType: {
    type: String,
    enum: ['HIP', 'HIU'],
    default: 'HIP',
    index: true
  },
  hiuId: {
    type: String,
    required: false,
    trim: true
  },
  hipId: {
    type: String,
    required: false,
    trim: true
  },
  transactionType: {
    type: String,
    enum: [
      'DISCOVERY', 'LINK_INIT', 'LINK_CONFIRM', 'LINK_TOKEN', 'DATA_REQUEST', 'CONSENT_NOTIFY', 'DEEP_LINK_SMS',
      'HIU_CONSENT_INIT', 'HIU_CONSENT_STATUS', 'HIU_CONSENT_FETCH', 'HIU_DATA_REQUEST', 'HIU_DATA_PUSH', 'HIU_NOTIFY'
    ],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['INITIATED', 'PENDING', 'COMPLETED', 'FAILED', 'ACKNOWLEDGED', 'REQUESTED', 'PROCESSING', 'RECEIVED', 'DELIVERED', 'ERROR'],
    default: 'INITIATED',
    index: true
  },
  linkReferenceNumber: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  linkToken: {
    type: String,
    required: false
  },
  patientUhid: {
    type: String,
    required: false,
    trim: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: false
  },
  careContexts: [{
    referenceNumber: { type: String, trim: true },
    display: { type: String, trim: true }
  }],
  abhaNumber: {
    type: String,
    required: false,
    trim: true
  },
  abhaAddress: {
    type: String,
    required: false,
    trim: true
  },
  otp: {
    type: String,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    required: false,
    index: { expires: '24h' } // Auto-remove old completed/stale transactions after 24h
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  }
}, { timestamps: true });

abdmTransactionSchema.index({ hospitalId: 1, transactionId: 1 });
abdmTransactionSchema.index({ hospitalId: 1, requestId: 1 });
abdmTransactionSchema.index({ hospitalId: 1, linkReferenceNumber: 1 });

module.exports = mongoose.model('AbdmTransaction', abdmTransactionSchema);
