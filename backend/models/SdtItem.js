const mongoose = require('mongoose');

const sdtItemSchema = new mongoose.Schema({
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
  treatmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SameDayTreatment'
  },
  itemType: {
    type: String,
    enum: ['Consumable', 'Lab Test', 'Medicine'],
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  totalAmount: { type: Number, required: true, min: 0 },
  date: { type: String, default: '' },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

sdtItemSchema.index({ patientId: 1 });
sdtItemSchema.index({ treatmentId: 1 });

module.exports = mongoose.model('SdtItem', sdtItemSchema);