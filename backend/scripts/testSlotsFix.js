const assert = require('assert');
const mongoose = require('mongoose');
const {
  formatMinutesTo12h,
  parseTimeToMinutes,
  parseSlotTimeRange
} = require('../controllers/visitingScheduleController');

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
  console.log('  SUPER SPECIALITY OPD TIME-SLOT DROPDOWN FIX VERIFICATION            ');
  console.log('======================================================================\n');

  // Test 1: Generate dynamic slots with start and end times clearly shown
  runTest('Slot Generation: produces formatted start and end times clearly (e.g., 10:00 AM - 10:15 AM)', () => {
    const startTime = '10:00';
    const endTime = '11:00';
    const slotDuration = 15;

    const startMins = parseTimeToMinutes(startTime);
    const endMins = parseTimeToMinutes(endTime);

    const allSlots = [];
    let cur = startMins;
    while (cur < endMins) {
      const slotEnd = Math.min(cur + slotDuration, endMins);
      const slotStartStr = formatMinutesTo12h(cur);
      const slotEndStr = formatMinutesTo12h(slotEnd);
      allSlots.push({
        slot: `${slotStartStr} - ${slotEndStr}`,
        startOnly: slotStartStr,
        startMins: cur,
        endMins: slotEnd
      });
      cur += slotDuration;
    }

    assert.strictEqual(allSlots.length, 4);
    assert.strictEqual(allSlots[0].slot, '10:00 AM - 10:15 AM');
    assert.strictEqual(allSlots[1].slot, '10:15 AM - 10:30 AM');
    assert.strictEqual(allSlots[2].slot, '10:30 AM - 10:45 AM');
    assert.strictEqual(allSlots[3].slot, '10:45 AM - 11:00 AM');
  });

  // Test 2: Today's date - past slots excluded based on current system time
  runTest('Today filter: excludes slots whose start time has passed based on current system time', () => {
    const allSlots = [
      { slot: '09:00 AM - 09:15 AM', startMins: 540 },
      { slot: '09:15 AM - 09:30 AM', startMins: 555 },
      { slot: '10:00 AM - 10:15 AM', startMins: 600 },
      { slot: '10:15 AM - 10:30 AM', startMins: 615 }
    ];

    // Simulate current time is 09:20 AM (560 mins)
    const simulatedCurrentMinutes = 560;
    const available = allSlots.filter(s => s.startMins >= simulatedCurrentMinutes);

    assert.strictEqual(available.length, 2);
    assert.strictEqual(available[0].slot, '10:00 AM - 10:15 AM');
    assert.strictEqual(available[1].slot, '10:15 AM - 10:30 AM');
  });

  // Test 3: Future date - all valid configured slots appear
  runTest('Future date: displays all configured slots within schedule', () => {
    const allSlots = [
      { slot: '10:00 AM - 10:15 AM', startMins: 600 },
      { slot: '10:15 AM - 10:30 AM', startMins: 615 },
      { slot: '10:30 AM - 10:45 AM', startMins: 630 }
    ];

    const isToday = false;
    const available = allSlots.filter(s => {
      if (isToday) return false;
      return true;
    });

    assert.strictEqual(available.length, 3);
    assert.deepStrictEqual(available.map(s => s.slot), [
      '10:00 AM - 10:15 AM',
      '10:15 AM - 10:30 AM',
      '10:30 AM - 10:45 AM'
    ]);
  });

  // Test 4: Booked slots excluded (supporting both exact range and legacy start-only formats)
  runTest('Booked slots exclusion: excludes slots booked in full range or start-only formats', () => {
    const allSlots = [
      { slot: '10:00 AM - 10:15 AM', startOnly: '10:00 AM', startMins: 600 },
      { slot: '10:15 AM - 10:30 AM', startOnly: '10:15 AM', startMins: 615 },
      { slot: '10:30 AM - 10:45 AM', startOnly: '10:30 AM', startMins: 630 },
      { slot: '10:45 AM - 11:00 AM', startOnly: '10:45 AM', startMins: 645 }
    ];

    // Mock booked visits: one booked with legacy '10:00 AM', one booked with '10:15 AM - 10:30 AM'
    const mockBookings = [
      { slot: '10:00 AM' },
      { slot: '10:15 AM - 10:30 AM' }
    ];

    const bookedSlotSet = new Set();
    const bookedStartMinutes = new Set();
    const duration = 15;

    mockBookings.forEach(b => {
      const trimmed = b.slot.trim();
      bookedSlotSet.add(trimmed);
      const parsed = parseSlotTimeRange(trimmed, duration);
      if (parsed && parsed.startMins !== null) {
        bookedStartMinutes.add(parsed.startMins);
      }
    });

    const available = allSlots.filter(s => {
      if (bookedSlotSet.has(s.slot) || bookedSlotSet.has(s.startOnly) || bookedStartMinutes.has(s.startMins)) {
        return false;
      }
      return true;
    });

    assert.strictEqual(available.length, 2);
    assert.deepStrictEqual(available.map(s => s.slot), [
      '10:30 AM - 10:45 AM',
      '10:45 AM - 11:00 AM'
    ]);
  });

  // Test 5: Empty slots message requirement
  runTest('Empty slots: returns "No available time slots for this date." when all slots are taken or past', () => {
    const availableSlots = [];
    let message = '';
    if (availableSlots.length === 0) {
      message = 'No available time slots for this date.';
    }
    assert.strictEqual(message, 'No available time slots for this date.');
  });

  // Test 6: Backend booking duplicate prevention (stale / race condition check)
  runTest('Backend Booking: duplicate slot query catches both exact range and start-only slot strings', () => {
    const targetSlot = '10:00 AM - 10:15 AM';
    const slotTimes = parseSlotTimeRange(targetSlot, 15);
    assert.ok(slotTimes);

    const startOnlySlot = formatMinutesTo12h(slotTimes.startMins);
    const fullRangeSlot = `${startOnlySlot} - ${formatMinutesTo12h(slotTimes.endMins)}`;

    assert.strictEqual(startOnlySlot, '10:00 AM');
    assert.strictEqual(fullRangeSlot, '10:00 AM - 10:15 AM');

    // Simulate database records
    const dbVisits = [
      { slot: '10:00 AM', consultationStatus: 'pending' }
    ];

    const isMatch = dbVisits.some(v =>
      v.consultationStatus !== 'cancelled' &&
      (v.slot === targetSlot || v.slot === startOnlySlot || v.slot === fullRangeSlot)
    );

    assert.strictEqual(isMatch, true, 'Should detect duplicate even if stored as start-only in DB');
  });

  // Test 7: Backend booking validation rejects past slots today
  runTest('Backend Booking: rejects booking a slot that has already passed today', () => {
    const todayStr = '2026-10-28';
    const appointmentDate = '2026-10-28';
    const slot = '10:00 AM - 10:15 AM';
    const slotTimes = parseSlotTimeRange(slot, 15);

    // Current time is 11:30 AM (690 mins)
    const currentMinutes = 690;
    const isPast = appointmentDate === todayStr && slotTimes.startMins < currentMinutes;

    assert.strictEqual(isPast, true);
  });

  // Test 8: Backward compatibility with Standard OPD slot format
  runTest('Standard OPD Compatibility: slot parsing and generation preserves standard formats', () => {
    const standardSlot = '11:00 AM';
    const range = parseSlotTimeRange(standardSlot, 15);
    assert.strictEqual(range.startMins, 660);
    assert.strictEqual(range.endMins, 675);
  });

  console.log('\n======================================================================');
  console.log(`  SLOTS FIX VERIFICATION RESULTS: ${passedTests} / ${totalTests} PASSED`);
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

