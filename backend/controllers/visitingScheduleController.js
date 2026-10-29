const VisitingDoctorSchedule = require('../models/VisitingDoctorSchedule');
const Visit = require('../models/Visit');
const Hospital = require('../models/Hospital');

const tenantQuery = (req, extra = {}) => (
  req.user.hospitalId ? { ...extra, hospitalId: req.user.hospitalId } : extra
);

// Resolve hospital ID helper
const resolveHospitalId = async (req) => {
  if (req.user?.hospitalId) return req.user.hospitalId;
  const defaultHosp = await Hospital.findOne({ isActive: true }).select('_id');
  if (defaultHosp) return defaultHosp._id;
  const anyHosp = await Hospital.findOne().select('_id');
  return anyHosp ? anyHosp._id : null;
};

// Format minutes to 12h string
const formatMinutesTo12h = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? '0' + hours : '' + hours;
  const strMinutes = minutes < 10 ? '0' + minutes : '' + minutes;
  return strHours + ':' + strMinutes + ' ' + ampm;
};

// Parse time string (24h or 12h AM/PM) to minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (hours < 1 || hours > 12 || mins < 0 || mins > 59) return null;
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  }
  const match24 = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }
  return null;
};

// Alias timeToMinutes to parseTimeToMinutes for full backwards compatibility
const timeToMinutes = parseTimeToMinutes;

// Parse slot string into start and end minutes
const parseSlotTimeRange = (slotStr, defaultDuration = 15) => {
  if (!slotStr || typeof slotStr !== 'string') return null;
  const parts = slotStr.split('-').map(s => s.trim());
  const startMins = parseTimeToMinutes(parts[0]);
  if (startMins === null) return null;
  let endMins;
  if (parts.length > 1) {
    endMins = parseTimeToMinutes(parts[1]);
    if (endMins === null) return null;
  } else {
    endMins = startMins + defaultDuration;
  }
  return { startMins, endMins };
};

