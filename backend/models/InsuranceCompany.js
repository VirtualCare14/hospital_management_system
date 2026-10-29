const mongoose = require('mongoose');

const insuranceCompanySchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  payerType: {
    type: String,
    enum: [
      'Private',
      'Public PSU',
      'Standalone Health',
      'Government Scheme',
      'Corporate Trust',
      'Panel',
      'Other (Custom)',
      'Other'
    ],
    default: 'Private',
    trim: true
  },
  customPayerType: {
    type: String,
    default: '',
    trim: true
  },
  tollFreeNumber: {
    type: String,
    default: '',
    trim: true
  },
  claimEmail: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  cashlessEmail: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  portalUrl: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  city: {
    type: String,
    default: '',
    trim: true
  },
  state: {
    type: String,
    default: '',
    trim: true
  },
  pincode: {
    type: String,
    default: '',
    trim: true
  },
  gstin: {
    type: String,
    default: '',
    trim: true
  },
  panNumber: {
    type: String,
    default: '',
    trim: true
  },
  hasInHouseTpa: {
    type: Boolean,
    default: false
  },
  settlementTatDays: {
    type: Number,
    default: null,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

insuranceCompanySchema.index({ hospitalId: 1, name: 1 }, { unique: true });
insuranceCompanySchema.index({ hospitalId: 1, code: 1 }, { unique: true });
insuranceCompanySchema.index({ hospitalId: 1, isActive: 1 });

module.exports = mongoose.model('InsuranceCompany', insuranceCompanySchema);
