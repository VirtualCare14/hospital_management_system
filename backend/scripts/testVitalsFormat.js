const assert = require('assert');

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

// Helper to generate vitals rows matching PatientReceipt.jsx logic
function buildVitalsTableRows(vitals = {}) {
  const rawPulse = vitals.pulseRate ?? vitals.pulse ?? vitals.pr ?? vitals.pulse_rate;
  const pulseDisplay = (rawPulse !== undefined && rawPulse !== null && String(rawPulse).trim() !== '')
    ? (String(rawPulse).toLowerCase().includes('beat') || String(rawPulse).toLowerCase().includes('bpm')
        ? String(rawPulse).trim()
        : `${String(rawPulse).trim()} beats/min`)
    : '-';

  const rawBp = vitals.bloodPressure ?? vitals.bp ?? vitals.blood_pressure;
  const bpDisplay = (rawBp !== undefined && rawBp !== null && String(rawBp).trim() !== '')
    ? String(rawBp).trim()
    : '-';

  const rawTemp = vitals.temperature ?? vitals.temp;
  const tempDisplay = (rawTemp !== undefined && rawTemp !== null && String(rawTemp).trim() !== '')
    ? (String(rawTemp).includes('°') || String(rawTemp).toLowerCase().includes('f') || String(rawTemp).toLowerCase().includes('c')
        ? String(rawTemp).trim()
        : `${String(rawTemp).trim()} °F`)
    : '-';

  const rawRr = vitals.respiratoryRate ?? vitals.rr ?? vitals.respiratory_rate;
  const rrDisplay = (rawRr !== undefined && rawRr !== null && String(rawRr).trim() !== '')
    ? (String(rawRr).toLowerCase().includes('breath')
        ? String(rawRr).trim()
        : `${String(rawRr).trim()} breaths/min`)
    : '-';

  const rawSpo2 = vitals.spo2 ?? vitals.spO2 ?? vitals.oxygen;
  const spo2Display = (rawSpo2 !== undefined && rawSpo2 !== null && String(rawSpo2).trim() !== '')
    ? (String(rawSpo2).includes('%')
        ? String(rawSpo2).trim()
        : `${String(rawSpo2).trim()}%`)
    : '-';

  const rawWt = vitals.weight ?? vitals.wt;
  const rawHt = vitals.height ?? vitals.ht;
  const hasWt = rawWt !== undefined && rawWt !== null && String(rawWt).trim() !== '';
  const hasHt = rawHt !== undefined && rawHt !== null && String(rawHt).trim() !== '';
  const wtStr = hasWt
    ? (String(rawWt).toLowerCase().includes('kg') ? String(rawWt).trim() : `${String(rawWt).trim()} kg`)
    : null;
  const htStr = hasHt
    ? (String(rawHt).toLowerCase().includes('cm') ? String(rawHt).trim() : `${String(rawHt).trim()} cm`)
    : null;
  const wtHtDisplay = (wtStr && htStr) ? `${wtStr} / ${htStr}` : (wtStr || htStr || '-');

  const rawPallor = vitals.pallor;
  const pallorDisplay = (rawPallor !== undefined && rawPallor !== null && String(rawPallor).trim() !== '')
    ? String(rawPallor).trim()
    : '-';

  const rawEdema = vitals.edema ?? vitals.oedema;
  const edemaDisplay = (rawEdema !== undefined && rawEdema !== null && String(rawEdema).trim() !== '')
    ? String(rawEdema).trim()
    : '-';

  const rawChest = vitals.chest ?? vitals.bilateralChest ?? vitals.chestExam;
  const chestDisplay = (rawChest !== undefined && rawChest !== null && String(rawChest).trim() !== '')
    ? String(rawChest).trim()
    : '-';

  const rawCvs = vitals.cvs;
  const cvsDisplay = (rawCvs !== undefined && rawCvs !== null && String(rawCvs).trim() !== '')
    ? String(rawCvs).trim()
    : '-';

  const rawCns = vitals.cns;
  const cnsDisplay = (rawCns !== undefined && rawCns !== null && String(rawCns).trim() !== '')
    ? String(rawCns).trim()
    : '-';

  return [
    { label: 'PULSE', value: pulseDisplay },
    { label: 'BP', value: bpDisplay },
    { label: 'TEMP', value: tempDisplay },
    { label: 'RR', value: rrDisplay },
    { label: 'SPO2', value: spo2Display },
    { label: 'WT/HT', value: wtHtDisplay },
    { label: 'PALLOR', value: pallorDisplay },
    { label: 'EDEMA', value: edemaDisplay },
    { label: 'CHEST', value: chestDisplay },
    { label: 'CVS', value: cvsDisplay },
    { label: 'CNS', value: cnsDisplay }
  ];
}

