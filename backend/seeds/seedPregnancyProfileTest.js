const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const pregnancyProfileInterpretationHtml = `<h4>Blood Group &amp; Rh.</h4>
<p><strong>Physiologic Basis</strong><br />
The ABO antigen and antibodies remain the most significant for transfusion practice. The 4 blood groups A, B, O, and AB are determined by the presence or absence of A and B antigens on RBCs and anti-A or anti-B antibodies in plasma.</p>

<p><strong>Interpretation</strong><br />
Type O patients can receive type O red cells and type A, B, O, or AB plasma. Type A patients can receive type A or O red cells and type A or AB plasma. Type B patients can receive type B or O red cells and type B or AB plasma. Type AB patients can receive type A, B, AB, or O red cells but only type AB plasma. In an emergency situation, type O red cells and type AB plasma may be given to patients with any ABO blood types.</p>

<h4>HBsAg Serology Interpretation</h4>
<table style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 10px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 25%;">Comment</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 75%;">Interpretation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">Non-Reactive</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Hepatitis B surface antigen not detected. Patient is non-infectious.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold; color: #dc2626;">Reactive</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Indicates acute or chronic Hepatitis B viral infection. Recommend confirmatory HBV DNA and liver enzyme evaluation.</td>
    </tr>
  </tbody>
</table>

<h4>VDRL &amp; HIV Interpretation</h4>
<p>Non-Reactive results indicate absence of detectable antibodies. Reactive/Positive results should be verified with confirmatory tests (Western Blot / TPHA / PCR) in accordance with antenatal clinical guidelines.</p>`;

