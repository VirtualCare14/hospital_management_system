const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const seedAbgTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management');

    const parameters = [
      { name: 'pH', referenceRange: '7.35 – 7.45', unit: '—', status: 'Active' },
      { name: 'PCO₂ / PaCO₂', referenceRange: '35 – 45', unit: 'mmHg', status: 'Active' },
      { name: 'Bicarbonate (HCO₃⁻)', referenceRange: '22 – 26', unit: 'mEq/L', status: 'Active' },
      { name: 'Total CO₂ (TCO₂)', referenceRange: '22 – 29', unit: 'mmol/L', status: 'Active' },
      { name: 'Standard Bicarbonate (SBC)', referenceRange: '22 – 26', unit: 'mEq/L', status: 'Active' },
      { name: 'Base Excess (BE)', referenceRange: '−2 to +2', unit: 'mEq/L', status: 'Active' },
      { name: 'PO₂ / PaO₂', referenceRange: '80 – 100', unit: 'mmHg', status: 'Active' },
      { name: 'Oxygen saturation', referenceRange: '95 – 100%', unit: '%', status: 'Active' },
      { name: 'Base Excess – Extracellular Fluid (BEecf)', referenceRange: '−2 to +2', unit: 'mEq/L', status: 'Active' },
      { name: 'Hemoglobin', referenceRange: 'Male: ~13.8–17.2; Female: ~12.1–15.1', unit: 'g/dL', status: 'Active' }
    ];

    const testPayload = {
      hospitalId: null,
      category: 'LAB',
      categoryKey: 'lab',
      test: 'ABG(Arterial Blood gas)',
      testKey: 'abg(arterial blood gas)',
      title: 'ABG(Arterial Blood gas)',
      description: 'Arterial Blood Gas Analysis',
      notes: '',
      basePrice: 600,
      taxPercentage: 0,
      totalAmount: 600,
      isManualTotal: false,
      parameters,
      status: 'Active'
    };

    // First delete if it exists under hospitalId: null to avoid duplication issues
    await LabTest.deleteOne({ hospitalId: null, testKey: 'abg(arterial blood gas)' });

    const doc = await LabTest.create(testPayload);
    console.log('Successfully seeded ABG(Arterial Blood gas) test template with ID:', doc._id);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding ABG test:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAbgTest();
