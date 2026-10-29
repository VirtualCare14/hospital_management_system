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
  const isVisiting = Boolean(visit.isVisitingDoctor);
  const specialistName = visit.visitingDoctorName || visit.doctorName || '';
  return {
    _id: pat._id || patientObj._id,
    visitId: visit._id,
    uhid: visit.uhid || patientObj.uhid,
    patientName: patientObj.patientName,
    mobile: patientObj.mobile,
    gender: patientObj.gender,
    dob: patientObj.dob,
    department: visit.department || patientObj.department || '',
    doctorId: isVisiting ? {
      _id: visit.visitingScheduleId,
      doctorName: specialistName,
      username: specialistName,
      isVisitingDoctor: true
    } : (visit.doctorId || patientObj.doctorId || null),
    doctorName: isVisiting ? specialistName : (visit.doctorId?.doctorName || visit.doctorId?.username || ''),
    isVisitingDoctor: isVisiting,
    visitingScheduleId: visit.visitingScheduleId || null,
    visitingDoctorName: specialistName,
    appointmentNumber: visit.appointmentNumber || null,
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
    drugAllergy: vitals.drugAllergy,
    bloodPressure: vitals.bloodPressure !== undefined && vitals.bloodPressure !== null ? String(vitals.bloodPressure).trim() : undefined,
    cvs: vitals.cvs !== undefined && vitals.cvs !== null ? String(vitals.cvs).trim() : undefined,
    respiratoryRate: parseNumber(vitals.respiratoryRate ?? vitals.rr),
    pulseRate: parseNumber(vitals.pulseRate ?? vitals.pulse ?? vitals.pr),
    pulse: parseNumber(vitals.pulseRate ?? vitals.pulse ?? vitals.pr),
    perAbdomen: vitals.perAbdomen !== undefined && vitals.perAbdomen !== null ? String(vitals.perAbdomen).trim() : (vitals.pa !== undefined && vitals.pa !== null ? String(vitals.pa).trim() : undefined),
    bilateralChest: vitals.bilateralChest !== undefined && vitals.bilateralChest !== null ? String(vitals.bilateralChest).trim() : undefined,
    spo2: parseNumber(vitals.spo2)
  };
};

