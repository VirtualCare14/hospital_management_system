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
  insertedCount: {
    type: Number,
    default: 0
  },
  updatedCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('PharmacyUploadHistory', pharmacyUploadHistorySchema);
