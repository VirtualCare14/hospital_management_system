const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const SameDayTreatment = require('../models/SameDayTreatment');
const IpdAdminSettings = require('../models/IpdAdminSettings');
const VisitingDoctorSchedule = require('../models/VisitingDoctorSchedule');
const generateUhid = require('../utils/generateUhid');
const { isSamePatientName, normalizePatientName } = require('../utils/patientUtils');

const tenantQuery = (req, extra = {}) => (
  req?.user?.hospitalId ? { ...extra, hospitalId: req.user.hospitalId } : extra
);

// Parse time string ("10:00", "10:00 AM", "02:30 PM", "14:30") to minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim().toUpperCase();
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const modifier = ampmMatch[3];
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }
  return null;
};

// Parse slot string into start and end minutes
const parseSlotTimeRange = (slotStr, defaultDuration = 15) => {
  if (!slotStr || typeof slotStr !== 'string') return null;
  const parts = slotStr.split('-').map(s => s.trim());
  const startMins = parseTimeToMinutes(parts[0]);
  if (startMins === null) return null;
  let endMins;
  if (parts.length > 1) {
    endMins = parseTimeToMinutes(parts[1]);
    if (endMins === null) return null;
  } else {
    endMins = startMins + defaultDuration;
  }
  return { startMins, endMins };
};

// Format minutes from midnight to 12h string (e.g. 600 => "10:00 AM")
const formatMinutesTo12h = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? '0' + hours : '' + hours;
  const strMinutes = minutes < 10 ? '0' + minutes : '' + minutes;
  return `${strHours}:${strMinutes} ${ampm}`;
};

// Resolve hospital ID helper strictly enforcing tenant isolation and authorization
const resolveHospitalId = async (req) => {
  // 1. Authenticated user's hospital is strictly authoritative when present
  if (req?.user?.hospitalId) {
    return req.user.hospitalId;
  }
  if (req?.hospital?._id && req.hospital.isActive !== false) {
    return req.hospital._id;
  }

  // 2. Explicit target hospital allowed ONLY for authorized superadmin
  if (req?.user?.role === 'superadmin' && req?.body?.hospitalId) {
    try {
      if (mongoose.Types.ObjectId.isValid(req.body.hospitalId)) {
        const targetHosp = await Hospital.findById(req.body.hospitalId).select('_id isActive');
        if (targetHosp && targetHosp.isActive) {
          return targetHosp._id;
        }
      }
    } catch (err) {
      console.warn('Superadmin target hospital lookup error:', err.message);
    }
    return null;
  }

  // 3. Single-tenant development/test fallback only when NOT in production
  // NEVER auto-create hospitals and NEVER silently select arbitrary hospitals in production
  if (process.env.NODE_ENV !== 'production') {
    try {
      const defaultHosp = await Hospital.findOne({ isActive: true }).select('_id');
      if (defaultHosp) return defaultHosp._id;
    } catch (hospErr) {
      console.warn('Development fallback hospital lookup error:', hospErr.message);
    }
  }

  return null;
};