const pregnancyProfileData = {
  category: 'LAB',
  test: 'Pregnancy Profile',
  title: 'Pregnancy Profile',
  basePrice: 1500,
  taxPercentage: 0,
  totalAmount: 1500,
  isManualTotal: false,
  sampleType: 'Whole Blood / Serum & Urine',
  turnaroundTime: '4 Hours',
  department: 'PATHOLOGY',
  description: 'Comprehensive Antenatal Pregnancy Profile including Hemoglobin, Blood Group & Rh, Random Blood Sugar, HIV 1 & 2, VDRL, HBsAg, and Urine Routine Examination.',
  notes: '',
  interpretation: pregnancyProfileInterpretationHtml,
  forGender: 'Female',
  status: 'Active',
  parameters: [
    // ==========================================
    // 1. HAEMATOLOGY
    // ==========================================
    {
      name: 'Hemoglobin',
      displayName: 'Hemoglobin',
      group: 'HAEMATOLOGY',
      unit: 'g/dl',
      referenceRange: '13 - 17',
      fieldType: 'Number',
      gender: 'Both',
      status: 'Active',
      referenceRules: [
        {
          sex: 'Female',
          minAge: 0,
          maxAge: 100,
          minAgeUnit: 'Years',
          maxAgeUnit: 'Years',
          lowerValue: '11.5',
          upperValue: '15.0',
          displayedValue: '11.5 - 15.0'
        },
        {
          sex: 'Any',
          minAge: 0,
          maxAge: 100,
          minAgeUnit: 'Years',
          maxAgeUnit: 'Years',
          lowerValue: '13',
          upperValue: '17',
          displayedValue: '13 - 17'
        }
      ]
    },

    // Blood Group & Rh. -> ABO
    {
      name: 'ABO',
      displayName: 'ABO',
      group: 'Blood Group & Rh.',
      unit: '',
      referenceRange: '',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'A', isAbnormal: false },
        { value: 'B', isAbnormal: false },
        { value: 'O', isAbnormal: false },
        { value: 'AB', isAbnormal: false }
      ]
    },

    // Blood Group & Rh. -> Rh (ANTI -D)
    {
      name: 'Rh (ANTI -D)',
      displayName: 'Rh (ANTI -D)',
      group: 'Blood Group & Rh.',
      unit: '',
      referenceRange: '',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Positive', isAbnormal: false },
        { value: 'Negative', isAbnormal: false },
        { value: 'POSITIVE', isAbnormal: false },
        { value: 'NEGATIVE', isAbnormal: false }
      ]
    },

    // ==========================================
    // 2. BIOCHEMISTRY
    // ==========================================
    {
      name: 'Random Blood Sugar',
      displayName: 'Random Blood Sugar',
      group: 'BIOCHEMISTRY',
      unit: 'mg/dl',
      referenceRange: '70 - 140',
      fieldType: 'Number',
      gender: 'Both',
      status: 'Active',
      referenceRules: [
        {
          sex: 'Any',
          minAge: 0,
          maxAge: 100,
          minAgeUnit: 'Years',
          maxAgeUnit: 'Years',
          lowerValue: '70',
          upperValue: '140',
          displayedValue: '70 - 140'
        }
      ]
    },

    // ==========================================
    // 3. SEROLOGY & IMMUNOLOGY
    // ==========================================
    {
      name: 'HIV - 1',
      displayName: 'HIV - 1',
      group: 'HIV (Card Test)',
      unit: '',
      referenceRange: 'NON-REACTIVE',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'NON-REACTIVE', isAbnormal: false },
        { value: 'NEGATIVE', isAbnormal: false },
        { value: 'POSITIVE', isAbnormal: true },
        { value: 'REACTIVE', isAbnormal: true }
      ]
    },
    {
      name: 'HIV - 2',
      displayName: 'HIV - 2',
      group: 'HIV (Card Test)',
      unit: '',
      referenceRange: 'NON-REACTIVE',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'NON-REACTIVE', isAbnormal: false },
        { value: 'NEGATIVE', isAbnormal: false },
        { value: 'POSITIVE', isAbnormal: true },
        { value: 'REACTIVE', isAbnormal: true }
      ]
    },
    {
      name: 'VDRL',
      displayName: 'VDRL',
      group: 'SEROLOGY & IMMUNOLOGY',
      unit: '',
      referenceRange: 'NON-REACTIVE',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'NON-REACTIVE', isAbnormal: false },
        { value: 'REACTIVE', isAbnormal: true }
      ]
    },
    {
      name: 'HBsAg',
      displayName: 'HBsAg',
      group: 'SEROLOGY & IMMUNOLOGY',
      unit: '',
      referenceRange: 'NEGATIVE',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'NEGATIVE', isAbnormal: false },
        { value: 'POSITIVE', isAbnormal: true },
        { value: 'Non-Reactive', isAbnormal: false },
        { value: 'Reactive', isAbnormal: true }
      ]
    },

    // ==========================================
    // 4. URINE ROUTINE EXAMINATION
    // ==========================================
    // Physical Examination
    {
      name: 'Quantity',
      displayName: 'Quantity',
      group: 'Physical Examination',
      unit: 'ml',
      referenceRange: '',
      fieldType: 'Number',
      gender: 'Both',
      status: 'Active'
    },
    {
      name: 'Colour',
      displayName: 'Colour',
      group: 'Physical Examination',
      unit: '',
      referenceRange: 'Pale Yellow',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Pale Yellow', isAbnormal: false },
        { value: 'Yellow', isAbnormal: false },
        { value: 'Straw', isAbnormal: false },
        { value: 'Clear', isAbnormal: false },
        { value: 'Dark Yellow', isAbnormal: true },
        { value: 'Amber', isAbnormal: true }
      ]
    },
    {
      name: 'Transparency',
      displayName: 'Transparency',
      group: 'Physical Examination',
      unit: '',
      referenceRange: 'Clear',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Clear', isAbnormal: false },
        { value: 'Slightly Turbid', isAbnormal: true },
        { value: 'Turbid', isAbnormal: true },
        { value: 'Hazy', isAbnormal: true }
      ]
    },
    {
      name: 'Specific Gravity',
      displayName: 'Specific Gravity',
      group: 'Physical Examination',
      unit: '',
      referenceRange: '1.005 - 1.03',
      fieldType: 'Text',
      gender: 'Both',
      status: 'Active'
    },
    {
      name: 'pH',
      displayName: 'pH',
      group: 'Physical Examination',
      unit: '',
      referenceRange: '5 - 7',
      fieldType: 'Text',
      gender: 'Both',
      status: 'Active'
    },
    {
      name: 'Leukocytes (Optional)',
      displayName: 'Leukocytes (Optional)',
      group: 'Physical Examination',
      unit: '',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Present', isAbnormal: true },
        { value: 'Trace', isAbnormal: true },
        { value: '+', isAbnormal: true },
        { value: '++', isAbnormal: true },
        { value: '+++', isAbnormal: true }
      ]
    },
    {
      name: 'Blood (Optional)',
      displayName: 'Blood (Optional)',
      group: 'Physical Examination',
      unit: '',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Present', isAbnormal: true },
        { value: 'Trace', isAbnormal: true },
        { value: '+', isAbnormal: true },
        { value: '++', isAbnormal: true },
        { value: '+++', isAbnormal: true }
      ]
    },

    // Chemical Examination
    {
      name: 'Protein / Albumin',
      displayName: 'Protein / Albumin',
      group: 'Chemical Examination',
      unit: '',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Nil', isAbnormal: false },
        { value: 'Trace', isAbnormal: true },
        { value: '+', isAbnormal: true },
        { value: '++', isAbnormal: true },
        { value: '+++', isAbnormal: true }
      ]
    },
    {
      name: 'Sugar / Glucose',
      displayName: 'Sugar / Glucose',
      group: 'Chemical Examination',
      unit: '',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Nil', isAbnormal: false },
        { value: 'Trace', isAbnormal: true },
        { value: '+', isAbnormal: true },
        { value: '++', isAbnormal: true },
        { value: '+++', isAbnormal: true }
      ]
    },
    {
      name: 'Ketone Bodies (Optional)',
      displayName: 'Ketone Bodies (Optional)',
      group: 'Chemical Examination',
      unit: '',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Present', isAbnormal: true },
        { value: 'Trace', isAbnormal: true },
        { value: '+', isAbnormal: true },
        { value: '++', isAbnormal: true }
      ]
    },
    {
      name: 'Bilirubin (Optional)',
      displayName: 'Bilirubin (Optional)',
      group: 'Chemical Examination',
      unit: '',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Present', isAbnormal: true },
        { value: 'Trace', isAbnormal: true },
        { value: '+', isAbnormal: true }
      ]
    },
    {
      name: 'Nitrite (Optional)',
      displayName: 'Nitrite (Optional)',
      group: 'Chemical Examination',
      unit: '',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Present', isAbnormal: true }
      ]
    },

    // Microscopic Examination
    {
      name: 'R.B.C.',
      displayName: 'R.B.C.',
      group: 'Microscopic Examination',
      unit: '/HPF',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Nil', isAbnormal: false },
        { value: '0-2', isAbnormal: false },
        { value: '2-4', isAbnormal: true },
        { value: '4-6', isAbnormal: true },
        { value: 'Plenty', isAbnormal: true }
      ]
    },
    {
      name: 'Pus Cells',
      displayName: 'Pus Cells',
      group: 'Microscopic Examination',
      unit: '/HPF',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: '0-2', isAbnormal: false },
        { value: '2-4', isAbnormal: false },
        { value: '4-6', isAbnormal: true },
        { value: '8-10', isAbnormal: true },
        { value: 'Plenty', isAbnormal: true }
      ]
    },
    {
      name: 'Epithilial Cells',
      displayName: 'Epithilial Cells',
      group: 'Microscopic Examination',
      unit: '/HPF',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Few', isAbnormal: false },
        { value: 'Moderate', isAbnormal: false },
        { value: '0-2', isAbnormal: false },
        { value: '2-4', isAbnormal: false },
        { value: 'Plenty', isAbnormal: true }
      ]
    },
    {
      name: 'Casts',
      displayName: 'Casts',
      group: 'Microscopic Examination',
      unit: '',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Present', isAbnormal: true },
        { value: 'Hyaline Casts', isAbnormal: true },
        { value: 'Granular Casts', isAbnormal: true },
        { value: 'Cellular Casts', isAbnormal: true }
      ]
    },
    {
      name: 'Crystals',
      displayName: 'Crystals',
      group: 'Microscopic Examination',
      unit: '',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Present', isAbnormal: true },
        { value: 'Calcium Oxalate', isAbnormal: true },
        { value: 'Uric Acid', isAbnormal: true },
        { value: 'Triple Phosphate', isAbnormal: true }
      ]
    },
    {
      name: 'Bacteria',
      displayName: 'Bacteria',
      group: 'Microscopic Examination',
      unit: '',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Present', isAbnormal: true },
        { value: 'Few', isAbnormal: true },
        { value: 'Moderate', isAbnormal: true },
        { value: 'Plenty', isAbnormal: true }
      ]
    },
    {
      name: 'Others (Optional)',
      displayName: 'Others (Optional)',
      group: 'Microscopic Examination',
      unit: '',
      referenceRange: 'Absent',
      fieldType: 'Select',
      gender: 'Both',
      status: 'Active',
      valueOptions: [
        { value: 'Absent', isAbnormal: false },
        { value: 'Mucus Threads', isAbnormal: false },
        { value: 'Yeast Cells', isAbnormal: true },
        { value: 'Trichomonas', isAbnormal: true }
      ]
    }
  ]
};

