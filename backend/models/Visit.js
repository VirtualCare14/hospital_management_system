const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
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
  uhid: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  visitType: {
    type: String,
    enum: ['OPD', 'IPD', 'Same Day Treatment'],
    default: 'OPD',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  slot: {
    type: String,
    required: true
  },
  appointmentNumber: {
    type: Number
  },
  appointmentDateSeq: {
    type: String // YYYY-MM-DD format to track which day's sequence
  },
  appointmentDept: {
    type: String
  },
  appointmentDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  consultationStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  consultationCompletedDate: {
    type: Date
  },
  demographics: {
    weight: { type: Number },
    height: { type: Number },
    bloodPressure: { type: String },
    temperature: { type: Number }
  },
  visitNumber: {
    type: Number // Sequential visit number for this patient (1st visit, 2nd visit, etc.)
  },
  // Same Day Treatment link
  sameDayTreatmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SameDayTreatment',
    default: null
  }
}, { timestamps: true });

// Indexes
visitSchema.index(
  { hospitalId: 1, registrationNumber: 1 },
  { unique: true, partialFilterExpression: { registrationNumber: { $type: "string" } } }
);
visitSchema.index({ hospitalId: 1, appointmentDateSeq: 1, appointmentDept: 1, appointmentDoctorId: 1, appointmentNumber: 1 });
visitSchema.index({ hospitalId: 1, patientId: 1 });
visitSchema.index({ hospitalId: 1, uhid: 1 });

module.exports = mongoose.model('Visit', visitSchema);