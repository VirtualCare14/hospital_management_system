const mongoose = require('mongoose');

const ipdAdminSettingsSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  ipdPrefix: {
    type: String,
    default: 'IPD',
    trim: true
  },
  ipdStartNumber: {
    type: Number,
    default: 1,
    min: 1
  },
  ipdCurrentNumber: {
    type: Number,
    default: 1,
    min: 1
  },
  pidPrefix: {
    type: String,
    default: 'PID',
    trim: true
  },
  pidStartNumber: {
    type: Number,
    default: 1,
    min: 1
  },
  pidCurrentNumber: {
    type: Number,
    default: 1,
    min: 1
  },
  admissionStatuses: {
    type: [String],
    default: ['Admitted', 'Under Observation', 'Shifted', 'Discharged']
  },
  reservationTimeout: {
    type: Number,
    default: 15, // in minutes
    min: 1
  },
  consumableServices: [{
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    gst: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  }],
  medicines: [{
    name: { type: String, required: true, trim: true },
    totalBoxPrice: { type: Number, default: 0, min: 0 },
    totalUnits: { type: Number, default: 1, min: 1 },
    price: { type: Number, required: true, min: 0 },
    gst: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  }],
  sameDayTreatmentPrices: [{
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true }
  }]
}, { timestamps: true });

// Ensure only one setting document exists per hospital
ipdAdminSettingsSchema.index({ hospitalId: 1 }, { unique: true });

module.exports = mongoose.model('IpdAdminSettings', ipdAdminSettingsSchema);
