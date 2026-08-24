const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const coagulationProfileData = {
  category: 'LAB',
  test: 'COAGULATION PROFILE',
  title: 'COAGULATION PROFILE',
  basePrice: 650,
  taxPercentage: 0,
  totalAmount: 650,
  isManualTotal: false,
  sampleType: 'Citrated Plasma / Whole Blood',
  turnaroundTime: '2 Hours',
  description: 'Coagulation Profile including Bleeding Time, Clotting Time, Prothrombin Time (PT/INR) and Activated Partial Thromboplastin Time (APTT).',
  notes: '',
  interpretation: '', // No interpretation as requested
  forGender: 'Both',
  parameters: [
    {
      name: 'Bleeding Time',
      unit: 'min',
      referenceRange: '2 - 7',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Clotting Time',
      unit: 'min',
      referenceRange: '4 - 9',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    // Group: Prothrombin time, PT/INR
    {
      name: 'PT Patient Value',
      displayName: 'Patient Value',
      group: 'Prothrombin time, PT/INR',
      unit: 'seconds',
      referenceRange: '10 - 16',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'PT Control Value',
      displayName: 'Control Value',
      group: 'Prothrombin time, PT/INR',
      unit: 'seconds',
      referenceRange: '',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'ISI (International sensitivity index)',
      displayName: 'ISI (International sensitivity index)',
      group: 'Prothrombin time, PT/INR',
      unit: '',
      referenceRange: '',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'INR Value',
      displayName: 'INR Value',
      group: 'Prothrombin time, PT/INR',
      unit: '',
      referenceRange: '',
      formula: 'Formula: INR = (Patient PT / Control PT)^ISI',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    // Group: Activated partial thromboplastin time, APTT
    {
      name: 'APTT Patient Value',
      displayName: 'Patient Value',
      group: 'Activated partial thromboplastin time, APTT',
      unit: 'seconds',
      referenceRange: '22 - 39',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'APTT Control Value',
      displayName: 'Control Value',
      group: 'Activated partial thromboplastin time, APTT',
      unit: 'seconds',
      referenceRange: '',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedCoagulationProfile() {
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
    const testKey = normalizeKey(coagulationProfileData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...coagulationProfileData,
      categoryKey: normalizeKey(coagulationProfileData.category),
      testKey: testKey
    });

    console.log(`Successfully created COAGULATION PROFILE template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding COAGULATION PROFILE:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedCoagulationProfile();
}

module.exports = { coagulationProfileData, seedCoagulationProfile };
