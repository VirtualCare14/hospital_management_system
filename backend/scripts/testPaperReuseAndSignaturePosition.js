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
  console.log('  PAPER REUSE & DOCTOR SIGNATURE RIGHT-BOTTOM TEST SUITE             ');
  console.log('======================================================================\n');

  const receiptPath = path.resolve(__dirname, '../../frontend/src/components/PatientReceipt.jsx');
  const receiptCode = fs.readFileSync(receiptPath, 'utf8');

  const consultPath = path.resolve(__dirname, '../../frontend/src/pages/doctor/ConsultationPage.jsx');
  const consultCode = fs.readFileSync(consultPath, 'utf8');

  const editSettingsPath = path.resolve(__dirname, '../../frontend/src/pages/doctor/EditPrintRxSettings.jsx');
  const editSettingsCode = fs.readFileSync(editSettingsPath, 'utf8');

  const rxPagePath = path.resolve(__dirname, '../../frontend/src/pages/doctor/PrescriptionPage.jsx');
  const rxPageCode = fs.readFileSync(rxPagePath, 'utf8');

  // Test 1: Doctor Signature is positioned on the right bottom
  runTest('Signature: Doctor signature is anchored to the right bottom of the full sheet', () => {
    assert(receiptCode.includes("Doctor's Signature - Anchored on Right Bottom"), 'Missing doctor signature anchored comment');
    assert(receiptCode.includes("display: 'flex', justifyContent: 'flex-end', marginTop: 'auto'"), 'Signature must use justifyContent: flex-end and marginTop: auto');
    assert(receiptCode.includes("minWidth: '170px', borderTop: '1.5px solid #000'"), 'Signature line must have clean 170px width and top border');
    assert(receiptCode.includes("strong style={{ fontSize: '11px', color: '#000' }}>Doctor's Signature</strong>"), 'Missing Doctor\'s Signature bold label');
  });

  // Test 2: Paper reuse architecture defined in PatientReceipt.jsx
  runTest('Paper Reuse: isReusingPaper evaluates prescription and reuseReceptionPaper preference', () => {
    assert(receiptCode.includes('const isReusingPaper = Boolean('), 'Missing isReusingPaper boolean definition');
    assert(receiptCode.includes('isPrescriptionFormat &&'), 'isReusingPaper must require isPrescriptionFormat');
    assert(receiptCode.includes('!isPatientSlipOnly &&'), 'isReusingPaper must not hide reception patient slips');
    assert(receiptCode.includes('reuseReceptionPaper'), 'isReusingPaper must check reuseReceptionPaper');
  });

  // Test 3: Prescription heading is hidden when reusing reception paper
  runTest('Heading: Prescription document title is hidden when reusing paper to prevent duplicate printing', () => {
    assert(receiptCode.includes("borderBottom: '2.5px solid #000', paddingBottom: '4px', visibility: isReusingPaper ? 'hidden' : 'visible'"), 'Document title header must toggle visibility based on isReusingPaper');
  });

  // Test 4: Patient Info and Vitals are hidden when reusing paper
  runTest('Top Container: Patient Details and Vitals table are hidden with visibility: hidden on paper reuse', () => {
    assert(receiptCode.includes("width: '100%', marginBottom: '8px', boxSizing: 'border-box', visibility: isReusingPaper ? 'hidden' : 'visible'"), 'Top two-column container must use visibility: hidden when isReusingPaper');
  });

  // Test 5: Digital Letterhead is hidden when reusing paper
  runTest('Digital Letterhead: System and Photo letterheads are hidden when reusing physical paper', () => {
    assert(receiptCode.includes("visibility: isReusingPaper ? 'hidden' : 'visible'"), 'Digital letterhead must have visibility toggled by isReusingPaper');
  });

  // Test 6: Clinical sections and medicines table span full width
  runTest('Clinical Content: Diagnosis, Advice, Medicines table render full-width below top container', () => {
    assert(receiptCode.includes('FULL-WIDTH CLINICAL CONTENT & MEDICINES SECTION'), 'Missing full-width clinical content comment');
  });

  // Test 7: ConsultationPage initializes reuseReceptionPaper: true by default
  runTest('Doctor Consultation: Defaults printOptions.reuseReceptionPaper to true', () => {
    assert(consultCode.includes('reuseReceptionPaper: true'), 'ConsultationPage must default reuseReceptionPaper to true');
    assert(consultCode.includes('Reuse Reception Paper'), 'ConsultationPage must offer Reuse Reception Paper toggle in modal');
  });

  // Test 8: EditPrintRxSettings initializes reuseReceptionPaper: true by default
  runTest('EditPrintRxSettings: Defaults printOptions.reuseReceptionPaper to true and provides setting', () => {
    assert(editSettingsCode.includes('reuseReceptionPaper: true'), 'EditPrintRxSettings must default reuseReceptionPaper to true');
    assert(editSettingsCode.includes('Reuse Reception Paper'), 'EditPrintRxSettings must offer Reuse Reception Paper toggle');
  });

  // Test 9: PrescriptionPage defaults reuseReceptionPaper to true
  runTest('PrescriptionPage: Defaults printOptions.reuseReceptionPaper to true', () => {
    assert(rxPageCode.includes('reuseReceptionPaper: true'), 'PrescriptionPage must default reuseReceptionPaper to true');
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
