const mongoose = require('mongoose');

const ipdMedicationAdministrationSchema = new mongoose.Schema({
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
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IpdMedicationOrder',
    required: true
  },
  medicineName: {
    type: String,
    required: true,
    trim: true
  },
  nurseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nurseName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Given', 'Not Given', 'Delayed', 'Skipped', 'Patient Refused', 'Hold', 'Completed'],
    default: 'Given',
    required: true
  },
  shift: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Night'],
    required: true
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('IpdMedicationAdministration', ipdMedicationAdministrationSchema);
