const mongoose = require('mongoose');

/**
 * Diagnosis Report Template
 * - Used only for LabTest in the system "Diagnosis" category (e.g., X-Ray, MRI, etc.)
 * - Stores a flexible JSON structure that can be rendered dynamically during
 *   the existing Create/Edit Report workflow.
 */
const diagnosisTemplateSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: false },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTest', required: true },
    templateName: { type: String, required: true, trim: true },
    templateStructure: { type: [mongoose.Schema.Types.Mixed], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

diagnosisTemplateSchema.index({ hospitalId: 1, testId: 1, isActive: 1 });
diagnosisTemplateSchema.index(
  { hospitalId: 1, testId: 1 },
  { unique: true, partialFilterExpression: { testId: { $exists: true } } }
);

module.exports = mongoose.model('DiagnosisTemplate', diagnosisTemplateSchema);

