const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  roomType: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  totalBeds: {
    type: Number,
    required: true,
    min: [1, 'Total beds must be greater than 0']
  },
  bedConfigurations: [{
    bedType: {
      type: String,
      required: true,
      trim: true
    },
    numberOfBeds: {
      type: Number,
      required: true,
      min: [1, 'Number of beds must be greater than 0']
    },
    pricePerDay: {
      type: Number,
      required: true,
      min: [0, 'Price per day cannot be negative']
    },
    applySamePrice: {
      type: Boolean,
      default: true
    },
    individualPrices: [{
      type: Number,
      min: [0, 'Individual price cannot be negative']
    }],
    bedCodes: [{
      type: String,
      trim: true
    }]
  }]
}, { timestamps: true });

// Prevent duplicate room configurations of the same type within the same hospital
roomSchema.index({ hospitalId: 1, roomType: 1 }, { unique: true, name: 'hospital_room_type_unique' });

module.exports = mongoose.model('Room', roomSchema);
