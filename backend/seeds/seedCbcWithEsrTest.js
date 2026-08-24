const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const cbcEsrInterpretation = `Clinical Notes:
A complete blood count (CBC) with ESR is used to evaluate overall health and detect disorders including anemia, infection, inflammation, and leukemia.

Possible causes of abnormal parameters:

 | High | Low
RBC, Hb, or HCT | Dehydration, polycythemia, shock, chronic hypoxia | Anemia, thalassemia, and other hemoglobinopathies
MCV | Macrocytic anemia, liver disease | Microcytic anemia
WBC | Acute stress, infection, malignancies | Sepsis, marrow hypoplasia
Platelets | Risk of thrombosis | Risk of bleeding
ESR | Infection, inflammatory disease, autoimmune disorders, malignancy | Polycythemia, sickle cell anemia, severe leukocytosis`;

const cbcWithEsrData = {
  category: 'LAB',
  test: 'CBC with ESR',
  title: 'CBC with ESR',
  basePrice: 400,
  taxPercentage: 0,
  totalAmount: 400,
  isManualTotal: false,
  sampleType: 'Whole Blood (EDTA)',
  turnaroundTime: '2 Hours',
  description: 'Complete Blood Count (CBC) with Erythrocyte Sedimentation Rate (ESR) and Red Blood Cell Indices with auto-calculation.',
  notes: cbcEsrInterpretation,
  interpretation: cbcEsrInterpretation,
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
    // Subcategory: Differential Leucocyte Count
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
      name: 'R.D.W. - SD (Optional)',
      referenceRange: '39 - 46',
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
      name: 'P-LCR (Optional)',
      referenceRange: '19.7 - 42.4',
      unit: '%',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'P.D.W. (Optional)',
      referenceRange: '9.6 - 15.2',
      unit: 'fL',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Erythrocyte Sedimentation Rate (Wintrobe)',
      referenceRange: '0 - 9',
      unit: 'mm for 1st hour',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedCbcWithEsr() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to database successfully.');

    await LabTestCategory.findOneAndUpdate(
      { name: 'LAB' },
      { name: 'LAB', status: 'Active' },
      { upsert: true, new: true }
    );

    const testKey = normalizeKey(cbcWithEsrData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...cbcWithEsrData,
      categoryKey: normalizeKey(cbcWithEsrData.category),
      testKey: testKey
    });

    console.log(`Successfully created CBC with ESR template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding CBC with ESR:', error);
    process.exit(1);
  }
}

seedCbcWithEsr();
