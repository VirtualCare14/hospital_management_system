const IpdAdmission = require('../models/IpdAdmission');
const IpdMedicationOrder = require('../models/IpdMedicationOrder');
const IpdMedicationAdministration = require('../models/IpdMedicationAdministration');
const HospitalSettings = require('../models/HospitalSettings');
const IpdActivityTimeline = require('../models/IpdActivityTimeline');

// Parse a time string like "08:00 AM" into hours and minutes
const parseTimeStr = (timeStr) => {
  if (!timeStr) return { hours: 0, minutes: 0 };
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  let hours = 0;
  let minutes = 0;
  if (match) {
    hours = parseInt(match[1]);
    minutes = parseInt(match[2]);
    const ampm = match[3];
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
    }
  } else {
    const parts = timeStr.split(':');
    hours = parseInt(parts[0]) || 0;
    minutes = parseInt(parts[1]) || 0;
  }
  return { hours, minutes };
};

const getSchedulesForOrder = (order) => {
  const list = [];
  if (!order.startDate) return list;
  
  const startD = new Date(order.startDate);
  const endD = new Date(order.endDate || order.startDate);
  
  if (order.scheduleType === 'One-Time') {
    list.push({
      date: order.startDate,
      time: order.startTime || '09:00 AM'
    });
    return list;
  }
  
  if (order.scheduleType === 'Every X Hours') {
    const interval = order.hourlyInterval || 4;
    const startT = order.startTime || '08:00 AM';
    const { hours, minutes } = parseTimeStr(startT);
    
    const current = new Date(startD);
    current.setHours(hours, minutes, 0, 0);
    
    const endLimit = new Date(endD);
    endLimit.setHours(hours, minutes, 0, 0);
    
    while (current <= endLimit) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const hr = current.getHours();
      const min = String(current.getMinutes()).padStart(2, '0');
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const displayH = hr % 12 === 0 ? 12 : hr % 12;
      const displayHStr = String(displayH).padStart(2, '0');
      const timeStr = `${displayHStr}:${min} ${ampm}`;
      
      list.push({ date: dateStr, time: timeStr });
      current.setHours(current.getHours() + interval);
    }
    return list;
  }
  
  const temp = new Date(startD);
  temp.setHours(0, 0, 0, 0);
  const limit = new Date(endD);
  limit.setHours(0, 0, 0, 0);
  
  const dailyTimes = [];
  if (order.scheduleType === 'Custom Time') {
    const times = order.customTimes || [];
    dailyTimes.push(...times.sort((a, b) => {
      const ta = parseTimeStr(a);
      const tb = parseTimeStr(b);
      return (ta.hours * 60 + ta.minutes) - (tb.hours * 60 + tb.minutes);
    }));
  } else {
    if (order.morning) dailyTimes.push('08:00 AM');
    if (order.afternoon) dailyTimes.push('02:00 PM');
    if (order.evening) dailyTimes.push('06:00 PM');
    if (order.night) dailyTimes.push('10:00 PM');
  }
  
  while (temp <= limit) {
    const year = temp.getFullYear();
    const month = String(temp.getMonth() + 1).padStart(2, '0');
    const day = String(temp.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    dailyTimes.forEach(time => {
      list.push({ date: dateStr, time });
    });
    
    temp.setDate(temp.getDate() + 1);
  }
  
  return list;
};

const getScheduledTimesForOrder = (order) => {
  if (order.scheduleType === 'Every X Hours') {
    const times = [];
    const { hours: startHour, minutes: startMinute } = parseTimeStr(order.startTime || '08:00 AM');
    const interval = order.hourlyInterval || 4;
    for (let i = 0; i < 24; i += interval) {
      const h = (startHour + i) % 24;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayMin = String(startMinute).padStart(2, '0');
      const displayHStr = String(displayH).padStart(2, '0');
      times.push(`${displayHStr}:${displayMin} ${ampm}`);
    }
    return times.sort((a, b) => {
      const ta = parseTimeStr(a);
      const tb = parseTimeStr(b);
      return (ta.hours * 60 + ta.minutes) - (tb.hours * 60 + tb.minutes);
    });
  } else if (order.scheduleType === 'Custom Time') {
    const times = order.customTimes || [];
    return times.sort((a, b) => {
      const ta = parseTimeStr(a);
      const tb = parseTimeStr(b);
      return (ta.hours * 60 + ta.minutes) - (tb.hours * 60 + tb.minutes);
    });
  } else if (order.scheduleType === 'One-Time') {
    return [order.startTime || '09:00 AM'];
  } else {
    const times = [];
    if (order.morning) times.push('08:00 AM');
    if (order.afternoon) times.push('02:00 PM');
    if (order.evening) times.push('06:00 PM');
    if (order.night) times.push('10:00 PM');
    return times;
  }
};

