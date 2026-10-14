const mongoose = require('mongoose');

const enhancementSchema = new mongoose.Schema({
  requestedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  approvedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['Requested', 'Approved', 'Rejected'],
    default: 'Requested',
    trim: true
  }
}, { timestamps: true });

const querySchema = new mongoose.Schema({
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
}, { timestamps: true });

const preAuthorizationSchema = new mongoose.Schema({
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
    default: null
  },
  claimNumber: {
    type: String,
    default: '',
    trim: true
  },
  preauthStatus: {
    type: String,
    enum: [
      'Draft',
      'Submitted',
      'Queried',
      'Approved',
      'Enhancement Requested',
      'Rejected',
      'Final Authorized',
      'Settled',
      'Cancelled'
    ],
    default: 'Draft',
    trim: true,
    index: true
  },
  
  // Clinical / Treatment details
  diagnosis: {
    type: String,
    default: '',
    trim: true
  },
  treatmentPlan: {
    type: String,
    default: '',
    trim: true
  },
  estimatedStayDays: {
    type: Number,
    default: 0,
    min: 0
  },
  doctorInCharge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Monetary values
  initialRequestedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  initialApprovedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalApprovedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAuthorizedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  copayPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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
  nonPayableAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  patientPayableAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  tpaReceivableAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Lifecycle logs and histories
  enhancementHistory: [enhancementSchema],
  queryHistory: [querySchema],

  // Document URLs
  preauthFormUrl: {
    type: String,
    default: '',
    trim: true
  },
  tpaApprovalLetterUrl: {
    type: String,
    default: '',
    trim: true
  },
  finalAuthLetterUrl: {
    type: String,
    default: '',
    trim: true
  },
  denialLetterUrl: {
    type: String,
    default: '',
    trim: true
  },

  // Settlement information
  settledAmount: {
    type: Number,
    default: 0,
    min: 0
  },
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
  tdsDeducted: {
    type: Number,
    default: 0,
    min: 0
  },
  settledAt: {
    type: Date
  },

  // Cancellation and rejection
  rejectionReason: {
    type: String,
    default: '',
    trim: true
  },
  cancellationReason: {
    type: String,
    default: '',
    trim: true
  },
  cancelledAt: {
    type: Date
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

// Compound multi-tenant indexes
preAuthorizationSchema.index({ hospitalId: 1, ipdAdmissionId: 1 });
preAuthorizationSchema.index({ hospitalId: 1, patientId: 1 });
preAuthorizationSchema.index({ hospitalId: 1, preauthStatus: 1 });
preAuthorizationSchema.index({ hospitalId: 1, claimNumber: 1 });

module.exports = mongoose.model('PreAuthorization', preAuthorizationSchema);
