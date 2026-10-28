const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Consultation = require('../models/Consultation');
const Visit = require('../models/Visit');

const tenantQuery = (req, extra = {}) => (
  req.user.hospitalId ? { ...extra, hospitalId: req.user.hospitalId } : extra
);

// @desc    Create a new digital prescription (ALWAYS creates new - never overwrites)
// @route   POST /api/prescription/create
// @access  Private
const createPrescription = async (req, res) => {
  try {
    if (!['doctor', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only authorized clinical staff or doctors can create prescriptions' });
    }

    const { patientId, medicines, language, pdfUrl, consultationData, consultationId: explicitConsId, visitId: explicitVisitId } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Check if patient exists
    const patient = await Patient.findOne(tenantQuery(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const IpdAdmission = require('../models/IpdAdmission');
    const latestIpdAdmission = await IpdAdmission.findOne(
      tenantQuery(req, { patientId: patient._id })
    ).sort({ createdAt: -1 });
    if (latestIpdAdmission?.status === 'Discharged') {
      return res.status(400).json({ message: 'Patient is discharged. No further actions can be performed.' });
    }

    if (!medicines || !Array.isArray(medicines)) {
      return res.status(400).json({ message: 'Medicines list is required' });
    }

    // 1. Identify or update associated Consultation
    let consultation = null;
    let consultationId = explicitConsId || null;

    if (consultationId) {
      consultation = await Consultation.findOne(tenantQuery(req, { _id: consultationId }));
    }

    if (!consultation && consultationData) {
      // Try to find the latest pending consultation for this patient
      consultation = await Consultation.findOne(
        tenantQuery(req, { patientId, consultationStatus: 'pending' })
      ).sort({ createdAt: -1 });
    }

    // Identify associated Visit
    const visitId = explicitVisitId || consultation?.visitId || null;
    let visit = null;
    if (visitId) {
      visit = await Visit.findOne(tenantQuery(req, { _id: visitId }));
    } else {
      visit = await Visit.findOne(tenantQuery(req, { patientId })).sort({ createdAt: -1 });
    }

    const isVisiting = Boolean(consultation?.isVisitingDoctor || visit?.isVisitingDoctor);
    const visitingScheduleId = isVisiting ? (consultation?.visitingScheduleId || visit?.visitingScheduleId || null) : null;
    const visitingDoctorName = isVisiting ? (consultation?.visitingDoctorName || visit?.visitingDoctorName || visit?.doctorName || '') : '';
    const finalDoctorId = isVisiting ? null : (visit?.doctorId || consultation?.doctorId || (req.user.role === 'doctor' ? req.user._id : null));

    if (consultation) {
      if (consultationData) {
        if (!consultationData.diagnosisRemark && consultation.diagnosisRemark) {
          consultationData.diagnosisRemark = consultation.diagnosisRemark;
        }
        if (consultationData.symptoms) consultation.symptoms = consultationData.symptoms;
        if (consultationData.generalPastHistory !== undefined) consultation.generalPastHistory = consultationData.generalPastHistory;
        if (consultationData.diagnosisRemark) consultation.diagnosisRemark = consultationData.diagnosisRemark;
        if (consultationData.vitals) consultation.vitals = consultationData.vitals;
        if (consultationData.tests) consultation.tests = consultationData.tests;
        if (consultationData.followUpDate) consultation.followUpDate = consultationData.followUpDate;
      }
      consultation.consultationStatus = 'completed';
      consultation.consultationCompletedDate = new Date();
      await consultation.save();
      consultationId = consultation._id;
    } else if (consultationData) {
      consultation = await Consultation.create({
        patientId,
        hospitalId: req.user.hospitalId,
        doctorId: finalDoctorId,
        isVisitingDoctor: isVisiting,
        visitingScheduleId,
        visitingDoctorName,
        conductedBy: req.user._id,
        conductedByName: req.user.doctorName || req.user.username || '',
        visitId: visit?._id || visitId || null,
        symptoms: consultationData.symptoms || [],
        generalPastHistory: consultationData.generalPastHistory || '',
        diagnosisRemark: consultationData.diagnosisRemark || '',
        vitals: consultationData.vitals || {},
        tests: consultationData.tests || [],
        followUpDate: consultationData.followUpDate || '',
        consultationStatus: 'completed',
        consultationCompletedDate: new Date(),
        consultationDateTime: new Date()
      });
      consultationId = consultation._id;
    }

    // 2. ALWAYS create a NEW Prescription record (never update existing)
    const diagnosisRemark = consultationData?.diagnosisRemark || consultation?.diagnosisRemark || '';
    const patientAdvice = consultationData?.patientAdvice || consultation?.patientAdvice || '';

    const prescription = await Prescription.create({
      patientId,
      hospitalId: req.user.hospitalId,
      doctorId: finalDoctorId,
      isVisitingDoctor: isVisiting,
      visitingScheduleId,
      visitingDoctorName,
      prescribedBy: req.user._id,
      prescribedByName: req.user.doctorName || req.user.username || '',
      consultationId: consultationId || null,
      visitId: visit?._id || visitId || null,
      medicines,
      diagnosisRemark,
      patientAdvice,
      language: language || 'English',
      pdfUrl: pdfUrl || '',
      prescriptionDateTime: new Date()
    });

    // 3. Update Visit record to mark consultation as completed
    if (visit) {
      visit.consultationStatus = 'completed';
      visit.consultationCompletedDate = new Date();
      await visit.save();
    } else if (visitId) {
      await Visit.updateOne(
        tenantQuery(req, { _id: visitId }),
        { consultationStatus: 'completed', consultationCompletedDate: new Date() }
      );
    } else {
      await Visit.findOneAndUpdate(
        tenantQuery(req, { patientId, consultationStatus: 'pending' }),
        { consultationStatus: 'completed', consultationCompletedDate: new Date() },
        { sort: { createdAt: -1 } }
      );
    }

    res.status(201).json({ 
      message: 'Prescription saved successfully', 
      prescription, 
      consultation 
    });
  } catch (error) {
    console.error('Create Prescription Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get prescriptions for a patient (ALL records)
// @route   GET /api/prescription/:patientId
// @access  Private
const getPrescriptionsByPatientId = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // Verify patient exists
    const patient = await Patient.findOne(tenantQuery(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const prescriptions = await Prescription.find(tenantQuery(req, { patientId }))
      .populate('doctorId', 'doctorName username department')
      .sort({ createdAt: -1 });

    res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Get Prescriptions Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPrescription,
  getPrescriptionsByPatientId
};