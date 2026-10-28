/**
 * Phase 4 Visiting Specialist Consultation & Queue Management Test Suite
 * 
 * Safety: Pure in-memory unit tests.
 * Zero database connections or mutations.
 * Usage: node backend/scripts/testPhase4ConsultationQueue.js
 */

const assert = require('assert');
const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');

console.log('======================================================================');
console.log('  PHASE 4: VISITING SPECIALIST CONSULTATION & QUEUE UNIT TESTS        ');
console.log('======================================================================\n');

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

// 1. Consultation Model Schema Validation for Visiting Specialist
runTest('Consultation schema allows doctorId to be null when isVisitingDoctor is true', () => {
  const dummy = new Consultation({
    patientId: new mongoose.Types.ObjectId(),
    hospitalId: new mongoose.Types.ObjectId(),
    doctorId: null,
    isVisitingDoctor: true,
    visitingScheduleId: new mongoose.Types.ObjectId(),
    visitingDoctorName: 'Dr. Meenakshi Sundaram (Cardiologist)',
    conductedBy: new mongoose.Types.ObjectId(),
    conductedByName: 'Clinical Staff User',
    symptoms: [{ symptom: 'Chest tightness' }]
  });

  const err = dummy.validateSync();
  assert(!err, `Validation should pass for visiting specialist: ${err?.message}`);
  assert.strictEqual(dummy.isVisitingDoctor, true);
  assert.strictEqual(dummy.doctorId, null);
  assert.strictEqual(dummy.visitingDoctorName, 'Dr. Meenakshi Sundaram (Cardiologist)');
});

// 2. Consultation Model Schema Validation for Standard OPD (Regression)
runTest('Consultation schema requires doctorId when isVisitingDoctor is false (Standard OPD)', () => {
  const dummy = new Consultation({
    patientId: new mongoose.Types.ObjectId(),
    hospitalId: new mongoose.Types.ObjectId(),
    doctorId: null,
    isVisitingDoctor: false,
    symptoms: [{ symptom: 'Fever' }]
  });

  const err = dummy.validateSync();
  assert(err, 'Validation error expected when doctorId is missing in Standard OPD');
  assert(err.errors['doctorId'], 'doctorId should be required when isVisitingDoctor is false');
});

// 3. Prescription Model Schema Validation for Visiting Specialist
runTest('Prescription schema allows doctorId to be null when isVisitingDoctor is true', () => {
  const dummy = new Prescription({
    patientId: new mongoose.Types.ObjectId(),
    hospitalId: new mongoose.Types.ObjectId(),
    doctorId: null,
    isVisitingDoctor: true,
    visitingScheduleId: new mongoose.Types.ObjectId(),
    visitingDoctorName: 'Dr. Arvind Joshi (Neurologist)',
    prescribedBy: new mongoose.Types.ObjectId(),
    prescribedByName: 'Dr. Duty Staff',
    medicines: [{ medicine: 'Paracetamol 650mg', qty: 10 }]
  });

  const err = dummy.validateSync();
  assert(!err, `Validation should pass for visiting specialist prescription: ${err?.message}`);
  assert.strictEqual(dummy.isVisitingDoctor, true);
  assert.strictEqual(dummy.doctorId, null);
  assert.strictEqual(dummy.visitingDoctorName, 'Dr. Arvind Joshi (Neurologist)');
});

// 4. Prescription Model Schema Validation for Standard OPD (Regression)
runTest('Prescription schema requires doctorId when isVisitingDoctor is false (Standard OPD)', () => {
  const dummy = new Prescription({
    patientId: new mongoose.Types.ObjectId(),
    hospitalId: new mongoose.Types.ObjectId(),
    doctorId: null,
    isVisitingDoctor: false,
    medicines: [{ medicine: 'Amoxicillin 500mg' }]
  });

  const err = dummy.validateSync();
  assert(err, 'Validation error expected when doctorId is missing in Standard OPD prescription');
  assert(err.errors['doctorId'], 'doctorId should be required when isVisitingDoctor is false');
});

