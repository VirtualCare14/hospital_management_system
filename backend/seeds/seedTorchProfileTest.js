const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const torchProfileData = {
  category: 'LAB',
  test: 'TORCH PROFILE',
  title: 'TORCH PROFILE',
  basePrice: 1500,
  taxPercentage: 0,
  totalAmount: 1500,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '24 Hours',
  department: 'BIOCHEMISTRY',
  description: 'Complete TORCH Profile panel screening for Toxoplasma, Rubella, Cytomegalovirus (CMV), and Herpes Simplex Virus (HSV 1 & 2) IgG and IgM antibodies.',
  notes: '',
  interpretation: '',
  forGender: 'Both',
  parameters: [
    {
      name: 'Toxo IgG',
      displayName: 'Toxo IgG',
      unit: 'IU/mL',
      referenceRange: '< 2 IU/mL',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Toxo IgM',
      displayName: 'Toxo IgM',
      unit: 'AU/mL',
      referenceRange: 'Neg. < 2 AU/mL\nGrey Zone 2 - 2.6 AU/mL\nPos. > 2.6 AU/mL',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Rubella IgG',
      displayName: 'Rubella IgG',
      unit: 'IU/mL',
      referenceRange: '< 2 IU/mL',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Rubella IgM',
      displayName: 'Rubella IgM',
      unit: 'AU/mL',
      referenceRange: 'Neg. < 2 AU/mL\nGrey Zone 2-3 AU/mL\nPos. > 3 AU/mL',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'CMV IgG',
      displayName: 'CMV IgG',
      unit: 'AU/mL',
      referenceRange: '< 2 AU/mL',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'CMV IgM',
      displayName: 'CMV IgM',
      unit: 'AU/mL',
      referenceRange: 'Neg. < 2.0 AU/mL\nGrey Zone 2 - 4.2 AU/mL\nPos. > 4.2 AU/mL',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'HSV-1/2 IgG',
      displayName: 'HSV-1/2 IgG',
      unit: 'AU/mL',
      referenceRange: '< 2.0 AU/mL',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'HSV-1/2 IgM',
      displayName: 'HSV-1/2 IgM',
      unit: 'AU/mL',
      referenceRange: 'Neg. < 2 AU/mL\nGrey Zone 2 - 4 AU/mL\nPos. >= 4 AU/mL',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'HSV-2 IgG',
      displayName: 'HSV-2 IgG',
      unit: 'AU/mL',
      referenceRange: '< 2.0 AU/mL',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedTorchProfile() {
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
    const testKey = normalizeKey(torchProfileData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...torchProfileData,
      categoryKey: normalizeKey(torchProfileData.category),
      testKey: testKey
    });

    console.log(`Successfully created TORCH PROFILE template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding TORCH Profile:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedTorchProfile();
}

module.exports = { torchProfileData, seedTorchProfile };
