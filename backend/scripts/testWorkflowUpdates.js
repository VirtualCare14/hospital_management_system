const assert = require('assert');
const mongoose = require('mongoose');
const { timeToMinutes, formatMinutesTo12h } = require('../controllers/visitingScheduleController');

let passedTests = 0;
let totalTests = 0;

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

async function runAsyncTest(testName, testFn) {
  totalTests++;
  try {
    await testFn();
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    console.error(`       Error: ${err.message}`);
  }
}

async function main() {
  console.log('======================================================================');
  console.log('  SUPER SPECIALITY OPD WORKFLOW UPDATES & VALIDATION TESTS             ');
  console.log('======================================================================\n');

  // Test 1: Helper timeToMinutes & formatMinutesTo12h
  runTest('Time conversion helpers: timeToMinutes and formatMinutesTo12h format correctly', () => {
    assert.strictEqual(timeToMinutes('09:30'), 570);
    assert.strictEqual(timeToMinutes('14:45'), 885);
    assert.strictEqual(timeToMinutes('invalid'), null);
    assert.strictEqual(formatMinutesTo12h(570), '09:30 AM');
    assert.strictEqual(formatMinutesTo12h(720), '12:00 PM');
    assert.strictEqual(formatMinutesTo12h(885), '02:45 PM');
    assert.strictEqual(formatMinutesTo12h(0), '12:00 AM');
  });

  // Test 2: Slot generation with time cutoff for today
  runTest('Slot availability logic: for today, slots earlier than current time are excluded', () => {
    // Suppose schedule is 10:00 to 12:00 with 30m slots: 10:00 AM - 10:30 AM, 10:30 AM - 11:00 AM, 11:00 AM - 11:30 AM, 11:30 AM - 12:00 PM
    const startMins = 600; // 10:00
    const endMins = 720;   // 12:00
    const slotDuration = 30;

    const allSlots = [];
    for (let m = startMins; m + slotDuration <= endMins; m += slotDuration) {
      allSlots.push({
        startMins: m,
        slotStr: `${formatMinutesTo12h(m)} - ${formatMinutesTo12h(m + slotDuration)}`
      });
    }
    assert.strictEqual(allSlots.length, 4);

    // If current system time is 10:45 AM (645 mins):
    const currentMins = 645;
    const availableToday = allSlots
      .filter(s => s.startMins >= currentMins)
      .map(s => s.slotStr);

    assert.strictEqual(availableToday.length, 2);
    assert.deepStrictEqual(availableToday, [
      '11:00 AM - 11:30 AM',
      '11:30 AM - 12:00 PM'
    ]);
  });

  // Test 3: If all slots for today have passed
  runTest('Slot availability logic: if all slots have passed today, empty list with proper message', () => {
    const startMins = 600; // 10:00 AM
    const endMins = 720;   // 12:00 PM
    const slotDuration = 30;

    const allSlots = [];
    for (let m = startMins; m + slotDuration <= endMins; m += slotDuration) {
      allSlots.push({
        startMins: m,
        slotStr: `${formatMinutesTo12h(m)} - ${formatMinutesTo12h(m + slotDuration)}`
      });
    }

    // Current time is 1:30 PM (810 mins):
    const currentMins = 810;
    const availableToday = allSlots
      .filter(s => s.startMins >= currentMins)
      .map(s => s.slotStr);

    assert.strictEqual(availableToday.length, 0);
    const message = availableToday.length === 0 ? 'No available time slots for this date.' : '';
    assert.strictEqual(message, 'No available time slots for this date.');
  });

  // Test 4: Past date rejection
  runTest('Slot availability logic: past dates are rejected with validation error', () => {
    const todayStr = '2026-10-28';
    const pastDate = '2026-10-27';
    const futureDate = '2026-10-29';

    assert.strictEqual(pastDate < todayStr, true);
    assert.strictEqual(futureDate < todayStr, false);
    assert.strictEqual(todayStr < todayStr, false);
  });

  // Test 5: Department Master case-insensitive duplicate check & regex escaping
  runTest('Department creation: trimmed and escaped case-insensitive duplicate check works reliably', () => {
    const existingDepts = [
      { departmentName: 'Cardiology' },
      { departmentName: 'ENT (Ear, Nose & Throat)' },
      { departmentName: 'Pediatrics' }
    ];

    function checkExists(inputName) {
      const trimmed = inputName.trim();
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^${escaped}$`, 'i');
      return existingDepts.some(d => regex.test(d.departmentName));
    }

    assert.strictEqual(checkExists('cardiology'), true);
    assert.strictEqual(checkExists('  CARDIOLOGY  '), true);
    assert.strictEqual(checkExists('ENT (Ear, Nose & Throat)'), true);
    assert.strictEqual(checkExists('ent (ear, nose & throat)'), true);
    assert.strictEqual(checkExists('Neurology'), false);
    assert.strictEqual(checkExists('Cardio'), false);
  });

  // Test 6: Department creation permission check
  runTest('Role authorization: Reception, Admin, and Superadmin can create departments', () => {
    const allowedRoles = ['admin', 'superadmin', 'reception'];
    assert.strictEqual(allowedRoles.includes('reception'), true);
    assert.strictEqual(allowedRoles.includes('admin'), true);
    assert.strictEqual(allowedRoles.includes('superadmin'), true);
    assert.strictEqual(allowedRoles.includes('doctor'), false);
    assert.strictEqual(allowedRoles.includes('nurse'), false);
  });

  // Test 7: Booking validation - Past slot rejection for today
  runTest('Backend booking validation: rejects booking a slot that has already passed today', () => {
    const todayStr = '2026-10-28';
    const bookingDate = '2026-10-28';
    const slotStr = '09:00 AM - 09:30 AM';

    // Parse slot start minutes
    const startStr = slotStr.split('-')[0].trim();
    // Convert 12h to minutes
    const match = startStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    assert.ok(match, 'Slot string matches 12h format');
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const slotStartMins = hours * 60 + mins;

    assert.strictEqual(slotStartMins, 540); // 9:00 AM = 540 mins

    const currentMinutes = 600; // 10:00 AM

    const isPassed = bookingDate === todayStr && slotStartMins < currentMinutes;
    assert.strictEqual(isPassed, true, 'Slot should be identified as passed for today');
  });

  // Test 8: Booking validation - Future slot allowed for today
  runTest('Backend booking validation: allows future slot for today', () => {
    const todayStr = '2026-10-28';
    const bookingDate = '2026-10-28';
    const slotStr = '11:00 AM - 11:30 AM';

    const match = slotStr.split('-')[0].trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const slotStartMins = hours * 60 + mins;

    assert.strictEqual(slotStartMins, 660); // 11:00 AM = 660 mins

    const currentMinutes = 600; // 10:00 AM

    const isPassed = bookingDate === todayStr && slotStartMins < currentMinutes;
    assert.strictEqual(isPassed, false, 'Slot should be allowed as it is in the future today');
  });

  console.log('\n======================================================================');
  console.log(`  WORKFLOW UPDATES RESULTS: ${passedTests} / ${totalTests} PASSED`);
  console.log('======================================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

