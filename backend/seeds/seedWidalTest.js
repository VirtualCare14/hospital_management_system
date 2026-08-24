const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const widalInterpretation = `Antibody titre of 1:80 or higher suggests infection. A marked rise in the titre to one serotype to (above 1:80) or paired sample collected at 5 to 7 days interval is regarded as diagnostically significant. However persons who have received TAB vaccine may show high titre of antibodies to each of the salmonellae.`;

const widalData = {
  category: 'LAB',
  test: 'Widal (Slide Method)',
  title: 'Widal (Slide Method)',
  basePrice: 250,
  taxPercentage: 0,
  totalAmount: 250,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '2 Hours',
  department: 'SEROLOGY & IMMUNOLOGY',
  description: 'Tube agglutination test for Salmonella group of organisms reveal following titers.',
  notes: 'Tube agglutination test for Salmonella group of organisms reveal following titers.',
  interpretation: widalInterpretation,
  forGender: 'Both',
  parameters: [
    {
      name: 'S TYPHI "O"',
      displayName: 'S TYPHI "O"',
      unit: '',
      referenceRange: '',
      fieldType: 'Text',
      gender: 'Both',
      valueOptions: [
        { value: '1:80 (+)', isAbnormal: true },
        { value: '1:160 (+)', isAbnormal: true },
        { value: '1:320 (+)', isAbnormal: true },
        { value: '1:40 (+)', isAbnormal: false },
        { value: '1:20 (+)', isAbnormal: false },
        { value: 'Non-Reactive', isAbnormal: false }
      ],
      status: 'Active'
    },
    {
      name: 'S TYPHI "H"',
      displayName: 'S TYPHI "H"',
      unit: '',
      referenceRange: '',
      fieldType: 'Text',
      gender: 'Both',
      valueOptions: [
        { value: '1:80 (+)', isAbnormal: false },
        { value: '1:160 (+)', isAbnormal: true },
        { value: '1:320 (+)', isAbnormal: true },
        { value: '1:40 (+)', isAbnormal: false },
        { value: '1:20 (+)', isAbnormal: false },
        { value: 'Non-Reactive', isAbnormal: false }
      ],
      status: 'Active'
    },
    {
      name: 'S PARATYPHI "AH"',
      displayName: 'S PARATYPHI "AH"',
      unit: '',
      referenceRange: '',
      fieldType: 'Text',
      gender: 'Both',
      valueOptions: [
        { value: '1:80 (+)', isAbnormal: true },
        { value: '1:160 (+)', isAbnormal: true },
        { value: '1:320 (+)', isAbnormal: true },
        { value: '1:40 (+)', isAbnormal: false },
        { value: '1:20 (+)', isAbnormal: false },
        { value: 'Non-Reactive', isAbnormal: false }
      ],
      status: 'Active'
    },
    {
      name: 'S PARATYPHI "BH"',
      displayName: 'S PARATYPHI "BH"',
      unit: '',
      referenceRange: '',
      fieldType: 'Text',
      gender: 'Both',
      valueOptions: [
        { value: '1:80 (+)', isAbnormal: true },
        { value: '1:160 (+)', isAbnormal: true },
        { value: '1:320 (+)', isAbnormal: true },
        { value: '1:40 (+)', isAbnormal: false },
        { value: '1:20 (+)', isAbnormal: false },
        { value: 'Non-Reactive', isAbnormal: false }
      ],
      status: 'Active'
    },
    {
      name: 'Result',
      displayName: 'Comment',
      unit: '',
      referenceRange: '',
      fieldType: 'Text',
      gender: 'Both',
      valueOptions: [
        { value: 'WIDAL TEST POSITIVE', isAbnormal: true },
        { value: 'WIDAL TEST NEGATIVE', isAbnormal: false },
        { value: 'WIDAL TEST <POSITIVE/NEGATIVE>', isAbnormal: false }
      ],
      status: 'Active'
    }
  ]
};

async function seedWidalTest() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to database successfully.');

    // Ensure LAB category exists
    await LabTestCategory.findOneAndUpdate(
      { name: 'LAB' },
      { name: 'LAB', nameKey: 'lab', status: 'Active' },
      { upsert: true, returnDocument: 'after' }
    );

    const testNames = ['Widal (Slide Method)', 'Widal Test (Slide Method)'];

    for (const name of testNames) {
      const testKey = normalizeKey(name);
      const catKey = normalizeKey(widalData.category);

      await LabTest.deleteMany({
        $or: [
          { testKey: testKey },
          { title: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { test: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      });

      const createdTest = await LabTest.create({
        hospitalId: null,
        ...widalData,
        test: name,
        title: name,
        categoryKey: catKey,
        testKey: testKey
      });

      console.log(`Successfully created ${name} template with ID: ${createdTest._id}`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding Widal test:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedWidalTest();
}

module.exports = { widalData, seedWidalTest };
