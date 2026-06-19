const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Consultation = require('../models/Consultation');

const tenantQuery = (req, extra = {}) => (
  req.user.hospitalId ? { ...extra, hospitalId: req.user.hospitalId } : extra
);

// @desc    Create a new digital prescription
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

    // Authorization: Doctors can only create prescriptions for their own patients
    if (req.user.role === 'doctor' && patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to create prescriptions for this patient' });
    }

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: 'Medicines list cannot be empty' });
    }

    // 1. Create or update Consultation if consultationData provided
    let consultation = null;
    if (consultationData) {
      consultation = await Consultation.findOne(tenantQuery(req, { patientId, doctorId })).sort({ createdAt: -1 });
      if (consultation) {
        Object.assign(consultation, consultationData, {
          consultationStatus: 'completed',
          consultationCompletedDate: new Date()
        });
        await consultation.save();
      } else {
        consultation = await Consultation.create(Object.assign({}, consultationData, {
          patientId,
          hospitalId: req.user.hospitalId,
          doctorId,
          consultationStatus: 'completed',
          consultationCompletedDate: new Date()
        }));
      }
    } else {
      // If no consultationData, try to mark the latest consultation for this patient as completed
      consultation = await Consultation.findOneAndUpdate(
        tenantQuery(req, { patientId, doctorId }),
        { consultationStatus: 'completed', consultationCompletedDate: new Date() },
        { sort: { createdAt: -1 }, new: true }
      );
    }

    // 2. Create Prescription
    let prescription = await Prescription.findOne(tenantQuery(req, { patientId, doctorId })).sort({ updatedAt: -1 });
    if (prescription) {
      prescription.medicines = medicines;
      prescription.language = language || 'English';
      prescription.pdfUrl = pdfUrl || '';
      await prescription.save();
    } else {
      prescription = await Prescription.create({
        patientId,
        hospitalId: req.user.hospitalId,
        doctorId,
        medicines,
        language: language || 'English',
        pdfUrl: pdfUrl || ''
      });
    }

    // 3. Update Patient record to mark consultation completed
    await Patient.findOneAndUpdate(tenantQuery(req, { _id: patientId }), {
      consultationStatus: 'completed',
      consultationCompletedDate: new Date()
    });

    res.status(201).json({ message: 'Prescription saved successfully', prescription, consultation });
  } catch (error) {
    console.error('Create Prescription Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get prescriptions for a patient
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

    // Authorization: Doctors can only access prescriptions for their own patients
    if (req.user.role === 'doctor' && patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to access prescriptions for this patient' });
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
