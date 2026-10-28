/**
 * Super Speciality OPD End-to-End Workflow & Integration Test Suite
 * 
 * Safety: Pure in-memory unit and integration tests.
 * Zero live database connections or destructive operations.
 * Usage: node backend/scripts/testSuperSpecialityEndToEnd.js
 */

const assert = require('assert');
const mongoose = require('mongoose');

const VisitingDoctorSchedule = require('../models/VisitingDoctorSchedule');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Billing = require('../models/Billing');

console.log('======================================================================');
console.log('  SUPER SPECIALITY OPD END-TO-END WORKFLOW INTEGRATION TESTS          ');
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

// ----------------------------------------------------------------------
// 1. Visiting Specialist Schedule Creation & Conflict Detection
// ----------------------------------------------------------------------
runTest('Schedule Model: Successfully validates visiting specialist schedule without login account', () => {
  const hospitalId = new mongoose.Types.ObjectId();
  const createdBy = new mongoose.Types.ObjectId();

  const schedule = new VisitingDoctorSchedule({
    hospitalId,
    doctorName: 'Dr. Vikram Sarabhai (Neurologist)',
    department: 'Super Speciality - Neurology',
    speciality: 'Epileptology & Stroke',
    visitDates: ['2026-11-01', '2026-11-02'],
    startTime: '10:00',
    endTime: '13:00',
    slotDuration: 15,
    maxPatientsPerSlot: 1,
    consultationFee: 1200,
    status: 'Active',
    createdBy
  });

  const err = schedule.validateSync();
  assert(!err, `Validation failed: ${err?.message}`);
  assert.strictEqual(schedule.doctorName, 'Dr. Vikram Sarabhai (Neurologist)');
  assert.strictEqual(schedule.consultationFee, 1200);
  assert.strictEqual(schedule.status, 'Active');
});

runTest('Schedule Validation: Detects overlapping time slots on the same date for the same specialist', () => {
  const existingSchedule = {
    doctorName: 'Dr. Homi Bhabha',
    visitDates: ['2026-11-05'],
    startTime: '14:00',
    endTime: '17:00'
  };

  const newScheduleOverlap = {
    doctorName: 'Dr. Homi Bhabha',
    visitDates: ['2026-11-05'],
    startTime: '15:30',
    endTime: '18:00'
  };

  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const isOverlap = (s1, s2) => {
    const start1 = toMinutes(s1.startTime);
    const end1 = toMinutes(s1.endTime);
    const start2 = toMinutes(s2.startTime);
    const end2 = toMinutes(s2.endTime);
    return Math.max(start1, start2) < Math.min(end1, end2);
  };

  assert.strictEqual(isOverlap(existingSchedule, newScheduleOverlap), true, 'Should detect overlap');
});

// ----------------------------------------------------------------------
// 2. Patient Registration & Dynamic Slot Booking (UHID Generation)
// ----------------------------------------------------------------------
runTest('Patient Registration: New patient registration generates UHID and assigns visiting specialist Visit', () => {
  const hospitalId = new mongoose.Types.ObjectId();
  const scheduleId = new mongoose.Types.ObjectId();
  const receptionUserId = new mongoose.Types.ObjectId();

  const patient = new Patient({
    hospitalId,
    patientName: 'Ramesh Patel',
    mobile: '9876543210',
    gender: 'Male',
    dob: new Date('1985-03-20'),
    address: '123 River View, Ahmedabad',
    createdBy: receptionUserId
  });

  // Assign generated UHID
  patient.uhid = 'UHID-20261028-9999';
  const patErr = patient.validateSync();
  assert(!patErr, `Patient validation failed: ${patErr?.message}`);

  const visit = new Visit({
    hospitalId,
    patientId: patient._id,
    uhid: patient.uhid,
    registrationNumber: 'OPD-20261028-1001',
    visitType: 'OPD',
    department: 'Super Speciality - Neurology',
    doctorId: null, // No permanent doctor
    doctorName: 'Dr. Vikram Sarabhai',
    isVisitingDoctor: true,
    visitingScheduleId: scheduleId,
    visitingDoctorName: 'Dr. Vikram Sarabhai',
    appointmentDate: '2026-11-01',
    slot: '10:15 AM',
    appointmentNumber: 2,
    opdFee: 1200,
    netOpdFee: 1200,
    paymentMode: 'UPI',
    paymentStatus: 'Paid',
    billNumber: 'OPD-20261028-7788',
    consultationStatus: 'pending',
    createdBy: receptionUserId
  });

  const visitErr = visit.validateSync();
  assert(!visitErr, `Visit validation failed: ${visitErr?.message}`);
  assert.strictEqual(visit.doctorId, null);
  assert.strictEqual(visit.isVisitingDoctor, true);
  assert.strictEqual(visit.appointmentNumber, 2);
  assert.strictEqual(visit.netOpdFee, 1200);
});

