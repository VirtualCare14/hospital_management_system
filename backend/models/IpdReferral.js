const mongoose = require('mongoose');

const ipdReferralSchema = new mongoose.Schema({
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
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation'
  },
  referredByDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: { type: String, default: '' },
  uhid: { type: String, default: '' },
  mobile: { type: String, default: '' },
  gender: { type: String, default: '' },
  age: { type: Number },
  diagnosis: { type: String, default: '' },
  symptoms: [{ type: String }],
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Pending', 'Admitted', 'Cancelled'],
    default: 'Pending'
  },
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IpdAdmission',
    default: null
  },
  referredAt: {
    type: Date,
    default: Date.now
  },
  admittedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

ipdReferralSchema.index({ hospitalId: 1 });
ipdReferralSchema.index({ patientId: 1 });
ipdReferralSchema.index({ status: 1 });

module.exports = mongoose.model('IpdReferral', ipdReferralSchema);