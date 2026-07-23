const IpdAdmission = require('../models/IpdAdmission');
const IpdMedicationOrder = require('../models/IpdMedicationOrder');
const IpdMedicationAdministration = require('../models/IpdMedicationAdministration');
const IpdActivityTimeline = require('../models/IpdActivityTimeline');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// Helpers to get current local date & time strings
const getCurrentDateTimeStrings = () => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { dateStr, timeStr };
};

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

const calculateEndDate = (startDateStr, durationStr) => {
  if (!startDateStr) return '';
  const date = new Date(startDateStr);
  let days = 0;
  if (durationStr === '3 Days') days = 3;
  else if (durationStr === '5 Days') days = 5;
  else if (durationStr === '7 Days') days = 7;
  else if (durationStr === '10 Days') days = 10;
  else if (durationStr === '14 Days') days = 14;
  else if (durationStr === '30 Days') days = 30;
  else return '';
  
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Helper for adding timeline activities
const addTimeline = async (req, admissionId, patientId, activity, description, metadata = null) => {
  const { dateStr, timeStr } = getCurrentDateTimeStrings();
  return IpdActivityTimeline.create({
    hospitalId: req.user.hospitalId,
    admissionId,
    patientId,
    activity,
    description,
    date: dateStr,
    time: timeStr,
    performedBy: req.user._id,
    performedByName: req.user.doctorName || req.user.username || 'System',
    metadata
  });
};

// @desc    Get all medication orders for an admission with their administration logs
// @route   GET /api/ipd/medication-orders/:admissionId
// @access  Private
const getMedicationOrders = async (req, res) => {
  try {
    const { admissionId } = req.params;
    
    // Find all medication orders for this admission
    const orders = await IpdMedicationOrder.find(tenantFilter(req, { admissionId }))
      .sort({ createdAt: -1 });

    // For each order, fetch all administration history logs
    const ordersWithLogs = await Promise.all(orders.map(async (order) => {
      const administrations = await IpdMedicationAdministration.find(
        tenantFilter(req, { orderId: order._id })
      ).sort({ createdAt: -1 });

      return {
        ...order.toObject(),
        administrations
      };
    }));

    res.status(200).json(ordersWithLogs);
  } catch (error) {
    console.error('Get Medication Orders Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new medication order
// @route   POST /api/ipd/medication-orders
// @access  Private
const createMedicationOrder = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Only doctors or admins can place medication orders' });
    }

    const {
      admissionId,
      medicineName,
      dose,
      route,
      frequency,
      morning,
      afternoon,
      evening,
      night,
      doctorRemark,
      scheduleType,
      hourlyInterval,
      startTime,
      customTimes,
      startDate,
      duration,
      endDate
    } = req.body;

    if (!admissionId || !medicineName || !dose || !route || !frequency) {
      return res.status(400).json({ message: 'Admission ID, medicine name, dose, route, and frequency are required' });
    }

    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: admissionId }));
    if (!admission) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    const { dateStr, timeStr } = getCurrentDateTimeStrings();
    const effectiveStartDate = startDate || dateStr;
    let effectiveEndDate = endDate || '';
    if (duration && duration !== 'Custom' && !effectiveEndDate) {
      effectiveEndDate = calculateEndDate(effectiveStartDate, duration);
    }

    const newOrder = await IpdMedicationOrder.create({
      hospitalId: req.user.hospitalId,
      admissionId,
      patientId: admission.patientId,
      medicineName,
      dose,
      route,
      frequency,
      morning: !!morning,
      afternoon: !!afternoon,
      evening: !!evening,
      night: !!night,
      doctorRemark: doctorRemark || '',
      scheduleType: scheduleType || 'Fixed Shift',
      hourlyInterval: hourlyInterval !== undefined ? Number(hourlyInterval) : 4,
      startTime: startTime || '',
      customTimes: customTimes || [],
      startDate: effectiveStartDate,
      duration: duration || '',
      endDate: effectiveEndDate,
      status: 'Active',
      doctorId: req.user._id,
      doctorName: req.user.doctorName || req.user.username,
      date: dateStr,
      time: timeStr
    });

    await addTimeline(
      req,
      admissionId,
      admission.patientId,
      'Medication Ordered',
      `Ordered medicine: ${medicineName} (${dose}, ${route}, ${frequency}) by Dr. ${req.user.doctorName || req.user.username}`,
      {
        type: 'order_added',
        medicineName,
        doctorName: req.user.doctorName || req.user.username,
        dose,
        route,
        frequency
      }
    );

    res.status(201).json({ message: 'Medication order created successfully', order: newOrder });
  } catch (error) {
    console.error('Create Medication Order Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Modify a medication order
// @route   PUT /api/ipd/medication-orders/:orderId
// @access  Private
const updateMedicationOrder = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Only doctors or admins can modify medication orders' });
    }

    const { orderId } = req.params;
    const {
      medicineName,
      dose,
      route,
      frequency,
      morning,
      afternoon,
      evening,
      night,
      doctorRemark,
      scheduleType,
      hourlyInterval,
      startTime,
      customTimes,
      startDate,
      duration,
      endDate
    } = req.body;

    const order = await IpdMedicationOrder.findOne(tenantFilter(req, { _id: orderId }));
    if (!order) {
      return res.status(404).json({ message: 'Medication order not found' });
    }

    if (order.status === 'Stopped') {
      return res.status(400).json({ message: 'Cannot modify a stopped medication order' });
    }

    const { dateStr, timeStr } = getCurrentDateTimeStrings();
    const effectiveStartDate = startDate || order.startDate || dateStr;
    let effectiveEndDate = endDate || order.endDate || '';
    if (duration && duration !== 'Custom') {
      effectiveEndDate = calculateEndDate(effectiveStartDate, duration);
    }

    order.medicineName = medicineName || order.medicineName;
    order.dose = dose || order.dose;
    order.route = route || order.route;
    order.frequency = frequency || order.frequency;
    order.morning = morning !== undefined ? !!morning : order.morning;
    order.afternoon = afternoon !== undefined ? !!afternoon : order.afternoon;
    order.evening = evening !== undefined ? !!evening : order.evening;
    order.night = night !== undefined ? !!night : order.night;
    order.doctorRemark = doctorRemark !== undefined ? doctorRemark : order.doctorRemark;
    order.scheduleType = scheduleType || order.scheduleType;
    order.hourlyInterval = hourlyInterval !== undefined ? Number(hourlyInterval) : order.hourlyInterval;
    order.startTime = startTime !== undefined ? startTime : order.startTime;
    order.customTimes = customTimes || order.customTimes;
    order.startDate = effectiveStartDate;
    order.duration = duration !== undefined ? duration : order.duration;
    order.endDate = effectiveEndDate;
    
    // Track modification
    order.doctorId = req.user._id;
    order.doctorName = req.user.doctorName || req.user.username;
    order.date = dateStr;
    order.time = timeStr;

    await order.save();

    await addTimeline(
      req,
      order.admissionId,
      order.patientId,
      'Medication Order Updated',
      `Updated medicine details: ${order.medicineName} by Dr. ${req.user.doctorName || req.user.username}`,
      {
        type: 'order_changed',
        medicineName: order.medicineName,
        doctorName: req.user.doctorName || req.user.username
      }
    );

    res.status(200).json({ message: 'Medication order updated successfully', order });
  } catch (error) {
    console.error('Update Medication Order Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Stop a medication order
// @route   POST /api/ipd/medication-orders/:orderId/stop
// @access  Private
const stopMedicationOrder = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Only doctors or admins can stop medication orders' });
    }

    const { orderId } = req.params;
    const order = await IpdMedicationOrder.findOne(tenantFilter(req, { _id: orderId }));
    
    if (!order) {
      return res.status(404).json({ message: 'Medication order not found' });
    }

    if (order.status === 'Stopped') {
      return res.status(400).json({ message: 'Medication order is already stopped' });
    }

    const { dateStr, timeStr } = getCurrentDateTimeStrings();

    order.status = 'Stopped';
    order.stoppedBy = req.user._id;
    order.stoppedByName = req.user.doctorName || req.user.username;
    order.stoppedDate = dateStr;
    order.stoppedTime = timeStr;

    await order.save();

    await addTimeline(
      req,
      order.admissionId,
      order.patientId,
      'Medication Stopped',
      `Stopped medicine: ${order.medicineName} by Dr. ${req.user.doctorName || req.user.username}`,
      {
        type: 'order_stopped',
        medicineName: order.medicineName,
        doctorName: req.user.doctorName || req.user.username
      }
    );

    res.status(200).json({ message: 'Medication order stopped successfully', order });
  } catch (error) {
    console.error('Stop Medication Order Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all administration logs for an admission
// @route   GET /api/ipd/medication-administrations/:admissionId
// @access  Private
const getAdministrationsByAdmission = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const administrations = await IpdMedicationAdministration.find(tenantFilter(req, { admissionId }))
      .sort({ createdAt: -1 });

    res.status(200).json(administrations);
  } catch (error) {
    console.error('Get Administrations Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a nurse administration record for a medication order
// @route   POST /api/ipd/medication-orders/:orderId/administer
// @access  Private
const HospitalSettings = require('../models/HospitalSettings');

const createAdministrationRecord = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'ipd' && role !== 'admin' && role !== 'nursing') {
      return res.status(403).json({ message: 'Access denied: Only IPD staff, nurses, or admins can administer medications' });
    }

    const { orderId } = req.params;
    const { status, remarks, shift, scheduledTime } = req.body;

    if (!status || !shift) {
      return res.status(400).json({ message: 'Status (Given, Missed, etc.) and Shift are required' });
    }

    const order = await IpdMedicationOrder.findOne(tenantFilter(req, { _id: orderId }));
    if (!order) {
      return res.status(404).json({ message: 'Medication order not found' });
    }

    if (order.status === 'Stopped') {
      return res.status(400).json({ message: 'Cannot administer a stopped medication order' });
    }

    const { dateStr, timeStr } = getCurrentDateTimeStrings();

    // Fetch hospital settings for grace limits
    const settings = await HospitalSettings.findOne({ hospitalId: req.user.hospitalId }) || { medicationGracePeriod: 30, medicationMissedThreshold: 60 };
    const gracePeriod = settings.medicationGracePeriod || 30;
    const missedThreshold = settings.medicationMissedThreshold || 60;

    let finalStatus = status;
    let delayStr = 'N/A';

    if (status === 'Given' && scheduledTime) {
      const { hours: schH, minutes: schM } = parseTimeStr(scheduledTime);
      const [actH, actM] = timeStr.split(':').map(Number);
      
      const schDate = new Date();
      schDate.setHours(schH, schM, 0, 0);
      
      const actDate = new Date();
      actDate.setHours(actH, actM, 0, 0);
      
      const delayMins = Math.round((actDate.getTime() - schDate.getTime()) / (60 * 1000));
      
      if (delayMins > 0) {
        const delayHours = Math.floor(delayMins / 60);
        const delayRemainingMins = delayMins % 60;
        delayStr = delayHours > 0 ? `${delayHours} Hour ${delayRemainingMins} Minutes` : `${delayRemainingMins} Minutes`;
      } else {
        delayStr = 'None';
      }

      if (delayMins <= gracePeriod) {
        finalStatus = 'On Time';
      } else if (delayMins <= missedThreshold) {
        finalStatus = 'Delayed';
      } else {
        finalStatus = 'Missed Dose';
      }
    }

    const administration = await IpdMedicationAdministration.create({
      hospitalId: req.user.hospitalId,
      admissionId: order.admissionId,
      orderId: order._id,
      medicineName: order.medicineName,
      nurseId: req.user._id,
      nurseName: req.user.doctorName || req.user.username,
      status: finalStatus,
      shift,
      scheduledTime: scheduledTime || '',
      remarks: remarks || '',
      date: dateStr,
      time: timeStr
    });

    await addTimeline(
      req,
      order.admissionId,
      order.patientId,
      'Medication Administered',
      `Medication ${order.medicineName} marked as ${finalStatus} (Scheduled: ${scheduledTime || 'N/A'}, Actual: ${timeStr}) by ${req.user.doctorName || req.user.username} ${remarks ? `(${remarks})` : ''}`,
      {
        type: 'administration',
        status: finalStatus,
        medicineName: order.medicineName,
        scheduledTime: scheduledTime || 'N/A',
        actualTime: timeStr,
        delayStr,
        nurseName: req.user.doctorName || req.user.username,
        remarks: remarks || ''
      }
    );

    res.status(201).json({ message: 'Medication administration logged successfully', administration });
  } catch (error) {
    console.error('Log Medication Administration Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a nurse administration record
// @route   PUT /api/ipd/medication-administrations/:adminId
// @access  Private
const updateAdministrationRecord = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'ipd' && role !== 'admin' && role !== 'nursing') {
      return res.status(403).json({ message: 'Access denied: Only IPD staff, nurses, or admins can modify administration logs' });
    }

    const { adminId } = req.params;
    const { status, remarks, shift } = req.body;

    const adminRecord = await IpdMedicationAdministration.findOne(tenantFilter(req, { _id: adminId }));
    if (!adminRecord) {
      return res.status(404).json({ message: 'Administration record not found' });
    }

    const admission = await IpdAdmission.findById(adminRecord.admissionId);
    const patientId = admission ? admission.patientId : null;

    const oldStatus = adminRecord.status;
    adminRecord.status = status || adminRecord.status;
    adminRecord.remarks = remarks !== undefined ? remarks : adminRecord.remarks;
    adminRecord.shift = shift || adminRecord.shift;

    await adminRecord.save();

    await addTimeline(
      req,
      adminRecord.admissionId,
      patientId,
      'Medication Administered',
      `Updated medication log for ${adminRecord.medicineName}: changed status from ${oldStatus} to ${adminRecord.status} (Shift: ${adminRecord.shift}) by ${req.user.doctorName || req.user.username}`,
      {
        type: 'administration',
        status: adminRecord.status,
        medicineName: adminRecord.medicineName,
        scheduledTime: adminRecord.scheduledTime || 'N/A',
        actualTime: adminRecord.time,
        delayStr: adminRecord.status === 'On Time' ? 'None' : 'Delayed',
        nurseName: req.user.doctorName || req.user.username,
        remarks: remarks || adminRecord.remarks
      }
    );

    res.status(200).json({ message: 'Administration record updated successfully', administration: adminRecord });
  } catch (error) {
    console.error('Update Administration Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all missed medication alerts for a doctor
// @route   GET /api/ipd/medication-orders/missed-alerts
// @access  Private
const getMissedAlerts = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Find all active admissions
    const query = { status: 'Admitted' };
    if (req.user.role === 'doctor') {
      query.doctorInCharge = req.user._id;
    }
    const admissions = await IpdAdmission.find(tenantFilter(req, query)).populate('patientId');
    const admissionIds = admissions.map(a => a._id);
    
    // Find all Missed Dose administrations today for these admissions that haven't been dismissed
    const missedAdmins = await IpdMedicationAdministration.find(tenantFilter(req, {
      admissionId: { $in: admissionIds },
      status: 'Missed Dose',
      date: todayStr,
      doctorNotifiedOfMissed: false
    })).sort({ createdAt: -1 });
    
    // Build alert objects
    const alerts = await Promise.all(missedAdmins.map(async (admin) => {
      const order = await IpdMedicationOrder.findById(admin.orderId);
      const admission = admissions.find(a => String(a._id) === String(admin.admissionId));
      const patientName = admission?.patientId?.patientName || 'Unknown Patient';
      
      const { hours, minutes } = parseTimeStr(admin.scheduledTime);
      const scheduledD = new Date(admin.createdAt);
      scheduledD.setHours(hours, minutes, 0, 0);
      
      const adminD = new Date(admin.createdAt);
      const delayMs = adminD.getTime() - scheduledD.getTime();
      const delayMins = Math.max(0, Math.round(delayMs / (60 * 1000)));
      const delayHours = Math.floor(delayMins / 60);
      const delayRemainingMins = delayMins % 60;
      const delayStr = delayHours > 0 ? `${delayHours} Hr ${delayRemainingMins} Min` : `${delayRemainingMins} Min`;
      
      return {
        _id: admin._id,
        medicineName: admin.medicineName,
        patientName,
        scheduledTime: admin.scheduledTime,
        currentDelay: delayStr,
        nurseName: admin.nurseName || 'System',
        createdAt: admin.createdAt
      };
    }));
    
    res.status(200).json(alerts);
  } catch (error) {
    console.error('Get Missed Alerts Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Dismiss a missed medication alert
// @route   POST /api/ipd/medication-administrations/:adminId/dismiss-missed-alert
// @access  Private
const dismissMissedAlert = async (req, res) => {
  try {
    const { adminId } = req.params;
    const adminRecord = await IpdMedicationAdministration.findOne(tenantFilter(req, { _id: adminId }));
    if (!adminRecord) {
      return res.status(404).json({ message: 'Administration record not found' });
    }
    adminRecord.doctorNotifiedOfMissed = true;
    await adminRecord.save();
    res.status(200).json({ message: 'Missed alert dismissed successfully' });
  } catch (error) {
    console.error('Dismiss Missed Alert Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMedicationOrders,
  createMedicationOrder,
  updateMedicationOrder,
  stopMedicationOrder,
  getAdministrationsByAdmission,
  createAdministrationRecord,
  updateAdministrationRecord,
  getMissedAlerts,
  dismissMissedAlert
};
