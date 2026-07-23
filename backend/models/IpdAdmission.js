const mongoose = require('mongoose');

const ipdAdmissionSchema = new mongoose.Schema({
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
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: false
  },
  bedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed',
    required: false
  },
  admissionDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipdNumber: {
    type: String,
    required: true
  },
  pidNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'Admitted'
  },
  dischargeDate: {
    type: Date
  },
  doctorInCharge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  provisionalDiagnosis: {
    type: String,
    default: ''
  },
  guardianName: {
    type: String,
    default: ''
  },
  guardianRelation: {
    type: String,
    default: ''
  },
  guardianMobile: {
    type: String,
    default: ''
  },
  isSameDayCare: {
    type: Boolean,
    default: false
  },
  bedHistory: [{
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    pricePerDay: { type: Number, default: 0 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('IpdAdmission', ipdAdmissionSchema);
