const Consultation = require('../models/Consultation');
const Symptom = require('../models/Symptom');
const LabRequest = require('../models/LabRequest');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');

const tenantQuery = (req, extra = {}) => (
  req.user.hospitalId ? { ...extra, hospitalId: req.user.hospitalId } : extra
);

// @desc    Create a new consultation
// @route   POST /api/consultation/create
// @access  Private
const createConsultation = async (req, res) => {
  try {
    const {
      patientId,
      symptoms,
      pastHistory,
      diagnosisRemark,
      vitals,
      tests,
      sendToLab, // boolean flag sent from doctor UI
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

    // 2. Check if a pending consultation already exists for this patient+doctor combo
    // If it does, UPDATE it instead of creating a new one
    let consultation = await Consultation.findOne(tenantQuery(req, { 
      patientId, 
      doctorId,
      consultationStatus: 'pending' 
    }));

    if (consultation) {
      // Update existing pending consultation
      consultation.symptoms = symptoms || consultation.symptoms;
      consultation.generalPastHistory = pastHistory !== undefined ? pastHistory : consultation.generalPastHistory;
      consultation.diagnosisRemark = diagnosisRemark !== undefined ? diagnosisRemark : consultation.diagnosisRemark;
      consultation.vitals = vitals || consultation.vitals;
      consultation.tests = tests || consultation.tests;
      consultation.followUpDate = followUpDate !== undefined ? followUpDate : consultation.followUpDate;
      await consultation.save();
    } else {
      // Create new Consultation record
      consultation = await Consultation.create({
        patientId,
        hospitalId: req.user.hospitalId,
        doctorId,
        symptoms,
        generalPastHistory: pastHistory,
        diagnosisRemark,
        vitals,
        tests: tests || [],
        followUpDate
      });
    }

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
    
    consultation.updatedAt = new Date();
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
    
    // Verify the patient exists first
    const patient = await Patient.findOne(tenantQuery(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Authorization: Doctors can only access consultations for their own patients
    if (req.user.role === 'doctor' && patient.doctorId && patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to access consultations for this patient' });
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

    // Authorization: Doctors can only view their own appointments
    if (req.user.role === 'doctor' && doctorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to view other doctors\' appointments' });
    }
    
    const filter = req.query.filter || 'today'; // previous | today | upcoming
    const tab = req.query.tab || 'opd'; // opd | completed

    const today = new Date().toISOString().slice(0, 10);

    let dateQuery = {};
    if (filter === 'today') dateQuery = { appointmentDate: today };
    else if (filter === 'previous') dateQuery = { appointmentDate: { $lt: today } };
    else if (filter === 'upcoming') dateQuery = { appointmentDate: { $gt: today } };

    // For "previous" filter: include both pending AND completed patients with past appointments
    // For "today" and "upcoming" with tab='opd': include pending patients + follow-up patients
    // For "today" and "upcoming" with tab='completed': include completed patients
    
    let patients = [];

    if (filter === 'previous') {
      // For previous patients, get ALL patients with past appointments regardless of status
      // This ensures both pending and completed records appear
      const baseQuery = { doctorId, appointmentDate: { $lt: today } };
      
      if (tab === 'completed') {
        baseQuery.consultationStatus = 'completed';
      }
      // For tab === 'opd', get all patients (pending + completed) to show complete history
      
      patients = await Patient.find(tenantQuery(req, baseQuery))
        .populate('doctorId', 'doctorName username department')
        .sort({ appointmentDate: -1, slot: 1 });
      
      // Also include past follow-up patients for OPD tab
      if (tab === 'opd') {
        const pastFollowUpConsultations = await Consultation.find(tenantQuery(req, {
          doctorId,
          consultationStatus: 'completed',
          followUpDate: { $lt: today }
        }))
          .populate({
            path: 'patientId',
            match: tenantQuery(req, {}),
            populate: { path: 'doctorId', select: 'doctorName username department' }
          })
          .sort({ followUpDate: -1 });
        
        const existingIds = new Set(patients.map(p => p._id.toString()));
        pastFollowUpConsultations.forEach(consultation => {
          const patient = consultation.patientId;
          if (patient && !existingIds.has(patient._id.toString())) {
            existingIds.add(patient._id.toString());
            patient._doc.appointmentDate = consultation.followUpDate;
            patients.push(patient);
          }
        });
      }
    } else if ((filter === 'upcoming' || filter === 'today') && tab === 'opd') {
      // Get patients by appointmentDate (pending status)
      const patientsByAppointment = await Patient.find(tenantQuery(req, {
        doctorId,
        ...dateQuery,
        consultationStatus: { $in: ['pending', null, undefined] }
      }))
        .populate('doctorId', 'doctorName username department')
        .sort({ appointmentDate: 1, slot: 1 });
      
      // Also find patients whose consultation is completed but have followUpDate matching the filter
      const followUpDateQuery = filter === 'today' 
        ? { followUpDate: today } 
        : { followUpDate: { $gt: today } };
      
      const followUpConsultations = await Consultation.find(tenantQuery(req, {
        doctorId,
        consultationStatus: 'completed',
        ...followUpDateQuery
      }))
        .populate({
          path: 'patientId',
          match: tenantQuery(req, {}),
          populate: { path: 'doctorId', select: 'doctorName username department' }
        })
        .sort({ followUpDate: 1 });
      
      // Extract unique patients from follow-up consultations
      const followUpPatientIds = new Set();
      const followUpPatients = [];
      followUpConsultations.forEach(consultation => {
        const patient = consultation.patientId;
        if (patient && !followUpPatientIds.has(patient._id.toString())) {
          followUpPatientIds.add(patient._id.toString());
          // Temporarily override appointmentDate with followUpDate for display
          patient._doc.appointmentDate = consultation.followUpDate;
          followUpPatients.push(patient);
        }
      });
      
      // Merge both lists, avoiding duplicates
      const existingIds = new Set(patientsByAppointment.map(p => p._id.toString()));
      const merged = [...patientsByAppointment];
      followUpPatients.forEach(p => {
        if (!existingIds.has(p._id.toString())) {
          merged.push(p);
        }
      });
      
      patients = merged.sort((a, b) => a.appointmentDate?.localeCompare(b.appointmentDate || ''));
    } else {
      // Today/Upcoming with 'completed' tab
      patients = await Patient.find(tenantQuery(req, {
        doctorId,
        ...dateQuery,
        consultationStatus: 'completed'
      }))
        .populate('doctorId', 'doctorName username department')
        .sort({ appointmentDate: 1, slot: 1 });
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
      return res.status(403).json({ message: 'You are not authorized to view other doctors\' statistics' });
    }
    
    const today = new Date().toISOString().slice(0, 10);

    const totalPatients = await Patient.countDocuments(tenantQuery(req, { doctorId }));
    const previousPatientsCount = await Patient.countDocuments(tenantQuery(req, { doctorId, appointmentDate: { $lt: today } }));
    const todaysPatientsCount = await Patient.countDocuments(tenantQuery(req, { doctorId, appointmentDate: today }));
    const upcomingPatientsCount = await Patient.countDocuments(tenantQuery(req, { doctorId, appointmentDate: { $gt: today } }));
    
    // Count follow-up patients for each category
    const previousFollowUpCount = await Consultation.countDocuments(tenantQuery(req, { 
      doctorId, 
      consultationStatus: 'completed',
      followUpDate: { $lt: today } 
    }));
    
    const todaysFollowUpCount = await Consultation.countDocuments(tenantQuery(req, { 
      doctorId, 
      consultationStatus: 'completed',
      followUpDate: today 
    }));
    
    const upcomingFollowUpCount = await Consultation.countDocuments(tenantQuery(req, { 
      doctorId, 
      consultationStatus: 'completed',
      followUpDate: { $gt: today } 
    }));
    
    const consultationCompletedCount = await Patient.countDocuments(tenantQuery(req, { doctorId, consultationStatus: 'completed' }));
    const pendingOpdCount = await Patient.countDocuments(tenantQuery(req, { doctorId, consultationStatus: { $in: ['pending', null, undefined] } }));

    res.status(200).json({
      totalPatients,
      previousPatientsCount: previousPatientsCount + previousFollowUpCount,
      todaysPatientsCount: todaysPatientsCount + todaysFollowUpCount,
      upcomingPatientsCount: upcomingPatientsCount + upcomingFollowUpCount,
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
      .populate('patientId', 'uhid patientName mobile gender dob department appointmentDate slot')
      .populate('doctorId', 'doctorName username department')
      .sort({ consultationCompletedDate: -1, updatedAt: -1 });

    const latestByPatient = new Map();
    consultations.forEach((consultation) => {
      const patientId = consultation.patientId?._id?.toString();
      if (patientId && !latestByPatient.has(patientId)) {
        latestByPatient.set(patientId, consultation);
      }
    });

    res.json(Array.from(latestByPatient.values()));
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

    // Doctors can view consultations for their own patients
    if (req.user.role === 'doctor' && patient.doctorId && patient.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized' });
    }

    const consultations = await Consultation.find(tenantQuery(req, { patientId }))
      .populate('doctorId', 'doctorName username department')
      .populate('patientId', 'uhid patientName mobile gender dob')
      .sort({ createdAt: 1 }); // chronological order (oldest first)

    // Also get related prescriptions
    const prescriptions = await Prescription.find(tenantQuery(req, { patientId }))
      .populate('doctorId', 'doctorName username department')
      .sort({ createdAt: 1 });

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
      .populate('patientId', 'uhid patientName mobile gender dob department appointmentDate slot address aadhaar demographics doctorId')
      .populate('doctorId', 'doctorName username department');

    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });

    if (req.user.role === 'doctor' && consultation.doctorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to access this consultation' });
    }

    const prescription = await Prescription.findOne(tenantQuery(req, {
      patientId: consultation.patientId._id,
      doctorId: consultation.doctorId._id
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