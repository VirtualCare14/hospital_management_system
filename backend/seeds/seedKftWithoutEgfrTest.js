const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const kftWithoutEgfrInterpretationHtml = `<p><strong>Creatinine</strong> is a nitrogenous waste product formed in muscle from creatine phosphate. Endogenous production of creatinine is proportional to muscle mass and body weight.</p>
<table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px;" border="1" cellpadding="6">
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

<p><strong>BUN/Serum Creatinine Ratio</strong><br />BUN/creatinine ratio is to discriminate pre-renal and post-renal azotemia from renal azotemia. Normal ratio is 12:1 to 20:1.</p>
<table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 10px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 50%;">Causes of Increased BUN/Creatinine Ratio (&gt;20:1)</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 50%;">Causes of Decreased BUN/Creatinine Ratio (&lt;10:1)</th>
    </tr>
  </thead>
  <tbody>
    <tr style="vertical-align: top;">
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">
        1. Increased BUN with normal serum creatinine:<br />
        &nbsp;&nbsp;&nbsp;&nbsp;a) Pre-renal azotemia&nbsp;&nbsp;b) High protein diet&nbsp;&nbsp;c) Increased protein catabolism&nbsp;&nbsp;d) Gastrointestinal hemorrhage<br /><br />
        2. Increase of both BUN and serum creatinine with a disproportionately greater increase of BUN:<br />
        &nbsp;&nbsp;&nbsp;&nbsp;a) Post-renal azotemia (Obstruction to the outflow of urine).
      </td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">
        1. Acute tubular necrosis<br />
        2. Low protein diet, starvation<br />
        3. Severe liver disease
      </td>
    </tr>
  </tbody>
</table>`;

const kftWithoutEgfrData = {
  category: 'LAB',
  test: 'KFT without EGFR',
  title: 'KFT without EGFR',
  basePrice: 500,
  taxPercentage: 0,
  totalAmount: 500,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '2 Hours',
  department: 'BIOCHEMISTRY',
  description: 'Kidney Function Test without eGFR measuring BUN, Urea, Creatinine, Electrolytes, Uric Acid, Calcium, and calculated ratios.',
  notes: '',
  interpretation: kftWithoutEgfrInterpretationHtml,
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
      formula: 'Formula: Urea / Creatinine Ratio = Serum Urea ÷ Serum Creatinine',
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
      formula: 'Formula: BUN / Creatinine Ratio = BUN ÷ Serum Creatinine',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedKftWithoutEgfr() {
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
    const testKey = normalizeKey(kftWithoutEgfrData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...kftWithoutEgfrData,
      categoryKey: normalizeKey(kftWithoutEgfrData.category),
      testKey: testKey
    });

    console.log(`Successfully created KFT without EGFR template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding KFT without EGFR:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedKftWithoutEgfr();
}

module.exports = { kftWithoutEgfrData, seedKftWithoutEgfr };
