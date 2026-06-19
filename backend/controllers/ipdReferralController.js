const IpdReferral = require('../models/IpdReferral');
const Patient = require('../models/Patient');
const Consultation = require('../models/Consultation');

const tenantFilter = (req, query = {}) => (
  req.user.hospitalId ? { ...query, hospitalId: req.user.hospitalId } : query
);

// Helper to calculate age from DOB
const calcAge = (dob) => {
  if (!dob) return null;
  return Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
};

// @desc    Create an OPD-to-IPD referral (Send to IPD)
// @route   POST /api/ipd/referrals
// @access  Private (Doctor)
const createReferral = async (req, res) => {
  try {
    const { patientId, consultationId, notes } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Check if patient already has a pending referral
    const existingReferral = await IpdReferral.findOne(
      tenantFilter(req, { patientId, status: 'Pending' })
    );
    if (existingReferral) {
      return res.status(400).json({ message: 'This patient already has a pending IPD referral' });
    }

    // Load patient data
    const patient = await Patient.findOne(tenantFilter(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Load consultation data if provided
    let consultation = null;
    let diagnosis = '';
    let symptoms = [];
    if (consultationId) {
      consultation = await Consultation.findById(consultationId);
      if (consultation) {
        diagnosis = consultation.diagnosisRemark || '';
        symptoms = (consultation.symptoms || []).map(s => s.symptom).filter(Boolean);
      }
    } else {
      // Try to find the latest consultation for this patient
      const latestConsultation = await Consultation.findOne({ patientId }).sort({ createdAt: -1 });
      if (latestConsultation) {
        consultation = latestConsultation;
        diagnosis = latestConsultation.diagnosisRemark || '';
        symptoms = (latestConsultation.symptoms || []).map(s => s.symptom).filter(Boolean);
      }
    }

    const age = calcAge(patient.dob);

    const referral = new IpdReferral({
      hospitalId: req.user.hospitalId,
      patientId: patient._id,
      consultationId: consultation?._id || null,
      referredByDoctor: req.user._id,
      patientName: patient.patientName,
      uhid: patient.uhid,
      mobile: patient.mobile,
      gender: patient.gender,
      age,
      diagnosis,
      symptoms,
      notes: notes || '',
      status: 'Pending',
      referredAt: new Date()
    });

    await referral.save();

    res.status(201).json({ message: 'Patient referred to IPD successfully', referral });
  } catch (error) {
    console.error('Create Referral Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all pending OPD-to-IPD referrals
// @route   GET /api/ipd/referrals
// @access  Private
const getReferrals = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = tenantFilter(req);

    if (status) {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { patientName: regex },
        { uhid: regex },
        { mobile: regex }
      ];
    }

    const referrals = await IpdReferral.find(query)
      .populate('patientId', 'patientName uhid mobile dob gender')
      .populate('referredByDoctor', 'doctorName username')
      .populate('admissionId', 'ipdNumber pidNumber status')
      .sort({ referredAt: -1 });

    res.json(referrals);
  } catch (error) {
    console.error('Get Referrals Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single referral by ID
// @route   GET /api/ipd/referrals/:id
// @access  Private
const getReferralById = async (req, res) => {
  try {
    const referral = await IpdReferral.findOne(tenantFilter(req, { _id: req.params.id }))
      .populate('patientId', 'patientName uhid mobile dob gender address')
      .populate('referredByDoctor', 'doctorName username')
      .populate('admissionId', 'ipdNumber pidNumber status');

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    res.json(referral);
  } catch (error) {
    console.error('Get Referral Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update referral status (e.g., after admission)
// @route   PUT /api/ipd/referrals/:id
// @access  Private
const updateReferral = async (req, res) => {
  try {
    const { status, admissionId } = req.body;
    const referral = await IpdReferral.findOne(tenantFilter(req, { _id: req.params.id }));

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    if (status) referral.status = status;
    if (admissionId) {
      referral.admissionId = admissionId;
      referral.admittedAt = new Date();
    }

    await referral.save();
    res.json({ message: 'Referral updated', referral });
  } catch (error) {
    console.error('Update Referral Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel a referral
// @route   DELETE /api/ipd/referrals/:id
// @access  Private (Doctor or Admin)
const cancelReferral = async (req, res) => {
  try {
    const referral = await IpdReferral.findOne(tenantFilter(req, { _id: req.params.id }));

    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    if (referral.status === 'Admitted') {
      return res.status(400).json({ message: 'Cannot cancel an already admitted referral' });
    }

    referral.status = 'Cancelled';
    await referral.save();

    res.json({ message: 'Referral cancelled' });
  } catch (error) {
    console.error('Cancel Referral Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createReferral,
  getReferrals,
  getReferralById,
  updateReferral,
  cancelReferral
};