const assert = require('assert');
const fs = require('fs');
const path = require('path');

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
  console.log('  PRESCRIPTION TWO-COLUMN LAYOUT & MEDICINES TABLE VERIFICATION        ');
  console.log('======================================================================\n');

  const receiptPath = path.resolve(__dirname, '../../frontend/src/components/PatientReceipt.jsx');
  const receiptCode = fs.readFileSync(receiptPath, 'utf8');

  // Test 1: Two-column prescription architecture present
  runTest('Layout: Contains two-column prescription architecture with flex display', () => {
    assert(receiptCode.includes('TWO-COLUMN PRESCRIPTION ARCHITECTURE'), 'Missing two-column architecture comment');
    assert(receiptCode.includes("display: 'flex', gap: '10px', alignItems: 'flex-start', width: '100%'"), 'Missing flex container for two columns');
  });

  // Test 2: Left column contains all requested clinical fields
  runTest('Left Column: Contains Patient Details, Diagnosis, Advice, Lab, Medicines, Symptoms, History', () => {
    assert(receiptCode.includes('LEFT COLUMN: Clinical Content & Medicines'), 'Missing Left Column container');
    assert(receiptCode.includes('patientInfo'), 'Missing Patient Info in Left Column');
    assert(receiptCode.includes('prescription.diagnosisRemark'), 'Missing Diagnosis & Remarks in Left Column');
    assert(receiptCode.includes('prescription.patientAdvice'), 'Missing Advice in Left Column');
    assert(receiptCode.includes('prescription.tests'), 'Missing Lab Investigations in Left Column');
    assert(receiptCode.includes('prescription.medicines'), 'Missing Medicines in Left Column');
    assert(receiptCode.includes('prescription.symptoms'), 'Missing Symptoms in Left Column');
    assert(receiptCode.includes('prescription.pastHistory'), 'Missing Past History in Left Column');
  });

  // Test 3: Right column contains Vitals section
  runTest('Right Column: Houses Vitals section aligned with clinical content', () => {
    assert(receiptCode.includes('RIGHT COLUMN: Vitals Section Aligned with Clinical Content'), 'Missing Right Column container');
    assert(receiptCode.includes('renderVitalsTable(true)'), 'Missing renderVitalsTable call in Right Column');
    assert(receiptCode.includes("width: '190px', flexShrink: 0"), 'Right column should have fixed readable width and no shrink');
  });

  // Test 4: Medicines Table uses table-layout: fixed and width: 100%
  runTest('Medicines Table: Implements width: 100% and tableLayout: fixed to prevent clipping', () => {
    assert(receiptCode.includes("tableLayout: 'fixed'"), 'Missing tableLayout: fixed on medicines table');
    assert(receiptCode.includes("boxSizing: 'border-box'"), 'Missing boxSizing: border-box');
  });

  // Test 5: All 9 Medicines table columns preserved
  runTest('Medicines Table: Preserves all 9 columns without removing any medicine data', () => {
    const requiredColumns = [
      '#',
      '{t(activeLang, \'medicine\')}',
      'Dosage Form',
      'Strength',
      'Dose',
      'Frequency',
      'Duration',
      'Remarks',
      'Qty'
    ];

    requiredColumns.forEach(col => {
      assert(receiptCode.includes(col), `Missing medicines table column: ${col}`);
    });
  });

  // Test 6: Text wrapping and readable padding on medicine table cells
  runTest('Medicines Table: Implements wordBreak: break-word and readable cell padding', () => {
    assert(receiptCode.includes("overflowWrap: 'break-word'"), 'Missing overflowWrap: break-word');
    assert(receiptCode.includes("wordBreak: 'break-word'"), 'Missing wordBreak: break-word');
  });

  // Test 7: Non-prescription fallback preserved
  runTest('Fallback: Preserves standard non-prescription layout for patient slip / bill receipt', () => {
    assert(receiptCode.includes('NON-PRESCRIPTION LAYOUT'), 'Missing non-prescription layout branch');
    assert(receiptCode.includes('OPD Fee & Payment Summary'), 'Missing OPD Fee summary in non-prescription layout');
    assert(receiptCode.includes('renderVitalsTable(false)'), 'Missing renderVitalsTable(false) for non-prescription');
  });

  // Test 8: Index CSS confirms A4 portrait print setup
  runTest('Print CSS: index.css defines @page size: A4 portrait and margin: 8mm', () => {
    const cssPath = path.resolve(__dirname, '../../frontend/src/index.css');
    const cssCode = fs.readFileSync(cssPath, 'utf8');

    assert(cssCode.includes('size: A4 portrait'), 'Missing size: A4 portrait in index.css');
    assert(cssCode.includes('margin: 8mm'), 'Missing margin: 8mm in index.css');
    assert(cssCode.includes('.a4-receipt'), 'Missing .a4-receipt styling in index.css');
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
