const mongoose = require('mongoose');

const PharmacyAuditLogSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    required: true
  },
  referenceId: {
    type: String
  },
  oldValue: {
    type: String
  },
  newValue: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PharmacyAuditLog', PharmacyAuditLogSchema);
