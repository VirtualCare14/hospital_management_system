const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const arthritisProfileData = {
  category: 'LAB',
  test: 'ARTHRITIS PROFILE',
  title: 'ARTHRITIS PROFILE',
  basePrice: 800,
  taxPercentage: 0,
  totalAmount: 800,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '4 Hours',
  department: 'BIOCHEMISTRY',
  description: 'Arthritis Profile panel for assessing inflammatory, autoimmune, and metabolic joint conditions including RA, CRP, ASO, Uric Acid, and Calcium metabolism.',
  notes: '',
  interpretation: '',
  forGender: 'Both',
  parameters: [
    {
      name: 'Serum Uric Acid',
      displayName: 'Serum Uric Acid',
      unit: 'mg/dl',
      referenceRange: '3.5 - 7.2',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Rheumatoid Factor, RA (Quantitative)',
      displayName: 'Rheumatoid Factor, RA (Quantitative)',
      unit: 'IU/mL',
      referenceRange: '0 - 20',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'C-Reactive Protein, CRP (Quantitative)',
      displayName: 'C-Reactive Protein, CRP (Quantitative)',
      unit: 'mg/L',
      referenceRange: '< 6 mg/L',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Antistreptolysin O, ASO Titer',
      displayName: 'Antistreptolysin O, ASO Titer',
      unit: 'IU/mL',
      referenceRange: '< 200',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'ICalcium',
      displayName: 'ICalcium',
      unit: 'mmol/l',
      referenceRange: '1.13 - 1.33',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Total Calcium',
      displayName: 'Total Calcium',
      unit: 'mg/dl',
      referenceRange: '9 - 10.5',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum Phosphorus',
      displayName: 'Serum Phosphorus',
      unit: 'mg/dl',
      referenceRange: '2.5 - 4.5',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedArthritisProfile() {
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
    const testKey = normalizeKey(arthritisProfileData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...arthritisProfileData,
      categoryKey: normalizeKey(arthritisProfileData.category),
      testKey: testKey
    });

    console.log(`Successfully created ARTHRITIS PROFILE template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding Arthritis Profile:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedArthritisProfile();
}

module.exports = { arthritisProfileData, seedArthritisProfile };
