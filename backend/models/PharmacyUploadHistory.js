const mongoose = require('mongoose');

const pharmacyUploadHistorySchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalRows: {
    type: Number,
    default: 0
  },
  successfulRows: {
    type: Number,
    default: 0
  },
  failedRows: {
    type: Number,
    default: 0
  },
  purchaseInvoiceCreated: {
    type: String
  },
  status: {
    type: String,
    enum: ['Completed', 'Partial', 'Failed'],
    default: 'Completed'
  },
  importLog: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('PharmacyUploadHistory', pharmacyUploadHistorySchema);
