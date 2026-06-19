/**
 * Seed the system-defined "Diagnosis" test category for every hospital.
 *
 * The Diagnosis category is always available in Lab Settings. It is created
 * lazily for any hospital that requests it (e.g. via /lab/test-categories),
 * but this script can be run once to make sure every existing hospital
 * already has the Diagnosis category + the 14 predefined test names.
 *
 * Usage:  node backend/seeds/seedDiagnosisCategory.js
 */

const mongoose = require('mongoose');
const path = require('path');
const Hospital = require('../models/Hospital');
const LabTestCategory = require('../models/LabTestCategory');
const LabTest = require('../models/LabTest');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DIAGNOSIS_CATEGORY_NAME = 'Diagnosis';
const DIAGNOSIS_SYSTEM_KEY = 'diagnosis';
const DIAGNOSIS_TESTS = [
  'Endoscopy',
  'Ultrasound',
  'CT Scan',
  'MRI Scan',
  'ECG',
  'Echo',
  'X-Ray',
  'Colonoscopy',
  'Mammography',
  'Doppler Study',
  'TMT (Stress Test)',
  'EEG',
  'EMG',
  'PET Scan'
];

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const ensureSystemCategoryForHospital = async (hospitalId) => {
  // IMPORTANT:
  // The LabTestCategory collection enforces uniqueness on (hospitalId, nameKey).
  // Some hospitals may already have a manually-created "Diagnosis" category
  // (isSystem=false). If we filter only by isSystem/systemKey, an upsert would
  // attempt to insert a duplicate and throw E11000. So we always match by
  // (hospitalId, nameKey) and then mark it as system.
  const resolvedHospitalId = hospitalId || null;
  const filter = { hospitalId: resolvedHospitalId, nameKey: normalizeKey(DIAGNOSIS_CATEGORY_NAME) };

  const update = {
    $set: {
      name: DIAGNOSIS_CATEGORY_NAME,
      status: 'Active',
      isSystem: true,
      systemKey: DIAGNOSIS_SYSTEM_KEY
    },
    $setOnInsert: {
      hospitalId: resolvedHospitalId,
      nameKey: normalizeKey(DIAGNOSIS_CATEGORY_NAME)
    }
  };

  return LabTestCategory.findOneAndUpdate(filter, update, {
    upsert: true,
    returnDocument: 'after',
    setDefaultsOnInsert: true
  });
};

const ensureDiagnosisTestForHospital = async (hospitalId, testName) => {
  const filter = {
    categoryKey: normalizeKey(DIAGNOSIS_CATEGORY_NAME),
    testKey: normalizeKey(testName)
  };
  if (hospitalId) {
    filter.hospitalId = hospitalId;
  } else {
    filter.hospitalId = null;
  }

  const update = {
    $setOnInsert: {
      hospitalId: hospitalId || null,
      category: DIAGNOSIS_CATEGORY_NAME,
      categoryKey: normalizeKey(DIAGNOSIS_CATEGORY_NAME),
      test: testName,
      testKey: normalizeKey(testName),
      title: testName,
      description: `${testName} – diagnostic imaging / study.`,
      notes: '',
      basePrice: 0,
      taxPercentage: 0,
      totalAmount: 0,
      isManualTotal: false,
      parameters: [],
      status: 'Active'
    }
  };

  return LabTest.findOneAndUpdate(filter, update, {
    upsert: true,
    returnDocument: 'after',
    setDefaultsOnInsert: true
  });
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

    // 1. Always make the system "Diagnosis" category available with no hospital
    //    (acts as a global default and a fallback for super admin / blank hospital).
    await ensureSystemCategoryForHospital(null);

    // 2. Add a hospital-specific instance of the Diagnosis category for every
    //    active hospital so admins can configure their own price / signatory.
    const hospitals = await Hospital.find({ isActive: true }).select('_id');
    for (const hospital of hospitals) {
      await ensureSystemCategoryForHospital(hospital._id);
      for (const testName of DIAGNOSIS_TESTS) {
        await ensureDiagnosisTestForHospital(hospital._id, testName);
      }
    }

    // 3. Also seed the default test names for the global (null hospital) category
    //    so newly created hospitals can be cloned/copied if needed.
    for (const testName of DIAGNOSIS_TESTS) {
      await ensureDiagnosisTestForHospital(null, testName);
    }

    console.log(
      `Seeded/verified Diagnosis category + ${DIAGNOSIS_TESTS.length} tests for ${
        hospitals.length
      } hospital(s) + global.`
    );
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding Diagnosis category:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

if (require.main === module) {
  seed();
}

module.exports = {
  DIAGNOSIS_CATEGORY_NAME,
  DIAGNOSIS_SYSTEM_KEY,
  DIAGNOSIS_TESTS,
  ensureSystemCategoryForHospital,
  ensureDiagnosisTestForHospital
};
