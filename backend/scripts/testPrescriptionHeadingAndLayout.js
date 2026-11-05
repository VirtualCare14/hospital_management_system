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
  console.log('  PRESCRIPTION HEADING & TWO-COLUMN CUSTOM LETTERHEAD TEST SUITE     ');
  console.log('======================================================================\n');

  const receiptPath = path.resolve(__dirname, '../../frontend/src/components/PatientReceipt.jsx');
  const receiptCode = fs.readFileSync(receiptPath, 'utf8');

  const settingsPath = path.resolve(__dirname, '../../frontend/src/pages/admin/HospitalSettings.jsx');
  const settingsCode = fs.readFileSync(settingsPath, 'utf8');

  // Test 1: Document title logic produces correct heading per mode
  runTest('Heading: Explicit PRESCRIPTION heading for prescription mode and PATIENT SLIP for patient slip mode', () => {
    assert(receiptCode.includes("let documentTitle = 'PRESCRIPTION';"), 'Missing default PRESCRIPTION title');
    assert(receiptCode.includes("documentTitle = 'REFUND VOUCHER';"), 'Missing REFUND VOUCHER title');
    assert(receiptCode.includes("documentTitle = 'PAYMENT RECEIPT';"), 'Missing PAYMENT RECEIPT title');
    assert(receiptCode.includes("documentTitle = 'PATIENT SLIP';"), 'Missing PATIENT SLIP title');
    assert(receiptCode.includes("else if (isPatientSlipOnly)"), 'Missing patient slip condition');
    assert(receiptCode.includes('{documentTitle}'), 'Document title must be rendered in header');
  });

  // Test 2: Two-column layout in Prescription format
  runTest('Layout: Two-column prescription architecture with Left Column and Right Column (190px)', () => {
    assert(receiptCode.includes('TWO-COLUMN PRESCRIPTION ARCHITECTURE: Patient Info, Clinical Details & Vitals'), 'Missing two-column architecture comment');
    assert(receiptCode.includes("display: 'flex', gap: '10px', alignItems: 'flex-start', width: '100%'"), 'Missing two-column flex wrapper');
    assert(receiptCode.includes("flex: '1 1 0%', minWidth: 0"), 'Missing flexible left column');
    assert(receiptCode.includes("width: '190px', flexShrink: 0"), 'Missing 190px fixed right column');
    assert(receiptCode.includes('renderVitalsTable(true)'), 'Missing compact vitals table in right column');
  });

  // Test 3: Left column contains all required clinical sections
  runTest('Left Column: Contains Patient Details, Diagnosis, Advice, Lab, Medicines, Symptoms, History, Signature', () => {
    assert(receiptCode.includes('Patient Information & Appointment Details') || receiptCode.includes('{t(activeLang, \'patientInfo\')} & Appointment Details'), 'Missing Patient Info');
    assert(receiptCode.includes('Diagnosis & Remarks') || receiptCode.includes('{t(activeLang, \'diagnosis\')}:'), 'Missing Diagnosis');
    assert(receiptCode.includes('Advice for the Patient:'), 'Missing Advice for the Patient');
    assert(receiptCode.includes('Lab Investigations & Reports:'), 'Missing Lab Investigations');
    assert(receiptCode.includes('{t(activeLang, \'medicines\')}:'), 'Missing Medicines table');
    assert(receiptCode.includes('{t(activeLang, \'symptoms\')}:'), 'Missing Symptoms');
    assert(receiptCode.includes('General Past History:'), 'Missing Past History');
    assert(receiptCode.includes('Follow up date:'), 'Missing Follow up date');
    assert(receiptCode.includes("Doctor's Signature"), 'Missing Doctor Signature');
  });

  // Test 4: All 11 vitals displayed in required order in Right Column
  runTest('Vitals Order: PULSE, BP, TEMP, RR, SPO2, WT/HT, PALLOR, EDEMA, CHEST, CVS, CNS in order', () => {
    const requiredOrder = [
      'PULSE',
      'BP',
      'TEMP',
      'RR',
      'SPO2',
      'WT/HT',
      'PALLOR',
      'EDEMA',
      'CHEST',
      'CVS',
      'CNS'
    ];

    let lastIndex = -1;
    requiredOrder.forEach(label => {
      const idx = receiptCode.indexOf(`{ label: '${label}',`);
      assert(idx !== -1, `Vital ${label} not found in vitalsTableRows`);
      assert(idx > lastIndex, `Vital ${label} is out of order`);
      lastIndex = idx;
    });
  });

  // Test 5: OPD Patient Slip also has two-column layout with Vitals on the right
  runTest('OPD Patient Slip: Implements two-column layout so right side is not empty', () => {
    assert(receiptCode.includes('TWO-COLUMN ARCHITECTURE FOR PATIENT SLIP'), 'Missing two-column architecture for patient slip');
    assert(receiptCode.includes('Vitals table for OPD Patient Slip'), 'Missing vitals table comment for patient slip');
  });

  // Test 6: Generated document info pushed to the bottom of the printable area
  runTest('Generated Info: Positioned at bottom with marginTop: auto and 8.5px font', () => {
    assert(receiptCode.includes("marginTop: 'auto'"), 'Missing marginTop: auto for bottom positioning');
    assert(receiptCode.includes("fontSize: '8.5px'"), 'Missing 8.5px font size for generated doc info');
    assert(receiptCode.includes('This is a computer-generated document. No signature required.'), 'Missing computer-generated document notice');
    assert(receiptCode.includes('Generated on: {documentDateTime}'), 'Missing document generation date time');
    assert(receiptCode.includes("pageBreakInside: 'avoid'"), 'Missing pageBreakInside: avoid');
  });

  // Test 7: Multi-page prescription repeats custom letterhead background and separates pages cleanly
  runTest('Multi-Page: Page 1 indicator, Page 2 continuation header, custom letterhead repeated on both pages', () => {
    assert(receiptCode.includes('isMultiPageCustomLetterhead'), 'Missing isMultiPageCustomLetterhead logic');
    assert(receiptCode.includes('Page 1 of 2 (Continued on next page) →'), 'Missing Page 1 continuation indicator');
    assert(receiptCode.includes('PRESCRIPTION (PAGE 2)'), 'Missing Page 2 banner');
    assert(receiptCode.includes('Page 2 of 2'), 'Missing Page 2 of 2 indicator');
    assert(receiptCode.includes('custom-letterhead-content'), 'Missing custom-letterhead-content');
  });

  // Test 8: Custom Letterhead millimeter margins preserved
  runTest('Margins: Millimeter margin configuration (header, footer, left, right) applied', () => {
    assert(receiptCode.includes('customHeaderHeight'), 'Missing customHeaderHeight');
    assert(receiptCode.includes('customFooterHeight'), 'Missing customFooterHeight');
    assert(receiptCode.includes('customLeftMargin'), 'Missing customLeftMargin');
    assert(receiptCode.includes('customRightMargin'), 'Missing customRightMargin');
  });

  // Test 9: Admin HospitalSettings preview defaults to prescription and passes live letterhead settings
  runTest('Admin Settings: Defaults previewSlipMode to prescription and injects live custom letterhead settings', () => {
    assert(settingsCode.includes("useState('prescription')"), 'previewSlipMode should default to prescription');
    assert(settingsCode.includes("customLetterheadUrl: previewCustomLetterhead"), 'Missing customLetterheadUrl in live settings');
    assert(settingsCode.includes("customLetterheadHeaderHeight: Number(watch('customLetterheadHeaderHeight')"), 'Missing customLetterheadHeaderHeight in live settings');
    assert(settingsCode.includes("customLetterheadFooterHeight: Number(watch('customLetterheadFooterHeight')"), 'Missing customLetterheadFooterHeight in live settings');
    assert(settingsCode.includes("customLetterheadLeftMargin: Number(watch('customLetterheadLeftMargin')"), 'Missing customLetterheadLeftMargin in live settings');
    assert(settingsCode.includes("customLetterheadRightMargin: Number(watch('customLetterheadRightMargin')"), 'Missing customLetterheadRightMargin in live settings');
    assert(settingsCode.includes("mode={previewSlipMode}"), 'Preview modal should pass mode={previewSlipMode}');
  });

  // Test 10: Format switcher buttons present for testing all document types
  runTest('Admin Settings: Format switcher provides buttons for OPD Patient Slip, Rx Prescription, Payment Receipt', () => {
    assert(settingsCode.includes("setPreviewSlipMode('patient_slip')"), 'Missing switch to patient_slip');
    assert(settingsCode.includes("setPreviewSlipMode('prescription')"), 'Missing switch to prescription');
    assert(settingsCode.includes("setPreviewSlipMode('bill_receipt')"), 'Missing switch to bill_receipt');
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
