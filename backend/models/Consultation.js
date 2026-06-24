const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
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
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: false
  },
  symptoms: [{
    symptom: { type: String, required: true },
    durationDays: { type: Number },
    durationUnit: { type: String, default: 'Days' },
    pastHistory: { type: String },
    remarks: { type: String }
  }],
  generalPastHistory: {
    type: String
  },
  diagnosisRemark: {
    type: String
  },
  vitals: {
    weight: { type: Number },
    height: { type: Number },
    temperature: { type: Number },
    bmi: { type: Number },
    drugAllergy: { type: String }
  },
  tests: [{
    type: String
  }],
  followUpDate: {
    type: String
  },
  consultationStatus: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending"
  },
  consultationCompletedDate: {
    type: Date,
    default: null
  },
  consultationDateTime: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);

