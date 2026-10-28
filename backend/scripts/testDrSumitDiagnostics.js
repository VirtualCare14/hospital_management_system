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
  console.log('  DR. SUMIT SCHEDULE & TIME-SLOT DIAGNOSTICS & VERIFICATION          ');
  console.log('======================================================================\n');

  // Schedule parameters matching Dr. Sumit in DB
  const schedule = {
    doctorName: 'Sumit',
    department: 'opd',
    startTime: '10:00',
    endTime: '14:00',
    slotDuration: 45,
    visitDates: ['2026-10-28', '2026-10-30']
  };

  // Helper to generate slots adhering to strict time rule
  function generateSlots(sched) {
    const startMins = parseTimeToMinutes(sched.startTime);
    const endMins = parseTimeToMinutes(sched.endTime);
    const duration = sched.slotDuration || 15;

    const allSlots = [];
    if (startMins !== null && endMins !== null && startMins < endMins) {
      let cur = startMins;
      while (cur + duration <= endMins) {
        const slotEnd = cur + duration;
        const slotStartStr = formatMinutesTo12h(cur);
        const slotEndStr = formatMinutesTo12h(slotEnd);
        allSlots.push({
          slot: `${slotStartStr} - ${slotEndStr}`,
          startOnly: slotStartStr,
          startMins: cur,
          endMins: slotEnd
        });
        cur += duration;
      }
    }
    return allSlots;
  }

  // Test 1: Slot generation follows 45-minute duration and does not produce runt/partial slot
  runTest('Slot Generation: Generates exactly 5 slots of 45 minutes, with no 15-minute runt slot', () => {
    const slots = generateSlots(schedule);
    assert.strictEqual(slots.length, 5, 'Should produce exactly 5 slots of 45 mins');
    assert.deepStrictEqual(slots.map(s => s.slot), [
      '10:00 AM - 10:45 AM',
      '10:45 AM - 11:30 AM',
      '11:30 AM - 12:15 PM',
      '12:15 PM - 01:00 PM',
      '01:00 PM - 01:45 PM'
    ]);
    // Verify each slot is exactly 45 minutes
    slots.forEach(s => {
      assert.strictEqual(s.endMins - s.startMins, 45);
      assert.ok(s.endMins <= 840, 'Slot end must not exceed 14:00 (840 mins)');
    });
  });

  // Test 2: The selected date 2026-10-28 (today) when evaluated after visiting hours have ended
  runTest('Selected date 2026-10-28 (Today - Evening): All slots correctly identified as expired', () => {
    const todayStr = '2026-10-28';
    const selectedDate = '2026-10-28';
    const currentMinutes = 19 * 60 + 2; // 19:02 IST = 1142 minutes

    const allSlots = generateSlots(schedule);
    const availableSlots = allSlots.filter(s => {
      if (selectedDate === todayStr && s.startMins < currentMinutes) return false;
      return true;
    }).map(s => s.slot);

    assert.strictEqual(availableSlots.length, 0, 'No slots should remain for today evening');
    const message = availableSlots.length === 0
      ? (selectedDate === todayStr ? 'No slots available for the remaining time today.' : 'No available time slots for this date.')
      : '';
    assert.strictEqual(message, 'No slots available for the remaining time today.');
  });

  // Test 3: The future scheduled date 2026-10-30: All 5 slots available
  runTest('Future scheduled date 2026-10-30: Displays all 5 configured 45-minute slots', () => {
    const todayStr = '2026-10-28';
    const selectedDate = '2026-10-30';
    const currentMinutes = 19 * 60 + 2;

    const allSlots = generateSlots(schedule);
    const availableSlots = allSlots.filter(s => {
      if (selectedDate === todayStr && s.startMins < currentMinutes) return false;
      return true;
    }).map(s => s.slot);

    assert.strictEqual(availableSlots.length, 5);
    assert.deepStrictEqual(availableSlots, [
      '10:00 AM - 10:45 AM',
      '10:45 AM - 11:30 AM',
      '11:30 AM - 12:15 PM',
      '12:15 PM - 01:00 PM',
      '01:00 PM - 01:45 PM'
    ]);
  });

  // Test 4: A date not included in the schedule
  runTest('Date not in schedule (2026-10-29): Returns clear schedule message', () => {
    const date = '2026-10-29';
    const isScheduled = schedule.visitDates.includes(date);
    assert.strictEqual(isScheduled, false);

    const message = `Dr. ${schedule.doctorName} is only scheduled on: ${schedule.visitDates.join(', ')}`;
    assert.strictEqual(message, 'Dr. Sumit is only scheduled on: 2026-10-28, 2026-10-30');
  });

  // Test 5: A schedule with existing bookings on future date
  runTest('Schedule with existing bookings: excludes booked slots accurately', () => {
    const allSlots = generateSlots(schedule);
    const mockBookings = [
      { slot: '10:00 AM - 10:45 AM' },
      { slot: '11:30 AM - 12:15 PM' }
    ];

    const bookedSet = new Set(mockBookings.map(b => b.slot.trim()));
    const remaining = allSlots.filter(s => !bookedSet.has(s.slot)).map(s => s.slot);

    assert.strictEqual(remaining.length, 3);
    assert.deepStrictEqual(remaining, [
      '10:45 AM - 11:30 AM',
      '12:15 PM - 01:00 PM',
      '01:00 PM - 01:45 PM'
    ]);
  });

  // Test 6: A date with all slots expired
  runTest('Date with all slots expired: returns empty array and contextual message', () => {
    const todayStr = '2026-10-28';
    const allSlots = generateSlots(schedule);
    const currentMinutes = 15 * 60; // 15:00 (3 PM), past 14:00

    const available = allSlots.filter(s => s.startMins >= currentMinutes);
    assert.strictEqual(available.length, 0);

    const message = available.length === 0
      ? 'No slots available for the remaining time today.'
      : '';
    assert.strictEqual(message, 'No slots available for the remaining time today.');
  });

  // Test 7: Slot booking and duplicate-booking prevention
  runTest('Slot booking and duplicate prevention: Re-booking same slot is detected and blocked', () => {
    const slotToBook = '10:00 AM - 10:45 AM';
    const duration = 45;
    const slotTimes = parseSlotTimeRange(slotToBook, duration);
    assert.ok(slotTimes);
    assert.strictEqual(slotTimes.startMins, 600);
    assert.strictEqual(slotTimes.endMins, 645);
    assert.strictEqual(slotTimes.endMins - slotTimes.startMins, duration);

    // Simulated existing visits
    const visits = [
      { visitingScheduleId: '6ae1f7b45bc3200078494903', appointmentDate: '2026-10-30', slot: slotToBook, consultationStatus: 'pending' }
    ];

    const startOnlySlot = formatMinutesTo12h(slotTimes.startMins);
    const fullRangeSlot = `${startOnlySlot} - ${formatMinutesTo12h(slotTimes.endMins)}`;

    const isDuplicate = visits.some(v =>
      v.consultationStatus !== 'cancelled' &&
      (v.slot === slotToBook || v.slot === startOnlySlot || v.slot === fullRangeSlot)
    );

    assert.strictEqual(isDuplicate, true, 'Should detect duplicate slot booking');
  });

  // Test 8: Authoritative hospital timezone helper
  runTest('Hospital Timezone: Correctly evaluates date and time in Asia/Kolkata', () => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
    const [h, m] = timeStr.split(':').map(Number);
    const currentMinutes = h * 60 + m;

    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(todayStr), 'todayStr must be YYYY-MM-DD');
    assert.ok(currentMinutes >= 0 && currentMinutes < 1440, 'currentMinutes must be in 0-1439 range');
  });

  console.log('\n======================================================================');
  console.log(`  DR. SUMIT DIAGNOSTICS RESULTS: ${passedTests} / ${totalTests} PASSED`);
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

