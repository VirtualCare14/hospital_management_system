const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const upcrInterpretationHtml = `<p><strong>Reference Interpretation (Adults)</strong></p>
<ul style="margin: 6px 0; padding-left: 20px; line-height: 1.8; color: #334155; font-size: 11px;">
  <li><strong>&lt; 0.2</strong> &rarr; Normal</li>
  <li><strong>0.2 &ndash; 0.5</strong> &rarr; Mild proteinuria</li>
  <li><strong>0.5 &ndash; 3.0</strong> &rarr; Moderate proteinuria</li>
  <li><strong>&gt; 3.0</strong> &rarr; Nephrotic range proteinuria</li>
</ul>`;

const upcrData = {
  category: 'LAB',
  test: 'URINE PROTEIN/CREATININE RATIO (UPCR)',
  title: 'URINE PROTEIN/CREATININE RATIO (UPCR)',
  basePrice: 400,
  taxPercentage: 0,
  totalAmount: 400,
  isManualTotal: false,
  sampleType: 'Spot Urine',
  turnaroundTime: '2 Hours',
  department: 'BIOCHEMISTRY',
  description: 'Spot Urine Protein to Creatinine Ratio (UPCR) test for quantitative proteinuria assessment.',
  notes: '',
  interpretation: upcrInterpretationHtml,
  forGender: 'Both',
  parameters: [
    {
      name: 'Urine for creatinine',
      displayName: 'Urine for creatinine',
      unit: 'mg/dl',
      referenceRange: '',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Urine for Protein',
      displayName: 'Urine for Protein',
      unit: 'mg/dl',
      referenceRange: '',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Urine Protein Creatinine Ratio',
      displayName: 'Urine Protein Creatinine Ratio',
      unit: '',
      referenceRange: '< 0.2',
      formula: 'Formula: Urine Protein Creatinine Ratio = Urine for Protein ÷ Urine for creatinine',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedUpcr() {
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
    const testKey = normalizeKey(upcrData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...upcrData,
      categoryKey: normalizeKey(upcrData.category),
      testKey: testKey
    });

    console.log(`Successfully created URINE PROTEIN/CREATININE RATIO (UPCR) template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding UPCR test:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedUpcr();
}

module.exports = { upcrData, seedUpcr };
