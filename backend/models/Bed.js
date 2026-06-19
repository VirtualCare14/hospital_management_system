const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  bedNumber: {
    type: String,
    required: true,
    trim: true
  },
  bedType: {
    type: String,
    required: true,
    trim: true
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: [0, 'Price per day cannot be negative']
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'],
    default: 'Available'
  },
  reservedAt: {
    type: Date,
    default: null
  },
  reservedFor: {
    type: String,
    default: null,
    trim: true
  },
  maintenanceNotes: {
    type: String,
    default: '',
    trim: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IpdAdmission',
    default: null
  }
}, { timestamps: true });

// Ensure bed numbers are globally unique per hospital (e.g. DEL-S-001)
bedSchema.index({ hospitalId: 1, bedNumber: 1 }, { unique: true, name: 'hospital_bed_number_unique' });

module.exports = mongoose.model('Bed', bedSchema);
