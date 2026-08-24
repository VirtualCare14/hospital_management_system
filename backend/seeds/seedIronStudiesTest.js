const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const ironStudiesInterpretationHtml = `<p><strong>Physiological basis</strong><br />Plasma iron concentration is determined by absorption from the intestine; storage in the intestine, liver, spleen, bone marrow, rate of breakdown or loss of hemoglobin, and rate of synthesis of new hemoglobin.</p>

<p><strong>Interpretation for Iron (Fe), serum or plasma</strong></p>
<table style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 10px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 50%;">Increased</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 50%;">Decreased</th>
    </tr>
  </thead>
  <tbody>
    <tr style="vertical-align: top;">
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">
        Hemosiderosis (eg, multiple transfusions, excess iron administration), acute Fe poisoning (children), hemolytic anemia, pernicious anemia, aplastic or hypoplastic anemia, viral hepatitis, lead poisoning, thalassemia, hemochromatosis. Drugs: estrogens, ethanol, oral contraceptives.
      </td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">
        Iron deficiency, nephrotic syndrome, chronic renal failure, many infections, active hematopoiesis, remission of pernicious anemia, hypothyroidism, malignancy (carcinoma), postoperative state, kwashiorkor.
      </td>
    </tr>
  </tbody>
</table>

<p>TIBC correlates with serum transferrin, but the relationship is not linear over a wide range of transferrin values and is disrupted in diseases affecting transferrin-binding capacity or other iron-binding proteins.<br />
<strong>Increased in:</strong> Iron deficiency anemia, late pregnancy, infancy, acute hepatitis. Drugs: oral contraceptives.<br />
<strong>Decreased in:</strong> Hypoproteinemic states (eg, nephrotic syndrome, starvation, malnutrition, cancer), hemochromatosis, thalassemia, hyperthyroidism, chronic infections, chronic inflammatory disorders, chronic liver disease, and other chronic diseases.</p>

<p><strong>Increased % transferrin saturation</strong> with iron is seen in iron overload (iron poisoning, hemolytic anemia, sideroblastic anemia, thalassemia, hemochromatosis, pyridoxine deficiency, aplastic anemia, RBC transfusions).<br />
<strong>Decreased % transferrin saturation</strong> with iron is seen in iron deficiency (usually saturation &lt; 16%). It can also be used to assess nutritional status.</p>`;

const ironStudiesData = {
  category: 'LAB',
  test: 'Iron studies',
  title: 'Iron studies',
  basePrice: 700,
  taxPercentage: 0,
  totalAmount: 700,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '4 Hours',
  department: 'BIOCHEMISTRY',
  description: 'Iron Studies profile evaluating Serum Iron, Total Iron Binding Capacity (TIBC), UIBC, and Transferrin Saturation percentage.',
  notes: '',
  interpretation: ironStudiesInterpretationHtml,
  forGender: 'Both',
  parameters: [
    {
      name: 'Iron',
      displayName: 'Iron',
      unit: 'µg/dl',
      referenceRange: '65 - 175',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'UIBC',
      displayName: 'UIBC',
      unit: 'µg/dl',
      referenceRange: '155 - 355',
      formula: 'Formula: UIBC = TIBC − Iron',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Total Iron Binding Capacity (TIBC)',
      displayName: 'Total Iron Binding Capacity (TIBC)',
      unit: 'µg/dl',
      referenceRange: '240 - 450',
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    },
    {
      name: 'Transferrin Saturation',
      displayName: 'Transferrin Saturation',
      unit: '%',
      referenceRange: '20 - 55',
      formula: 'Formula: Transferrin Saturation (%) = (Iron ÷ TIBC) × 100',
      isCalculated: true,
      fieldType: 'Number',
      gender: 'Both',
      valueOptions: [],
      status: 'Active'
    }
  ]
};

async function seedIronStudies() {
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
    const testKey = normalizeKey(ironStudiesData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...ironStudiesData,
      categoryKey: normalizeKey(ironStudiesData.category),
      testKey: testKey
    });

    console.log(`Successfully created Iron studies template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding Iron Studies test:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedIronStudies();
}

module.exports = { ironStudiesData, seedIronStudies };
