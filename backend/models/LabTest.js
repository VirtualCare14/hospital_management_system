const mongoose = require('mongoose');

const labParameterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  referenceRange: { type: String, default: '' },
  unit: { type: String, default: '' },
  gender: { type: String, enum: ['Both', 'Male', 'Female'], default: 'Both' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  fieldType: { type: String, default: 'Number' },
  referenceRules: [{
    sex: { type: String, enum: ['Any', 'Male', 'Female'], default: 'Any' },
    minAge: { type: Number, default: 0 },
    minAgeUnit: { type: String, enum: ['Days', 'Months', 'Years'], default: 'Years' },
    maxAge: { type: Number, default: 100 },
    maxAgeUnit: { type: String, enum: ['Days', 'Months', 'Years'], default: 'Years' },
    lowerValue: { type: String, default: '' },
    upperValue: { type: String, default: '' },
    displayedValue: { type: String, default: '' }
  }],
  valueOptions: [{
    value: { type: String, required: true },
    isAbnormal: { type: Boolean, default: false }
  }]
}, { _id: true });

const labTestSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: false },
  category: { type: String, required: true, trim: true },
  categoryKey: { type: String, trim: true },
  test: { type: String, required: true, trim: true },
  testKey: { type: String, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  notes: { type: String, default: '' },
  interpretation: { type: String, default: '' },
  basePrice: { type: Number, default: 0 },
  taxPercentage: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  isManualTotal: { type: Boolean, default: false },
  revenueShare: { type: Number, default: 0 },
  forGender: { type: String, enum: ['Both', 'Female', 'Male'], default: 'Both' },
  signatoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabSignatory', required: false },
  parameters: [labParameterSchema],
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const normalize = (value) => String(value || '').trim().toLowerCase();

labTestSchema.pre('validate', function() {
  this.categoryKey = normalize(this.category);
  this.testKey = normalize(this.test || this.title);
  if (!this.test) this.test = this.title;
  if (!this.title) this.title = this.test;
});

labTestSchema.index(
  { hospitalId: 1, categoryKey: 1, testKey: 1 },
  { unique: true, partialFilterExpression: { categoryKey: { $exists: true }, testKey: { $exists: true } } }
);

module.exports = mongoose.model('LabTest', labTestSchema);
