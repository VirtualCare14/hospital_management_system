const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const User = require('../models/User');
const SameDayTreatment = require('../models/SameDayTreatment');
const IpdAdminSettings = require('../models/IpdAdminSettings');
const generateUhid = require('../utils/generateUhid');

const tenantQuery = (req, extra = {}) => (
  req.user.hospitalId ? { ...extra, hospitalId: req.user.hospitalId } : extra
);

// @desc    Generate unique Registration Number format: REG-YYYYMMDD-XXXX
const generateRegistrationNumber = async (hospitalId) => {
  const today = new Date();
  const datePart = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

  const prefix = `REG-${datePart}-`;

  // Find the last registration number for today
  const lastVisit = await Visit.findOne(
    tenantQuery({ user: { hospitalId } }, { registrationNumber: { $regex: `^${prefix}` } })
  ).sort({ registrationNumber: -1 });

  let seq = 1;
  if (lastVisit) {
    const lastSeq = parseInt(lastVisit.registrationNumber.split('-').pop(), 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
};

// @desc    Generate next appointment number for today (per doctor + department)
const generateAppointmentNumber = async (hospitalId, doctorId, department, appointmentDate) => {
  const dateStr = appointmentDate || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filter = {
    appointmentDateSeq: dateStr,
    appointmentDept: department,
    appointmentDoctorId: doctorId
  };
  if (hospitalId) filter.hospitalId = hospitalId;

  const lastVisit = await Visit.findOne(filter).sort({ appointmentNumber: -1 });
  const nextNumber = (lastVisit?.appointmentNumber || 0) + 1;
  return { appointmentNumber: nextNumber, appointmentDateSeq: dateStr };
};

// @desc    Look up existing patient by Aadhaar number
// @route   GET /api/patients/aadhaar/:aadhaar
// @access  Private
const getPatientByAadhaar = async (req, res) => {
  try {
    const { aadhaar } = req.params;
    if (!aadhaar || aadhaar.trim().length < 4) {
      return res.status(400).json({ message: 'Valid Aadhaar number is required' });
    }

    const patient = await Patient.findOne(tenantQuery(req, { aadhaar: aadhaar.trim() }));

    if (!patient) {
      return res.status(404).json({ message: 'No patient found with this Aadhaar number', found: false });
    }

    // Get the latest visit for this patient
    const latestVisit = await Visit.findOne(tenantQuery(req, { patientId: patient._id }))
      .populate('doctorId', 'doctorName username department')
      .sort({ createdAt: -1 });

    res.status(200).json({ found: true, patient, latestVisit });
  } catch (error) {
    console.error('Get Patient By Aadhaar Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register a new patient (or new visit for existing Aadhaar)
// @route   POST /api/patients/create
// @access  Private
const createPatient = async (req, res) => {
  try {
    const {
      patientName,
      mobile,
      address,
      dob,
      gender,
      aadhaar,
      category,
      department,
      doctorId,
      appointmentDate,
      slot,
      visitType,
      weight,
      height,
      bloodPressure,
      temperature
    } = req.body;

    if (!patientName || !mobile || !address || !dob || !gender || !aadhaar || !department || !doctorId || !appointmentDate || !slot) {
      return res.status(400).json({ message: 'All required registration fields must be provided' });
    }

    // Verify doctor exists and has role doctor
    const doctor = await User.findOne(tenantQuery(req, { _id: doctorId, role: 'doctor' }));
    if (!doctor) {
      return res.status(400).json({ message: 'Selected doctor is invalid' });
    }

    // Check if slot is already booked for this doctor and date
    const slotBooked = await Visit.findOne({
      doctorId,
      appointmentDate,
      slot,
      ...(req.user.hospitalId ? { hospitalId: req.user.hospitalId } : {})
    });

    if (slotBooked) {
      return res.status(400).json({ message: 'This slot is already booked for the selected doctor and date.' });
    }

    // Check if patient with this Aadhaar already exists
    const existingPatient = await Patient.findOne(
      tenantQuery(req, { aadhaar: aadhaar.trim() })
    );

    let patient;
    let uhid;
    let isExistingPatient = false;
    let visitNumber = 1;

    if (existingPatient) {
      patient = existingPatient;
      if (category) {
        patient.category = category;
        await patient.save();
      }
      uhid = existingPatient.uhid;
      isExistingPatient = true;

      const visitCount = await Visit.countDocuments(
        tenantQuery(req, { patientId: existingPatient._id })
      );
      visitNumber = visitCount + 1;
    } else {
      uhid = await generateUhid(aadhaar.trim());

      patient = new Patient({
        hospitalId: req.user.hospitalId,
        uhid,
        patientName,
        mobile,
        address,
        dob,
        gender,
        aadhaar,
        category: category || 'General'
      });

      await patient.save();
      visitNumber = 1;
    }

    // Generate registration number
    const registrationNumber = await generateRegistrationNumber(req.user.hospitalId);

    // Generate appointment number (per doctor + department + date)
    const { appointmentNumber, appointmentDateSeq } = await generateAppointmentNumber(
      req.user.hospitalId, doctorId, department, appointmentDate
    );

    // Determine visit type
    const finalVisitType = visitType || 'OPD';

    // Create a Visit record
    const visit = new Visit({
      hospitalId: req.user.hospitalId,
      patientId: patient._id,
      uhid: patient.uhid,
      registrationNumber,
      registrationDate: new Date(),
      visitType: finalVisitType,
      department,
      doctorId,
      appointmentDate,
      slot,
      appointmentNumber,
      appointmentDateSeq,
      appointmentDept: department,
      appointmentDoctorId: doctorId,
      visitNumber,
      demographics: {
        weight: weight || undefined,
        height: height || undefined,
        bloodPressure: bloodPressure || undefined,
        temperature: temperature || undefined
      }
    });

    await visit.save();

    // If Same Day Treatment, also create an SDT record
    let sameDayTreatmentRecord = null;
    if (finalVisitType === 'Same Day Treatment') {
      const age = dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;

      // Get default price from settings
      let defaultPrice = 0;
      try {
        const settings = await IpdAdminSettings.findOne(tenantQuery(req));
        if (settings?.sameDayTreatmentPrices?.length > 0) {
          defaultPrice = settings.sameDayTreatmentPrices[0]?.price || 0;
        }
      } catch (e) { /* ignore */ }

      sameDayTreatmentRecord = new SameDayTreatment({
        hospitalId: req.user.hospitalId,
        patientId: patient._id,
        patientName: patient.patientName,
        uhid: patient.uhid,
        mobile: patient.mobile,
        gender: patient.gender,
        age,
        treatmentType: 'Minor Injury', // Default, can be updated by nursing
        treatmentDate: new Date(),
        diagnosis: '',
        status: 'Draft',
        createdBy: req.user._id,
        updatedBy: req.user._id
      });

      await sameDayTreatmentRecord.save();

      // Link SDT record to the visit
      visit.sameDayTreatmentId = sameDayTreatmentRecord._id;
      await visit.save();
    }

    // Build a combined response object for the frontend
    const responseData = {
      _id: visit._id,
      uhid: patient.uhid,
      hospitalId: patient.hospitalId,
      patientName: patient.patientName,
      mobile: patient.mobile,
      address: patient.address,
      dob: patient.dob,
      gender: patient.gender,
      aadhaar: patient.aadhaar,
      department: visit.department,
      doctorId: doctor ? {
        _id: doctor._id,
        doctorName: doctor.doctorName,
        username: doctor.username
      } : visit.doctorId,
      appointmentDate: visit.appointmentDate,
      slot: visit.slot,
      appointmentNumber: visit.appointmentNumber,
      registrationNumber: visit.registrationNumber,
      registrationDate: visit.registrationDate,
      visitType: visit.visitType,
      consultationStatus: visit.consultationStatus,
      demographics: visit.demographics,
      visitNumber: visit.visitNumber,
      patientId: patient._id,
      createdAt: visit.createdAt,
      isExistingPatient,
      sameDayTreatmentId: sameDayTreatmentRecord?._id || null
    };

    const message = isExistingPatient
      ? `Patient registered under existing UHID: ${uhid} — ${finalVisitType} Visit #${visitNumber} (${registrationNumber})`
      : `New patient registered with UHID: ${uhid} — ${finalVisitType} (${registrationNumber})`;

    res.status(201).json({
      message,
      patient: responseData,
      isExistingPatient,
      existingUhid: isExistingPatient ? uhid : null
    });
  } catch (error) {
    console.error('Create Patient Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all patients or search patients (with role-based filtering)
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let query = tenantQuery(req);

    // Role-based filtering
    if (req.user.role === 'doctor') {
      const doctorVisits = await Visit.find(tenantQuery(req, { doctorId: req.user._id }))
        .select('patientId');
      const patientIds = [...new Set(doctorVisits.map(v => v.patientId.toString()))];
      query = { ...query, _id: { $in: patientIds } };
    }

    if (search) {
      query = {
        ...query,
        $or: [
          { uhid: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
          { patientName: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });

    const patientsWithVisits = await Promise.all(
      patients.map(async (pat) => {
        const latestVisit = await Visit.findOne(tenantQuery(req, { patientId: pat._id }))
          .populate('doctorId', 'doctorName username department')
          .sort({ createdAt: -1 });
        return {
          ...pat.toObject(),
          department: latestVisit?.department || '',
          doctorId: latestVisit?.doctorId || null,
          appointmentDate: latestVisit?.appointmentDate || '',
          slot: latestVisit?.slot || '',
          appointmentNumber: latestVisit?.appointmentNumber || null,
          registrationNumber: latestVisit?.registrationNumber || '',
          visitType: latestVisit?.visitType || 'OPD',
          consultationStatus: latestVisit?.consultationStatus || 'pending'
        };
      })
    );

    res.status(200).json(patientsWithVisits);
  } catch (error) {
    console.error('Get Patients Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.user.role === 'doctor') {
      const doctorVisit = await Visit.findOne(
        tenantQuery(req, { patientId: patient._id, doctorId: req.user._id })
      );
      if (!doctorVisit) {
        return res.status(403).json({ message: 'You are not authorized to access this patient' });
      }
    }

    const latestVisit = await Visit.findOne(tenantQuery(req, { patientId: patient._id }))
      .populate('doctorId', 'doctorName username department')
      .sort({ createdAt: -1 });

    const responseData = {
      ...patient.toObject(),
      department: latestVisit?.department || '',
      doctorId: latestVisit?.doctorId || null,
      appointmentDate: latestVisit?.appointmentDate || '',
      slot: latestVisit?.slot || '',
      appointmentNumber: latestVisit?.appointmentNumber || null,
      registrationNumber: latestVisit?.registrationNumber || '',
      visitType: latestVisit?.visitType || 'OPD',
      consultationStatus: latestVisit?.consultationStatus || 'pending'
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Get Patient By ID Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get visits for a patient (visit history)
// @route   GET /api/patients/:id/visits
// @access  Private
const getPatientVisits = async (req, res) => {
  try {
    const visits = await Visit.find(tenantQuery(req, { patientId: req.params.id }))
      .populate('doctorId', 'doctorName username department')
      .sort({ createdAt: -1 });

    res.status(200).json(visits);
  } catch (error) {
    console.error('Get Patient Visits Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all registrations/visits with filters and statistics
// @route   GET /api/patients/registrations/list
// @access  Private
const getRegistrations = async (req, res) => {
  try {
    const { fromDate, toDate, uhid, registrationNumber, patientName, department, search, page = 1, limit = 50 } = req.query;
    let query = tenantQuery(req);

    if (fromDate || toDate) {
      query.registrationDate = {};
      if (fromDate) query.registrationDate.$gte = new Date(fromDate);
      if (toDate) query.registrationDate.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    if (uhid) query.uhid = { $regex: uhid, $options: 'i' };
    if (registrationNumber) query.registrationNumber = { $regex: registrationNumber, $options: 'i' };
    if (department) query.department = department;

    // If patientName search, find matching patients first
    if (patientName || search) {
      const searchTerm = patientName || search;
      const matchingPatients = await Patient.find(
        tenantQuery(req, {
          $or: [
            { patientName: { $regex: searchTerm, $options: 'i' } },
            { uhid: { $regex: searchTerm, $options: 'i' } },
            { mobile: { $regex: searchTerm, $options: 'i' } }
          ]
        })
      ).select('_id');
      query.patientId = { $in: matchingPatients.map(p => p._id) };
    }

    // Statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const tenantQ = req.user.hospitalId ? { hospitalId: req.user.hospitalId } : {};

    const [totalToday, totalMonth, totalCount] = await Promise.all([
      Visit.countDocuments({ ...tenantQ, registrationDate: { $gte: today, $lt: tomorrow } }),
      Visit.countDocuments({ ...tenantQ, registrationDate: { $gte: monthStart } }),
      Visit.countDocuments(query)
    ]);

    // Date-range filtered total
    let filteredTotal = totalCount;
    if (fromDate || toDate) {
      filteredTotal = await Visit.countDocuments(query);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const visits = await Visit.find(query)
      .populate('patientId', 'patientName mobile gender aadhaar')
      .populate('doctorId', 'doctorName username')
      .sort({ registrationDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Enrich with patient data
    const enriched = visits.map(v => ({
      _id: v._id,
      registrationNumber: v.registrationNumber,
      registrationDate: v.registrationDate,
      visitType: v.visitType,
      uhid: v.uhid,
      patientName: v.patientId?.patientName || '',
      mobile: v.patientId?.mobile || '',
      gender: v.patientId?.gender || '',
      department: v.department,
      doctorName: v.doctorId?.doctorName || v.doctorId?.username || '',
      appointmentDate: v.appointmentDate,
      slot: v.slot,
      appointmentNumber: v.appointmentNumber,
      consultationStatus: v.consultationStatus,
      patientId: v.patientId?._id,
      doctorId: v.doctorId?._id
    }));

    res.json({
      registrations: enriched,
      stats: {
        totalToday,
        totalMonth,
        totalFiltered: filteredTotal
      },
      page: parseInt(page),
      total: filteredTotal
    });
  } catch (error) {
    console.error('Get Registrations Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get visit history for a patient by UHID
// @route   GET /api/patients/registrations/history/:uhid
// @access  Private
const getVisitHistory = async (req, res) => {
  try {
    const { uhid } = req.params;
    const visits = await Visit.find(tenantQuery(req, { uhid }))
      .populate('patientId', 'patientName mobile gender aadhaar dob address')
      .populate('doctorId', 'doctorName username')
      .sort({ registrationDate: -1 });

    res.json(visits);
  } catch (error) {
    console.error('Get Visit History Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get booked slots for a doctor on a specific date
// @route   GET /api/patients/booked-slots
// @access  Private
const getBookedSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'doctorId and date query parameters are required' });
    }

    const bookings = await Visit.find(tenantQuery(req, { doctorId, appointmentDate: date })).select('slot');
    const bookedSlots = bookings.map(b => b.slot);

    res.status(200).json(bookedSlots);
  } catch (error) {
    console.error('Get Booked Slots Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a patient and associated records
// @route   DELETE /api/patients/:id
// @access  Private
const deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findOne(tenantQuery(req, { _id: patientId }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const visits = await Visit.find(tenantQuery(req, { patientId }));
    const visitIds = visits.map(v => v._id);

    const deleteQuery = { patientId: { $in: [patientId, ...visitIds.map(String)] } };
    const tenantDeleteQuery = tenantQuery(req, deleteQuery);

    await require('../models/Consultation').deleteMany(tenantDeleteQuery);
    await require('../models/Prescription').deleteMany(tenantDeleteQuery);
    await require('../models/LabRequest').deleteMany(tenantDeleteQuery);
    await require('../models/LabBill').deleteMany(tenantDeleteQuery);
    await require('../models/Billing').deleteMany(tenantDeleteQuery);
    await require('../models/SameDayTreatment').deleteMany(tenantDeleteQuery);
    await require('../models/SdtItem').deleteMany(tenantDeleteQuery);
    await require('../models/PharmacyDispense').deleteMany(tenantDeleteQuery);
    await require('../models/PatientHistory').deleteMany(tenantDeleteQuery);
    await require('../models/IpdAdmission').deleteMany(tenantDeleteQuery);
    await require('../models/IpdDischarge').deleteMany(tenantDeleteQuery);
    await require('../models/IpdConsumable').deleteMany(tenantDeleteQuery);
    await require('../models/IpdMedicine').deleteMany(tenantDeleteQuery);
    await require('../models/IpdLabTest').deleteMany(tenantDeleteQuery);
    await require('../models/IpdReferral').deleteMany(tenantDeleteQuery);
    await require('../models/IpdActivityTimeline').deleteMany(tenantDeleteQuery);
    await require('../models/IpdOtRecord').deleteMany(tenantDeleteQuery);
    await require('../models/OtBooking').deleteMany(tenantDeleteQuery);
    await require('../models/OtDocument').deleteMany(tenantDeleteQuery);

    await require('../models/Bed').updateMany(tenantQuery(req, { patientId }), {
      $set: {
        patientId: null,
        admissionId: null,
        status: 'Available',
        reservedAt: null,
        reservedFor: null
      }
    });

    await Visit.deleteMany(tenantQuery(req, { patientId }));
    await Patient.deleteOne(tenantQuery(req, { _id: patientId }));

    res.status(200).json({ message: 'Patient and related records deleted successfully' });
  } catch (error) {
    console.error('Delete Patient Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient with latest prescription
// @route   GET /api/patients/:id/with-prescription
// @access  Private
const getPatientWithPrescription = async (req, res) => {
  try {
    const patient = await Patient.findOne(tenantQuery(req, { _id: req.params.id }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const latestVisit = await Visit.findOne(tenantQuery(req, { patientId: req.params.id }))
      .populate('doctorId', 'doctorName username department')
      .sort({ createdAt: -1 });

    const Prescription = require('../models/Prescription');
    const Consultation = require('../models/Consultation');

    const prescription = await Prescription.findOne(tenantQuery(req, { patientId: req.params.id }))
      .sort({ createdAt: -1 });

    const consultation = await Consultation.findOne(tenantQuery(req, { patientId: req.params.id }))
      .sort({ createdAt: -1 });

    const prescriptionData = prescription ? {
      diagnosisRemark: consultation?.diagnosisRemark || '',
      medicines: prescription.medicines || [],
      symptoms: consultation?.symptoms || [],
      followUpDate: consultation?.followUpDate || null
    } : null;

    const responseData = {
      ...patient.toObject(),
      department: latestVisit?.department || '',
      doctorId: latestVisit?.doctorId || null,
      appointmentDate: latestVisit?.appointmentDate || '',
      slot: latestVisit?.slot || '',
      appointmentNumber: latestVisit?.appointmentNumber || null,
      registrationNumber: latestVisit?.registrationNumber || '',
      visitType: latestVisit?.visitType || 'OPD',
      consultationStatus: latestVisit?.consultationStatus || 'pending'
    };

    res.status(200).json({ patient: responseData, prescription: prescriptionData });
  } catch (error) {
    console.error('Get Patient With Prescription Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePatientDiscount = async (req, res) => {
  try {
    const { discountPercentage } = req.body;
    const { id } = req.params;

    if (discountPercentage === undefined || isNaN(discountPercentage)) {
      return res.status(400).json({ message: 'Discount percentage is required' });
    }

    const pct = parseFloat(discountPercentage);
    if (pct < 0 || pct > 100) {
      return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
    }

    const patient = await Patient.findOneAndUpdate(
      tenantQuery(req, { _id: id }),
      { $set: { discountPercentage: pct } },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json({
      message: 'Patient discount percentage updated successfully',
      patient
    });
  } catch (error) {
    console.error('Update Patient Discount Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  getPatientByAadhaar,
  getPatientVisits,
  getRegistrations,
  getVisitHistory,
  getBookedSlots,
  deletePatient,
  getPatientWithPrescription,
  updatePatientDiscount
};
