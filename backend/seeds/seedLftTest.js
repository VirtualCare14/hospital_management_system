const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const lftInterpretationText = `LFT Interpretation
Liver Function Blood Test gives an insight into your liver health and helps identify problems like hepatitis, cirrhosis, and fatty liver disease, which may cause similar symptoms but require different treatments to recover.

Test Significance
Besides diagnosing liver problems, LFT's also monitor overall liver functioning. Monitoring helps people with liver disease or taking medication, as it helps screen whether the treatment works fine or requires adjustments. Moreover, Liver Function Tests help determine if someone is at risk of developing liver diseases. Apart from assessing your chances, this test also checks the severity of the liver damage to help the doctor plan and prescribe appropriate treatment.

Increased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.`;

const lftData = {
  category: 'LAB',
  test: 'Liver function test (LFT)',
  title: 'Liver function test (LFT)',
  basePrice: 500,
  taxPercentage: 0,
  totalAmount: 500,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '4 Hours',
  department: 'BIOCHEMISTRY',
  description: 'Comprehensive Liver Function Test (LFT) with bilirubin breakdown, liver enzymes, protein fractions, and calculated ratios.',
  notes: '',
  interpretation: lftInterpretationText,
  forGender: 'Both',
  parameters: [
    {
      name: 'Serum Bilirubin (Total)',
      displayName: 'Serum Bilirubin (Total)',
      unit: 'mg/dl',
      referenceRange: '0.2 - 1.2',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum Bilirubin (Direct)',
      displayName: 'Serum Bilirubin (Direct)',
      unit: 'mg/dl',
      referenceRange: '0 - 0.3',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum Bilirubin (Indirect)',
      displayName: 'Serum Bilirubin (Indirect)',
      unit: 'mg/dl',
      referenceRange: '0.2 - 1',
      formula: 'Formula: Serum Bilirubin (Indirect) = Serum Bilirubin (Total) - Serum Bilirubin (Direct)',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'SGOT (AST)',
      displayName: 'SGOT (AST)',
      unit: 'U/l',
      referenceRange: '0 - 37',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'SGPT (ALT)',
      displayName: 'SGPT (ALT)',
      unit: 'U/l',
      referenceRange: '13 - 40',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'SGOT/SGPT',
      displayName: 'SGOT/SGPT',
      unit: '',
      referenceRange: '',
      formula: 'Formula: SGOT/SGPT = SGOT (AST) / SGPT (ALT)',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum Alkaline Phosphatase',
      displayName: 'Serum Alkaline Phosphatase',
      unit: 'U/l',
      referenceRange: '',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
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

async function seedLft() {
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
    const testKey = normalizeKey(lftData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...lftData,
      categoryKey: normalizeKey(lftData.category),
      testKey: testKey
    });

    console.log(`Successfully updated Liver function test (LFT) template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding LFT:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedLft();
}

module.exports = { lftData, seedLft };
