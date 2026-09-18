const mongoose = require('mongoose');

const clinicSettingSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    unique: true
  },
  clinicLoginId: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  clinicPassword: {
    type: String,
    default: ''
  },
  clinicName: {
    type: String,
    trim: true,
    default: ''
  },
  portalUrl: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedByName: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('ClinicSetting', clinicSettingSchema);