const isOrderCompleted = (order, now = new Date()) => {
  if (order.status === 'Stopped' || order.status === 'Completed') return order.status === 'Completed';
  if (!order.endDate) return false;
  const endD = new Date(order.endDate);
  endD.setHours(23, 59, 59, 999);
  return now > endD;
};

const mapTimeToShift = (timeStr) => {
  const { hours } = parseTimeStr(timeStr);
  if (hours >= 6 && hours < 12) return 'Morning';
  if (hours >= 12 && hours < 18) return 'Afternoon';
  if (hours >= 18 && hours < 22) return 'Evening';
  return 'Night';
};

const mapShiftToTime = (shift) => {
  if (shift === 'Morning') return '08:00 AM';
  if (shift === 'Afternoon') return '02:00 PM';
  if (shift === 'Evening') return '06:00 PM';
  if (shift === 'Night') return '10:00 PM';
  return '';
};

const checkMissedDoses = async () => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHourStr = String(now.getHours()).padStart(2, '0');
    const currentMinStr = String(now.getMinutes()).padStart(2, '0');
    
    const activeAdmissions = await IpdAdmission.find({ status: 'Admitted' });
    
    for (const admission of activeAdmissions) {
      const settings = await HospitalSettings.findOne({ hospitalId: admission.hospitalId }) || { medicationGracePeriod: 30, medicationMissedThreshold: 60 };
      const thresholdMins = settings.medicationMissedThreshold || 60;
      
      const orders = await IpdMedicationOrder.find({ admissionId: admission._id, status: 'Active' });
      
      for (const order of orders) {
        if (isOrderCompleted(order, now)) {
          order.status = 'Completed';
          await order.save();
          
          await IpdActivityTimeline.create({
            hospitalId: order.hospitalId,
            admissionId: order.admissionId,
            patientId: order.patientId,
            activity: 'Medication Completed',
            description: `Medication order for ${order.medicineName} has completed its prescribed duration.`,
            date: todayStr,
            time: `${currentHourStr}:${currentMinStr}`,
            performedBy: order.doctorId,
            performedByName: 'System'
          });
          continue;
        }

        const schedules = getSchedulesForOrder(order);
        const todaySchedules = schedules.filter(s => s.date === todayStr);
        const administrations = await IpdMedicationAdministration.find({ orderId: order._id, date: todayStr });
        
        for (const slot of todaySchedules) {
          const timeStr = slot.time;
          const { hours, minutes } = parseTimeStr(timeStr);
          const scheduledD = new Date(now);
          scheduledD.setHours(hours, minutes, 0, 0);
          
          const limitTime = new Date(scheduledD.getTime() + thresholdMins * 60 * 1000);
          if (now > limitTime) {
            const hasAdmin = administrations.some(a => 
              a.scheduledTime === timeStr || 
              (a.shift && mapShiftToTime(a.shift) === timeStr)
            );
            if (!hasAdmin) {
              const delayMs = now.getTime() - scheduledD.getTime();
              const delayMins = Math.max(0, Math.round(delayMs / (60 * 1000)));
              const delayHours = Math.floor(delayMins / 60);
              const delayRemainingMins = delayMins % 60;
              const delayStr = delayHours > 0 ? `${delayHours} Hour ${delayRemainingMins} Minutes` : `${delayRemainingMins} Minutes`;

              await IpdMedicationAdministration.create({
                hospitalId: order.hospitalId,
                admissionId: order.admissionId,
                orderId: order._id,
                medicineName: order.medicineName,
                nurseId: order.doctorId,
                nurseName: 'System',
                status: 'Missed Dose',
                shift: mapTimeToShift(timeStr),
                scheduledTime: timeStr,
                remarks: 'Medication missed (automatically flagged by system grace rules)',
                date: todayStr,
                time: `${currentHourStr}:${currentMinStr}`,
                doctorNotifiedOfMissed: false
              });
              
              await IpdActivityTimeline.create({
                hospitalId: order.hospitalId,
                admissionId: order.admissionId,
                patientId: order.patientId,
                activity: 'Medication Administered',
                description: `[Missed Dose] Medication ${order.medicineName} scheduled for ${timeStr} was missed.`,
                date: todayStr,
                time: `${currentHourStr}:${currentMinStr}`,
                performedBy: order.doctorId,
                performedByName: 'System',
                metadata: {
                  type: 'administration',
                  status: 'Missed Dose',
                  medicineName: order.medicineName,
                  scheduledTime: timeStr,
                  actualTime: 'Not administered',
                  delayStr: delayStr,
                  nurseName: 'System',
                  remarks: 'Medication missed (automatically flagged by system grace rules)'
                }
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Missed Dose Scheduler Error:', err);
  }
};

const startMedicationScheduler = () => {
  setInterval(checkMissedDoses, 60 * 1000);
  checkMissedDoses();
};

module.exports = { 
  startMedicationScheduler,
  parseTimeStr,
  getScheduledTimesForOrder,
  getSchedulesForOrder,
  isOrderCompleted,
  mapTimeToShift,
  mapShiftToTime
};
