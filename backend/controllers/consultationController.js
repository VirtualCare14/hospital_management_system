const Consultation = require('../models/Consultation');
const Symptom = require('../models/Symptom');
const LabRequest = require('../models/LabRequest');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const Visit = require('../models/Visit');

const tenantQuery = (req, extra = {}) => (
  req.user.hospitalId ? { ...extra, hospitalId: req.user.hospitalId } : extra
);

// Helper to build patient display object from visit + patient data
const buildPatientData = (visit) => {
  if (!visit || !visit.patientId) return null;
  const pat = visit.patientId;
  const patientObj = pat._doc || pat;
  return {
    _id: pat._id || patientObj._id,
    visitId: visit._id,
    uhid: visit.uhid || patientObj.uhid,
    patientName: patientObj.patientName,
    mobile: patientObj.mobile,
    gender: patientObj.gender,
    dob: patientObj.dob,
    department: visit.department || patientObj.department || '',
    doctorId: visit.doctorId || patientObj.doctorId || null,
    appointmentDate: visit.appointmentDate || '',
    slot: visit.slot || '',
    consultationStatus: visit.consultationStatus || 'pending',
    createdAt: visit.createdAt || patientObj.createdAt
  };
};

// @desc    Create a new consultation (ALWAYS creates a new record - no overwrite)
// @route   POST /api/consultation/create
// @access  Private
const createConsultation = async (req, res) => {
  try {
    const {
      patientId,
      visitId,
      symptoms,
      pastHistory,
      diagnosisRemark,
      vitals,
      tests,
      sendToLab,
      collectionType,
      collectionTime,
      bookingDate,
      followUpDate
    } = req.body;

    const doctorId = req.user._id;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Verify patient exists
    const patient = await Patient.findOne(tenantQuery(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // 1. Save new symptoms to the Symptom autocomplete index
    if (symptoms && Array.isArray(symptoms)) {
      for (const item of symptoms) {
        if (item.symptom && item.symptom.trim() !== '') {
          const symptomName = item.symptom.trim().toLowerCase();
          await Symptom.findOneAndUpdate(
            { name: symptomName },
            { name: symptomName },
            { upsert: true, new: true }
          );
        }
      }
    }

    // 2. ALWAYS create a NEW Consultation record (never overwrite)
    const consultation = await Consultation.create({
      patientId,
      hospitalId: req.user.hospitalId,
      doctorId,
      visitId: visitId || null,
      symptoms,
      generalPastHistory: pastHistory,
      diagnosisRemark,
      vitals,
      tests: tests || [],
      followUpDate,
      consultationDateTime: new Date() // Auto capture system timestamp
    });

    // 3. Create Lab Request entries if tests are assigned and sendToLab is checked
    if (tests && Array.isArray(tests) && tests.length > 0 && sendToLab) {
      const requests = tests.map((test) => {
        const isHomeCollection = collectionType === 'Home Sample Collection';
        return {
          patientId,
          hospitalId: req.user.hospitalId,
          doctorId,
          tests: [test],
          status: isHomeCollection ? 'assigned' : 'pending',
          sampleStatus: isHomeCollection ? 'Home Sample Assigned' : 'Not Collected',
          reportStatus: 'Pending',
          collectionType: collectionType || 'Lab Visit',
          collectionTime: collectionTime || '',
          bookingDate: bookingDate || new Date(),
          remarks: isHomeCollection ? 'Home Collection Requested' : '',
          statusHistory: [{
            status: isHomeCollection ? 'Home Sample Assigned' : 'Not Collected',
            assistantName: 'System',
            notes: isHomeCollection ? 'Home sample collection request created' : 'Lab request created'
          }]
        };
      });
      await Promise.all(requests.map((request) => new LabRequest(request).save()));
    }

    res.status(201).json({ message: 'Consultation saved successfully', consultation });
  } catch (error) {
    console.error('Create Consultation Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update an existing consultation
// @route   PUT /api/consultation/:id
// @access  Private
const updateConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;

    let consultation = await Consultation.findOne(tenantQuery(req, { 
      _id: id, 
      doctorId 
    }));

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const {
      symptoms,
      pastHistory,
      diagnosisRemark,
      vitals,
      tests,
      followUpDate
    } = req.body;

    if (symptoms !== undefined) consultation.symptoms = symptoms;
    if (pastHistory !== undefined) consultation.generalPastHistory = pastHistory;
    if (diagnosisRemark !== undefined) consultation.diagnosisRemark = diagnosisRemark;
    if (vitals !== undefined) consultation.vitals = vitals;
    if (tests !== undefined) consultation.tests = tests;
    if (followUpDate !== undefined) consultation.followUpDate = followUpDate;
    
    await consultation.save();

    res.json({ message: 'Consultation updated successfully', consultation });
  } catch (error) {
    console.error('Update Consultation Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get consultations for a patient
// @route   GET /api/consultation/:patientId
// @access  Private
const getConsultationsByPatientId = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    const patient = await Patient.findOne(tenantQuery(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const consultations = await Consultation.find(tenantQuery(req, { patientId: patientId }))
      .populate('doctorId', 'doctorName username department')
      .sort({ createdAt: -1 });

    res.status(200).json(consultations);
  } catch (error) {
    console.error('Get Consultations Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get autocomplete suggestions for symptoms
// @route   GET /api/consultation/symptoms/autocomplete
// @access  Private
const getSymptomsAutocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    
    if (q && q.trim()) {
      query = { name: { $regex: `^${q.trim()}`, $options: 'i' } };
    }

    const suggestions = await Symptom.find(query).limit(15).select('name').lean();
    const symptomNames = suggestions.map(s => s.name.charAt(0).toUpperCase() + s.name.slice(1));

    res.status(200).json(symptomNames);
  } catch (error) {
    console.error('Symptom Autocomplete Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get the logged-in doctor's appointments for a date
// @route   GET /api/consultation/appointments
// @access  Private/Doctor
const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.query.doctorId || req.user._id.toString();

    if (req.user.role === 'doctor' && doctorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const filter = req.query.filter || 'today';
    const today = new Date().toISOString().slice(0, 10);

    // Build combined patient list from visits AND follow-up consultations
    let patients = [];

    if (filter === 'previous') {
      // 1. Get all visits with past appointment dates
      const visits = await Visit.find(tenantQuery(req, { 
        doctorId, 
        appointmentDate: { $lt: today }
      }))
        .populate('patientId')
        .sort({ appointmentDate: -1, slot: 1 });
      
      patients = visits.map(buildPatientData).filter(Boolean);

      // 2. Add past follow-up patients (completed consultations with followUpDate in the past)
      const pastFollowUpConsultations = await Consultation.find(tenantQuery(req, {
        doctorId,
        consultationStatus: 'completed',
        followUpDate: { $lt: today, $ne: null, $ne: '' }
      }))
        .populate('patientId')
        .sort({ followUpDate: -1 });

      const existingIds = new Set(patients.map(p => p._id.toString()));
      pastFollowUpConsultations.forEach(c => {
        const p = c.patientId;
        if (p && !existingIds.has(p._id.toString())) {
          existingIds.add(p._id.toString());
          patients.push({
            _id: p._id,
            uhid: p.uhid,
            patientName: p.patientName,
            mobile: p.mobile,
            gender: p.gender,
            dob: p.dob,
            department: p.department || '',
            doctorId: { _id: doctorId },
            appointmentDate: c.followUpDate,
            slot: '',
            consultationStatus: 'completed',
            createdAt: c.createdAt
          });
        }
      });

    } else if (filter === 'today') {
      // 1. Get today's visits
      const visits = await Visit.find(tenantQuery(req, { 
        doctorId, 
        appointmentDate: today 
      }))
        .populate('patientId')
        .sort({ slot: 1 });
      
      patients = visits.map(buildPatientData).filter(Boolean);

      // 2. Add today's follow-ups (completed consultations with followUpDate = today)
      const todayFollowUps = await Consultation.find(tenantQuery(req, {
        doctorId,
        consultationStatus: 'completed',
        followUpDate: today
      }))
        .populate('patientId')
        .sort({ updatedAt: -1 });

      const existingIds = new Set(patients.map(p => p._id.toString()));
      todayFollowUps.forEach(c => {
        const p = c.patientId;
        if (p && !existingIds.has(p._id.toString())) {
          existingIds.add(p._id.toString());
          patients.push({
            _id: p._id,
            uhid: p.uhid,
            patientName: p.patientName,
            mobile: p.mobile,
            gender: p.gender,
            dob: p.dob,
            department: p.department || '',
            doctorId: { _id: doctorId },
            appointmentDate: today,
            slot: 'Follow-up',
            consultationStatus: 'completed',
            createdAt: c.createdAt
          });
        }
      });

    } else if (filter === 'upcoming') {
      // 1. Get future visits
      const visits = await Visit.find(tenantQuery(req, { 
        doctorId, 
        appointmentDate: { $gt: today }
      }))
        .populate('patientId')
        .sort({ appointmentDate: 1, slot: 1 });
      
      patients = visits.map(buildPatientData).filter(Boolean);

      // 2. Add future follow-ups (consultations with followUpDate in the future)
      const futureFollowUps = await Consultation.find(tenantQuery(req, {
        doctorId,
        consultationStatus: 'completed',
        followUpDate: { $gt: today, $ne: null, $ne: '' }
      }))
        .populate('patientId')
        .sort({ followUpDate: 1 });

      const existingIds = new Set(patients.map(p => p._id.toString()));
      futureFollowUps.forEach(c => {
        const p = c.patientId;
        if (p && !existingIds.has(p._id.toString())) {
          existingIds.add(p._id.toString());
          patients.push({
            _id: p._id,
            uhid: p.uhid,
            patientName: p.patientName,
            mobile: p.mobile,
            gender: p.gender,
            dob: p.dob,
            department: p.department || '',
            doctorId: { _id: doctorId },
            appointmentDate: c.followUpDate,
            slot: 'Follow-up',
            consultationStatus: 'completed',
            createdAt: c.createdAt
          });
        }
      });

      // Sort by appointmentDate
      patients.sort((a, b) => (a.appointmentDate || '').localeCompare(b.appointmentDate || ''));
    }

    res.status(200).json(patients);
  } catch (error) {
    console.error('Get Doctor Appointments Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dashboard counts for a doctor
// @route   GET /api/consultation/stats
// @access  Private
const getDoctorStats = async (req, res) => {
  try {
    const doctorId = req.query.doctorId || req.user._id.toString();
    
    if (req.user.role === 'doctor' && doctorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const today = new Date().toISOString().slice(0, 10);

    // Visit-based counts
    const totalUniquePatients = await Visit.distinct('patientId', tenantQuery(req, { doctorId }));
    
    const previousVisitsCount = await Visit.countDocuments(tenantQuery(req, { 
      doctorId, appointmentDate: { $lt: today } 
    }));
    const todaysVisitsCount = await Visit.countDocuments(tenantQuery(req, { 
      doctorId, appointmentDate: today 
    }));
    const upcomingVisitsCount = await Visit.countDocuments(tenantQuery(req, { 
      doctorId, appointmentDate: { $gt: today } 
    }));

    // Follow-up counts
    const previousFollowUpCount = await Consultation.countDocuments(tenantQuery(req, { 
      doctorId, consultationStatus: 'completed',
      followUpDate: { $lt: today, $ne: null, $ne: '' } 
    }));
    const todaysFollowUpCount = await Consultation.countDocuments(tenantQuery(req, { 
      doctorId, consultationStatus: 'completed',
      followUpDate: today 
    }));
    const upcomingFollowUpCount = await Consultation.countDocuments(tenantQuery(req, { 
      doctorId, consultationStatus: 'completed',
      followUpDate: { $gt: today, $ne: null, $ne: '' } 
    }));

    const consultationCompletedCount = await Visit.countDocuments(tenantQuery(req, { 
      doctorId, consultationStatus: 'completed' 
    }));
    const pendingOpdCount = await Visit.countDocuments(tenantQuery(req, { 
      doctorId, consultationStatus: { $in: ['pending', null, undefined] } 
    }));

    res.status(200).json({
      totalPatients: totalUniquePatients.length,
      previousPatientsCount: previousVisitsCount + previousFollowUpCount,
      todaysPatientsCount: todaysVisitsCount + todaysFollowUpCount,
      upcomingPatientsCount: upcomingVisitsCount + upcomingFollowUpCount,
      consultationCompletedCount,
      pendingOpdCount
    });
  } catch (error) {
    console.error('Get Doctor Stats Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get completed consultations for a doctor
// @route   GET /api/consultation/completed
// @access  Private
const getCompletedConsultations = async (req, res) => {
  try {
    const query = tenantQuery(req, { consultationStatus: 'completed' });
    if (req.user.role === 'doctor') query.doctorId = req.user._id;

    const consultations = await Consultation.find(query)
      .populate('patientId', 'uhid patientName mobile gender dob department')
      .populate('doctorId', 'doctorName username department')
      .sort({ consultationCompletedDate: -1, updatedAt: -1 });

    res.json(consultations);
  } catch (error) {
    console.error('Get Completed Consultations Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all consultations for a patient (for consultation track view)
// @route   GET /api/consultation/patient/:patientId/all
// @access  Private
const getAllPatientConsultations = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    const patient = await Patient.findOne(tenantQuery(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const consultations = await Consultation.find(tenantQuery(req, { patientId }))
      .populate('doctorId', 'doctorName username department')
      .populate('patientId', 'uhid patientName mobile gender dob')
      .sort({ consultationDateTime: -1, createdAt: -1 });

    // Also get ALL related prescriptions  
    const prescriptions = await Prescription.find(tenantQuery(req, { patientId }))
      .populate('doctorId', 'doctorName username department')
      .sort({ prescriptionDateTime: -1, createdAt: -1 });

    res.json({ consultations, prescriptions, patient });
  } catch (error) {
    console.error('Get All Patient Consultations Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get completed consultation details
// @route   GET /api/consultation/completed/:consultationId
// @access  Private
const getCompletedConsultationDetails = async (req, res) => {
  try {
    const consultation = await Consultation.findOne(tenantQuery(req, { _id: req.params.consultationId }))
      .populate('patientId', 'uhid patientName mobile gender dob department appointmentDate slot address aadhaar')
      .populate('doctorId', 'doctorName username department');

    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });

    if (req.user.role === 'doctor' && consultation.doctorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const prescription = await Prescription.findOne(tenantQuery(req, {
      patientId: consultation.patientId._id,
      consultationId: consultation._id
    })).sort({ updatedAt: -1 });

    res.json({ consultation, patient: consultation.patientId, prescription });
  } catch (error) {
    console.error('Get Completed Consultation Details Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createConsultation,
  updateConsultation,
  getConsultationsByPatientId,
  getSymptomsAutocomplete,
  getDoctorAppointments,
  getDoctorStats,
  getCompletedConsultations,
  getAllPatientConsultations,
  getCompletedConsultationDetails
};