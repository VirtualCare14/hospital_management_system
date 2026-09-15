const mongoose = require('mongoose');

const abdmHealthRecordSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  consentId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  careContextReference: {
    type: String,
    required: false,
    trim: true,
    index: true
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
    required: false,
    index: true
  },
  patientUhid: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  hipId: {
    type: String,
    required: false,
    trim: true
  },
  hiuId: {
    type: String,
    required: false,
    trim: true
  },
  media: {
    type: String,
    default: 'application/fhir+json'
  },
  checksum: {
    type: String,
    required: false
  },
  resourceType: {
    type: String,
    default: 'Bundle',
    index: true
  },
  decryptedFhir: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  entries: [{
    type: mongoose.Schema.Types.Mixed
  }],
  receivedAt: {
    type: Date,
    default: Date.now
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  }
}, { timestamps: true });

abdmHealthRecordSchema.index({ hospitalId: 1, transactionId: 1 });
abdmHealthRecordSchema.index({ transactionId: 1, careContextReference: 1 });
abdmHealthRecordSchema.index({ patientAbha: 1, receivedAt: -1 });

module.exports = mongoose.model('AbdmHealthRecord', abdmHealthRecordSchema);
