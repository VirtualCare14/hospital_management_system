const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const gbpInterpretationHtml = `<p><strong>Clinical Notes:</strong><br />A complete blood count (CBC) is used to evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia. There have been some reports of WBC and platelet counts being lower in venous blood than in capillary blood samples, although still within these reference ranges.</p>
<p><strong>Possible causes of abnormal parameters:</strong></p>
<table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 25%;"></th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 37.5%;">High</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 37.5%;">Low</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">RBC, Hb, or HCT</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Dehydration, polycythemia, shock, chronic hypoxia</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Anemia, thalassemia, and other hemoglobinopathies</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">MCV</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Macrocytic anemia, liver disease</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Microcytic anemia</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">WBC</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Acute stress, infection, malignancies</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Sepsis, marrow hypoplasia</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">Platelets</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Risk of thrombosis</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Risk of bleeding</td>
    </tr>
  </tbody>
</table>
<p style="margin-top: 12px;"><strong>Peripheral Blood Smear</strong></p>
<p><strong>RBCs -</strong> Normocytic normochromic.</p>
<p><strong>WBCs -</strong> Normal</p>
<p><strong>Platelets -</strong> Adequate in number.</p>
<p><strong>Impression -</strong> </p>`;

const cbcWithGbpData = {
  category: 'LAB',
  test: 'CBC with GBP',
  title: 'CBC with GBP',
  basePrice: 450,
  taxPercentage: 0,
  totalAmount: 450,
  isManualTotal: false,
  sampleType: 'Whole Blood (EDTA)',
  turnaroundTime: '2 Hours',
  description: 'Complete Blood Count (CBC) with General Blood Picture (GBP / Peripheral Blood Smear), Differential Leucocyte Count and Clinical Interpretation Table.',
  notes: '',
  interpretation: gbpInterpretationHtml,
  forGender: 'Both',
  parameters: [
    {
      name: 'Hemoglobin',
      unit: 'g/dl',
      referenceRange: '13 - 17',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Total Leukocyte Count',
      unit: 'cumm',
      referenceRange: '4,800 - 10,800',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    // Differential Leucocyte Count Group
    {
      name: 'Neutrophils',
      group: 'Differential Leucocyte Count',
      unit: '%',
      referenceRange: '40 - 80',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Lymphocyte',
      group: 'Differential Leucocyte Count',
      unit: '%',
      referenceRange: '20 - 40',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Eosinophils',
      group: 'Differential Leucocyte Count',
      unit: '%',
      referenceRange: '1 - 6',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Monocytes',
      group: 'Differential Leucocyte Count',
      unit: '%',
      referenceRange: '2 - 10',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Basophils',
      group: 'Differential Leucocyte Count',
      unit: '%',
      referenceRange: '< 2',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    // Other CBC parameters
    {
      name: 'Platelet Count',
      unit: 'lakhs/cumm',
      referenceRange: '1.5 - 4.1',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Total RBC Count',
      unit: 'million/cumm',
      referenceRange: '4.5 - 5.5',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Hematocrit Value, Hct',
      unit: '%',
      referenceRange: '40 - 50',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Mean Corpuscular Volume, MCV',
      unit: 'fL',
      referenceRange: '83 - 101',
      formula: 'Formula: MCV = (Hct * 10) / RBC in millions',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Mean Cell Haemoglobin, MCH',
      unit: 'Pg',
      referenceRange: '27 - 32',
      formula: 'Formula: MCH = (Hb * 10) / RBC in millions',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Mean Cell Haemoglobin CON, MCHC',
      unit: '%',
      referenceRange: '31.5 - 34.5',
      formula: 'Formula: MCHC = (Hb * 100) / Hct',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Mean Platelet Volume, MPV (Optional)',
      unit: 'fL',
      referenceRange: '6.5 - 12',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'R.D.W. - SD (Optional)',
      unit: 'fL',
      referenceRange: '39 - 46',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'R.D.W. - CV (Optional)',
      unit: '%',
      referenceRange: '11.6 - 14',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'P-LCR (Optional)',
      unit: '%',
      referenceRange: '19.7 - 42.4',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'P.D.W. (Optional)',
      unit: 'fL',
      referenceRange: '9.6 - 15.2',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedCbcWithGbp() {
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
    const testKey = normalizeKey(cbcWithGbpData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...cbcWithGbpData,
      categoryKey: normalizeKey(cbcWithGbpData.category),
      testKey: testKey
    });

    console.log(`Successfully created CBC with GBP template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding CBC with GBP:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedCbcWithGbp();
}

module.exports = { cbcWithGbpData, seedCbcWithGbp };