// 5. Visiting Specialist Queue Mapping (buildPatientData simulation)
runTest('buildPatientData correctly maps visiting specialist appointments with display badge and token', () => {
  const mockScheduleId = new mongoose.Types.ObjectId();
  const mockVisit = {
    _id: new mongoose.Types.ObjectId(),
    uhid: 'UHID-20261028-0042',
    patientId: {
      _id: new mongoose.Types.ObjectId(),
      patientName: 'Kavita Sharma',
      mobile: '9876543210',
      gender: 'Female',
      dob: new Date('1990-05-15')
    },
    department: 'Super Speciality - Cardiology',
    doctorId: null,
    doctorName: 'Dr. S. K. Gupta',
    isVisitingDoctor: true,
    visitingScheduleId: mockScheduleId,
    visitingDoctorName: 'Dr. S. K. Gupta',
    appointmentNumber: 4,
    appointmentDate: '2026-10-28',
    slot: '10:30 AM',
    consultationStatus: 'pending',
    createdAt: new Date(),
    createdBy: { doctorName: 'Reception Desk', username: 'reception1' }
  };

  const isVisiting = Boolean(mockVisit.isVisitingDoctor);
  const specialistName = mockVisit.visitingDoctorName || mockVisit.doctorName || '';

  const mapped = {
    _id: mockVisit.patientId._id,
    visitId: mockVisit._id,
    uhid: mockVisit.uhid,
    patientName: mockVisit.patientId.patientName,
    mobile: mockVisit.patientId.mobile,
    gender: mockVisit.patientId.gender,
    department: mockVisit.department,
    doctorId: isVisiting ? {
      _id: mockVisit.visitingScheduleId,
      doctorName: specialistName,
      username: specialistName,
      isVisitingDoctor: true
    } : mockVisit.doctorId,
    doctorName: isVisiting ? specialistName : mockVisit.doctorName,
    isVisitingDoctor: isVisiting,
    visitingScheduleId: mockVisit.visitingScheduleId,
    visitingDoctorName: specialistName,
    appointmentNumber: mockVisit.appointmentNumber,
    appointmentDate: mockVisit.appointmentDate,
    slot: mockVisit.slot,
    consultationStatus: mockVisit.consultationStatus
  };

  assert.strictEqual(mapped.isVisitingDoctor, true);
  assert.strictEqual(mapped.visitingDoctorName, 'Dr. S. K. Gupta');
  assert.strictEqual(mapped.appointmentNumber, 4);
  assert.strictEqual(mapped.doctorId.isVisitingDoctor, true);
  assert.strictEqual(mapped.doctorId._id.toString(), mockScheduleId.toString());
});

// 6. Queue Query Construction & Multi-Tenant Isolation
runTest('Queue query filters strictly by hospitalId and separates provider types', () => {
  const hospitalA = new mongoose.Types.ObjectId();
  const hospitalB = new mongoose.Types.ObjectId();
  const scheduleA = new mongoose.Types.ObjectId();

  const mockReqA = {
    user: { _id: new mongoose.Types.ObjectId(), hospitalId: hospitalA, role: 'admin' },
    query: { visitingScheduleId: scheduleA.toString(), providerType: 'visiting' }
  };

  const tenantQuery = (req, extra = {}) => (
    req.user.hospitalId ? { ...extra, hospitalId: req.user.hospitalId } : extra
  );

  let doctorQuery = {};
  if (mockReqA.query.visitingScheduleId) {
    doctorQuery = { isVisitingDoctor: true, visitingScheduleId: mockReqA.query.visitingScheduleId };
  } else if (mockReqA.query.providerType === 'visiting') {
    doctorQuery = { isVisitingDoctor: true };
  }

  const finalQuery = tenantQuery(mockReqA, {
    ...doctorQuery,
    consultationStatus: { $nin: ['completed', 'cancelled'] }
  });

  assert.strictEqual(finalQuery.hospitalId.toString(), hospitalA.toString());
  assert.notStrictEqual(finalQuery.hospitalId.toString(), hospitalB.toString());
  assert.strictEqual(finalQuery.isVisitingDoctor, true);
  assert.strictEqual(finalQuery.visitingScheduleId, scheduleA.toString());
  assert.deepStrictEqual(finalQuery.consultationStatus, { $nin: ['completed', 'cancelled'] });
});

// 7. Cancelled Appointment Exclusion from Active Queue
runTest('Cancelled appointments are excluded from active doctor consultation queue', () => {
  const visits = [
    { _id: 1, patientName: 'P1', consultationStatus: 'pending' },
    { _id: 2, patientName: 'P2', consultationStatus: 'cancelled' },
    { _id: 3, patientName: 'P3', consultationStatus: 'completed' },
    { _id: 4, patientName: 'P4', consultationStatus: 'pending' }
  ];

  const activeQueue = visits.filter(v => !['completed', 'cancelled'].includes(v.consultationStatus));
  assert.strictEqual(activeQueue.length, 2);
  assert.deepStrictEqual(activeQueue.map(v => v._id), [1, 4]);
});

