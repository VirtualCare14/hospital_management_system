const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
const Hospital = require('../models/Hospital');
const { updateTestPrice, listTests, listTestCategories } = require('../controllers/labController');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // 1. Verify all 35 tests exist in LabTest with categoryKey: 'digital xray'
  const globalDigitalXrayTests = await LabTest.find({
    categoryKey: 'digital xray',
    $or: [{ hospitalId: null }, { hospitalId: { $exists: false } }]
  });
  console.log(`Global Digital X-ray tests count: ${globalDigitalXrayTests.length} (Expected: 35)`);

  if (globalDigitalXrayTests.length !== 35) {
    console.error('ERROR: Expected 35 global Digital X-ray tests');
    process.exit(1);
  }

  // Check titles match
  const sampleTitles = [
    'Digital X-ray Chest PA',
    'Digital X-ray Abdomen AP',
    'Digital X-ray Whole Spine',
    'Digital X-ray Neck Soft Tissue'
  ];
  for (const title of sampleTitles) {
    const found = globalDigitalXrayTests.find(t => t.title === title);
    if (!found) {
      console.error(`ERROR: Missing test ${title}`);
      process.exit(1);
    }
  }
  console.log('Sample titles verified successfully.');

  // 2. Test Controller listTests and Tenant Price Isolation
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
    query: { category: 'DIGITAL XRAY' }
  };
  const mockResA = {
    json: (data) => { hospATestsRes = data; return mockResA; },
    status: () => mockResA
  };
  await listTests(mockReqA, mockResA);
  const testsA = Array.isArray(hospATestsRes) ? hospATestsRes : (hospATestsRes?.tests || []);
  console.log(`Hospital A returned ${testsA.length} tests for category 'DIGITAL XRAY'`);

  // Update test price for Hospital A
  const testToUpdate = 'Digital X-ray Chest PA';
  let updateRes = null;
  const mockUpdateReq = {
    user: { hospitalId: hospAId },
    hospitalId: hospAId,
    body: {
      title: testToUpdate,
      category: 'DIGITAL XRAY',
      price: 650
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

  // Verify Hospital A gets 650
  let hospATestsAfter = null;
  await listTests(mockReqA, {
    json: (data) => { hospATestsAfter = data; },
    status: () => ({ json: () => {} })
  });
  const testsAfterA = Array.isArray(hospATestsAfter) ? hospATestsAfter : (hospATestsAfter?.tests || []);
  const hospAChest = testsAfterA.find(t => t.title === testToUpdate);
  console.log(`Hospital A price for ${testToUpdate}: ₹${hospAChest?.basePrice} (Expected: 650)`);

  // Verify Hospital B still gets default 500
  let hospBTests = null;
  const mockReqB = {
    user: { hospitalId: hospBId },
    hospitalId: hospBId,
    query: { category: 'DIGITAL XRAY' }
  };
  await listTests(mockReqB, {
    json: (data) => { hospBTests = data; },
    status: () => ({ json: () => {} })
  });
  const testsB = Array.isArray(hospBTests) ? hospBTests : (hospBTests?.tests || []);
  const hospBChest = testsB.find(t => t.title === testToUpdate);
  console.log(`Hospital B price for ${testToUpdate}: ₹${hospBChest?.basePrice} (Expected: 500)`);

  if (hospAChest.basePrice === 650 && hospBChest.basePrice === 500) {
    console.log('SUCCESS: Tenant price isolation verified for Digital X-ray tests!');
  } else {
    console.error('FAIL: Tenant price isolation check failed!');
  }

  // Clean up test price override for Hospital A so tests remain pristine
  await LabTest.deleteMany({
    hospitalId: hospAId,
    categoryKey: 'digital xray',
    testKey: 'digital x-ray chest pa'
  });
  console.log('Cleaned up test override. Done.');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
