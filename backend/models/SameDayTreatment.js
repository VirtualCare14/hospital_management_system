const mongoose = require('mongoose');

const sameDayTreatmentSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientName: { type: String, default: '' },
  uhid: { type: String, default: '' },
  mobile: { type: String, default: '' },
  gender: { type: String, default: '' },
  age: { type: Number },
  treatmentType: {
    type: String,
    enum: ['Fracture', 'Minor Injury', 'Minor Stitches', 'Small Burns', 'Mild Allergic Reactions', 'Dialysis'],
    required: true
  },
  // Treatment details - generic fields used by all treatment types
  treatmentDate: { type: Date, default: Date.now },
  diagnosis: { type: String, default: '' },
  treatmentNotes: { type: String, default: '' },
  prescription: { type: String, default: '' },
  followUpRequired: { type: String, enum: ['Yes', 'No'], default: '' },
  followUpDate: { type: Date },
  // Pricing (hidden from nursing staff)
  price: { type: Number, default: 0 },
  isFixedPrice: { type: Boolean, default: true },
  // Status
  status: { type: String, enum: ['Completed', 'Draft'], default: 'Draft' },
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

sameDayTreatmentSchema.index({ patientId: 1 });
sameDayTreatmentSchema.index({ hospitalId: 1 });
sameDayTreatmentSchema.index({ treatmentType: 1 });

module.exports = mongoose.model('SameDayTreatment', sameDayTreatmentSchema);