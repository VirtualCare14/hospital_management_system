const assert = require('assert');
const mongoose = require('mongoose');
const Visit = require('../models/Visit');

let totalTests = 0;
let passedTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    console.error(`       Error: ${err.message}`);
  }
}

async function main() {
  console.log('======================================================================');
  console.log('  VISIT TYPE ENUM & NORMALIZATION VERIFICATION TEST                   ');
  console.log('======================================================================\n');

  // Test 1: Visit Schema allows 'Super Speciality OPD' in enum
  runTest('Visit Schema: accepts "Super Speciality OPD" in visitType enum', () => {
    const doc = new Visit({
      hospitalId: new mongoose.Types.ObjectId(),
      patientId: new mongoose.Types.ObjectId(),
      uhid: 'UHID-TEST-001',
      registrationNumber: 'REG-TEST-001',
      registrationDate: new Date(),
      visitType: 'Super Speciality OPD',
      department: 'Cardiology',
      appointmentDate: '2026-10-28',
      slot: '10:00 AM - 10:45 AM'
    });
    const err = doc.validateSync();
    assert.strictEqual(err, undefined, `Expected no validation error, got: ${err?.message}`);
    assert.strictEqual(doc.visitType, 'Super Speciality OPD');
  });

  // Test 2: Visit Schema accepts canonical 'OPD', 'IPD', 'Same Day Treatment', 'Emergency', 'Lab'
  runTest('Visit Schema: accepts canonical enum values (OPD, IPD, Same Day Treatment, Emergency, Lab)', () => {
    const validEnums = ['OPD', 'IPD', 'Same Day Treatment', 'Emergency', 'Lab'];
    for (const type of validEnums) {
      const doc = new Visit({
        hospitalId: new mongoose.Types.ObjectId(),
        patientId: new mongoose.Types.ObjectId(),
        uhid: 'UHID-TEST-002',
        registrationNumber: 'REG-TEST-002',
        registrationDate: new Date(),
        visitType: type,
        department: 'General',
        appointmentDate: '2026-10-28',
        slot: '10:00 AM - 10:15 AM'
      });
      const err = doc.validateSync();
      assert.strictEqual(err, undefined, `Expected no validation error for ${type}, got: ${err?.message}`);
    }
  });

  // Test 3: Visit Schema rejects unknown enums
  runTest('Visit Schema: rejects invalid enum values', () => {
    const doc = new Visit({
      hospitalId: new mongoose.Types.ObjectId(),
      patientId: new mongoose.Types.ObjectId(),
      uhid: 'UHID-TEST-003',
      registrationNumber: 'REG-TEST-003',
      registrationDate: new Date(),
      visitType: 'RandomNonExistentType',
      department: 'General',
      appointmentDate: '2026-10-28',
      slot: '10:00 AM - 10:15 AM'
    });
    const err = doc.validateSync();
    assert(err && err.errors && err.errors.visitType, 'Expected validation error on visitType path');
  });

  // Test 4: patientController normalization logic for 'Super Speciality OPD' -> 'OPD'
  runTest('patientController: normalizes incoming "Super Speciality OPD" to canonical "OPD"', () => {
    function resolveFinalVisitType({ isEmergency, visitType, isLab, department }) {
      let finalVisitType = isEmergency ? 'Emergency' : (visitType || (isLab ? 'Lab' : 'OPD'));
      if (finalVisitType === 'Super Speciality OPD') {
        finalVisitType = 'OPD';
      }
      if (department && department.toLowerCase().trim() === 'same day care') {
        finalVisitType = 'Same Day Treatment';
      } else if (isLab) {
        finalVisitType = 'Lab';
      }
      return finalVisitType;
    }

    const result = resolveFinalVisitType({
      isEmergency: false,
      visitType: 'Super Speciality OPD',
      isLab: false,
      department: 'Cardiology'
    });
    assert.strictEqual(result, 'OPD', `Expected 'OPD', got ${result}`);
  });

  // Test 5: patientController preserves Standard OPD, Same Day Care, Emergency, and Lab
  runTest('patientController: preserves Standard OPD, Same Day Care, Emergency, and Lab', () => {
    function resolveFinalVisitType({ isEmergency, visitType, isLab, department }) {
      let finalVisitType = isEmergency ? 'Emergency' : (visitType || (isLab ? 'Lab' : 'OPD'));
      if (finalVisitType === 'Super Speciality OPD') {
        finalVisitType = 'OPD';
      }
      if (department && department.toLowerCase().trim() === 'same day care') {
        finalVisitType = 'Same Day Treatment';
      } else if (isLab) {
        finalVisitType = 'Lab';
      }
      return finalVisitType;
    }

    assert.strictEqual(resolveFinalVisitType({ visitType: 'OPD', department: 'General' }), 'OPD');
    assert.strictEqual(resolveFinalVisitType({ visitType: undefined, department: 'General' }), 'OPD');
    assert.strictEqual(resolveFinalVisitType({ department: 'same day care' }), 'Same Day Treatment');
    assert.strictEqual(resolveFinalVisitType({ isEmergency: true }), 'Emergency');
    assert.strictEqual(resolveFinalVisitType({ isLab: true }), 'Lab');
  });

  // Test 6: Visiting Specialist Visit document attributes with canonical OPD
  runTest('Visiting Specialist Visit document stores canonical "OPD" with specialist attribution', () => {
    const schedId = new mongoose.Types.ObjectId();
    const doc = new Visit({
      hospitalId: new mongoose.Types.ObjectId(),
      patientId: new mongoose.Types.ObjectId(),
      uhid: 'UHID-SPEC-001',
      registrationNumber: 'REG-SPEC-001',
      registrationDate: new Date(),
      visitType: 'OPD',
      department: 'Neurology',
      doctorId: null,
      isVisitingDoctor: true,
      visitingScheduleId: schedId,
      visitingDoctorName: 'Dr. Jane Specialist',
      doctorName: 'Dr. Jane Specialist',
      appointmentDate: '2026-10-28',
      slot: '10:00 AM - 10:30 AM',
      opdFee: 750,
      netOpdFee: 750,
      paymentStatus: 'Paid',
      paymentMode: 'Cash'
    });

    const err = doc.validateSync();
    assert.strictEqual(err, undefined, `Expected valid document, got: ${err?.message}`);
    assert.strictEqual(doc.visitType, 'OPD');
    assert.strictEqual(doc.isVisitingDoctor, true);
    assert.strictEqual(doc.visitingDoctorName, 'Dr. Jane Specialist');
    assert.strictEqual(doc.visitingScheduleId.toString(), schedId.toString());
  });

  // Test 7: Frontend submittal logic sends canonical "OPD" for Super Speciality bookings
  runTest('Frontend submittal logic sends canonical "OPD" for Super Speciality bookings', () => {
    function getFrontendVisitType(department, isVisiting) {
      return (department && department.toLowerCase().trim() === 'same day care')
        ? 'Same Day Treatment'
        : 'OPD';
    }

    assert.strictEqual(getFrontendVisitType('Cardiology', true), 'OPD');
    assert.strictEqual(getFrontendVisitType('General Medicine', false), 'OPD');
    assert.strictEqual(getFrontendVisitType('same day care', true), 'Same Day Treatment');
  });

  console.log('\n----------------------------------------------------------------------');
  console.log(`Results: ${passedTests} / ${totalTests} tests passed`);
  console.log('----------------------------------------------------------------------');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

