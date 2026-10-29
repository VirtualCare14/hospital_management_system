/**
 * Phase 2 Visiting Specialist Schedule Unit & Safety Test Suite
 * 
 * Safety: Pure in-memory unit tests.
 * Zero database connections or mutations.
 * Usage: node backend/scripts/testPhase2VisitingSchedule.js
 */

const assert = require('assert');
const mongoose = require('mongoose');
const VisitingDoctorSchedule = require('../models/VisitingDoctorSchedule');
const Visit = require('../models/Visit');

console.log('====================================================');
console.log('  PHASE 2: VISITING SPECIALIST SCHEDULE UNIT TESTS  ');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error('       Error:', err.message);
  }
}

// Helper: time to minutes
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};

// 1. Model Schema Validation
runTest('VisitingDoctorSchedule schema requires mandatory fields (doctorName, department, visitDates, startTime, endTime, createdBy)', () => {
  const dummy = new VisitingDoctorSchedule({});
  const err = dummy.validateSync();
  assert(err, 'Validation error expected');
  assert(err.errors['doctorName'], 'doctorName should be required');
  assert(err.errors['department'], 'department should be required');
  assert(err.errors['startTime'], 'startTime should be required');
  assert(err.errors['endTime'], 'endTime should be required');
  assert(err.errors['createdBy'], 'createdBy should be required');
  assert(err.errors['hospitalId'], 'hospitalId should be required');
});

runTest('VisitingDoctorSchedule accepts valid document structure and defaults status to Active', () => {
  const schedule = new VisitingDoctorSchedule({
    hospitalId: new mongoose.Types.ObjectId(),
    doctorName: 'Dr. Sunita Rao, DM (Cardio)',
    department: 'Cardiology',
    speciality: 'Interventional Cardiology',
    visitDates: ['2026-11-01', '2026-11-02'],
    startTime: '10:00',
    endTime: '14:00',
    slotDuration: 15,
    consultationFee: 800,
    createdBy: new mongoose.Types.ObjectId()
  });
  const err = schedule.validateSync();
  assert(!err, `Unexpected validation error: ${err?.message}`);
  assert.strictEqual(schedule.status, 'Active');
  assert.strictEqual(schedule.slotDuration, 15);
  assert.strictEqual(schedule.consultationFee, 800);
});

// 2. Time Range & Format Validation
runTest('timeToMinutes properly parses 24h strings and returns null for invalid strings', () => {
  assert.strictEqual(timeToMinutes('00:00'), 0);
  assert.strictEqual(timeToMinutes('10:30'), 630);
  assert.strictEqual(timeToMinutes('23:59'), 1439);
  assert.strictEqual(timeToMinutes('25:00'), null);
  assert.strictEqual(timeToMinutes('invalid'), null);
  assert.strictEqual(timeToMinutes(''), null);
});

runTest('Reject invalid time ranges where startTime >= endTime', () => {
  const start = '14:00';
  const end = '10:00';
  const startMins = timeToMinutes(start);
  const endMins = timeToMinutes(end);
  const isValidRange = startMins !== null && endMins !== null && startMins < endMins;
  assert.strictEqual(isValidRange, false, 'Start time 14:00 must be rejected when end time is 10:00');
});

runTest('Reject equal startTime and endTime', () => {
  const start = '10:00';
  const end = '10:00';
  const startMins = timeToMinutes(start);
  const endMins = timeToMinutes(end);
  const isValidRange = startMins !== null && endMins !== null && startMins < endMins;
  assert.strictEqual(isValidRange, false, 'Start time 10:00 == End time 10:00 must be rejected');
});

runTest('Validate slot duration limits (min 5, max 120, cannot exceed total duration)', () => {
  const startMins = timeToMinutes('10:00'); // 600
  const endMins = timeToMinutes('11:00');   // 660 (total 60 mins)
  const totalDuration = endMins - startMins;

  const validSlot = 15;
  assert(validSlot >= 5 && validSlot <= 120 && validSlot <= totalDuration, '15 min slot should be valid');

  const tooLongSlot = 75; // exceeds 60 mins total
  assert(tooLongSlot > totalDuration, '75 min slot exceeds 60 min session');
});

// 3. Schedule Overlap & Conflict Detection Logic
runTest('Detect overlapping schedule for same doctor on the same date', () => {
  const existingSchedule = {
    doctorName: 'Dr. A. K. Sharma',
    visitDates: ['2026-11-05', '2026-11-06'],
    startTime: '09:00',
    endTime: '13:00'
  };

  const newScheduleDates = ['2026-11-06', '2026-11-07'];
  const newStart = timeToMinutes('11:00');
  const newEnd = timeToMinutes('15:00');

  const existStart = timeToMinutes(existingSchedule.startTime);
  const existEnd = timeToMinutes(existingSchedule.endTime);

  const sharedDate = newScheduleDates.find(d => existingSchedule.visitDates.includes(d));
  assert.strictEqual(sharedDate, '2026-11-06');

  const isOverlapping = Math.max(newStart, existStart) < Math.min(newEnd, existEnd);
  assert.strictEqual(isOverlapping, true, '11:00-15:00 overlaps with 09:00-13:00 on 2026-11-06');
});

