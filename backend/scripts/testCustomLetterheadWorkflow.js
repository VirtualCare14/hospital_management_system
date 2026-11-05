/**
 * testCustomLetterheadWorkflow.js
 * Comprehensive Verification Suite for Pre-Printed Hospital Letterhead Feature in Medora360
 */

const fs = require('fs');
const path = require('path');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    console.error(`       Error: ${err.message}`);
  }
}

console.log('======================================================================');
console.log('   PRE-PRINTED HOSPITAL LETTERHEAD & PRESCRIPTION PRINTING TEST SUITE ');
console.log('======================================================================\n');

// 1. Backend Model Verification
runTest('Backend Model: HospitalSettings schema defines custom letterhead fields & defaults', () => {
  const modelFile = path.join(__dirname, '../models/HospitalSettings.js');
  const content = fs.readFileSync(modelFile, 'utf8');

  if (!content.includes("letterheadType: {")) throw new Error('letterheadType field missing');
  if (!content.includes("enum: ['system', 'photo', 'custom']")) throw new Error('letterheadType enum missing required types');
  if (!content.includes("customLetterheadHeaderHeight:")) throw new Error('customLetterheadHeaderHeight field missing');
  if (!content.includes("default: 45")) throw new Error('customLetterheadHeaderHeight default 45mm missing');
});

// 2. Backend Controller Verification
runTest('Backend Controller: Handles persistence & letterhead settings', () => {
  const controllerFile = path.join(__dirname, '../controllers/hospitalSettingsController.js');
  const content = fs.readFileSync(controllerFile, 'utf8');

  if (!content.includes('letterheadType')) throw new Error('letterheadType handling missing in controller');
  if (!content.includes('customLetterheadHeaderHeight')) throw new Error('customLetterheadHeaderHeight handling missing in controller');
});

// 3. Frontend Admin Settings: 3 Selectable Modes
runTest('Admin HospitalSettings: 3 Letterhead options (System Generated, Photo, Pre-Printed Paper)', () => {
  const settingsFile = path.join(__dirname, '../../frontend/src/pages/admin/HospitalSettings.jsx');
  const content = fs.readFileSync(settingsFile, 'utf8');

  if (!content.includes('System Generated')) throw new Error('System Generated option missing');
  if (!content.includes('Photo Letterhead')) throw new Error('Photo Letterhead option missing');
  if (!content.includes('Pre-Printed Letterhead Paper')) throw new Error('Pre-Printed Letterhead Paper option missing');
  if (!content.includes("setValue('letterheadType', 'custom')")) throw new Error('letterheadType custom selector missing');
});

// 4. Frontend Admin Settings: Single Header Height Field for Pre-Printed Stationary
runTest('Admin HospitalSettings: Single Header Height input control (customLetterheadHeaderHeight)', () => {
  const settingsFile = path.join(__dirname, '../../frontend/src/pages/admin/HospitalSettings.jsx');
  const content = fs.readFileSync(settingsFile, 'utf8');

  if (!content.includes('customLetterheadHeaderHeight')) throw new Error('customLetterheadHeaderHeight input missing');
  if (!content.includes('Pre-Printed Header Height')) throw new Error('Pre-Printed Header Height label missing');
});

// 5. Frontend Admin Settings: Interactive Visual Preview Simulation
runTest('Admin HospitalSettings: Interactive visual preview simulation with pre-printed header zone and content', () => {
  const settingsFile = path.join(__dirname, '../../frontend/src/pages/admin/HospitalSettings.jsx');
  const content = fs.readFileSync(settingsFile, 'utf8');

  if (!content.includes('Interactive Print Area Simulation')) throw new Error('Interactive print area simulation title missing');
  if (!content.includes('Pre-printed Header')) throw new Error('Pre-printed header protected zone missing in preview');
  if (!content.includes('PRESCRIPTION')) throw new Error('Prescription heading missing in preview');
});

// 6. Frontend Admin Settings: Preview Modal Letterhead Selection
runTest('Admin HospitalSettings: Preview Modal offers Pre-Printed Letterhead Paper switch', () => {
  const settingsFile = path.join(__dirname, '../../frontend/src/pages/admin/HospitalSettings.jsx');
  const content = fs.readFileSync(settingsFile, 'utf8');

  if (!content.includes("setPreviewLetterheadMode('custom')")) throw new Error('Custom letterhead preview button missing in modal');
  if (!content.includes("📋 Pre-Printed Paper")) throw new Error('Pre-Printed Paper button label missing in modal');
});

// 7. Prescription Rendering: Offset Height Protection and Suppression of Digital Letterhead
runTest('Prescription Engine (PatientReceipt): Top margin offset & suppression of digital letterhead', () => {
  const receiptFile = path.join(__dirname, '../../frontend/src/components/PatientReceipt.jsx');
  const content = fs.readFileSync(receiptFile, 'utf8');

  if (!content.includes('custom-letterhead-content')) throw new Error('custom-letterhead-content layer missing');
  if (!content.includes('customHeaderHeight')) throw new Error('customHeaderHeight padding missing');
  if (!content.includes('!isCustomLetterhead')) throw new Error('System header/footer suppression check missing');
});

// 8. Prescription Rendering: Multi-page Support
runTest('Prescription Engine (PatientReceipt): Multi-page support & continuation', () => {
  const receiptFile = path.join(__dirname, '../../frontend/src/components/PatientReceipt.jsx');
  const content = fs.readFileSync(receiptFile, 'utf8');

  if (!content.includes('isMultiPageCustomLetterhead')) throw new Error('isMultiPageCustomLetterhead logic missing');
  if (!content.includes('PRESCRIPTION (PAGE 2)')) throw new Error('Page 2 continuation header missing');
});

console.log('\n----------------------------------------------------------------------');
console.log(`Results: ${passedTests} / ${totalTests} tests passed`);
console.log('----------------------------------------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