// Helper to get patient IDs strictly belonging to this clinic
const getClinicPatientIds = async (req) => {
  if (!req?.user || req.user.role !== 'clinic') return null;
  const hFilter = req.user.hospitalId ? { hospitalId: req.user.hospitalId } : {};
  const [visitPatientIds, directPatientIds] = await Promise.all([
    Visit.find({
      ...hFilter,
      $or: [{ createdBy: req.user._id }, { doctorId: req.user._id }]
    }).distinct('patientId'),
    Patient.find({
      ...hFilter,
      createdBy: req.user._id
    }).distinct('_id')
  ]);
  return [...new Set([...visitPatientIds.map(id => id.toString()), ...directPatientIds.map(id => id.toString())])];
};

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

    let query = tenantQuery(req, { aadhaar: aadhaar.trim() });
    if (req.user.role === 'clinic') {
      const clinicPatientIds = await getClinicPatientIds(req);
      if (!clinicPatientIds || clinicPatientIds.length === 0) {
        return res.status(200).json({ message: 'No patient found in clinic records', found: false });
      }
      query._id = { $in: clinicPatientIds };
    }

    const patient = await Patient.findOne(query);

    if (!patient) {
      return res.status(200).json({ message: 'No patient found with this Aadhaar number', found: false });
    }

    // Get the latest visit for this patient (for clinic role, only clinic's latest visit)
    let visitQuery = { patientId: patient._id };
    if (req.user.hospitalId) visitQuery.hospitalId = req.user.hospitalId;
    if (req.user.role === 'clinic') {
      visitQuery.$or = [{ createdBy: req.user._id }, { doctorId: req.user._id }];
    }

    const latestVisit = await Visit.findOne(visitQuery)
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
      isVisitingDoctor: reqIsVisitingDoctor,
      visitingScheduleId: reqVisitingScheduleId,
      appointmentDate,
      slot,
      visitType,
      weight,
      height,
      bloodPressure,
      temperature,
      cvs,
      respiratoryRate,
      rr,
      pulseRate,
      pulse,
      pr,
      perAbdomen,
      pa,
      bilateralChest,
      spo2,
      opdFee: reqOpdFee,
      discountType: reqDiscountType,
      discountValue: reqDiscountValue,
      paymentStatus: reqPaymentStatus,
      paymentMode: reqPaymentMode,
      splitPayments: reqSplitPayments,
      mixedPayments: reqMixedPayments
    } = req.body;

    const cleanAddress = (address && typeof address === 'string' && address.trim()) ? address.trim() : 'Not specified';
    const cleanGender = gender || 'Male';
    let cleanDob = dob ? new Date(dob) : null;
    if (!cleanDob || isNaN(cleanDob.getTime())) {
      const parsedAge = parseInt(req.body.age || req.body.ageYears, 10) || 30;
      const birthYear = new Date().getFullYear() - parsedAge;
      cleanDob = new Date(`${birthYear}-01-01`);
    }

    const isLab = visitType === 'Lab' || req.body.isLab || (department && (department === 'Laboratory' || department === 'Diagnostics' || department.toLowerCase().includes('lab')));
    const isEmergency = req.body.isEmergency || (!department && !slot && !isLab);
    const isVisiting = Boolean(reqIsVisitingDoctor && reqVisitingScheduleId);

    if (!patientName || !mobile) {
      return res.status(400).json({ message: 'Patient Name and Mobile are required.' });
    }

    if (!isEmergency && !isLab) {
      if (isVisiting) {
        if (!department || !appointmentDate || !slot) {
          return res.status(400).json({ message: 'Department, Appointment Date, and Slot are required for Super Speciality appointments' });
        }
      } else if (!department || !doctorId || !appointmentDate || !slot) {
        return res.status(400).json({ message: 'All required registration fields must be provided for OPD appointments' });
      }
    }

    const finalDepartment = department || (isLab ? 'Laboratory' : (isEmergency ? 'Emergency' : 'General'));
    const finalAppointmentDate = appointmentDate || new Date().toISOString().split('T')[0];
    const finalSlot = slot || (isLab ? 'Lab Walk-in' : (isEmergency ? 'Emergency' : 'Walk-in'));

    // Resolve hospital ID early to ensure consistency across schedule verification, slot checks, and visit creation
    const resolvedHospitalId = await resolveHospitalId(req);
    if (!resolvedHospitalId) {
      return res.status(403).json({
        message: 'Unable to resolve authorized hospital tenant context. Access denied.'
      });
    }

    req.hospitalId = resolvedHospitalId;
    if (req.user && !req.user.hospitalId) {
      req.user.hospitalId = resolvedHospitalId;
    }

    // Visiting Specialist verification & duplicate slot check
    // Validate appointment date against server authoritative current date in hospital timezone
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
    const [h, m] = timeStr.split(':').map(Number);
    const currentMinutes = h * 60 + m;

    if (finalAppointmentDate < todayStr) {
      return res.status(400).json({ message: 'Cannot book appointments for past dates.' });
    }

    let visitingSchedule = null;
    if (isVisiting) {
      visitingSchedule = await VisitingDoctorSchedule.findOne({
        _id: reqVisitingScheduleId,
        hospitalId: resolvedHospitalId
      });
      if (!visitingSchedule || visitingSchedule.status !== 'Active') {
        return res.status(400).json({ message: 'Selected doctor schedule not found or is no longer active.' });
      }
      if (!visitingSchedule.visitDates.includes(finalAppointmentDate)) {
        return res.status(400).json({
          message: `Selected doctor is not scheduled to visit on ${finalAppointmentDate}. Configured dates: ${visitingSchedule.visitDates.join(', ')}`
        });
      }

      if (!isEmergency && !isLab && finalSlot !== 'Emergency' && finalSlot !== 'Lab Walk-in') {
        const duration = visitingSchedule.slotDuration || 15;
        const slotTimes = parseSlotTimeRange(finalSlot, duration);
        const schedStartMins = parseTimeToMinutes(visitingSchedule.startTime);
        const schedEndMins = parseTimeToMinutes(visitingSchedule.endTime);

        if (slotTimes === null || schedStartMins === null || schedEndMins === null || slotTimes.startMins < schedStartMins || slotTimes.endMins > schedEndMins) {
          return res.status(400).json({
            message: `Selected slot (${finalSlot}) falls outside the doctor visiting hours (${visitingSchedule.startTime} - ${visitingSchedule.endTime}).`
          });
        }

        // Prevent booking slots that have already passed today
        if (finalAppointmentDate === todayStr && slotTimes.startMins < currentMinutes) {
          return res.status(400).json({
            message: 'Cannot book a slot whose time has already passed today.'
          });
        }

        const slotParts = finalSlot.split('-').map(s => s.trim());
        if (slotParts.length > 1 && (slotTimes.endMins - slotTimes.startMins) !== duration) {
          return res.status(400).json({
            message: `Selected slot duration does not match the configured schedule duration of ${duration} minutes.`
          });
        }

        const startOnlySlot = formatMinutesTo12h(slotTimes.startMins);
        const fullRangeSlot = `${startOnlySlot} - ${formatMinutesTo12h(slotTimes.endMins)}`;

        const slotBooked = await Visit.findOne({
          visitingScheduleId: visitingSchedule._id,
          appointmentDate: finalAppointmentDate,
          hospitalId: resolvedHospitalId,
          consultationStatus: { $ne: 'cancelled' },
          $or: [
            { slot: finalSlot },
            { slot: startOnlySlot },
            { slot: fullRangeSlot }
          ]
        });

        if (slotBooked) {
          return res.status(400).json({ message: 'This slot is already booked for this doctor on the selected date.' });
        }
      }
    }

    // Permanent doctor verification & duplicate slot check
    let doctor = null;
    let docIdForAppt = null;
    if (!isVisiting) {
      if (doctorId) {
        doctor = await User.findOne(tenantQuery(req, { _id: doctorId }));
      }
      if (!doctor) {
        doctor = await User.findOne(tenantQuery(req, { _id: req.user._id }));
      }
      docIdForAppt = doctor?._id || req.user._id;

      if (!isEmergency && !isLab && doctorId && finalSlot !== 'Emergency' && finalSlot !== 'Lab Walk-in') {
        const slotBooked = await Visit.findOne({
          doctorId,
          appointmentDate: finalAppointmentDate,
          slot: finalSlot,
          hospitalId: resolvedHospitalId
        });

        if (slotBooked) {
          return res.status(400).json({ message: 'This slot is already booked for the selected doctor and date.' });
        }
      }
    }

    // Check if patient with this Aadhaar or Mobile number already exists (scoped to clinic if clinic role)
    const cleanAadhaar = aadhaar ? aadhaar.trim() : '';
    const cleanMobile = mobile ? mobile.trim() : '';

    let existingPatient = null;
    let clinicPatientIds = null;
    if (req.user.role === 'clinic') {
      clinicPatientIds = await getClinicPatientIds(req);
    }

    const buildExistingQuery = (baseCond) => {
      let q = tenantQuery(req, baseCond);
      if (req.user.role === 'clinic') {
        if (!clinicPatientIds || clinicPatientIds.length === 0) {
          return null;
        }
        q._id = { $in: clinicPatientIds };
      }
      return q;
    };

    // Check if patient with this Aadhaar, Mobile, or explicit ID matches existing records
    if (cleanAadhaar && cleanAadhaar.length >= 4) {
      const q = buildExistingQuery({ aadhaar: cleanAadhaar });
      if (q) {
        const aadhaarCandidates = await Patient.find(q).sort({ createdAt: -1 });
        existingPatient = aadhaarCandidates.find(p => isSamePatientName(p.patientName, patientName)) || null;
      }
    }
    if (!existingPatient && cleanMobile && cleanMobile.length >= 4) {
      const q = buildExistingQuery({ mobile: cleanMobile });
      if (q) {
        const mobileCandidates = await Patient.find(q).sort({ createdAt: -1 });
        existingPatient = mobileCandidates.find(p => isSamePatientName(p.patientName, patientName)) || null;
      }
    }
    if (!existingPatient && req.body.patientId && mongoose.Types.ObjectId.isValid(req.body.patientId)) {
      const q = buildExistingQuery({ _id: req.body.patientId });
      if (q) {
        const directPatient = await Patient.findOne(q);
        if (directPatient && isSamePatientName(directPatient.patientName, patientName)) {
          existingPatient = directPatient;
        }
      }
    }
    if (!existingPatient && req.body.uhid) {
      const q = buildExistingQuery({ uhid: req.body.uhid.trim() });
      if (q) {
        const directPatient = await Patient.findOne(q);
        if (directPatient && isSamePatientName(directPatient.patientName, patientName)) {
          existingPatient = directPatient;
        }
      }
    }

    let patient;
    let uhid;
    let isExistingPatient = false;
    let visitNumber = 1;



    if (existingPatient) {
      patient = existingPatient;
      let updated = false;
      if (category && patient.category !== category) { patient.category = category; updated = true; }
      if (cleanMobile && patient.mobile !== cleanMobile) { patient.mobile = cleanMobile; updated = true; }
      if (cleanAddress && (!patient.address || patient.address === 'Not specified')) { patient.address = cleanAddress; updated = true; }
      if (cleanAadhaar && patient.aadhaar !== cleanAadhaar) { patient.aadhaar = cleanAadhaar; updated = true; }
      if (!patient.hospitalId && resolvedHospitalId) { patient.hospitalId = resolvedHospitalId; updated = true; }
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
        hospitalId: resolvedHospitalId,
        uhid,
        patientName,
        mobile: cleanMobile,
        address: cleanAddress,
        dob: cleanDob,
        gender: cleanGender,
        aadhaar: cleanAadhaar,
        category: category || 'General',
        createdBy: req.user._id
      });

      await patient.save();
      visitNumber = 1;
    }

    // Generate registration number
    const registrationNumber = await generateRegistrationNumber(resolvedHospitalId);

    // Generate appointment number (per doctor/specialist + department + date)
    const apptDoctorId = isVisiting ? visitingSchedule._id : docIdForAppt;
    const { appointmentNumber, appointmentDateSeq } = await generateAppointmentNumber(
      resolvedHospitalId, apptDoctorId, finalDepartment, finalAppointmentDate
    );

    // Determine visit type
    let finalVisitType = isEmergency ? 'Emergency' : (visitType || (isLab ? 'Lab' : 'OPD'));
    if (finalVisitType === 'Super Speciality OPD') {
      finalVisitType = 'OPD';
    }
    if (department && department.toLowerCase().trim() === 'same day care') {
      finalVisitType = 'Same Day Treatment';
    } else if (isLab) {
      finalVisitType = 'Lab';
    }

    // Process OPD Billing fields (Visiting Specialist fee is strictly server-verified from schedule)
    const defaultDoctorFee = isVisiting ? (visitingSchedule.consultationFee !== undefined && Number(visitingSchedule.consultationFee) >= 0 ? Number(visitingSchedule.consultationFee) : 0) : (doctor?.opdFees || 0);
    const parsedGrossFee = isVisiting
      ? defaultDoctorFee
      : (reqOpdFee !== undefined && reqOpdFee !== null && reqOpdFee !== ''
          ? Math.max(0, Number(reqOpdFee) || 0)
          : defaultDoctorFee);

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

    let splitPaymentsData = undefined;
    let mixedPaymentsData = undefined;
    if (paymentStatus === 'Paid' && (paymentMode === 'Split' || paymentMode === 'Split Payment' || paymentMode === 'Cash + UPI' || paymentMode === 'Mixed Payment')) {
      const cashAmt = parseFloat(reqSplitPayments?.cash !== undefined ? reqSplitPayments.cash : (Array.isArray(reqMixedPayments) ? reqMixedPayments.find(p => p.method === 'Cash')?.amount : 0)) || 0;
      const upiAmt = parseFloat(reqSplitPayments?.upi !== undefined ? reqSplitPayments.upi : (Array.isArray(reqMixedPayments) ? reqMixedPayments.find(p => p.method === 'UPI')?.amount : 0)) || 0;
      splitPaymentsData = { cash: cashAmt, upi: upiAmt };
      mixedPaymentsData = [
        { method: 'Cash', amount: cashAmt },
        { method: 'UPI', amount: upiAmt }
      ];
    }

    // Create a Visit record
    const visit = new Visit({
      hospitalId: resolvedHospitalId,
      patientId: patient._id,
      uhid: patient.uhid,
      registrationNumber,
      registrationDate: new Date(),
      visitType: finalVisitType,
      department: finalDepartment,
      doctorId: isVisiting ? null : docIdForAppt,
      isVisitingDoctor: isVisiting,
      visitingScheduleId: isVisiting ? visitingSchedule._id : null,
      visitingDoctorName: isVisiting ? visitingSchedule.doctorName : '',
      doctorName: isVisiting ? visitingSchedule.doctorName : (doctor?.doctorName || doctor?.username || ''),
      appointmentDate: finalAppointmentDate,
      slot: finalSlot,
      appointmentNumber,
      appointmentDateSeq,
      appointmentDept: finalDepartment,
      appointmentDoctorId: apptDoctorId,
      visitNumber,
      demographics: {
        weight: weight || undefined,
        height: height || undefined,
        bloodPressure: bloodPressure ? String(bloodPressure).replace(/[^0-9/]/g, '').trim() || undefined : undefined,
        temperature: temperature || undefined,
        cvs: (cvs && typeof cvs === 'string' && cvs.trim()) ? cvs.trim() : undefined,
        respiratoryRate: (respiratoryRate !== undefined && respiratoryRate !== '' && respiratoryRate !== null) ? Number(respiratoryRate) : ((rr !== undefined && rr !== '' && rr !== null) ? Number(rr) : undefined),
        pulseRate: (pulseRate !== undefined && pulseRate !== '' && pulseRate !== null) ? Number(pulseRate) : ((pr !== undefined && pr !== '' && pr !== null) ? Number(pr) : ((pulse !== undefined && pulse !== '' && pulse !== null) ? Number(pulse) : undefined)),
        pulse: (pulseRate !== undefined && pulseRate !== '' && pulseRate !== null) ? Number(pulseRate) : ((pr !== undefined && pr !== '' && pr !== null) ? Number(pr) : ((pulse !== undefined && pulse !== '' && pulse !== null) ? Number(pulse) : undefined)),
        perAbdomen: (perAbdomen && typeof perAbdomen === 'string' && perAbdomen.trim()) ? perAbdomen.trim() : ((pa && typeof pa === 'string' && pa.trim()) ? pa.trim() : undefined),
        bilateralChest: (bilateralChest && typeof bilateralChest === 'string' && bilateralChest.trim()) ? bilateralChest.trim() : undefined,
        spo2: (spo2 !== undefined && spo2 !== '' && spo2 !== null) ? Number(spo2) : undefined
      },
      opdFee: parsedGrossFee,
      discountType,
      discountValue,
      discountAmount: calculatedDiscountAmount,
      netOpdFee,
      paymentStatus,
      paymentMode,
      splitPayments: splitPaymentsData,
      mixedPayments: mixedPaymentsData,
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
        hospitalId: resolvedHospitalId,
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
      doctorName: isVisiting ? visitingSchedule.doctorName : (doctor?.doctorName || doctor?.username || ''),
      isVisitingDoctor: isVisiting,
      visitingScheduleId: isVisiting ? visitingSchedule._id : null,
      visitingDoctorName: isVisiting ? visitingSchedule.doctorName : '',
      doctorId: isVisiting ? {
        _id: visitingSchedule._id,
        doctorName: visitingSchedule.doctorName,
        username: visitingSchedule.doctorName,
        opdFees: visitingSchedule.consultationFee,
        isVisitingDoctor: true
      } : (doctor ? {
        _id: doctor._id,
        doctorName: doctor.doctorName,
        username: doctor.username,
        opdFees: doctor.opdFees
      } : visit.doctorId),
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
      splitPayments: visit.splitPayments,
      mixedPayments: visit.mixedPayments,
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
    if (error.code === 11000) {
      if (error.keyPattern?.visitingScheduleId || (error.message && error.message.includes('visitingScheduleId'))) {
        return res.status(409).json({ message: 'This slot was just booked by another patient. Please select another slot.' });
      }
      if (error.keyPattern?.registrationNumber) {
        return res.status(409).json({ message: 'Registration number collision occurred. Please retry registration.' });
      }
    }
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
    } else if (req.user.role === 'clinic') {
      const clinicPatientIds = await getClinicPatientIds(req);
      query = { ...query, _id: { $in: clinicPatientIds || [] } };
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
          .populate('doctorId', 'doctorName username department opdFees')
          .populate('createdBy', 'username doctorName role')
          .sort({ createdAt: -1 });

        const Prescription = require('../models/Prescription');
        const hasPrescription = latestVisit 
          ? await Prescription.exists(tenantQuery(req, { patientId: pat._id, visitId: latestVisit._id }))
          : false;

        const pDoc = latestVisit?.doctorId;
        const grossFee = latestVisit?.opdFee !== undefined && latestVisit?.opdFee !== null && latestVisit?.opdFee > 0
          ? latestVisit.opdFee
          : (pDoc?.opdFees !== undefined && pDoc?.opdFees !== null ? pDoc.opdFees : 0);
        const discountAmount = latestVisit?.discountAmount !== undefined && latestVisit?.discountAmount !== null ? latestVisit.discountAmount : 0;
        const netFee = latestVisit?.netOpdFee !== undefined && latestVisit?.netOpdFee !== null && latestVisit?.netOpdFee > 0
          ? latestVisit.netOpdFee
          : (grossFee > 0 ? Math.max(0, grossFee - discountAmount) : (latestVisit?.netOpdFee || 0));

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
          opdFee: grossFee,
          discountType: latestVisit?.discountType || 'none',
          discountValue: latestVisit?.discountValue || 0,
          discountAmount: discountAmount,
          netOpdFee: netFee,
          paymentStatus: latestVisit?.paymentStatus || 'Paid',
          paymentMode: latestVisit?.paymentMode || 'Cash',
          splitPayments: latestVisit?.splitPayments || null,
          mixedPayments: latestVisit?.mixedPayments || [],
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

    const patientAge = patient.dob ? Math.max(0, new Date().getFullYear() - new Date(patient.dob).getFullYear()) : (patient.age || '');

    const responseData = {
      ...patient.toObject(),
      age: patientAge,
      department: latestVisit?.department || '',
      doctorId: latestVisit?.doctorId || (latestVisit?.isVisitingDoctor ? {
        _id: latestVisit.visitingScheduleId,
        doctorName: latestVisit.doctorName || latestVisit.visitingDoctorName,
        username: latestVisit.doctorName || latestVisit.visitingDoctorName,
        opdFees: latestVisit.consultationFee || latestVisit.opdFee || 0,
        isVisitingDoctor: true
      } : null),
      doctorName: latestVisit?.isVisitingDoctor ? (latestVisit.doctorName || latestVisit.visitingDoctorName) : (latestVisit?.doctorId?.doctorName || latestVisit?.doctorId?.username || latestVisit?.doctorName || ''),
      isVisitingDoctor: latestVisit?.isVisitingDoctor || false,
      visitingScheduleId: latestVisit?.visitingScheduleId || null,
      visitingDoctorName: latestVisit?.visitingDoctorName || '',
      speciality: latestVisit?.speciality || '',
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
      splitPayments: latestVisit?.splitPayments || null,
      mixedPayments: latestVisit?.mixedPayments || [],
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

    const formattedVisits = visits.map(v => {
      const vObj = v.toObject();
      if (v.isVisitingDoctor) {
        vObj.doctorId = vObj.doctorId || {
          _id: v.visitingScheduleId,
          doctorName: v.doctorName || v.visitingDoctorName,
          username: v.doctorName || v.visitingDoctorName,
          isVisitingDoctor: true
        };
      }
      return vObj;
    });

    res.status(200).json(formattedVisits);
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
    const { fromDate, toDate, uhid, registrationNumber, patientName, department, doctorId, search, filter, page = 1, limit = 20 } = req.query;
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
    if (doctorId) query.doctorId = doctorId;
    if (req.user.role === 'clinic') {
      query.$or = [{ createdBy: req.user._id }, { doctorId: req.user._id }];
    }

    // If patientName search, find matching patients first
    if (patientName || search) {
      const searchTerm = patientName || search;
      let pQuery = tenantQuery(req, {
        $or: [
          { patientName: { $regex: searchTerm, $options: 'i' } },
          { uhid: { $regex: searchTerm, $options: 'i' } },
          { mobile: { $regex: searchTerm, $options: 'i' } }
        ]
      });
      if (req.user.role === 'clinic') {
        const clinicPatientIds = await getClinicPatientIds(req);
        pQuery._id = { $in: clinicPatientIds || [] };
      }
      const matchingPatients = await Patient.find(pQuery).select('_id');
      query.patientId = { $in: matchingPatients.map(p => p._id) };
    }

    // Statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const tenantQ = req.user.hospitalId ? { hospitalId: req.user.hospitalId } : {};
    if (req.user.role === 'clinic') {
      tenantQ.$or = [{ createdBy: req.user._id }, { doctorId: req.user._id }];
    }

    const statsBaseQuery = { ...tenantQ };
    if (doctorId) statsBaseQuery.doctorId = doctorId;
    if (department) statsBaseQuery.department = department;
    if (uhid) statsBaseQuery.uhid = { $regex: uhid, $options: 'i' };
    if (registrationNumber) statsBaseQuery.registrationNumber = { $regex: registrationNumber, $options: 'i' };
    if (query.patientId) statsBaseQuery.patientId = query.patientId;

    const [totalToday, totalMonth, totalCount] = await Promise.all([
      Visit.countDocuments({ ...statsBaseQuery, registrationDate: { $gte: today, $lt: tomorrow } }),
      Visit.countDocuments({ ...statsBaseQuery, registrationDate: { $gte: monthStart } }),
      Visit.countDocuments(query)
    ]);

    const currentPage = Math.max(1, parseInt(page) || 1);
    const limitVal = Math.max(1, parseInt(limit) || 20);
    const skip = (currentPage - 1) * limitVal;
    const visits = await Visit.find(query)
      .populate('patientId', 'patientName mobile gender aadhaar category address dob')
      .populate('doctorId', 'doctorName username opdFees department')
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

      const pDoc = v.doctorId;
      const grossFee = v.opdFee !== undefined && v.opdFee !== null && v.opdFee > 0
        ? v.opdFee
        : (pDoc?.opdFees !== undefined && pDoc?.opdFees !== null ? pDoc.opdFees : 0);
      const discountAmount = v.discountAmount !== undefined && v.discountAmount !== null ? v.discountAmount : 0;
      const netFee = v.netOpdFee !== undefined && v.netOpdFee !== null && v.netOpdFee > 0
        ? v.netOpdFee
        : (grossFee > 0 ? Math.max(0, grossFee - discountAmount) : (v.netOpdFee || 0));

      return {
        _id: v._id,
        registrationNumber: v.registrationNumber,
        registrationDate: v.registrationDate,
        visitType: v.visitType,
        uhid: v.uhid,
        patientName: v.patientId?.patientName || '',
        mobile: v.patientId?.mobile || '',
        gender: v.patientId?.gender || '',
        category: v.patientId?.category || 'General',
        address: v.patientId?.address || '',
        dob: v.patientId?.dob || null,
        department: (v.visitType === 'Lab' || v.slot === 'Lab Walk-in' || (v.department && v.department.toLowerCase().includes('lab')))
          ? 'Laboratory'
          : (v.department || (v.visitType === 'Emergency' ? 'Emergency' : 'General')),
        appointmentDate: v.appointmentDate,
        slot: v.slot,
        appointmentNumber: v.appointmentNumber,
        consultationStatus: v.consultationStatus,
        patientId: v.patientId?._id || v.patientId,
        doctorName: v.isVisitingDoctor ? (v.visitingDoctorName || v.doctorName) : (pDoc?.doctorName || pDoc?.username || v.doctorName || ''),
        isVisitingDoctor: Boolean(v.isVisitingDoctor),
        visitingScheduleId: v.visitingScheduleId || null,
        visitingDoctorName: v.visitingDoctorName || '',
        doctorId: v.isVisitingDoctor ? {
          _id: v.visitingScheduleId,
          doctorName: v.visitingDoctorName || v.doctorName,
          username: v.visitingDoctorName || v.doctorName,
          opdFees: grossFee,
          isVisitingDoctor: true
        } : (pDoc || v.doctorId),
        demographics: v.demographics,
        opdFee: grossFee,
        discountType: v.discountType || 'none',
        discountValue: v.discountValue || 0,
        discountAmount: discountAmount,
        netOpdFee: netFee,
        paymentStatus: v.paymentStatus || 'Paid',
        paymentMode: v.paymentMode || 'Cash',
        splitPayments: v.splitPayments || null,
        mixedPayments: v.mixedPayments || [],
        billNumber: v.billNumber || null,
        isRefunded: Boolean(v.isRefunded || v.paymentStatus === 'Refunded'),
        refundAmount: v.refundAmount || 0,
        refundRemarks: v.refundRemarks || '',
        refundDate: v.refundDate || null,
        refundedByName: v.refundedByName || '',
        refundReceiptNo: v.refundReceiptNo || '',
        refundMode: v.refundMode || 'Cash',
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
    let visitQuery = tenantQuery(req, { uhid });
    if (req.user.role === 'clinic') {
      visitQuery.$or = [{ createdBy: req.user._id }, { doctorId: req.user._id }];
    }
    const visits = await Visit.find(visitQuery)
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
    const { doctorId, visitingScheduleId, date } = req.query;
    if ((!doctorId && !visitingScheduleId) || !date) {
      return res.status(400).json({ message: 'doctorId or visitingScheduleId, and date query parameters are required' });
    }

    const query = visitingScheduleId
      ? { visitingScheduleId, appointmentDate: date }
      : { doctorId, appointmentDate: date };

    const bookings = await Visit.find(tenantQuery(req, query)).select('slot');
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
    const rawId = req.params.id;
    let patient = null;

    if (mongoose.Types.ObjectId.isValid(rawId)) {
      patient = await Patient.findOne(tenantQuery(req, { _id: rawId }));
      if (!patient) {
        const visit = await Visit.findOne(tenantQuery(req, { _id: rawId }));
        if (visit && visit.patientId) {
          patient = await Patient.findOne(tenantQuery(req, { _id: visit.patientId }));
        }
      }
    }

    if (!patient) {
      patient = await Patient.findOne(tenantQuery(req, { uhid: rawId }));
    }

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patientId = patient._id;
    const visits = await Visit.find(tenantQuery(req, { patientId }));
    const visitIds = visits.map(v => v._id);

    const deleteQuery = { patientId: { $in: [patientId, ...visitIds] } };
    const tenantDeleteQuery = tenantQuery(req, deleteQuery);

    const safeDelete = async (modelPath, query) => {
      try {
        const model = require(modelPath);
        if (model && typeof model.deleteMany === 'function') {
          await model.deleteMany(query);
        }
      } catch (e) {}
    };

    await safeDelete('../models/Consultation', tenantDeleteQuery);
    await safeDelete('../models/Prescription', tenantDeleteQuery);
    await safeDelete('../models/LabRequest', tenantDeleteQuery);
    await safeDelete('../models/LabBill', tenantDeleteQuery);
    await safeDelete('../models/Billing', tenantDeleteQuery);
    await safeDelete('../models/SameDayTreatment', tenantDeleteQuery);
    await safeDelete('../models/SdtItem', tenantDeleteQuery);
    await safeDelete('../models/PharmacyDispense', tenantDeleteQuery);
    await safeDelete('../models/PatientHistory', tenantDeleteQuery);
    await safeDelete('../models/IpdAdmission', tenantDeleteQuery);
    await safeDelete('../models/IpdDischarge', tenantDeleteQuery);
    await safeDelete('../models/IpdConsumable', tenantDeleteQuery);
    await safeDelete('../models/IpdMedicine', tenantDeleteQuery);
    await safeDelete('../models/IpdLabTest', tenantDeleteQuery);
    await safeDelete('../models/IpdReferral', tenantDeleteQuery);
    await safeDelete('../models/IpdActivityTimeline', tenantDeleteQuery);
    await safeDelete('../models/IpdOtRecord', tenantDeleteQuery);
    await safeDelete('../models/OtBooking', tenantDeleteQuery);
    await safeDelete('../models/OtDocument', tenantDeleteQuery);

    try {
      const Bed = require('../models/Bed');
      await Bed.updateMany(tenantQuery(req, { patientId }), {
        $set: {
          patientId: null,
          admissionId: null,
          status: 'Available',
          reservedAt: null,
          reservedFor: null
        }
      });
    } catch (e) {}

    await Visit.deleteMany(tenantQuery(req, { patientId }));
    await Patient.deleteOne(tenantQuery(req, { _id: patientId }));

    res.status(200).json({ message: 'Patient and related records deleted successfully' });
  } catch (error) {
    console.error('Delete Patient Error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
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

// @desc    Look up existing patient by Aadhaar, Mobile, or Search query
// @route   GET /api/patients/lookup
// @access  Private
const lookupPatient = async (req, res) => {
  try {
    const { aadhaar, mobile, search, patientName } = req.query;
    const term = (search || '').trim();
    if ((!aadhaar || aadhaar.trim().length < 4) && (!mobile || mobile.trim().length < 4) && (!term || term.length < 3)) {
      return res.status(400).json({ message: 'Valid Aadhaar, Mobile number, or Search term is required' });
    }

    const conditions = [];
    if (aadhaar && aadhaar.trim().length >= 4) {
      conditions.push({ aadhaar: aadhaar.trim() });
    }
    if (mobile && mobile.trim().length >= 4) {
      conditions.push({ mobile: mobile.trim() });
    }
    if (term && term.length >= 3) {
      conditions.push({ uhid: { $regex: term, $options: 'i' } });
      conditions.push({ patientName: { $regex: term, $options: 'i' } });
      conditions.push({ mobile: { $regex: term, $options: 'i' } });
    }

    let query = tenantQuery(req, { $or: conditions });
    if (req.user.role === 'clinic') {
      const clinicPatientIds = await getClinicPatientIds(req);
      if (!clinicPatientIds || clinicPatientIds.length === 0) {
        return res.status(200).json({ message: 'No patient found in clinic records', found: false });
      }
      query._id = { $in: clinicPatientIds };
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 }).limit(10);

    if (!patients || patients.length === 0) {
      return res.status(200).json({ message: 'No patient found in records', found: false });
    }

    let patient = patients[0];
    if (patientName && patientName.trim()) {
      const exactMatch = patients.find(p => isSamePatientName(p.patientName, patientName));
      if (exactMatch) patient = exactMatch;
    }

    // Get the latest visit for this patient (for clinic role, only clinic's latest visit)
    let visitQuery = { patientId: patient._id };
    if (req.user.hospitalId) visitQuery.hospitalId = req.user.hospitalId;
    if (req.user.role === 'clinic') {
      visitQuery.$or = [{ createdBy: req.user._id }, { doctorId: req.user._id }];
    }

    const latestVisit = await Visit.findOne(visitQuery)
      .populate('doctorId', 'doctorName username department')
      .sort({ createdAt: -1 });

    res.status(200).json({ found: true, patient, patients, latestVisit });
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
      visitId,
      weight,
      height,
      bloodPressure,
      temperature,
      cvs,
      respiratoryRate,
      rr,
      pulseRate,
      pulse,
      pr,
      perAbdomen,
      pa,
      bilateralChest,
      spo2,
      vitals,
      demographics
    } = req.body;

    const patient = await Patient.findOne(tenantQuery(req, { _id: id }));
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patientName !== undefined) patient.patientName = patientName.trim();
    if (mobile !== undefined) patient.mobile = mobile.trim();
    if (address !== undefined) patient.address = address;
    if (dob !== undefined && dob !== '') {
      patient.dob = dob;
    } else if (req.body.age !== undefined && req.body.age !== '') {
      const parsedAge = parseInt(req.body.age, 10);
      if (!isNaN(parsedAge)) {
        const birthYear = new Date().getFullYear() - parsedAge;
        patient.dob = new Date(`${birthYear}-01-01`);
      }
    }
    if (gender !== undefined) patient.gender = gender;
    if (aadhaar !== undefined) patient.aadhaar = aadhaar ? aadhaar.trim() : '';
    if (category !== undefined) patient.category = category;

    await patient.save();

    // If visitId or visit details / vitals provided, update Visit record as well
    let targetVisit = null;
    if (visitId) {
      targetVisit = await Visit.findOne(tenantQuery(req, { _id: visitId }));
    } else {
      targetVisit = await Visit.findOne(tenantQuery(req, { patientId: id })).sort({ registrationDate: -1 });
    }

    if (targetVisit) {
      if (department !== undefined) targetVisit.department = department;
      if (doctorId !== undefined) targetVisit.doctorId = doctorId;
      if (appointmentDate !== undefined) targetVisit.appointmentDate = appointmentDate;
      if (slot !== undefined) targetVisit.slot = slot;

      const rawVitals = vitals || demographics || {};
      const newWeight = weight !== undefined ? weight : rawVitals.weight;
      const newHeight = height !== undefined ? height : rawVitals.height;
      const newBP = bloodPressure !== undefined ? bloodPressure : rawVitals.bloodPressure;
      const newTemp = temperature !== undefined ? temperature : rawVitals.temperature;
      const newCvs = cvs !== undefined ? cvs : rawVitals.cvs;
      const newRR = respiratoryRate !== undefined ? respiratoryRate : (rr !== undefined ? rr : rawVitals.respiratoryRate);
      const newPR = pulseRate !== undefined ? pulseRate : (pr !== undefined ? pr : (pulse !== undefined ? pulse : (rawVitals.pulseRate || rawVitals.pulse)));
      const newPA = perAbdomen !== undefined ? perAbdomen : (pa !== undefined ? pa : rawVitals.perAbdomen);
      const newChest = bilateralChest !== undefined ? bilateralChest : rawVitals.bilateralChest;
      const newSpO2 = spo2 !== undefined ? spo2 : rawVitals.spo2;

      if (!targetVisit.demographics) targetVisit.demographics = {};
      let demographicsChanged = false;

      if (newWeight !== undefined) {
        targetVisit.demographics.weight = (newWeight !== '' && newWeight !== null) ? Number(newWeight) : undefined;
        demographicsChanged = true;
      }
      if (newHeight !== undefined) {
        targetVisit.demographics.height = (newHeight !== '' && newHeight !== null) ? Number(newHeight) : undefined;
        demographicsChanged = true;
      }
      if (newBP !== undefined) {
        targetVisit.demographics.bloodPressure = (newBP !== '' && newBP !== null)
          ? String(newBP).replace(/[^0-9/]/g, '').trim() || undefined
          : undefined;
        demographicsChanged = true;
      }
      if (newTemp !== undefined) {
        targetVisit.demographics.temperature = (newTemp !== '' && newTemp !== null) ? Number(newTemp) : undefined;
        demographicsChanged = true;
      }
      if (newCvs !== undefined) {
        targetVisit.demographics.cvs = (newCvs !== '' && newCvs !== null) ? String(newCvs).trim() : undefined;
        demographicsChanged = true;
      }
      if (newRR !== undefined) {
        targetVisit.demographics.respiratoryRate = (newRR !== '' && newRR !== null) ? Number(newRR) : undefined;
        demographicsChanged = true;
      }
      if (newPR !== undefined) {
        const parsedPR = (newPR !== '' && newPR !== null) ? Number(newPR) : undefined;
        targetVisit.demographics.pulseRate = parsedPR;
        targetVisit.demographics.pulse = parsedPR;
        demographicsChanged = true;
      }
      if (newPA !== undefined) {
        targetVisit.demographics.perAbdomen = (newPA !== '' && newPA !== null) ? String(newPA).trim() : undefined;
        demographicsChanged = true;
      }
      if (newChest !== undefined) {
        targetVisit.demographics.bilateralChest = (newChest !== '' && newChest !== null) ? String(newChest).trim() : undefined;
        demographicsChanged = true;
      }
      if (newSpO2 !== undefined) {
        targetVisit.demographics.spo2 = (newSpO2 !== '' && newSpO2 !== null) ? Number(newSpO2) : undefined;
        demographicsChanged = true;
      }

      if (demographicsChanged) {
        targetVisit.markModified('demographics');
      }

      await targetVisit.save();
    }

    res.status(200).json({
      message: 'Patient details and vitals updated successfully',
      patient,
      visit: targetVisit
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
    if (req.user.role === 'clinic') {
      visitQuery.createdBy = req.user._id;
    }

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

    const normalizeDate = (d) => {
      if (!d) return '';
      if (typeof d === 'string') return d.split('T')[0];
      if (d instanceof Date) return d.toISOString().split('T')[0];
      try {
        return new Date(d).toISOString().split('T')[0];
      } catch (e) {
        return String(d).split('T')[0];
      }
    };

    // Calculate stats
    const todayCount = result.filter(item => normalizeDate(item.followUpDate) === todayStr).length;
    const upcomingCount = result.filter(item => normalizeDate(item.followUpDate) >= todayStr).length;
    const totalCount = result.length;

    // Apply Filter
    if (filter === 'today') {
      result = result.filter(item => normalizeDate(item.followUpDate) === todayStr);
    } else if (filter === 'upcoming') {
      result = result.filter(item => normalizeDate(item.followUpDate) >= todayStr);
    } else if (filter === 'range' && (fromDate || toDate)) {
      result = result.filter(item => {
        const itemDateStr = normalizeDate(item.followUpDate);
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

// @desc    Get patient's linked ABDM care contexts and consent status
// @route   GET /api/patients/:id/abdm-care-contexts
const getPatientAbdmCareContexts = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const AbdmCareContext = require('../models/AbdmCareContext');
    const AbdmConsent = require('../models/AbdmConsent');

    const careContexts = await AbdmCareContext.find({
      $or: [
        { patientId: patient._id },
        { patientUhid: patient.uhid }
      ]
    }).sort({ linkedAt: -1, createdAt: -1 }).lean();

    const consents = await AbdmConsent.find({
      $or: [
        { patientAbha: patient.abhaAddress },
        { patientUhid: patient.uhid }
      ]
    }).sort({ grantedAt: -1, createdAt: -1 }).lean();

    res.json({
      success: true,
      patient: {
        uhid: patient.uhid,
        patientName: patient.patientName,
        abhaNumber: patient.abhaNumber,
        abhaAddress: patient.abhaAddress,
        abhaStatus: patient.abhaStatus,
        abhaVerificationStatus: patient.abhaVerificationStatus
      },
      careContexts,
      consents
    });
  } catch (error) {
    console.error('Error fetching ABDM care contexts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger HIP Care Context Linking for Patient
// @route   POST /api/patients/:id/abdm-link
const triggerPatientAbdmLink = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (!patient.abhaAddress && !patient.abhaNumber) {
      return res.status(400).json({ success: false, message: 'Patient does not have an ABHA Address or ABHA Number' });
    }

    const { visitRegNumber } = req.body;
    if (!visitRegNumber) {
      return res.status(400).json({ success: false, message: 'visitRegNumber / record reference is required' });
    }

    const m2HipLinkingService = require('../modules/abdm-m2/services/m2HipLinkingService');
    const birthYear = patient.dob ? new Date(patient.dob).getFullYear() : 1990;

    const result = await m2HipLinkingService.requestLinkToken({
      abhaNumber: patient.abhaNumber,
      abhaAddress: patient.abhaAddress,
      name: patient.patientName,
      gender: patient.gender,
      yearOfBirth: birthYear,
      patientUhid: patient.uhid,
      visitRegNumber
    });

    res.json({
      success: true,
      message: 'HIP Care Context linking initiated with ABDM Gateway',
      result
    });
  } catch (error) {
    console.error('Error triggering ABDM link:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process refund for patient registration/visit at reception
// @route   POST /api/patients/registrations/:id/refund
// @access  Private
const refundPatientRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark, refundAmount, refundMode } = req.body;

    if (!remark || !remark.trim()) {
      return res.status(400).json({ message: 'Refund remark / reason is required.' });
    }

    const visit = await Visit.findOne(tenantQuery(req, { _id: id }))
      .populate('patientId', 'patientName mobile uhid address gender dob aadhaar category')
      .populate('doctorId', 'doctorName username opdFees department');

    if (!visit) {
      return res.status(404).json({ message: 'Registration record not found.' });
    }

    if (visit.isRefunded || visit.paymentStatus === 'Refunded') {
      return res.status(400).json({ message: 'This registration has already been refunded.' });
    }

    const maxFee = visit.netOpdFee !== undefined && visit.netOpdFee !== null
      ? visit.netOpdFee
      : (visit.opdFee || 0);

    let parsedAmount = refundAmount !== undefined && refundAmount !== null && refundAmount !== ''
      ? Number(refundAmount)
      : maxFee;

    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ message: 'Valid refund amount is required.' });
    }

    if (maxFee > 0 && parsedAmount > maxFee) {
      return res.status(400).json({ message: `Refund amount cannot exceed the paid OPD fee of ₹${maxFee}.` });
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const refundReceiptNo = `REF-${todayStr}-${randomSeq}`;
    const userStaffName = req.user.doctorName || req.user.username || 'Receptionist';

    visit.paymentStatus = 'Refunded';
    visit.isRefunded = true;
    visit.refundAmount = parsedAmount;
    visit.refundRemarks = remark.trim();
    visit.refundDate = new Date();
    visit.refundedBy = req.user._id;
    visit.refundedByName = userStaffName;
    visit.refundReceiptNo = refundReceiptNo;
    visit.refundMode = refundMode || visit.paymentMode || 'Cash';

    await visit.save();

    // Check if an associated Billing document exists to adjust amountPaid and audit trail
    const Billing = require('../models/Billing');
    const linkedBill = await Billing.findOne(tenantQuery(req, {
      $or: [
        { 'items.sourceId': visit._id },
        { billNo: visit.billNumber },
        { invoiceNo: visit.billNumber }
      ]
    }));

    if (linkedBill) {
      linkedBill.amountPaid = Math.max(0, (linkedBill.amountPaid || 0) - parsedAmount);
      if (parsedAmount >= (linkedBill.grandTotal || 0)) {
        linkedBill.paymentStatus = 'Cancelled';
      }
      linkedBill.auditTrail = linkedBill.auditTrail || [];
      linkedBill.auditTrail.push({
        action: 'Reception Refund Processed',
        performedBy: req.user._id,
        performedByName: userStaffName,
        timestamp: new Date(),
        remarks: `Refund of ₹${parsedAmount} issued at reception. Reason: ${remark.trim()}`
      });
      await linkedBill.save();
    }

    res.status(200).json({
      success: true,
      message: `Refund of ₹${parsedAmount.toFixed(2)} processed successfully`,
      visit,
      refundDetails: {
        refundReceiptNo,
        refundAmount: parsedAmount,
        refundRemarks: remark.trim(),
        refundDate: visit.refundDate,
        refundMode: visit.refundMode,
        refundedByName: userStaffName,
        patientName: visit.patientId?.patientName,
        uhid: visit.uhid,
        registrationNumber: visit.registrationNumber,
        billNumber: visit.billNumber,
        originalFee: maxFee,
        department: visit.department,
        doctorName: visit.doctorId?.doctorName || visit.doctorId?.username
      }
    });
  } catch (error) {
    console.error('Process Refund Error:', error);
    res.status(500).json({ message: error.message || 'Server error while processing refund' });
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
  getFollowUpPatients,
  getPatientAbdmCareContexts,
  triggerPatientAbdmLink,
  refundPatientRegistration,
  resolveHospitalId
};


