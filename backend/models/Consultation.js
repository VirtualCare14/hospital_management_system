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
    required: function() {
      return !this.isVisitingDoctor;
    }
  },
  isVisitingDoctor: {
    type: Boolean,
    default: false
  },
  visitingScheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VisitingDoctorSchedule',
    default: null
  },
  visitingDoctorName: {
    type: String,
    default: ''
  },
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  conductedByName: {
    type: String,
    default: ''
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
  patientAdvice: {
    type: String,
    default: ''
  },
  vitals: {
    weight: { type: Number },
    height: { type: Number },
    temperature: { type: Number },
    bmi: { type: Number },
    drugAllergy: { type: String },
    bloodPressure: { type: String },
    cvs: { type: String },
    respiratoryRate: { type: Number },
    pulseRate: { type: Number },
    pulse: { type: Number },
    perAbdomen: { type: String },
    bilateralChest: { type: String },
    spo2: { type: Number }
  },
  tests: [{
    type: String
  }],
  followUpDate: {
    type: String
  },
  followUpRemarks: {
    type: String,
    default: ''
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