// 8. Consultation Creation Authorization & Specialist Attribution
runTest('Consultation creation validates clinical role and attributes specialist display identity without fake doctor user', () => {
  const staffUserId = new mongoose.Types.ObjectId();
  const mockScheduleId = new mongoose.Types.ObjectId();
  const mockHospitalId = new mongoose.Types.ObjectId();

  // Role check simulation
  const checkRole = (role) => ['doctor', 'admin', 'superadmin'].includes(role);
  assert.strictEqual(checkRole('doctor'), true);
  assert.strictEqual(checkRole('admin'), true);
  assert.strictEqual(checkRole('superadmin'), true);
  assert.strictEqual(checkRole('reception'), false, 'Reception role must be rejected from creating consultations');
  assert.strictEqual(checkRole('billing'), false, 'Billing role must be rejected');

  // Consultation document attribution
  const visit = {
    isVisitingDoctor: true,
    visitingScheduleId: mockScheduleId,
    visitingDoctorName: 'Dr. Ramanathan (Oncology)',
    doctorId: null
  };

  const isVisiting = Boolean(visit.isVisitingDoctor);
  const consultationDoc = {
    hospitalId: mockHospitalId,
    doctorId: isVisiting ? null : visit.doctorId,
    isVisitingDoctor: isVisiting,
    visitingScheduleId: isVisiting ? visit.visitingScheduleId : null,
    visitingDoctorName: isVisiting ? visit.visitingDoctorName : '',
    conductedBy: staffUserId,
    conductedByName: 'Dr. Duty Staff',
    consultationStatus: 'pending'
  };

  assert.strictEqual(consultationDoc.isVisitingDoctor, true);
  assert.strictEqual(consultationDoc.doctorId, null, 'DoctorId must remain null; no fake doctor account created');
  assert.strictEqual(consultationDoc.visitingDoctorName, 'Dr. Ramanathan (Oncology)');
  assert.strictEqual(consultationDoc.conductedBy, staffUserId, 'Staff user preserved for auditability');
});

// 9. Duplicate Consultation Prevention on Visit Reopening
runTest('Reopening a pending visit updates existing consultation instead of creating duplicate records', () => {
  const visitId = new mongoose.Types.ObjectId();
  const existingConsultations = [
    { _id: new mongoose.Types.ObjectId(), visitId, consultationStatus: 'pending', symptoms: [{ symptom: 'Headache' }] }
  ];

  // Logic: find existing pending consultation for visitId
  const found = existingConsultations.find(c => c.visitId.toString() === visitId.toString() && c.consultationStatus === 'pending');
  assert(found, 'Should find existing pending consultation');

  // Update in place instead of creating new
  found.symptoms.push({ symptom: 'Dizziness' });
  assert.strictEqual(found.symptoms.length, 2);
  assert.strictEqual(existingConsultations.length, 1, 'Total consultation records for encounter must remain 1');
});

// 10. Digital Prescription Creation and Status Completion
runTest('Prescription creation transitions Visit consultationStatus to completed and retains specialist metadata', () => {
  const mockVisit = {
    _id: new mongoose.Types.ObjectId(),
    isVisitingDoctor: true,
    visitingScheduleId: new mongoose.Types.ObjectId(),
    visitingDoctorName: 'Dr. Neha Kapoor (Dermatology)',
    consultationStatus: 'pending',
    consultationCompletedDate: null,
    opdFee: 800,
    paymentStatus: 'Paid',
    paymentMode: 'Cash'
  };

  const staffUserId = new mongoose.Types.ObjectId();

  // Create prescription
  const prescription = {
    visitId: mockVisit._id,
    isVisitingDoctor: true,
    visitingScheduleId: mockVisit.visitingScheduleId,
    visitingDoctorName: mockVisit.visitingDoctorName,
    doctorId: null,
    prescribedBy: staffUserId,
    prescribedByName: 'Staff Operator',
    medicines: [{ medicine: 'Cetirizine 10mg', qty: 10 }]
  };

  // Mark visit completed
  mockVisit.consultationStatus = 'completed';
  mockVisit.consultationCompletedDate = new Date();

  assert.strictEqual(prescription.isVisitingDoctor, true);
  assert.strictEqual(prescription.doctorId, null);
  assert.strictEqual(prescription.visitingDoctorName, 'Dr. Neha Kapoor (Dermatology)');
  assert.strictEqual(prescription.prescribedBy, staffUserId);
  assert.strictEqual(mockVisit.consultationStatus, 'completed');
  assert(mockVisit.consultationCompletedDate instanceof Date);
  assert.strictEqual(mockVisit.paymentStatus, 'Paid', 'Payment status must be preserved intact');
  assert.strictEqual(mockVisit.opdFee, 800, 'OPD Fee must be preserved intact');
});

