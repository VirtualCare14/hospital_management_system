const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const pcodData = {
  category: 'LAB',
  test: 'PCOD',
  title: 'PCOD',
  basePrice: 900,
  taxPercentage: 0,
  totalAmount: 900,
  isManualTotal: false,
  sampleType: 'Serum / Fluoride Plasma',
  turnaroundTime: '12 Hours',
  department: 'ENDOCRINOLOGY',
  description: 'Polycystic Ovarian Disease (PCOD) hormonal profile including Progesterone, Prolactin, LH, FSH, Random Blood Sugar, and Estradiol.',
  notes: '',
  interpretation: '',
  forGender: 'Female',
  parameters: [
    {
      name: 'Progesterone',
      displayName: 'Progesterone',
      unit: 'ng/mL',
      referenceRange: '',
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
      name: 'Random Blood Sugar',
      displayName: 'Random Blood Sugar',
      unit: 'mg/dl',
      referenceRange: '70 - 140',
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

async function seedPcod() {
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
    const testKey = normalizeKey(pcodData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...pcodData,
      categoryKey: normalizeKey(pcodData.category),
      testKey: testKey
    });

    console.log(`Successfully created PCOD template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding PCOD test:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedPcod();
}

module.exports = { pcodData, seedPcod };
