/**
 * Utility functions for Patient Name normalization and matching across modules (OPD, IPD, Lab Billing, etc.)
 */

const normalizePatientName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/^(mr|mrs|ms|dr|master|miss|baby|b\/o|s\/o|d\/o|w\/o)\.?\s+/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

const isSamePatientName = (nameA, nameB) => {
  const normA = normalizePatientName(nameA);
  const normB = normalizePatientName(nameB);
  if (!normA || !normB) return false;
  return normA === normB;
};

module.exports = {
  normalizePatientName,
  isSamePatientName
};
