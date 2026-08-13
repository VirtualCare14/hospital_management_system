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
const IpdReferral = require('../models/IpdReferral');
const Consultation = require('../models/Consultation');

const getDoctorAdmissionFilter = async (hospitalId, targetDoctorId) => {
  const hospitalQuery = hospitalId ? { hospitalId } : {};

  const referrals = await IpdReferral.find({
    ...hospitalQuery,
    referredByDoctor: targetDoctorId
  }).select('admissionId patientId');

  const referredAdmissionIds = referrals.map(r => r.admissionId).filter(Boolean);
  const referredPatientIdsFromReferral = referrals.map(r => r.patientId).filter(Boolean);

  const consultations = await Consultation.find({
    ...hospitalQuery,
    doctorId: targetDoctorId
  }).select('patientId');

  const referredPatientIdsFromConsultation = consultations.map(c => c.patientId).filter(Boolean);

  const allReferredPatientIds = [
    ...new Set([
      ...referredPatientIdsFromReferral.map(id => id.toString()),
      ...referredPatientIdsFromConsultation.map(id => id.toString())
    ])
  ];

  return {
    $or: [
      { doctorInCharge: targetDoctorId },
      { referredDoctor: targetDoctorId },
      { _id: { $in: referredAdmissionIds } },
      { patientId: { $in: allReferredPatientIds } }
    ]
  };
};

