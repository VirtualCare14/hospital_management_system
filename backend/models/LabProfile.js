const mongoose = require('mongoose');

const labProfileSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: false },
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  mobile: { type: String, required: true, trim: true },
  alternateMobile: { type: String, default: '' },
  email: { type: String, required: true, trim: true },
  website: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  reportHeader: { type: String, default: '' },
  reportFooter: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('LabProfile', labProfileSchema);
