const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const proteinFractionData = {
  category: 'LAB',
  test: 'PROTEIN FRACTION',
  title: 'PROTEIN FRACTION',
  basePrice: 300,
  taxPercentage: 0,
  totalAmount: 300,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '2 Hours',
  department: 'BIOCHEMISTRY',
  description: 'Serum Protein Fraction evaluation assessing Total Protein, Albumin, Globulin, and A/G Ratio.',
  notes: '',
  interpretation: '',
  forGender: 'Both',
  parameters: [
    {
      name: 'Serum Protein',
      displayName: 'Serum Protein',
      unit: 'g/dl',
      referenceRange: '6.4 - 8.3',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum Albumin',
      displayName: 'Serum Albumin',
      unit: 'g/dl',
      referenceRange: '3.5 - 5.2',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Globulin',
      displayName: 'Globulin',
      unit: 'g/dl',
      referenceRange: '1.8 - 3.6',
      formula: 'Formula: Globulin = Serum Protein - Serum Albumin',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'A/G Ratio',
      displayName: 'A/G Ratio',
      unit: '',
      referenceRange: '1.1 - 2.1',
      formula: 'Formula: A/G Ratio = Serum Albumin / Globulin',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedProteinFraction() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to database successfully.');

    // Ensure category exists
    await LabTestCategory.findOneAndUpdate(
      { name: 'LAB' },
      { name: 'LAB', status: 'Active' },
      { upsert: true, returnDocument: 'after' }
    );

    // Remove any previous duplicate test entries for this test key
    const testKey = normalizeKey(proteinFractionData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...proteinFractionData,
      categoryKey: normalizeKey(proteinFractionData.category),
      testKey: testKey
    });

    console.log(`Successfully created PROTEIN FRACTION template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding Protein Fraction test:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedProteinFraction();
}

module.exports = { proteinFractionData, seedProteinFraction };
