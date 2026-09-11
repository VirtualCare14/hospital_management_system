const mongoose = require('mongoose');

const abdmCareContextSchema = new mongoose.Schema({
  careContextReference: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  display: {
    type: String,
    required: false,
    trim: true
  },
  patientUhid: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: false,
    index: true
  },
  medoraRecordType: {
    type: String,
    enum: ['OPD', 'IPD', 'Lab', 'Prescription', 'DischargeSummary', 'Consultation', 'Registration', 'Other'],
    default: 'OPD',
    index: true
  },
  medoraRecordId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: false
  },
  linkReference: {
    type: String,
    required: false,
    trim: true
  },
  transactionId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  requestId: {
    type: String,
    required: false,
    trim: true
  },
  abhaNumber: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  abhaAddress: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  hiType: {
    type: String,
    default: 'Prescription',
    trim: true
  },
  linkType: {
    type: String,
    enum: ['USER_INITIATED', 'HIP_INITIATED'],
    default: 'USER_INITIATED'
  },
  linkStatus: {
    type: String,
    enum: ['INITIATED', 'CONFIRMED', 'LINKED', 'FAILED'],
    default: 'LINKED'
  },
  linkToken: {
    type: String,
    required: false
  },
  linkedAt: {
    type: Date,
    default: Date.now
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  }
}, { timestamps: true });

abdmCareContextSchema.index({ hospitalId: 1, patientUhid: 1, careContextReference: 1 }, { unique: true });
abdmCareContextSchema.index({ hospitalId: 1, abhaAddress: 1 });
abdmCareContextSchema.index({ patientId: 1, medoraRecordType: 1 });

module.exports = mongoose.model('AbdmCareContext', abdmCareContextSchema);

