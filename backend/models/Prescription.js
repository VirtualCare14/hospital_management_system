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
  medicines: [{
    medicine: { type: String, required: true },
    duration: { type: String, required: true }, // e.g. "3 days"
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
    night: { type: Boolean, default: false },
    remarks: { type: String } // e.g. "After Food"
  }],
  language: {
    type: String,
    required: true,
    default: 'English'
  },
  pdfUrl: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);

