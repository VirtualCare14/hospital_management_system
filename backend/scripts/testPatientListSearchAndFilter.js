const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('======================================================================');
  console.log('  PATIENT LIST UNIFIED SEARCH & PAYMENT MODE FILTER VERIFICATION       ');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${message}`);
    }
  }

  // 1. Verify frontend/src/pages/reception/PatientList.jsx
  const patientListPath = path.join(__dirname, '../../frontend/src/pages/reception/PatientList.jsx');
  const patientListContent = fs.readFileSync(patientListPath, 'utf8');

  // Check PAYMENT_MODES options
  assert(
    patientListContent.includes("const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Net Banking', 'Split'];"),
    'Frontend PatientList: PAYMENT_MODES contains ONLY Cash, UPI, Card, Net Banking, Split'
  );

  // Check removal of old individual fields
  assert(
    !patientListContent.includes('placeholder="Search UHID"') &&
    !patientListContent.includes('placeholder="Search Reg#"') &&
    !patientListContent.includes('placeholder="Search name"'),
    'Frontend PatientList: Removed separate UHID, Reg#, and Patient Name input fields'
  );

  // Check removal of top Filters text header
  assert(
    !patientListContent.includes('<Filter className="h-4 w-4" /> Filters'),
    'Frontend PatientList: Removed top Filters toggle button and header for more vertical space'
  );

  // Check unified search bar
  assert(
    patientListContent.includes('Search Patient (UHID / Reg# / Name)') &&
    patientListContent.includes('placeholder="Search UHID, Reg#, Patient Name..."') &&
    patientListContent.includes('value={searchTerm}'),
    'Frontend PatientList: Unified search bar searches across UHID, Reg#, and Patient Name'
  );

  // Check params.search sent in fetchRegistrations
  assert(
    patientListContent.includes('if (searchTerm) params.search = searchTerm.trim();'),
    'Frontend PatientList: Passes search param to /patients/registrations/list'
  );

  // Check removal of Payment Due column
  assert(
    !patientListContent.includes('<th className="p-3">Payment Due</th>') &&
    !patientListContent.includes('reg.dueAmount > 0 ? ('),
    'Frontend PatientList: Completely removed Payment Due column from table headers and rows'
  );

  // Check fromDate defaults to today's date
  assert(
    patientListContent.includes("const [fromDate, setFromDate] = useState(() => getTodayStr());") &&
    patientListContent.includes("getTodayStr = () =>"),
    'Frontend PatientList: From Date defaults to today\'s date'
  );

  // 2. Verify backend/controllers/patientController.js
  const controllerPath = path.join(__dirname, '../controllers/patientController.js');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');

  assert(
    controllerContent.includes('const searchConditions = [') &&
    controllerContent.includes('{ registrationNumber: { $regex: escapedTerm, $options: \'i\' } }') &&
    controllerContent.includes('{ uhid: { $regex: escapedTerm, $options: \'i\' } }'),
    'Backend patientController: Unified search queries registrationNumber, uhid, and matched patientIds'
  );

  assert(
    controllerContent.includes('/^split/i.test(mode)') &&
    controllerContent.includes("['Split', 'Split Payment', 'Cash + UPI', 'Mixed Payment'"),
    'Backend patientController: Split payment filter matches Split, Split Payment, Cash + UPI, and Mixed Payment'
  );

  assert(
    controllerContent.includes('statsBaseQuery.paymentMode = query.paymentMode') &&
    controllerContent.includes('if (query.$or) statsBaseQuery.$or = query.$or;') &&
    controllerContent.includes('if (query.$and) statsBaseQuery.$and = query.$and;'),
    'Backend patientController: Statistics queries stay in sync with search and payment mode filters'
  );

  console.log('\n----------------------------------------------------------------------');
  console.log(`Results: ${passed} / ${total} tests passed`);
  console.log('----------------------------------------------------------------------');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();

