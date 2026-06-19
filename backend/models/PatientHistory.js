const mongoose = require('mongoose');

const patientHistorySchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  uhid: {
    type: String,
    required: true
  },
  labId: {
    type: String,
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  testCategory: {
    type: String,
    default: ''
  },
  reportData: {
    parameters: [{
      name: String,
      value: String,
      referenceRange: String,
      unit: String
    }],
    // Diagnosis templates: dynamicFields stores filled values (including Cloudinary
    // image URLs + public IDs) captured through Diagnosis Template Designer.
    dynamicFields: mongoose.Schema.Types.Mixed,
    dynamicTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiagnosisTemplate' },
    remarks: String,
    notes: String,
    interpretation: String,
    signatory: {
      name: String,
      designation: String,
      qualification: String,
      signatureImageUrl: String
    }
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedByName: String,
  generatedDate: {
    type: Date,
    default: Date.now
  },
  generatedTime: String,
  pdfFileRef: String,
  reportStatus: {
    type: String,
    default: 'Completed'
  },
  reportCollectionStatus: {
    type: String,
    enum: ['Not Collected', 'Collected'],
    default: 'Not Collected'
  },
  reportCollectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportCollectedByName: String,
  reportCollectedAt: Date,
  reportCollectedTime: String
}, { timestamps: true });

module.exports = mongoose.model('PatientHistory', patientHistorySchema);
