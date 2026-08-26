const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  },
  uhid: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: false,
    default: 'Not specified',
    trim: true
  },
  dob: {
    type: Date,
    required: false,
    default: () => new Date('1990-01-01')
  },
  gender: {
    type: String,
    required: false,
    default: 'Male'
  },
  aadhaar: {
    type: String,
    required: false,
    trim: true
  },
  category: {
    type: String,
    enum: ['General', 'Staff', 'EWS', 'Corporate', 'Insurance'],
    default: 'General',
    trim: true
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { timestamps: true });

// Index for efficient Aadhaar lookups
patientSchema.index({ hospitalId: 1, aadhaar: 1 });
patientSchema.index({ hospitalId: 1, uhid: 1 }, { unique: true });

module.exports = mongoose.model('Patient', patientSchema);