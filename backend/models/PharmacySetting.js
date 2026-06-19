const mongoose = require('mongoose');

const pharmacySettingSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    unique: true
  },
  gstEnabled: {
    type: Boolean,
    default: true
  },
  emailAddress: {
    type: String,
    default: '',
    trim: true
  },
  gstNumber: {
    type: String,
    default: '',
    trim: true
  },
  termsAndConditions: {
    type: String,
    default: '1. Medicines once sold cannot be returned after 3 days.\n2. Please check the expiry date of medicines before leaving the counter.\n3. Keep medicines out of reach of children.'
  },
  thankYouMessage: {
    type: String,
    default: 'Thank you for visiting! Wishing you a speedy recovery.'
  }
}, { timestamps: true });

module.exports = mongoose.model('PharmacySetting', pharmacySettingSchema);
