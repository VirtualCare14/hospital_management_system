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
  symptoms: [{
    symptom: { type: String, required: true },
    durationDays: { type: Number }, // duration in days
    durationUnit: { type: String, default: 'Days' }, // Days, Weeks, Months
    pastHistory: { type: String }, // per-symptom past history
    remarks: { type: String } // per-symptom remarks
  }],
  generalPastHistory: {
    type: String // overall past history
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
    type: String // Format: YYYY-MM-DD
  }
  ,
  consultationStatus: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending"
  },
  consultationCompletedDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);

