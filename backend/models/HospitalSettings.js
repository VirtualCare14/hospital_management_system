const mongoose = require('mongoose');

const hospitalSettingsSchema = new mongoose.Schema({
  hospitalName: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumbers: {
    type: [String],
    required: true,
    validate: {
      validator: (numbers) => numbers.length > 0,
      message: 'At least one mobile number is required'
    }
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  hospitalHeading: {
    type: String,
    default: '',
    trim: true
  },
  logoUrl: {
    type: String,
    default: ''
  },
  logoPublicId: {
    type: String,
    default: ''
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },

  // Contact & Registration Details
  alternateMobileNumber: {
    type: String,
    default: '',
    trim: true
  },
  emailAddress: {
    type: String,
    default: '',
    trim: true
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  gstNumber: {
    type: String,
    default: '',
    trim: true
  },
  panNumber: {
    type: String,
    default: '',
    trim: true
  },
  registrationNumber: {
    type: String,
    default: '',
    trim: true
  },
  invoiceFooterMessage: {
    type: String,
    default: '',
    trim: true
  },

  // Invoice Number Settings
  invoicePrefix: {
    type: String,
    default: 'HOSP-INV-2026-',
    trim: true
  },
  invoiceCounter: {
    type: Number,
    default: 1,
    min: 1
  },
  invoiceFormat: {
    type: String,
    default: '{PREFIX}{COUNTER}',
    trim: true
  },

  // GST Configuration
  gstEnabled: {
    type: Boolean,
    default: true
  },
  gstPercentage: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  gstRules: {
    type: String,
    default: ''
  },

  // Discount Configuration
  discountEnabled: {
    type: Boolean,
    default: true
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discountFixedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  patientSpecificDiscounts: {
    type: String, // String mapping rules e.g. "Staff:10,EWS:100"
    default: 'Staff:10,EWS:100'
  },
  discountReasons: {
    type: [String],
    default: ['General Discount', 'Staff Discount', 'EWS Discount', 'Emergency Discount']
  },
  sdtPricingInBilling: {
    type: Boolean,
    default: true
  },

  // Audit Logs for Discount and Settings Activity
  settingsAuditTrail: [{
    fieldChanged: { type: String, required: true },
    oldValue: { type: String, default: '' },
    newValue: { type: String, default: '' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    performedByName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Ensure only one hospital settings record per hospital
hospitalSettingsSchema.index({ hospitalId: 1 }, { unique: true });

module.exports = mongoose.model('HospitalSettings', hospitalSettingsSchema);