async function seedPregnancyProfile() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB database.');

    // Ensure LAB category exists
    await LabTestCategory.findOneAndUpdate(
      { name: 'LAB' },
      { name: 'LAB', status: 'Active' },
      { upsert: true, returnDocument: 'after' }
    );

    const testKey = normalizeKey(pregnancyProfileData.test);
    
    // Check if test exists, update or create
    const existing = await LabTest.findOne({ testKey });
    if (existing) {
      existing.title = pregnancyProfileData.title;
      existing.category = pregnancyProfileData.category;
      existing.basePrice = pregnancyProfileData.basePrice;
      existing.totalAmount = pregnancyProfileData.totalAmount;
      existing.description = pregnancyProfileData.description;
      existing.interpretation = pregnancyProfileData.interpretation;
      existing.forGender = pregnancyProfileData.forGender;
      existing.parameters = pregnancyProfileData.parameters;
      existing.sampleType = pregnancyProfileData.sampleType;
      existing.status = 'Active';
      await existing.save();
      console.log(`Updated existing Pregnancy Profile template with complete fields (ID: ${existing._id})`);
    } else {
      const created = await LabTest.create({
        hospitalId: null,
        ...pregnancyProfileData,
        categoryKey: normalizeKey(pregnancyProfileData.category),
        testKey
      });
      console.log(`Successfully created complete Pregnancy Profile template (ID: ${created._id})`);
    }

    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error seeding Pregnancy Profile:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedPregnancyProfile();
}

module.exports = { pregnancyProfileData, seedPregnancyProfile };
