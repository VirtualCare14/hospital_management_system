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

export const formatMinutesTo12h = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? `0${hours}` : `${hours}`;
  const strMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${strHours}:${strMinutes} ${ampm}`;
};

export const generateTimeSlots = (startTime = '09:00', endTime = '17:00', gapMinutes = 10) => {
  const gap = Math.max(1, Number(gapMinutes) || 10);
  const startMin = parseTimeToMinutes(startTime);
  let endMin = parseTimeToMinutes(endTime);

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

export const filterSlotsForDate = (slots = [], appointmentDateStr = '') => {
  if (!slots || slots.length === 0) return [];
  if (!appointmentDateStr) return slots;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (appointmentDateStr !== todayStr) {
    return slots;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slots.filter((slot) => {
    const slotMinutes = parseTimeToMinutes(slot);
    return slotMinutes >= currentMinutes;
  });
};