async function main() {
  console.log('======================================================================');
  console.log('  VITALS FORMAT & EXAMINATIONS TABLE VERIFICATION                     ');
  console.log('======================================================================\n');

  // Test 1: Check exact row count and order matching the reference image
  runTest('Vitals Table: Generates exactly 11 rows in the exact specified order', () => {
    const rows = buildVitalsTableRows({});
    assert.strictEqual(rows.length, 11, `Expected 11 rows, got ${rows.length}`);

    const expectedLabels = [
      'PULSE', 'BP', 'TEMP', 'RR', 'SPO2', 'WT/HT',
      'PALLOR', 'EDEMA', 'CHEST', 'CVS', 'CNS'
    ];

    rows.forEach((row, idx) => {
      assert.strictEqual(row.label, expectedLabels[idx], `Row ${idx + 1} expected ${expectedLabels[idx]}, got ${row.label}`);
    });
  });

  // Test 2: When no values are recorded, all 11 rows display a dash '-'
  runTest('Vitals Table: Displays dash (-) for all 11 unrecorded fields (blank prescription format)', () => {
    const rows = buildVitalsTableRows({});
    rows.forEach((row) => {
      assert.strictEqual(row.value, '-', `Expected '-' for unrecorded ${row.label}, got '${row.value}'`);
    });
  });

  // Test 3: When all values are present, displays correctly with preserved units
  runTest('Vitals Table: Displays saved values and preserves existing units when present', () => {
    const vitals = {
      pulseRate: 72,
      bloodPressure: '120/80',
      temperature: 98.6,
      respiratoryRate: 18,
      spo2: 98,
      weight: 68,
      height: 172,
      pallor: 'None',
      edema: 'Absent',
      bilateralChest: 'Clear',
      cvs: 'S1 S2 heard',
      cns: 'NAD'
    };

    const rows = buildVitalsTableRows(vitals);
    const map = Object.fromEntries(rows.map(r => [r.label, r.value]));

    assert.strictEqual(map['PULSE'], '72 beats/min');
    assert.strictEqual(map['BP'], '120/80');
    assert.strictEqual(map['TEMP'], '98.6 °F');
    assert.strictEqual(map['RR'], '18 breaths/min');
    assert.strictEqual(map['SPO2'], '98%');
    assert.strictEqual(map['WT/HT'], '68 kg / 172 cm');
    assert.strictEqual(map['PALLOR'], 'None');
    assert.strictEqual(map['EDEMA'], 'Absent');
    assert.strictEqual(map['CHEST'], 'Clear');
    assert.strictEqual(map['CVS'], 'S1 S2 heard');
    assert.strictEqual(map['CNS'], 'NAD');
  });

  // Test 4: WT/HT handles partial entries (weight-only, height-only, or neither)
  runTest('Vitals Table: WT/HT correctly formats partial weight/height entries', () => {
    const weightOnly = buildVitalsTableRows({ weight: 70 });
    const wtMap = Object.fromEntries(weightOnly.map(r => [r.label, r.value]));
    assert.strictEqual(wtMap['WT/HT'], '70 kg');

    const heightOnly = buildVitalsTableRows({ height: 165 });
    const htMap = Object.fromEntries(heightOnly.map(r => [r.label, r.value]));
    assert.strictEqual(htMap['WT/HT'], '165 cm');

    const neither = buildVitalsTableRows({});
    const neitherMap = Object.fromEntries(neither.map(r => [r.label, r.value]));
    assert.strictEqual(neitherMap['WT/HT'], '-');
  });

  // Test 5: Aliased field names are properly resolved (pulse, bp, temp, rr, chest)
  runTest('Vitals Table: Correctly resolves field name aliases from different entry forms', () => {
    const aliasedVitals = {
      pulse: 80,
      bp: '130/85',
      temp: '99.0 °F',
      rr: 20,
      spO2: '97%',
      chest: 'Normal vesicular sounds',
      oedema: 'Mild pedallary'
    };

    const rows = buildVitalsTableRows(aliasedVitals);
    const map = Object.fromEntries(rows.map(r => [r.label, r.value]));

    assert.strictEqual(map['PULSE'], '80 beats/min');
    assert.strictEqual(map['BP'], '130/85');
    assert.strictEqual(map['TEMP'], '99.0 °F'); // avoids duplicate °F
    assert.strictEqual(map['RR'], '20 breaths/min');
    assert.strictEqual(map['SPO2'], '97%'); // avoids duplicate %
    assert.strictEqual(map['CHEST'], 'Normal vesicular sounds');
    assert.strictEqual(map['EDEMA'], 'Mild pedallary');
  });

  // Test 6: Verify PatientReceipt.jsx file content matches requirements
  runTest('PatientReceipt.jsx: Contains the two-column EXAMINATIONS | VALUE table and rows', () => {
    const fs = require('fs');
    const path = require('path');
    const receiptCode = fs.readFileSync(path.resolve(__dirname, '../../frontend/src/components/PatientReceipt.jsx'), 'utf8');

    assert(receiptCode.includes('EXAMINATIONS'), 'Missing EXAMINATIONS column header');
    assert(receiptCode.includes('VALUE'), 'Missing VALUE column header');
    assert(receiptCode.includes('vitalsTableRows'), 'Missing vitalsTableRows mapping');
    assert(receiptCode.includes("label: 'PULSE'"), "Missing PULSE row");
    assert(receiptCode.includes("label: 'BP'"), "Missing BP row");
    assert(receiptCode.includes("label: 'TEMP'"), "Missing TEMP row");
    assert(receiptCode.includes("label: 'RR'"), "Missing RR row");
    assert(receiptCode.includes("label: 'SPO2'"), "Missing SPO2 row");
    assert(receiptCode.includes("label: 'WT/HT'"), "Missing WT/HT row");
    assert(receiptCode.includes("label: 'PALLOR'"), "Missing PALLOR row");
    assert(receiptCode.includes("label: 'EDEMA'"), "Missing EDEMA row");
    assert(receiptCode.includes("label: 'CHEST'"), "Missing CHEST row");
    assert(receiptCode.includes("label: 'CVS'"), "Missing CVS row");
    assert(receiptCode.includes("label: 'CNS'"), "Missing CNS row");
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

