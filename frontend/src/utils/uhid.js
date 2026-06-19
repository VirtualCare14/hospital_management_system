export const formatUhid = (uhid) => {
  if (!uhid) return '';
  let s = String(uhid).trim();
  if (s.length === 0) return '';

  // Normalize to uppercase for prefix checks but preserve numeric part
  const upper = s.toUpperCase();

  // If it already starts with UHID, return normalized casing
  if (upper.startsWith('UHID')) {
    return 'UHID' + s.substring(4).trim();
  }

  // If it starts with PID, replace prefix with UHID
  if (upper.startsWith('PID')) {
    return 'UHID' + s.substring(3).trim();
  }

  // Otherwise, if it's purely numeric or alphanumeric without prefix, add UHID prefix
  return 'UHID' + s;
};

export const sanitizePatientName = (name) => {
  if (!name) return 'Patient';
  return String(name)
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '') // remove special chars
    .replace(/\s+/g, '_') // spaces to underscores
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Patient';
};
