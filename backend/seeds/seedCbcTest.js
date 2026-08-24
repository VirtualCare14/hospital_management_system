const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const cbcInterpretation = `Clinical Notes:
A complete blood count (CBC) is used to evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia. There have been some reports of WBC and platelet counts being lower in venous blood than in capillary blood samples, although still within these reference ranges.

Possible causes of abnormal parameters:

 | High | Low
RBC, Hb, or HCT | Dehydration, polycythemia, shock, chronic hypoxia | Anemia, thalassemia, and other hemoglobinopathies
MCV | Macrocytic anemia, liver disease | Microcytic anemia
WBC | Acute stress, infection, malignancies | Sepsis, marrow hypoplasia
Platelets | Risk of thrombosis | Risk of bleeding`;

const cbcData = {
  category: 'LAB',
  test: 'Complete Blood Count (CBC)',
  title: 'Complete Blood Count (CBC)',
  basePrice: 350,
  taxPercentage: 0,
  totalAmount: 350,
  isManualTotal: false,
  sampleType: 'Whole Blood (EDTA)',
  turnaroundTime: '2 Hours',
  description: 'Complete Blood Count (CBC) including Automated Differential Leucocyte Count and Red Blood Cell Indices with auto-calculation.',
  notes: cbcInterpretation,
  interpretation: cbcInterpretation,
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
    }
  ],
  status: 'Active'
};

const seedCbc = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to database successfully.');

    const catKey = normalizeKey(cbcData.category);
    const testKey = normalizeKey(cbcData.test);

    // Delete any previous duplicate / test templates for CBC
    await LabTest.deleteMany({
      $or: [
        { testKey: testKey },
        { test: 'Complete Blood Count (CBC)' },
        { title: 'Complete Blood Count (CBC)' }
      ]
    });

    // Ensure category exists
    await LabTestCategory.findOneAndUpdate(
      { hospitalId: null, nameKey: catKey },
      {
        $setOnInsert: {
          hospitalId: null,
          name: cbcData.category,
          nameKey: catKey,
          status: 'Active'
        }
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Create 1 global template
    const payload = {
      hospitalId: null,
      category: cbcData.category,
      categoryKey: catKey,
      test: cbcData.test,
      testKey: testKey,
      title: cbcData.title,
      description: cbcData.description,
      notes: cbcData.notes,
      interpretation: cbcData.interpretation,
      basePrice: cbcData.basePrice,
      taxPercentage: cbcData.taxPercentage,
      totalAmount: cbcData.totalAmount,
      isManualTotal: false,
      sampleType: cbcData.sampleType,
      turnaroundTime: cbcData.turnaroundTime,
      parameters: cbcData.parameters,
      status: 'Active'
    };

    const doc = await LabTest.create(payload);
    console.log(`Successfully created Complete Blood Count (CBC) template with ID: ${doc._id}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Complete Blood Count (CBC) test:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedCbc();
