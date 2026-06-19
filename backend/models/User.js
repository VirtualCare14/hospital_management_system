const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const timeSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: { type: String }, // e.g., "09:00"
  endTime: { type: String },   // e.g., "17:00"
  isAvailable: { type: Boolean, default: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false // some admin might not have it if superadmin creates first, but generally required for hospital users
  },
  username: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'reception', 'doctor', 'lab', 'ipd', 'nursing', 'pharmacy', 'billing']
  },
  moduleAccess: [{
    type: Number
  }],
  doctorName: {
    type: String
  },
  department: {
    type: String
  },
  specialization: {
    type: String,
    default: '',
    trim: true
  },
  opdFees: {
    type: Number,
    default: 0,
    min: 0
  },
  mobile: {
    type: String
  },
  availableSlots: {
    type: [timeSlotSchema],
    default: []
  },
  currentSessionId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

userSchema.index({ hospitalId: 1, username: 1 }, { unique: true, name: 'hospital_user_username_unique' });

// Normalize role and hash password before saving if modified or new
userSchema.pre('save', async function() {
  if (this.isModified('role') && typeof this.role === 'string') {
    this.role = this.role.toLowerCase().trim();
  }

  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare input password against database hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

