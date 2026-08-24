const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const viralMarkerInterpretationHtml = `<p><strong>HbsAg</strong> is the first serologic marker appearing in the serum 6-16 weeks following hepatitis B viral infection. In typical HBV infection, HBsAg will be detected 2-4 weeks before the liver enzyme levels (ALT) become abnormal and 3-5 weeks before the patient develops jaundice. In acute cases HbsAg usually disappears 1-2 months after the onset of symptoms. Persistence of HbsAg for more than 6 months indicates development of either a chronic carrier state or chronic liver disease. The presence of HbsAg is frequently associated with infectivity. HbsAg when accompanied by Hepatitis Be antigen and/or hepatitis B viral DNA almost always indicates infectivity.</p>

<p><strong>Anti HCV card test interpretation</strong><br />Reactive test result indicates presence of Hepatitis C virus infection. Active infection to be confirmed by HCV RNA PCR test. It cannot differentiate between the stages of Hepatitis C viral infection nor used to monitor the efficacy of treatment. Non-Reactive test result indicates Hepatitis C virus infection is unlikely.</p>

<p><strong>HIV Interpretation</strong><br />A negative result implies that no Anti HIV-1 &amp; HIV-2 antibodies have been detected in the sample by this method. This means that either the patient has not been exposed to HIV-1 or HIV-2 infection or the sample has been tested during the &quot;WINDOW PHASE&quot; (before the development of detectable levels of antibodies). A positive result suggests the possibilities of HIV-I and / or HIV-II infection. However these results must be verified by a confirmatory test (IFA / WESTERN BLOT I-II) before pronouncing the patient positive for HIV-1 and / or HIV-2 infection. All reactive samples should be confirmed by using HIV Western Blot/PCR.</p>

<p><strong>VDRL Interpretation</strong></p>
<table style="width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 10px;" border="1" cellpadding="6">
  <thead>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 25%;">Result</th>
      <th style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; width: 75%;">Remarks</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">Reactive</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Indicates the presence of IgM &amp; IgG antibodies against non-treponemal antigens</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold;">Non-Reactive</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Indicates absence of IgM &amp; IgG antibodies against non-treponemal antigens</td>
    </tr>
  </tbody>
</table>`;

const viralMarkerData = {
  category: 'LAB',
  test: 'Viral Marker',
  title: 'VIRAL MARKER',
  basePrice: 900,
  taxPercentage: 0,
  totalAmount: 900,
  isManualTotal: false,
  sampleType: 'Serum',
  turnaroundTime: '2 Hours',
  department: 'SEROLOGY & IMMUNOLOGY',
  description: 'Viral Marker screening panel for HIV 1 & 2, VDRL, HCV (Hepatitis C), and HBsAg (Hepatitis B Surface Antigen).',
  notes: '',
  interpretation: viralMarkerInterpretationHtml,
  forGender: 'Both',
  parameters: [
    {
      name: 'HIV - 1',
      displayName: 'HIV - 1',
      group: 'HIV (Card Test)',
      unit: '',
      referenceRange: 'Non-Reactive',
      fieldType: 'Text',
      gender: 'Both',
      valueOptions: [
        { value: 'Non-Reactive', isAbnormal: false },
        { value: 'Reactive', isAbnormal: true }
      ],
      status: 'Active'
    },
    {
      name: 'HIV - 2',
      displayName: 'HIV - 2',
      group: 'HIV (Card Test)',
      unit: '',
      referenceRange: 'Non-Reactive',
      fieldType: 'Text',
      gender: 'Both',
      valueOptions: [
        { value: 'Non-Reactive', isAbnormal: false },
        { value: 'Reactive', isAbnormal: true }
      ],
      status: 'Active'
    },
    {
      name: 'VDRL',
      displayName: 'VDRL',
      unit: '',
      referenceRange: 'Non-Reactive',
      fieldType: 'Text',
      gender: 'Both',
      valueOptions: [
        { value: 'Non-Reactive', isAbnormal: false },
        { value: 'Reactive', isAbnormal: true }
      ],
      status: 'Active'
    },
    {
      name: 'Hepatitis C Virus, HCV',
      displayName: 'Hepatitis C Virus, HCV',
      unit: '',
      referenceRange: 'Non-Reactive',
      fieldType: 'Text',
      gender: 'Both',
      valueOptions: [
        { value: 'Non-Reactive', isAbnormal: false },
        { value: 'Reactive', isAbnormal: true }
      ],
      status: 'Active'
    },
    {
      name: 'HBsAg',
      displayName: 'HBsAg',
      unit: '',
      referenceRange: 'Non-Reactive',
      fieldType: 'Text',
      gender: 'Both',
      valueOptions: [
        { value: 'Non-Reactive', isAbnormal: false },
        { value: 'Reactive', isAbnormal: true }
      ],
      status: 'Active'
    }
  ]
};

async function seedViralMarker() {
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
    const testKey = normalizeKey(viralMarkerData.test);
    await LabTest.deleteMany({ testKey: testKey });

    const createdTest = await LabTest.create({
      hospitalId: null,
      ...viralMarkerData,
      categoryKey: normalizeKey(viralMarkerData.category),
      testKey: testKey
    });

    console.log(`Successfully created Viral Marker template with ID: ${createdTest._id}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding Viral Marker test:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedViralMarker();
}

module.exports = { viralMarkerData, seedViralMarker };
