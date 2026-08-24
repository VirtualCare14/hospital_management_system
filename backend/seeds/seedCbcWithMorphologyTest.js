const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const cbcWithMorphologyData = {
  category: 'LAB',
  test: 'CBC with Morphology',
  title: 'CBC with Morphology',
  basePrice: 450,
  taxPercentage: 0,
  totalAmount: 450,
  isManualTotal: false,
  sampleType: 'Whole Blood (EDTA)',
  turnaroundTime: '2 Hours',
  description: 'Complete Blood Count (CBC) with Differential Leukocyte Count, Absolute Count, RBC Indices, Platelet Indices and Peripheral Blood Morphology.',
  notes: '',
  interpretation: '',
  forGender: 'Both',
  parameters: [
    // Group: Differential Leucocyte Count
    {
      name: 'Neutrophils',
      group: 'Differential Leucocyte Count',
      referenceRange: '40 - 80',
      unit: '%',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Lymphocyte',
      group: 'Differential Leucocyte Count',
      referenceRange: '20 - 40',
      unit: '%',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Eosinophils',
      group: 'Differential Leucocyte Count',
      referenceRange: '1 - 6',
      unit: '%',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Monocytes',
      group: 'Differential Leucocyte Count',
      referenceRange: '2 - 10',
      unit: '%',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Basophils',
      group: 'Differential Leucocyte Count',
      referenceRange: '< 2',
      unit: '%',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },

    // Group: Differential Leukocyte Count (Absolute count)
    {
      name: 'Absolute Neutrophils Count',
      displayName: 'Neutrophils',
      group: 'Differential Leukocyte Count (Absolute count)',
      referenceRange: '2 - 7',
      unit: 'x10^3/µL',
      fieldType: 'Number',
      gender: 'Both',
      formula: 'Formula: (TLC * Neutrophil percent / 1000)',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Absolute Lymphocyte Count',
      displayName: 'Lymphocytes',
      group: 'Differential Leukocyte Count (Absolute count)',
      referenceRange: '1 - 3',
      unit: 'x10^3/µL',
      fieldType: 'Number',
      gender: 'Both',
      formula: 'Formula: (TLC * Lymphocyte percent / 1000)',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Absolute Eosinophils Count',
      displayName: 'Eosinophils',
      group: 'Differential Leukocyte Count (Absolute count)',
      referenceRange: '0.02 - 0.5',
      unit: 'x10^3/µL',
      fieldType: 'Number',
      gender: 'Both',
      formula: 'Formula: (TLC * Eosinophils percent / 1000)',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Absolute Monocytes Count',
      displayName: 'Monocytes',
      group: 'Differential Leukocyte Count (Absolute count)',
      referenceRange: '0.1 - 1',
      unit: 'x10^3/µL',
      fieldType: 'Number',
      gender: 'Both',
      formula: 'Formula: (TLC * Monocytes percent / 1000)',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Absolute Basophils Count',
      displayName: 'Basophils',
      group: 'Differential Leukocyte Count (Absolute count)',
      referenceRange: '0.02 - 0.1',
      unit: 'x10^3/µL',
      fieldType: 'Number',
      gender: 'Both',
      formula: 'Formula: (TLC * Basophils percent / 1000)',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },

    // WBC Count
    {
      name: 'WBC Count',
      referenceRange: '3,500 - 10,500',
      unit: 'mcL',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },

    // Group: RBC Indices
    {
      name: 'Hemoglobin',
      group: 'RBC Indices',
      referenceRange: '13 - 17',
      unit: 'g/dl',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'RBC',
      group: 'RBC Indices',
      referenceRange: '3.5 - 5.5',
      unit: 'million/cumm',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'HCT/PCV',
      group: 'RBC Indices',
      referenceRange: '37 - 47',
      unit: '%',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'MCV',
      group: 'RBC Indices',
      referenceRange: '78 - 96',
      unit: 'fL',
      fieldType: 'Number',
      gender: 'Both',
      formula: 'Formula: MCV = (Hct * 10) / RBC in millions',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'MCH',
      group: 'RBC Indices',
      referenceRange: '27 - 32',
      unit: 'Pg',
      fieldType: 'Number',
      gender: 'Both',
      formula: 'Formula: MCH = (Hb * 10) / RBC in millions',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'MCHC',
      group: 'RBC Indices',
      referenceRange: '30 - 36',
      unit: '%',
      fieldType: 'Number',
      gender: 'Both',
      formula: 'Formula: MCHC = (Hb * 100) / Hct',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'RDW-CV',
      group: 'RBC Indices',
      referenceRange: '11 - 15',
      unit: '%',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },

    // Group: Platelet Indices
    {
      name: 'Platelet Count',
      group: 'Platelet Indices',
      referenceRange: '1.5 - 4.5',
      unit: 'lakhs/cumm',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'MPV',
      group: 'Platelet Indices',
      referenceRange: '6 - 9.5',
      unit: 'fL',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },

    // Group: Morphology
    {
      name: 'RBC Morphology',
      group: 'Morphology',
      referenceRange: '',
      unit: '',
      fieldType: 'RichText',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'WBC Morphology',
      group: 'Morphology',
      referenceRange: '',
      unit: '',
      fieldType: 'RichText',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Platelet Morphology',
      group: 'Morphology',
      referenceRange: '',
      unit: '',
      fieldType: 'RichText',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedCbcWithMorphology() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to database successfully.');

    // Ensure category exists
    await LabTestCategory.findOneAndUpdate(
      { name: 'LAB' },
      { name: 'LAB', status: 'Active' },
      { upsert: true, new: true }
    );

    // Remove any previous duplicate test entries for this test key
    const testKey = normalizeKey(cbcWithMorphologyData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...cbcWithMorphologyData,
      categoryKey: normalizeKey(cbcWithMorphologyData.category),
      testKey: testKey
    });

    console.log(`Successfully created CBC with Morphology template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding CBC with Morphology:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedCbcWithMorphology();
}

module.exports = { cbcWithMorphologyData, seedCbcWithMorphology };
