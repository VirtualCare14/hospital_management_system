const mongoose = require('mongoose');

const labRequestSchema = new mongoose.Schema({
  labId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
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
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tests: [{
    type: String,
    required: true
  }],
  bookingDate: {
    type: Date,
    default: Date.now
  },
  collectionTime: {
    type: String,
    default: ''
  },
  collectionType: {
    type: String,
    enum: ['Lab Visit', 'Home Sample Collection'],
    default: 'Lab Visit'
  },
  assignedAssistantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  sampleStatus: {
    type: String,
    enum: [
      'Not Collected',
      'Home Sample Assigned',
      'On The Way To Patient',
      'Sample Collected',
      'On The Way To Lab',
      'Sample Submitted',
      'Closed'
    ],
    default: 'Not Collected'
  },
  reportStatus: {
    type: String,
    enum: ['Pending', 'In Progress', 'Ready', 'Completed', 'Delivered', 'Closed'],
    default: 'Pending'
  },
  remarks: {
    type: String,
    default: ''
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  cancellationRemarks: {
    type: String,
    default: ''
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collectionDate: {
    type: Date
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collectedByName: {
    type: String,
    default: ''
  },
  expectedCollectionDate: {
    type: Date
  },
  status: {
    type: String,
    enum: [
      'pending',
      'assigned',
      'on_the_way_to_patient',
      'sample_collected',
      'on_the_way_to_lab',
      'sample_submitted',
      'testing_in_progress',
      'report_ready',
      'delivered',
      'completed'
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
    assistantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assistantName: { type: String },
    notes: { type: String }
  }],
  billing: {
    baseAmount: { type: Number, default: 0 },
    taxPercentage: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    isManualTotal: { type: Boolean, default: false }
  },
  report: {
    notes: { type: String },
    remarks: { type: String },
    interpretation: { type: String },
    parameters: [{
      name: String,
      value: String,
      referenceRange: String,
      unit: String
    }],
    // Diagnosis templates: dynamicFields is a flexible JSON payload that stores
    // values entered against the Diagnosis Template Designer structure.
    // Kept optional so existing non-diagnosis workflows remain unchanged.
    dynamicFields: mongoose.Schema.Types.Mixed,
    dynamicTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiagnosisTemplate' },
    signatoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabSignatory' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: Date,
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    generatedAt: Date,
    deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: Date,
    isLocked: { type: Boolean, default: false },
    completionDate: Date,
    completionTime: String,
    deliveryDate: Date,
    pdfFileRef: String,
    collectionStatus: {
      type: String,
      enum: ['Not Collected', 'Collected'],
      default: 'Not Collected'
    },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    collectedAt: Date,
    collectedDate: Date,
    collectedTime: String
  }
}, { timestamps: true });

const generateLabId = () => `LAB${Math.floor(10000 + Math.random() * 9990000)}`;

labRequestSchema.pre('validate', async function() {
  if (this.labId) return;

  let labId = generateLabId();
  while (await mongoose.models.LabRequest.exists({ labId })) {
    labId = generateLabId();
  }
  this.labId = labId;
});

module.exports = mongoose.model('LabRequest', labRequestSchema);

