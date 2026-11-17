const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const LabTest = require('../models/LabTest');
const Hospital = require('../models/Hospital');
const { updateTestPrice, listTests } = require('../controllers/labController');
const { USG_TESTS } = require('../seeds/seedUsgTests');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // 1. Verify all 50 tests exist in LabTest with categoryKey: 'usg'
  const globalUsgTests = await LabTest.find({
    categoryKey: 'usg',
    $or: [{ hospitalId: null }, { hospitalId: { $exists: false } }]
  });
  console.log(`Global USG tests count: ${globalUsgTests.length} (Expected: 50)`);

  if (globalUsgTests.length !== 50) {
    console.error('ERROR: Expected 50 global USG tests');
    process.exit(1);
  }

  // 2. Verify all 50 titles from user request exist
  for (const item of USG_TESTS) {
    const found = globalUsgTests.find(t => t.title === item.title);
    if (!found) {
      console.error(`ERROR: Missing test ${item.title}`);
      process.exit(1);
    }
  }
  console.log('All 50 USG test titles verified successfully.');

  // 3. Test Controller listTests and Tenant Price Isolation
  const hospitals = await Hospital.find({}).limit(2);
  if (hospitals.length < 2) {
    console.log('Not enough hospitals to test isolation, skipping multi-tenant test');
    process.exit(0);
  }

  const hospAId = hospitals[0]._id.toString();
  const hospBId = hospitals[1]._id.toString();

  // Test listTests for Hospital A with category filter
  let hospATestsRes = null;
  const mockReqA = {
    user: { hospitalId: hospAId },
    hospitalId: hospAId,
    query: { category: 'USG' }
  };
  const mockResA = {
    json: (data) => { hospATestsRes = data; return mockResA; },
    status: () => mockResA
  };
  await listTests(mockReqA, mockResA);
  const testsA = Array.isArray(hospATestsRes) ? hospATestsRes : (hospATestsRes?.tests || []);
  console.log(`Hospital A returned ${testsA.length} tests for category 'USG' (Expected: 50)`);

  // Update test price for Hospital A
  const testToUpdate = 'USG Whole Abdomen';
  let updateRes = null;
  const mockUpdateReq = {
    user: { hospitalId: hospAId },
    hospitalId: hospAId,
    body: {
      title: testToUpdate,
      category: 'USG',
      price: 1400
    }
  };
  const mockUpdateRes = {
    json: (data) => { updateRes = data; return mockUpdateRes; },
    status: (code) => {
      return {
        json: (data) => { updateRes = { status: code, ...data }; }
      };
    }
  };
  await updateTestPrice(mockUpdateReq, mockUpdateRes);
  console.log('Updated price response:', updateRes ? (updateRes.test?.title || updateRes.message) : 'error', updateRes?.test?.basePrice);

  // Verify Hospital A gets 1400
  let hospATestsAfter = null;
  await listTests(mockReqA, {
    json: (data) => { hospATestsAfter = data; },
    status: () => ({ json: () => {} })
  });
  const testsAfterA = Array.isArray(hospATestsAfter) ? hospATestsAfter : (hospATestsAfter?.tests || []);
  const hospAWholeAbd = testsAfterA.find(t => t.title === testToUpdate);
  console.log(`Hospital A price for ${testToUpdate}: ₹${hospAWholeAbd?.basePrice} (Expected: 1400)`);

  // Verify Hospital B still gets default 1000
  let hospBTests = null;
  const mockReqB = {
    user: { hospitalId: hospBId },
    hospitalId: hospBId,
    query: { category: 'USG' }
  };
  await listTests(mockReqB, {
    json: (data) => { hospBTests = data; },
    status: () => ({ json: () => {} })
  });
  const testsB = Array.isArray(hospBTests) ? hospBTests : (hospBTests?.tests || []);
  const hospBWholeAbd = testsB.find(t => t.title === testToUpdate);
  console.log(`Hospital B price for ${testToUpdate}: ₹${hospBWholeAbd?.basePrice} (Expected: 1000)`);

  if (hospAWholeAbd.basePrice === 1400 && hospBWholeAbd.basePrice === 1000) {
    console.log('SUCCESS: Tenant price isolation verified for USG tests!');
  } else {
    console.error('FAIL: Tenant price isolation check failed!');
    process.exit(1);
  }

  // Clean up test price override for Hospital A so tests remain pristine
  await LabTest.deleteMany({
    hospitalId: hospAId,
    categoryKey: 'usg',
    testKey: 'usg whole abdomen'
  });
  console.log('Cleaned up test override. Done.');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