// @desc    Create a visiting specialist schedule
// @route   POST /api/reception/visiting-schedules
// @access  Private (Reception / Admin)
const createSchedule = async (req, res) => {
  try {
    const {
      doctorName,
      department,
      speciality,
      visitDates,
      startTime,
      endTime,
      slotDuration,
      consultationFee,
      notes
    } = req.body;

    if (!doctorName || !doctorName.trim()) {
      return res.status(400).json({ message: 'Doctor display name is required.' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ message: 'Department is required.' });
    }
    if (!Array.isArray(visitDates) || visitDates.length === 0) {
      return res.status(400).json({ message: 'At least one visit date must be selected.' });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required.' });
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (startMins === null || endMins === null) {
      return res.status(400).json({ message: 'Valid start time and end time in HH:mm (24-hour) format are required.' });
    }
    if (startMins >= endMins) {
      return res.status(400).json({ message: 'Start time must be strictly earlier than end time.' });
    }

    const parsedSlotDuration = Number(slotDuration) > 0 ? Number(slotDuration) : 15;
    if (parsedSlotDuration < 5 || parsedSlotDuration > 120) {
      return res.status(400).json({ message: 'Slot duration must be between 5 and 120 minutes.' });
    }
    if (parsedSlotDuration > (endMins - startMins)) {
      return res.status(400).json({ message: 'Slot duration cannot exceed the total duration between start time and end time.' });
    }

    const parsedFee = Number(consultationFee);
    if (isNaN(parsedFee) || parsedFee < 0) {
      return res.status(400).json({ message: 'Consultation fee must be a non-negative number.' });
    }

    const hospitalId = await resolveHospitalId(req);
    if (!hospitalId) {
      return res.status(400).json({ message: 'Could not resolve hospital ID.' });
    }

    // Clean and validate visitDates (must be YYYY-MM-DD)
    const cleanedDates = Array.from(new Set(
      visitDates.map(d => String(d).trim()).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
    )).sort();

    if (cleanedDates.length === 0) {
      return res.status(400).json({ message: 'Valid dates in YYYY-MM-DD format are required.' });
    }

    // Check for conflicting active schedule for the same doctor with overlapping dates and time
    const conflictingSchedule = await VisitingDoctorSchedule.findOne(tenantQuery(req, {
      status: 'Active',
      doctorName: { $regex: new RegExp(`^${doctorName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      visitDates: { $in: cleanedDates }
    }));

    if (conflictingSchedule) {
      const existingStart = timeToMinutes(conflictingSchedule.startTime);
      const existingEnd = timeToMinutes(conflictingSchedule.endTime);
      if (existingStart !== null && existingEnd !== null) {
        const isOverlapping = Math.max(startMins, existingStart) < Math.min(endMins, existingEnd);
        if (isOverlapping) {
          const overlapDate = cleanedDates.find(d => conflictingSchedule.visitDates.includes(d));
          return res.status(400).json({
            message: `Conflicting schedule: Dr. ${doctorName.trim()} already has an active schedule on ${overlapDate} from ${conflictingSchedule.startTime} to ${conflictingSchedule.endTime}.`
          });
        }
      }
    }

    const newSchedule = new VisitingDoctorSchedule({
      hospitalId,
      doctorName: doctorName.trim(),
      department: department.trim(),
      speciality: (speciality && typeof speciality === 'string') ? speciality.trim() : '',
      visitDates: cleanedDates,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      slotDuration: parsedSlotDuration,
      consultationFee: parsedFee,
      status: 'Active',
      notes: notes ? String(notes).trim() : '',
      createdBy: req.user._id
    });

    await newSchedule.save();
    res.status(201).json({ message: 'Visiting specialist schedule created successfully', schedule: newSchedule });
  } catch (error) {
    console.error('Create Visiting Schedule Error:', error);
    res.status(500).json({ message: 'Server error while creating schedule.' });
  }
};

// @desc    Get visiting schedules with optional filters
// @route   GET /api/reception/visiting-schedules
// @access  Private
const getSchedules = async (req, res) => {
  try {
    const { department, status, date } = req.query;
    let query = tenantQuery(req);

    if (department && department !== 'all') {
      query.department = department;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      query.visitDates = date;
    }

    const schedules = await VisitingDoctorSchedule.find(query)
      .populate('createdBy', 'username doctorName')
      .sort({ createdAt: -1 });

    // Aggregate booked appointments count per schedule
    const scheduleIds = schedules.map(s => s._id);
    const bookingCounts = await Visit.aggregate([
      { $match: { visitingScheduleId: { $in: scheduleIds } } },
      { $group: { _id: '$visitingScheduleId', totalBooked: { $sum: 1 } } }
    ]);

    const countMap = {};
    bookingCounts.forEach(b => {
      countMap[b._id.toString()] = b.totalBooked;
    });

    const enriched = schedules.map(s => ({
      ...s.toObject(),
      totalBooked: countMap[s._id.toString()] || 0
    }));

    res.status(200).json(enriched);
  } catch (error) {
    console.error('Get Visiting Schedules Error:', error);
    res.status(500).json({ message: 'Server error while fetching schedules.' });
  }
};

// @desc    Get active visiting schedules for appointment booking dropdown
// @route   GET /api/reception/visiting-schedules/active
// @access  Private
const getActiveSchedules = async (req, res) => {
  try {
    const { department, date } = req.query;
    let query = tenantQuery(req, { status: 'Active' });

    if (department && department !== 'all') {
      query.department = department;
    }
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      query.visitDates = date;
    }

    const schedules = await VisitingDoctorSchedule.find(query)
      .select('doctorName department speciality visitDates startTime endTime slotDuration consultationFee status')
      .sort({ doctorName: 1 });

    res.status(200).json(schedules);
  } catch (error) {
    console.error('Get Active Visiting Schedules Error:', error);
    res.status(500).json({ message: 'Server error while fetching active schedules.' });
  }
};

// @desc    Get single visiting schedule by ID
// @route   GET /api/reception/visiting-schedules/:id
// @access  Private
const getScheduleById = async (req, res) => {
  try {
    const schedule = await VisitingDoctorSchedule.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }
    res.status(200).json(schedule);
  } catch (error) {
    console.error('Get Schedule By ID Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// @desc    Update visiting schedule safely preserving existing bookings
// @route   PUT /api/reception/visiting-schedules/:id
// @access  Private (Reception / Admin)
const updateSchedule = async (req, res) => {
  try {
    const schedule = await VisitingDoctorSchedule.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    const {
      doctorName,
      department,
      speciality,
      visitDates,
      startTime,
      endTime,
      slotDuration,
      consultationFee,
      status,
      notes
    } = req.body;

    // Fetch existing booked visits for this schedule to protect them
    const linkedVisits = await Visit.find(tenantQuery(req, { visitingScheduleId: schedule._id }));

    // 1. Visit dates update & safety
    if (visitDates !== undefined) {
      if (!Array.isArray(visitDates) || visitDates.length === 0) {
        return res.status(400).json({ message: 'At least one visit date must be selected.' });
      }

      const newDates = Array.from(new Set(
        visitDates.map(d => String(d).trim()).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      )).sort();

      if (newDates.length === 0) {
        return res.status(400).json({ message: 'Valid dates in YYYY-MM-DD format are required.' });
      }

      // Reject removal of dates that already have booked visits
      if (linkedVisits.length > 0) {
        const orphanedVisits = linkedVisits.filter(v => v.appointmentDate && !newDates.includes(v.appointmentDate));
        if (orphanedVisits.length > 0) {
          const affectedDates = [...new Set(orphanedVisits.map(v => v.appointmentDate))];
          return res.status(400).json({
            message: `Cannot remove date(s) ${affectedDates.join(', ')} because ${orphanedVisits.length} patient appointment(s) have already been booked on these dates. Existing bookings must be preserved.`
          });
        }
      }
      schedule.visitDates = newDates;
    }

    // 2. Timings & Slot Duration update & safety
    const updatedStartTime = startTime !== undefined ? startTime.trim() : schedule.startTime;
    const updatedEndTime = endTime !== undefined ? endTime.trim() : schedule.endTime;
    const updatedStartMins = timeToMinutes(updatedStartTime);
    const updatedEndMins = timeToMinutes(updatedEndTime);

    if (updatedStartMins === null || updatedEndMins === null) {
      return res.status(400).json({ message: 'Valid start time and end time in HH:mm (24-hour) format are required.' });
    }
    if (updatedStartMins >= updatedEndMins) {
      return res.status(400).json({ message: 'Start time must be strictly earlier than end time.' });
    }

    const updatedSlotDuration = slotDuration !== undefined ? Math.max(5, Number(slotDuration) || 15) : schedule.slotDuration;
    if (updatedSlotDuration < 5 || updatedSlotDuration > 120) {
      return res.status(400).json({ message: 'Slot duration must be between 5 and 120 minutes.' });
    }
    if (updatedSlotDuration > (updatedEndMins - updatedStartMins)) {
      return res.status(400).json({ message: 'Slot duration cannot exceed the total duration between start time and end time.' });
    }

    if (linkedVisits.length > 0) {
      const timingChanged = updatedStartTime !== schedule.startTime || updatedEndTime !== schedule.endTime;
      if (timingChanged) {
        const outOfRangeVisits = linkedVisits.filter(v => {
          if (!v.slot) return false;
          const slotStartStr = v.slot.split('-')[0].trim();
          const slotMins = timeToMinutes(slotStartStr);
          return slotMins !== null && (slotMins < updatedStartMins || slotMins >= updatedEndMins);
        });

        if (outOfRangeVisits.length > 0) {
          return res.status(400).json({
            message: `Cannot update schedule timings to ${updatedStartTime} - ${updatedEndTime} because ${outOfRangeVisits.length} existing booked appointment slot(s) fall outside this new time range.`
          });
        }
      }

      if (slotDuration !== undefined && updatedSlotDuration !== schedule.slotDuration) {
        return res.status(400).json({
          message: `Cannot change slot duration from ${schedule.slotDuration} to ${updatedSlotDuration} minutes because ${linkedVisits.length} appointment(s) have already been booked under this schedule.`
        });
      }
    }

    schedule.startTime = updatedStartTime;
    schedule.endTime = updatedEndTime;
    schedule.slotDuration = updatedSlotDuration;

    if (doctorName !== undefined && doctorName.trim()) schedule.doctorName = doctorName.trim();
    if (department !== undefined && department.trim()) schedule.department = department.trim();
    if (speciality !== undefined) schedule.speciality = speciality.trim();
    if (consultationFee !== undefined) {
      const parsedFee = Number(consultationFee);
      if (isNaN(parsedFee) || parsedFee < 0) {
        return res.status(400).json({ message: 'Consultation fee must be a non-negative number.' });
      }
      schedule.consultationFee = parsedFee;
    }
    if (status !== undefined && ['Active', 'Completed', 'Cancelled'].includes(status)) {
      schedule.status = status;
    }
    if (notes !== undefined) schedule.notes = String(notes).trim();

    // Check conflict if doctorName, timings or dates are modified
    if (schedule.status === 'Active') {
      const conflictingSchedule = await VisitingDoctorSchedule.findOne(tenantQuery(req, {
        _id: { $ne: schedule._id },
        status: 'Active',
        doctorName: { $regex: new RegExp(`^${schedule.doctorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        visitDates: { $in: schedule.visitDates }
      }));

      if (conflictingSchedule) {
        const existStart = timeToMinutes(conflictingSchedule.startTime);
        const existEnd = timeToMinutes(conflictingSchedule.endTime);
        if (existStart !== null && existEnd !== null) {
          const isOverlapping = Math.max(updatedStartMins, existStart) < Math.min(updatedEndMins, existEnd);
          if (isOverlapping) {
            const overlapDate = schedule.visitDates.find(d => conflictingSchedule.visitDates.includes(d));
            return res.status(400).json({
              message: `Conflicting schedule: Dr. ${schedule.doctorName} already has an active schedule on ${overlapDate} from ${conflictingSchedule.startTime} to ${conflictingSchedule.endTime}.`
            });
          }
        }
      }
    }

    await schedule.save();
    res.status(200).json({ message: 'Schedule updated successfully', schedule });
  } catch (error) {
    console.error('Update Visiting Schedule Error:', error);
    res.status(500).json({ message: 'Server error while updating schedule.' });
  }
};

// @desc    Delete visiting schedule (only if no appointments booked)
// @route   DELETE /api/reception/visiting-schedules/:id
// @access  Private (Reception / Admin)
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await VisitingDoctorSchedule.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    // Check if any visits are linked to this schedule
    const linkedVisits = await Visit.countDocuments(tenantQuery(req, { visitingScheduleId: schedule._id }));
    if (linkedVisits > 0) {
      return res.status(400).json({
        message: `Cannot delete schedule because ${linkedVisits} appointment(s) have already been booked. You can mark it as 'Cancelled' or 'Completed' instead to preserve historical records.`
      });
    }

    await schedule.deleteOne();
    res.status(200).json({ message: 'Schedule deleted successfully.' });
  } catch (error) {
    console.error('Delete Visiting Schedule Error:', error);
    res.status(500).json({ message: 'Server error while deleting schedule.' });
  }
};

// @desc    Get booked slots for a specific visiting schedule on a date
// @route   GET /api/reception/visiting-schedules/:id/booked-slots
// @access  Private
const getScheduleBookedSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date query parameter is required.' });
    }

    const bookings = await Visit.find(tenantQuery(req, {
      visitingScheduleId: id,
      appointmentDate: date
    })).select('slot');

    const bookedSlots = bookings.map(b => b.slot);
    res.status(200).json(bookedSlots);
  } catch (error) {
    console.error('Get Schedule Booked Slots Error:', error);
    res.status(500).json({ message: 'Server error while fetching booked slots.' });
  }
};

