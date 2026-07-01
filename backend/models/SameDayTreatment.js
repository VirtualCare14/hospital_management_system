const mongoose = require('mongoose');

const sameDayTreatmentSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientName: { type: String, default: '' },
  uhid: { type: String, default: '' },
  mobile: { type: String, default: '' },
  gender: { type: String, default: '' },
  age: { type: Number },
  treatmentType: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['Registration', 'Doctor Referral'],
    default: 'Registration'
  },
  referredByDoctorName: { type: String, default: '' },
  // Clinical details
  chiefComplaint: { type: String, default: '' },
  presentIllness: { type: String, default: '' },
  clinicalFindings: { type: String, default: '' },
  medicalHistory: { type: String, default: '' },
  surgicalHistory: { type: String, default: '' },
  drugAllergies: { type: String, default: '' },
  vitals: {
    bloodPressure: { type: String, default: '' },
    pulse: { type: Number },
    temperature: { type: Number },
    height: { type: Number },
    weight: { type: Number },
    bmi: { type: Number }
  },
  selectedInvestigations: [{ type: String }],
  attachments: [{
    name: { type: String },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Treatment details
  treatmentDate: { type: Date, default: Date.now },
  diagnosis: { type: String, default: '' },
  treatmentNotes: { type: String, default: '' },
  treatmentPlan: { type: String, default: '' },
  procedure: { type: String, default: '' },
  productsMedicinesUsed: { type: String, default: '' },
  procedureNotes: { type: String, default: '' },
  anaesthesiaUsed: { type: String, enum: ['Yes', 'No', ''], default: '' },
  anaesthesiaType: { type: String, default: '' },
  complications: { type: String, default: '' },
  prescription: { type: String, default: '' },
  prescriptionMedicines: [{
    medicineName: { type: String, required: true },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    duration: { type: String, default: '' },
    route: { type: String, default: '' },
    instructions: { type: String, default: '' },
    itemType: { type: String, enum: ['Medicine', 'Consumable'], default: 'Medicine' }
  }],
  // Follow Up
  followUpRequired: { type: String, enum: ['Yes', 'No', ''], default: '' },
  followUpDate: { type: Date },
  reviewNotes: { type: String, default: '' },
  nextProcedurePlanned: { type: String, default: '' },
  // Pricing (hidden from nursing staff)
  price: { type: Number, default: 0 },
  isFixedPrice: { type: Boolean, default: true },
  // Status
  status: { type: String, enum: ['Completed', 'Draft'], default: 'Draft' },
  // Dialysis specific fields
  physicianName: { type: String, default: '' },
  physicianContact: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  ipNumber: { type: String, default: '' },
  dayCareVisitNumber: { type: String, default: '' },
  dialysisSessions: [{
    date: { type: Date, default: Date.now },
    time: { type: String, default: '' },
    startingWeight: { type: Number },
    startingBP: { type: String },
    endingWeight: { type: Number },
    endingBP: { type: String },
    fluidRemoved: { type: Number },
    comments: { type: String, default: '' }
  }],
  // Audit Trail
  auditTrail: [{
    action: { type: String, required: true },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: { type: String, default: '' },
    performedByRole: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    remarks: { type: String, default: '' },
    changedFields: [{
      fieldName: { type: String },
      oldValue: { type: String },
      newValue: { type: String }
    }],
    ipAddress: { type: String, default: '' }
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

sameDayTreatmentSchema.index({ patientId: 1 });
sameDayTreatmentSchema.index({ hospitalId: 1 });
sameDayTreatmentSchema.index({ treatmentType: 1 });

module.exports = mongoose.model('SameDayTreatment', sameDayTreatmentSchema);