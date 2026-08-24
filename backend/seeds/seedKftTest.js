const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const kftInterpretationHtml = `<p><strong>Creatinine</strong> is a nitrogenous waste product formed in muscle from creatine phosphate. Endogenous production of creatinine is proportional to muscle mass and body weight.</p>
<table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 10px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 50%;">Causes of Increased Serum Creatinine Level</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 50%;">Causes of Decreased Serum Creatinine Level</th>
    </tr>
  </thead>
  <tbody>
    <tr style="vertical-align: top;">
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">
        1. Pre-renal, renal, and post-renal azotemia<br />
        2. Large amount of dietary meat<br />
        3. Active acromegaly and gigantism
      </td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">
        1. Pregnancy<br />
        2. Increasing age (reduction in muscle mass)
      </td>
    </tr>
  </tbody>
</table>
<p><strong>GFR</strong> is measured to (i) detect suspected incipient kidney disease (i.e. early detection), (ii) monitor the course of established kidney disease, (iii) plan renal replacement therapy in advanced renal disease, and (iv) adjust the dosage of certain drugs which are nephrotoxic.</p>
<p><strong>BUN/creatinine ratio</strong> is to discriminate pre-renal and post-renal azotemia from renal azotemia.</p>`;

const kftData = {
  category: 'LAB',
  test: 'Kidney function Test (KFT)',
  title: 'Kidney function Test (KFT)',
  basePrice: 600,
  taxPercentage: 0,
  totalAmount: 600,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '3 Hours',
  department: 'BIOCHEMISTRY',
  description: 'Complete Kidney Function Test (KFT/RFT) assessing Urea, Creatinine, BUN, eGFR, Electrolytes, Calcium, and calculated ratios.',
  notes: '',
  interpretation: kftInterpretationHtml,
  forGender: 'Both',
  parameters: [
    {
      name: 'BUN',
      displayName: 'BUN',
      unit: 'mg/dl',
      referenceRange: '7.9 - 20',
      formula: 'Formula: BUN = Serum Urea × 0.466',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum Urea',
      displayName: 'Serum Urea',
      unit: 'mg/dl',
      referenceRange: '19 - 45',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum Creatinine',
      displayName: 'Serum Creatinine',
      unit: 'mg/dl',
      referenceRange: '0.72 - 1.18',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'eGFR',
      displayName: 'eGFR',
      unit: 'ml/min/1.73m^2',
      referenceRange: '> 90',
      formula: 'Formula: eGFR = CKD-EPI(Serum Creatinine, Age, Sex)',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'eGFR Category',
      displayName: 'eGFR Category',
      unit: '',
      referenceRange: '',
      formula: 'Formula: eGFR Category = Category based on eGFR result',
      isCalculated: true,
      fieldType: 'Text',
      gender: 'Both',
      valueOptions: [
        { value: 'G1 (Normal or high: >= 90)' },
        { value: 'G2 (Mildly decreased: 60-89)' },
        { value: 'G3a (Mildly to moderately decreased: 45-59)' },
        { value: 'G3b (Moderately to severely decreased: 30-44)' },
        { value: 'G4 (Severely decreased: 15-29)' },
        { value: 'G5 (Kidney failure: < 15)' }
      ],
      status: 'Active'
    },
    {
      name: 'Serum Calcium',
      displayName: 'Serum Calcium',
      unit: 'mg/dl',
      referenceRange: '8.8 - 10.6',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum Potassium',
      displayName: 'Serum Potassium',
      unit: 'mmol/L',
      referenceRange: '3.5 - 5.1',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum Sodium',
      displayName: 'Serum Sodium',
      unit: 'mmol/L',
      referenceRange: '136 - 146',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
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
      name: 'Urea / Creatinine Ratio',
      displayName: 'Urea / Creatinine Ratio',
      unit: '',
      referenceRange: '',
      formula: 'Formula: Urea/Creatinine Ratio = Serum Urea / Serum Creatinine',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'BUN / Creatinine Ratio',
      displayName: 'BUN / Creatinine Ratio',
      unit: '',
      referenceRange: '',
      formula: 'Formula: BUN/Creatinine Ratio = BUN / Serum Creatinine',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedKft() {
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
    const testKey = normalizeKey(kftData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...kftData,
      categoryKey: normalizeKey(kftData.category),
      testKey: testKey
    });

    console.log(`Successfully created Kidney function Test (KFT) template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding KFT:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedKft();
}

module.exports = { kftData, seedKft };
