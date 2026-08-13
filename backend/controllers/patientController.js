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
      return res.status(200).json({ message: 'No patient found with this Aadhaar number', found: false });
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
      temperature,
      opdFee: reqOpdFee,
      discountType: reqDiscountType,
      discountValue: reqDiscountValue,
      paymentStatus: reqPaymentStatus,
      paymentMode: reqPaymentMode
    } = req.body;

    const isEmergency = req.body.isEmergency || (!department && !slot);

    if (!patientName || !mobile || !dob || !gender) {
      return res.status(400).json({ message: 'Patient Name, Mobile, Date of Birth, and Gender are required.' });
    }

    if (!isEmergency && (!department || !doctorId || !appointmentDate || !slot)) {
      return res.status(400).json({ message: 'All required registration fields must be provided for OPD appointments' });
    }

    const finalDepartment = department || 'Emergency';
    const finalAppointmentDate = appointmentDate || new Date().toISOString().split('T')[0];
    const finalSlot = slot || 'Emergency';

    // Verify doctor exists if doctorId is provided, or fallback to authenticated user
    let doctor = null;
    if (doctorId) {
      doctor = await User.findOne(tenantQuery(req, { _id: doctorId }));
    }
    if (!doctor) {
      doctor = await User.findOne(tenantQuery(req, { _id: req.user._id }));
    }
    const docIdForAppt = doctor?._id || req.user._id;

    // Check if slot is already booked for non-emergency registration
    if (!isEmergency && doctorId && finalSlot !== 'Emergency') {
      const slotBooked = await Visit.findOne({
        doctorId,
        appointmentDate: finalAppointmentDate,
        slot: finalSlot,
        ...(req.user.hospitalId ? { hospitalId: req.user.hospitalId } : {})
      });

      if (slotBooked) {
        return res.status(400).json({ message: 'This slot is already booked for the selected doctor and date.' });
      }
    }

    // Check if patient with this Aadhaar or Mobile number already exists
    const cleanAadhaar = aadhaar ? aadhaar.trim() : '';
    const cleanMobile = mobile ? mobile.trim() : '';

    let existingPatient = null;
    if (cleanAadhaar && cleanAadhaar.length >= 4) {
      existingPatient = await Patient.findOne(tenantQuery(req, { aadhaar: cleanAadhaar }));
    }
    if (!existingPatient && cleanMobile && cleanMobile.length >= 4) {
      existingPatient = await Patient.findOne(tenantQuery(req, { mobile: cleanMobile }));
    }

    let patient;
    let uhid;
    let isExistingPatient = false;
    let visitNumber = 1;

    if (existingPatient) {
      patient = existingPatient;
      let updated = false;
      if (category && patient.category !== category) { patient.category = category; updated = true; }
      if (patientName && patient.patientName !== patientName) { patient.patientName = patientName; updated = true; }
      if (cleanMobile && patient.mobile !== cleanMobile) { patient.mobile = cleanMobile; updated = true; }
      if (address && patient.address !== address) { patient.address = address; updated = true; }
      if (cleanAadhaar && patient.aadhaar !== cleanAadhaar) { patient.aadhaar = cleanAadhaar; updated = true; }
      if (updated) await patient.save();

      uhid = existingPatient.uhid;
      isExistingPatient = true;

      const visitCount = await Visit.countDocuments(
        tenantQuery(req, { patientId: existingPatient._id })
      );
      visitNumber = visitCount + 1;
    } else {
      uhid = await generateUhid(cleanAadhaar);

      patient = new Patient({
        hospitalId: req.user.hospitalId,
        uhid,
        patientName,
        mobile: cleanMobile,
        address,
        dob,
        gender,
        aadhaar: cleanAadhaar,
        category: category || 'General'
      });

      await patient.save();
      visitNumber = 1;
    }

    // Generate registration number
    const registrationNumber = await generateRegistrationNumber(req.user.hospitalId);

    // Generate appointment number (per doctor + department + date)
    const { appointmentNumber, appointmentDateSeq } = await generateAppointmentNumber(
      req.user.hospitalId, docIdForAppt, finalDepartment, finalAppointmentDate
    );

    // Determine visit type
    let finalVisitType = isEmergency ? 'Emergency' : (visitType || 'OPD');
    if (department && department.toLowerCase().trim() === 'same day care') {
      finalVisitType = 'Same Day Treatment';
    }

    // Process OPD Billing fields
    const parsedGrossFee = reqOpdFee !== undefined && reqOpdFee !== null && reqOpdFee !== ''
      ? Math.max(0, Number(reqOpdFee) || 0)
      : (doctor?.opdFees || 0);

    const discountType = ['amount', 'percent'].includes(reqDiscountType) ? reqDiscountType : 'none';
    const discountValue = Math.max(0, Number(reqDiscountValue) || 0);

    let calculatedDiscountAmount = 0;
    if (discountType === 'percent') {
      calculatedDiscountAmount = Number(((parsedGrossFee * Math.min(100, discountValue)) / 100).toFixed(2));
    } else if (discountType === 'amount') {
      calculatedDiscountAmount = Math.min(parsedGrossFee, discountValue);
    }

    const netOpdFee = Math.max(0, Number((parsedGrossFee - calculatedDiscountAmount).toFixed(2)));
    const paymentStatus = reqPaymentStatus === 'Not Paid' ? 'Not Paid' : 'Paid';
    const paymentMode = paymentStatus === 'Not Paid' ? 'Pending' : (reqPaymentMode || 'Cash');
    const billNumber = `OPD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create a Visit record
    const visit = new Visit({
      hospitalId: req.user.hospitalId,
      patientId: patient._id,
      uhid: patient.uhid,
      registrationNumber,
      registrationDate: new Date(),
      visitType: finalVisitType,
      department: finalDepartment,
      doctorId: docIdForAppt,
      appointmentDate: finalAppointmentDate,
      slot: finalSlot,
      appointmentNumber,
      appointmentDateSeq,
      appointmentDept: finalDepartment,
      appointmentDoctorId: docIdForAppt,
      visitNumber,
      demographics: {
        weight: weight || undefined,
        height: height || undefined,
        bloodPressure: bloodPressure || undefined,
        temperature: temperature || undefined
      },
      opdFee: parsedGrossFee,
      discountType,
      discountValue,
      discountAmount: calculatedDiscountAmount,
      netOpdFee,
      paymentStatus,
      paymentMode,
      billNumber,
      createdBy: req.user._id
    });

    await visit.save();

    // If Same Day Treatment, also create an SDT record
    let sameDayTreatmentRecord = null;
    if (finalVisitType === 'Same Day Treatment') {
      const age = dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null;

      // Get default price from settings
      let defaultPrice = 300; // default fallback for 'Minor Injury'
      try {
        const settings = await IpdAdminSettings.findOne(tenantQuery(req));
        let foundPrice = null;
        if (settings?.sameDayCareCategories) {
          for (const cat of settings.sameDayCareCategories) {
            const sub = cat.subServices.find(s => s.name.toLowerCase() === 'minor injury');
            if (sub) {
              foundPrice = sub.price;
              break;
            }
          }
        }
        if (foundPrice === null && settings?.sameDayTreatmentPrices) {
          const service = settings.sameDayTreatmentPrices.find(s => s.name === 'Minor Injury');
          if (service) foundPrice = service.price;
        }
        if (foundPrice !== null) defaultPrice = foundPrice;
      } catch (e) { /* ignore */ }

      sameDayTreatmentRecord = new SameDayTreatment({
        hospitalId: req.user.hospitalId,
        patientId: patient._id,
        patientName: patient.patientName,
        uhid: patient.uhid,
        mobile: patient.mobile,
        gender: patient.gender,
        age,
        treatmentType: '', // Empty, no longer default to 'Minor Injury'
        treatmentDate: new Date(),
        diagnosis: '',
        status: 'Draft',
        price: 0,
        isFixedPrice: true,
        createdBy: req.user._id,
        updatedBy: req.user._id,
        assignedStaffId: doctor._id,
        assignedStaffName: doctor.doctorName || doctor.username
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
      sameDayTreatmentId: sameDayTreatmentRecord?._id || null,
      opdFee: visit.opdFee,
      discountType: visit.discountType,
      discountValue: visit.discountValue,
      discountAmount: visit.discountAmount,
      netOpdFee: visit.netOpdFee,
      paymentStatus: visit.paymentStatus,
      paymentMode: visit.paymentMode,
      billNumber: visit.billNumber
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
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all patients or search patients (with role-based filtering)
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
  try {
    const { search, excludeCompleted, sameDayCareOnly, page = 1, limit = 20 } = req.query;
    let query = tenantQuery(req);

    // Role-based filtering
    if (req.user.role === 'doctor') {
      const doctorVisits = await Visit.find(tenantQuery(req, { doctorId: req.user._id }))
        .select('patientId');
      const patientIds = [...new Set(doctorVisits.map(v => v.patientId.toString()))];
      query = { ...query, _id: { $in: patientIds } };
    }

    if (sameDayCareOnly === 'true') {
      let sdtQuery = tenantQuery(req);
      let visitQuery = {
        $or: [
          { department: { $regex: /^same day care$/i } },
          { visitType: 'Same Day Treatment' }
        ]
      };

      if (req.user.role === 'doctor') {
        sdtQuery.assignedStaffId = req.user._id;
        visitQuery.doctorId = req.user._id;
      }

      const sdtPatientIds = await SameDayTreatment.find(sdtQuery).distinct('patientId');
      const sdtVisitPatientIds = await Visit.find(tenantQuery(req, visitQuery)).distinct('patientId');

      const allowedPatientIds = [...new Set([
        ...sdtPatientIds.map(id => id.toString()),
        ...sdtVisitPatientIds.map(id => id.toString())
      ])];

      if (query._id) {
        const intersection = query._id.$in.filter(id => allowedPatientIds.includes(id));
        query._id = { $in: intersection };
      } else {
        query._id = { $in: allowedPatientIds };
      }
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
          .populate('createdBy', 'username doctorName role')
          .sort({ createdAt: -1 });

        const Prescription = require('../models/Prescription');
        const hasPrescription = latestVisit 
          ? await Prescription.exists(tenantQuery(req, { patientId: pat._id, visitId: latestVisit._id }))
          : false;

        return {
          ...pat.toObject(),
          department: latestVisit?.department || '',
          doctorId: latestVisit?.doctorId || null,
          appointmentDate: latestVisit?.appointmentDate || '',
          slot: latestVisit?.slot || '',
          appointmentNumber: latestVisit?.appointmentNumber || null,
          registrationNumber: latestVisit?.registrationNumber || '',
          visitType: latestVisit?.visitType || 'OPD',
          consultationStatus: latestVisit?.consultationStatus || 'pending',
          hasPrescription: !!hasPrescription,
          registeredBy: latestVisit?.createdBy ? (latestVisit.createdBy.doctorName || latestVisit.createdBy.username) : 'N/A',
          opdFee: latestVisit?.opdFee !== undefined ? latestVisit.opdFee : (latestVisit?.doctorId?.opdFees || 0),
          discountType: latestVisit?.discountType || 'none',
          discountValue: latestVisit?.discountValue || 0,
          discountAmount: latestVisit?.discountAmount || 0,
          netOpdFee: latestVisit?.netOpdFee !== undefined ? latestVisit.netOpdFee : (latestVisit?.opdFee || 0),
          paymentStatus: latestVisit?.paymentStatus || 'Paid',
          paymentMode: latestVisit?.paymentMode || 'Cash',
          billNumber: latestVisit?.billNumber || null
        };
      })
    );

    let result = patientsWithVisits;
    if (excludeCompleted === 'true') {
      result = patientsWithVisits.filter(pat => pat.consultationStatus !== 'completed');
    }

    if (req.query.page || req.query.limit) {
      const currentPage = Math.max(1, parseInt(page) || 1);
      const limitVal = Math.max(1, parseInt(limit) || 20);
      const totalRecords = result.length;
      const totalPages = Math.ceil(totalRecords / limitVal) || 1;
      const paginated = result.slice((currentPage - 1) * limitVal, currentPage * limitVal);

      return res.status(200).json({
        patients: paginated,
        page: currentPage,
        pageSize: limitVal,
        totalRecords,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      });
    }

    res.status(200).json(result);
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
      .populate('createdBy', 'username doctorName role')
      .sort({ createdAt: -1 });

    const IpdAdmission = require('../models/IpdAdmission');
    const latestIpdAdmission = await IpdAdmission.findOne(
      tenantQuery(req, { patientId: patient._id })
    ).sort({ createdAt: -1 });
    const isDischarged = latestIpdAdmission?.status === 'Discharged';

    const responseData = {
      ...patient.toObject(),
      department: latestVisit?.department || '',
      doctorId: latestVisit?.doctorId || null,
      appointmentDate: latestVisit?.appointmentDate || '',
      slot: latestVisit?.slot || '',
      appointmentNumber: latestVisit?.appointmentNumber || null,
      registrationNumber: latestVisit?.registrationNumber || '',
      visitType: latestVisit?.visitType || 'OPD',
      consultationStatus: latestVisit?.consultationStatus || 'pending',
      demographics: latestVisit?.demographics || null,
      isDischarged,
      registeredBy: latestVisit?.createdBy ? (latestVisit.createdBy.doctorName || latestVisit.createdBy.username) : 'N/A',
      opdFee: latestVisit?.opdFee !== undefined ? latestVisit.opdFee : (latestVisit?.doctorId?.opdFees || 0),
      discountType: latestVisit?.discountType || 'none',
      discountValue: latestVisit?.discountValue || 0,
      discountAmount: latestVisit?.discountAmount || 0,
      netOpdFee: latestVisit?.netOpdFee !== undefined ? latestVisit.netOpdFee : (latestVisit?.opdFee || 0),
      paymentStatus: latestVisit?.paymentStatus || 'Paid',
      paymentMode: latestVisit?.paymentMode || 'Cash',
      billNumber: latestVisit?.billNumber || null
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
    const { fromDate, toDate, uhid, registrationNumber, patientName, department, search, filter, page = 1, limit = 20 } = req.query;
    let query = tenantQuery(req);

    const d = new Date();
    const todayStr = d.toISOString().slice(0, 10);
    d.setDate(d.getDate() + 1);
    const tomorrowStr = d.toISOString().slice(0, 10);

    if (filter === 'previous') {
      query.appointmentDate = { $lt: todayStr };
    } else if (filter === 'today') {
      query.appointmentDate = { $regex: `^${todayStr}` };
    } else if (filter === 'upcoming') {
      query.appointmentDate = { $gte: tomorrowStr };
    } else if (filter === 'completed') {
      query.consultationStatus = 'completed';
    } else if (fromDate || toDate) {
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

    const currentPage = Math.max(1, parseInt(page) || 1);
    const limitVal = Math.max(1, parseInt(limit) || 20);
    const skip = (currentPage - 1) * limitVal;
    const visits = await Visit.find(query)
      .populate('patientId', 'patientName mobile gender aadhaar')
      .populate('doctorId', 'doctorName username')
      .sort({ registrationDate: -1 })
      .skip(skip)
      .limit(limitVal);

    // Fetch linked consultation follow-up dates for doctor-assigned follow-ups
    const Consultation = require('../models/Consultation');
    const visitIds = visits.map(v => v._id);
    const consultations = await Consultation.find(
      tenantQuery(req, { visitId: { $in: visitIds } })
    ).select('visitId followUpDate');

    const consultationMap = {};
    consultations.forEach(c => {
      if (c.visitId && c.followUpDate) {
        consultationMap[c.visitId.toString()] = c.followUpDate;
      }
    });

    const unlinkedVisitPatientIds = visits
      .filter(v => !v.followUpDate && !consultationMap[v._id.toString()] && v.patientId?._id)
      .map(v => v.patientId._id);

    let patientConsultationMap = {};
    if (unlinkedVisitPatientIds.length > 0) {
      const patientConsults = await Consultation.find(
        tenantQuery(req, { patientId: { $in: unlinkedVisitPatientIds }, followUpDate: { $exists: true, $ne: null, $ne: '' } })
      ).sort({ createdAt: -1 });
      patientConsults.forEach(c => {
        if (c.patientId && !patientConsultationMap[c.patientId.toString()]) {
          patientConsultationMap[c.patientId.toString()] = c.followUpDate;
        }
      });
    }

    // Fetch patient due balances from Billing
    const Billing = require('../models/Billing');
    const patientIds = visits.map(v => v.patientId?._id).filter(Boolean);
    const uhids = visits.map(v => v.uhid).filter(Boolean);

    const patientDueMap = {};
    if (patientIds.length > 0 || uhids.length > 0) {
      const dues = await Billing.aggregate([
        {
          $match: tenantQuery(req, {
            $or: [
              { patientId: { $in: patientIds } },
              { uhid: { $in: uhids } }
            ],
            status: 'Final',
            dueAmount: { $gt: 0 }
          })
        },
        {
          $group: {
            _id: '$patientId',
            uhid: { $first: '$uhid' },
            totalDue: { $sum: '$dueAmount' }
          }
        }
      ]);

      dues.forEach(d => {
        if (d._id) patientDueMap[d._id.toString()] = d.totalDue;
        if (d.uhid) patientDueMap[d.uhid] = d.totalDue;
      });
    }

    // Enrich with patient data & follow-up information
    const enriched = visits.map(v => {
      let effectiveFollowUpDate = v.followUpDate || null;
      let effectiveFollowUpSource = v.followUpSource || null;
      let effectiveFollowUpRemarks = v.followUpRemarks || '';

      if (v.followUpSource === 'reception') {
        effectiveFollowUpDate = v.followUpDate || null;
        effectiveFollowUpSource = v.followUpDate ? 'reception' : null;
        effectiveFollowUpRemarks = v.followUpRemarks || '';
      } else {
        const docFollowUp = consultationMap[v._id.toString()] || (v.patientId?._id ? patientConsultationMap[v.patientId._id.toString()] : null);
        if (docFollowUp) {
          effectiveFollowUpDate = docFollowUp;
          effectiveFollowUpSource = 'doctor';
        } else if (v.followUpDate) {
          effectiveFollowUpDate = v.followUpDate;
          effectiveFollowUpSource = v.followUpSource || 'doctor';
        }
      }

      const pIdStr = v.patientId?._id ? v.patientId._id.toString() : null;
      const dueAmt = (pIdStr && patientDueMap[pIdStr] !== undefined) ? patientDueMap[pIdStr] : (patientDueMap[v.uhid] || 0);

      return {
        _id: v._id,
        registrationNumber: v.registrationNumber,
        registrationDate: v.registrationDate,
        visitType: v.visitType,
        uhid: v.uhid,
        patientName: v.patientId?.patientName || '',
        mobile: v.patientId?.mobile || '',
        gender: v.patientId?.gender || '',
        aadhaar: v.patientId?.aadhaar || '',
        department: v.department,
        doctorName: v.doctorId?.doctorName || v.doctorId?.username || '',
        appointmentDate: v.appointmentDate,
        slot: v.slot,
        appointmentNumber: v.appointmentNumber,
        consultationStatus: v.consultationStatus,
        patientId: v.patientId?._id,
        doctorId: v.doctorId?._id,
        followUpDate: effectiveFollowUpDate,
        followUpSource: effectiveFollowUpSource,
        followUpRemarks: effectiveFollowUpRemarks,
        dueAmount: dueAmt
      };
    });

    const totalPages = Math.ceil(totalCount / limitVal) || 1;

    res.json({
      registrations: enriched,
      stats: {
        totalToday,
        totalMonth,
        totalFiltered: totalCount
      },
      page: currentPage,
      pageSize: limitVal,
      limit: limitVal,
      totalRecords: totalCount,
      total: totalCount,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
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

    const Consultation = require('../models/Consultation');
    const visitIds = visits.map(v => v._id);
    const consultations = await Consultation.find(
      tenantQuery(req, { visitId: { $in: visitIds } })
    ).select('visitId followUpDate followUpRemarks');

    const consultationMap = {};
    consultations.forEach(c => {
      if (c.visitId) {
        consultationMap[c.visitId.toString()] = c;
      }
    });

    const enrichedVisits = visits.map(v => {
      const docConsult = consultationMap[v._id.toString()];
      const effectiveDate = v.followUpDate || docConsult?.followUpDate || null;
      const effectiveSource = v.followUpSource || (docConsult?.followUpDate ? 'doctor' : null);
      const effectiveRemarks = v.followUpRemarks || docConsult?.followUpRemarks || '';

      return {
        ...v.toObject(),
        followUpDate: effectiveDate,
        followUpSource: effectiveSource,
        followUpRemarks: effectiveRemarks
      };
    });

    res.json({ visits: enrichedVisits });
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
      { returnDocument: 'after' }
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

// @desc    Look up existing patient by Aadhaar OR Mobile number
// @route   GET /api/patients/lookup
// @access  Private
const lookupPatient = async (req, res) => {
  try {
    const { aadhaar, mobile } = req.query;
    if ((!aadhaar || aadhaar.trim().length < 4) && (!mobile || mobile.trim().length < 4)) {
      return res.status(400).json({ message: 'Valid Aadhaar or Mobile number is required' });
    }

    const conditions = [];
    if (aadhaar && aadhaar.trim().length >= 4) {
      conditions.push({ aadhaar: aadhaar.trim() });
    }
    if (mobile && mobile.trim().length >= 4) {
      conditions.push({ mobile: mobile.trim() });
    }

    const patient = await Patient.findOne(tenantQuery(req, { $or: conditions })).sort({ createdAt: -1 });

    if (!patient) {
      return res.status(200).json({ message: 'No patient found', found: false });
    }

    // Get the latest visit for this patient
    const latestVisit = await Visit.findOne(tenantQuery(req, { patientId: patient._id }))
      .populate('doctorId', 'doctorName username department')
      .sort({ createdAt: -1 });

    res.status(200).json({ found: true, patient, latestVisit });
  } catch (error) {
    console.error('Lookup Patient Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update patient details (and optional visit details)
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
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
      visitId
    } = req.body;

    const patient = await Patient.findOne(tenantQuery(req, { _id: id }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patientName !== undefined) patient.patientName = patientName.trim();
    if (mobile !== undefined) patient.mobile = mobile.trim();
    if (address !== undefined) patient.address = address;
    if (dob !== undefined) patient.dob = dob;
    if (gender !== undefined) patient.gender = gender;
    if (aadhaar !== undefined) patient.aadhaar = aadhaar ? aadhaar.trim() : '';
    if (category !== undefined) patient.category = category;

    await patient.save();

    // If visitId or visit details provided, update Visit record as well
    if (visitId) {
      const visit = await Visit.findOne(tenantQuery(req, { _id: visitId }));
      if (visit) {
        if (department !== undefined) visit.department = department;
        if (doctorId !== undefined) visit.doctorId = doctorId;
        if (appointmentDate !== undefined) visit.appointmentDate = appointmentDate;
        if (slot !== undefined) visit.slot = slot;
        await visit.save();
      }
    }

    res.status(200).json({
      message: 'Patient details updated successfully',
      patient
    });
  } catch (error) {
    console.error('Update Patient Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update visit follow-up date (set by reception)
// @route   PUT /api/patients/registrations/:id/follow-up
// @access  Private
const updateFollowUpDate = async (req, res) => {
  try {
    const { id } = req.params; // Visit ID
    const { followUpDate, followUpRemarks, noFollowUp } = req.body;

    const visit = await Visit.findOne(tenantQuery(req, { _id: id }));
    if (!visit) {
      return res.status(404).json({ message: 'Registration visit not found' });
    }

    if (noFollowUp || !followUpDate) {
      visit.followUpDate = null;
      visit.followUpSource = 'reception';
      visit.followUpRemarks = '';
    } else {
      visit.followUpDate = followUpDate.trim();
      visit.followUpSource = 'reception';
      if (followUpRemarks !== undefined) {
        visit.followUpRemarks = followUpRemarks.trim();
      }
    }

    await visit.save();

    res.status(200).json({
      message: 'Follow-up date updated successfully',
      visit: {
        _id: visit._id,
        followUpDate: visit.followUpDate,
        followUpSource: visit.followUpSource,
        followUpRemarks: visit.followUpRemarks
      }
    });
  } catch (error) {
    console.error('Update Follow Up Date Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get follow-up patients list with filtering (today, upcoming, date range, search)
// @route   GET /api/patients/registrations/follow-ups
// @access  Private
const getFollowUpPatients = async (req, res) => {
  try {
    const { filter = 'today', fromDate, toDate, search, department, page = 1, limit = 20 } = req.query;

    const todayStr = new Date().toISOString().split('T')[0];

    let visitQuery = tenantQuery(req);
    if (department) visitQuery.department = department;

    const visits = await Visit.find(visitQuery)
      .populate('patientId', 'patientName mobile gender aadhaar dob address')
      .populate('doctorId', 'doctorName username')
      .sort({ registrationDate: -1 });

    const Consultation = require('../models/Consultation');
    const visitIds = visits.map(v => v._id);
    const consultations = await Consultation.find(
      tenantQuery(req, { visitId: { $in: visitIds } })
    ).select('visitId followUpDate followUpRemarks doctorId').populate('doctorId', 'doctorName username');

    const consultationMap = {};
    consultations.forEach(c => {
      if (c.visitId && c.followUpDate) {
        consultationMap[c.visitId.toString()] = {
          date: c.followUpDate,
          remarks: c.followUpRemarks || '',
          doctorName: c.doctorId?.doctorName || c.doctorId?.username || ''
        };
      }
    });

    const unlinkedVisitPatientIds = visits
      .filter(v => !v.followUpDate && !consultationMap[v._id.toString()] && v.patientId?._id)
      .map(v => v.patientId._id);

    let patientConsultationMap = {};
    if (unlinkedVisitPatientIds.length > 0) {
      const patientConsults = await Consultation.find(
        tenantQuery(req, { patientId: { $in: unlinkedVisitPatientIds }, followUpDate: { $exists: true, $ne: null, $ne: '' } })
      ).populate('doctorId', 'doctorName username').sort({ createdAt: -1 });

      patientConsults.forEach(c => {
        if (c.patientId && !patientConsultationMap[c.patientId.toString()]) {
          patientConsultationMap[c.patientId.toString()] = {
            date: c.followUpDate,
            remarks: c.followUpRemarks || '',
            doctorName: c.doctorId?.doctorName || c.doctorId?.username || ''
          };
        }
      });
    }

    let list = [];
    visits.forEach(v => {
      let fDate = null;
      let fSource = null;
      let fRemarks = '';
      let setterName = '';

      if (v.followUpSource === 'reception') {
        fDate = v.followUpDate || null;
        fSource = v.followUpDate ? 'reception' : null;
        fRemarks = v.followUpRemarks || '';
        setterName = 'Reception';
      } else {
        const docConsult = consultationMap[v._id.toString()] || (v.patientId?._id ? patientConsultationMap[v.patientId._id.toString()] : null);
        if (docConsult?.date) {
          fDate = docConsult.date;
          fSource = 'doctor';
          fRemarks = docConsult.remarks || v.followUpRemarks || '';
          setterName = docConsult.doctorName ? `Dr. ${docConsult.doctorName}` : 'Doctor';
        } else if (v.followUpDate) {
          fDate = v.followUpDate;
          fSource = v.followUpSource || 'doctor';
          fRemarks = v.followUpRemarks || '';
          setterName = v.doctorId?.doctorName ? `Dr. ${v.doctorId.doctorName}` : 'Doctor';
        }
      }

      if (fDate) {
        list.push({
          _id: v._id,
          registrationNumber: v.registrationNumber,
          registrationDate: v.registrationDate,
          uhid: v.uhid,
          patientId: v.patientId?._id,
          patientName: v.patientId?.patientName || '',
          mobile: v.patientId?.mobile || '',
          gender: v.patientId?.gender || '',
          aadhaar: v.patientId?.aadhaar || '',
          address: v.patientId?.address || '',
          department: v.department,
          doctorId: v.doctorId?._id,
          doctorName: v.doctorId?.doctorName || v.doctorId?.username || '',
          followUpDate: fDate,
          followUpSource: fSource,
          followUpRemarks: fRemarks,
          setterName: setterName,
          consultationStatus: v.consultationStatus
        });
      }
    });

    // Remove duplicates (keep latest per patient)
    const uniqueMap = {};
    list.forEach(item => {
      const key = item.patientId ? item.patientId.toString() : item.uhid;
      if (!uniqueMap[key] || new Date(item.registrationDate) > new Date(uniqueMap[key].registrationDate)) {
        uniqueMap[key] = item;
      }
    });

    let result = Object.values(uniqueMap);

    // Calculate stats
    const todayCount = result.filter(item => item.followUpDate.split('T')[0] === todayStr).length;
    const upcomingCount = result.filter(item => item.followUpDate.split('T')[0] >= todayStr).length;
    const totalCount = result.length;

    // Apply Filter
    if (filter === 'today') {
      result = result.filter(item => item.followUpDate.split('T')[0] === todayStr);
    } else if (filter === 'upcoming') {
      result = result.filter(item => item.followUpDate.split('T')[0] >= todayStr);
    } else if (filter === 'range' && (fromDate || toDate)) {
      result = result.filter(item => {
        const itemDateStr = item.followUpDate.split('T')[0];
        if (fromDate && itemDateStr < fromDate) return false;
        if (toDate && itemDateStr > toDate) return false;
        return true;
      });
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      result = result.filter(item =>
        item.patientName.toLowerCase().includes(q) ||
        item.uhid.toLowerCase().includes(q) ||
        item.mobile.includes(q) ||
        item.doctorName.toLowerCase().includes(q) ||
        item.setterName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

    const currentPage = Math.max(1, parseInt(page) || 1);
    const limitVal = Math.max(1, parseInt(limit) || 20);
    const totalRecords = result.length;
    const totalPages = Math.ceil(totalRecords / limitVal) || 1;
    const paginated = result.slice((currentPage - 1) * limitVal, currentPage * limitVal);

    res.json({
      followUps: paginated,
      stats: {
        todayCount,
        upcomingCount,
        totalCount
      },
      page: currentPage,
      pageSize: limitVal,
      totalRecords,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    });
  } catch (error) {
    console.error('Get Follow Up Patients Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  getPatientByAadhaar,
  lookupPatient,
  getPatientVisits,
  getRegistrations,
  getVisitHistory,
  getBookedSlots,
  deletePatient,
  getPatientWithPrescription,
  updatePatientDiscount,
  updatePatient,
  updateFollowUpDate,
  getFollowUpPatients
};