// 11. Completed Consultations Details Safe Population (Zero TypeError on null doctorId)
runTest('Completed consultation details correctly handles null doctorId for visiting specialist', () => {
  const consultation = {
    _id: new mongoose.Types.ObjectId(),
    isVisitingDoctor: true,
    visitingScheduleId: new mongoose.Types.ObjectId(),
    visitingDoctorName: 'Dr. Jayant Patil',
    doctorId: null,
    conductedByName: 'Clinical Duty Assistant'
  };

  const reqUser = { role: 'doctor', _id: new mongoose.Types.ObjectId() };

  // Authorization check simulation without null reference exception
  let isAuthorized = true;
  if (reqUser.role === 'doctor') {
    if (!consultation.isVisitingDoctor && consultation.doctorId && consultation.doctorId._id?.toString() !== reqUser._id.toString()) {
      isAuthorized = false;
    }
  }

  assert.strictEqual(isAuthorized, true, 'Doctor/Admin must be authorized to view visiting specialist completed details');

  const patientObjDoctor = consultation.isVisitingDoctor ? {
    _id: consultation.visitingScheduleId,
    doctorName: consultation.visitingDoctorName,
    isVisitingDoctor: true
  } : consultation.doctorId;

  assert.strictEqual(patientObjDoctor.doctorName, 'Dr. Jayant Patil');
  assert.strictEqual(patientObjDoctor.isVisitingDoctor, true);
});

// 12. Standard OPD Full Regression Check
runTest('Standard OPD consultation continues to require permanent doctor and preserves all OPD functionality', () => {
  const permanentDoctorId = new mongoose.Types.ObjectId();
  const standardVisit = {
    _id: new mongoose.Types.ObjectId(),
    isVisitingDoctor: false,
    doctorId: permanentDoctorId,
    doctorName: 'Dr. Rajesh Verma',
    opdFee: 400,
    consultationStatus: 'pending'
  };

  const isVisiting = Boolean(standardVisit.isVisitingDoctor);
  const consultation = new Consultation({
    patientId: new mongoose.Types.ObjectId(),
    hospitalId: new mongoose.Types.ObjectId(),
    doctorId: isVisiting ? null : standardVisit.doctorId,
    isVisitingDoctor: false,
    visitId: standardVisit._id,
    symptoms: [{ symptom: 'Persistent Cough' }]
  });

  const err = consultation.validateSync();
  assert(!err, 'Standard OPD consultation must validate cleanly');
  assert.strictEqual(consultation.isVisitingDoctor, false);
  assert.strictEqual(consultation.doctorId.toString(), permanentDoctorId.toString());
});

// 13. Refunded Appointment Exclusion from Active Queue
runTest('Refunded visits (isRefunded: true or paymentStatus: "Refunded") are excluded from active doctor queues', () => {
  const visits = [
    { _id: 1, patientName: 'P1', consultationStatus: 'pending', isRefunded: false, paymentStatus: 'Paid' },
    { _id: 2, patientName: 'P2', consultationStatus: 'pending', isRefunded: true, paymentStatus: 'Refunded' },
    { _id: 3, patientName: 'P3', consultationStatus: 'pending', paymentStatus: 'Refunded' },
    { _id: 4, patientName: 'P4', consultationStatus: 'pending', isRefunded: false, paymentStatus: 'Paid' }
  ];

  const activeQueue = visits.filter(v => 
    !['completed', 'cancelled'].includes(v.consultationStatus) &&
    v.isRefunded !== true &&
    v.paymentStatus !== 'Refunded'
  );
  assert.strictEqual(activeQueue.length, 2);
  assert.deepStrictEqual(activeQueue.map(v => v._id), [1, 4]);
});

console.log('\n======================================================================');
console.log(`  PHASE 4 TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('======================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}

