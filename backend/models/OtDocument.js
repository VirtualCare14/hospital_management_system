const mongoose = require('mongoose');

const otDocumentSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IpdAdmission',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  otRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IpdOtRecord',
    required: true
  },
  documentType: {
    type: String,
    enum: ['ot_form', 'signed_ot_form'],
    required: true
  },
  fileName: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

otDocumentSchema.index({ admissionId: 1 });
otDocumentSchema.index({ otRecordId: 1 });

module.exports = mongoose.model('OtDocument', otDocumentSchema);