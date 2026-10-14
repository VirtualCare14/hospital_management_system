const mongoose = require('mongoose');

const tpaMasterSchema = new mongoose.Schema({
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
  irdaiLicenseNo: {
    type: String,
    default: '',
    trim: true
  },
  associatedInsurers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InsuranceCompany'
  }],
  contactPerson: {
    type: String,
    default: '',
    trim: true
  },
  contactPhone: {
    type: String,
    required: true,
    trim: true
  },
  preauthEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  claimsEmail: {
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
  preauthTatHours: {
    type: Number,
    default: 6,
    min: 1
  },
  discountRatePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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

tpaMasterSchema.index({ hospitalId: 1, name: 1 }, { unique: true });
tpaMasterSchema.index({ hospitalId: 1, code: 1 }, { unique: true });
tpaMasterSchema.index({ hospitalId: 1, isActive: 1 });

module.exports = mongoose.model('TpaMaster', tpaMasterSchema);
