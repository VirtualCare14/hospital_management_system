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
  },
  {
    category: 'LAB',
    test: 'WEIL FELIX TEST, SERUM',
    title: 'WEIL FELIX TEST, SERUM',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '4 Hours',
    description: 'The Weil-Felix test is a tube agglutination serological test for the presumptive diagnosis of rickettsial infections using Proteus vulgaris (OX-19, OX-2) and Proteus mirabilis (OX-K) antigens.',
    notes: '',
    interpretation: `Test Principle & Clinical Significance:
The Weil-Felix test is an agglutination test based on the cross-reaction of antibodies produced against Rickettsial species with the somatic (O) antigens of certain non-motile Proteus strains (OX-19, OX-2, and OX-K).

Differential Agglutination Patterns:
1. Epidemic & Endemic Typhus (Rickettsia prowazekii, R. typhi):
   • Proteus Antigen OX 19: Strongly Positive (>= 1:160)
   • Proteus Antigen OX 2: Weakly Positive / Negative
   • Proteus Antigen OX K: Negative

2. Spotted Fever Group (Rocky Mountain Spotted Fever / Indian Tick Typhus - R. rickettsii, R. conorii):
   • Proteus Antigen OX 19: Strongly Positive (>= 1:160)
   • Proteus Antigen OX 2: Strongly Positive (>= 1:160)
   • Proteus Antigen OX K: Negative

3. Scrub Typhus (Orientia tsutsugamushi):
   • Proteus Antigen OX 19: Negative
   • Proteus Antigen OX 2: Negative
   • Proteus Antigen OX K: Strongly Positive (>= 1:160)

4. Q Fever (Coxiella burnetii):
   • Proteus Antigen OX 19: Negative
   • Proteus Antigen OX 2: Negative
   • Proteus Antigen OX K: Negative

Diagnostic Titres:
• Baseline Titres: Titres < 1:80 are considered non-significant / negative and may be present in healthy individuals or due to past infections.
• Significant Titre: A single titre of >= 1:160 (or >= 1:80 in non-endemic areas) in a patient with compatible clinical findings (acute febrile illness, headache, maculopapular rash, eschar) is suggestive of active Rickettsial infection.
• Convalescent Testing: A four-fold or greater rise in antibody titre between paired acute and convalescent phase sera (collected 10-14 days apart) is diagnostically conclusive.
• Cross-Reactivity: False-positive results may be seen in urinary tract infections caused by Proteus species, Leptospirosis, Relapsing fever, and severe chronic liver disease.
• Correlation: Results should always be clinically correlated and confirmed with IFA, ELISA, or PCR where available.`,
    parameters: [
      {
        name: 'Proteus Antigen OX 19',
        referenceRange: '< 1:80',
        unit: 'Titre',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative (< 1:20)', isAbnormal: false },
          { value: '1:20', isAbnormal: false },
          { value: '1:40', isAbnormal: false },
          { value: '1:80', isAbnormal: false },
          { value: '1:160', isAbnormal: true },
          { value: '1:320', isAbnormal: true },
          { value: '1:640', isAbnormal: true },
          { value: '1:1280', isAbnormal: true },
          { value: 'Positive', isAbnormal: true },
          { value: 'Negative', isAbnormal: false }
        ],
        status: 'Active'
      },
      {
        name: 'Proteus Antigen OX 2',
        referenceRange: '< 1:80',
        unit: 'Titre',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative (< 1:20)', isAbnormal: false },
          { value: '1:20', isAbnormal: false },
          { value: '1:40', isAbnormal: false },
          { value: '1:80', isAbnormal: false },
          { value: '1:160', isAbnormal: true },
          { value: '1:320', isAbnormal: true },
          { value: '1:640', isAbnormal: true },
          { value: '1:1280', isAbnormal: true },
          { value: 'Positive', isAbnormal: true },
          { value: 'Negative', isAbnormal: false }
        ],
        status: 'Active'
      },
      {
        name: 'Proteus Antigen OX K',
        referenceRange: '< 1:80',
        unit: 'Titre',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative (< 1:20)', isAbnormal: false },
          { value: '1:20', isAbnormal: false },
          { value: '1:40', isAbnormal: false },
          { value: '1:80', isAbnormal: false },
          { value: '1:160', isAbnormal: true },
          { value: '1:320', isAbnormal: true },
          { value: '1:640', isAbnormal: true },
          { value: '1:1280', isAbnormal: true },
          { value: 'Positive', isAbnormal: true },
          { value: 'Negative', isAbnormal: false }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'WBC Count',
    title: 'WBC Count',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '2 Hours',
    description: 'Total White Blood Cell (WBC) / Leukocyte count measurement in blood to evaluate immune status, infections, inflammation, and hematologic disorders.',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
White Blood Cells (WBCs) / Leukocytes are vital cellular components of the immune system responsible for defending the body against infectious organisms and foreign substances.

Reference Range:
• Adults (Male & Female): 3,500 - 10,500 mcL (or cells/mcL)

Clinical Significance:
1. Elevated WBC Count (Leukocytosis - > 10,500 mcL):
   • Acute bacterial, viral, fungal, or parasitic infections
   • Systemic inflammatory conditions (e.g., Rheumatoid arthritis, Vasculitis, IBD)
   • Tissue necrosis / injury (e.g., Trauma, Burns, Myocardial infarction)
   • Physical or emotional stress, strenuous exercise, pregnancy
   • Corticosteroid therapy or medication-induced
   • Myeloproliferative disorders and Leukemias (e.g., CML, AML, CLL)

2. Decreased WBC Count (Leukopenia - < 3,500 mcL):
   • Viral infections (e.g., Dengue, HIV, Viral Hepatitis, Influenza)
   • Bone marrow suppression or failure (e.g., Aplastic anemia, myelodysplastic syndrome)
   • Chemotherapy, radiotherapy, or immunosuppressive drugs
   • Autoimmune destruction (e.g., Systemic Lupus Erythematosus)
   • Severe overwhelming bacterial infections (Septic shock)
   • Nutritional deficiencies (Vitamin B12 or Folate deficiency)

Note:
Total WBC count should be evaluated in conjunction with the Differential Leukocyte Count (DLC: Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils) and clinical presentation for accurate diagnosis.`,
    parameters: [
      {
        name: 'WBC Count',
        referenceRange: '3,500 - 10,500',
        unit: 'mcL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'VLDL Cholesterol',
    title: 'VLDL Cholesterol',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Fasting)',
    turnaroundTime: '4 Hours',
    description: 'Quantitative measurement or estimation of Very Low-Density Lipoprotein (VLDL) cholesterol in serum to evaluate lipid metabolism and cardiovascular risk.',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
Very Low-Density Lipoprotein (VLDL) cholesterol is synthesized by the liver and serves as the primary transport vehicle for endogenously produced triglycerides in circulation. Elevated VLDL is an atherogenic risk factor linked to coronary artery disease, metabolic syndrome, and pancreatitis.

Reference Range:
• Desirable: 5 - 40 mg/dl (or < 30 mg/dl fasting)

Clinical Significance:
1. Elevated VLDL Cholesterol (> 40 mg/dl):
   • Familial hypertriglyceridemia / Type IV and Type IIb hyperlipoproteinemia
   • Metabolic Syndrome and Type 2 Diabetes Mellitus (due to insulin resistance)
   • Obesity, sedentary lifestyle, and high-glycemic/high-fat diet
   • Chronic alcohol excess
   • Chronic kidney disease / Nephrotic syndrome
   • Hypothyroidism
   • Increased risk for atherosclerotic cardiovascular disease (ASCVD) and acute pancreatitis (when triglycerides > 500 mg/dl)

2. Decreased VLDL Cholesterol (< 5 mg/dl):
   • Severe malnutrition or malabsorption states
   • Abetalipoproteinemia / Hypobetalipoproteinemia
   • Severe chronic liver parenchymal damage
   • Hyperthyroidism

Estimation & Notes:
• In standard lipid panels, VLDL is commonly estimated using the Friedewald formula (VLDL = Triglycerides / 5), valid when fasting triglycerides are < 400 mg/dl.
• A 10–12 hour overnight fast is recommended for accurate testing.`,
    parameters: [
      {
        name: 'VLDL Cholesterol',
        referenceRange: '5 - 40',
        unit: 'mg/dl',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Vitamin D3',
    title: 'Vitamin D3',
    basePrice: 1200,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '24 Hours',
    description: 'Quantitative measurement of 25-Hydroxy Vitamin D / Vitamin D3 in serum to evaluate vitamin D status, bone mineralization, and calcium homeostasis.',
    notes: '',
    interpretation: `Physiological Basis:
The vitamin D system functions to maintain serum calcium levels. Vitamin D is a fat-soluble steroid hormone. Two molecular forms exist: D3 (cholecalciferol), synthesized in the epidermis, and D2 (ergocalciferol), derived from plant sources. To become active, both need to be further metabolized. Two sequential hydroxylations occur: in the liver to 25(OH)D and then, in the kidney, to 1,25[OH] 2 D. Besides consequences for bone health, vitamin D deficiency reportedly is associated with a number of conditions such as cardiovascular disease, autoimmunity and cancer; however, evidence-based cause-and-effect relationships have not been established. 

Interpretation
Increased in:  Heavy milk drinkers (up to 64 ng/mL), vitamin D intoxication, sun exposure.
Decreased in:  Dietary deficiency, malabsorption, rickets, osteomalacia, biliary and portal cirrhosis, nephrotic syndrome, renal failure, inadequate sun exposure, advanced age (> 70), primary hyperparathyroidism.
Drugs: Phenytoin, phenobarbital. 

Comments:
Serum or plasma total 25(OH)D is an integrated marker of vitamin D status, incorporating endogenous synthesis from solar exposure, dietary intake, fortified products and/or supplements. There is no universal or strong evidence-based consensus on the appropriate level of 25(OH)D level. However, according to a 2011 US Institute of Medicine Report, a 25(OH)D level of 20–30 ng/mL is all that is needed for bone and general health, and nearly everyone (97.5%) in the general population is in that range. A 25(OH)D level above 30 ng/mL has not been consistently associated with increased health benefits, and, in fact, risks have been identified for outcomes at levels above 50 ng/mL. Routine screening for vitamin D deficiency is not necessary. Patients with the following conditions should be considered for testing: osteoporosis, osteomalacia, malabsorption, liver disease, pancreatic insufficiency, chronic kidney disease, COPD, bariatric surgery, cancer, bedridden or home-bound, obesity, taking anticonvulsants or long-term glucocorticoids, atraumatic fractures, elderly (> 70 years old), and chronic inflammatory conditions.`,
    parameters: [
      {
        name: '25 Hydroxy (OH) Vitamin D',
        referenceRange: '30 - 100',
        unit: 'ng/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Vitamin B12',
    title: 'Vitamin B12',
    basePrice: 850,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '24 Hours',
    description: 'Quantitative measurement of Vitamin B12 (Cobalamin) in serum to diagnose megaloblastic anemia, neuropathy, and malabsorption syndromes.',
    notes: '',
    interpretation: `Physiologic Basis
Vitamin B12 is a necessary cofactor for three important biochemical processes: conversion of methylmalonyl-CoA to succinyl-CoA and methylation of homocysteine to methionine and demethylation of methyltetrahydrofolate to tetra-hydrofolate (THF). All vitamin B12 comes from ingestion of foods of animal origin. Vitamin B12 in serum is protein bound, 70% to transcobalamin I (TC I) and 30% to transcobalamin II (TC II). The B12 bound to TC II is physiologically active; that bound to TC I is not.

Interpretation 
Increased in: Leukemia (acute myelocytic, chronic myelocytic, chronic lymphocytic, monocytic), marked leukocytosis, polycythemia vera.
Decreased in: Pernicious anemia, gastrectomy, gastric carcinoma, malabsorption, pregnancy, dietary deficiency, HIV infection, chronic high-flux hemodialysis, Alzheimer disease, drugs (eg, omeprazole, metformin, carbamazepine).

Comments
Low serum B12 levels warrant treatment; intermediate levels should be followed by repeated serum tests or by urine methylmalonic acid tests, as well as by serum homocysteine levels. Neurologic disorders caused by low serum B12 level can occur in the absence of macrocytic anemia or pancytopenia.`,
    parameters: [
      {
        name: 'Vitamin B12',
        referenceRange: '211 - 911',
        unit: 'pg/ml',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'VDRL',
    title: 'VDRL',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '4 Hours',
    description: 'Venereal Disease Research Laboratory (VDRL) non-treponemal serological test for the screening and treatment monitoring of Syphilis (Treponema pallidum).',
    notes: '',
    interpretation: `Result | Remarks
Reactive | Indicates the presence of IgM & IgG antibodies against non-treponemal antigens
Non-Reactive | Indicates absence of IgM & IgG antibodies against non-treponemal antigens

Note:
1. Titers of ≥1: 8 and rising titres are significant.
2. Positive result indicates ongoing or recent infection and the diagnosis should be confirmed by specific Treponemal tests such as TPHA & FTA- Abs.
3. The reactivity will vary with the Primary (60-86%), Secondary (99%) and Tertiary (98%) stage of Syphilis.
4. False positive results may be observed in patients of Malaria, Hepatitis, Mumps, Leprosy, Infectious Mononucleosis, Rheumatoid Arthritis and Collagen disease.
5. False negative reaction may be due to processing of sample collected early in the course of disease, immunosuppression and due to prozone effect.

Uses :
- To screen for presence and monitor the progression of Syphilis infection.
- To assess the response to therapy (decreasing titres) in patients being treated for Syphilis.`,
    parameters: [
      {
        name: 'VDRL',
        referenceRange: 'Non-Reactive',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Non-Reactive', isAbnormal: false },
          { value: 'Reactive', isAbnormal: true },
          { value: 'Weakly Reactive', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine Sugar Random',
    title: 'Urine Sugar Random',
    basePrice: 60,
    taxPercentage: 0,
    sampleType: 'Urine (Random)',
    turnaroundTime: '1 Hour',
    description: 'Semi-quantitative detection of glucose/sugar in random urine sample to screen for glycosuria, diabetes mellitus, and renal tubular disorders.',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
Under normal physiological conditions, glucose is completely filtered by the glomeruli and reabsorbed by the proximal convoluted tubules of the kidneys, resulting in undetectable levels of glucose (Nil/Negative) in the urine.

Reference Value:
• Normal / Healthy: Nil (Negative)

Clinical Significance:
1. Glycosuria with Hyperglycemia (Exceeding Renal Threshold ~180 mg/dL):
   • Diabetes Mellitus (Type 1 and Type 2)
   • Gestational Diabetes
   • Endocrine disorders (e.g., Cushing syndrome, Acromegaly, Hyperthyroidism, Pheochromocytoma)
   • Acute severe stress, intracranial trauma, pancreatitis

2. Renal Glycosuria (Normal Blood Glucose with Lowered Renal Threshold):
   • Hereditary renal glycosuria (benign defect in proximal tubular glucose transport)
   • Pregnancy (physiologically lowered renal glucose threshold)
   • Fanconi syndrome and renal tubular acidosis
   • Drug-induced tubular dysfunction (e.g., SGLT2 inhibitors like Dapagliflozin, Empagliflozin)

Note:
A positive urine sugar test should always be correlated with simultaneous blood glucose testing (FBS, PPBS, RBS, or HbA1c) to distinguish between diabetes mellitus and renal glycosuria.`,
    parameters: [
      {
        name: 'Urine Sugar Random',
        referenceRange: 'Nil',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Nil', isAbnormal: false },
          { value: 'Negative', isAbnormal: false },
          { value: 'Trace', isAbnormal: true },
          { value: '+ (0.25 g/dL)', isAbnormal: true },
          { value: '++ (0.5 g/dL)', isAbnormal: true },
          { value: '+++ (1.0 g/dL)', isAbnormal: true },
          { value: '++++ (2.0 g/dL or more)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine Sugar PP',
    title: 'Urine Sugar PP',
    basePrice: 60,
    taxPercentage: 0,
    sampleType: 'Urine (Postprandial - 2 hrs after meal)',
    turnaroundTime: '1 Hour',
    description: 'Semi-quantitative estimation of postprandial glucose excretion in urine collected 2 hours after a meal for diabetic evaluation and glucose tolerance assessment.',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
Urine Sugar Postprandial (PP) evaluates the excretion of glucose in urine collected 2 hours after a meal. Under normal physiological conditions in non-diabetic individuals, postprandial blood glucose does not exceed the renal threshold (~180 mg/dL), resulting in absence of glucose (Nil/Negative) in the urine.

Reference Value:
• Normal / Healthy: Nil (Negative)

Clinical Significance:
1. Postprandial Glycosuria with Hyperglycemia:
   • Uncontrolled or poorly managed Diabetes Mellitus (Type 1 and Type 2)
   • Impaired Glucose Tolerance (IGT)
   • Gestational Diabetes Mellitus
   • High-carbohydrate meal ingestion exceeding temporary renal threshold in susceptible individuals

2. Postprandial Glycosuria without Significant Hyperglycemia (Renal Glycosuria):
   • Reduced renal threshold for glucose
   • Pregnancy
   • Proximal renal tubular disorders (e.g., Fanconi syndrome)
   • SGLT2 inhibitor therapy (Dapagliflozin, Empagliflozin, Canagliflozin)

Note:
Urine Sugar PP should be evaluated alongside simultaneous Blood Glucose Postprandial (PPBS) and HbA1c for optimal diabetic assessment and treatment monitoring.`,
    parameters: [
      {
        name: 'Urine Sugar PP',
        referenceRange: 'Nil',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Nil', isAbnormal: false },
          { value: 'Negative', isAbnormal: false },
          { value: 'Trace', isAbnormal: true },
          { value: '+ (0.25 g/dL)', isAbnormal: true },
          { value: '++ (0.5 g/dL)', isAbnormal: true },
          { value: '+++ (1.0 g/dL)', isAbnormal: true },
          { value: '++++ (2.0 g/dL or more)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine Sugar Fasting',
    title: 'Urine Sugar Fasting',
    basePrice: 60,
    taxPercentage: 0,
    sampleType: 'Urine (Fasting - Early morning / overnight fast)',
    turnaroundTime: '1 Hour',
    description: 'Semi-quantitative estimation of fasting glucose excretion in urine collected after an overnight fast (8-12 hours) for diabetic screening and evaluation.',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
Urine Sugar Fasting evaluates the presence of glucose in urine collected after an overnight fast (8-12 hours). Under normal physiological conditions in healthy individuals, fasting blood glucose is well below the renal threshold (~180 mg/dL), resulting in complete tubular reabsorption and no glucose (Nil/Negative) in the urine.

Reference Value:
• Normal / Healthy: Nil (Negative)

Clinical Significance:
1. Fasting Glycosuria with Hyperglycemia:
   • Severe or uncontrolled Diabetes Mellitus (Type 1 and Type 2)
   • Severe nocturnal or early morning hyperglycemia (Somogyi effect / Dawn phenomenon)
   • Endocrine disorders causing secondary diabetes (e.g., Cushing syndrome, Pheochromocytoma)

2. Fasting Glycosuria with Normal Blood Glucose (Renal Glycosuria):
   • Hereditary renal glycosuria (impaired tubular reabsorption of glucose)
   • Pregnancy-associated lowering of renal glucose threshold
   • Renal tubular dysfunction (e.g., Fanconi syndrome, heavy metal toxicity)
   • Use of SGLT2 inhibitor medications (e.g., Dapagliflozin, Empagliflozin)

Note:
Fasting urine glucose is a screening test and should always be evaluated alongside Fasting Blood Sugar (FBS), Postprandial Blood Sugar (PPBS), and HbA1c for clinical confirmation.`,
    parameters: [
      {
        name: 'Urine Sugar Fasting',
        referenceRange: 'Nil',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Nil', isAbnormal: false },
          { value: 'Negative', isAbnormal: false },
          { value: 'Trace', isAbnormal: true },
          { value: '+ (0.25 g/dL)', isAbnormal: true },
          { value: '++ (0.5 g/dL)', isAbnormal: true },
          { value: '+++ (1.0 g/dL)', isAbnormal: true },
          { value: '++++ (2.0 g/dL or more)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine Protein/Creatinine',
    title: 'Urine Protein/Creatinine',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Random - First morning preferred)',
    turnaroundTime: '4 Hours',
    description: 'URINE PROTEIN/CREATININE RATIO (UPCR) quantitative estimation in spot urine to evaluate proteinuria and renal disease progression.',
    notes: '',
    interpretation: `Reference Interpretation (Adults)

• < 0.2 → Normal
• 0.2 – 0.5 → Mild proteinuria
• 0.5 – 3.0 → Moderate proteinuria
• > 3.0 → Nephrotic range proteinuria

Clinical Significance:
The Urine Protein/Creatinine Ratio (UPCR) on a spot/random urine sample correlates strongly with 24-hour urinary protein excretion (mg/24 hours) and avoids the collection errors of a 24-hour urine collection.

Clinical Applications:
1. Diagnosis and quantitative grading of proteinuria in chronic kidney disease (CKD), diabetic nephropathy, glomerulonephritis, and hypertension.
2. Screening and diagnosis of preeclampsia in pregnancy.
3. Monitoring response to antiproteinuric and immunosuppressive therapy.`,
    parameters: [
      {
        name: 'Urine for creatinine',
        referenceRange: '20 - 320',
        unit: 'mg/dL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Urine for Protein',
        referenceRange: '< 15',
        unit: 'mg/dL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Urine Protein Creatinine Ratio',
        referenceRange: '< 0.2',
        unit: 'mg/mg',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine for Protein',
    title: 'Urine for Protein',
    basePrice: 60,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Random - Early morning preferred)',
    turnaroundTime: '1 Hour',
    description: 'Semi-quantitative detection of protein in urine to screen for proteinuria, renal glomerular and tubular diseases, and preeclampsia.',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
Normal glomerular capillaries restrict the filtration of high-molecular-weight plasma proteins, and filtered low-molecular-weight proteins are largely reabsorbed and catabolized by proximal renal tubular cells. As a result, minimal protein (Nil / Negative) is excreted in the urine of healthy individuals.

Reference Value:
• Normal / Healthy: Nil (Negative)

Clinical Significance:
1. Glomerular Proteinuria (Increased Glomerular Permeability):
   • Nephrotic syndrome (Membranous nephropathy, Minimal change disease, FSGS)
   • Glomerulonephritis (IgA nephropathy, Post-streptococcal, Lupus nephritis)
   • Diabetic nephropathy
   • Hypertensive nephrosclerosis

2. Tubular Proteinuria (Decreased Tubular Reabsorption):
   • Acute tubular necrosis (ATN)
   • Interstitial nephritis
   • Fanconi syndrome
   • Heavy metal poisoning / toxic nephropathy

3. Overflow Proteinuria (Excess Low Molecular Weight Proteins in Plasma):
   • Multiple myeloma (Bence Jones proteins / Free light chains)
   • Rhabdomyolysis (Myoglobinuria)
   • Intravascular hemolysis (Hemoglobinuria)

4. Transient / Functional Proteinuria:
   • High fever, strenuous exercise, severe emotional or physical stress
   • Orthostatic (postural) proteinuria
   • Urinary tract infection (UTI) or hematuria

Note:
Persistent proteinuria on dipstick testing warrants quantitative evaluation (such as Urine Protein/Creatinine Ratio [UPCR] or 24-hour urine protein) and renal function assessment.`,
    parameters: [
      {
        name: 'Urine for Protein',
        referenceRange: 'Nil',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Nil', isAbnormal: false },
          { value: 'Negative', isAbnormal: false },
          { value: 'Trace', isAbnormal: true },
          { value: '+ (30 mg/dL)', isAbnormal: true },
          { value: '++ (100 mg/dL)', isAbnormal: true },
          { value: '+++ (300 mg/dL)', isAbnormal: true },
          { value: '++++ (1000 mg/dL or more)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine for Microalbumin',
    title: 'Urine for Microalbumin',
    basePrice: 400,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Random - First morning preferred)',
    turnaroundTime: '4 Hours',
    description: 'Quantitative / semi-quantitative estimation of microalbumin in urine to detect early diabetic nephropathy and renal microvascular disease.',
    notes: '',
    interpretation: `Physiological Basis:
The normal urinary albumin excretion is less than 30 mg/24 hr. On random spot urine collection, the albumin-to-creatinine ratio (ACR, mcg/mg) should be less than 30. The term microalbuminuria is defined as a subtle increase in the urinary excretion of albumin that cannot be detected by conventional urinalysis. Specifically, the excretion of 30–300 mg albumin per 24 hours or an ACR of 30–300 (mcg/mg) is considered microalbuminuria (urine albumin is high). 300 mg or more of albumin excretion per day or an ACR of 300 or higher indicates gross albuminuria (urine albumin very high or nephrotic) range. 

Interpretation:
Increased in: Diabetes mellitus, diabetic nephropathy. 

Comments:
Microalbuminuria is a useful indicator of early nephropathy in diabetic patients. Urine albumin measurement requires a sensitive immunochemical assay. Urine dipstick analysis is often insensitive to microalbuminuria. Screening for microalbuminuria is often performed by measurement of the ACR in a random spot collection (preferred method). Twenty-four-hour or timed urine collections are more burdensome.`,
    parameters: [
      {
        name: 'Urine for Microalbumin',
        referenceRange: '< 20 mg/L',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative (< 20 mg/L)', isAbnormal: false },
          { value: 'Microalbuminuria (20 - 200 mg/L)', isAbnormal: true },
          { value: 'Macroalbuminuria (> 200 mg/L)', isAbnormal: true },
          { value: 'Normal (< 30 mg/24hr)', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Negative', isAbnormal: false }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine for Ketone',
    title: 'Urine for Ketone',
    basePrice: 60,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Fresh Random)',
    turnaroundTime: '1 Hour',
    description: 'Semi-quantitative detection of ketone bodies in urine to screen for diabetic ketoacidosis (DKA), starvation ketosis, and metabolic disturbances.',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
Ketone bodies (acetoacetic acid, beta-hydroxybutyric acid, and acetone) are intermediate products of fatty acid metabolism. In healthy individuals on a standard diet, ketones are completely metabolized by peripheral tissues and are not detectable in urine (Nil / Negative).

Reference Value:
• Normal / Healthy: Nil (Negative)

Clinical Significance:
1. Diabetic Ketoacidosis (DKA):
   • Severe, potentially life-threatening complication of uncontrolled Type 1 (and sometimes Type 2) Diabetes Mellitus, characterized by hyperglycemia, ketonuria, ketonemia, and metabolic acidosis.

2. Non-Diabetic Ketonuria (Carbohydrate Deprivation / Increased Fat Catabolism):
   • Prolonged fasting, starvation, or extreme ketogenic diets
   • Hyperemesis gravidarum (severe pregnancy nausea and vomiting)
   • Severe vomiting, diarrhea, or dehydration in children
   • High fever, strenuous prolonged exercise, cachexia
   • Alcoholic ketoacidosis
   • Inborn errors of metabolism (e.g., glycogen storage diseases, organic acidemias)

Note:
Urine dipstick tests primarily detect acetoacetic acid (and to a lesser degree acetone), but do not measure beta-hydroxybutyrate. In critical situations (suspected DKA), quantitative serum beta-hydroxybutyrate, blood gases, and electrolytes should be measured.`,
    parameters: [
      {
        name: 'Urine for Ketone',
        referenceRange: 'Nil',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Nil', isAbnormal: false },
          { value: 'Negative', isAbnormal: false },
          { value: 'Trace (5 mg/dL)', isAbnormal: true },
          { value: '+ (Small / 15 mg/dL)', isAbnormal: true },
          { value: '++ (Moderate / 40 mg/dL)', isAbnormal: true },
          { value: '+++ (Large / 80 mg/dL)', isAbnormal: true },
          { value: '++++ (Large / 160 mg/dL)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine for Fungal',
    title: 'Urine for Fungal',
    basePrice: 100,
    taxPercentage: 0,
    sampleType: 'Urine (Clean-catch Midstream / Catheterized)',
    turnaroundTime: '2 Hours',
    description: 'Microscopic examination of urine sediment wet mount / Gram stain for yeast cells, budding cells, and pseudohyphae (funguria/candiduria).',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
Normal human urine is typically sterile and free from fungal elements (yeast cells or pseudohyphae). The presence of fungal elements in urine (Funguria / Candiduria) can indicate colonization, local urinary tract infection (cystitis, pyelonephritis), or disseminated candidiasis/fungal infection.

Reference Value:
• Normal / Healthy: Absent (Nil / Negative)

Clinical Significance:
1. Asymptomatic Candiduria:
   • Frequently seen in catheterized patients, prolonged hospitalization, or elderly patients.
   • Often represents benign colonization of the catheter or lower urinary tract.

2. Symptomatic Fungal Urinary Tract Infection:
   • Fungal cystitis, pyelonephritis, renal abscess, or fungal balls (bezoars) in the collecting system.
   • Common risk factors include Diabetes Mellitus, broad-spectrum antibiotic therapy, immunosuppression (corticosteroids, chemotherapy, HIV), urinary tract obstruction, or indwelling Foley catheters.

3. Disseminated / Invasive Fungal Infection:
   • Candiduria in immunocompromised or neutropenic patients may be a manifestation of hematogenous renal seeding from systemic candidiasis.

Note:
Microscopic examination of urine wet mount / Gram stain detects budding yeast cells and pseudohyphae. Urine fungal culture and speciation (e.g., Candida albicans, Candida tropicalis, Candida glabrata) is recommended for identifying the causative species and antifungal susceptibility testing.`,
    parameters: [
      {
        name: 'Urine for Fungal',
        referenceRange: 'Absent',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Absent', isAbnormal: false },
          { value: 'Nil', isAbnormal: false },
          { value: 'Negative', isAbnormal: false },
          { value: 'Present', isAbnormal: true },
          { value: 'Few Yeast Cells Seen', isAbnormal: true },
          { value: 'Moderate Yeast Cells with Pseudohyphae Seen', isAbnormal: true },
          { value: 'Plenty Yeast Cells with Pseudohyphae Seen', isAbnormal: true },
          { value: 'Candida species Seen', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine for ELISA (Pregnancy)',
    title: 'Urine for ELISA (Pregnancy)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Urine (Early morning first-void preferred)',
    turnaroundTime: '1 Hour',
    description: 'Detection of Human Chorionic Gonadotropin (hCG) in urine by ELISA / Immunochromatographic method for confirmation of pregnancy.',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
Human Chorionic Gonadotropin (hCG) is a glycoprotein hormone produced by the syncytiotrophoblast cells of the placenta following implantation of a fertilized ovum. Urine ELISA / immunochromatographic assays detect the presence of beta-hCG (typically at concentrations ≥ 20–25 mIU/mL) in urine.

Reference Value:
• Non-Pregnant Females / Males: Negative (< 5 mIU/mL)

Clinical Significance:
1. Positive Result:
   • Confirms intrauterine pregnancy (detectable as early as 7–10 days post-conception or by the first missed menstrual period).
   • Other conditions associated with elevated hCG:
     - Ectopic pregnancy
     - Gestational trophoblastic disease (Hydatidiform mole, Choriocarcinoma)
     - Germ cell tumors producing hCG (e.g., ovarian teratoma, dysgerminoma, testicular choriocarcinoma)

2. Negative Result:
   • Absence of pregnancy or hCG level below the analytical sensitivity threshold of the assay (e.g., early gestation before expected menses).
   • Very dilute urine sample (low specific gravity).

Note:
For optimal sensitivity, an early morning first-void urine sample is recommended as it contains the highest concentration of hCG. If pregnancy is clinically suspected despite a negative or weakly positive urine result, retesting in 48–72 hours or a quantitative Serum Beta-hCG blood test is recommended.`,
    parameters: [
      {
        name: 'Urine for ELISA (Pregnancy)',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Weakly Positive', isAbnormal: true },
          { value: 'Equivocal', isAbnormal: true },
          { value: 'Borderline', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine for creatinine',
    title: 'Urine for creatinine',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Random or 24-Hour)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative estimation of creatinine excretion in urine to evaluate glomerular filtration, muscle catabolism, and ratio indices.',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
Creatinine is a non-protein nitrogenous end product of muscle creatine phosphate catabolism. It is produced at a relatively constant rate proportional to muscle mass and excreted by the kidneys primarily through glomerular filtration with negligible tubular secretion and reabsorption. Urinary creatinine measurement is used to assess renal clearance, evaluate muscle wasting disorders, and standardize concentrations of other excreted urinary analytes (such as albumin and total protein) in spot urine samples.

Reference Ranges:
• Spot / Random Urine: 20 – 320 mg/dL
• 24-Hour Urine Collection:
  - Adult Males: 1,000 – 2,000 mg/24 hours (1.0 – 2.0 g/day)
  - Adult Females: 800 – 1,800 mg/24 hours (0.8 – 1.8 g/day)

Clinical Significance:
1. Decreased Urinary Creatinine:
   • Impaired Glomerular Filtration / Renal Failure (Acute Kidney Injury, Chronic Kidney Disease)
   • Reduced muscle mass (Muscular dystrophy, Amyotrophic lateral sclerosis, severe cachexia)
   • Incomplete 24-hour urine collection
   • Severe hyperthyroidism, advanced liver disease

2. Increased Urinary Creatinine:
   • High dietary meat intake / creatine supplementation
   • Strenuous physical exercise / Rhabdomyolysis
   • Early diabetic nephropathy (hyperfiltration stage)
   • Gigantism, acromegaly, hypopituitarism
   • Catabolic states / severe tissue breakdown

Note:
Measurement of urinary creatinine in a spot urine sample is essential for calculating the Albumin-to-Creatinine Ratio (ACR) and Protein-to-Creatinine Ratio (UPCR) to adjust for variations in urinary concentration.`,
    parameters: [
      {
        name: 'Urine for creatinine',
        referenceRange: '20 - 320',
        unit: 'mg/dL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine for Chyle',
    title: 'Urine for Chyle',
    basePrice: 100,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Random - Postprandial / post-fat meal preferred)',
    turnaroundTime: '2 Hours',
    description: 'Detection of chyle (lymph and fat/chylomicrons) in urine to evaluate chyluria, filarial lymphatic obstruction, and lymphatic-urinary fistulae.',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
Chyluria is the presence of chyle (a milky bodily fluid consisting of lymph and emulsified fats / chylomicrons) in the urine. It occurs due to the formation of an abnormal fistulous communication between the retroperitoneal lymphatic system and the urinary collecting system (pelvicalyceal system, ureter, or bladder).

Reference Value:
• Normal / Healthy: Negative (Absent)

Clinical Significance:
1. Parasitic Causes (Most Common in Endemic Regions):
   • Lymphatic Filariasis caused by Wuchereria bancrofti (leading to lymphatic obstruction, lymphangiectasia, and rupture into urinary tract).

2. Non-Parasitic Causes:
   • Trauma or retroperitoneal / pelvic surgery
   • Retroperitoneal tumors, lymphoma, or granulomatous lymphadenitis (e.g., Tuberculosis)
   • Congenital lymphatic malformations / lymphangiomatosis
   • Thoracic duct obstruction or thrombosis
   • Pregnancy or severe abdominal straining in patients with preexisting lymphatic weakness

Diagnostic Features:
• Appearance: Milky white, opalescent urine, often clearing upon ether / chloroform extraction (Ether Test Positive).
• Staining: Sudan III or Oil Red O positive for fat globules / chylomicrons.
• Urinalysis: High levels of triglycerides and cholesterol, accompanied by proteinuria and lymphocyturia.

Note:
Confirmation is typically performed by the Urine Ether extraction test and measurement of urinary triglycerides (> 15 mg/dL suggests chyluria). High-fat meals prior to testing may accentuate the milky appearance.`,
    parameters: [
      {
        name: 'Urine for Chyle',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Absent', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Present', isAbnormal: true },
          { value: 'Milky / Turbid (Ether test Positive)', isAbnormal: true },
          { value: 'Trace', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine for AFB 24 hours',
    title: 'Urine for AFB 24 hours',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Urine (24-Hour Pooled Collection / Concentrated Morning Urine)',
    turnaroundTime: '24 Hours',
    description: 'Microscopic examination of concentrated urine sediment using Ziehl-Neelsen / Acid-Fast stain for detection of Mycobacterium tuberculosis (Genitourinary TB).',
    notes: '',
    interpretation: `Clinical Interpretation & Physiological Significance:
Acid-Fast Bacilli (AFB) stain (Ziehl-Neelsen / Kinyoun or Auramine-O fluorescence) on concentrated urine sediment is performed for the detection of Mycobacterium tuberculosis in suspected cases of Genitourinary Tuberculosis (GUTB) or disseminated tuberculosis.

Reference Value:
• Normal / Healthy: Negative (No Acid Fast Bacilli Seen)

Clinical Significance:
1. Positive Result (Acid Fast Bacilli Seen):
   • Strongly suggestive of active Genitourinary Tuberculosis (affecting kidneys, ureters, bladder, prostate, seminal vesicles, or epididymis).
   • Can occasionally be seen in disseminated / miliary tuberculosis or renal tuberculosis in immunocompromised patients (e.g., HIV co-infection).

2. Negative Result:
   • Does not completely rule out Genitourinary Tuberculosis due to intermittent shedding of mycobacteria in urine.
   • Serial morning urine samples (3 to 5 consecutive first-morning clean-catch specimens) or 24-hour pooled collection significantly increase diagnostic yield.

Important Differential & Caution:
• Commensal non-pathogenic mycobacteria (such as Mycobacterium smegmatis, normally present on external genitalia) are acid-fast and can cause false-positive microscopic smear results if the genital area is not thoroughly cleansed prior to collection.
• Confirmation by CBNAAT / GeneXpert MTB/RIF and Mycobacterial Culture (LJ medium / MGIT liquid culture) is recommended for definitive speciation and drug susceptibility testing (DST).`,
    parameters: [
      {
        name: 'Urine for AFB 24 hours',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative (No Acid Fast Bacilli Seen)', isAbnormal: false },
          { value: 'Not Seen', isAbnormal: false },
          { value: 'Positive (Acid Fast Bacilli Seen)', isAbnormal: true },
          { value: '1+ (1-10 AFB / 100 Oil Immersion Fields)', isAbnormal: true },
          { value: '2+ (1-10 AFB / 10 Oil Immersion Fields)', isAbnormal: true },
          { value: '3+ (> 10 AFB / Oil Immersion Field)', isAbnormal: true },
          { value: 'Doubtful / Repeat Sample Advised', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine Cortisol',
    title: 'Urine Cortisol',
    basePrice: 850,
    taxPercentage: 0,
    sampleType: '24-hour Urine',
    turnaroundTime: '24 Hours',
    description: 'Urinary free cortisol measurement for evaluation of adrenal function and suspected Cushing syndrome.',
    notes: '',
    interpretation: `Physiological Basis:
Urinary free cortisol measurement is useful in the initial evaluation of suspected Cushing syndrome. 

Interpretation 

Increased in: 
Cushing syndrome, acute illness, stress. 
Not increased in: Obesity. 

Comments 
Urinary free cortisol is the initial diagnostic test of choice for Cushing syndrome. Not useful for the diagnosis of adrenal insuffi ciency. A shorter (12-hour) overnight collection and measurement of the ratio of urine-free cortisol to urine creatinine appears to perform nearly as well as a 24-hour collection for urine-free cortisol.`,
    parameters: [
      {
        name: 'Urine Cortisol',
        referenceRange: '',
        unit: 'µg/24 hrs',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine Bile Pigment',
    title: 'Urine Bile Pigment',
    basePrice: 60,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Fresh Random)',
    turnaroundTime: '1 Hour',
    description: 'Detection of bile pigment (bilirubin) in urine to evaluate liver function, jaundice, and biliary disorders.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Urine Bile Pigment',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Absent', isAbnormal: false },
          { value: 'Nil', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Present', isAbnormal: true },
          { value: 'Trace', isAbnormal: true },
          { value: '+ (1+)', isAbnormal: true },
          { value: '++ (2+)', isAbnormal: true },
          { value: '+++ (3+)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine Bile Salt',
    title: 'Urine Bile Salt',
    basePrice: 60,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Fresh Random)',
    turnaroundTime: '1 Hour',
    description: 'Detection of bile salts in urine to evaluate obstructive jaundice and hepatobiliary disorders.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Urine Bile Salt',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Absent', isAbnormal: false },
          { value: 'Nil', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Present', isAbnormal: true },
          { value: 'Trace', isAbnormal: true },
          { value: '+ (1+)', isAbnormal: true },
          { value: '++ (2+)', isAbnormal: true },
          { value: '+++ (3+)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Uric Acid',
    title: 'Uric Acid',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Quantitative measurement of uric acid concentration in serum for evaluation of gout, renal disorders, and metabolic conditions.',
    notes: '',
    interpretation: `Physiological basis 
Uric acid is an end product of nucleoprotein metabolism and is excreted by the kidney. An increase in serum uric acid concentration occurs with increased nucleoprotein synthesis or catabolism (blood dyscrasias, therapy of leukemia) or decreased renal uric acid excretion (eg, thiazide diuretic therapy or renal failure).

Interpretation 
Increased in: Renal failure, gout, myeloproliferative disorders (leukemia, lymphoma, myeloma, polycythemia vera), psoriasis, glycogen storage disease (type I), Lesch-Nyhan syndrome, lead nephropathy, hypertensive diseases of pregnancy (preeclampsia and eclampsia), menopause, syndrome X (obesity, insulin resistance, hypertension, hyperuricemia, dyslipidemia).
Drugs: Antime- tabolite and chemotherapeutic agents, diuretics, ethanol, nicotinic acid, salicylates (low-dose), theophylline.

Decreased in: SIADH, Xanthine oxidase deficiency, Low-purine diet, Fanconi syndrome, Neoplastic disease (various, causing Increased renal excretion), Liver disease.
Drugs: Salicylates (high- dose), allopurinol or febuxostat (xanthine oxidase inhibitors) or uricase.`,
    parameters: [
      {
        name: 'Serum Uric Acid',
        referenceRange: '3.5 - 7.2',
        unit: 'mg/dl',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Uric Acid',
    title: 'Serum Uric Acid',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Quantitative measurement of uric acid concentration in serum for evaluation of gout, renal disorders, and metabolic conditions.',
    notes: '',
    interpretation: `Physiological basis 
Uric acid is an end product of nucleoprotein metabolism and is excreted by the kidney. An increase in serum uric acid concentration occurs with increased nucleoprotein synthesis or catabolism (blood dyscrasias, therapy of leukemia) or decreased renal uric acid excretion (eg, thiazide diuretic therapy or renal failure).

Interpretation 
Increased in: Renal failure, gout, myeloproliferative disorders (leukemia, lymphoma, myeloma, polycythemia vera), psoriasis, glycogen storage disease (type I), Lesch-Nyhan syndrome, lead nephropathy, hypertensive diseases of pregnancy (preeclampsia and eclampsia), menopause, syndrome X (obesity, insulin resistance, hypertension, hyperuricemia, dyslipidemia).
Drugs: Antime- tabolite and chemotherapeutic agents, diuretics, ethanol, nicotinic acid, salicylates (low-dose), theophylline.

Decreased in: SIADH, Xanthine oxidase deficiency, Low-purine diet, Fanconi syndrome, Neoplastic disease (various, causing Increased renal excretion), Liver disease.
Drugs: Salicylates (high- dose), allopurinol or febuxostat (xanthine oxidase inhibitors) or uricase.`,
    parameters: [
      {
        name: 'Serum Uric Acid',
        referenceRange: '3.5 - 7.2',
        unit: 'mg/dl',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urea / Creatinine Ratio',
    title: 'Urea / Creatinine Ratio',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Calculated ratio of serum urea to serum creatinine to evaluate renal function and pre-renal vs renal azotemia.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Urea / Creatinine Ratio',
        referenceRange: '',
        unit: '',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'UPT',
    title: 'UPT',
    basePrice: 100,
    taxPercentage: 0,
    sampleType: 'Urine (Early morning first-void preferred)',
    turnaroundTime: '30 Minutes',
    description: 'Rapid card test / immunochromatographic assay for detection of human chorionic gonadotropin (hCG) in urine for pregnancy evaluation.',
    notes: '',
    interpretation: `Interpretation
1. If the pregnancy test is taken too early one may get a false negative result very dilute urine specimen may not contain a representative level of HCG, resulting in a negative test too.
2. If pregnancy is still suspected, first morning specimen should be collected 48 hours later and tested.
3. A test result that is weakly positive should be confirmed by retesting with a first-morning urine specimen collected 48 hours later.
4. A number of conditions other than pregnancy, including trophoblastic disease and non-trophoblastic neoplasm cause elevated levels of HCG resulting in a false positive test.
5. The result should be correlated with clinical and ultrasound findings.`,
    parameters: [
      {
        name: 'Urine Pregnancy Test',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Weakly Positive', isAbnormal: true },
          { value: 'Inconclusive / Repeat Advised', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine Pregnancy Test',
    title: 'Urine Pregnancy Test',
    basePrice: 100,
    taxPercentage: 0,
    sampleType: 'Urine (Early morning first-void preferred)',
    turnaroundTime: '30 Minutes',
    description: 'Rapid card test / immunochromatographic assay for detection of human chorionic gonadotropin (hCG) in urine for pregnancy evaluation.',
    notes: '',
    interpretation: `Interpretation
1. If the pregnancy test is taken too early one may get a false negative result very dilute urine specimen may not contain a representative level of HCG, resulting in a negative test too.
2. If pregnancy is still suspected, first morning specimen should be collected 48 hours later and tested.
3. A test result that is weakly positive should be confirmed by retesting with a first-morning urine specimen collected 48 hours later.
4. A number of conditions other than pregnancy, including trophoblastic disease and non-trophoblastic neoplasm cause elevated levels of HCG resulting in a false positive test.
5. The result should be correlated with clinical and ultrasound findings.`,
    parameters: [
      {
        name: 'Urine Pregnancy Test',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Weakly Positive', isAbnormal: true },
          { value: 'Inconclusive / Repeat Advised', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'UPCR',
    title: 'UPCR',
    basePrice: 250,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Random - First morning preferred)',
    turnaroundTime: '2 Hours',
    description: 'Semi-quantitative / qualitative or ratio estimation of Urine Protein to Creatinine Ratio (UPCR) to evaluate proteinuria.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Urine Protein Creatinine Ratio',
        referenceRange: '< 0.2',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Normal (< 0.2)', isAbnormal: false },
          { value: 'Mild Proteinuria (0.2 - 0.5)', isAbnormal: true },
          { value: 'Moderate Proteinuria (0.5 - 3.0)', isAbnormal: true },
          { value: 'Nephrotic Range (> 3.0)', isAbnormal: true },
          { value: 'Positive', isAbnormal: true },
          { value: 'Negative', isAbnormal: false }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine Protein Creatinine Ratio',
    title: 'Urine Protein Creatinine Ratio',
    basePrice: 250,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Random - First morning preferred)',
    turnaroundTime: '2 Hours',
    description: 'Semi-quantitative / qualitative or ratio estimation of Urine Protein to Creatinine Ratio (UPCR) to evaluate proteinuria.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Urine Protein Creatinine Ratio',
        referenceRange: '< 0.2',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Normal (< 0.2)', isAbnormal: false },
          { value: 'Mild Proteinuria (0.2 - 0.5)', isAbnormal: true },
          { value: 'Moderate Proteinuria (0.5 - 3.0)', isAbnormal: true },
          { value: 'Nephrotic Range (> 3.0)', isAbnormal: true },
          { value: 'Positive', isAbnormal: true },
          { value: 'Negative', isAbnormal: false }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'UCT',
    title: 'UCT',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Random)',
    turnaroundTime: '4 Hours',
    description: 'Detection of cotinine in urine to evaluate nicotine exposure and smoking status.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Urine Cotinine',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Absent', isAbnormal: false },
          { value: 'Non-Smoker (< 200 ng/mL)', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Present', isAbnormal: true },
          { value: 'Active Smoker (> 200 ng/mL)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Urine Cotinine',
    title: 'Urine Cotinine',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Random)',
    turnaroundTime: '4 Hours',
    description: 'Detection of cotinine in urine to evaluate nicotine exposure and smoking status.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Urine Cotinine',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Absent', isAbnormal: false },
          { value: 'Non-Smoker (< 200 ng/mL)', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Present', isAbnormal: true },
          { value: 'Active Smoker (> 200 ng/mL)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Typhidot Antibodies',
    title: 'Typhidot Antibodies',
    basePrice: 400,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Qualitative detection of specific IgM and IgG antibodies against Salmonella typhi in serum for the diagnosis of typhoid fever.',
    notes: '',
    interpretation: `TYPHIDOT is a Dot EIA assay designed for the qualitative detection of specific IgM and IgG antibodies against a specific outer membrane antigen of Salmonella typhi in human serum. It is intended to be used as an in vitro diagnostic of typhoid fever. The results obtained should not be the sole determinant for clinical decisions.

RESULTS | CLINICAL INTERPRETATION
-------------------------------------------------------------
IgM positive; IgG negative | Acute Typhoid Fever
IgM and IgG positive | Acute Typhoid Fever (in the middle stage of infection)
IgM negative; IgG positive | Implications for the presence of IgG antibodies may be due to:
1. Current Infection
2. Previous Infection
3. Relapse or reinfection
IgM and IgG negative | Probably not typhoid`,
    parameters: [
      {
        name: 'IgG',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Non-Reactive', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Reactive', isAbnormal: true },
          { value: 'Borderline', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'IgM',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Non-Reactive', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Reactive', isAbnormal: true },
          { value: 'Borderline', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'TSH',
    title: 'TSH',
    basePrice: 250,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Quantitative measurement of Thyroid-Stimulating Hormone (TSH) in serum to evaluate thyroid function.',
    notes: '',
    interpretation: `Physiologic Basis
TSH is an anterior pituitary hormone that stimulates the thyroid gland to produce thyroid hormones.
Secretion is stimulated by thyrotropin releasing hormone from the hypothalamus. There is negative feedback on TSH secretion by circulating thyroid hormone.

Interpretation 
Increased in: Hypothyroidism, mild increases in recovery phase of acute illness, subclinical hypothyroidism.
Decreased in: Hyperthyroidism, subclinical hyperthyroidism, acute medical or surgical illness (euthyroid sick syndrome), pituitary hypothyroidism.
Drugs: dopamine, high-dose corticosteroids.

Comments
TSH assays are used for screening thyroid function, aiding the diagnosis of hyperthyroidism and hypothyroidism, and monitoring thyroid replacement therapy.
The currently used TSH immunoassays are very sensitive, typically with functional sensitivity of ≤0.02 mIU/L.
Measurement of serum TSH is the best initial laboratory test of thyroid function. It should be followed by measurement of free thyroxine (FT4) if the TSH value is low and by measurement of anti-thyroperoxidase antibody (TPO Ab) if the TSH value is high.
Most experts recommend against routine screening of asymptomatic patients, but screening is recommended for high-risk populations.`,
    parameters: [
      {
        name: 'Thyroid-Stimulating Hormone, TSH',
        referenceRange: '0.3 - 4.5',
        unit: 'µIU/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Thyroid-Stimulating Hormone, TSH',
    title: 'Thyroid-Stimulating Hormone, TSH',
    basePrice: 250,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Quantitative measurement of Thyroid-Stimulating Hormone (TSH) in serum to evaluate thyroid function.',
    notes: '',
    interpretation: `Physiologic Basis
TSH is an anterior pituitary hormone that stimulates the thyroid gland to produce thyroid hormones.
Secretion is stimulated by thyrotropin releasing hormone from the hypothalamus. There is negative feedback on TSH secretion by circulating thyroid hormone.

Interpretation 
Increased in: Hypothyroidism, mild increases in recovery phase of acute illness, subclinical hypothyroidism.
Decreased in: Hyperthyroidism, subclinical hyperthyroidism, acute medical or surgical illness (euthyroid sick syndrome), pituitary hypothyroidism.
Drugs: dopamine, high-dose corticosteroids.

Comments
TSH assays are used for screening thyroid function, aiding the diagnosis of hyperthyroidism and hypothyroidism, and monitoring thyroid replacement therapy.
The currently used TSH immunoassays are very sensitive, typically with functional sensitivity of ≤0.02 mIU/L.
Measurement of serum TSH is the best initial laboratory test of thyroid function. It should be followed by measurement of free thyroxine (FT4) if the TSH value is low and by measurement of anti-thyroperoxidase antibody (TPO Ab) if the TSH value is high.
Most experts recommend against routine screening of asymptomatic patients, but screening is recommended for high-risk populations.`,
    parameters: [
      {
        name: 'Thyroid-Stimulating Hormone, TSH',
        referenceRange: '0.3 - 4.5',
        unit: 'µIU/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Troponin T',
    title: 'Troponin T',
    basePrice: 500,
    taxPercentage: 0,
    sampleType: 'Whole Blood / Serum',
    turnaroundTime: '30 Minutes',
    description: 'Qualitative rapid card test for the detection of Cardiac Troponin T for evaluation of acute myocardial injury.',
    notes: 'Method: Card',
    interpretation: `Clinical Significance & Interpretation:
Cardiac Troponin T (cTnT) is a sensitive and specific marker of myocardial cell necrosis.

1. Negative:
   • Cardiac Troponin T is not detected (below analytical cutoff).
   • If drawn within 3-6 hours of chest pain onset, a single negative test does not completely rule out acute myocardial infarction. Serial repeat testing at 3–6 hour intervals is recommended if acute coronary syndrome is suspected.

2. Positive:
   • Indicates myocardial injury / necrosis consistent with Acute Myocardial Infarction (AMI) or significant myocardial damage.
   • Correlate immediately with 12-lead ECG and clinical presentation.`,
    parameters: [
      {
        name: 'Troponin T',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Weakly Positive', isAbnormal: true },
          { value: 'Invalid / Repeat Advised', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Troponin I Rapid',
    title: 'Troponin I Rapid',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Whole Blood / Serum / Plasma',
    turnaroundTime: '30 Minutes',
    description: 'Qualitative rapid card test for the detection of Cardiac Troponin I for evaluation of acute myocardial infarction.',
    notes: 'Method: Rapid Card',
    interpretation: '',
    parameters: [
      {
        name: 'Troponin I Rapid',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Weakly Positive', isAbnormal: true },
          { value: 'Invalid / Repeat Advised', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Troponin I',
    title: 'Troponin I',
    basePrice: 600,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of Cardiac Troponin I (cTnI) concentration in serum or plasma for evaluation of acute coronary syndrome.',
    notes: '',
    interpretation: `Initial Result In pg/ml | Remarks
-------------------------------------------------------------
<26.2 | The upper reference limit (99th percentile) for high sensitive Troponin I (hsTnI)
< 26.2 & pain < 6 hours | Repeat Sampling after 3 hrs, a 50% change from initial value is diagnostic of Myocardial Infarction (MI)
>26.2-262 | Repeat Sampling after 3 hrs, 50% change from initial value is diagnostic of Myocardial Infarction (MI)
>262 | MI may be ruled in as appropriate with 98% specificity

Note:
After MI, troponin rises within 4-8 hours, peaks at 12-24 hours, and remains elevated for upto 14 days.

Increased levels:
cTnI is highly cardio specific , though it may be elevated in nonischemic forms of cardiac injury including cardiac contusion, myocarditis, CHF, cardiomyopathy, Interventional therapy like cardiac surgery, and drug-induced cardiotoxicity.
Normal troponin is defined as values upto the 99th percentile of healthy adults. “False positive” troponin may be seen in pulmonary embolism, myocarditis, pericarditis, heart failure, intracranial insults, rhabdomyolysis, sepsis, shock, and renal insufficiency.`,
    parameters: [
      {
        name: 'Troponin I',
        referenceRange: '< 0.1 ng/mL',
        unit: 'ng/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Triglycerides',
    title: 'Triglycerides',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Fasting)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of serum triglycerides concentration to evaluate lipid metabolism and cardiovascular risk.',
    notes: '',
    interpretation: `Physiological basis
Dietary fat is hydrolyzed in the small intestine, absorbed and resynthesized by mucosal cells, and secreted into lacteals as chylomicrons.
Triglycerides in the chylomicrons are cleared from the blood by tissue lipoprotein lipase. Endogenous triglyceride production occurs in the liver. These triglycerides are transported in association with β-lipoproteins in very low-density lipoproteins (VLDL).

Interpretation
Increased in: Hypothyroidism, diabetes mellitus, nephrotic syndrome, chronic alcoholism (fatty liver), biliary tract obstruction, stress, familial lipoprotein lipase deficiency, familial dysbetalipoproteinemia, familial combined hyperlipidemia, obesity, metabolic syndrome, viral hepatitis, cirrhosis, pancreatitis, chronic renal failure, gout, pregnancy, glycogen storage diseases types I, III, and VI, anorexia nervosa, dietary excess.
Drugs: β-blockers, cholestyramine, corticosteroids, diazepam, diuretics, estrogens, oral contraceptives.
Decreased in: Tangier disease (α-lipoprotein deficiency), hypo- and abetalipoproteinemia, malnutrition, malabsorption, parenchymal liver disease, hyperthyroidism, intestinal lymphangiectasia.
Drugs: ascorbic acid, clofibrate, nicotinic acid, gemfibrozil.

Comments
If the serum is clear, the serum triglyceride level is generally <350 mg/dL.
Elevated triglycerides are now considered an independent risk factor for coronary artery disease and a major risk factor for acute pancreatitis, particularly when serum triglyceride levels are > 1000 mg/dL and can be seen when a primary lipid disorder that is exacerbated by alcohol or fat intake or by corticosteroid or estrogen therapy.`,
    parameters: [
      {
        name: 'Triglycerides',
        referenceRange: '25 - 200',
        unit: 'mg/dl',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Transferrin Saturation',
    title: 'Transferrin Saturation',
    basePrice: 300,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Calculated percentage of transferrin iron-binding sites occupied by iron (Serum Iron / TIBC x 100) to evaluate iron deficiency and overload.',
    notes: 'Method: Calculated',
    interpretation: '',
    parameters: [
      {
        name: 'Transferrin Saturation',
        referenceRange: '20 - 55',
        unit: '%',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'TPHA',
    title: 'TPHA',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Specific treponemal serological test (TPHA) for the detection of antibodies to Treponema pallidum for syphilis diagnosis.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Treponema Pallidum Hemagglutination Assay',
        referenceRange: 'Non-Reactive',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Non-Reactive', isAbnormal: false },
          { value: 'Negative', isAbnormal: false },
          { value: 'Reactive', isAbnormal: true },
          { value: 'Positive', isAbnormal: true },
          { value: 'Weakly Reactive', isAbnormal: true },
          { value: 'Borderline / Equivocal', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Treponema Pallidum Hemagglutination Assay',
    title: 'Treponema Pallidum Hemagglutination Assay',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Specific treponemal serological test (TPHA) for the detection of antibodies to Treponema pallidum for syphilis diagnosis.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Treponema Pallidum Hemagglutination Assay',
        referenceRange: 'Non-Reactive',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Non-Reactive', isAbnormal: false },
          { value: 'Negative', isAbnormal: false },
          { value: 'Reactive', isAbnormal: true },
          { value: 'Positive', isAbnormal: true },
          { value: 'Weakly Reactive', isAbnormal: true },
          { value: 'Borderline / Equivocal', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Toxo IgM',
    title: 'Toxo IgM',
    basePrice: 500,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '4 Hours',
    description: 'Quantitative / semi-quantitative determination of IgM antibodies to Toxoplasma gondii in human serum for diagnosis of acute toxoplasmosis.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Toxo IgM',
        referenceRange: 'Neg. < 2 AU/mL\nGrey Zone 2 - 2.6 AU/mL\nPos. > 2.6 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Toxoplasma IgM',
    title: 'Toxoplasma IgM',
    basePrice: 500,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '4 Hours',
    description: 'Quantitative / semi-quantitative determination of IgM antibodies to Toxoplasma gondii in human serum for diagnosis of acute toxoplasmosis.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Toxo IgM',
        referenceRange: 'Neg. < 2 AU/mL\nGrey Zone 2 - 2.6 AU/mL\nPos. > 2.6 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Toxo IgG',
    title: 'Toxo IgG',
    basePrice: 500,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '4 Hours',
    description: 'Quantitative determination of IgG antibodies to Toxoplasma gondii in human serum for immune status evaluation.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Toxo IgG',
        referenceRange: '< 2 IU/mL',
        unit: 'IU/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Toxoplasma IgG',
    title: 'Toxoplasma IgG',
    basePrice: 500,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '4 Hours',
    description: 'Quantitative determination of IgG antibodies to Toxoplasma gondii in human serum for immune status evaluation.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Toxo IgG',
        referenceRange: '< 2 IU/mL',
        unit: 'IU/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Total RBC Count',
    title: 'Total RBC Count',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative estimation of the total number of red blood cells per volume of blood to evaluate anemia and erythropoiesis.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Total RBC Count',
        referenceRange: '4.5 - 5.5',
        unit: 'million/cumm',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'RBC Count',
    title: 'RBC Count',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative estimation of the total number of red blood cells per volume of blood to evaluate anemia and erythropoiesis.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Total RBC Count',
        referenceRange: '4.5 - 5.5',
        unit: 'million/cumm',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Total PSA',
    title: 'Total PSA',
    basePrice: 500,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of total Prostate-Specific Antigen (PSA) in serum for prostate cancer screening and monitoring.',
    notes: '',
    interpretation: `Physiological basis
PSA is a glycoprotein produced by cells of the prostatic ductal epithelium and is present in the serum of all men. It is absent from the serum of women.

Interpretation
Increased in: Prostate carcinoma (sensitivity ~20%; specificity ~60–70% at a 4.0 ng/mL cutoff), biochemical recurrence after localized treatment, benign prostatic hypertrophy (BPH), prostatitis.
Decreased in: Metastatic prostate carcinoma treated with antiandrogen therapy, postprostatectomy, 5α-reductase inhibitor therapy.

Comments
PSA is used both for the early detection of prostate cancer and as a tumor marker to assess response and monitor recurrence of treated prostate cancer.
There is still no consensus on whether PSA measurement should be used as a screening test for early detection of prostate cancer.
A decrease in mortality rates resulting from use for cancer screening is unproven, and the risks of early therapy are significant. As a result, the United States Preventive Services Task Force discourages use of the test for healthy men in all age groups.
The PSA nadir (the lowest PSA level achieved after therapeutic intervention) appears to correlate with the likelihood of remaining disease free. Three consecutive PSA rises are interpreted as an indicator of treatment (biochemical) failure.
PSA is often increased in BPH, and the positive predictive value in healthy older men is low. Use of the free/total PSA ratio or the complex PSA test and prostate volume can improve the diagnostic accuracy for prostate cancer.`,
    parameters: [
      {
        name: 'Total PSA',
        referenceRange: '< 4 ng/mL',
        unit: 'ng/mL',
        gender: 'Male',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'PSA (Prostate Specific Antigen)',
    title: 'PSA (Prostate Specific Antigen)',
    basePrice: 500,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of total Prostate-Specific Antigen (PSA) in serum for prostate cancer screening and monitoring.',
    notes: '',
    interpretation: `Physiological basis
PSA is a glycoprotein produced by cells of the prostatic ductal epithelium and is present in the serum of all men. It is absent from the serum of women.

Interpretation
Increased in: Prostate carcinoma (sensitivity ~20%; specificity ~60–70% at a 4.0 ng/mL cutoff), biochemical recurrence after localized treatment, benign prostatic hypertrophy (BPH), prostatitis.
Decreased in: Metastatic prostate carcinoma treated with antiandrogen therapy, postprostatectomy, 5α-reductase inhibitor therapy.

Comments
PSA is used both for the early detection of prostate cancer and as a tumor marker to assess response and monitor recurrence of treated prostate cancer.
There is still no consensus on whether PSA measurement should be used as a screening test for early detection of prostate cancer.
A decrease in mortality rates resulting from use for cancer screening is unproven, and the risks of early therapy are significant. As a result, the United States Preventive Services Task Force discourages use of the test for healthy men in all age groups.
The PSA nadir (the lowest PSA level achieved after therapeutic intervention) appears to correlate with the likelihood of remaining disease free. Three consecutive PSA rises are interpreted as an indicator of treatment (biochemical) failure.
PSA is often increased in BPH, and the positive predictive value in healthy older men is low. Use of the free/total PSA ratio or the complex PSA test and prostate volume can improve the diagnostic accuracy for prostate cancer.`,
    parameters: [
      {
        name: 'Total PSA',
        referenceRange: '< 4 ng/mL',
        unit: 'ng/mL',
        gender: 'Male',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Total Lipid',
    title: 'Total Lipid',
    basePrice: 250,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Fasting)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of total lipids in serum to evaluate lipid metabolism.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Total Lipid (Optional)',
        referenceRange: '< 600 mg%',
        unit: 'mg%',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Total Lipid (Optional)',
    title: 'Total Lipid (Optional)',
    basePrice: 250,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Fasting)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of total lipids in serum to evaluate lipid metabolism.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'Total Lipid (Optional)',
        referenceRange: '< 600 mg%',
        unit: 'mg%',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Total Iron Binding Capacity',
    title: 'Total Iron Binding Capacity',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Fasting preferred)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of Total Iron Binding Capacity (TIBC) in serum for evaluation of iron metabolism disorders.',
    notes: '',
    interpretation: `Physiologic Basis
Iron is transported in plasma complexed to transferrin, which is synthesized in the liver. Total iron-binding capacity is calculated from transferrin levels measured immunologically. Each molecule of transferrin has two iron-binding sites; so its iron- binding capacity is 1.47 mg/g. Normally, transferrin carries an amount of iron representing about 16–60% of its capacity to bind iron (eg, % saturation of iron-binding capacity is 16–60%).

Interpretation
Increased in: | Decreased in:
-------------------------------------------------------------
Iron deficiency anemia, late pregnancy, infancy, acute hepatitis. Drugs: oral contraceptives | Hypoproteinemic states (eg, nephrotic syndrome, starvation, malnutrition, cancer), hemochromatosis, thalassemia, hyperthyroidism, chronic infections, chronic inflammatory disorders, chronic liver disease, other chronic diseases.

Comments
TIBC correlates with serum transferrin, but the relationship is not linear over a wide range of transferrin values and is disrupted in diseases affecting transferrin-binding capacity or other iron-binding proteins. Increased % transferrin saturation with iron is seen in iron overload (iron poisoning, hemolytic anemia, sideroblastic anemia, thalassemia, hemochromatosis, pyridoxine deficiency, aplastic anemia, RBC transfusions). Decreased % transferrin saturation with iron is seen in iron deficiency (usually saturation <16%). Transferrin levels can also be used to assess nutritional status.`,
    parameters: [
      {
        name: 'Total Iron Binding Capacity (TIBC)',
        referenceRange: '240 - 450',
        unit: 'µg/dl',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Total Iron Binding Capacity (TIBC)',
    title: 'Total Iron Binding Capacity (TIBC)',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Fasting preferred)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of Total Iron Binding Capacity (TIBC) in serum for evaluation of iron metabolism disorders.',
    notes: '',
    interpretation: `Physiologic Basis
Iron is transported in plasma complexed to transferrin, which is synthesized in the liver. Total iron-binding capacity is calculated from transferrin levels measured immunologically. Each molecule of transferrin has two iron-binding sites; so its iron- binding capacity is 1.47 mg/g. Normally, transferrin carries an amount of iron representing about 16–60% of its capacity to bind iron (eg, % saturation of iron-binding capacity is 16–60%).

Interpretation
Increased in: | Decreased in:
-------------------------------------------------------------
Iron deficiency anemia, late pregnancy, infancy, acute hepatitis. Drugs: oral contraceptives | Hypoproteinemic states (eg, nephrotic syndrome, starvation, malnutrition, cancer), hemochromatosis, thalassemia, hyperthyroidism, chronic infections, chronic inflammatory disorders, chronic liver disease, other chronic diseases.

Comments
TIBC correlates with serum transferrin, but the relationship is not linear over a wide range of transferrin values and is disrupted in diseases affecting transferrin-binding capacity or other iron-binding proteins. Increased % transferrin saturation with iron is seen in iron overload (iron poisoning, hemolytic anemia, sideroblastic anemia, thalassemia, hemochromatosis, pyridoxine deficiency, aplastic anemia, RBC transfusions). Decreased % transferrin saturation with iron is seen in iron deficiency (usually saturation <16%). Transferrin levels can also be used to assess nutritional status.`,
    parameters: [
      {
        name: 'Total Iron Binding Capacity (TIBC)',
        referenceRange: '240 - 450',
        unit: 'µg/dl',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Total Cholesterol',
    title: 'Total Cholesterol',
    basePrice: 180,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Fasting preferred)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of total cholesterol in serum for cardiovascular risk and lipid disorder evaluation.',
    notes: '',
    interpretation: `Desirable: <200 mg/dL [<5.2 mmol/L]
Borderline: 200–239 mg/ dL [5.2–6.1 mmol/L]
High risk: >240 mg/dL [>6.2 mmol/L]

Physiological basis 
Cholesterol level is determined by lipid metabolism, which is in turn influenced by heredity, diet, and liver, kidney, thyroid, and other endocrine organ functions.

Interpretation 
Increased in: Primary disorders: polygenic hypercholesterolemia, familial hypercholesterolemia (deficiency of LDL receptors), familial combined hyperlipidemia, familial dysbetalipoproteinemia. Secondary disorders: hypothyroidism, uncontrolled diabetes mellitus, nephrotic syndrome, biliary obstruction, anorexia nervosa, hepatocellular carcinoma, Cushing syndrome, acute intermittent porphyria.
Drugs: corticosteroids.
Decreased in: Severe liver disease (acute hepatitis, cirrhosis, malignancy), hyperthyroidism, severe acute or chronic illness, malnutrition, malabsorption (eg, HIV), extensive burns, familial (Gaucher disease, Tangier disease), abetalipoproteinemia, intestinal lymphangiectasia.

Comments 
Coronary heart disease (CHD) risk depends on the ratio of total cholesterol to HDL cholesterol. The ratio of LDL to HDL cholesterol has similar predictive ability. Treatment decisions should be based on absolute CHD risk. The risk reduction is proportional to the reduction in LDL cholesterol achieved with treatment.`,
    parameters: [
      {
        name: 'Total Cholesterol',
        referenceRange: '125 - 200',
        unit: 'mg/dl',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Cholesterol',
    title: 'Serum Cholesterol',
    basePrice: 180,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Fasting preferred)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of total cholesterol in serum for cardiovascular risk and lipid disorder evaluation.',
    notes: '',
    interpretation: `Desirable: <200 mg/dL [<5.2 mmol/L]
Borderline: 200–239 mg/ dL [5.2–6.1 mmol/L]
High risk: >240 mg/dL [>6.2 mmol/L]

Physiological basis 
Cholesterol level is determined by lipid metabolism, which is in turn influenced by heredity, diet, and liver, kidney, thyroid, and other endocrine organ functions.

Interpretation 
Increased in: Primary disorders: polygenic hypercholesterolemia, familial hypercholesterolemia (deficiency of LDL receptors), familial combined hyperlipidemia, familial dysbetalipoproteinemia. Secondary disorders: hypothyroidism, uncontrolled diabetes mellitus, nephrotic syndrome, biliary obstruction, anorexia nervosa, hepatocellular carcinoma, Cushing syndrome, acute intermittent porphyria.
Drugs: corticosteroids.
Decreased in: Severe liver disease (acute hepatitis, cirrhosis, malignancy), hyperthyroidism, severe acute or chronic illness, malnutrition, malabsorption (eg, HIV), extensive burns, familial (Gaucher disease, Tangier disease), abetalipoproteinemia, intestinal lymphangiectasia.

Comments 
Coronary heart disease (CHD) risk depends on the ratio of total cholesterol to HDL cholesterol. The ratio of LDL to HDL cholesterol has similar predictive ability. Treatment decisions should be based on absolute CHD risk. The risk reduction is proportional to the reduction in LDL cholesterol achieved with treatment.`,
    parameters: [
      {
        name: 'Total Cholesterol',
        referenceRange: '125 - 200',
        unit: 'mg/dl',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Total Calcium',
    title: 'Total Calcium',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of total calcium concentration in serum to evaluate parathyroid, bone, and mineral metabolism.',
    notes: '',
    interpretation: `Physiological basis
Serum calcium is the sum of ionized calcium plus complex calcium and calcium bound to proteins (mostly albumin). Level of ionized calcium is regulated by parathyroid hormone and vitamin D.

Interpretation

Common causes of Hypocalcemia | Causes of Hypercalcemia
-------------------------------------------------------------
1. Chronic renal failure | 1. Increased intestinal absorption (vitamin d intoxication)
2. Hypomagnesemia | 2. Increased skeletal resorption
3. Hypoalbuminemia | 3. Primary hyperparathyroidism
Primary hyperparathyroidism and malignancy account for 90-95% of cases of hypercalcemia.

Comments
Need to know serum albumin to interpret calcium level. For every decrease in albumin by 1mg/dL, calcium should be corrected upward by 0.8 mg/dL. In 10% of patients with malignancies, hypercalcemia is attributable to coexistent hyperparathyroidism, suggesting that serum PTH levels should be measured at the initial presentation of all hypercalcemic patients.`,
    parameters: [
      {
        name: 'Total Calcium',
        referenceRange: '9 - 10.5',
        unit: 'mg/dl',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Calcium',
    title: 'Serum Calcium',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of total calcium concentration in serum to evaluate parathyroid, bone, and mineral metabolism.',
    notes: '',
    interpretation: `Physiological basis
Serum calcium is the sum of ionized calcium plus complex calcium and calcium bound to proteins (mostly albumin). Level of ionized calcium is regulated by parathyroid hormone and vitamin D.

Interpretation

Common causes of Hypocalcemia | Causes of Hypercalcemia
-------------------------------------------------------------
1. Chronic renal failure | 1. Increased intestinal absorption (vitamin d intoxication)
2. Hypomagnesemia | 2. Increased skeletal resorption
3. Hypoalbuminemia | 3. Primary hyperparathyroidism
Primary hyperparathyroidism and malignancy account for 90-95% of cases of hypercalcemia.

Comments
Need to know serum albumin to interpret calcium level. For every decrease in albumin by 1mg/dL, calcium should be corrected upward by 0.8 mg/dL. In 10% of patients with malignancies, hypercalcemia is attributable to coexistent hyperparathyroidism, suggesting that serum PTH levels should be measured at the initial presentation of all hypercalcemic patients.`,
    parameters: [
      {
        name: 'Total Calcium',
        referenceRange: '9 - 10.5',
        unit: 'mg/dl',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Magnesium',
    title: 'Magnesium',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of Magnesium level in serum/plasma to assess electrolyte balance, renal function, neuromuscular excitability, and metabolic disorders.',
    notes: '',
    interpretation: `Clinical Significance & Physiological Basis:
Magnesium (Mg²⁺) is the fourth most abundant cation in the human body and the second most prevalent intracellular cation after potassium. It acts as an essential cofactor in over 300 metabolic and enzymatic reactions, including adenosine triphosphate (ATP) synthesis, oxidative phosphorylation, glycolysis, DNA and protein synthesis, neuromuscular transmission, and cardiac rhythm regulation. It is also critical in regulating calcium and potassium transport across cell membranes.

Reference Range:
• Normal: 1.8 - 2.6 mg/dL (0.74 - 1.07 mmol/L)

Clinical Interpretation:

1. Hypomagnesemia (< 1.8 mg/dL):
   • Gastrointestinal Causes: Chronic diarrhea, malabsorption syndromes (celiac disease, Crohn's disease), acute pancreatitis, prolonged nasogastric suction, intestinal fistulae.
   • Renal Losses: Diuretic therapy (loop and thiazide diuretics), osmotic diuresis (uncontrolled diabetes mellitus), chronic renal tubular acidosis, hypercalcemia, nephrotoxic drugs (e.g., Aminoglycosides, Amphotericin B, Cisplatin, Cyclosporine, Proton Pump Inhibitors - PPIs).
   • Decreased Intake / Endocrine: Chronic alcoholism, severe malnutrition, total parenteral nutrition (TPN) lacking magnesium, primary/secondary aldosteronism, hyperthyroidism, diabetic ketoacidosis (recovery phase).
   • Clinical Features: Neuromuscular hyperexcitability, tremors, tetany, muscle spasms, positive Chvostek and Trousseau signs, paresthesias, seizures, refractory hypokalemia, hypocalcemia, cardiac arrhythmias (prolonged PR and QT intervals, widening of QRS, ST depression, T wave inversion, Torsades de Pointes).

2. Hypermagnesemia (> 2.6 mg/dL):
   • Renal Failure: Acute Kidney Injury (AKI) or Chronic Kidney Disease (CKD) with reduced glomerular filtration rate (GFR < 30 mL/min).
   • Iatrogenic / Exogenous Overload: Excessive administration of magnesium-containing antacids, laxatives, enemas, or intravenous magnesium sulfate therapy (e.g., for pre-eclampsia/eclampsia, status asthmaticus).
   • Endocrine & Other Causes: Adrenal insufficiency (Addison's disease), hypothyroidism, severe dehydration, diabetic ketoacidosis, tumor lysis syndrome, lithium therapy.
   • Clinical Features: Flushing, warmth, nausea, vomiting, lethargy, loss of deep tendon reflexes (DTRs at 4-6 mg/dL), hypotension, bradycardia, respiratory depression (> 10 mg/dL), cardiac conduction blocks, and cardiac arrest (> 15 mg/dL).

Notes & Clinical Correlations:
• Extracellular magnesium accounts for only ~1% of total body stores; serum levels may not always reflect total intracellular depletion.
• Hypomagnesemia should be suspected in any patient with unexplained refractory hypokalemia or hypocalcemia, as magnesium is essential for sodium-potassium ATPase pump activity and parathyroid hormone (PTH) release.`,
    parameters: [
      {
        name: 'Magnesium',
        referenceRange: '1.8 - 2.6',
        unit: 'mg/dL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Malaria Antigen',
    title: 'Malaria Antigen',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '2 Hours',
    description: 'Qualitative detection of Malaria parasites and antibodies/antigens in whole blood samples for early diagnosis and differentiation.',
    notes: '',
    interpretation: `Malaria antigen detection-whole blood
Four species of the plasmodium parasites are responsible for human malaria infections: P. falciparum, P. vivax, P. ovale and P. malariae. Early detection and differentiation of malaria is of paramount importance due to incidence of cerebral malaria and drug resistance associated with P. falciparum malaria causing most of the morbidity and mortality worldwide.

Test Utility
The current test is a qualitative test for detection of the P. falciparum specific histidine rich protein-2 (Pf. HRP-2) and P. vivax specific lactate dehydrogenase (pLDH) in whole blood samples. The assay is able to detect and distinguish P. vivax and P. falciparum infections and also identify mixed infections.

Notes & Limitations
The test detects P. falciparum specific HRP-2 and P. vivax specific LDH, a negative test result does not rule out infection with P. ovale and P. malariae. Constant exposure to the malarial parasites, as seen in areas of high endemicity, may result in positive results with doubtful clinical significance. Hence, the results must always be correlated with clinical history and relevant epidemiological and therapeutic context.`,
    parameters: [
      {
        name: 'IgG',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Non-Reactive', isAbnormal: false },
          { value: 'Reactive', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'IgM',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Non-Reactive', isAbnormal: false },
          { value: 'Reactive', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Mean Cell Haemoglobin, MCH',
    title: 'Mean Cell Haemoglobin, MCH',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of Mean Cell Haemoglobin (MCH) in blood to evaluate the average amount of haemoglobin inside a single red blood cell.',
    notes: '',
    interpretation: `Clinical Significance & Physiological Basis:
Mean Cell Haemoglobin (MCH) is a standard red blood cell (RBC) index that measures the average mass / amount of haemoglobin contained inside an individual erythrocyte (red blood cell). It is calculated by dividing total haemoglobin concentration by the total red blood cell count:
MCH (pg) = [Haemoglobin (g/dL) × 10] / RBC count (million/µL).

Reference Range:
• Normal / Desirable: 27 - 32 pg (picograms)

Clinical Interpretation:

1. Low MCH (< 27 pg) - Hypochromic Anemia:
   Indicates that red blood cells contain less haemoglobin than normal (hypochromia), usually appearing pale under microscopic peripheral smear examination.
   Common Etiologies:
   • Iron Deficiency Anemia (most common cause due to impaired heme synthesis)
   • Thalassemia Minor / Major (impaired globin chain synthesis)
   • Sideroblastic Anemia (defective iron utilization)
   • Anemia of Chronic Disease / Chronic Inflammation (hepcidin-mediated iron sequestration)
   • Lead Poisoning

2. High MCH (> 32 pg) - Hyperchromic / Macrocytic Anemia:
   Indicates that red blood cells are larger than normal and carry a greater mass of haemoglobin per cell.
   Common Etiologies:
   • Megaloblastic Anemias (Vitamin B12 deficiency, Folate / Folic Acid deficiency, Pernicious anemia)
   • Chronic Liver Disease / Cirrhosis
   • Chronic Alcoholism
   • Hypothyroidism
   • Myelodysplastic Syndromes (MDS)
   • Reticulocytosis (immature red blood cells are larger in volume and carry more haemoglobin)
   • False elevations due to cold agglutinins, hyperlipidemia, or extreme leukocytosis

Clinical Note:
MCH should always be evaluated in conjunction with other red cell indices, including Mean Corpuscular Volume (MCV), Mean Corpuscular Haemoglobin Concentration (MCHC), and Red Cell Distribution Width (RDW), alongside a Complete Blood Count (CBC) and peripheral blood smear review.`,
    parameters: [
      {
        name: 'Mean Cell Haemoglobin, MCH',
        referenceRange: '27 - 32',
        unit: 'Pg',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Mean Cell Haemoglobin CON, MCHC',
    title: 'Mean Cell Haemoglobin CON, MCHC',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of Mean Corpuscular Haemoglobin Concentration (MCHC) in blood to evaluate the average concentration of haemoglobin within a given volume of packed red blood cells.',
    notes: '',
    interpretation: `Clinical Significance & Physiological Basis:
Mean Cell Haemoglobin Concentration (MCHC) is an essential red blood cell (RBC) index that measures the average concentration of haemoglobin in a given volume of packed erythrocytes (red blood cells). Unlike MCH (which measures the absolute weight of haemoglobin per individual cell), MCHC relates haemoglobin content to total red cell volume.
Calculation formula:
MCHC (%) = [Haemoglobin (g/dL) / Hematocrit / PCV (%)] × 100
or MCHC = [MCH (pg) / MCV (fL)] × 100.

Reference Range:
• Normal: 31.5 - 34.5 % (or 31.5 - 34.5 g/dL)

Clinical Interpretation:

1. Low MCHC (< 31.5 %) - Hypochromia:
   Indicates diminished haemoglobin synthesis relative to erythrocyte cell volume.
   Common Etiologies:
   • Severe Iron Deficiency Anemia (impaired heme synthesis)
   • Thalassemia Syndromes (α-thalassemia, β-thalassemia minor/major)
   • Sideroblastic Anemia
   • Chronic Lead Poisoning
   • Chronic Disease Anemia with severe microcytosis

2. High MCHC (> 34.5 %) - Hyperchromia:
   True physiological hyperchromia is rare because intracellular haemoglobin reaches physical solubility limits (~37 g/dL). An elevated MCHC is a hallmark diagnostic clue for specific conditions.
   Common Etiologies:
   • Hereditary Spherocytosis (erythrocyte membrane defect causing cell dehydration and cellular spherical compaction)
   • Autoimmune Hemolytic Anemia (AIHA - due to spherocyte formation)
   • Sickle Cell Disease and Hemoglobin C Disease
   • Severe Cellular Dehydration / Hypertonic States
   • Laboratory / Pre-analytical Artifacts: Cold agglutinins (RBC clumping), severe hyperlipidemia, lipemia, hemolysis, high bilirubin, or extreme paraproteinemia.

Clinical Note:
MCHC provides an internal laboratory quality control check. An unusually elevated MCHC (> 36 %) often prompts investigation for cold agglutinins, lipemia, or hereditary spherocytosis. MCHC should always be interpreted in conjunction with MCV, MCH, RDW, and peripheral blood smear examination.`,
    parameters: [
      {
        name: 'Mean Cell Haemoglobin CON, MCHC',
        referenceRange: '31.5 - 34.5',
        unit: '%',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Mean Corpuscular Volume, MCV',
    title: 'Mean Corpuscular Volume, MCV',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of Mean Corpuscular Volume (MCV) in blood to evaluate the average physical volume / size of a single red blood cell (erythrocyte).',
    notes: '',
    interpretation: `Clinical Significance & Physiological Basis:
Mean Corpuscular Volume (MCV) is the cornerstone red blood cell (RBC) index used in the morphological classification of anemias. It measures the average physical volume/size of individual erythrocytes in femtoliters (fL, 10⁻¹⁵ L).
Calculation formula:
MCV (fL) = [Hematocrit / Packed Cell Volume (%) × 10] / Red Blood Cell Count (million/µL).

Reference Range:
• Normal / Normocytic: 83 - 101 fL

Clinical Interpretation & Differential Diagnosis:

1. Microcytic Anemia (Low MCV < 83 fL):
   Indicates abnormally small red blood cells.
   Common Etiologies:
   • Iron Deficiency Anemia (most frequent cause worldwide)
   • Thalassemia Minor / Major / Traits (defective alpha or beta globin chain synthesis; characteristically high RBC count with very low MCV and Mentzer Index < 13)
   • Sideroblastic Anemia (impaired heme synthesis)
   • Anemia of Chronic Disease / Chronic Inflammation (late or severe stages)
   • Chronic Lead Toxicity

2. Macrocytic Anemia (High MCV > 101 fL):
   Indicates abnormally large red blood cells.
   Common Etiologies:
   • Megaloblastic Anemias: Vitamin B12 deficiency (pernicious anemia, malabsorption) or Folate deficiency (impaired DNA synthesis with nuclear-cytoplasmic dyssynchrony and hypersegmented neutrophils)
   • Non-Megaloblastic Macrocytosis:
     - Chronic Liver Disease / Cirrhosis
     - Chronic Alcoholism (direct bone marrow toxicity)
     - Hypothyroidism / Myxedema
     - Myelodysplastic Syndromes (MDS) / Aplastic Anemia
     - Reticulocytosis (marked hemolytic anemia or acute post-hemorrhage response)
     - Drugs: Chemotherapeutic agents (Hydroxyurea, Methotrexate, Azathioprine), antiretrovirals (Zidovudine)
     - Cold agglutinins (clumped RBCs falsely read as single large cells by automated analyzers)

3. Normocytic Anemia (Normal MCV 83 - 101 fL):
   Indicates normal cell size in the setting of decreased total hemoglobin.
   Common Etiologies:
   • Acute Blood Loss / Hemorrhage
   • Early Iron Deficiency or Mixed Nutritional Anemia (combined B12 and Iron deficiency with wide RDW)
   • Anemia of Chronic Renal Failure (decreased erythropoietin production)
   • Bone Marrow Infiltration / Aplasia
   • Hemolytic Anemias without marked reticulocytosis

Clinical Note:
MCV must be interpreted alongside Red Cell Distribution Width (RDW), MCH, MCHC, Serum Ferritin, Vitamin B12/Folate levels, Reticulocyte count, and peripheral blood smear cytology.`,
    parameters: [
      {
        name: 'Mean Corpuscular Volume, MCV',
        referenceRange: '83 - 101',
        unit: 'fL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Filarial Parasite (Card Test)',
    title: 'Filarial Parasite (Card Test)',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Whole Blood / Serum',
    turnaroundTime: '2 Hours',
    description: 'Rapid immunochromatographic card test for the qualitative detection of circulating Wuchereria bancrofti filarial antigens in human blood/serum.',
    notes: '',
    interpretation: `Result | Remarks
Detected | Indicates the presence of circulating Wuchereria bancrofti antigen.
Not Detected | Indicates absence of circulating Wuchereria bancrofti antigen

Note:
- Positive results are seen in parasitic disease of the human lymph system caused by Wuchereria bancrofti (W. bancrofti) leading to conditions like lymphedema, hydrocele and disfiguring disease of elephantiasis.
- Results should be correlated with clinical conditions and tests like thick smear microscopy and membrane filtration test.
- False positive results may be due to cross-reactivity with Loa loa spp or other nematode infection.
- False negative reactions may be due to the processing of samples collected early in the course of disease or low threshold of antigen. The test should be repeated on a new specimen obtained after two weeks.

Uses
- To diagnose lymphatic and non-lymphatic filariasis.
- For mapping the endemicity of lymphatic filariasis.
- For monitoring and transmission assessment surveys (TAS) of Wuchereria bancrofti.`,
    parameters: [
      {
        name: 'Filarial Parasite (Card Test)',
        referenceRange: 'Not Detected',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Not Detected', isAbnormal: false },
          { value: 'Detected', isAbnormal: true },
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Equivocal', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Microalbumin Creatinine Ratio, Urine Random',
    title: 'Microalbumin Creatinine Ratio, Urine Random',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Urine (Random / First Morning)',
    turnaroundTime: '4 Hours',
    description: 'Quantitative determination of urine microalbumin and urinary creatinine to calculate the Urine Albumin-to-Creatinine Ratio (UACR) for early detection of diabetic nephropathy and renal microvascular disease.',
    notes: '',
    interpretation: `Physiological Basis
The normal urinary albumin excretion is less than 30 mg/24 hr. On random spot urine collection, the albumin-to-creatinine ratio (ACR, mcg/mg) should be less than 30.

Category | Spot collection ACR (mg/g)
Normal | < 30
Microalbuminuria | 30-300
Clinical albuminuria | > 300

Interpretation
Increased in: Diabetes mellitus, diabetic nephropathy.

Comments
Microalbuminuria is a useful indicator of early nephropathy in diabetic patients. Urine albumin measurement requires a sensitive immunochemical assay. Urine dipstick analysis is often insensitive to microalbuminuria. Screening for microalbuminuria is often performed by measurement of the ACR in a random spot collection (preferred method).`,
    parameters: [
      {
        name: 'Microalbuminuria',
        referenceRange: '0 - 25',
        unit: 'mg/L',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Urinary creatinine',
        referenceRange: '28 - 217',
        unit: 'mg/dL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Urinary Albumin Creatinine Ratio (UACR)',
        referenceRange: '<30',
        unit: 'mg/g',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Microalbumin, Urine 24 hours',
    title: 'Microalbumin, Urine 24 hours',
    basePrice: 400,
    taxPercentage: 0,
    sampleType: 'Urine (24-Hour Collection)',
    turnaroundTime: '24 Hours',
    description: 'Quantitative determination of microalbumin excretion in a 24-hour urine collection using immunoturbidimetry to assess early diabetic nephropathy and renal microvascular disease.',
    notes: '',
    interpretation: `Physiological Basis & Clinical Significance:
Microalbuminuria refers to urinary albumin excretion that is above normal physiological levels but below the detection threshold of conventional urine dipstick tests. In healthy individuals, the glomerular filtration barrier restricts albumin excretion, resulting in less than 30 mg of albumin in a 24-hour urine collection.

Reference Interpretation (24-Hour Urine Collection):
• Normal: < 30 mg/24hrs
• Microalbuminuria (Incipient Nephropathy): 30 - 299 mg/24hrs
• Clinical / Macroalbuminuria (Overt Nephropathy): > 300 mg/24hrs

Clinical Significance:
1. Early Marker of Diabetic Nephropathy:
   Microalbuminuria is the earliest clinically detectable sign of diabetic kidney disease in patients with Type 1 and Type 2 Diabetes Mellitus. Early detection allows timely intervention with glycemic control and ACE inhibitors/ARBs to slow or reverse disease progression.
2. Cardiovascular Risk Marker:
   Persistent microalbuminuria is an independent risk factor for cardiovascular morbidity and generalized vascular endothelial dysfunction in hypertensive and non-diabetic patients.
3. Other Causes:
   Transient albuminuria may occur in high fever, strenuous physical exercise, severe urinary tract infections, acute heart failure, and acute hyperglycemia.

Note & Collection Guidelines:
• A complete 24-hour timed urine collection with accurate total volume measurement is essential for accurate quantitative calculation (mg/24 hours = Urine Albumin [mg/L] × Total Urine Volume [L]).
• Repeat testing (2 out of 3 specimens positive over a 3 to 6-month period) is recommended to confirm persistent microalbuminuria.`,
    parameters: [
      {
        name: 'Albumin/Microalbumin in Urine',
        referenceRange: '<= 30',
        unit: 'mg/L',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Urine volume, Total',
        referenceRange: '',
        unit: 'ml',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Albumin/Microalbumin by Immunoturbidimetry',
        referenceRange: 'Normal: <30 / Microalbuminuria: 30-299 / Clinical albuminuria: >300',
        unit: 'mg/24hrs',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Morphology',
    title: 'Morphology',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '4 Hours',
    description: 'Microscopic examination of peripheral blood smear (PBS) morphology evaluating the structural characteristics, size, shape, and maturity of erythrocytes, leukocytes, and thrombocytes.',
    notes: '',
    interpretation: `Clinical Significance & Physiological Basis:
Peripheral Blood Smear (PBS) Morphology examination provides a qualitative and quantitative microscopic evaluation of cellular components of blood (erythrocytes, leukocytes, and thrombocytes). It serves as an invaluable diagnostic tool that complements automated hematology analyzer parameters.

1. RBC Morphology (Erythrocytes):
• Normocytic Normochromic: Normal size (MCV 80-100 fL) and normal central pallor (1/3 of cell diameter).
• Microcytic Hypochromic: Seen in Iron Deficiency Anemia, Thalassemia, Anemia of Chronic Disease, Sideroblastic Anemia.
• Macrocytic / Megaloblastic: Oval macrocytes seen in Vitamin B12 / Folate deficiency; round macrocytes in liver disease, alcoholism, reticulocytosis.
• Anisopoikilocytosis: Variation in size (anisocytosis) and shape (poikilocytosis).
• Specific Poikilocytes:
  - Target Cells (Codocytes): Thalassemia, hemoglobinopathies (HbC, HbS), liver disease, post-splenectomy.
  - Spherocytes: Hereditary Spherocytosis, Autoimmune Hemolytic Anemia (AIHA).
  - Schistocytes (Fragmented RBCs / Helmet cells): Microangiopathic Hemolytic Anemia (TTP, HUS, DIC), mechanical heart valves.
  - Sickle Cells (Drepanocytes): Sickle Cell Anemia (HbSS).
  - Tear-drop cells (Dacryocytes): Primary Myelofibrosis, marrow infiltrative disorders.
  - Acanthocytes / Echinocytes: Liver disease, abetalipoproteinemia / renal disease, uremia.
• RBC Inclusions: Howell-Jolly bodies (hyposplenism), Basophilic stippling (lead poisoning, thalassemia), Cabot rings.

2. WBC Morphology (Leukocytes):
• Normal: Mature segmented neutrophils (2-5 lobes), lymphocytes, monocytes, eosinophils, and basophils.
• Left Shift / Toxic Changes: Band forms, toxic granulation, Döhle bodies, and cytoplasmic vacuolation (seen in acute bacterial infections, sepsis, burns).
• Hypersegmented Neutrophils (≥ 6 lobes): Hallmark of Megaloblastic Anemia (B12/Folate deficiency).
• Reactive / Atypical Lymphocytes: Infectious Mononucleosis (EBV, CMV), viral hepatitis, acute viral infections.
• Blast Cells / Immature Myeloid/Lymphoid Precursors: Acute Leukemias (AML, ALL), Myelodysplastic Syndromes, Chronic Leukemias (CML, CLL).
• Auer Rods: Pathognomonic for Acute Myeloid Leukemia (AML).

3. Platelet Morphology (Thrombocytes):
• Normal: Adequate numbers (approx. 7-15 platelets per 100x oil-immersion field), normal granularity.
• Giant / Large Platelets: Immune Thrombocytopenia (ITP), Bernard-Soulier syndrome, myeloproliferative neoplasms.
• Platelet Clumping: EDTA-induced pseudothrombocytopenia (requires recollection with sodium citrate/heparin).

Clinical Correlation:
Morphological findings must be correlated with clinical history, CBC indices (Hb, TLC, DLC, Platelet Count, MCV, RDW), and relevant biochemical investigations.`,
    parameters: [
      {
        name: 'RBC Morphology',
        referenceRange: 'Normocytic, Normochromic',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Normocytic, normochromic RBCs. No abnormal cells or parasites seen.', isAbnormal: false },
          { value: 'Microcytic, hypochromic RBCs with mild to moderate anisopoikilocytosis.', isAbnormal: true },
          { value: 'Macrocytic RBCs with oval macrocytes.', isAbnormal: true },
          { value: 'Dimorphic red cell picture.', isAbnormal: true },
          { value: 'Target cells and pencil cells seen.', isAbnormal: true },
          { value: 'Polychromatophilic red cells and nucleated RBCs seen.', isAbnormal: true },
          { value: 'Schistocytes and helmet cells seen.', isAbnormal: true },
          { value: 'Spherocytes seen.', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'WBC Morphology',
        referenceRange: 'Normal morphology',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Normal in number, distribution, and mature morphology.', isAbnormal: false },
          { value: 'Neutrophilic leukocytosis with toxic granulation and left shift.', isAbnormal: true },
          { value: 'Hypersegmented neutrophils seen (megaloblastic changes).', isAbnormal: true },
          { value: 'Relative/Absolute lymphocytosis with reactive/atypical lymphocytes.', isAbnormal: true },
          { value: 'Eosinophilia present with normal morphology.', isAbnormal: true },
          { value: 'Immature precursors / blast cells seen (advised flow cytometry / bone marrow biopsy).', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Platelet Morphology',
        referenceRange: 'Adequate, normal morphology',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Adequate in number, normal size and distribution.', isAbnormal: false },
          { value: 'Reduced in number on smear (Thrombocytopenia).', isAbnormal: true },
          { value: 'Increased in number on smear (Thrombocytosis).', isAbnormal: true },
          { value: 'Giant platelets and large forms noted.', isAbnormal: true },
          { value: 'Platelet clumping seen (suggest recollection in Citrate).', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Malaria Parasite (Card Test)',
    title: 'Malaria Parasite (Card Test)',
    basePrice: 300,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '1 Hour',
    description: 'Rapid immunochromatographic card assay for the qualitative detection and differential diagnosis of Plasmodium falciparum (Pf HRP-2) and Plasmodium vivax (Pv pLDH) in whole blood.',
    notes: '',
    interpretation: `Malaria antigen detection-whole blood
Four species of the plasmodium parasites are responsible for human malaria infection: P. falciparum, P. vivax, P. malariae and P. ovale. Early detection and differentiation of malaria is of paramount importance due to incidence of cerebral malaria and drug resistance associated with P. falciparum infection and to prevent serious morbidity and mortality worldwide.

Test Utility
The current test is a qualitative test for detection of the P. falciparum specific histidine rich protein-2 (HRP-2) and P. vivax specific parasite lactate dehydrogenase (pLDH) in whole blood samples. The assay is able to detect and distinguish P. vivax and P. falciparum infections and also identify mixed infections.

Notes & Limitations
The test detects P. falciparum specific HRP-2 and P. vivax specific LDH, a negative test result does not rule out infection with P. ovale and P. malariae. Constant exposure to the malarial parasites, as seen in areas of high endemicity, may result in positive results with doubtful clinical significance. Hence, the results must always be correlated with clinical history and relevant epidemiological and therapeutic context.`,
    parameters: [
      {
        name: 'Plasmodium falciparum "Pf"',
        referenceRange: 'NEGATIVE',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'NEGATIVE', isAbnormal: false },
          { value: 'POSITIVE', isAbnormal: true },
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Plasmodium vivax "Pv"',
        referenceRange: 'NEGATIVE',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'NEGATIVE', isAbnormal: false },
          { value: 'POSITIVE', isAbnormal: true },
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Malaria Parasite (Microscopic)',
    title: 'Malaria Parasite (Microscopic)',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA) / Fingerprick Smear',
    turnaroundTime: '2 Hours',
    description: 'Microscopic examination of stained thick and thin peripheral blood films (Giemsa/Leishman stain) for the detection, identification, and speciation of malarial parasites (Plasmodium species).',
    notes: '',
    interpretation: `Clinical Significance & Physiological Basis:
Microscopic examination of Giemsa / Leishman stained peripheral blood smears (thick and thin blood films) remains the established gold standard for the laboratory diagnosis of malaria. Thick smears provide high sensitivity for detecting low parasitemia levels, while thin smears allow accurate species identification and quantitation of parasitemia.

Result Interpretation:
1. Not Seen / Negative:
   • Indicates that no malarial parasites (trophozoites, schizonts, or gametocytes) were detected after examining a minimum of 200–300 oil immersion fields (1000x magnification) on the thick smear.
   • Note: A single negative blood smear does not exclude malaria, especially in early infection or low parasite density. Serial blood smears collected every 8 to 12 hours over a 24 to 48-hour period are recommended if clinical suspicion persists.

2. Positive / Seen:
   Identifies intraerythrocytic malarial parasites with species differentiation:
   • Plasmodium vivax (Pv): Enlarged infected erythrocytes, Schüffner's dots, amoeboid trophozoites, mature schizonts (12-24 merozoites), and round gametocytes.
   • Plasmodium falciparum (Pf): Normal-sized RBCs, delicate ring forms (often multiple per cell or appliqué/marginal forms), Maurer's clefts, and characteristic crescent/banana-shaped gametocytes. High risk of severe/cerebral malaria and high parasitemia.
   • Plasmodium malariae (Pm): Normal or slightly smaller RBCs, compact band forms, 'daisy head' schizonts (6-12 merozoites), Ziemann's dots.
   • Plasmodium ovale (Po): Enlarged oval erythrocytes with fimbriated edges and James's dots.

Clinical Recommendation:
If positive for P. falciparum, quantitation of parasitemia (% infected RBCs or parasites/µL) should be calculated and monitored to assess therapeutic response and detect treatment failure or drug resistance.`,
    parameters: [
      {
        name: 'Malaria Parasite (Microscopic)',
        referenceRange: 'Not Seen',
        unit: '',
        gender: 'Both',
        valueOptions: [
          { value: 'Not Seen', isAbnormal: false },
          { value: 'Seen - Plasmodium vivax (Pv) trophozoites / gametocytes seen', isAbnormal: true },
          { value: 'Seen - Plasmodium falciparum (Pf) ring forms / gametocytes seen', isAbnormal: true },
          { value: 'Seen - Mixed infection (P. vivax + P. falciparum)', isAbnormal: true },
          { value: 'Negative for Malarial Parasite (MP)', isAbnormal: false },
          { value: 'Positive for Malarial Parasite (MP)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Mean Platelet Volume, MPV (Optional)',
    title: 'Mean Platelet Volume, MPV (Optional)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of Mean Platelet Volume (MPV) in blood to evaluate the average size of circulating platelets and bone marrow megakaryocyte activity.',
    notes: '',
    interpretation: `Clinical Significance & Physiological Basis:
Mean Platelet Volume (MPV) is a calculated platelet index that measures the average physical size/volume of circulating thrombocytes (platelets) in femtoliters (fL). MPV reflects platelet production rate, bone marrow megakaryopoiesis activity, and platelet turnover.

Reference Range:
• Normal: 6.5 - 12.0 fL

Clinical Interpretation & Differential Diagnosis:

1. High MPV (> 12.0 fL) - Hyperdestructive / Regenerative States:
   Larger platelets are younger, metabolically active platelets recently released from the bone marrow.
   Common Etiologies:
   • Accelerated Platelet Destruction / Turnover with compensatory bone marrow response:
     - Immune / Idiopathic Thrombocytopenic Purpura (ITP)
     - Disseminated Intravascular Coagulation (DIC)
     - Thrombotic Thrombocytopenic Purpura (TTP) / Hemolytic Uremic Syndrome (HUS)
     - Sepsis and severe acute infections
     - Post-splenectomy
   • Myeloproliferative Neoplasms (MPN): Essential Thrombocythemia, Primary Myelofibrosis, Polycythemia Vera
   • Congenital Giant Platelet Syndromes: Bernard-Soulier syndrome, May-Hegglin anomaly
   • Increased Cardiovascular Risk: High MPV is associated with heightened prothrombotic risk, acute myocardial infarction, ischemic stroke, and metabolic syndrome.

2. Low MPV (< 6.5 fL) - Hypoproductive / Marrow Failure States:
   Small platelets indicate impaired bone marrow megakaryocytopoiesis or production failure.
   Common Etiologies:
   • Aplastic Anemia and Bone Marrow Suppression (chemotherapy, radiation)
   • Megaloblastic Anemia (due to Vitamin B12 or Folate deficiency)
   • Hypersplenism (splenic sequestration of larger platelets)
   • Chronic Renal Failure
   • Wiskott-Aldrich Syndrome (classic microthrombocytopenia)

Clinical Note:
MPV must always be evaluated in direct context with the Total Platelet Count, Platelet Distribution Width (PDW), and peripheral blood smear review. EDTA anticoagulant induces time-dependent platelet swelling; optimal measurement is obtained within 1 to 2 hours of venipuncture.`,
    parameters: [
      {
        name: 'Mean Platelet Volume, MPV (Optional)',
        referenceRange: '6.5 - 12',
        unit: 'fL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Myoglobin',
    title: 'Myoglobin',
    basePrice: 600,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of serum myoglobin concentration to assist in the early assessment of myocardial infarction, cardiac re-infarction, and skeletal muscle injury / rhabdomyolysis.',
    notes: '',
    interpretation: `Comments
Myoglobin is a protein found in heart and skeletal muscle. It leaks into the blood when muscle cells are damaged. It's useful for detecting heart attacks, early re-infarctions, and successful treatment. Myoglobin levels rise about 2 hours after a heart attack, peak in 4-12 hours, and return to normal within 24 hours. Since myoglobin is cleared by the kidneys, any changes in kidney function can affect its levels.

Clinical Use
To rule out a heart attack, if myoglobin levels don't change in several samples taken 2-6 hours after chest pain starts, it almost certainly means there's no heart muscle damage.`,
    parameters: [
      {
        name: 'Myoglobin',
        referenceRange: '< 70',
        unit: 'ng/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Non-HDL cholesterol',
    title: 'Non-HDL cholesterol',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination and calculation of Non-HDL Cholesterol (Total Cholesterol minus HDL) to evaluate total atherogenic lipoprotein burden and cardiovascular disease risk.',
    notes: '',
    interpretation: `Clinical Significance & Physiological Basis:
Non-HDL Cholesterol represents the total amount of cholesterol carried in all atherogenic (artery-clogging) apolipoprotein B-containing lipoproteins, which includes LDL (Low-Density Lipoprotein), VLDL (Very Low-Density Lipoprotein), IDL (Intermediate-Density Lipoprotein), and Lipoprotein(a).
Calculation Formula:
Non-HDL Cholesterol (mg/dL) = Total Cholesterol - HDL Cholesterol.

Reference Classification (NCEP ATP III / ACC/AHA Guidelines):
• Desirable / Optimal: < 130 mg/dL (Goal for low to moderate cardiovascular risk)
• Borderline High: 130 - 159 mg/dL
• High: 160 - 189 mg/dL
• Very High: ≥ 190 mg/dL

Therapeutic Targets Based on Atherosclerotic Cardiovascular Disease (ASCVD) Risk:
• Extreme Risk / Established ASCVD with DM: < 80 mg/dL (or < 70 mg/dL)
• Very High Risk (Known ASCVD or Diabetes with Target Organ Damage): < 100 mg/dL
• Moderate to High Risk: < 130 mg/dL

Clinical Advantages of Non-HDL Cholesterol:
1. Better Cardiovascular Predictor than LDL alone:
   Non-HDL cholesterol accounts for all atherogenic particles (including triglyceride-rich remnant lipoproteins like VLDL and IDL), making it a superior predictor of cardiovascular risk, myocardial infarction, and ischemic stroke.
2. Highly Reliable in Hypertriglyceridemia & Diabetes:
   In patients with hypertriglyceridemia (triglycerides > 200 mg/dL), diabetes mellitus, metabolic syndrome, or obesity, calculated LDL-C (Friedewald formula) often underestimates atherogenic particle burden. Non-HDL-C remains robust and accurate even when triglycerides are elevated.
3. Fasting vs Non-Fasting Utility:
   Non-HDL cholesterol is less affected by postprandial lipemia and can be evaluated on non-fasting blood samples.

Clinical Note:
Elevated Non-HDL cholesterol should be managed with lifestyle modifications (dietary changes, aerobic exercise, weight reduction) and guideline-directed lipid-lowering therapies (statins, ezetimibe, PCSK9 inhibitors) based on global ASCVD risk assessment.`,
    parameters: [
      {
        name: 'Non-HDL cholesterol',
        referenceRange: '< 130',
        unit: 'mg/dL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'NT- ProBNP (N-TERMINAL PRO B TYPE NATRIURETIC PEPTIDE)',
    title: 'NT- ProBNP (N-TERMINAL PRO B TYPE NATRIURETIC PEPTIDE)',
    basePrice: 1500,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: '2 Hours',
    description: 'Quantitative determination of N-Terminal Pro-B-Type Natriuretic Peptide (NT-proBNP) in blood to aid in the diagnosis, risk stratification, and monitoring of congestive heart failure and cardiac dysfunction.',
    notes: '',
    interpretation: `Chronic Heart failure
AGE OF PATIENTS | TITER | Result
<75 Year | <125 Pg/ml | Chronic heart failure unlikely
≥75 Year | <450 Pg/ml | Chronic heart failure unlikely

ACUTE HEART FAILURE
AGE OF PATIENTS | TITER | Result
<50 YEAR | <450 Pg/ml | Acute heart failure unlikely (Positive if >450 pg/mL)
50-75 YEAR | <900 Pg/ml | Acute heart failure unlikely (Positive if >900 pg/mL)
>75 YEARS | <1800 Pg/ml | Acute heart failure unlikely (Positive if >1800 pg/mL)

Clinical Significance & Physiological Basis:
N-Terminal pro-B-type Natriuretic Peptide (NT-proBNP) is an inactive 76-amino acid N-terminal fragment cleaved from proBNP during the release of the active hormone BNP by ventricular cardiomyocytes in response to increased myocardial wall stress, ventricular stretch, volume overload, and pressure overload. NT-proBNP has a longer biological half-life (~70–120 minutes) than BNP, offering higher diagnostic stability and sensitivity for heart failure.

Reference Range (General Normal Baseline):
• Normal / Low Risk: 0 - 115 pg/mL (or < 125 pg/mL for age < 75 yrs)

Diagnostic Cut-Offs & Clinical Interpretation:

1. Rule-Out Criteria for Chronic Heart Failure (Non-Acute Outpatient Setting):
• Age < 75 Years: < 125 pg/mL → Chronic heart failure unlikely
• Age ≥ 75 Years: < 450 pg/mL → Chronic heart failure unlikely

2. Age-Stratified Decision Cut-Offs for Acute Heart Failure (Emergency / Inpatient Setting):
• Age < 50 Years:
  - < 450 pg/mL: Acute heart failure unlikely (Rule-out)
  - > 450 pg/mL: Highly suggestive of Acute Heart Failure
• Age 50 - 75 Years:
  - < 900 pg/mL: Acute heart failure unlikely (Rule-out)
  - > 900 pg/mL: Highly suggestive of Acute Heart Failure
• Age > 75 Years:
  - < 1800 pg/mL: Acute heart failure unlikely (Rule-out)
  - > 1800 pg/mL: Highly suggestive of Acute Heart Failure

3. Clinical Confounders & Other Causes of Elevation:
• Renal Insufficiency / CKD (NT-proBNP is primarily cleared via renal filtration; eGFR < 60 mL/min leads to reduced clearance)
• Atrial Fibrillation / Tachyarrhythmias
• Pulmonary Embolism / Pulmonary Arterial Hypertension (Right ventricular strain)
• Severe Sepsis / Critical Illness / Advanced Age
• Acute Coronary Syndromes (ACS) / Myocardial Infarction
• Note: Lower NT-proBNP levels may be observed in patients with obesity (high BMI).

Clinical Application:
NT-proBNP is recommended for:
- Differentiating cardiac dyspnea from non-cardiac causes of shortness of breath.
- Risk stratification, prognostic assessment, and monitoring therapeutic response in acute and chronic heart failure.`,
    parameters: [
      {
        name: 'NT- ProBNP (N-TERMINAL PRO B TYPE NATRIURETIC PEPTIDE)',
        referenceRange: '0 - 115',
        unit: 'pg/mL',
        gender: 'Both',
        valueOptions: [],
        status: 'Active'
      }
    ]
  }
];

const seedStandardLabTemplates = async () => {
  try {
    require('dotenv').config({ path: path.join(__dirname, '../env') });
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management';
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