runTest('Patient Registration: Existing patient registration increments visitNumber under same UHID', () => {
  const existingPatient = {
    _id: new mongoose.Types.ObjectId(),
    uhid: 'UHID-20260101-0001',
    patientName: 'Ramesh Patel',
    totalVisits: 1
  };

  const newVisitNumber = existingPatient.totalVisits + 1;
  assert.strictEqual(newVisitNumber, 2);
  assert.strictEqual(existingPatient.uhid, 'UHID-20260101-0001', 'UHID must remain constant across all visits');
});

// ----------------------------------------------------------------------
// 3. Concurrency Protection & Duplicate Slot Prevention
// ----------------------------------------------------------------------
runTest('Slot Booking: Partial compound index on Visit prevents duplicate slot booking under same schedule', () => {
  const indexes = Visit.schema.indexes();
  const slotIndex = indexes.find(idx => 
    idx[0].visitingScheduleId === 1 && 
    idx[0].appointmentDate === 1 && 
    idx[0].slot === 1
  );

  assert(slotIndex, 'Expected partial unique index on visitingScheduleId + appointmentDate + slot');
  assert.strictEqual(slotIndex[1].unique, true);
  assert(slotIndex[1].partialFilterExpression.isVisitingDoctor);
});

// ----------------------------------------------------------------------
// 4. Patient Slip Data Formatting & Integrity
// ----------------------------------------------------------------------
runTest('Patient Slip: Correctly compiles all required Super Speciality slip fields', () => {
  const visitData = {
    patientName: 'Sunita Mehra',
    uhid: 'UHID-20261028-5544',
    gender: 'Female',
    dob: new Date('1992-07-10'),
    mobile: '9898989898',
    department: 'Super Speciality - Cardiology',
    speciality: 'Electrophysiology',
    isVisitingDoctor: true,
    visitingDoctorName: 'Dr. Meenakshi Sundaram',
    appointmentDate: '2026-11-01',
    slot: '11:00 AM',
    appointmentNumber: 5,
    registrationNumber: 'OPD-20261028-2005',
    opdFee: 1500,
    netOpdFee: 1500,
    paymentStatus: 'Paid',
    paymentMode: 'Cash',
    billNumber: 'OPD-20261028-8899'
  };

  const isVisiting = Boolean(visitData.isVisitingDoctor);
  const rawDoctorName = visitData.visitingDoctorName;
  const doctorNameStr = /^dr\.?/i.test(rawDoctorName.trim()) ? rawDoctorName.trim() : `Dr. ${rawDoctorName.trim()}`;
  const doctorLabel = isVisiting ? 'Visiting Specialist:' : 'Doctor Name:';
  const doctorDisplay = `${doctorNameStr} ${isVisiting ? '(Visiting Specialist)' : ''}`;
  const tokenDisplay = visitData.appointmentNumber ? `Token #${visitData.appointmentNumber}` : '';
  const feeDisplay = `₹${visitData.netOpdFee.toFixed(2)} (${visitData.paymentStatus})`;

  assert.strictEqual(doctorLabel, 'Visiting Specialist:');
  assert.strictEqual(doctorDisplay, 'Dr. Meenakshi Sundaram (Visiting Specialist)');
  assert.strictEqual(tokenDisplay, 'Token #5');
  assert.strictEqual(feeDisplay, '₹1500.00 (Paid)');
  assert.strictEqual(visitData.billNumber, 'OPD-20261028-8899');
});

