const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const amhPanelData = {
  category: 'LAB',
  test: 'AMH PANEL',
  title: 'AMH PANEL',
  basePrice: 1200,
  taxPercentage: 0,
  totalAmount: 1200,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '24 Hours',
  department: 'BIOCHEMISTRY',
  description: 'Anti-Müllerian Hormone (AMH) Fertility and Ovarian Reserve Panel including T4, TSH, Prolactin, LH, FSH, and Estradiol.',
  notes: '',
  interpretation: '',
  forGender: 'Female',
  parameters: [
    {
      name: 'ANTI MULLERIAN HORMONE',
      displayName: 'ANTI MULLERIAN HORMONE',
      unit: 'ng/mL',
      referenceRange: '',
      fieldType: 'Number',
      gender: 'Female',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum thyroxine, T4',
      displayName: 'Serum thyroxine, T4',
      unit: 'ng/mL',
      referenceRange: '52 - 127',
      fieldType: 'Number',
      gender: 'Female',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Thyroid-Stimulating Hormone, TSH',
      displayName: 'Thyroid-Stimulating Hormone, TSH',
      unit: 'µIU/mL',
      referenceRange: '0.3 - 4.5',
      fieldType: 'Number',
      gender: 'Female',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Prolactin',
      displayName: 'Prolactin',
      unit: 'ng/mL',
      referenceRange: '< 15 ng/mL',
      fieldType: 'Number',
      gender: 'Female',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Luteinising Hormone, LH',
      displayName: 'Luteinising Hormone, LH',
      unit: 'mIU/mL',
      referenceRange: '',
      fieldType: 'Text',
      gender: 'Female',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Follicle Stimulating Hormone, FSH',
      displayName: 'Follicle Stimulating Hormone, FSH',
      unit: 'mIU/mL',
      referenceRange: '',
      fieldType: 'Number',
      gender: 'Female',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Estradiol',
      displayName: 'Estradiol',
      unit: 'pg/mL',
      referenceRange: '',
      fieldType: 'Number',
      gender: 'Female',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedAmhPanel() {
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
    const testKey = normalizeKey(amhPanelData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...amhPanelData,
      categoryKey: normalizeKey(amhPanelData.category),
      testKey: testKey
    });

    console.log(`Successfully created AMH PANEL template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding AMH Panel:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedAmhPanel();
}

module.exports = { amhPanelData, seedAmhPanel };
