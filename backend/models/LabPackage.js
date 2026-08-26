const mongoose = require('mongoose');

const labPackageSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    default: 'LAB',
    trim: true
  },
  price: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  tests: [{
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabTest',
      required: false
    },
    testName: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      default: 'PATHOLOGY'
    },
    price: {
      type: Number,
      default: 0
    }
  }],
  forGender: {
    type: String,
    enum: ['Both', 'Female', 'Male'],
    default: 'Both'
  },
  sampleType: {
    type: String,
    default: 'Blood / Serum / Urine'
  },
  turnaroundTime: {
    type: String,
    default: 'Same Day'
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('LabPackage', labPackageSchema);
