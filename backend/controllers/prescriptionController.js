const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Consultation = require('../models/Consultation');

const tenantQuery = (req, extra = {}) => (
  req.user.hospitalId ? { ...extra, hospitalId: req.user.hospitalId } : extra
);

// @desc    Create a new digital prescription (ALWAYS creates new - never overwrites)
// @route   POST /api/prescription/create
// @access  Private
const createPrescription = async (req, res) => {
  try {
    const { patientId, medicines, language, pdfUrl, consultationData } = req.body;
    const doctorId = req.user._id;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Check if patient exists
    const patient = await Patient.findOne(tenantQuery(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: 'Medicines list cannot be empty' });
    }

    // 1. Find the latest pending consultation OR the latest consultation to mark completed
    let consultation = null;
    let consultationId = null;

    if (consultationData) {
      // Find the LATEST consultation (pending or not) for this patient+doctor
      consultation = await Consultation.findOne(
        tenantQuery(req, { patientId, doctorId })
      ).sort({ createdAt: -1 });

      if (consultation) {
        // Save the original diagnosis remark from consultation if not provided in prescription
        if (!consultationData.diagnosisRemark && consultation.diagnosisRemark) {
          consultationData.diagnosisRemark = consultation.diagnosisRemark;
        }
        
        consultation.consultationStatus = 'completed';
        consultation.consultationCompletedDate = new Date();
        if (consultationData.symptoms) consultation.symptoms = consultationData.symptoms;
        if (consultationData.generalPastHistory !== undefined) consultation.generalPastHistory = consultationData.generalPastHistory;
        if (consultationData.diagnosisRemark) consultation.diagnosisRemark = consultationData.diagnosisRemark;
        if (consultationData.vitals) consultation.vitals = consultationData.vitals;
        if (consultationData.tests) consultation.tests = consultationData.tests;
        if (consultationData.followUpDate) consultation.followUpDate = consultationData.followUpDate;
        await consultation.save();
        consultationId = consultation._id;
      } else {
        consultation = await Consultation.create({
          patientId,
          hospitalId: req.user.hospitalId,
          doctorId,
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
    } else {
      // If no consultationData, try to mark the latest consultation as completed
      consultation = await Consultation.findOneAndUpdate(
        tenantQuery(req, { patientId, doctorId, consultationStatus: 'pending' }),
        { 
          consultationStatus: 'completed', 
          consultationCompletedDate: new Date(),
          consultationDateTime: new Date()
        },
        { sort: { createdAt: -1 }, new: true }
      );
      if (consultation) {
        consultationId = consultation._id;
      }
    }

    // 2. ALWAYS create a NEW Prescription record (never update existing)
    // Get the visitId from consultation if available
    const visitId = consultation ? consultation.visitId : null;
    
    // Get diagnosis remark from consultation if not explicitly provided
    const diagnosisRemark = consultationData?.diagnosisRemark || consultation?.diagnosisRemark || '';

    const prescription = await Prescription.create({
      patientId,
      hospitalId: req.user.hospitalId,
      doctorId,
      consultationId: consultationId,
      visitId: visitId,
      medicines,
      diagnosisRemark,
      language: language || 'English',
      pdfUrl: pdfUrl || '',
      prescriptionDateTime: new Date() // Auto capture system timestamp
    });

    // 3. Update Visit records to mark consultation as completed
    if (consultationId) {
      await Consultation.updateMany(
        tenantQuery(req, { patientId, doctorId, _id: consultationId }),
        { consultationStatus: 'completed', consultationCompletedDate: new Date() }
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