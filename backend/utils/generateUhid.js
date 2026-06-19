const Patient = require('../models/Patient');

/**
 * Generate UHID using the last 6 digits of the Aadhaar number.
 * Format: UHID + last 6 digits of Aadhaar (e.g., UHID123456)
 * If a collision occurs (same Aadhaar already registered), the existing UHID is reused.
 */
const generateUhid = async (aadhaar) => {
  if (!aadhaar || aadhaar.length < 6) {
    // Fallback: random 6 digits if Aadhaar is not provided
    const randomSuffix = String(Math.floor(100000 + Math.random() * 900000));
    return `UHID${randomSuffix}`;
  }

  // Extract last 6 digits of Aadhaar
  const lastSix = aadhaar.replace(/\D/g, '').slice(-6);
  const uhid = `UHID${lastSix}`;

  return uhid;
};

module.exports = generateUhid;