// @desc    Get free available slots for a visiting schedule on a specific date (server authoritative)
// @route   GET /api/reception/visiting-schedules/:id/available-slots
// @access  Private
const getAvailableSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date query parameter is required.' });
    }

    const schedule = await VisitingDoctorSchedule.findOne(tenantQuery(req, { _id: id }));
    if (!schedule || schedule.status !== 'Active') {
      return res.status(404).json({ message: 'Active schedule not found.' });
    }

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
    const [h, m] = timeStr.split(':').map(Number);
    const currentMinutes = h * 60 + m;

    if (date < todayStr) {
      return res.status(400).json({
        message: 'Cannot book appointments for past dates.',
        isPastDate: true,
        availableSlots: [],
        bookedSlots: []
      });
    }

    if (!schedule.visitDates.includes(date)) {
      return res.status(200).json({
        scheduleId: schedule._id,
        doctorName: schedule.doctorName,
        department: schedule.department,
        date,
        availableSlots: [],
        bookedSlots: [],
        message: 'Dr. ' + schedule.doctorName + ' is only scheduled on: ' + schedule.visitDates.join(', ')
      });
    }

    const startMins = parseTimeToMinutes(schedule.startTime);
    const endMins = parseTimeToMinutes(schedule.endTime);
    const duration = schedule.slotDuration || 15;

    const allSlots = [];
    if (startMins !== null && endMins !== null && startMins < endMins) {
      let cur = startMins;
      while (cur + duration <= endMins) {
        const slotEnd = cur + duration;
        const slotStartStr = formatMinutesTo12h(cur);
        const slotEndStr = formatMinutesTo12h(slotEnd);
        const slotRange = `${slotStartStr} - ${slotEndStr}`;
        allSlots.push({
          slot: slotRange,
          startOnly: slotStartStr,
          startMins: cur,
          endMins: slotEnd
        });
        cur += duration;
      }
    }

    const bookings = await Visit.find(tenantQuery(req, {
      visitingScheduleId: id,
      appointmentDate: date,
      consultationStatus: { $ne: 'cancelled' }
    })).select('slot');

    const bookedSlotSet = new Set();
    const bookedStartMinutes = new Set();

    bookings.forEach(b => {
      if (!b.slot) return;
      const trimmed = b.slot.trim();
      bookedSlotSet.add(trimmed);
      const parsed = parseSlotTimeRange(trimmed, duration);
      if (parsed && parsed.startMins !== null) {
        bookedStartMinutes.add(parsed.startMins);
      }
    });

    const availableSlots = allSlots.filter(s => {
      if (bookedSlotSet.has(s.slot) || bookedSlotSet.has(s.startOnly) || bookedStartMinutes.has(s.startMins)) {
        return false;
      }
      if (date === todayStr && s.startMins < currentMinutes) {
        return false;
      }
      return true;
    }).map(s => s.slot);

    let message = '';
    if (availableSlots.length === 0) {
      message = (date === todayStr)
        ? 'No slots available for the remaining time today.'
        : 'No available time slots for this date.';
    }

    res.status(200).json({
      scheduleId: schedule._id,
      doctorName: schedule.doctorName,
      department: schedule.department,
      date,
      availableSlots,
      bookedSlots: Array.from(bookedSlotSet),
      totalConfiguredSlots: allSlots.length,
      isToday: date === todayStr,
      message
    });
  } catch (error) {
    console.error('Get Available Slots Error:', error);
    res.status(500).json({ message: 'Server error while fetching available slots.' });
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  getActiveSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getScheduleBookedSlots,
  getAvailableSlots,
  timeToMinutes,
  parseTimeToMinutes,
  parseSlotTimeRange,
  formatMinutesTo12h
};
