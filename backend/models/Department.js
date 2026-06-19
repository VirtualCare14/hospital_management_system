const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  },
  departmentName: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

departmentSchema.index({ hospitalId: 1, departmentName: 1 }, { unique: true, name: 'hospital_department_name_unique' });

module.exports = mongoose.model('Department', departmentSchema);