// @desc    Create a new consultation (ALWAYS creates a new record - no overwrite)
// @route   POST /api/consultation/create
// @access  Private
const createConsultation = async (req, res) => {
  try {
    if (!['doctor', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only authorized clinical staff or doctors can create consultations' });
    }

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

    // Identify Visit and determine if Visiting Specialist encounter
    let visit = null;
    if (visitId) {
      visit = await Visit.findOne(tenantQuery(req, { _id: visitId }));
    } else {
      visit = await Visit.findOne(tenantQuery(req, { patientId })).sort({ createdAt: -1 });
    }

    const isVisiting = Boolean(visit?.isVisitingDoctor);
    const visitingScheduleId = isVisiting ? (visit.visitingScheduleId || null) : null;
    const visitingDoctorName = isVisiting ? (visit.visitingDoctorName || visit.doctorName || '') : '';
    const finalDoctorId = isVisiting ? null : (visit?.doctorId || (req.user.role === 'doctor' ? req.user._id : (req.body.doctorId || null)));

    // 1. Save new symptoms to the Symptom autocomplete index
    if (symptoms && Array.isArray(symptoms)) {
      for (const item of symptoms) {
        if (item.symptom && item.symptom.trim() !== '') {
          const symptomName = item.symptom.trim().toLowerCase();
          await Symptom.findOneAndUpdate(
            { name: symptomName },
            { name: symptomName },
            { upsert: true, returnDocument: 'after' }
          );
        }
      }
    }

    // 2. Prevent duplicate pending consultation for the same encounter on reopen/refresh
    let consultation = null;
    if (visit?._id) {
      consultation = await Consultation.findOne(tenantQuery(req, {
        visitId: visit._id,
        consultationStatus: 'pending'
      }));
    }

    if (consultation) {
      consultation.symptoms = symptoms;
      consultation.generalPastHistory = pastHistory;
      consultation.diagnosisRemark = diagnosisRemark;
      consultation.patientAdvice = patientAdvice || '';
      consultation.vitals = sanitizeVitals(vitals);
      consultation.tests = tests || [];
      consultation.followUpDate = followUpDate;
      consultation.followUpRemarks = followUpRemarks || '';
      if (isVisiting) {
        consultation.isVisitingDoctor = true;
        consultation.visitingScheduleId = visitingScheduleId;
        consultation.visitingDoctorName = visitingDoctorName;
        consultation.conductedBy = req.user._id;
        consultation.conductedByName = req.user.doctorName || req.user.username || '';
      }
      await consultation.save();
    } else {
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
        symptoms,
        generalPastHistory: pastHistory,
        diagnosisRemark,
        patientAdvice: patientAdvice || '',
        vitals: sanitizeVitals(vitals),
        tests: tests || [],
        followUpDate,
        followUpRemarks: followUpRemarks || '',
        consultationDateTime: new Date()
      });
    }

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

    // 3. Create Lab Request entries if tests are assigned
    const shouldSendToLab = sendToLab !== false && sendToLab !== 'false';
    if (tests && Array.isArray(tests) && tests.length > 0 && shouldSendToLab) {
      const docName = isVisiting
        ? `Dr. ${visitingDoctorName} (Visiting Specialist)`
        : (req.user.doctorName ? `Dr. ${req.user.doctorName}` : (req.user.username ? `Dr. ${req.user.username}` : 'OPD Doctor'));
      const isHomeCollection = collectionType === 'Home Sample Collection';
      const requests = tests.map((test) => {
        const testName = typeof test === 'string' ? test.trim() : (test?.test || test?.title || test?.name || String(test));
        return {
          patientId,
          hospitalId: req.user.hospitalId,
          doctorId,
          tests: [testName],
          status: isHomeCollection ? 'assigned' : 'pending',
          sampleStatus: isHomeCollection ? 'Home Sample Assigned' : 'Not Collected',
          reportStatus: 'Pending',
          collectionType: collectionType || 'Lab Visit',
          collectionTime: collectionTime || '',
          bookingDate: bookingDate || new Date(),
          remarks: `Referred by: ${docName} (OPD)`,
          statusHistory: [{
            status: isHomeCollection ? 'Home Sample Assigned' : 'Not Collected',
            assistantName: docName,
            notes: isHomeCollection ? 'Home sample collection requested from OPD' : `Lab request created from OPD consultation by ${docName}`
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
    if (tests !== undefined) {
      consultation.tests = tests;
      // Ensure LabRequest entries exist for newly added tests
      if (Array.isArray(tests) && tests.length > 0) {
        const existingReqs = await LabRequest.find(tenantQuery(req, {
          patientId: consultation.patientId,
          doctorId
        }));
        const existingTestNames = new Set();
        existingReqs.forEach(r => {
          (r.tests || []).forEach(t => existingTestNames.add(String(t).toLowerCase().trim()));
        });

        const docName = req.user.doctorName ? `Dr. ${req.user.doctorName}` : (req.user.username ? `Dr. ${req.user.username}` : 'OPD Doctor');
        const newTestsToCreate = tests.filter(t => {
          const tName = typeof t === 'string' ? t.toLowerCase().trim() : (t?.test || t?.title || t?.name || '').toLowerCase().trim();
          return tName && !existingTestNames.has(tName);
        });

        if (newTestsToCreate.length > 0) {
          const requests = newTestsToCreate.map((test) => {
            const testName = typeof test === 'string' ? test.trim() : (test?.test || test?.title || test?.name || String(test));
            return {
              patientId: consultation.patientId,
              hospitalId: req.user.hospitalId,
              doctorId,
              tests: [testName],
              status: 'pending',
              sampleStatus: 'Not Collected',
              reportStatus: 'Pending',
              collectionType: 'Lab Visit',
              bookingDate: new Date(),
              remarks: `Referred by: ${docName} (OPD)`,
              statusHistory: [{
                status: 'Not Collected',
                assistantName: docName,
                notes: `Lab request added from OPD consultation update by ${docName}`
              }]
            };
          });
          await Promise.all(requests.map((request) => new LabRequest(request).save()));
        }
      }
    }
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

    const latestConsultation = consultations[0] || null;
    let latestPrescription = null;
    if (latestConsultation) {
      latestPrescription = await Prescription.findOne(tenantQuery(req, {
        patientId: patientId,
        consultationId: latestConsultation._id
      })).sort({ updatedAt: -1, createdAt: -1 });
    }
    if (!latestPrescription) {
      latestPrescription = await Prescription.findOne(tenantQuery(req, {
        patientId: patientId
      })).sort({ updatedAt: -1, createdAt: -1 });
    }

    res.status(200).json({
      consultations,
      consultation: latestConsultation,
      prescription: latestPrescription
    });
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
  let doctorQuery = {};

  if (req.query.visitingScheduleId) {
    doctorQuery = { isVisitingDoctor: true, visitingScheduleId: req.query.visitingScheduleId };
  } else if (req.query.providerType === 'visiting' || req.query.isVisiting === 'true') {
    doctorQuery = { isVisitingDoctor: true };
  } else if (req.query.providerType === 'standard' || req.query.isVisiting === 'false') {
    doctorQuery = { isVisitingDoctor: false, ...(targetDoctorId ? { doctorId: targetDoctorId } : {}) };
  } else if (targetDoctorId && req.user.role === 'doctor') {
    doctorQuery = { doctorId: targetDoctorId, isVisitingDoctor: false };
  } else if (targetDoctorId) {
    doctorQuery = { doctorId: targetDoctorId };
  }

  if (req.user.role === 'clinic') {
    doctorQuery.createdBy = req.user._id;
  }

  let patients = [];

  if (filter === 'previous') {
    const visits = await Visit.find(tenantQuery(req, { 
      ...doctorQuery, 
      appointmentDate: { $lt: today },
      consultationStatus: { $nin: ['completed', 'cancelled'] },
      isRefunded: { $ne: true },
      paymentStatus: { $ne: 'Refunded' }
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
      consultationStatus: { $nin: ['completed', 'cancelled'] },
      isRefunded: { $ne: true },
      paymentStatus: { $ne: 'Refunded' }
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
      consultationStatus: { $nin: ['completed', 'cancelled'] },
      isRefunded: { $ne: true },
      paymentStatus: { $ne: 'Refunded' }
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
      const isVisiting = Boolean(c.isVisitingDoctor);
      const specialistName = c.visitingDoctorName || '';
      return {
        _id: p._id,
        uhid: p.uhid,
        patientName: p.patientName,
        mobile: p.mobile,
        gender: p.gender,
        dob: p.dob,
        department: p.department || c.department || '',
        doctorId: isVisiting ? {
          _id: c.visitingScheduleId,
          doctorName: specialistName,
          username: specialistName,
          isVisitingDoctor: true
        } : (c.doctorId || (targetDoctorId ? { _id: targetDoctorId } : null)),
        doctorName: isVisiting ? specialistName : (c.doctorId?.doctorName || c.doctorId?.username || ''),
        isVisitingDoctor: isVisiting,
        visitingScheduleId: c.visitingScheduleId || null,
        visitingDoctorName: specialistName,
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
      consultationStatus: { $nin: ['completed', 'cancelled'] },
      isRefunded: { $ne: true },
      paymentStatus: { $ne: 'Refunded' }
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
      allCount: allList.length,
      totalCount: allList.length,
      previousPatientsCount: previousList.length,
      previousCount: previousList.length,
      todaysPatientsCount: todaysList.length,
      todayCount: todaysList.length,
      upcomingPatientsCount: upcomingList.length,
      upcomingCount: upcomingList.length,
      consultationCompletedCount: completedList.length,
      completedCount: completedList.length,
      pendingOpdCount: pendingList.length,
      pendingCount: pendingList.length
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
    if (req.user.role === 'doctor' || req.user.role === 'clinic') query.doctorId = req.user._id;

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
      .populate('patientId')
      .populate('doctorId', 'doctorName username department')
      .populate({
        path: 'visitId',
        select: 'registrationNumber department appointmentDate slot doctorId createdBy opdFee netOpdFee paymentMode paymentStatus billNumber demographics',
        populate: [
          {
            path: 'createdBy',
            select: 'username doctorName role'
          },
          {
            path: 'doctorId',
            select: 'doctorName username department'
          }
        ]
      });

    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });

    if (req.user.role === 'doctor') {
      if (!consultation.isVisitingDoctor && consultation.doctorId && consultation.doctorId._id?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
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

    const labRequests = await LabRequest.find(tenantQuery(req, {
      patientId: consultation.patientId._id
    }))
      .populate('doctorId', 'doctorName username department')
      .populate('report.signatoryId', 'name designation')
      .populate('report.generatedBy', 'doctorName username')
      .sort({ createdAt: -1 });

    const isVisitingCons = Boolean(consultation.isVisitingDoctor || consultation.visitId?.isVisitingDoctor);
    const specialistDisplayName = consultation.visitingDoctorName || consultation.visitId?.visitingDoctorName || '';
    const patientObj = {
      ...(consultation.patientId ? (consultation.patientId.toObject ? consultation.patientId.toObject() : consultation.patientId) : {}),
      department: consultation.visitId?.department || consultation.doctorId?.department || consultation.department || 'OPD',
      doctorId: isVisitingCons ? {
        _id: consultation.visitingScheduleId || consultation.visitId?.visitingScheduleId,
        doctorName: specialistDisplayName,
        username: specialistDisplayName,
        isVisitingDoctor: true
      } : (consultation.doctorId || consultation.visitId?.doctorId || null),
      doctorName: isVisitingCons ? specialistDisplayName : (consultation.doctorId?.doctorName || consultation.doctorId?.username || consultation.visitId?.doctorId?.doctorName || ''),
      isVisitingDoctor: isVisitingCons,
      visitingDoctorName: specialistDisplayName,
      visitingScheduleId: consultation.visitingScheduleId || consultation.visitId?.visitingScheduleId || null,
      appointmentNumber: consultation.visitId?.appointmentNumber || null,
      appointmentDate: consultation.visitId?.appointmentDate || consultation.consultationCompletedDate || consultation.createdAt,
      slot: consultation.visitId?.slot || '',
      registrationNumber: consultation.visitId?.registrationNumber || '',
      demographics: consultation.visitId?.demographics || consultation.vitals || null,
      registeredBy: consultation.visitId?.createdBy ? (consultation.visitId.createdBy.doctorName || consultation.visitId.createdBy.username) : 'Receptionist',
      conductedByName: consultation.conductedByName || '',
      opdFee: consultation.visitId?.opdFee || 0,
      netOpdFee: consultation.visitId?.netOpdFee || 0,
      paymentMode: consultation.visitId?.paymentMode || 'Cash',
      paymentStatus: consultation.visitId?.paymentStatus || 'Paid',
      billNumber: consultation.visitId?.billNumber || null
    };

    res.json({ consultation, patient: patientObj, prescription, allPrescriptions, labRequests });
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