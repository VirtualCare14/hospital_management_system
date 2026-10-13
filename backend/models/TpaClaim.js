const mongoose = require('mongoose');

const tpaClaimDocumentSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: [
      'Identity',
      'Policy',
      'PreAuth',
      'Clinical',
      'Discharge',
      'Lab',
      'Pharmacy',
      'Billing',
      'ClaimForm',
      'Other'
    ],
    default: 'Other',
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    default: '',
    trim: true
  },
  fileUrl: {
    type: String,
    required: true,
    trim: true
  },
  cloudinaryPublicId: {
    type: String,
    default: '',
    trim: true
  },
  fileType: {
    type: String,
    default: 'pdf',
    trim: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

const claimQuerySchema = new mongoose.Schema({
  queryText: {
    type: String,
    required: true,
    trim: true
  },

  queryDate: {
    type: Date,
    default: Date.now
  },

  responseText: {
    type: String,
    default: '',
    trim: true
  },

  responseDate: {
    type: Date
  },

  queryDocUrl: {
    type: String,
    default: '',
    trim: true
  },

  responseDocUrl: {
    type: String,
    default: '',
    trim: true
  },

  status: {
    type: String,
    enum: ['Open', 'Responded', 'Closed'],
    default: 'Open',
    trim: true
  }
}, {
  timestamps: true
});

const tpaClaimSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  ipdAdmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IpdAdmission',
    required: true,
    index: true
  },
  patientInsuranceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientInsurance',
    required: true,
    index: true
  },
  insuranceCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InsuranceCompany',
    required: true,
    index: true
  },
  tpaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TpaMaster',
    default: null,
    index: true
  },
  preAuthorizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PreAuthorization',
    default: null,
    index: true
  },
  billingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
    default: null,
    index: true
  },

  // Claim Identification
  claimNumber: {
    type: String,
    required: true,
    trim: true
  },
  portalClaimId: {
    type: String,
    default: '',
    trim: true
  },

  // Financial Summary Snapshot (Captured downstream from Billing and PreAuth, non-payable is manual)
  totalHospitalBill: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAuthorizedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  claimedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  nonPayableAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  copayAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deductibleAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  settledAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  tdsDeducted: {
    type: Number,
    default: 0,
    min: 0
  },
  disallowedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  netReceivedAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Submission Logistics
  submissionType: {
    type: String,
    enum: [
      'TPA Portal',
      'Physical Courier',
      'Email',
      'In-Person Desk'
    ],
    default: 'TPA Portal',
    trim: true
  },
  submissionDate: {
    type: Date
  },
  courierName: {
    type: String,
    default: '',
    trim: true
  },
  trackingNumber: {
    type: String,
    default: '',
    trim: true
  },
  dispatchDate: {
    type: Date
  },
  acknowledgmentDocUrl: {
    type: String,
    default: '',
    trim: true
  },

  // Status Lifecycle
  status: {
    type: String,
    enum: [
      'Draft',
      'Documents Pending',
      'Ready for Submission',
      'Submitted',
      'Under Query',
      'Query Responded',
      'Approved',
      'Partially Settled',
      'Settled',
      'Rejected',
      'Cancelled'
    ],
    default: 'Draft',
    trim: true,
    index: true
  },

  // Document Checklist & Attachments
  documents: [tpaClaimDocumentSchema],

  // Query History & Responses
  queryHistory: {
    type: [claimQuerySchema],
    default: []
  },

  // Settlement & Reconciliation
  settlementRef: {
    type: String,
    default: '',
    trim: true
  },
  utrNumber: {
    type: String,
    default: '',
    trim: true
  },
  settlementDate: {
    type: Date
  },
  settlementRemarks: {
    type: String,
    default: '',
    trim: true
  },

  // Auditing
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Multi-tenant compound indexes
tpaClaimSchema.index({ hospitalId: 1, claimNumber: 1 }, { unique: true });
tpaClaimSchema.index({ hospitalId: 1, status: 1 });
tpaClaimSchema.index({ hospitalId: 1, patientId: 1 });
tpaClaimSchema.index({ hospitalId: 1, ipdAdmissionId: 1 });
tpaClaimSchema.index({ hospitalId: 1, preAuthorizationId: 1 });
tpaClaimSchema.index({ hospitalId: 1, billingId: 1 });

module.exports = mongoose.model('TpaClaim', tpaClaimSchema);
