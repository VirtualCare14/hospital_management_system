const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const btCtInterpretation = `The bleeding time test assesses primary hemostasis (vascular and platelet components) and is dependent on adequate functioning of platelets and blood vessels.

Causes of prolongation of bleeding time:
1. Thrombocytopenia
2. Disorders of platelet function
3. Von Willebrand disease
4. Disorders of blood vessels

Clotting time measures the time required for the blood to clot in a glass test tube kept at 37°C. Prolongation of clotting time only occurs in severe deficiency of a clotting factor and is normal in mild or moderate deficiency.
Note: Recommended test is Prothrombin Time (PT) and Activated Partial Thromboplastin time (APTT)`;

const btCtData = {
  category: 'LAB',
  test: 'BT & CT',
  title: 'BT & CT',
  basePrice: 200,
  taxPercentage: 0,
  totalAmount: 200,
  isManualTotal: false,
  sampleType: 'Capillary Blood / Whole Blood',
  turnaroundTime: '1 Hour',
  description: 'Estimation of Bleeding Time (BT) and Clotting Time (CT) to assess primary and secondary hemostatic function.',
  notes: btCtInterpretation,
  interpretation: btCtInterpretation,
  parameters: [
    {
      name: 'Bleeding Time',
      referenceRange: '2 - 7',
      unit: 'min',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Clotting Time',
      referenceRange: '4 - 9',
      unit: 'min',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ],
  status: 'Active'
};

const seedBtCt = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to database successfully.');

    const catKey = normalizeKey(btCtData.category);
    const testKey = normalizeKey(btCtData.test);

    // Delete existing duplicate / old templates
    await LabTest.deleteMany({ testKey });

    // Ensure category exists
    await LabTestCategory.findOneAndUpdate(
      { hospitalId: null, nameKey: catKey },
      {
        $setOnInsert: {
          hospitalId: null,
          name: btCtData.category,
          nameKey: catKey,
          status: 'Active'
        }
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Create 1 global template
    const payload = {
      hospitalId: null,
      category: btCtData.category,
      categoryKey: catKey,
      test: btCtData.test,
      testKey: testKey,
      title: btCtData.title,
      description: btCtData.description,
      notes: btCtData.notes,
      interpretation: btCtData.interpretation,
      basePrice: btCtData.basePrice,
      taxPercentage: btCtData.taxPercentage,
      totalAmount: btCtData.totalAmount,
      isManualTotal: false,
      sampleType: btCtData.sampleType,
      turnaroundTime: btCtData.turnaroundTime,
      parameters: btCtData.parameters,
      status: 'Active'
    };

    const doc = await LabTest.create(payload);
    console.log(`Successfully created BT & CT template with ID: ${doc._id}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding BT & CT test:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedBtCt();
