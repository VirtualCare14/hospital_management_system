const mongoose = require('mongoose');

const ipdLabTestSchema = new mongoose.Schema({
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
  labRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabRequest'
  },
  testName: {
    type: String,
    required: true,
    trim: true
  },
  testCategory: {
    type: String,
    default: ''
  },
  testPrice: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Ready', 'Completed', 'Approved'],
    default: 'Pending'
  },
  reportDate: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('IpdLabTest', ipdLabTestSchema);