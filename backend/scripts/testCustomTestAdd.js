const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const LabTest = require('../models/LabTest');
const Hospital = require('../models/Hospital');
const { updateTestPrice, listTests } = require('../controllers/labController');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const hospital = await Hospital.findOne({});
  if (!hospital) {
    console.error('No hospital found');
    process.exit(1);
  }

  const hospId = hospital._id.toString();
  const testTitle = 'Automated Verification Custom Test ' + Date.now();
  const category = 'USG';
  const price = 1350;

  console.log(`Adding custom test: "${testTitle}" in category "${category}" at rate ₹${price}`);

  // 1. Call updateTestPrice
  let updateResult = null;
  const mockReq = {
    user: { hospitalId: hospId },
    hospitalId: hospId,
    body: {
      title: testTitle,
      testName: testTitle,
      category: category,
      price: price
    }
  };
  const mockRes = {
    json: (data) => { updateResult = data; return mockRes; },
    status: (code) => {
      return {
        json: (data) => { updateResult = { status: code, ...data }; }
      };
    }
  };

  await updateTestPrice(mockReq, mockRes);
  console.log('Response message:', updateResult?.message);
  console.log('Saved test:', updateResult?.test?.title, 'Price:', updateResult?.test?.basePrice, 'Category:', updateResult?.test?.category);

  if (!updateResult?.test || updateResult.test.basePrice !== price || updateResult.test.category !== category) {
    console.error('FAIL: Custom test was not saved properly in DB');
    process.exit(1);
  }

  // 2. Verify via listTests
  let listResult = null;
  const mockListReq = {
    user: { hospitalId: hospId },
    hospitalId: hospId,
    query: { category: category }
  };
  await listTests(mockListReq, {
    json: (data) => { listResult = data; },
    status: () => ({ json: () => {} })
  });

  const tests = Array.isArray(listResult) ? listResult : (listResult?.tests || []);
  const found = tests.find(t => t.title === testTitle);
  if (!found) {
    console.error(`FAIL: Custom test "${testTitle}" not found in listTests for category "${category}"`);
    process.exit(1);
  }
  console.log(`PASS: Found custom test in listTests: "${found.title}" at ₹${found.basePrice}`);

  // 3. Clean up the automated test document
  await LabTest.deleteMany({
    hospitalId: hospId,
    title: testTitle
  });
  console.log('Cleaned up verification test document.');

  await mongoose.disconnect();
  console.log('Verification successful!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

