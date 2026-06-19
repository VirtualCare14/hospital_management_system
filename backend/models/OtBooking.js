const mongoose = require('mongoose');

const otBookingSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  otId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OperationTheatre',
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
    ref: 'IpdOtRecord'
  },
  surgeryDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // HH:MM format
    required: true
  },
  endTime: {
    type: String, // HH:MM format
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  // Document tracking
  otDocuments: [{
    documentType: {
      type: String,
      enum: ['ot_form', 'signed_ot_form', 'ot_checklist', 'ot_paper'],
      default: 'ot_paper'
    },
    fileName: String,
    fileUrl: String,
    cloudinaryPublicId: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

otBookingSchema.index({ otId: 1, surgeryDate: 1 });
otBookingSchema.index({ hospitalId: 1 });
otBookingSchema.index({ admissionId: 1 });

module.exports = mongoose.model('OtBooking', otBookingSchema);