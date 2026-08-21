const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const standardTests = [
  {
    category: 'LAB',
    test: 'Adenosine Deaminase (ADA)',
    title: 'Adenosine Deaminase (ADA)',
    basePrice: 550,
    taxPercentage: 0,
    sampleType: 'Fluid / Serum',
    turnaroundTime: '4 Hours',
    description: 'Adenosine Deaminase (ADA) activity estimation in Pleural fluid, Ascitic fluid, CSF or Blood Serum.',
    notes: '',
    interpretation: 'ADA values interpreted in clinical context. Elevated in Tuberculosis.',
    parameters: [
      {
        name: 'Sample Type',
        referenceRange: '',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Pleural fluid', isAbnormal: false },
          { value: 'Ascitic fluid', isAbnormal: false },
          { value: 'CSF (cerebrospinal fluid)', isAbnormal: false },
          { value: 'Blood serum', isAbnormal: false }
        ],
        status: 'Active'
      },
      {
        name: 'Result',
        referenceRange: '0 - 40',
        unit: 'U/L',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Absolute Eosinophil Count (AEC)',
    title: 'Absolute Eosinophil Count (AEC)',
    basePrice: 250,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '2 Hours',
    description: 'Measures the absolute number of eosinophils in a given volume of blood.',
    notes: '',
    interpretation: 'Physiological basis\nThe Absolute Eosinophil Count (AEC) is a measure of the number of eosinophils, a type of white blood cell, in a given volume of blood. The Absolute Eosinophil Count (AEC) is calculated by multiplying the percentage of eosinophils in the total white blood cell count by the total white blood cell count.\n\nElevated AEC (Eosinophilia):\n- Allergic Reactions\n- Parasitic Infections\n- Autoimmune Diseases\n\nLow AEC:\n- Acute Infections\n- Adrenal Insufficiency\n\nComments:\nThe AEC is typically assessed as part of a complete blood count (CBC) with a differential. If your AEC is outside the normal range, it\'s important to consult with a healthcare provider to determine the underlying cause and appropriate treatment.',
    parameters: [
      {
        name: 'Absolute Eosinophil Count',
        referenceRange: '0 - 440',
        unit: 'cumm',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Acid - Fast Bacilli (AFB)',
    title: 'Acid - Fast Bacilli (AFB)',
    basePrice: 300,
    taxPercentage: 0,
    sampleType: 'Sputum / Body Fluid',
    turnaroundTime: '24 Hours',
    description: 'Microscopic examination for Acid-Fast Bacilli (AFB) to detect Mycobacterial infections.',
    notes: '',
    interpretation: 'Note:\nA positive Acid-Fast Bacillus (AFB) smear result provides an initial indication of a Mycobacterial infection, the relative bacterial burden and correlate with the clinical presentation of the disease. Conversely, a negative AFB smear may indicate the absence of Mycobacterial infection or that the bacteria are not detected under the microscope. It does not, however, differentiate between viable and non-viable organisms, nor does it distinguish between different Mycobacterial species.\n\nUsage:\nThis test is employed to detect acid-fast bacteria, primarily Mycobacterium tuberculosis, for the purposes of diagnosing and monitoring tuberculosis.',
    parameters: [
      {
        name: 'Sample Type',
        referenceRange: '',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Sputum', isAbnormal: false },
          { value: 'CSF Fluid', isAbnormal: false },
          { value: 'Pleural Fluid', isAbnormal: false },
          { value: 'Ascitic Fluid', isAbnormal: false }
        ],
        status: 'Active'
      },
      {
        name: 'Result',
        referenceRange: '',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Positive After 1st Day', isAbnormal: true },
          { value: 'Positive After 2nd Day', isAbnormal: true },
          { value: 'Positive After 3rd Day', isAbnormal: true },
          { value: 'Negative After 1st Day', isAbnormal: false },
          { value: 'Negative After 2nd Day', isAbnormal: false },
          { value: 'Negative After 3rd Day', isAbnormal: false },
          { value: 'No AFB Seen', isAbnormal: false }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'AFP(Alfa Fetoprotein)',
    title: 'AFP(Alfa Fetoprotein)',
    basePrice: 850,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '24 Hours',
    description: 'Quantitative measurement of Alpha-fetoprotein (AFP) level in serum as a tumor and fetal biomarker.',
    notes: '',
    interpretation: 'Alpha-fetoprotein (AFP) is a crucial protein found in fetal serum, serving a physiological role akin to that of albumin. It is primarily produced in the yolk sac, the fetal liver, and the fetal gastrointestinal tract. However, shortly after birth, AFP levels drop precipitously, becoming virtually undetectable. In healthy adults, AFP levels are typically below 5.4 ng/mL.\n\nWhile elevated AFP levels can occur in various benign conditions, a level exceeding 500 ng/mL is rarely associated with non-malignant issues. During a normal pregnancy, AFP levels may rise but generally do not exceed 100 ng/mL. Elevated AFP levels are also observed in chronic liver diseases such as cirrhosis and hepatitis.\n\nAFP plays a pivotal role in the detection of hepatocellular carcinoma and yolk sac tumors. Additionally, it may be sporadically elevated in other malignancies, including certain hepatoid variants of gastric carcinoma. In the case of yolk sac tumors, the AFP level is closely linked to prognosis, with levels surpassing 10,000 ng/mL indicating a poor outcome. For hepatocellular carcinoma, AFP elevation is reported in approximately 70% of patients, underscoring its significance as a biomarker in the diagnosis and management of liver cancer.',
    parameters: [
      {
        name: 'AFP(Alfa Fetoprotein)',
        referenceRange: '< 10',
        unit: 'ng/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'A/G Ratio',
    title: 'A/G Ratio',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '4 Hours',
    description: 'Calculates the ratio of Albumin to Globulin in blood serum.',
    notes: '',
    interpretation: 'The Albumin to Globulin (A/G) ratio is a calculated value obtained by dividing the albumin concentration by the globulin concentration (calculated as Total Protein minus Albumin). A normal ratio is between 1.1 and 2.1. A low A/G ratio may indicate overproduction of globulins (e.g., in multiple myeloma or autoimmune diseases) or underproduction of albumin (e.g., in cirrhosis or nephrotic syndrome).',
    parameters: [
      {
        name: 'A/G Ratio',
        referenceRange: '1.1 - 2.1',
        unit: '',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'AMH(Anti Mullerian Hormone)',
    title: 'AMH(Anti Mullerian Hormone)',
    basePrice: 1500,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '24 Hours',
    description: 'Quantitative measurement of Anti-Müllerian Hormone (AMH) to assess ovarian reserve and fertility.',
    notes: '',
    interpretation: 'Notes\nAnti-Müllerian Hormone (AMH) starts to drop several years before Follicle-Stimulating Hormone (FSH) levels increase. Because of this, AMH is a more sensitive indicator of ovarian reserve. Sometimes, AMH levels and Antral Follicle Count (AFC) can give different results. AMH reflects the overall number of early-stage follicles that aren\'t visible yet, while AFC counts only the follicles that can be seen on an ultrasound.\n\nInterpretation:\nAMH LEVEL IN ng/mL | Remarks\n<0.50 | Predictive of poor response\n0.50 - <1.0 | Suggestive of limited ovarian reserve\n1.00 - 3.50 | Predictive of optimal response\n>3.50 | Predictive of Ovarian hyperstimulation syndrome / PCOS\n\nComment\nAntimüllerian Hormone (AMH) is produced by Sertoli cells in males and granulosa cells in females. In males, AMH levels are high in infancy, drop before puberty, and decrease sharply during puberty. In females, AMH is made by small follicles from around 36 weeks of pregnancy until menopause, when levels become very low. AMH is a valuable marker for assessing gender, fertility, and gonadal tumors. It provides a steady measure of ovarian reserve throughout the menstrual cycle. Women with higher AMH levels generally respond better to fertility treatments and produce more eggs. Elevated AMH can also indicate risks such as ovarian hyperstimulation syndrome or conditions like Polycystic Ovary Syndrome (PCOS). Additionally, high AMH levels can be seen in some ovarian tumors.\n\nClinical Applications of AMH:\n1. Assess Ovarian Health\n2. Check Menopausal Status\n3. Evaluate PCOS\n4. Examine Infants with Ambiguous Genitalia\n5. Testicular Function in Children\n6. Diagnose and Monitor Tumors',
    parameters: [
      {
        name: 'AMH(Anti Mullerian Hormone)',
        referenceRange: '',
        unit: 'ng/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'CCP(Cyclic-citrullinated-peptide)',
    title: 'CCP(Cyclic-citrullinated-peptide)',
    basePrice: 1200,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '24 Hours',
    description: 'Quantitative determination of Anti-Cyclic Citrullinated Peptide (Anti-CCP) antibodies in human serum for rheumatoid arthritis diagnosis.',
    notes: '',
    interpretation: 'Physiological Basis\nPost-translational deamination of arginine residues by peptidyl arginine deaminase (citrullination) during inflammation results in production of antigenic epitope. Antibodies to citrullinated proteins (particularly filaggrin) are frequently elevated in rheumatoid arthritis (RA).\n\nInterpretation: Increased in- RA (sensitivity 70–80%).\n\nComments: Specificity of anti-CCP (90–95%) for RA is higher than that of rheumatoid factor.',
    parameters: [
      {
        name: 'Anti cyclic-citrullinated-peptide',
        referenceRange: '< 5',
        unit: 'U/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  }
];

const seedStandardLabTemplates = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    await mongoose.connect(mongoUri);
    console.log('Connected to database successfully.');

    let count = 0;
    for (const item of standardTests) {
      const catKey = normalizeKey(item.category);
      const testKey = normalizeKey(item.test);

      // Ensure category exists
      await LabTestCategory.findOneAndUpdate(
        { hospitalId: null, nameKey: catKey },
        {
          $setOnInsert: {
            hospitalId: null,
            name: item.category,
            nameKey: catKey,
            status: 'Active'
          }
        },
        { upsert: true, setDefaultsOnInsert: true }
      );

      // Upsert the test template
      const payload = {
        hospitalId: null,
        category: item.category,
        categoryKey: catKey,
        test: item.test,
        testKey: testKey,
        title: item.title,
        description: item.description,
        notes: item.notes || '',
        interpretation: item.interpretation || '',
        basePrice: item.basePrice,
        taxPercentage: item.taxPercentage || 0,
        totalAmount: item.basePrice,
        isManualTotal: false,
        sampleType: item.sampleType || '',
        turnaroundTime: item.turnaroundTime || '',
        parameters: item.parameters,
        status: 'Active'
      };

      await LabTest.findOneAndUpdate(
        { hospitalId: null, categoryKey: catKey, testKey: testKey },
        { $set: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      count++;
      console.log(`Saved template: [${item.category}] ${item.title}`);
    }

    console.log(`Successfully seeded ${count} standard test templates.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding standard lab templates:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedStandardLabTemplates();
