const mongoose = require('mongoose');

const normalize = (value) => String(value || '').trim().toLowerCase();

const labTestCategorySchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: false },
  name: { type: String, required: true, trim: true },
  nameKey: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  isSystem: { type: Boolean, default: false },
  systemKey: { type: String, trim: true, default: '' }
}, { timestamps: true });

labTestCategorySchema.pre('validate', function(next) {
  this.nameKey = normalize(this.name);
  if (this.isSystem && !this.systemKey) {
    this.systemKey = this.nameKey;
  }
  next();
});

// A system category is unique by systemKey + hospitalId (so each hospital gets its own instance,
// but only one "Diagnosis" category per hospital). Custom categories remain unique by nameKey.
labTestCategorySchema.index(
  { hospitalId: 1, systemKey: 1 },
  {
    unique: true,
    partialFilterExpression: { isSystem: true, systemKey: { $exists: true, $ne: '' } }
  }
);
labTestCategorySchema.index({ hospitalId: 1, nameKey: 1 }, { unique: true });

module.exports = mongoose.model('LabTestCategory', labTestCategorySchema);
