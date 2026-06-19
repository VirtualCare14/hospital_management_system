const mongoose = require('mongoose');

const operationTheatreSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  otCode: {
    type: String,
    required: true,
    trim: true
  },
  otName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  availabilityStatus: {
    type: String,
    enum: ['Available', 'Occupied', 'Maintenance'],
    default: 'Available'
  }
}, { timestamps: true });

operationTheatreSchema.index({ hospitalId: 1, otCode: 1 }, { unique: true });

module.exports = mongoose.model('OperationTheatre', operationTheatreSchema);