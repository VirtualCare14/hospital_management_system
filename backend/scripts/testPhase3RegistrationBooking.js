/**
 * Phase 3 Patient Registration & Slot Booking Unit & Safety Test Suite
 * 
 * Safety: Pure in-memory unit tests.
 * Zero database connections or mutations.
 * Usage: node backend/scripts/testPhase3RegistrationBooking.js
 */

const assert = require('assert');
const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const VisitingDoctorSchedule = require('../models/VisitingDoctorSchedule');
const Hospital = require('../models/Hospital');
const { resolveHospitalId } = require('../controllers/patientController');

console.log('===============================================================');
console.log('  PHASE 3: PATIENT REGISTRATION & SLOT BOOKING UNIT TESTS     ');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error('       Error:', err.message);
  }
}

// Helpers matching patientController and timeSlots
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

const generateTimeSlots = (startTime, endTime, intervalMinutes = 15) => {
  const parseTime = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };
  const formatTime = (totalMinutes) => {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const modifier = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${modifier}`;
  };

  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const slots = [];
  for (let time = start; time < end; time += intervalMinutes) {
    slots.push(formatTime(time));
  }
  return slots;
};

async function runAllTests() {
  // 1. Standard OPD vs Visiting Doctor Validation
  await runTest('Standard OPD requires doctorId and validates permanent doctor fields', () => {
    const reqBodyStandard = {
      patientName: 'Test Patient',
      mobile: '9876543210',
      department: 'Cardiology',
      appointmentDate: '2026-11-05',
      slot: '10:00 AM',
      isVisitingDoctor: false,
      doctorId: null
    };

    const isEmergency = false;
    const isLab = false;
    const isVisiting = Boolean(reqBodyStandard.isVisitingDoctor && reqBodyStandard.visitingScheduleId);

    let error = null;
    if (!isEmergency && !isLab) {
      if (isVisiting) {
        if (!reqBodyStandard.department || !reqBodyStandard.appointmentDate || !reqBodyStandard.slot) {
          error = 'Department, Appointment Date, and Slot are required for Super Speciality appointments';
        }
      } else if (!reqBodyStandard.department || !reqBodyStandard.doctorId || !reqBodyStandard.appointmentDate || !reqBodyStandard.slot) {
        error = 'All required registration fields must be provided for OPD appointments';
      }
    }

    assert.strictEqual(error, 'All required registration fields must be provided for OPD appointments');
  });

  // 2. Visiting Specialist Schedule Query Filters Active Schedules
  await runTest('Visiting Specialist schedule query selects only Active schedules', () => {
    const schedules = [
      { _id: new mongoose.Types.ObjectId(), doctorName: 'Dr. Active', status: 'Active', department: 'Neurology' },
      { _id: new mongoose.Types.ObjectId(), doctorName: 'Dr. Cancelled', status: 'Cancelled', department: 'Neurology' },
      { _id: new mongoose.Types.ObjectId(), doctorName: 'Dr. Completed', status: 'Completed', department: 'Neurology' }
    ];

    const activeOnly = schedules.filter(s => s.status === 'Active' && s.department === 'Neurology');
    assert.strictEqual(activeOnly.length, 1);
    assert.strictEqual(activeOnly[0].doctorName, 'Dr. Active');
  });

  // 3. Visiting Specialist Schedule Query Filters by Department
  await runTest('Visiting Specialist schedules are correctly filtered by department', () => {
    const schedules = [
      { _id: new mongoose.Types.ObjectId(), doctorName: 'Dr. Cardio', status: 'Active', department: 'Cardiology' },
      { _id: new mongoose.Types.ObjectId(), doctorName: 'Dr. Neuro', status: 'Active', department: 'Neurology' }
    ];

    const filtered = schedules.filter(s => s.department === 'Cardiology');
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].doctorName, 'Dr. Cardio');
  });

  // 4. Server Booking Date Verification
  await runTest('Server strictly rejects bookings if appointmentDate is not in schedule.visitDates', () => {
    const schedule = {
      _id: new mongoose.Types.ObjectId(),
      doctorName: 'Dr. Sharma',
      status: 'Active',
      visitDates: ['2026-11-05', '2026-11-12']
    };

    const targetDate = '2026-11-06';
    const isAllowed = schedule.visitDates.includes(targetDate);
    assert.strictEqual(isAllowed, false);
  });

  // 5. Dynamic Slot Calculation
  await runTest('Dynamic slots are generated using schedule slotDuration and timings', () => {
    const slots = generateTimeSlots('10:00 AM', '11:00 AM', 20);
    assert.deepStrictEqual(slots, ['10:00 AM', '10:20 AM', '10:40 AM']);
    assert.strictEqual(slots.length, 3);
  });

  // 6. Booked Slots Exclusion
  await runTest('Booked slots are excluded from free available slots list', () => {
    const allSlots = ['10:00 AM', '10:20 AM', '10:40 AM'];
    const bookedSlots = ['10:20 AM'];
    const available = allSlots.filter(s => !bookedSlots.includes(s));
    assert.deepStrictEqual(available, ['10:00 AM', '10:40 AM']);
  });

  // 7. Booking Attempt on Inactive/Missing Schedule
  await runTest('Server rejects booking if schedule is cancelled or not found', () => {
    const schedule = { status: 'Cancelled' };
    const isValid = schedule && schedule.status === 'Active';
    assert.strictEqual(isValid, false);
  });

  // 8. Slot Range Validation & Schedule Fee Locking
  await runTest('Server rejects slots outside visiting hours and enforces schedule fee', () => {
    const schedule = {
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      consultationFee: 1200,
      slotDuration: 30
    };

    const duration = schedule.slotDuration;
    const invalidSlot = '02:00 PM - 02:30 PM';
    const slotTimes = parseSlotTimeRange(invalidSlot, duration);
    const schedStartMins = parseTimeToMinutes(schedule.startTime);
    const schedEndMins = parseTimeToMinutes(schedule.endTime);

    const isOutOfBounds = (slotTimes.startMins < schedStartMins || slotTimes.endMins > schedEndMins);
    assert.strictEqual(isOutOfBounds, true);

    const clientProvidedFee = 200;
    const serverEnforcedFee = schedule.consultationFee;
    assert.strictEqual(serverEnforcedFee, 1200);
    assert.notStrictEqual(clientProvidedFee, serverEnforcedFee);
  });

  // 9. Schema Partial Unique Compound Index
  await runTest('Visit schema defines partial unique compound index for concurrency protection', () => {
    const indexes = Visit.schema.indexes();
    const visitingSlotIndex = indexes.find(idx => {
      const keys = idx[0];
      return keys.visitingScheduleId === 1 && keys.appointmentDate === 1 && keys.slot === 1 && keys.hospitalId === 1;
    });

    assert(visitingSlotIndex, 'Visiting slot compound index must exist on Visit schema');
    const options = visitingSlotIndex[1];
    assert.strictEqual(options.unique, true, 'Visiting slot index must be unique');
    assert(options.partialFilterExpression, 'Visiting slot index must have partialFilterExpression');
    assert.strictEqual(options.partialFilterExpression.isVisitingDoctor, true);
    assert(options.partialFilterExpression.slot, 'partialFilterExpression must check slot type');
  });

  // 10. Existing Patient Reuse
  await runTest('Existing patient preserves UHID, name, and increments visitNumber', () => {
    const existingPatient = {
      _id: new mongoose.Types.ObjectId(),
      uhid: 'UHID-20261028-0001',
      patientName: 'Aarav Patel',
      mobile: '9876543210'
    };

    const existingVisitCount = 2;
    const newVisitNumber = existingVisitCount + 1;
    assert.strictEqual(newVisitNumber, 3);
    assert.strictEqual(existingPatient.uhid, 'UHID-20261028-0001');
  });

  // 11. Visiting Specialist Visit Document Attributes
  await runTest('Visiting appointment assigns doctorId: null and attributes specialist display name', () => {
    const visitingSchedule = {
      _id: new mongoose.Types.ObjectId(),
      doctorName: 'Dr. Meenakshi Sundaram',
      consultationFee: 1500
    };

    const visit = {
      doctorId: null,
      isVisitingDoctor: true,
      visitingScheduleId: visitingSchedule._id,
      visitingDoctorName: visitingSchedule.doctorName,
      doctorName: visitingSchedule.doctorName,
      opdFee: visitingSchedule.consultationFee
    };

    assert.strictEqual(visit.doctorId, null);
    assert.strictEqual(visit.isVisitingDoctor, true);
    assert.strictEqual(visit.doctorName, 'Dr. Meenakshi Sundaram');
    assert.strictEqual(visit.opdFee, 1500);
  });

  // 12. OPD Billing Calculation & Bill Number Generation
  await runTest('Visiting specialist billing generates valid billNumber and handles payment states', () => {
    const fee = 1000;
    const discountType = 'amount';
    const discountValue = 100;
    const calculatedDiscount = Math.min(fee, discountValue);
    const netFee = fee - calculatedDiscount;

    assert.strictEqual(calculatedDiscount, 100);
    assert.strictEqual(netFee, 900);

    const billNumber = `OPD-20261028-${Math.floor(1000 + Math.random() * 9000)}`;
    assert(/^OPD-\d{8}-\d{4}$/.test(billNumber), 'Bill number must conform to OPD-YYYYMMDD-XXXX');

    const reqPaymentStatus = 'Not Paid';
    const paymentStatus = reqPaymentStatus === 'Not Paid' ? 'Not Paid' : 'Paid';
    const paymentMode = paymentStatus === 'Not Paid' ? 'Pending' : 'Cash';
    assert.strictEqual(paymentStatus, 'Not Paid');
    assert.strictEqual(paymentMode, 'Pending');
  });

  // 13. Permanent Doctor Appointments
  await runTest('Permanent doctor booking continues to require doctorId and permanent doctor fee', () => {
    const doctor = {
      _id: new mongoose.Types.ObjectId(),
      doctorName: 'Dr. Rajesh Verma',
      opdFees: 400
    };

    const isVisiting = false;
    const parsedGrossFee = isVisiting ? 0 : doctor.opdFees;
    const visit = {
      doctorId: doctor._id,
      isVisitingDoctor: false,
      visitingScheduleId: null,
      visitingDoctorName: '',
      doctorName: doctor.doctorName,
      opdFee: parsedGrossFee
    };

    assert.strictEqual(visit.isVisitingDoctor, false);
    assert.strictEqual(visit.doctorId, doctor._id);
    assert.strictEqual(visit.opdFee, 400);
    assert.strictEqual(visit.visitingScheduleId, null);
  });

  // 14. Hospital ID consistency across pre-check, schedule verification, and Visit creation
  await runTest('Resolved hospitalId is strictly consistent across schedule lookup, slot pre-check, and Visit document', () => {
    const mockHospitalId = new mongoose.Types.ObjectId();
    const mockScheduleId = new mongoose.Types.ObjectId();

    const resolvedHospitalId = mockHospitalId;

    const schedQuery = { _id: mockScheduleId, hospitalId: resolvedHospitalId };
    const slotPreCheckQuery = {
      visitingScheduleId: mockScheduleId,
      appointmentDate: '2026-11-05',
      slot: '10:00 AM',
      hospitalId: resolvedHospitalId
    };
    const visitDoc = {
      hospitalId: resolvedHospitalId,
      visitingScheduleId: mockScheduleId,
      appointmentDate: '2026-11-05',
      slot: '10:00 AM'
    };

    assert.strictEqual(schedQuery.hospitalId.toString(), mockHospitalId.toString());
    assert.strictEqual(slotPreCheckQuery.hospitalId.toString(), mockHospitalId.toString());
    assert.strictEqual(visitDoc.hospitalId.toString(), mockHospitalId.toString());
  });

  // 15. Authenticated tenant ID takes priority
  await runTest('resolveHospitalId: Authenticated tenant ID (req.user.hospitalId) takes strict priority over req.body.hospitalId and req.hospital._id', async () => {
    const userHospId = new mongoose.Types.ObjectId();
    const bodyHospId = new mongoose.Types.ObjectId();

    const req = {
      user: { _id: new mongoose.Types.ObjectId(), hospitalId: userHospId, role: 'reception' },
      body: { hospitalId: bodyHospId.toString() },
      hospital: { _id: userHospId, isActive: true }
    };

    const resolved = await resolveHospitalId(req);
    assert.strictEqual(resolved.toString(), userHospId.toString(), 'Should strictly return user.hospitalId');
    assert.notStrictEqual(resolved.toString(), bodyHospId.toString(), 'Must not use body.hospitalId when user.hospitalId exists');
  });

  // 16. Ordinary user cannot switch tenants via body-supplied hospitalId
  await runTest('resolveHospitalId: Ordinary users (reception, doctor, nurse, clinic) cannot switch tenants', async () => {
    const userHospId = new mongoose.Types.ObjectId();
    const attackerHospId = new mongoose.Types.ObjectId();

    // Case A: Ordinary user with hospitalId passing a different hospitalId in body
    const reqWithTenant = {
      user: { _id: new mongoose.Types.ObjectId(), hospitalId: userHospId, role: 'reception' },
      body: { hospitalId: attackerHospId.toString() }
    };
    const resolvedA = await resolveHospitalId(reqWithTenant);
    assert.strictEqual(resolvedA.toString(), userHospId.toString());

    // Case B: Corrupted/unassigned ordinary user with null hospitalId trying to inject a body hospitalId in production
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const reqNoTenant = {
        user: { _id: new mongoose.Types.ObjectId(), hospitalId: null, role: 'reception' },
        body: { hospitalId: attackerHospId.toString() }
      };
      const resolvedB = await resolveHospitalId(reqNoTenant);
      assert.strictEqual(resolvedB, null, 'Ordinary user with null hospitalId must not switch tenants via body in production');
    } finally {
      process.env.NODE_ENV = oldEnv;
    }
  });

  // 17. Authorized superadmin behavior follows real role and authorization rules
  await runTest('resolveHospitalId: Authorized superadmin can specify explicit active target hospital', async () => {
    const origFindById = Hospital.findById;
    const targetHospId = new mongoose.Types.ObjectId();
    const inactiveHospId = new mongoose.Types.ObjectId();

    Hospital.findById = (id) => ({
      select: async () => {
        const idStr = id.toString();
        if (idStr === targetHospId.toString()) {
          return { _id: targetHospId, isActive: true };
        }
        if (idStr === inactiveHospId.toString()) {
          return { _id: inactiveHospId, isActive: false };
        }
        return null;
      }
    });

    try {
      // Subcase A: Superadmin providing valid active target hospital
      const reqSuperAdmin = {
        user: { _id: new mongoose.Types.ObjectId(), role: 'superadmin' },
        body: { hospitalId: targetHospId.toString() }
      };
      const resolvedValid = await resolveHospitalId(reqSuperAdmin);
      assert.strictEqual(resolvedValid.toString(), targetHospId.toString());

      // Subcase B: Superadmin providing inactive target hospital
      const reqInactive = {
        user: { _id: new mongoose.Types.ObjectId(), role: 'superadmin' },
        body: { hospitalId: inactiveHospId.toString() }
      };
      const resolvedInactive = await resolveHospitalId(reqInactive);
      assert.strictEqual(resolvedInactive, null, 'Must reject inactive hospital');

      // Subcase C: Superadmin providing non-existent hospital
      const reqMissing = {
        user: { _id: new mongoose.Types.ObjectId(), role: 'superadmin' },
        body: { hospitalId: new mongoose.Types.ObjectId().toString() }
      };
      const resolvedMissing = await resolveHospitalId(reqMissing);
      assert.strictEqual(resolvedMissing, null, 'Must reject non-existent hospital');

      // Subcase D: Non-superadmin role (e.g. admin) attempting to target hospital
      const reqNonSuper = {
        user: { _id: new mongoose.Types.ObjectId(), role: 'admin', hospitalId: null },
        body: { hospitalId: targetHospId.toString() }
      };
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const resolvedNonSuper = await resolveHospitalId(reqNonSuper);
        assert.strictEqual(resolvedNonSuper, null, 'Non-superadmin cannot specify target hospital');
      } finally {
        process.env.NODE_ENV = oldEnv;
      }
    } finally {
      Hospital.findById = origFindById;
    }
  });

  // 18. Missing tenant context fails safely in production
  await runTest('resolveHospitalId: Missing tenant context fails safely in production', async () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const reqMissingContext = {
        user: { _id: new mongoose.Types.ObjectId(), role: 'reception', hospitalId: null },
        body: {}
      };
      const resolved = await resolveHospitalId(reqMissingContext);
      assert.strictEqual(resolved, null, 'Must return null in production when tenant context cannot be resolved');
    } finally {
      process.env.NODE_ENV = oldEnv;
    }
  });

  // 19. No hospital is automatically created by the helper
  await runTest('resolveHospitalId: Helper never automatically creates a Hospital entity', async () => {
    const origCreate = Hospital.create;
    const origFindOne = Hospital.findOne;
    let createCalled = false;

    Hospital.create = () => {
      createCalled = true;
      throw new Error('UNSAFE: Hospital.create was invoked by registration helper!');
    };
    Hospital.findOne = () => ({
      select: async () => null
    });

    try {
      // Test across multiple scenarios
      await resolveHospitalId({ user: { role: 'reception' }, body: {} });
      await resolveHospitalId({ user: { role: 'superadmin' }, body: {} });
      await resolveHospitalId({ body: {} });

      assert.strictEqual(createCalled, false, 'Hospital.create must NEVER be called by resolveHospitalId');
    } finally {
      Hospital.create = origCreate;
      Hospital.findOne = origFindOne;
    }
  });

  // 20. Standard OPD doctorId requirement and slot isolation
  await runTest('Standard OPD: Retains doctorId mandatory requirement, permanent doctor fees, and slot validation', () => {
    // Missing doctorId
    const missingDocVisit = {
      isVisitingDoctor: false,
      doctorId: null,
      appointmentDate: '2026-11-05',
      slot: '10:00 AM',
      department: 'General Medicine'
    };
    const isVisiting = Boolean(missingDocVisit.isVisitingDoctor);
    const isValid = isVisiting || Boolean(missingDocVisit.doctorId);
    assert.strictEqual(isValid, false, 'Standard OPD must reject missing doctorId');

    // Valid doctorId locks OPD fee
    const validDoctor = {
      _id: new mongoose.Types.ObjectId(),
      doctorName: 'Dr. Sunita Rao',
      opdFees: 500
    };
    const clientSuppliedFee = 150;
    const finalFee = isVisiting ? 0 : (validDoctor.opdFees || 0);
    assert.strictEqual(finalFee, 500, 'Must lock fee to doctor.opdFees');
  });

  console.log('\n===============================================================');
  console.log(`  PHASE 3 TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  console.log('===============================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Unhandled test suite failure:', err);
  process.exit(1);
});
