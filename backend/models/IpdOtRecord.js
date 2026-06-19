const mongoose = require('mongoose');

const ipdOtRecordSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
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
  uhid: {
    type: String,
    default: ''
  },
  pidNumber: {
    type: String,
    default: ''
  },
  ipdNumber: {
    type: String,
    default: ''
  },
  // Patient Information
  patientName: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  age: {
    type: Number
  },
  gender: {
    type: String,
    default: ''
  },
  admissionDate: {
    type: Date
  },
  consultantDoctor: {
    type: String,
    default: ''
  },
  // Surgery Information
  dateOfSurgery: {
    type: Date
  },
  surgeon: {
    type: String,
    default: ''
  },
  assistantSurgeon: {
    type: String,
    default: ''
  },
  anesthesia: {
    type: String,
    default: ''
  },
  // Diagnosis
  preOperativeDiagnosis: {
    type: String,
    default: ''
  },
  postOperativeDiagnosis: {
    type: String,
    default: ''
  },
  // Procedure Information
  proceduresPerformed: {
    type: String,
    default: ''
  },
  indicationsForSurgery: {
    type: String,
    default: ''
  },
  findings: {
    type: String,
    default: ''
  },
  descriptionOfProcedure: {
    type: String,
    default: ''
  },
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Completed', 'Scheduled', 'In Progress', 'Completed Surgery'],
    default: 'Draft'
  },
  // OT Scheduling Information
  otScheduling: {
    otId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OperationTheatre'
    },
    otBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OtBooking'
    },
    scheduledStart: {
      type: Date
    },
    scheduledEnd: {
      type: Date
    },
    scheduledRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OperationTheatre'
    },
    actualStart: {
      type: Date
    },
    actualEnd: {
      type: Date
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scheduledAt: {
      type: Date
    }
  },
  schedulingStatus: {
    type: String,
    enum: ['Pending', 'Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  schedulingHistory: [{
    action: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    notes: String
  }],
  // Consent Form Tracking
  consent: {
    isConsentCompleted: { type: Boolean, default: false },
    consentFormPrintedAt: Date,
    consentFormSignedFileUrl: String,
    consentFormSignedCloudinaryId: String,
    consentSignedBy: String, // patient relative/attendant name
    consentSignedAt: Date,
    consentVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  // Consultation Form Tracking (OT-specific)
  consultation: {
    isConsultationCompleted: { type: Boolean, default: false },
    consultationNotes: String,
    signatureFileUrl: String,
    signatureCloudinaryId: String,
    signatureSignedBy: String, // patient relative/attendant name
    signatureSignedAt: Date,
    consultationCompletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  // OT Charges/Pricing
  otCharges: [{
    chargeName: { type: String, required: true },
    chargeAmount: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
  totalCharges: { type: Number, default: 0 },
  pharmacyRequestSent: {
    type: Boolean,
    default: false
  },
  pharmacyRequestAt: {
    type: Date
  },
  pharmacyRequestBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Pharmacy Integration (Future Ready)
  otMedicines: [{
    medicineName: { type: String, required: true },
    dosage: String,
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'nos' },
    isRequested: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isDispensed: { type: Boolean, default: false },
    requestedAt: Date,
    approvedAt: Date,
    dispensedAt: Date,
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],
  otConsumables: [{
    consumableName: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unit: { type: String, default: 'nos' },
    isRequested: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isIssued: { type: Boolean, default: false },
    isReturned: { type: Boolean, default: false },
    requestedAt: Date,
    approvedAt: Date,
    issuedAt: Date,
    returnedAt: Date,
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],
  // OT Documents (OT Paper uploads)
  otDocuments: [{
    documentType: {
      type: String,
      enum: ['ot_form', 'signed_ot_form', 'ot_checklist', 'ot_paper', 'consent_form', 'consultation_signature'],
      default: 'ot_form'
    },
    fileName: String,
    fileUrl: String,
    cloudinaryPublicId: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Index for efficient querying
ipdOtRecordSchema.index({ admissionId: 1, createdAt: -1 });
ipdOtRecordSchema.index({ patientId: 1, createdAt: -1 });
ipdOtRecordSchema.index({ hospitalId: 1 });

module.exports = mongoose.model('IpdOtRecord', ipdOtRecordSchema);