const mongoose = require('mongoose');

const labSignatorySchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: false },
  name: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  qualification: { type: String, default: '' },
  signatureImageUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('LabSignatory', labSignatorySchema);
