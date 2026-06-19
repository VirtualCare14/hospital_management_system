const IpdAdmission = require('../models/IpdAdmission');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const User = require('../models/User');
const IpdAdminSettings = require('../models/IpdAdminSettings');

// Helper to filter queries by hospitalId for multi-tenant isolation
const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// @desc    Admit a patient to a bed
// @route   POST /api/ipd/admit
// @access  Private
const admitPatient = async (req, res) => {
  try {
    const { patientId, roomId, bedId, doctorInCharge, admissionDate, status } = req.body;

    if (!patientId || !roomId || !bedId || !doctorInCharge) {
      return res.status(400).json({ message: 'Patient, room, bed, and doctor in charge are required' });
    }

    // 1. Verify patient exists
    const patient = await Patient.findOne(tenantFilter(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // 2. Check if patient is already admitted actively
    const activeAdmission = await IpdAdmission.findOne(tenantFilter(req, { 
      patientId, 
      status: { $ne: 'Discharged' } // Any status other than Discharged is considered active
    }));
    if (activeAdmission) {
      return res.status(400).json({ message: 'This patient is already actively admitted in the system' });
    }

    // 3. Verify doctor exists and is active
    const doctor = await User.findOne(tenantFilter(req, { _id: doctorInCharge, role: 'doctor', isActive: true }));
    if (!doctor) {
      return res.status(400).json({ message: 'Selected doctor is invalid or inactive' });
    }

    // 4. Verify bed exists, belongs to room
    const bed = await Bed.findOne(tenantFilter(req, { _id: bedId, roomId }));
    if (!bed) {
      return res.status(404).json({ message: 'Selected bed was not found in this room' });
    }

    if (bed.status === 'Occupied') {
      return res.status(400).json({ message: 'The selected bed is already occupied' });
    }

    // 5. Fetch settings and increment sequential counts atomically
    let settings = await IpdAdminSettings.findOneAndUpdate(
      { hospitalId: req.user.hospitalId },
      { $inc: { ipdCurrentNumber: 1, pidCurrentNumber: 1 } },
      { new: true, upsert: true }
    );

    // Get sequential values before the increment
    const ipdSeq = settings.ipdCurrentNumber - 1;
    const pidSeq = settings.pidCurrentNumber - 1;

    const currentYear = new Date().getFullYear();
    const formattedIpdNumber = `${settings.ipdPrefix || 'IPD'}${currentYear}${String(ipdSeq).padStart(6, '0')}`;
    const formattedPidNumber = `${settings.pidPrefix || 'PID'}${String(pidSeq).padStart(6, '0')}`;

    // 6. Create IPD Admission record
    const newAdmission = new IpdAdmission({
      hospitalId: req.user.hospitalId,
      patientId,
      roomId,
      bedId,
      doctorInCharge,
      admissionDate: admissionDate || new Date(),
      ipdNumber: formattedIpdNumber,
      pidNumber: formattedPidNumber,
      status: status || 'Admitted'
    });

    const savedAdmission = await newAdmission.save();

    // 7. Mark Bed as occupied
    bed.status = 'Occupied';
    bed.patientId = patientId;
    bed.admissionId = savedAdmission._id;
    bed.reservedAt = null;
    bed.reservedFor = null;
    await bed.save();

    res.status(201).json({ 
      message: 'Patient admitted successfully', 
      admission: savedAdmission 
    });
  } catch (error) {
    console.error('Admit Patient Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get active and historical admissions
// @route   GET /api/ipd/admissions
// @access  Private
const getAdmissions = async (req, res) => {
  try {
    const admissions = await IpdAdmission.find(tenantFilter(req))
      .populate('patientId', 'patientName uhid mobile dob gender')
      .populate('roomId', 'roomType')
      .populate('bedId', 'bedNumber bedType pricePerDay')
      .populate('doctorInCharge', 'doctorName username')
      .sort({ createdAt: -1 });

    res.status(200).json(admissions);
  } catch (error) {
    console.error('Get Admissions Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Discharge an admitted patient (frees the bed)
// @route   POST /api/ipd/admissions/:id/discharge
// @access  Private
const dischargePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: id }));
    if (!admission) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    if (admission.status === 'Discharged') {
      return res.status(400).json({ message: 'Patient has already been discharged' });
    }

    // Find the associated bed
    const bed = await Bed.findById(admission.bedId);
    if (bed) {
      // Free the bed
      bed.status = 'Available';
      bed.patientId = null;
      bed.admissionId = null;
      bed.reservedAt = null;
      bed.reservedFor = null;
      await bed.save();
    }

    // Update admission record
    admission.status = 'Discharged';
    admission.dischargeDate = new Date();
    await admission.save();

    res.status(200).json({ message: 'Patient discharged successfully and bed is now available' });
  } catch (error) {
    console.error('Discharge Patient Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  admitPatient,
  getAdmissions,
  dischargePatient
};
