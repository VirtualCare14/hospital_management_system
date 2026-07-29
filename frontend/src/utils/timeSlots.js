/**
 * Utility functions for generating and filtering time slots
 */

/**
 * Convert time string ("HH:MM" 24h or "HH:MM AM/PM") to minutes from midnight
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const [time, modifier] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Format minutes from midnight into 12-hour AM/PM string (e.g. 550 => "09:10 AM", 1080 => "06:00 PM")
 */
export const formatMinutesTo12h = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM
  const strHours = hours < 10 ? `0${hours}` : `${hours}`;
  const strMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${strHours}:${strMinutes} ${ampm}`;
};

/**
 * Generate sequence of time slots between startTime and endTime with specified gap
 * @param {string} startTime - "09:00" or "00:00"
 * @param {string} endTime - "18:00" or "23:59"
 * @param {number} gapMinutes - Interval gap in minutes (e.g. 10)
 * @returns {string[]} Array of formatted time slots e.g. ["09:00 AM", "09:10 AM", ...]
 */
export const generateTimeSlots = (startTime = '09:00', endTime = '17:00', gapMinutes = 10) => {
  const gap = Math.max(1, Number(gapMinutes) || 10);
  const startMin = parseTimeToMinutes(startTime);
  let endMin = parseTimeToMinutes(endTime);

  // If 23:59 or 24:00, cap at 1439 minutes
  if (endTime === '23:59' || endTime === '24:00' || endMin >= 1439) {
    endMin = 1439;
  }

  if (startMin >= endMin) return [];

  const slots = [];
  let current = startMin;

  while (current <= endMin) {
    slots.push(formatMinutesTo12h(current));
    current += gap;
    if (gap <= 0) break;
  }

  return slots;
};

/**
 * Filter slots for a given appointmentDate against current system date & time
 * - If appointmentDate is TODAY, hide slots prior to current system time
 * - If appointmentDate is FUTURE, return all slots
 * @param {string[]} slots - List of 12-hour formatted time slots (e.g. ["09:10 AM", ...])
 * @param {string} appointmentDateStr - "YYYY-MM-DD"
 * @returns {string[]} Filtered slots
 */
export const filterSlotsForDate = (slots = [], appointmentDateStr = '') => {
  if (!slots || slots.length === 0) return [];
  if (!appointmentDateStr) return slots;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // If appointment date is not today, return all slots
  if (appointmentDateStr !== todayStr) {
    return slots;
  }

  // If appointment date IS today, filter out past times
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slots.filter((slot) => {
    const slotMinutes = parseTimeToMinutes(slot);
    return slotMinutes >= currentMinutes;
  });
};
