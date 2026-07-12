const mongoose = require('mongoose');

const ipdMedicationOrderSchema = new mongoose.Schema({
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
  medicineName: {
    type: String,
    required: true,
    trim: true
  },
  dose: {
    type: String,
    required: true,
    trim: true
  },
  route: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    trim: true
  },
  morning: {
    type: Boolean,
    default: false
  },
  afternoon: {
    type: Boolean,
    default: false
  },
  evening: {
    type: Boolean,
    default: false
  },
  night: {
    type: Boolean,
    default: false
  },
  doctorRemark: {
    type: String,
    default: '',
    trim: true
  },
  scheduleType: {
    type: String,
    enum: ['Fixed Shift', 'Every X Hours', 'Custom Time', 'One-Time'],
    default: 'Fixed Shift'
  },
  hourlyInterval: {
    type: Number,
    default: 4
  },
  startDate: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  },
  customTimes: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['Active', 'Stopped', 'Completed'],
    default: 'Active'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  stoppedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  stoppedByName: {
    type: String
  },
  stoppedDate: {
    type: String
  },
  stoppedTime: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('IpdMedicationOrder', ipdMedicationOrderSchema);
