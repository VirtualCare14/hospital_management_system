const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const testData = [
  {
    category: 'Blood Tests',
    tests: ['Hemoglobin (Hb)', 'RBC (Red Blood Cells)', 'WBC (White Blood Cells)', 'Platelets', 'Hematocrit']
  },
  {
    category: 'Blood Sugar Tests',
    tests: ['Fasting Blood Sugar (FBS)', 'Postprandial (PPBS)', 'Random Blood Sugar (RBS)', 'HbA1c (3-month sugar average)']
  },
  {
    category: 'Lipid Profile',
    tests: ['Total Cholesterol', 'HDL (good cholesterol)', 'LDL (bad cholesterol)', 'Triglycerides']
  },
  {
    category: 'Liver Function Test',
    tests: ['SGOT (AST)', 'SGPT (ALT)', 'Bilirubin', 'Albumin']
  },
  {
    category: 'Kidney Function Test (KFT / RFT)',
    tests: ['Creatinine', 'Urea', 'Uric Acid', 'Electrolytes (Na, K)']
  },
  {
    category: 'Infection Tests',
    tests: ['CRP (C-Reactive Protein)', 'ESR (Inflammation marker)', 'Blood culture']
  },
  {
    category: 'Thyroid Test',
    tests: ['TSH', 'T3', 'T4']
  },
  {
    category: 'Cardiac Markers (Heart tests)',
    tests: ['Troponin', 'CK-MB']
  }
];

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const seedLabTests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

    const defaultParams = [
      { name: 'Result', unit: 'N/A', referenceRange: 'As per lab standards', status: 'Active' }
    ];

    let verifiedCount = 0;

    for (const categoryData of testData) {
      await LabTestCategory.findOneAndUpdate(
        { hospitalId: null, nameKey: normalizeKey(categoryData.category) },
        {
          $setOnInsert: {
            hospitalId: null,
            name: categoryData.category,
            nameKey: normalizeKey(categoryData.category),
            status: 'Active'
          }
        },
        { upsert: true, setDefaultsOnInsert: true }
      );

      for (const testName of categoryData.tests) {
        await LabTest.findOneAndUpdate(
          { hospitalId: null, categoryKey: normalizeKey(categoryData.category), testKey: normalizeKey(testName) },
          {
            $setOnInsert: {
              hospitalId: null,
              category: categoryData.category,
              categoryKey: normalizeKey(categoryData.category),
              test: testName,
              testKey: normalizeKey(testName),
              title: testName,
              description: `${testName} test for ${categoryData.category}`,
              notes: '',
              basePrice: 150,
              taxPercentage: 0,
              totalAmount: 150,
              isManualTotal: false,
              parameters: defaultParams,
              status: 'Active'
            }
          },
          { upsert: true, setDefaultsOnInsert: true }
        );
        verifiedCount++;
      }
    }

    console.log(`Seeded/verified ${verifiedCount} lab tests.`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding lab tests:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedLabTests();
