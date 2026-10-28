const mongoose = require('mongoose');

const visitingDoctorScheduleSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  doctorName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  speciality: {
    type: String,
    trim: true,
    default: ''
  },
  visitDates: [{
    type: String, // Format: YYYY-MM-DD
    required: true
  }],
  startTime: {
    type: String, // Format: HH:mm (e.g., "10:00")
    required: true
  },
  endTime: {
    type: String, // Format: HH:mm (e.g., "14:00")
    required: true
  },
  slotDuration: {
    type: Number, // In minutes (e.g., 15)
    default: 15,
    min: 5,
    max: 120
  },
  consultationFee: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

visitingDoctorScheduleSchema.index({ hospitalId: 1, status: 1 });
visitingDoctorScheduleSchema.index({ hospitalId: 1, visitDates: 1 });
visitingDoctorScheduleSchema.index({ hospitalId: 1, department: 1 });

module.exports = mongoose.model('VisitingDoctorSchedule', visitingDoctorScheduleSchema);