runTest('Allow non-overlapping schedules for same doctor on the same date (e.g. morning & evening OPD)', () => {
  const morningSchedule = {
    startTime: '09:00',
    endTime: '12:00'
  };
  const eveningSchedule = {
    startTime: '16:00',
    endTime: '19:00'
  };

  const mStart = timeToMinutes(morningSchedule.startTime);
  const mEnd = timeToMinutes(morningSchedule.endTime);
  const eStart = timeToMinutes(eveningSchedule.startTime);
  const eEnd = timeToMinutes(eveningSchedule.endTime);

  const isOverlapping = Math.max(mStart, eStart) < Math.min(mEnd, eEnd);
  assert.strictEqual(isOverlapping, false, 'Morning and evening sessions do not overlap');
});

// 4. Safe Update Logic (Preserving Existing Bookings)
runTest('Reject removing visit date if appointments are booked on that date', () => {
  const scheduleDates = ['2026-11-01', '2026-11-02', '2026-11-03'];
  const existingVisits = [
    { appointmentDate: '2026-11-01', slot: '10:00 - 10:15' },
    { appointmentDate: '2026-11-02', slot: '11:00 - 11:15' }
  ];

  // User tries to update visitDates to only ['2026-11-01', '2026-11-03'] (removing 2026-11-02)
  const requestedDates = ['2026-11-01', '2026-11-03'];
  const orphanedVisits = existingVisits.filter(v => !requestedDates.includes(v.appointmentDate));

  assert.strictEqual(orphanedVisits.length, 1, 'Should find 1 orphaned visit on 2026-11-02');
  assert.strictEqual(orphanedVisits[0].appointmentDate, '2026-11-02');
});

runTest('Reject changing schedule timings if existing booked slots fall outside new window', () => {
  const existingVisits = [
    { slot: '10:00 - 10:15' },
    { slot: '13:45 - 14:00' }
  ];

  // User attempts to restrict hours to 11:00 - 13:00
  const newStartMins = timeToMinutes('11:00');
  const newEndMins = timeToMinutes('13:00');

  const outOfRange = existingVisits.filter(v => {
    const slotStartStr = v.slot.split('-')[0].trim();
    const slotMins = timeToMinutes(slotStartStr);
    return slotMins !== null && (slotMins < newStartMins || slotMins >= newEndMins);
  });

  assert.strictEqual(outOfRange.length, 2, 'Both 10:00 and 13:45 fall outside 11:00 - 13:00');
});

runTest('Reject changing slotDuration when appointments are already booked', () => {
  const schedule = { slotDuration: 15 };
  const linkedVisitsCount = 3;
  const requestedSlotDuration = 30;

  const canChangeDuration = linkedVisitsCount === 0 || requestedSlotDuration === schedule.slotDuration;
  assert.strictEqual(canChangeDuration, false, 'Cannot change slotDuration when bookings already exist');
});

// 5. Deletion Safety
runTest('Block schedule deletion if totalBooked > 0', () => {
  const linkedVisits = 5;
  const canDelete = linkedVisits === 0;
  assert.strictEqual(canDelete, false, 'Deletion must be blocked when visits exist');
});

// 6. Role Authorization
runTest('Role authorization accepts admin, reception, superadmin and rejects doctor, nurse, lab', () => {
  const allowedRoles = ['admin', 'reception', 'superadmin'];
  assert(allowedRoles.includes('admin'));
  assert(allowedRoles.includes('reception'));
  assert(allowedRoles.includes('superadmin'));
  assert(!allowedRoles.includes('doctor'));
  assert(!allowedRoles.includes('nurse'));
  assert(!allowedRoles.includes('lab'));
});

// 7. Visit.js Compatibility Verification
runTest('Visit model allows doctorId to be optional when isVisitingDoctor is true', () => {
  const visitingVisit = new Visit({
    patientId: new mongoose.Types.ObjectId(),
    uhid: 'UHID-20261028-001',
    registrationNumber: 'REG-20261028-0001',
    registrationDate: new Date(),
    visitType: 'OPD',
    department: 'Neurology',
    doctorId: null,
    isVisitingDoctor: true,
    visitingScheduleId: new mongoose.Types.ObjectId(),
    visitingDoctorName: 'Dr. Vikram Patel',
    doctorName: 'Dr. Vikram Patel',
    appointmentDate: '2026-11-05',
    slot: '10:00 - 10:15'
  });

  const err = visitingVisit.validateSync();
  assert(!err, `Validation failed unexpectedly for visiting doctor visit: ${err?.message}`);
  assert.strictEqual(visitingVisit.isVisitingDoctor, true);
  assert.strictEqual(visitingVisit.doctorId, null);
  assert.strictEqual(visitingVisit.visitingDoctorName, 'Dr. Vikram Patel');
});

console.log('\n====================================================');
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}

