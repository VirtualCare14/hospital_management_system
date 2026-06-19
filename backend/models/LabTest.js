const mongoose = require('mongoose');

const labParameterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  referenceRange: { type: String, default: '' },
  unit: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
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
  basePrice: { type: Number, default: 0 },
  taxPercentage: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  isManualTotal: { type: Boolean, default: false },
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
