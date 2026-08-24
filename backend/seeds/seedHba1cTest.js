const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const hba1cInterpretation = `Interpretation as per American Diabetes Association (ADA) Guidelines

Reference Group | Non-Diabetic adults >= 18 years | At Risk (Prediabetes) | Diagnosing Diabetes | Therapeutic goals for glycemic control
HbA1c in % | 4.0-5.6 | 5.7-6.4 | >= 6.5 | <7.0

Clinical significance:
Hemoglobin A1c (HbA1c) level reflects the mean glucose concentration over the previous period (approximately 8-12 weeks). The following ranges may be used for interpretation of results. However, factors such as duration of diabetes, adherence to therapy and the age of the patient should also be considered in assessing the degree of blood glucose control.

Haemoglobin A1c (%) NSGP | mmol/mol/IFCC Unit | eAG (mg/dl) | Degree of Glucose Control Unit
>8 | >63.9 | >183 | Action Suggested*
7-8 | 53.0 - 63.9 | 154-183 | Fair Control
<7 | <63.9 | <154 | Goal**
6-7 | 42.1 - 63.9 | 126-154 | Near-normal glycemia
<6 | <42.1 | <126 | Non-Diabetic level

*High risk of developing long term complications such as Retinopathy, Nephropathy, Neuropathy etc.

**Some danger of hypoglycemic reaction in Type 1 diabetics. Some glucose intolerant individuals and "subclinical" diabetics may demonstrate HbA1c levels in this area.`;

const hba1cData = {
  category: 'LAB',
  test: 'HbA1c (Glycosylated Hemoglobin)',
  title: 'HbA1c (Glycosylated Hemoglobin)',
  basePrice: 500,
  taxPercentage: 0,
  totalAmount: 500,
  isManualTotal: false,
  sampleType: 'Whole Blood (EDTA)',
  turnaroundTime: '4 Hours',
  description: 'Quantitative measurement of HbA1c (Glycated Hemoglobin) and Estimated Average Glucose (eAG) to evaluate long-term glycemic control.',
  notes: hba1cInterpretation,
  interpretation: hba1cInterpretation,
  parameters: [
    {
      name: 'HbA1c',
      referenceRange: '4.0 - 5.6',
      unit: '%',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Estimated average glucose',
      referenceRange: '< 126',
      unit: 'mg/dL',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ],
  status: 'Active'
};

const cleanupAndSeed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to database successfully.');

    const catKey = normalizeKey(hba1cData.category);
    const testKey = normalizeKey(hba1cData.test);

    // Delete all duplicates
    const deleteRes = await LabTest.deleteMany({ testKey });
    console.log(`Cleared previous entries (${deleteRes.deletedCount} removed).`);

    // Ensure category exists
    await LabTestCategory.findOneAndUpdate(
      { hospitalId: null, nameKey: catKey },
      {
        $setOnInsert: {
          hospitalId: null,
          name: hba1cData.category,
          nameKey: catKey,
          status: 'Active'
        }
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Create single global template
    const payload = {
      hospitalId: null,
      category: hba1cData.category,
      categoryKey: catKey,
      test: hba1cData.test,
      testKey: testKey,
      title: hba1cData.title,
      description: hba1cData.description,
      notes: hba1cData.notes,
      interpretation: hba1cData.interpretation,
      basePrice: hba1cData.basePrice,
      taxPercentage: hba1cData.taxPercentage,
      totalAmount: hba1cData.totalAmount,
      isManualTotal: false,
      sampleType: hba1cData.sampleType,
      turnaroundTime: hba1cData.turnaroundTime,
      parameters: hba1cData.parameters,
      status: 'Active'
    };

    const doc = await LabTest.create(payload);
    console.log(`Successfully created single template with ID: ${doc._id}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding HbA1c test:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

cleanupAndSeed();
