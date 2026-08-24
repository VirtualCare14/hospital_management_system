const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const cbcAbsoluteInterpretation = `Clinical Notes:
A complete blood count (CBC) is used to evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia. There have been some reports of WBC and platelet counts being lower in venous blood than in capillary blood samples, although still within these reference ranges.

Possible causes of abnormal parameters:

 | High | Low
RBC, Hb, or HCT | Dehydration, polycythemia, shock, chronic hypoxia | Anemia, thalassemia, and other hemoglobinopathies
MCV | Macrocytic anemia, liver disease | Microcytic anemia
WBC | Acute stress, infection, malignancies | Sepsis, marrow hypoplasia
Platelets | Risk of thrombosis | Risk of bleeding`;

const cbcAbsoluteData = {
  category: 'LAB',
  test: 'CBC (with absolute counts)',
  title: 'CBC (with absolute counts)',
  basePrice: 400,
  taxPercentage: 0,
  totalAmount: 400,
  isManualTotal: false,
  sampleType: 'Whole Blood (EDTA)',
  turnaroundTime: '2 Hours',
  description: 'Complete Blood Count (CBC) with Absolute Leukocyte Counts and Red Blood Cell Indices with auto-calculation.',
  notes: cbcAbsoluteInterpretation,
  interpretation: cbcAbsoluteInterpretation,
  forGender: 'Both',
  parameters: [
    {
      name: 'Hemoglobin',
      referenceRange: '13 - 17',
      unit: 'g/dl',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Total Leukocyte Count',
      referenceRange: '4,800 - 10,800',
      unit: 'cumm',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    // Group: Differential Leucocyte Count (Percentage)
    {
      name: 'Neutrophils',
      group: 'Differential Leucocyte Count',
      referenceRange: '40 - 80',
      unit: '%',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Lymphocyte',
      group: 'Differential Leucocyte Count',
      referenceRange: '20 - 40',
      unit: '%',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Eosinophils',
      group: 'Differential Leucocyte Count',
      referenceRange: '1 - 6',
      unit: '%',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Monocytes',
      group: 'Differential Leucocyte Count',
      referenceRange: '2 - 10',
      unit: '%',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Basophils',
      group: 'Differential Leucocyte Count',
      referenceRange: '< 2',
      unit: '%',
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
      gender: 'Both',
      formula: 'Formula: (TLC * Basophils percent / 1000)',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    // Standalone calculated
    {
      name: 'Neutrophil Lymphocyte Ratio',
      displayName: 'Neutrophil Lymphocyte Ratio',
      referenceRange: '',
      unit: '',
      gender: 'Both',
      formula: 'Formula: Neutrophil Lymphocyte Ratio (NLR) = Absolute Neutrophil count / absolute Lymphocyte count',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Platelet Count',
      referenceRange: '1.5 - 4.1',
      unit: 'lakhs/cumm',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Total RBC Count',
      referenceRange: '4.5 - 5.5',
      unit: 'million/cumm',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Hematocrit Value, Hct',
      referenceRange: '40 - 50',
      unit: '%',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Mean Corpuscular Volume, MCV',
      referenceRange: '83 - 101',
      unit: 'fL',
      gender: 'Both',
      formula: 'Formula: MCV = (Hct * 10) / RBC in millions',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Mean Cell Haemoglobin, MCH',
      referenceRange: '27 - 32',
      unit: 'Pg',
      gender: 'Both',
      formula: 'Formula: MCH = (Hb * 10) / RBC in millions',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Mean Cell Haemoglobin CON, MCHC',
      referenceRange: '31.5 - 34.5',
      unit: '%',
      gender: 'Both',
      formula: 'Formula: MCHC = (Hb * 100) / Hct',
      isCalculated: true,
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Mean Platelet Volume, MPV (Optional)',
      referenceRange: '6.5 - 12',
      unit: 'fL',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'R.D.W. - CV (Optional)',
      referenceRange: '11.6 - 14',
      unit: '%',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'R.D.W. - SD (Optional)',
      referenceRange: '39 - 46',
      unit: 'fL',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedCbcAbsoluteCounts() {
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
    const testKey = normalizeKey(cbcAbsoluteData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...cbcAbsoluteData,
      categoryKey: normalizeKey(cbcAbsoluteData.category),
      testKey: testKey
    });

    console.log(`Successfully created CBC (with absolute counts) template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding CBC (with absolute counts):', error);
    process.exit(1);
  }
}

seedCbcAbsoluteCounts();
