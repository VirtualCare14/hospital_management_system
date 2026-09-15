const mongoose = require('mongoose');

const abdmConsentSchema = new mongoose.Schema({
  consentId: {
    type: String,
    required: false,
    sparse: true,
    unique: true,
    trim: true,
    index: true
  },
  consentRequestId: {
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
  status: {
    type: String,
    enum: ['GRANTED', 'REVOKED', 'EXPIRED', 'DENIED', 'REQUESTED', 'INITIATED', 'FAILED', 'INIT_FAILED'],
    default: 'GRANTED',
    trim: true
  },
  patientAbha: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: false
  },
  patientUhid: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  requester: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  purpose: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  permission: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  signature: {
    type: String,
    required: false
  },
  schemaVersion: {
    type: String,
    required: false
  },
  careContexts: [{
    careContextReference: { type: String, trim: true },
    patientReference: { type: String, trim: true }
  }],
  hiTypes: [{
    type: String,
    trim: true
  }],
  consentDetail: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  grantedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: false
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  }
}, { timestamps: true });

abdmConsentSchema.index({ hospitalId: 1, consentId: 1 });
abdmConsentSchema.index({ hospitalId: 1, patientAbha: 1 });

module.exports = mongoose.model('AbdmConsent', abdmConsentSchema);
