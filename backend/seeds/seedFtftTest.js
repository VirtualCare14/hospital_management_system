const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const ftftInterpretationHtml = `<p>FT4 is a direct measure of the free T4 hormone concentration (biologically available hormone).</p>

<table style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 10px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 50%;">Increased in</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 50%;">Decreased in</th>
    </tr>
  </thead>
  <tbody>
    <tr style="vertical-align: top;">
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">
        Hyperthyroidism, nonthyroidal illness, especially psychiatric.<br />
        Drugs: amiodarone, &beta;-blockers (high-dose).
      </td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">
        Hypothyroidism, nonthyroidal illness.<br />
        Drugs: phenytoin.
      </td>
    </tr>
  </tbody>
</table>

<p>The free thyroxine is used along with sensitive TSH assays for detecting clinical hyperthyroidism and hypothyroidism. The TSH assay detects subclinical thyroid dysfunction (normal FT4) and monitors levothyroxine treatment better, whereas the free thyroxine test detects central hypothyroidism and monitors rapidly changing function status better.</p>

<p><strong>i. Elevated Free T3 and Free T4 with Low TSH:</strong> This often indicates hyperthyroidism, where the thyroid gland is overactive.<br />
<strong>ii. Low Free T3 and Free T4 with Elevated TSH:</strong> This usually points to hypothyroidism, where the thyroid gland is underactive.<br />
<strong>iii. Normal Free T3 and Free T4 with Normal TSH:</strong> This suggests that the thyroid is functioning normally.<br />
<strong>iv. Normal Free T3 and Free T4 with High TSH:</strong> This could indicate subclinical hypothyroidism, where the thyroid is slightly underactive but not enough to cause obvious symptoms.</p>

<p>Each individual's situation can be unique, so it's always best to discuss test results with a healthcare provider to get a complete understanding in the context of your overall health.</p>`;

const ftftData = {
  category: 'LAB',
  test: 'FREE THYROID FUNCTION TEST (FTFT)',
  title: 'FREE THYROID FUNCTION TEST (FTFT)',
  basePrice: 800,
  taxPercentage: 0,
  totalAmount: 800,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '4 Hours',
  department: 'ENDOCRINOLOGY',
  description: 'Free Thyroid Function Test (FTFT) measuring Free T3, Free T4, and TSH (Thyroid-Stimulating Hormone).',
  notes: '',
  interpretation: ftftInterpretationHtml,
  forGender: 'Both',
  parameters: [
    {
      name: 'Free Triiodothyronine l, FT3',
      displayName: 'Free Triiodothyronine l, FT3',
      unit: 'pg/mL',
      referenceRange: '2 - 4.2',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Free Thyroxine, FT4',
      displayName: 'Free Thyroxine, FT4',
      unit: 'pg/mL',
      referenceRange: '8.9 - 17.2',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Thyroid-Stimulating Hormone, TSH',
      displayName: 'Thyroid-Stimulating Hormone, TSH',
      unit: 'µIU/mL',
      referenceRange: '0.3 - 4.5',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedFtft() {
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
    const testKey = normalizeKey(ftftData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...ftftData,
      categoryKey: normalizeKey(ftftData.category),
      testKey: testKey
    });

    console.log(`Successfully created FREE THYROID FUNCTION TEST (FTFT) template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding FTFT test:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedFtft();
}

module.exports = { ftftData, seedFtft };
