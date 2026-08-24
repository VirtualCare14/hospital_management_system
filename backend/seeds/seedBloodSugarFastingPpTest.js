const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const bloodSugarInterpretationHtml = `<p><strong>Clinical Notes</strong><br />Elevated glucose levels (hyperglycemia) are most often encountered clinically in the setting of diabetes mellitus, but they may also occur with pancreatic neoplasms, hyperthyroidism, and adrenocortical dysfunction. Decreased glucose levels (hypoglycemia) may result from endogenous or exogenous insulin excess, prolonged starvation, or liver disease.</p>
<table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 33.3%;">Fasting Glucose</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 33.3%;">2 hours PP Glucose</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 33.3%;">Diagnosis</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">&lt;100</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">&lt;140</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Normal</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">100 to 125</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">140 to 199</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Pre Diabetes</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">&gt;126</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">&gt;200</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Diabetes</td>
    </tr>
  </tbody>
</table>
<p>A level of 126 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.<br />IGT (2 hrs Post meal), means a person has an increased risk of developing type 2 diabetes but does not have it yet.<br />A 2-hour glucose level of 200 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.</p>`;

const bloodSugarFastingPpData = {
  category: 'LAB',
  test: 'BLOOD SUGAR FASTING & PP',
  title: 'BLOOD SUGAR FASTING & PP',
  basePrice: 250,
  taxPercentage: 0,
  totalAmount: 250,
  isManualTotal: false,
  sampleType: 'Fluoride Plasma / Serum',
  turnaroundTime: '2 Hours',
  department: 'BIOCHEMISTRY',
  description: 'Blood Sugar Fasting & Post Prandial (PP) with diabetes diagnosis criteria interpretation table.',
  notes: '',
  interpretation: bloodSugarInterpretationHtml,
  forGender: 'Both',
  parameters: [
    {
      name: 'Fasting Blood Sugar',
      displayName: 'Fasting Blood Sugar',
      unit: 'mg/dl',
      referenceRange: '70 - 100',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Blood Sugar PP',
      displayName: 'Blood Sugar PP',
      unit: 'mg/dl',
      referenceRange: '< 180 mg/dl',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedBloodSugarFastingPp() {
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
    const testKey = normalizeKey(bloodSugarFastingPpData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...bloodSugarFastingPpData,
      categoryKey: normalizeKey(bloodSugarFastingPpData.category),
      testKey: testKey
    });

    console.log(`Successfully created BLOOD SUGAR FASTING & PP template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding BLOOD SUGAR FASTING & PP:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedBloodSugarFastingPp();
}

module.exports = { bloodSugarFastingPpData, seedBloodSugarFastingPp };