// @desc    Admit a patient to a bed
// @route   POST /api/ipd/admit
// @access  Private
const admitPatient = async (req, res) => {
  try {
    const { patientId, roomId, bedId, doctorInCharge, referredDoctor, admissionDate, status, isSameDayCare, provisionalDiagnosis } = req.body;

    if (!patientId || !doctorInCharge) {
      return res.status(400).json({ message: 'Patient and doctor in charge are required' });
    }

    if ((roomId && !bedId) || (!roomId && bedId)) {
      return res.status(400).json({ message: 'Both room and bed are required for allocation' });
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
    const doctor = await User.findOne(tenantFilter(req, { _id: doctorInCharge, role: { $in: ['doctor', 'nursing', 'admin'] } }));
    if (!doctor) {
      return res.status(400).json({ message: 'Selected consultant doctor is invalid' });
    }

    // Check for pending referral for this patient to auto-populate referredDoctor if not provided
    let finalReferredDoctor = referredDoctor || null;
    const pendingReferral = await IpdReferral.findOne(tenantFilter(req, {
      patientId,
      status: 'Pending'
    })).sort({ createdAt: -1 });

    if (pendingReferral && !finalReferredDoctor) {
      finalReferredDoctor = pendingReferral.referredByDoctor;
    }

    // 4. Verify bed exists, belongs to room (only if provided)
    let bed = null;
    if (bedId && roomId) {
      bed = await Bed.findOne(tenantFilter(req, { _id: bedId, roomId }));
      if (!bed) {
        return res.status(404).json({ message: 'Selected bed was not found in this room' });
      }

      if (bed.status === 'Occupied') {
        return res.status(400).json({ message: 'The selected bed is already occupied' });
      }
    }

    // 5. Fetch settings and increment sequential counts atomically
    let settings = await IpdAdminSettings.findOneAndUpdate(
      { hospitalId: req.user.hospitalId },
      { $inc: { ipdCurrentNumber: 1, pidCurrentNumber: 1 } },
      { returnDocument: 'after', upsert: true }
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
      roomId: roomId || null,
      bedId: bedId || null,
      doctorInCharge,
      referredDoctor: finalReferredDoctor,
      admissionDate: admissionDate || new Date(),
      ipdNumber: formattedIpdNumber,
      pidNumber: formattedPidNumber,
      status: status || (bedId ? 'Admitted' : 'Pending Allocation'),
      isSameDayCare: !!isSameDayCare,
      provisionalDiagnosis: provisionalDiagnosis || '',
      bedHistory: (bedId && roomId && bed) ? [{
        roomId: roomId,
        bedId: bedId,
        startDate: admissionDate || new Date(),
        pricePerDay: bed.pricePerDay || 0
      }] : []
    });

    const savedAdmission = await newAdmission.save();

    // Link and update pending referral if any
    if (pendingReferral) {
      pendingReferral.status = 'Admitted';
      pendingReferral.admissionId = savedAdmission._id;
      pendingReferral.admittedAt = new Date();
      await pendingReferral.save();
    }

    // 7. Mark Bed as occupied
    if (bed) {
      bed.status = 'Occupied';
      bed.patientId = patientId;
      bed.admissionId = savedAdmission._id;
      bed.reservedAt = null;
      bed.reservedFor = null;
      await bed.save();
    }

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
    let query = tenantFilter(req);

    const targetDoctorId = req.query.doctorId || (req.user?.role === 'doctor' ? req.user._id : null);
    if (targetDoctorId) {
      const doctorFilter = await getDoctorAdmissionFilter(req.user.hospitalId, targetDoctorId);
      query = {
        $and: [
          query,
          doctorFilter
        ]
      };
    }

    const admissions = await IpdAdmission.find(query)
      .populate('patientId', 'patientName uhid mobile dob gender')
      .populate('roomId', 'roomType')
      .populate('bedId', 'bedNumber bedType pricePerDay')
      .populate('doctorInCharge', 'doctorName username')
      .populate('referredDoctor', 'doctorName username')
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
    if (admission.bedHistory && admission.bedHistory.length > 0) {
      const lastIndex = admission.bedHistory.length - 1;
      if (!admission.bedHistory[lastIndex].endDate) {
        admission.bedHistory[lastIndex].endDate = admission.dischargeDate;
      }
    }
    await admission.save();

    res.status(200).json({ message: 'Patient discharged successfully and bed is now available' });
  } catch (error) {
    console.error('Discharge Patient Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Allocate a bed to a pending IPD admission
// @route   PUT /api/ipd/admissions/:id/allocate-bed
// @access  Private
const allocateBed = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomId, bedId } = req.body;

    if (!roomId || !bedId) {
      return res.status(400).json({ message: 'Room and Bed are required' });
    }

    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: id }));
    if (!admission) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    if (admission.status === 'Discharged') {
      return res.status(400).json({ message: 'Cannot allocate bed for a discharged patient' });
    }

    // Verify bed exists and is available
    const bed = await Bed.findOne(tenantFilter(req, { _id: bedId, roomId }));
    if (!bed) {
      return res.status(404).json({ message: 'Selected bed was not found in this room' });
    }

    if (bed.status === 'Occupied') {
      return res.status(400).json({ message: 'The selected bed is already occupied' });
    }

    // Allocate the bed to the admission
    admission.roomId = roomId;
    admission.bedId = bedId;
    admission.status = 'Admitted';
    admission.bedHistory = [{
      roomId,
      bedId,
      startDate: admission.admissionDate || new Date(),
      pricePerDay: bed.pricePerDay || 0
    }];
    await admission.save();

    // Mark bed as occupied
    bed.status = 'Occupied';
    bed.patientId = admission.patientId;
    bed.admissionId = admission._id;
    await bed.save();

    res.status(200).json({
      message: 'Bed allocated successfully',
      admission
    });
  } catch (error) {
    console.error('Allocate Bed Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change a bed for an IPD admission
const changeBed = async (req, res) => {
  try {
    const { id } = req.params;
    const { newRoomId, newBedId } = req.body;

    if (!newRoomId || !newBedId) {
      return res.status(400).json({ message: 'New room and new bed are required' });
    }

    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: id }));
    if (!admission) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    if (admission.status === 'Discharged') {
      return res.status(400).json({ message: 'Cannot change bed for a discharged patient' });
    }

    // Verify the new bed exists and is available
    const newBed = await Bed.findOne(tenantFilter(req, { _id: newBedId, roomId: newRoomId }));
    if (!newBed) {
      return res.status(404).json({ message: 'Selected new bed was not found in the new room' });
    }

    if (newBed.status === 'Occupied') {
      return res.status(400).json({ message: 'The selected new bed is already occupied' });
    }

    // 1. Release the current bed
    if (admission.bedId) {
      const currentBed = await Bed.findById(admission.bedId);
      if (currentBed) {
        currentBed.status = 'Available';
        currentBed.patientId = null;
        currentBed.admissionId = null;
        await currentBed.save();
      }
    }

    // 2. Update the active bedHistory entry
    const now = new Date();
    let updatedHistory = false;
    if (admission.bedHistory && admission.bedHistory.length > 0) {
      const lastIndex = admission.bedHistory.length - 1;
      if (!admission.bedHistory[lastIndex].endDate) {
        admission.bedHistory[lastIndex].endDate = now;
        updatedHistory = true;
      }
    }

    // If bedHistory was empty, populate it first
    if (!updatedHistory && admission.bedId) {
      const oldBed = await Bed.findById(admission.bedId);
      admission.bedHistory = [{
        roomId: admission.roomId,
        bedId: admission.bedId,
        startDate: admission.admissionDate,
        endDate: now,
        pricePerDay: oldBed ? oldBed.pricePerDay : 0
      }];
    }

    // 3. Mark the new bed as occupied
    newBed.status = 'Occupied';
    newBed.patientId = admission.patientId;
    newBed.admissionId = admission._id;
    await newBed.save();

    // 4. Add the new bed to history
    admission.bedHistory.push({
      roomId: newRoomId,
      bedId: newBedId,
      startDate: now,
      pricePerDay: newBed.pricePerDay
    });

    // 5. Update current bed/room references on admission
    admission.roomId = newRoomId;
    admission.bedId = newBedId;
    
    await admission.save();

    res.status(200).json({
      message: 'Bed changed successfully',
      admission
    });
  } catch (error) {
    console.error('Change Bed Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update admission date & time of an IPD patient (admitted or discharged/bill generated)
// @route   PUT /api/ipd/admissions/:id/admission-date
// @access  Private
const updateAdmissionDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { admissionDate } = req.body;

    if (!admissionDate) {
      return res.status(400).json({ message: 'Admission date and time is required' });
    }

    const newDate = new Date(admissionDate);
    if (isNaN(newDate.getTime())) {
      return res.status(400).json({ message: 'Invalid admission date and time format' });
    }

    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: id }));
    if (!admission) {
      return res.status(404).json({ message: 'IPD admission record not found' });
    }

    admission.admissionDate = newDate;

    // Synchronize initial bed history entry if present
    if (admission.bedHistory && admission.bedHistory.length > 0) {
      admission.bedHistory[0].startDate = newDate;
    }

    await admission.save();

    // Update related discharge records if any exist
    const IpdDischarge = require('../models/IpdDischarge');
    await IpdDischarge.updateMany(
      { admissionId: admission._id },
      { $set: { admissionDate: newDate } }
    );

    // Update related OT records if any exist
    const IpdOtRecord = require('../models/IpdOtRecord');
    await IpdOtRecord.updateMany(
      { admissionId: admission._id },
      { $set: { admissionDate: newDate } }
    );

    res.status(200).json({
      message: 'Admission date and time updated successfully',
      admission
    });
  } catch (error) {
    console.error('Update Admission Date Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  admitPatient,
  getAdmissions,
  dischargePatient,
  allocateBed,
  changeBed,
  updateAdmissionDate
};

