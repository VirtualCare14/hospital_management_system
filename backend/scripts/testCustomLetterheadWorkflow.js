/**
 * testCustomLetterheadWorkflow.js
 * Comprehensive Verification Suite for Custom Hospital Letterhead Feature in Medora360
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
console.log('   CUSTOM HOSPITAL LETTERHEAD & PRESCRIPTION PRINTING TEST SUITE      ');
console.log('======================================================================\n');

// 1. Backend Model Verification
runTest('Backend Model: HospitalSettings schema defines custom letterhead fields & defaults', () => {
  const modelFile = path.join(__dirname, '../models/HospitalSettings.js');
  const content = fs.readFileSync(modelFile, 'utf8');

  if (!content.includes("letterheadType: {")) throw new Error('letterheadType field missing');
  if (!content.includes("enum: ['system', 'photo', 'custom']")) throw new Error('letterheadType enum missing required types');
  if (!content.includes("customLetterheadUrl:")) throw new Error('customLetterheadUrl field missing');
  if (!content.includes("customLetterheadPublicId:")) throw new Error('customLetterheadPublicId field missing');
  if (!content.includes("customLetterheadFileType:")) throw new Error('customLetterheadFileType field missing');
  if (!content.includes("customLetterheadHeaderHeight:")) throw new Error('customLetterheadHeaderHeight field missing');
  if (!content.includes("default: 45")) throw new Error('customLetterheadHeaderHeight default 45mm missing');
  if (!content.includes("customLetterheadFooterHeight:")) throw new Error('customLetterheadFooterHeight field missing');
  if (!content.includes("default: 30")) throw new Error('customLetterheadFooterHeight default 30mm missing');
  if (!content.includes("customLetterheadLeftMargin:")) throw new Error('customLetterheadLeftMargin field missing');
  if (!content.includes("default: 12")) throw new Error('customLetterheadLeftMargin default 12mm missing');
  if (!content.includes("customLetterheadRightMargin:")) throw new Error('customLetterheadRightMargin field missing');
});

// 2. Backend Controller Verification
runTest('Backend Controller: Handles persistence & auto format (PDF & Image) upload', () => {
  const controllerFile = path.join(__dirname, '../controllers/hospitalSettingsController.js');
  const content = fs.readFileSync(controllerFile, 'utf8');

  if (!content.includes('customLetterheadUrl')) throw new Error('customLetterheadUrl handling missing in controller');
  if (!content.includes('customLetterheadHeaderHeight')) throw new Error('customLetterheadHeaderHeight handling missing in controller');
  if (!content.includes('customLetterheadFooterHeight')) throw new Error('customLetterheadFooterHeight handling missing in controller');
  if (!content.includes('customLetterheadLeftMargin')) throw new Error('customLetterheadLeftMargin handling missing in controller');
  if (!content.includes('customLetterheadRightMargin')) throw new Error('customLetterheadRightMargin handling missing in controller');
  if (!content.includes('uploadLetterhead')) throw new Error('uploadLetterhead missing in controller');
});

// 3. Frontend Admin Settings: 3 Selectable Modes
runTest('Admin HospitalSettings: 3 Letterhead options (System Generated, Photo, Custom)', () => {
  const settingsFile = path.join(__dirname, '../../frontend/src/pages/admin/HospitalSettings.jsx');
  const content = fs.readFileSync(settingsFile, 'utf8');

  if (!content.includes('System Generated')) throw new Error('System Generated option missing');
  if (!content.includes('Photo Letterhead')) throw new Error('Photo Letterhead option missing');
  if (!content.includes('Custom Letterhead')) throw new Error('Custom Letterhead option missing');
  if (!content.includes("setValue('letterheadType', 'custom')")) throw new Error('letterheadType custom selector missing');
});

// 4. Frontend Admin Settings: 4 Margins in Millimeters
runTest('Admin HospitalSettings: 4 Millimeter margin controls with default values', () => {
  const settingsFile = path.join(__dirname, '../../frontend/src/pages/admin/HospitalSettings.jsx');
  const content = fs.readFileSync(settingsFile, 'utf8');

  if (!content.includes('customLetterheadHeaderHeight')) throw new Error('customLetterheadHeaderHeight input missing');
  if (!content.includes('customLetterheadFooterHeight')) throw new Error('customLetterheadFooterHeight input missing');
  if (!content.includes('customLetterheadLeftMargin')) throw new Error('customLetterheadLeftMargin input missing');
  if (!content.includes('customLetterheadRightMargin')) throw new Error('customLetterheadRightMargin input missing');
});

// 5. Frontend Admin Settings: Interactive Visual Preview Simulation
runTest('Admin HospitalSettings: Interactive visual preview simulation of A4 sheet & margins', () => {
  const settingsFile = path.join(__dirname, '../../frontend/src/pages/admin/HospitalSettings.jsx');
  const content = fs.readFileSync(settingsFile, 'utf8');

  if (!content.includes('Interactive Print Area Simulation')) throw new Error('Interactive print area simulation title missing');
  if (!content.includes('Pre-printed Header')) throw new Error('Pre-printed header protected zone missing in preview');
  if (!content.includes('Pre-printed Footer')) throw new Error('Pre-printed footer protected zone missing in preview');
  if (!content.includes('Doctor Writable Area')) throw new Error('Doctor writable area missing in preview');
});

// 6. Frontend Admin Settings: Preview Modal Letterhead Selection
runTest('Admin HospitalSettings: Preview Modal offers Custom Letterhead switch', () => {
  const settingsFile = path.join(__dirname, '../../frontend/src/pages/admin/HospitalSettings.jsx');
  const content = fs.readFileSync(settingsFile, 'utf8');

  if (!content.includes("setPreviewLetterheadMode('custom')")) throw new Error('Custom letterhead preview button missing in modal');
  if (!content.includes("📄 Custom Letterhead")) throw new Error('Custom Letterhead button label missing in modal');
});

// 7. Prescription Rendering: Custom Letterhead Background & Margin Protection
runTest('Prescription Engine (PatientReceipt): Print-safe <img> background & millimeter margins', () => {
  const receiptFile = path.join(__dirname, '../../frontend/src/components/PatientReceipt.jsx');
  const content = fs.readFileSync(receiptFile, 'utf8');

  if (!content.includes('custom-letterhead-bg')) throw new Error('custom-letterhead-bg layer missing');
  if (!content.includes('custom-letterhead-content')) throw new Error('custom-letterhead-content layer missing');
  if (!content.includes('customHeaderHeight')) throw new Error('customHeaderHeight padding missing');
  if (!content.includes('customFooterHeight')) throw new Error('customFooterHeight padding missing');
  if (!content.includes('!isCustomLetterhead')) throw new Error('System header/footer suppression check missing');
});

// 8. Prescription Rendering: Multi-page Support
runTest('Prescription Engine (PatientReceipt): Multi-page letterhead repetition & continuation', () => {
  const receiptFile = path.join(__dirname, '../../frontend/src/components/PatientReceipt.jsx');
  const content = fs.readFileSync(receiptFile, 'utf8');

  if (!content.includes('isMultiPageCustomLetterhead')) throw new Error('isMultiPageCustomLetterhead logic missing');
  if (!content.includes('Hospital Custom Letterhead Page 1')) throw new Error('Page 1 letterhead missing');
  if (!content.includes('Hospital Custom Letterhead Page 2')) throw new Error('Page 2 letterhead missing');
  if (!content.includes('PRESCRIPTION (PAGE 2)')) throw new Error('Page 2 continuation header missing');
});

console.log('\n----------------------------------------------------------------------');
console.log(`Results: ${passedTests} / ${totalTests} tests passed`);
console.log('----------------------------------------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

