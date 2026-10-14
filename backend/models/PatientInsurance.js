const mongoose = require('mongoose');

const patientInsuranceSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  insuranceCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InsuranceCompany',
    required: true
  },
  tpaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TpaMaster',
    default: null
  },
  policyNumber: {
    type: String,
    required: true,
    trim: true
  },
  memberId: {
    type: String,
    required: true,
    trim: true
  },
  policyType: {
    type: String,
    enum: ['Individual', 'Family Floater', 'Corporate / Group', 'Government Scheme'],
    default: 'Individual',
    trim: true
  },
  primaryInsuredName: {
    type: String,
    default: '',
    trim: true
  },
  relationshipToPatient: {
    type: String,
    enum: ['Self', 'Spouse', 'Child', 'Parent', 'Other'],
    default: 'Self',
    trim: true
  },
  corporateName: {
    type: String,
    default: '',
    trim: true
  },
  employeeId: {
    type: String,
    default: '',
    trim: true
  },
  sumInsured: {
    type: Number,
    default: 0,
    min: 0
  },
  availableBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  validFrom: {
    type: Date
  },
  validTill: {
    type: Date
  },
  cardImageUrl: {
    type: String,
    default: '',
    trim: true
  },
  cardImagePublicId: {
    type: String,
    default: '',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
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

// Compound multi-tenant indexes
patientInsuranceSchema.index({ hospitalId: 1, patientId: 1 });
patientInsuranceSchema.index({ hospitalId: 1, policyNumber: 1, memberId: 1 });
patientInsuranceSchema.index({ hospitalId: 1, isActive: 1 });

module.exports = mongoose.model('PatientInsurance', patientInsuranceSchema);
