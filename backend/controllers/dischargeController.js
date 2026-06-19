const IpdDischarge = require('../models/IpdDischarge');
const IpdAdmission = require('../models/IpdAdmission');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const HospitalSettings = require('../models/HospitalSettings');

// Helper to filter queries by hospitalId for multi-tenant isolation
const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// @desc    Create a new Discharge record (Save Draft)
// @route   POST /api/ipd/discharge
// @access  Private
const createDischarge = async (req, res) => {
  try {
    const {
      admissionId, patientId, uhid, pidNumber, ipdNumber,
      patientName, admissionDate, reason,
      diagnosisAtInternment, treatmentSummary,
      dischargeDate, dischargeTime,
      physicianApproval, dischargeReason, otherDischargeReason,
      futureTreatmentRequired, medicationPrescribed,
      dischargingPhysicianTitle, dischargingPhysicianFirstName,
      dischargingPhysicianMiddleName, dischargingPhysicianLastName,
      dischargingPhysicianInitials,
      status
    } = req.body;

    if (!admissionId || !patientId) {
      return res.status(400).json({ message: 'Admission ID and Patient ID are required' });
    }

    // Verify admission exists
    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: admissionId }));
    if (!admission) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    if (admission.status === 'Discharged') {
      return res.status(400).json({ message: 'Patient has already been discharged' });
    }

    const recordStatus = status === 'Completed' ? 'Completed' : 'Draft';

    const discharge = new IpdDischarge({
      hospitalId: req.user.hospitalId,
      admissionId,
      patientId,
      uhid: uhid || '',
      pidNumber: pidNumber || '',
      ipdNumber: ipdNumber || '',
      patientName: patientName || '',
      admissionDate: admissionDate || null,
      reason: reason || '',
      diagnosisAtInternment: diagnosisAtInternment || '',
      treatmentSummary: treatmentSummary || '',
      dischargeDate: dischargeDate || new Date(),
      dischargeTime: dischargeTime || '',
      physicianApproval: physicianApproval || '',
      dischargeReason: dischargeReason || '',
      otherDischargeReason: otherDischargeReason || '',
      futureTreatmentRequired: futureTreatmentRequired || '',
      medicationPrescribed: medicationPrescribed || '',
      dischargingPhysicianTitle: dischargingPhysicianTitle || '',
      dischargingPhysicianFirstName: dischargingPhysicianFirstName || '',
      dischargingPhysicianMiddleName: dischargingPhysicianMiddleName || '',
      dischargingPhysicianLastName: dischargingPhysicianLastName || '',
      dischargingPhysicianInitials: dischargingPhysicianInitials || '',
      status: recordStatus,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    const saved = await discharge.save();
    res.status(201).json({ message: 'Discharge record saved successfully', record: saved });
  } catch (error) {
    console.error('Create Discharge Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Complete Discharge - saves record, updates admission status, frees bed
// @route   POST /api/ipd/discharge/complete
// @access  Private
const completeDischarge = async (req, res) => {
  try {
    const {
      admissionId, patientId, uhid, pidNumber, ipdNumber,
      patientName, admissionDate, reason,
      diagnosisAtInternment, treatmentSummary,
      dischargeDate, dischargeTime,
      physicianApproval, dischargeReason, otherDischargeReason,
      futureTreatmentRequired, medicationPrescribed,
      dischargingPhysicianTitle, dischargingPhysicianFirstName,
      dischargingPhysicianMiddleName, dischargingPhysicianLastName,
      dischargingPhysicianInitials,
      dischargeId // if updating existing draft
    } = req.body;

    if (!admissionId || !patientId) {
      return res.status(400).json({ message: 'Admission ID and Patient ID are required' });
    }

    if (!physicianApproval || physicianApproval !== 'Yes') {
      return res.status(400).json({ message: 'Physician approval is required to complete discharge' });
    }

    if (!dischargeReason) {
      return res.status(400).json({ message: 'Discharge reason is required' });
    }

    // Verify admission exists
    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: admissionId }));
    if (!admission) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    if (admission.status === 'Discharged') {
      return res.status(400).json({ message: 'Patient has already been discharged' });
    }

    const now = new Date();
    const dischargeDateTime = dischargeDate ? new Date(dischargeDate) : now;
    const dischargeTimeStr = dischargeTime || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    // 1. Create or update the discharge record
    let discharge;
    if (dischargeId) {
      discharge = await IpdDischarge.findOne(tenantFilter(req, { _id: dischargeId }));
      if (!discharge) {
        return res.status(404).json({ message: 'Discharge record not found' });
      }
      Object.assign(discharge, {
        patientName: patientName || discharge.patientName,
        admissionDate: admissionDate || discharge.admissionDate,
        reason: reason || discharge.reason,
        diagnosisAtInternment: diagnosisAtInternment || discharge.diagnosisAtInternment,
        treatmentSummary: treatmentSummary || discharge.treatmentSummary,
        dischargeDate: dischargeDateTime,
        dischargeTime: dischargeTimeStr,
        physicianApproval: physicianApproval || discharge.physicianApproval,
        dischargeReason: dischargeReason || discharge.dischargeReason,
        otherDischargeReason: otherDischargeReason || discharge.otherDischargeReason,
        futureTreatmentRequired: futureTreatmentRequired || discharge.futureTreatmentRequired,
        medicationPrescribed: medicationPrescribed || discharge.medicationPrescribed,
        dischargingPhysicianTitle: dischargingPhysicianTitle || discharge.dischargingPhysicianTitle,
        dischargingPhysicianFirstName: dischargingPhysicianFirstName || discharge.dischargingPhysicianFirstName,
        dischargingPhysicianMiddleName: dischargingPhysicianMiddleName || discharge.dischargingPhysicianMiddleName,
        dischargingPhysicianLastName: dischargingPhysicianLastName || discharge.dischargingPhysicianLastName,
        dischargingPhysicianInitials: dischargingPhysicianInitials || discharge.dischargingPhysicianInitials,
        status: 'Completed',
        updatedBy: req.user._id
      });
    } else {
      discharge = new IpdDischarge({
        hospitalId: req.user.hospitalId,
        admissionId,
        patientId,
        uhid: uhid || '',
        pidNumber: pidNumber || '',
        ipdNumber: ipdNumber || '',
        patientName: patientName || '',
        admissionDate: admissionDate || null,
        reason: reason || '',
        diagnosisAtInternment: diagnosisAtInternment || '',
        treatmentSummary: treatmentSummary || '',
        dischargeDate: dischargeDateTime,
        dischargeTime: dischargeTimeStr,
        physicianApproval: physicianApproval || '',
        dischargeReason: dischargeReason || '',
        otherDischargeReason: otherDischargeReason || '',
        futureTreatmentRequired: futureTreatmentRequired || '',
        medicationPrescribed: medicationPrescribed || '',
        dischargingPhysicianTitle: dischargingPhysicianTitle || '',
        dischargingPhysicianFirstName: dischargingPhysicianFirstName || '',
        dischargingPhysicianMiddleName: dischargingPhysicianMiddleName || '',
        dischargingPhysicianLastName: dischargingPhysicianLastName || '',
        dischargingPhysicianInitials: dischargingPhysicianInitials || '',
        status: 'Completed',
        createdBy: req.user._id,
        updatedBy: req.user._id
      });
    }

    const savedDischarge = await discharge.save();

    // 2. Update admission status to Discharged
    admission.status = 'Discharged';
    admission.dischargeDate = dischargeDateTime;
    await admission.save();

    // 3. Find and free the bed
    if (admission.bedId) {
      const bed = await Bed.findById(admission.bedId);
      if (bed) {
        bed.status = 'Available';
        bed.patientId = null;
        bed.admissionId = null;
        bed.reservedAt = null;
        bed.reservedFor = null;
        await bed.save();
      }
    }

    res.json({
      message: 'Patient discharged successfully',
      record: savedDischarge,
      admission: {
        status: admission.status,
        dischargeDate: admission.dischargeDate
      }
    });
  } catch (error) {
    console.error('Complete Discharge Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a discharge record (draft)
// @route   PUT /api/ipd/discharge/:id
// @access  Private
const updateDischarge = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const record = await IpdDischarge.findOne(tenantFilter(req, { _id: id }));
    if (!record) {
      return res.status(404).json({ message: 'Discharge record not found' });
    }

    if (record.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot update a completed discharge record' });
    }

    const updatableFields = [
      'patientName', 'admissionDate', 'reason',
      'diagnosisAtInternment', 'treatmentSummary',
      'dischargeDate', 'dischargeTime',
      'physicianApproval', 'dischargeReason', 'otherDischargeReason',
      'futureTreatmentRequired', 'medicationPrescribed',
      'dischargingPhysicianTitle', 'dischargingPhysicianFirstName',
      'dischargingPhysicianMiddleName', 'dischargingPhysicianLastName',
      'dischargingPhysicianInitials', 'status', 'uhid', 'pidNumber', 'ipdNumber'
    ];

    updatableFields.forEach(field => {
      if (updateData[field] !== undefined) {
        record[field] = updateData[field];
      }
    });

    record.updatedBy = req.user._id;
    const updated = await record.save();

    res.json({ message: 'Discharge record updated successfully', record: updated });
  } catch (error) {
    console.error('Update Discharge Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all discharge records for an admission
// @route   GET /api/ipd/discharge/admission/:admissionId
// @access  Private
const getDischargesByAdmission = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const records = await IpdDischarge.find(
      tenantFilter(req, { admissionId })
    )
      .populate('createdBy', 'username doctorName')
      .populate('updatedBy', 'username doctorName')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error('Get Discharges Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all discharge records for a patient
// @route   GET /api/ipd/discharge/patient/:patientId
// @access  Private
const getDischargesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await IpdDischarge.find(
      tenantFilter(req, { patientId })
    )
      .populate('createdBy', 'username doctorName')
      .populate('updatedBy', 'username doctorName')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error('Get Patient Discharges Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single discharge record by ID
// @route   GET /api/ipd/discharge/:id
// @access  Private
const getDischargeById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await IpdDischarge.findOne(tenantFilter(req, { _id: id }))
      .populate('createdBy', 'username doctorName')
      .populate('updatedBy', 'username doctorName');

    if (!record) {
      return res.status(404).json({ message: 'Discharge record not found' });
    }

    res.json(record);
  } catch (error) {
    console.error('Get Discharge Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check if patient is discharged (for frontend validation)
// @route   GET /api/ipd/discharge/check/:admissionId
// @access  Private
const checkDischargeStatus = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const admission = await IpdAdmission.findOne(tenantFilter(req, { _id: admissionId }));
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }
    res.json({
      isDischarged: admission.status === 'Discharged',
      status: admission.status,
      dischargeDate: admission.dischargeDate || null
    });
  } catch (error) {
    console.error('Check Discharge Status Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createDischarge,
  completeDischarge,
  updateDischarge,
  getDischargesByAdmission,
  getDischargesByPatient,
  getDischargeById,
  checkDischargeStatus
};