const mongoose = require('mongoose');

const otConsultationTemplateSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  templateName: {
    type: String,
    required: true,
    trim: true
  },
  templateHeading: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String, // Rich Text Content (HTML) with placeholders like {Patient Name}
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Index for efficient querying by hospital
otConsultationTemplateSchema.index({ hospitalId: 1, templateName: 1 });

module.exports = mongoose.model('OtConsultationTemplate', otConsultationTemplateSchema);
