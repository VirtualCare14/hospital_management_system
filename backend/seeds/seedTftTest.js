const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const tftInterpretationHtml = `<p><strong>Physiologic Basis</strong><br />
<strong>Total T4</strong> is a measure of thyroid gland secretion of T4, bound and free, and thus is influenced by levels of thyroid hormone binding proteins. Only free T4 is biologically active.<br />
<strong>TSH</strong> is an anterior pituitary hormone that stimulates the thyroid gland to produce thyroid hormones. Secretion is stimulated by thyrotropin releasing hormones from the hypothalamus. There is negative feedback on TSH secretion by circulating thyroid hormone.<br />
<strong>T3</strong> is the primary active thyroid hormone. Approximately 80% of T3 is produced by extrathyroidal deiodination of T4 and the rest by thyroid gland. Total T3 is influenced by levels of thyroxine binding proteins.</p>

<p><strong>Patterns of Thyroid Function Tests in Patients with Thyroid Disease</strong></p>
<table style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 10px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 40%;">Type of disease</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 20%;">T4</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 20%;">T3</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 20%;">TSH</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Conventional hyperthyroidism (95%)</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Raised</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Raised</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Undetectable</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">T3 hyperthyroidism (5%)</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Normal</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Raised</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Undetectable</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Subclinical hyperthyroidism</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Normal</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Normal</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Undetectable</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Primary hypothyroidism</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Low</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Not indicated</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Raised</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Subclinical hypothyroidism</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Normal</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Not indicated</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Raised</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Secondary hypothyroidism</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Low</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Not indicated</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Undetectable</td>
    </tr>
  </tbody>
</table>`;

const tftData = {
  category: 'LAB',
  test: 'THYROID FUNCTION TEST (TFT)',
  title: 'THYROID FUNCTION TEST (TFT)',
  basePrice: 500,
  taxPercentage: 0,
  totalAmount: 500,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '4 Hours',
  department: 'ENDOCRINOLOGY',
  description: 'Thyroid Function Test (TFT) measuring Total T3 (Triiodothyronine), Total T4 (Thyroxine), and TSH (Thyroid-Stimulating Hormone).',
  notes: '',
  interpretation: tftInterpretationHtml,
  forGender: 'Both',
  parameters: [
    {
      name: 'Serum Triiodothyronine, T3',
      displayName: 'Serum Triiodothyronine, T3',
      unit: 'ng/mL',
      referenceRange: '0.69 - 2.15',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum thyroxine, T4',
      displayName: 'Serum thyroxine, T4',
      unit: 'ng/mL',
      referenceRange: '52 - 127',
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

async function seedTft() {
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
    const testKey = normalizeKey(tftData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...tftData,
      categoryKey: normalizeKey(tftData.category),
      testKey: testKey
    });

    console.log(`Successfully created THYROID FUNCTION TEST (TFT) template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding TFT test:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedTft();
}

module.exports = { tftData, seedTft };
