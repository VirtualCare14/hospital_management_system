export const formatUhid = (uhid) => {
  if (!uhid) return '';
  let s = String(uhid).trim();
  if (s.length === 0) return '';

  const upper = s.toUpperCase();
  if (upper.startsWith('UHID')) {
    return 'UHID' + s.substring(4).trim();
  }
  if (upper.startsWith('PID')) {
    return 'UHID' + s.substring(3).trim();
  }
  return 'UHID' + s;
};

export const sanitizePatientName = (name) => {
  if (!name) return 'Patient';
  return String(name)
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Patient';
};
