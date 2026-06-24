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

// Helper for adding timeline activities
const addTimeline = async (req, admissionId, patientId, activity, description) => {
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
    performedByName: req.user.doctorName || req.user.username || 'System'
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
      doctorRemark
    } = req.body;

    if (!admissionId || !medicineName || !dose || !route || !frequency) {
      return res.status(400).json({ message: 'Admission ID, medicine name, dose, route, and frequency are required' });
    }

    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: admissionId }));
    if (!admission) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    const { dateStr, timeStr } = getCurrentDateTimeStrings();

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
      `Ordered medicine: ${medicineName} (${dose}, ${route}, ${frequency}) by Dr. ${req.user.doctorName || req.user.username}`
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
      doctorRemark
    } = req.body;

    const order = await IpdMedicationOrder.findOne(tenantFilter(req, { _id: orderId }));
    if (!order) {
      return res.status(404).json({ message: 'Medication order not found' });
    }

    if (order.status === 'Stopped') {
      return res.status(400).json({ message: 'Cannot modify a stopped medication order' });
    }

    const { dateStr, timeStr } = getCurrentDateTimeStrings();

    order.medicineName = medicineName || order.medicineName;
    order.dose = dose || order.dose;
    order.route = route || order.route;
    order.frequency = frequency || order.frequency;
    order.morning = morning !== undefined ? !!morning : order.morning;
    order.afternoon = afternoon !== undefined ? !!afternoon : order.afternoon;
    order.evening = evening !== undefined ? !!evening : order.evening;
    order.night = night !== undefined ? !!night : order.night;
    order.doctorRemark = doctorRemark !== undefined ? doctorRemark : order.doctorRemark;
    
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
      `Updated medicine details: ${order.medicineName} by Dr. ${req.user.doctorName || req.user.username}`
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
      `Stopped medicine: ${order.medicineName} by Dr. ${req.user.doctorName || req.user.username}`
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
const createAdministrationRecord = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'ipd' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Only IPD staff or admins can administer medications' });
    }

    const { orderId } = req.params;
    const { status, remarks, shift } = req.body;

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

    const administration = await IpdMedicationAdministration.create({
      hospitalId: req.user.hospitalId,
      admissionId: order.admissionId,
      orderId: order._id,
      medicineName: order.medicineName,
      nurseId: req.user._id,
      nurseName: req.user.doctorName || req.user.username,
      status,
      shift,
      remarks: remarks || '',
      date: dateStr,
      time: timeStr
    });

    await addTimeline(
      req,
      order.admissionId,
      order.patientId,
      'Medication Administered',
      `Medication ${order.medicineName} marked as ${status} (Shift: ${shift}) by ${req.user.doctorName || req.user.username} ${remarks ? `(${remarks})` : ''}`
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
    if (role !== 'ipd' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Only IPD staff or admins can modify administration logs' });
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
      'Medication Administered', // keeping activity type standard so it passes filters
      `Updated medication log for ${adminRecord.medicineName}: changed status from ${oldStatus} to ${adminRecord.status} (Shift: ${adminRecord.shift}) by ${req.user.doctorName || req.user.username}`
    );

    res.status(200).json({ message: 'Administration record updated successfully', administration: adminRecord });
  } catch (error) {
    console.error('Update Administration Error:', error);
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
  updateAdministrationRecord
};