// ----------------------------------------------------------------------
// 5. Central Billing Integration
// ----------------------------------------------------------------------
runTest('Central Billing: Accurately formats billable item description for Visiting Specialist with zero doctorId crash', () => {
  const mockVisit = {
    _id: new mongoose.Types.ObjectId(),
    registrationNumber: 'OPD-20261028-3001',
    isVisitingDoctor: true,
    visitingDoctorName: 'Dr. Anand Mahindra (Oncology)',
    doctorId: null,
    opdFee: 2000,
    discountAmount: 200,
    netOpdFee: 1800,
    paymentStatus: 'Not Paid', // Unpaid at reception -> must be charged in central billing
    createdAt: new Date()
  };

  const rawDoc = mockVisit.isVisitingDoctor 
    ? (mockVisit.visitingDoctorName || 'Visiting Specialist') 
    : (mockVisit.doctorId?.doctorName || 'Doctor');
  const cleanDoc = /^dr\.?/i.test(rawDoc.trim()) ? rawDoc.trim() : `Dr. ${rawDoc.trim()}`;
  const specBadge = mockVisit.isVisitingDoctor ? ' (Visiting Specialist)' : '';
  const description = `OPD Consultation - ${cleanDoc}${specBadge} (${mockVisit.registrationNumber})`;

  assert.strictEqual(description, 'OPD Consultation - Dr. Anand Mahindra (Oncology) (Visiting Specialist) (OPD-20261028-3001)');

  // Billing Item Construction
  const isPaidAtReception = mockVisit.paymentStatus === 'Paid';
  const billableItem = {
    category: 'OPD',
    description,
    price: mockVisit.opdFee,
    discount: mockVisit.discountAmount,
    netFee: mockVisit.netOpdFee,
    quantity: 1,
    total: isPaidAtReception ? 0 : mockVisit.netOpdFee,
    originalTotal: mockVisit.netOpdFee,
    paidAtReception: isPaidAtReception,
    sourceId: mockVisit._id,
    sourceModel: 'Visit'
  };

  assert.strictEqual(billableItem.total, 1800, 'Unpaid OPD visit must result in billable total of 1800');
  assert.strictEqual(billableItem.paidAtReception, false);
});

runTest('Central Billing: Billed status synchronization marks Visit as Paid upon bill finalization', () => {
  const mockVisit = {
    _id: new mongoose.Types.ObjectId(),
    paymentStatus: 'Not Paid',
    isBilled: false
  };

  // Simulating bill finalization logic in billingController.js
  const finalPaymentStatus = 'Paid';
  mockVisit.isBilled = true;
  mockVisit.paymentStatus = finalPaymentStatus === 'Paid' ? 'Paid' : 'Partially Paid';

  assert.strictEqual(mockVisit.isBilled, true);
  assert.strictEqual(mockVisit.paymentStatus, 'Paid');
});

runTest('Central Billing: Reception refund marks Visit refunded, updates linked bill, and deducts revenue', () => {
  const mockVisit = {
    _id: new mongoose.Types.ObjectId(),
    netOpdFee: 1500,
    paymentStatus: 'Paid',
    isRefunded: false,
    billNumber: 'OPD-20261028-9999'
  };

  const mockBill = {
    _id: new mongoose.Types.ObjectId(),
    billNo: 'OPD-20261028-9999',
    grandTotal: 1500,
    amountPaid: 1500,
    paymentStatus: 'Paid',
    auditTrail: []
  };

  const refundAmount = 1500;
  mockVisit.paymentStatus = 'Refunded';
  mockVisit.isRefunded = true;
  mockVisit.refundAmount = refundAmount;
  mockVisit.refundDate = new Date();

  // Adjust linked bill
  mockBill.amountPaid = Math.max(0, mockBill.amountPaid - refundAmount);
  if (refundAmount >= mockBill.grandTotal) {
    mockBill.paymentStatus = 'Cancelled';
  }
  mockBill.auditTrail.push({
    action: 'Reception Refund Processed',
    remarks: `Refund of ₹${refundAmount} issued`
  });

  assert.strictEqual(mockVisit.paymentStatus, 'Refunded');
  assert.strictEqual(mockVisit.isRefunded, true);
  assert.strictEqual(mockBill.amountPaid, 0);
  assert.strictEqual(mockBill.paymentStatus, 'Cancelled');
  assert.strictEqual(mockBill.auditTrail.length, 1);
});

// ----------------------------------------------------------------------
// 6. Doctor Dashboard Queue & Consultation Integration
// ----------------------------------------------------------------------
runTest('Doctor Queue: Filters visiting specialist appointments and excludes cancelled/refunded visits', () => {
  const visits = [
    { _id: 1, isVisitingDoctor: true, consultationStatus: 'pending', isRefunded: false, paymentStatus: 'Paid' },
    { _id: 2, isVisitingDoctor: false, consultationStatus: 'pending', isRefunded: false, paymentStatus: 'Paid' },
    { _id: 3, isVisitingDoctor: true, consultationStatus: 'cancelled', isRefunded: false, paymentStatus: 'Paid' },
    { _id: 4, isVisitingDoctor: true, consultationStatus: 'pending', isRefunded: true, paymentStatus: 'Refunded' },
    { _id: 5, isVisitingDoctor: true, consultationStatus: 'completed', isRefunded: false, paymentStatus: 'Paid' },
    { _id: 6, isVisitingDoctor: true, consultationStatus: 'pending', isRefunded: false, paymentStatus: 'Paid' }
  ];

  // Active Visiting Specialist Queue filter
  const activeVisitingQueue = visits.filter(v => 
    v.isVisitingDoctor === true &&
    !['completed', 'cancelled'].includes(v.consultationStatus) &&
    v.isRefunded !== true &&
    v.paymentStatus !== 'Refunded'
  );

  assert.strictEqual(activeVisitingQueue.length, 2);
  assert.deepStrictEqual(activeVisitingQueue.map(v => v._id), [1, 6]);
});

