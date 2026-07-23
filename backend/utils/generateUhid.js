const Patient = require('../models/Patient');

/**
 * Generate UHID using the last 6 digits of the Aadhaar number if provided.
 * Format: UHID + last 6 digits of Aadhaar (e.g., UHID123456)
 * If Aadhaar is not provided or collision occurs, generate unique random 6 digits.
 */
const generateUhid = async (aadhaar) => {
  if (aadhaar && typeof aadhaar === 'string' && aadhaar.trim().length >= 6) {
    const lastSix = aadhaar.replace(/\D/g, '').slice(-6);
    if (lastSix.length === 6) {
      const candidate = `UHID${lastSix}`;
      const existing = await Patient.findOne({ uhid: candidate });
      if (!existing) return candidate;
    }
  }

  // Fallback / random 6 digits if Aadhaar is missing or candidate UHID is taken
  while (true) {
    const randomSuffix = String(Math.floor(100000 + Math.random() * 900000));
    const candidate = `UHID${randomSuffix}`;
    const existing = await Patient.findOne({ uhid: candidate });
    if (!existing) return candidate;
  }
};

module.exports = generateUhid;
