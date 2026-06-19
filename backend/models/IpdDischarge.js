const mongoose = require('mongoose');

const ipdDischargeSchema = new mongoose.Schema({
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
  // Admission Information
  admissionDate: {
    type: Date
  },
  reason: {
    type: String,
    default: ''
  },
  // Diagnosis Information
  diagnosisAtInternment: {
    type: String,
    default: ''
  },
  // Treatment Information
  treatmentSummary: {
    type: String,
    default: ''
  },
  // Discharge Information
  dischargeDate: {
    type: Date,
    default: Date.now
  },
  dischargeTime: {
    type: String,
    default: ''
  },
  // Physician Approval
  physicianApproval: {
    type: String,
    enum: ['Yes', 'No'],
    default: ''
  },
  // Reason for Discharge
  dischargeReason: {
    type: String,
    enum: ['Patient Deceased', 'Patient Treated', 'Patient Transferred', 'Patient Left Against Advice', 'Other'],
    default: ''
  },
  otherDischargeReason: {
    type: String,
    default: ''
  },
  // Future Treatment
  futureTreatmentRequired: {
    type: String,
    enum: ['Yes', 'No'],
    default: ''
  },
  // Medication Prescribed
  medicationPrescribed: {
    type: String,
    enum: ['Yes', 'No'],
    default: ''
  },
  // Discharging Physician
  dischargingPhysicianTitle: {
    type: String,
    default: ''
  },
  dischargingPhysicianFirstName: {
    type: String,
    default: ''
  },
  dischargingPhysicianMiddleName: {
    type: String,
    default: ''
  },
  dischargingPhysicianLastName: {
    type: String,
    default: ''
  },
  dischargingPhysicianInitials: {
    type: String,
    default: ''
  },
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Completed'],
    default: 'Draft'
  },
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
ipdDischargeSchema.index({ admissionId: 1, createdAt: -1 });
ipdDischargeSchema.index({ patientId: 1, createdAt: -1 });
ipdDischargeSchema.index({ hospitalId: 1 });

module.exports = mongoose.model('IpdDischarge', ipdDischargeSchema);