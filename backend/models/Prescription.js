const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: false
  },
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: false
  },
  medicines: [{
    medicine: { type: String, required: true },
    dosageForm: { type: String, default: 'Tablet' },
    strength: { type: String, default: '' },
    dose: { type: String, default: '' },
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
    night: { type: Boolean, default: false },
    duration: { type: String, default: '' },
    remarks: { type: String },
    qty: { type: Number, default: 0 }
  }],
  diagnosisRemark: {
    type: String
  },
  language: {
    type: String,
    required: true,
    default: 'English'
  },
  pdfUrl: {
    type: String
  },
  prescriptionDateTime: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);

