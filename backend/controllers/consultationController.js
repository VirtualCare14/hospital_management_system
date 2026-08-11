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
    createdAt: visit.createdAt || patientObj.createdAt,
    registeredBy: visit.createdBy ? (visit.createdBy.doctorName || visit.createdBy.username) : 'N/A'
  };
};

const parseNumber = (val) => {
  if (val === undefined || val === null || String(val).trim() === '') return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
};

const sanitizeVitals = (vitals) => {
  if (!vitals) return undefined;
  return {
    weight: parseNumber(vitals.weight),
    height: parseNumber(vitals.height),
    temperature: parseNumber(vitals.temperature),
    bmi: parseNumber(vitals.bmi),
    drugAllergy: vitals.drugAllergy
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
      patientAdvice,
      vitals,
      tests,
      sendToLab,
      collectionType,
      collectionTime,
      bookingDate,
      followUpDate,
      followUpRemarks
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

    const IpdAdmission = require('../models/IpdAdmission');
    const latestIpdAdmission = await IpdAdmission.findOne(
      tenantQuery(req, { patientId: patient._id })
    ).sort({ createdAt: -1 });
    if (latestIpdAdmission?.status === 'Discharged') {
      return res.status(400).json({ message: 'Patient is discharged. No further actions can be performed.' });
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
      patientAdvice: patientAdvice || '',
      vitals: sanitizeVitals(vitals),
      tests: tests || [],
      followUpDate,
      followUpRemarks: followUpRemarks || '',
      consultationDateTime: new Date() // Auto capture system timestamp
    });

    // Update Visit followUpDate & followUpRemarks if set by doctor
    if (followUpDate || followUpRemarks) {
      const Visit = require('../models/Visit');
      const updateData = { followUpSource: 'doctor' };
      if (followUpDate !== undefined) updateData.followUpDate = followUpDate;
      if (followUpRemarks !== undefined) updateData.followUpRemarks = followUpRemarks;

      if (visitId) {
        await Visit.findByIdAndUpdate(visitId, updateData);
      } else {
        const latestVisit = await Visit.findOne(tenantQuery(req, { patientId })).sort({ createdAt: -1 });
        if (latestVisit) {
          if (followUpDate !== undefined) latestVisit.followUpDate = followUpDate;
          if (followUpRemarks !== undefined) latestVisit.followUpRemarks = followUpRemarks;
          latestVisit.followUpSource = 'doctor';
          await latestVisit.save();
        }
      }
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

    const IpdAdmission = require('../models/IpdAdmission');
    const latestIpdAdmission = await IpdAdmission.findOne(
      tenantQuery(req, { patientId: consultation.patientId })
    ).sort({ createdAt: -1 });
    if (latestIpdAdmission?.status === 'Discharged') {
      return res.status(400).json({ message: 'Patient is discharged. No further actions can be performed.' });
    }

    const {
      symptoms,
      pastHistory,
      diagnosisRemark,
      vitals,
      tests,
      followUpDate,
      followUpRemarks
    } = req.body;

    if (symptoms !== undefined) consultation.symptoms = symptoms;
    if (pastHistory !== undefined) consultation.generalPastHistory = pastHistory;
    if (diagnosisRemark !== undefined) consultation.diagnosisRemark = diagnosisRemark;
    if (vitals !== undefined) consultation.vitals = sanitizeVitals(vitals);
    if (tests !== undefined) consultation.tests = tests;
    if (followUpDate !== undefined) consultation.followUpDate = followUpDate;
    if (followUpRemarks !== undefined) consultation.followUpRemarks = followUpRemarks;

    if (followUpDate !== undefined || followUpRemarks !== undefined) {
      const Visit = require('../models/Visit');
      const updateData = { followUpSource: 'doctor' };
      if (followUpDate !== undefined) updateData.followUpDate = followUpDate;
      if (followUpRemarks !== undefined) updateData.followUpRemarks = followUpRemarks;

      if (consultation.visitId) {
        await Visit.findByIdAndUpdate(consultation.visitId, updateData);
      } else if (consultation.patientId) {
        const latestVisit = await Visit.findOne(tenantQuery(req, { patientId: consultation.patientId })).sort({ createdAt: -1 });
        if (latestVisit) {
          if (followUpDate !== undefined) latestVisit.followUpDate = followUpDate;
          if (followUpRemarks !== undefined) latestVisit.followUpRemarks = followUpRemarks;
          latestVisit.followUpSource = 'doctor';
          await latestVisit.save();
        }
      }
    }
    
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

// Helper function to fetch patient list by filter for a doctor
const fetchPatientsForDoctor = async (req, doctorId, filter) => {
  const d = new Date();
  const today = d.toISOString().slice(0, 10);
  d.setDate(d.getDate() + 1);
  const tomorrow = d.toISOString().slice(0, 10);

  const targetDoctorId = req.query.doctorId || (req.user.role === 'doctor' ? doctorId : null);
  const doctorQuery = targetDoctorId ? { doctorId: targetDoctorId } : {};

  let patients = [];

  if (filter === 'previous') {
    const visits = await Visit.find(tenantQuery(req, { 
      ...doctorQuery, 
      appointmentDate: { $lt: today },
      consultationStatus: { $ne: 'completed' }
    }))
      .populate('patientId')
      .populate('createdBy', 'username doctorName role')
      .sort({ appointmentDate: -1, slot: 1 });
    
    patients = visits.map(buildPatientData).filter(Boolean);

    const pastFollowUpConsultations = await Consultation.find(tenantQuery(req, {
      ...doctorQuery,
      consultationStatus: 'completed',
      followUpDate: { $lt: today, $ne: null, $ne: '' }
    }))
      .populate('patientId')
      .sort({ followUpDate: -1 });

    const existingIds = new Set(patients.map(p => p._id.toString()));
    for (const c of pastFollowUpConsultations) {
      const p = c.patientId;
      if (p && !existingIds.has(p._id.toString())) {
        const newerCompleted = await Consultation.findOne(tenantQuery(req, {
          patientId: p._id,
          consultationStatus: 'completed',
          _id: { $ne: c._id },
          createdAt: { $gt: c.createdAt }
        }));
        if (!newerCompleted) {
          existingIds.add(p._id.toString());
          patients.push({
            _id: p._id,
            uhid: p.uhid,
            patientName: p.patientName,
            mobile: p.mobile,
            gender: p.gender,
            dob: p.dob,
            department: p.department || '',
            doctorId: targetDoctorId ? { _id: targetDoctorId } : null,
            appointmentDate: c.followUpDate,
            slot: 'Follow-up',
            consultationStatus: 'completed',
            createdAt: c.createdAt
          });
        }
      }
    }

  } else if (filter === 'today') {
    const visits = await Visit.find(tenantQuery(req, { 
      ...doctorQuery, 
      appointmentDate: { $regex: `^${today}` },
      consultationStatus: { $ne: 'completed' }
    }))
      .populate('patientId')
      .populate('createdBy', 'username doctorName role')
      .sort({ slot: 1 });
    
    patients = visits.map(buildPatientData).filter(Boolean);

    const todayFollowUps = await Consultation.find(tenantQuery(req, {
      ...doctorQuery,
      consultationStatus: 'completed',
      followUpDate: { $regex: `^${today}` }
    }))
      .populate('patientId')
      .sort({ updatedAt: -1 });

    const existingIds = new Set(patients.map(p => p._id.toString()));
    for (const c of todayFollowUps) {
      const p = c.patientId;
      if (p && !existingIds.has(p._id.toString())) {
        const newerCompleted = await Consultation.findOne(tenantQuery(req, {
          patientId: p._id,
          consultationStatus: 'completed',
          _id: { $ne: c._id },
          createdAt: { $gt: c.createdAt }
        }));
        if (!newerCompleted) {
          existingIds.add(p._id.toString());
          patients.push({
            _id: p._id,
            uhid: p.uhid,
            patientName: p.patientName,
            mobile: p.mobile,
            gender: p.gender,
            dob: p.dob,
            department: p.department || '',
            doctorId: targetDoctorId ? { _id: targetDoctorId } : null,
            appointmentDate: today,
            slot: 'Follow-up',
            consultationStatus: 'completed',
            createdAt: c.createdAt
          });
        }
      }
    }

  } else if (filter === 'upcoming') {
    const visits = await Visit.find(tenantQuery(req, { 
      ...doctorQuery, 
      appointmentDate: { $gte: tomorrow },
      consultationStatus: { $ne: 'completed' }
    }))
      .populate('patientId')
      .populate('createdBy', 'username doctorName role')
      .sort({ appointmentDate: 1, slot: 1 });
    
    patients = visits.map(buildPatientData).filter(Boolean);

    const futureFollowUps = await Consultation.find(tenantQuery(req, {
      ...doctorQuery,
      consultationStatus: 'completed',
      followUpDate: { $gte: tomorrow, $ne: null, $ne: '' }
    }))
      .populate('patientId')
      .sort({ followUpDate: 1 });

    const existingIds = new Set(patients.map(p => p._id.toString()));
    for (const c of futureFollowUps) {
      const p = c.patientId;
      if (p && !existingIds.has(p._id.toString())) {
        const newerCompleted = await Consultation.findOne(tenantQuery(req, {
          patientId: p._id,
          consultationStatus: 'completed',
          _id: { $ne: c._id },
          createdAt: { $gt: c.createdAt }
        }));
        if (!newerCompleted) {
          existingIds.add(p._id.toString());
          patients.push({
            _id: p._id,
            uhid: p.uhid,
            patientName: p.patientName,
            mobile: p.mobile,
            gender: p.gender,
            dob: p.dob,
            department: p.department || '',
            doctorId: targetDoctorId ? { _id: targetDoctorId } : null,
            appointmentDate: c.followUpDate,
            slot: 'Follow-up',
            consultationStatus: 'completed',
            createdAt: c.createdAt
          });
        }
      }
    }

    patients.sort((a, b) => (a.appointmentDate || '').localeCompare(b.appointmentDate || ''));

  } else if (filter === 'completed') {
    const completedConsultations = await Consultation.find(tenantQuery(req, {
      ...doctorQuery,
      consultationStatus: 'completed'
    }))
      .populate('patientId')
      .sort({ consultationCompletedDate: -1, updatedAt: -1 });

    patients = completedConsultations.map(c => {
      const p = c.patientId;
      if (!p) return null;
      return {
        _id: p._id,
        uhid: p.uhid,
        patientName: p.patientName,
        mobile: p.mobile,
        gender: p.gender,
        dob: p.dob,
        department: p.department || c.department || '',
        doctorId: targetDoctorId ? { _id: targetDoctorId } : null,
        appointmentDate: c.consultationCompletedDate || c.createdAt,
        slot: 'Completed',
        consultationStatus: 'completed',
        consultationId: c._id,
        createdAt: c.createdAt
      };
    }).filter(Boolean);

  } else if (filter === 'pending') {
    const visits = await Visit.find(tenantQuery(req, {
      ...doctorQuery,
      consultationStatus: { $ne: 'completed' }
    }))
      .populate('patientId')
      .populate('createdBy', 'username doctorName role')
      .sort({ appointmentDate: -1, slot: 1 });
    patients = visits.map(buildPatientData).filter(Boolean);
  } else {
    const visits = await Visit.find(tenantQuery(req, {
      ...doctorQuery
    }))
      .populate('patientId')
      .populate('createdBy', 'username doctorName role')
      .sort({ createdAt: -1 });
    patients = visits.map(buildPatientData).filter(Boolean);
  }

  return patients;
};

// @desc    Get appointments/patients for a doctor
// @route   GET /api/consultation/appointments
// @access  Private
const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.query.doctorId || req.user._id.toString();
    if (req.user.role === 'doctor' && doctorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const filter = req.query.filter || 'today';
    const patients = await fetchPatientsForDoctor(req, doctorId, filter);
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

    const [allList, previousList, todaysList, upcomingList, completedList, pendingList] = await Promise.all([
      fetchPatientsForDoctor(req, doctorId, 'all'),
      fetchPatientsForDoctor(req, doctorId, 'previous'),
      fetchPatientsForDoctor(req, doctorId, 'today'),
      fetchPatientsForDoctor(req, doctorId, 'upcoming'),
      fetchPatientsForDoctor(req, doctorId, 'completed'),
      fetchPatientsForDoctor(req, doctorId, 'pending')
    ]);

    res.status(200).json({
      totalPatients: allList.length,
      previousPatientsCount: previousList.length,
      todaysPatientsCount: todaysList.length,
      upcomingPatientsCount: upcomingList.length,
      consultationCompletedCount: completedList.length,
      pendingOpdCount: pendingList.length
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
    const { search, page = 1, limit = 20 } = req.query;
    const query = tenantQuery(req, { consultationStatus: 'completed' });
    if (req.user.role === 'doctor') query.doctorId = req.user._id;

    const consultations = await Consultation.find(query)
      .populate('patientId', 'uhid patientName mobile gender dob department')
      .populate('doctorId', 'doctorName username department')
      .populate({
        path: 'visitId',
        select: 'createdBy',
        populate: {
          path: 'createdBy',
          select: 'username doctorName role'
        }
      })
      .sort({ consultationCompletedDate: -1, updatedAt: -1 });

    let filtered = consultations;
    if (search) {
      const q = search.trim().toLowerCase();
      filtered = consultations.filter(c =>
        c.patientId?.patientName?.toLowerCase().includes(q) ||
        c.patientId?.uhid?.toLowerCase().includes(q)
      );
    }

    if (req.query.page || req.query.limit) {
      const currentPage = Math.max(1, parseInt(page) || 1);
      const limitVal = Math.max(1, parseInt(limit) || 20);
      const totalRecords = filtered.length;
      const totalPages = Math.ceil(totalRecords / limitVal) || 1;
      const paginated = filtered.slice((currentPage - 1) * limitVal, currentPage * limitVal);

      return res.json({
        consultations: paginated,
        page: currentPage,
        pageSize: limitVal,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });
    }

    res.json(filtered);
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
      .populate({
        path: 'visitId',
        select: 'createdBy',
        populate: {
          path: 'createdBy',
          select: 'username doctorName role'
        }
      })
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
      .populate('doctorId', 'doctorName username department')
      .populate({
        path: 'visitId',
        select: 'createdBy',
        populate: {
          path: 'createdBy',
          select: 'username doctorName role'
        }
      });

    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });

    if (req.user.role === 'doctor' && consultation.doctorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const prescription = await Prescription.findOne(tenantQuery(req, {
      patientId: consultation.patientId._id,
      consultationId: consultation._id
    })).sort({ updatedAt: -1 });

    const allPrescriptions = await Prescription.find(tenantQuery(req, {
      patientId: consultation.patientId._id
    }))
      .populate('doctorId', 'doctorName username department')
      .sort({ prescriptionDateTime: -1, createdAt: -1 });

    res.json({ consultation, patient: consultation.patientId, prescription, allPrescriptions });
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