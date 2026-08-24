const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const bilirubinInterpretationText = `Physiological basis
Bilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin (heme). The majority of bilirubin comes from senescent red cells. It is biotransformed in the liver and excreted in bile and urine.
The conjugated form is water soluble and reacts directly with diazo dyes in the absence of reaction accelerator, and is therefore called direct bilirubin. The unconjugated form is fat-soluble and reacts with diazo dyes only in the presence of accelerator; so it is called indirect.
Some conjugated bilirubin is bound to serum albumin, so-called D (delta) bilirubin.

Increased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.

Comments
Assay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin. The unconjugated (indirect) form is the difference between total bilirubin (with reaction accelerator) and the direct bilirubin fraction. Delta bilirubin is determined together with conjugated bilirubin. Delta bilirubin (half-life is about 17 days) accounts for relatively slow regression of jaundice.
Only conjugated bilirubin appears in the urine, and it is indicative of liver disease and biliary tract obstruction.
Hemolysis is associated with increased unconjugated bilirubin. Unbound (free) serum or plasma bilirubin level correlates better than total bilirubin with CNS bilirubin concentrations and bilirubin encephalopathy (kernicterus) in newborn jaundice.`;

const bilirubinData = {
  category: 'LAB',
  test: 'BILIRUBIN TOTAL, DIRECT & INDIRECT',
  title: 'BILIRUBIN TOTAL, DIRECT & INDIRECT',
  basePrice: 250,
  taxPercentage: 0,
  totalAmount: 250,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '2 Hours',
  department: 'BIOCHEMISTRY',
  description: 'Serum Bilirubin evaluation (Total, Direct & Indirect) for liver assessment and jaundice diagnosis.',
  notes: '',
  interpretation: bilirubinInterpretationText,
  forGender: 'Both',
  parameters: [
    {
      name: 'Serum Bilirubin (Total)',
      displayName: 'Serum Bilirubin (Total)',
      unit: 'mg/dl',
      referenceRange: '0.2 - 1.2',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum Bilirubin (Direct)',
      displayName: 'Serum Bilirubin (Direct)',
      unit: 'mg/dl',
      referenceRange: '0 - 0.3',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Serum Bilirubin (Indirect)',
      displayName: 'Serum Bilirubin (Indirect)',
      unit: 'mg/dl',
      referenceRange: '0.2 - 1',
      formula: 'Formula: Serum Bilirubin Indirect = Serum Bilirubin Total - Serum Bilirubin Direct',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedBilirubin() {
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
    const testKey = normalizeKey(bilirubinData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...bilirubinData,
      categoryKey: normalizeKey(bilirubinData.category),
      testKey: testKey
    });

    console.log(`Successfully created BILIRUBIN TOTAL, DIRECT & INDIRECT template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding Bilirubin test:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedBilirubin();
}

module.exports = { bilirubinData, seedBilirubin };