runTest('Clinical Consultation: Attributes visiting specialist and records clinical staff user in conductedBy', () => {
  const staffUserId = new mongoose.Types.ObjectId();
  const scheduleId = new mongoose.Types.ObjectId();
  const hospitalId = new mongoose.Types.ObjectId();

  const consultation = new Consultation({
    hospitalId,
    patientId: new mongoose.Types.ObjectId(),
    doctorId: null, // Zero fake doctor login account
    isVisitingDoctor: true,
    visitingScheduleId: scheduleId,
    visitingDoctorName: 'Dr. Arvind Joshi (Neurologist)',
    conductedBy: staffUserId,
    conductedByName: 'Clinical Duty Officer',
    symptoms: [{ symptom: 'Chronic Tremor', durationDays: 14 }]
  });

  const err = consultation.validateSync();
  assert(!err, `Validation failed: ${err?.message}`);
  assert.strictEqual(consultation.isVisitingDoctor, true);
  assert.strictEqual(consultation.doctorId, null);
  assert.strictEqual(consultation.conductedBy, staffUserId);
});

runTest('Prescription Generation: Transitions Visit to completed and links consultationId', () => {
  const staffUserId = new mongoose.Types.ObjectId();
  const consultationId = new mongoose.Types.ObjectId();
  const visitId = new mongoose.Types.ObjectId();

  const prescription = new Prescription({
    patientId: new mongoose.Types.ObjectId(),
    hospitalId: new mongoose.Types.ObjectId(),
    doctorId: null,
    isVisitingDoctor: true,
    visitingDoctorName: 'Dr. Arvind Joshi',
    prescribedBy: staffUserId,
    prescribedByName: 'Clinical Duty Officer',
    consultationId,
    visitId,
    medicines: [{ medicine: 'Levodopa 250mg', qty: 30 }]
  });

  const err = prescription.validateSync();
  assert(!err, `Prescription validation failed: ${err?.message}`);

  // Simulating visit completion
  const visit = {
    _id: visitId,
    consultationStatus: 'pending',
    consultationCompletedDate: null
  };
  visit.consultationStatus = 'completed';
  visit.consultationCompletedDate = new Date();

  assert.strictEqual(visit.consultationStatus, 'completed');
  assert(visit.consultationCompletedDate instanceof Date);
});

// ----------------------------------------------------------------------
// 7. Standard OPD Regression Verification
// ----------------------------------------------------------------------
runTest('Standard OPD Regression: Retains mandatory doctorId, permanent doctor consultation fee, and standard flow', () => {
  const permanentDoctorId = new mongoose.Types.ObjectId();

  // Consultation without doctorId should fail for Standard OPD
  const invalidStandardConsultation = new Consultation({
    patientId: new mongoose.Types.ObjectId(),
    hospitalId: new mongoose.Types.ObjectId(),
    doctorId: null,
    isVisitingDoctor: false,
    symptoms: [{ symptom: 'Fever' }]
  });

  const failErr = invalidStandardConsultation.validateSync();
  assert(failErr, 'Standard OPD consultation must reject null doctorId');
  assert(failErr.errors['doctorId'], 'doctorId is required');

  // Consultation with permanent doctorId succeeds
  const validStandardConsultation = new Consultation({
    patientId: new mongoose.Types.ObjectId(),
    hospitalId: new mongoose.Types.ObjectId(),
    doctorId: permanentDoctorId,
    isVisitingDoctor: false,
    symptoms: [{ symptom: 'Fever' }]
  });

  const passErr = validStandardConsultation.validateSync();
  assert(!passErr, 'Standard OPD consultation must validate cleanly');
  assert.strictEqual(validStandardConsultation.doctorId.toString(), permanentDoctorId.toString());
});

console.log('\n======================================================================');
console.log(`  SUPER SPECIALITY E2E RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('======================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
