const mongoose = require('mongoose');

const labAssistantProfileSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  workRole: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

labAssistantProfileSchema.index({ hospitalId: 1, employeeId: 1 }, { unique: true });
labAssistantProfileSchema.index({ hospitalId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('LabAssistantProfile', labAssistantProfileSchema);
