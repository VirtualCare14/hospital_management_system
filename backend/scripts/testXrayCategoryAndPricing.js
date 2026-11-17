const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
const Hospital = require('../models/Hospital');
const { XRAY_TESTS } = require('../seeds/seedXrayTests');
const labController = require('../controllers/labController');

async function runTests() {
  console.log('======================================================================');
  console.log('       X-RAY CATEGORY TESTS & TENANT-EDITABLE PRICING VERIFICATION    ');
  console.log('======================================================================\n');

  await mongoose.connect(process.env.MONGO_URI);

  // Test 1: Verify all 39 X-ray tests are in the database
  console.log('[TEST 1] Verifying all 39 X-ray tests in DB under category XRAY...');
  const tests = await LabTest.find({
    categoryKey: 'xray',
    $or: [{ hospitalId: null }, { hospitalId: { $exists: false } }]
  }).lean();

  if (tests.length !== 39) {
    throw new Error(`Expected 39 global X-ray tests, found ${tests.length}`);
  }

  for (const expected of XRAY_TESTS) {
    const match = tests.find(t => t.title.toLowerCase() === expected.title.toLowerCase());
    if (!match) {
      throw new Error(`Missing expected X-ray test: "${expected.title}"`);
    }
    if (!match.basePrice || match.basePrice <= 0) {
      throw new Error(`Test "${match.title}" has invalid price: ${match.basePrice}`);
    }
    if (!Array.isArray(match.parameters) || match.parameters.length < 2) {
      throw new Error(`Test "${match.title}" missing Findings and Impression parameters`);
    }
  }
  console.log(`[PASS] Test 1: All 39 X-ray tests present with valid random prices and parameters.\n`);

  // Test 2: Verify LabTestCategory records (no duplicate X-Ray, only XRAY)
  console.log('[TEST 2] Verifying LabTestCategory has single XRAY category without duplicate X-Ray...');
  const duplicateCats = await LabTestCategory.find({ nameKey: 'x-ray' }).lean();
  if (duplicateCats.length > 0) {
    throw new Error(`Expected 0 duplicate 'x-ray' category records, found ${duplicateCats.length}`);
  }

  const xrayCats = await LabTestCategory.find({ nameKey: 'xray' }).lean();
  if (xrayCats.length === 0) {
    throw new Error('No XRAY category found in LabTestCategory');
  }

  // Also call listTestCategories to ensure API returns only 1 unified XRAY category
  let categoriesOutput = null;
  await labController.listTestCategories({
    user: { hospitalId: null },
    query: {}
  }, {
    json: (data) => { categoriesOutput = data; },
    status: () => ({ json: () => {} })
  });

  const matchingXrayEntries = categoriesOutput.filter(
    c => c.name.toUpperCase() === 'XRAY' || c.name.toUpperCase() === 'X-RAY'
  );
  if (matchingXrayEntries.length !== 1) {
    throw new Error(`Expected exactly 1 XRAY category entry from listTestCategories, found ${matchingXrayEntries.length}`);
  }
  console.log(`[PASS] Test 2: Verified single unified XRAY category (duplicate X-Ray eliminated).\n`);

  // Test 3: Verify listTests returns X-ray tests for a hospital
  console.log('[TEST 3] Calling labController.listTests with category query...');
  const activeHospital = await Hospital.findOne({ isActive: true }).lean();
  let listOutput = null;
  const mockReqList = {
    user: {
      _id: new mongoose.Types.ObjectId(),
      hospitalId: activeHospital ? activeHospital._id : null,
      role: 'admin'
    },
    query: {
      category: 'XRAY'
    }
  };
  const mockResList = {
    json: (data) => { listOutput = data; },
    status: () => mockResList
  };
  await labController.listTests(mockReqList, mockResList);
  if (!Array.isArray(listOutput) || listOutput.length < 39) {
    throw new Error(`Expected at least 39 tests returned by listTests, got ${listOutput?.length}`);
  }
  console.log(`[PASS] Test 3: listTests successfully returned ${listOutput.length} X-ray tests.\n`);

  // Test 4: Verify hospital tenant pricing copy-on-write
  console.log('[TEST 4] Verifying tenant price edit isolation (copy-on-write)...');
  const dummyHospitalIdA = new mongoose.Types.ObjectId();
  const dummyHospitalIdB = new mongoose.Types.ObjectId();

  const targetTestTitle = 'Chest X-ray (PA)';
  const globalTest = tests.find(t => t.title === targetTestTitle);
  const originalGlobalPrice = globalTest.basePrice;
  const newPriceForHospitalA = originalGlobalPrice + 250;

  // Hospital A updates price
  let updateResponseA = null;
  const mockReqUpdateA = {
    user: {
      _id: new mongoose.Types.ObjectId(),
      hospitalId: dummyHospitalIdA,
      role: 'admin'
    },
    body: {
      testName: targetTestTitle,
      title: targetTestTitle,
      category: 'XRAY',
      price: newPriceForHospitalA,
      testId: globalTest._id
    }
  };
  const mockResUpdateA = {
    json: (data) => { updateResponseA = data; },
    status: () => mockResUpdateA
  };
  await labController.updateTestPrice(mockReqUpdateA, mockResUpdateA);

  if (!updateResponseA?.test || updateResponseA.test.basePrice !== newPriceForHospitalA) {
    throw new Error(`Hospital A update failed: expected ${newPriceForHospitalA}, got ${updateResponseA?.test?.basePrice}`);
  }
  console.log(`- Hospital A successfully updated ${targetTestTitle} price to ₹${newPriceForHospitalA}`);

  // Now verify Hospital A sees new price
  let listForA = null;
  await labController.listTests({
    user: { hospitalId: dummyHospitalIdA },
    query: { category: 'XRAY' }
  }, { json: (d) => { listForA = d; } });
  const itemForA = listForA.find(t => t.title === targetTestTitle);
  if (itemForA.basePrice !== newPriceForHospitalA) {
    throw new Error(`Hospital A did not see updated price: got ${itemForA.basePrice}`);
  }

  // Verify Hospital B still sees original global price
  let listForB = null;
  await labController.listTests({
    user: { hospitalId: dummyHospitalIdB },
    query: { category: 'XRAY' }
  }, { json: (d) => { listForB = d; } });
  const itemForB = listForB.find(t => t.title === targetTestTitle);
  if (itemForB.basePrice !== originalGlobalPrice) {
    throw new Error(`Hospital B price was contaminated: expected ${originalGlobalPrice}, got ${itemForB.basePrice}`);
  }
  console.log(`- Hospital B still sees default price of ₹${originalGlobalPrice} (isolated!)`);

  // Clean up test tenant document created for dummyHospitalIdA
  await LabTest.deleteMany({ hospitalId: dummyHospitalIdA });
  console.log(`[PASS] Test 4: Tenant isolation verified. Each hospital can edit prices independently!\n`);

  console.log('----------------------------------------------------------------------');
  console.log('Results: All 4 verification tests passed successfully!');
  console.log('----------------------------------------------------------------------\n');

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

