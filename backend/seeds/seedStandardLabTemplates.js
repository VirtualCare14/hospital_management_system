const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
const fs = require('fs');
const envPath = fs.existsSync(path.join(__dirname, '../env')) ? path.join(__dirname, '../env') : path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });

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
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'KALA AZAR',
    title: 'KALA AZAR',
    basePrice: 500,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Qualitative detection of antibodies to Leishmania donovani (rK-39 antigen) in human serum for diagnosis of Visceral Leishmaniasis (Kala-azar).',
    notes: 'Interpretation\n\n• Positive → Suggestive of Visceral Leishmaniasis (Kala-azar)\n• Negative → No serological evidence of Kala-azar\n• Clinical correlation required',
    interpretation: 'Interpretation\n\n• Positive → Suggestive of Visceral Leishmaniasis (Kala-azar)\n• Negative → No serological evidence of Kala-azar\n• Clinical correlation required',
    parameters: [
      {
        name: 'LEISHMANIA rK-39 ANTIBODY, SERUM',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Insulin Random',
    title: 'Insulin Random',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Quantitative measurement of random insulin levels in serum to evaluate glucose metabolism, beta-cell function, and insulin resistance.',
    notes: `Note\n1. A single random blood sample for insulin may not be sufficient because insulin levels and blood glucose can vary widely over time.\n2. Insulin secretion can be stimulated by various factors, including high blood glucose, glucagon, amino acids, growth hormone, and catecholamines.\n3. Insulin assay results can be affected by insulin antibodies that develop in patients receiving bovine or porcine insulin treatments.\n\nClinical Utility\n• Evaluation of fasting hypoglycemia\n• Evaluation of Polycystic Ovary syndrome\n• Classification of Diabetes mellitus\n• Predict Diabetes mellitus\n• Assessment of Beta cell activity\n• Select optimal therapy for Diabetes\n• Investigation of insulin resistance\n• Predict the development of Coronary Artery Disease\n\nInterpretation\nIncreased levels - Insulinoma, Some Type II diabetic patients, Infantile hypoglycemia, Hyperinsulinism, Obesity, Cushing's syndrome, Oral contraceptives, Acromegaly, Hyperthyroidism\nDecreased levels - Untreated Type I Diabetes mellitus`,
    interpretation: `Note\n1. A single random blood sample for insulin may not be sufficient because insulin levels and blood glucose can vary widely over time.\n2. Insulin secretion can be stimulated by various factors, including high blood glucose, glucagon, amino acids, growth hormone, and catecholamines.\n3. Insulin assay results can be affected by insulin antibodies that develop in patients receiving bovine or porcine insulin treatments.\n\nClinical Utility\n• Evaluation of fasting hypoglycemia\n• Evaluation of Polycystic Ovary syndrome\n• Classification of Diabetes mellitus\n• Predict Diabetes mellitus\n• Assessment of Beta cell activity\n• Select optimal therapy for Diabetes\n• Investigation of insulin resistance\n• Predict the development of Coronary Artery Disease\n\nInterpretation\nIncreased levels - Insulinoma, Some Type II diabetic patients, Infantile hypoglycemia, Hyperinsulinism, Obesity, Cushing's syndrome, Oral contraceptives, Acromegaly, Hyperthyroidism\nDecreased levels - Untreated Type I Diabetes mellitus`,
    parameters: [
      {
        name: 'Insulin Random',
        referenceRange: '2.6 - 24.9',
        unit: 'µU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Iron',
    title: 'Iron',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Quantitative measurement of serum Iron level to evaluate iron metabolism, iron deficiency anemia, and hemochromatosis.',
    notes: `Physiological basis
Plasma iron concentration is determined by absorption from the intestine; storage in the intestine, liver, spleen, bone marrow; rate of breakdown or loss of hemoglobin; and rate of synthesis of new hemoglobin. The key regulator of iron homeostasis is hepcidin. Hepcidin excess or deficiency contributes to the dysregulation of iron homeostasis in hereditary and acquired iron disorders.

Interpretation
Increased in: Hemosiderosis (eg, multiple transfusions, excess iron administration), acute Fe poisoning (children), hemolytic anemia, pernicious anemia, aplastic or hypoplastic anemia, viral hepatitis, lead poisoning, thalassemia, hemochromatosis. Drugs: estrogens, ethanol, oral contraceptives.
Decreased in: Iron deficiency, nephrotic syndrome, chronic renal failure, many infections, active hematopoiesis, remission of pernicious anemia, hypothyroidism, malignancy (carcinoma), postoperative state, kwashiorkor.

Comments
Absence of stainable iron on bone marrow aspirate differentiates iron deficiency from other causes of microcytic anemia (eg, thalassemia, sideroblastic anemia, some chronic disease anemias), but the procedure is invasive and expensive. Serum iron, iron-binding capacity, transferrin saturation, serum ferritin or soluble transferrin receptor may obviate the need for bone marrow examination. Serum iron, transferrin saturation and ferritin are useful in screening family members for hereditary hemochromatosis.`,
    interpretation: `Physiological basis
Plasma iron concentration is determined by absorption from the intestine; storage in the intestine, liver, spleen, bone marrow; rate of breakdown or loss of hemoglobin; and rate of synthesis of new hemoglobin. The key regulator of iron homeostasis is hepcidin. Hepcidin excess or deficiency contributes to the dysregulation of iron homeostasis in hereditary and acquired iron disorders.

Interpretation
Increased in: Hemosiderosis (eg, multiple transfusions, excess iron administration), acute Fe poisoning (children), hemolytic anemia, pernicious anemia, aplastic or hypoplastic anemia, viral hepatitis, lead poisoning, thalassemia, hemochromatosis. Drugs: estrogens, ethanol, oral contraceptives.
Decreased in: Iron deficiency, nephrotic syndrome, chronic renal failure, many infections, active hematopoiesis, remission of pernicious anemia, hypothyroidism, malignancy (carcinoma), postoperative state, kwashiorkor.

Comments
Absence of stainable iron on bone marrow aspirate differentiates iron deficiency from other causes of microcytic anemia (eg, thalassemia, sideroblastic anemia, some chronic disease anemias), but the procedure is invasive and expensive. Serum iron, iron-binding capacity, transferrin saturation, serum ferritin or soluble transferrin receptor may obviate the need for bone marrow examination. Serum iron, transferrin saturation and ferritin are useful in screening family members for hereditary hemochromatosis.`,
    parameters: [
      {
        name: 'Iron',
        referenceRange: '65 - 175',
        unit: 'µg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HPLC',
    title: 'HPLC',
    basePrice: 1200,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '24 Hours',
    description: 'Hemoglobin HPLC (High-Performance Liquid Chromatography) / Electrophoresis for screening and diagnosis of thalassemia syndromes and hemoglobinopathies.',
    notes: `Methodology: High Performance Liquid Chromatography (CE-HPLC) / Hemoglobin Electrophoresis

Physiological Basis:
High Performance Liquid Chromatography (HPLC) is used for the qualitative and quantitative determination of normal and abnormal hemoglobin variants (hemoglobinopathies) and thalassemia syndromes (especially Beta Thalassemia). Normal adult hemoglobin is predominantly Hb A (Hb Adult, >95%), with small amounts of Hb A2 (2.0 - 3.5%) and Hb F (<1.0%).

Interpretation:
1. Normal Adult Pattern:
   • Hb Adult (Hb A0): 95.0 – 98.0 %
   • Hb A2: 2.0 – 3.5 %
   • Hb F: < 1.0 %

2. Beta Thalassemia Trait (Minor):
   • Hb A2: Elevated between 3.6% and 9.0% (Diagnostic cutoff: >3.5%)
   • Hb F: Normal or slightly elevated (1.0 - 5.0%)
   • Red Cell Indices: Microcytic hypochromic picture (Low MCV < 80 fL, Low MCH < 27 pg)

3. Beta Thalassemia Major / Intermedia:
   • Hb F: Markedly elevated (10% to >90%)
   • Hb A0: Significantly reduced or absent
   • Hb A2: Variable

4. Other Hemoglobin Variants:
   • Hb S: Sickle cell trait (Hb A + Hb S) or Sickle cell anemia (Hb S + Hb F, no Hb A)
   • Hb E / Hb D-Punjab / Hb C: Identified in specific chromatographic retention windows

Comments & Clinical Guidance:
• Severe iron deficiency anemia can artificially lower Hb A2 levels and may mask a concurrent Beta Thalassemia Trait. Evaluation and correction of iron status (Serum Ferritin/Iron) is recommended prior to re-testing if clinically indicated.
• Partner screening (antenatal / premarital counseling) and molecular genetic (DNA) analysis are recommended for definitive genetic risk assessment.`,
    interpretation: `Methodology: High Performance Liquid Chromatography (CE-HPLC) / Hemoglobin Electrophoresis

Physiological Basis:
High Performance Liquid Chromatography (HPLC) is used for the qualitative and quantitative determination of normal and abnormal hemoglobin variants (hemoglobinopathies) and thalassemia syndromes (especially Beta Thalassemia). Normal adult hemoglobin is predominantly Hb A (Hb Adult, >95%), with small amounts of Hb A2 (2.0 - 3.5%) and Hb F (<1.0%).

Interpretation:
1. Normal Adult Pattern:
   • Hb Adult (Hb A0): 95.0 – 98.0 %
   • Hb A2: 2.0 – 3.5 %
   • Hb F: < 1.0 %

2. Beta Thalassemia Trait (Minor):
   • Hb A2: Elevated between 3.6% and 9.0% (Diagnostic cutoff: >3.5%)
   • Hb F: Normal or slightly elevated (1.0 - 5.0%)
   • Red Cell Indices: Microcytic hypochromic picture (Low MCV < 80 fL, Low MCH < 27 pg)

3. Beta Thalassemia Major / Intermedia:
   • Hb F: Markedly elevated (10% to >90%)
   • Hb A0: Significantly reduced or absent
   • Hb A2: Variable

4. Other Hemoglobin Variants:
   • Hb S: Sickle cell trait (Hb A + Hb S) or Sickle cell anemia (Hb S + Hb F, no Hb A)
   • Hb E / Hb D-Punjab / Hb C: Identified in specific chromatographic retention windows

Comments & Clinical Guidance:
• Severe iron deficiency anemia can artificially lower Hb A2 levels and may mask a concurrent Beta Thalassemia Trait. Evaluation and correction of iron status (Serum Ferritin/Iron) is recommended prior to re-testing if clinically indicated.
• Partner screening (antenatal / premarital counseling) and molecular genetic (DNA) analysis are recommended for definitive genetic risk assessment.`,
    parameters: [
      {
        name: 'Hb F',
        referenceRange: '< 1.0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Peak 2',
        referenceRange: '0 - 2.5',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Hb Adult',
        referenceRange: '95.0 - 98.0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Hb A2',
        referenceRange: '2.0 - 3.5',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Hemoglobin',
        referenceRange: '12.0 - 16.0',
        unit: 'g/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'RBC Count',
        referenceRange: '4.0 - 5.5',
        unit: 'Mill/cml.',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Packed Cell Volume (PCV)',
        referenceRange: '36.0 - 48.0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'MCV',
        referenceRange: '80 - 100',
        unit: 'fL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'MCH',
        referenceRange: '27 - 32',
        unit: 'Pg',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'RDW',
        referenceRange: '11.5 - 14.5',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Hscrp',
    title: 'Hscrp (High-Sensitivity C-Reactive Protein)',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'High-Sensitivity C-Reactive Protein (hs-CRP) quantitative estimation in serum for assessing systemic inflammation and cardiovascular risk stratification.',
    notes: `Physiologic Basis
CRP is an acute-phase reactant protein. Hepatic secretion is stimulated in response to inflammatory cytokines. Unlike other acute-phase proteins, CRP is not affected by hormones. CRP activates the complement system, binds to Fc receptors, and serves as an opsonin for some microorganisms. Rapid, marked increases in CRP occur with inflammation, infection, trauma and tissue necrosis, malignancies, and autoimmune disorders. CRP levels are also valuable in assessing vascular inflammation and cardiovascular risk stratification. CRP level has been shown to be an independent risk factor for atherosclerotic disease. Elevated CRP levels are associated with increased cardiovascular morbidity and mortality in patients with coronary artery disease.

Interpretation
Increased in: Inflammatory states, including arteriosclerotic disorders.

Comments
CRP is a very sensitive but nonspecific marker of inflammation. A variety of conditions other than arteriosclerosis may cause dramatic increases in CRP levels. CRP levels increase within 2 hours of acute insult (eg, surgery, infection) and should peak and begin decreasing within 48 hours if no other inflammatory event occurs. In patients with rheumatoid arthritis, persistently elevated CRP concentrations are present when the disease is active and usually fall to normal during periods of complete remission. Patients with high hs-CRP concentrations are more likely to develop stroke, myocardial infarction, and severe peripheral vascular disease.`,
    interpretation: `Physiologic Basis
CRP is an acute-phase reactant protein. Hepatic secretion is stimulated in response to inflammatory cytokines. Unlike other acute-phase proteins, CRP is not affected by hormones. CRP activates the complement system, binds to Fc receptors, and serves as an opsonin for some microorganisms. Rapid, marked increases in CRP occur with inflammation, infection, trauma and tissue necrosis, malignancies, and autoimmune disorders. CRP levels are also valuable in assessing vascular inflammation and cardiovascular risk stratification. CRP level has been shown to be an independent risk factor for atherosclerotic disease. Elevated CRP levels are associated with increased cardiovascular morbidity and mortality in patients with coronary artery disease.

Interpretation
Increased in: Inflammatory states, including arteriosclerotic disorders.

Comments
CRP is a very sensitive but nonspecific marker of inflammation. A variety of conditions other than arteriosclerosis may cause dramatic increases in CRP levels. CRP levels increase within 2 hours of acute insult (eg, surgery, infection) and should peak and begin decreasing within 48 hours if no other inflammatory event occurs. In patients with rheumatoid arthritis, persistently elevated CRP concentrations are present when the disease is active and usually fall to normal during periods of complete remission. Patients with high hs-CRP concentrations are more likely to develop stroke, myocardial infarction, and severe peripheral vascular disease.`,
    parameters: [
      {
        name: 'High-Sensitivity C-Reactive Protein',
        referenceRange: '< 1.0',
        unit: 'mg/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HSV-2 IgG',
    title: 'HSV-2 IgG',
    basePrice: 750,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Quantitative/Qualitative determination of Herpes Simplex Virus Type 2 (HSV-2) IgG antibodies in human serum.',
    notes: `Methodology: Chemiluminescence Immunoassay (CLIA) / ELISA

Clinical Utility:
Herpes Simplex Virus Type 2 (HSV-2) is the primary causative agent of genital ulcer disease and neonatal herpes infections. Detection of specific IgG antibodies is used for assessing exposure history, diagnosis of past/chronic infection, and identification of asymptomatic HSV-2 carriers.

Interpretation:
• < 2.0 AU/mL : Negative (No detectable HSV-2 IgG antibodies)
• ≥ 2.0 AU/mL : Positive (Detectable HSV-2 IgG antibodies present)

Comments & Clinical Guidance:
1. A Negative (< 2.0 AU/mL) result indicates no detectable HSV-2 IgG antibodies. If primary infection is clinically suspected, retesting in 2-4 weeks is advised to allow for seroconversion.
2. A Positive (≥ 2.0 AU/mL) result indicates prior exposure and antibody production. Because HSV remains latent after initial infection, the presence of IgG antibodies indicates latent carriage and does not distinguish between acute, recurrent, or remote asymptomatic infection.
3. Clinical correlation and direct diagnostic methods (e.g. HSV PCR / viral swab from active lesions) should be used during acute clinical presentations.`,
    interpretation: `Methodology: Chemiluminescence Immunoassay (CLIA) / ELISA

Clinical Utility:
Herpes Simplex Virus Type 2 (HSV-2) is the primary causative agent of genital ulcer disease and neonatal herpes infections. Detection of specific IgG antibodies is used for assessing exposure history, diagnosis of past/chronic infection, and identification of asymptomatic HSV-2 carriers.

Interpretation:
• < 2.0 AU/mL : Negative (No detectable HSV-2 IgG antibodies)
• ≥ 2.0 AU/mL : Positive (Detectable HSV-2 IgG antibodies present)

Comments & Clinical Guidance:
1. A Negative (< 2.0 AU/mL) result indicates no detectable HSV-2 IgG antibodies. If primary infection is clinically suspected, retesting in 2-4 weeks is advised to allow for seroconversion.
2. A Positive (≥ 2.0 AU/mL) result indicates prior exposure and antibody production. Because HSV remains latent after initial infection, the presence of IgG antibodies indicates latent carriage and does not distinguish between acute, recurrent, or remote asymptomatic infection.
3. Clinical correlation and direct diagnostic methods (e.g. HSV PCR / viral swab from active lesions) should be used during acute clinical presentations.`,
    parameters: [
      {
        name: 'HSV-2 IgG',
        referenceRange: '< 2.0',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'iCalcium',
    title: 'iCalcium',
    basePrice: 400,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Quantitative measurement of Ionized Calcium (iCalcium) in blood to evaluate physiologically active calcium and calcium homeostasis.',
    notes: `Physiological Basis
Calcium circulates in three forms: as free Ca2+ (50–55%), protein bound to albumin and globulins (40–45%), and as calcium-ligand complexes (5–10%) (with citrate, bicarbonate, lactate, phosphate, and sulfate). Protein binding is highly pH-dependent, and acidosis results in an increased free calcium fraction. Ionized Ca2+ is the form that is physiologically active. Ionized calcium is a more accurate reflection of physiologic status than total calcium in patients with altered serum proteins (renal failure, nephrotic syndrome, multiple myeloma, etc), altered concentrations of calcium-binding ligands, and acid-base disturbances. Measurement of ionized calcium is by ion-selective electrodes. Ionized calcium levels vary inversely with pH, about 0.2 mg/dL per 0.1 pH unit change.

Interpretation
Increased in: ↓ Blood pH.
Decreased in: ↑ Blood pH, citrate, EDTA.

Comments
Ionized calcium measurements may be needed in special circumstances, eg, massive blood transfusion, transfusion of whole blood in neonates, liver transplantation, neonatal hypocalcemia, cardiac bypass surgery, and possibly monitoring of patients with secondary hyperparathyroidism from renal failure.`,
    interpretation: `Physiological Basis
Calcium circulates in three forms: as free Ca2+ (50–55%), protein bound to albumin and globulins (40–45%), and as calcium-ligand complexes (5–10%) (with citrate, bicarbonate, lactate, phosphate, and sulfate). Protein binding is highly pH-dependent, and acidosis results in an increased free calcium fraction. Ionized Ca2+ is the form that is physiologically active. Ionized calcium is a more accurate reflection of physiologic status than total calcium in patients with altered serum proteins (renal failure, nephrotic syndrome, multiple myeloma, etc), altered concentrations of calcium-binding ligands, and acid-base disturbances. Measurement of ionized calcium is by ion-selective electrodes. Ionized calcium levels vary inversely with pH, about 0.2 mg/dL per 0.1 pH unit change.

Interpretation
Increased in: ↓ Blood pH.
Decreased in: ↑ Blood pH, citrate, EDTA.

Comments
Ionized calcium measurements may be needed in special circumstances, eg, massive blood transfusion, transfusion of whole blood in neonates, liver transplantation, neonatal hypocalcemia, cardiac bypass surgery, and possibly monitoring of patients with secondary hyperparathyroidism from renal failure.`,
    parameters: [
      {
        name: 'iCalcium',
        referenceRange: '1.13 - 1.33',
        unit: 'mmol/l',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'IgA (Urine)',
    title: 'IgA (Urine)',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'Urine',
    turnaroundTime: '24 Hours',
    description: 'Quantitative measurement of Immunoglobulin A (IgA) in urine for evaluating renal glomerular damage and IgA nephropathy.',
    notes: `Methodology: Nephelometry / Turbidimetry / ELISA

Clinical Utility:
Immunoglobulin A (IgA) is the principal immunoglobulin of mucosal immunity. In normal kidneys, intact immunoglobulins like IgA are minimally filtered across the glomerular filtration barrier. Increased urinary excretion of IgA is observed in diseases involving glomerular injury, particularly IgA Nephropathy (Berger's Disease), Henoch-Schönlein purpura (HSP) nephritis, and active urinary tract immune responses.

Interpretation:
• < 6.0 µg/mL : Normal urinary IgA excretion.
• ≥ 6.0 µg/mL : Elevated urinary IgA excretion.

Clinical Significance of Elevated Urinary IgA:
1. IgA Nephropathy (Berger's Disease): Associated with mesangial IgA deposition and increased urinary loss during active episodes.
2. Glomerulonephritis / Nephrotic Syndrome: Increased glomerular permeability leading to proteinuria.
3. Systemic Vasculitis / Autoimmune Disorders: Henoch-Schönlein Purpura (IgA vasculitis), SLE nephritis.
4. Severe Urinary Tract Infection (UTI): Local mucosal antibody response to urothelial infection.

Comments & Guidance:
• Urinary IgA should be interpreted in conjunction with total urinary protein, urine microalbumin, serum IgA, renal function tests (serum creatinine, BUN), and renal biopsy when clinically indicated.`,
    interpretation: `Methodology: Nephelometry / Turbidimetry / ELISA

Clinical Utility:
Immunoglobulin A (IgA) is the principal immunoglobulin of mucosal immunity. In normal kidneys, intact immunoglobulins like IgA are minimally filtered across the glomerular filtration barrier. Increased urinary excretion of IgA is observed in diseases involving glomerular injury, particularly IgA Nephropathy (Berger's Disease), Henoch-Schönlein purpura (HSP) nephritis, and active urinary tract immune responses.

Interpretation:
• < 6.0 µg/mL : Normal urinary IgA excretion.
• ≥ 6.0 µg/mL : Elevated urinary IgA excretion.

Clinical Significance of Elevated Urinary IgA:
1. IgA Nephropathy (Berger's Disease): Associated with mesangial IgA deposition and increased urinary loss during active episodes.
2. Glomerulonephritis / Nephrotic Syndrome: Increased glomerular permeability leading to proteinuria.
3. Systemic Vasculitis / Autoimmune Disorders: Henoch-Schönlein Purpura (IgA vasculitis), SLE nephritis.
4. Severe Urinary Tract Infection (UTI): Local mucosal antibody response to urothelial infection.

Comments & Guidance:
• Urinary IgA should be interpreted in conjunction with total urinary protein, urine microalbumin, serum IgA, renal function tests (serum creatinine, BUN), and renal biopsy when clinically indicated.`,
    parameters: [
      {
        name: 'IgA (Urine)',
        referenceRange: '< 6.0',
        unit: 'µg/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: "Indirect Coomb's Test",
    title: "Indirect Coomb's Test",
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: "Indirect Antiglobulin Test (IAT / Indirect Coombs Test) for detecting circulating red blood cell alloantibodies and autoantibodies.",
    notes: `Physiologic Basis
Indirect antiglobulin test is used to demonstrate the presence in the patient’s serum/plasma of unexpected antibody to ABO and Rh-compatible reagent red blood cells. Patient serum or plasma is incubated in vitro with reagent red cells, which are then washed to remove unbound globulins. Agglutination that occurs when antihuman globulin (AHG, Coombs) reagent is added indicates that antibody has bound to a specific antigen present on the red cells.

Interpretation
Positive in: Presence of alloantibody or autoantibody. Drugs: methyldopa.

Comments
The technique is used in antibody detection and identification, and in the AHG crossmatch prior to transfusion.`,
    interpretation: `Physiologic Basis
Indirect antiglobulin test is used to demonstrate the presence in the patient’s serum/plasma of unexpected antibody to ABO and Rh-compatible reagent red blood cells. Patient serum or plasma is incubated in vitro with reagent red cells, which are then washed to remove unbound globulins. Agglutination that occurs when antihuman globulin (AHG, Coombs) reagent is added indicates that antibody has bound to a specific antigen present on the red cells.

Interpretation
Positive in: Presence of alloantibody or autoantibody. Drugs: methyldopa.

Comments
The technique is used in antibody detection and identification, and in the AHG crossmatch prior to transfusion.`,
    parameters: [
      {
        name: "Indirect Coomb's Test",
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Positive (1+)', isAbnormal: true },
          { value: 'Positive (2+)', isAbnormal: true },
          { value: 'Positive (3+)', isAbnormal: true },
          { value: 'Positive (4+)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Iron Studies',
    title: 'Iron Studies',
    basePrice: 850,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Comprehensive iron profile including Serum Iron, UIBC, Total Iron Binding Capacity (TIBC), and Transferrin Saturation for diagnosing iron deficiency and iron overload disorders.',
    notes: `Physiological basis
Plasma iron concentration is determined by absorption from the intestine; storage in the intestine, liver, spleen, bone marrow, rate of breakdown or loss of hemoglobin, and rate of synthesis of new hemoglobin.

Interpretation for Iron (Fe), serum or plasma:
• Increased in: Hemosiderosis (eg, multiple transfusions, excess iron administration), acute Fe poisoning (children), hemolytic anemia, pernicious anemia, aplastic or hypoplastic anemia, viral hepatitis, lead poisoning, thalassemia, hemochromatosis. Drugs: estrogens, ethanol, oral contraceptives.
• Decreased in: Iron deficiency, nephrotic syndrome, chronic renal failure, many infections, active hematopoiesis, remission of pernicious anemia, hypothyroidism, malignancy (carcinoma), postoperative state, kwashiorkor.

Total Iron Binding Capacity (TIBC):
TIBC correlates with serum transferrin, but the relationship is not linear over a wide range of transferrin values and is disrupted in diseases affecting transferrin-binding capacity or other iron-binding proteins.
• Increased in: Iron deficiency anemia, late pregnancy, infancy, acute hepatitis. Drugs: oral contraceptives.
• Decreased in: Hypoproteinemic states (eg, nephrotic syndrome, starvation, malnutrition, cancer), hemochromatosis, thalassemia, hyperthyroidism, chronic infections, chronic inflammatory disorders, chronic liver disease, and other chronic diseases.

Transferrin Saturation (%):
• Increased % transferrin saturation with iron is seen in iron overload (iron poisoning, hemolytic anemia, sideroblastic anemia, thalassemia, hemochromatosis, pyridoxine deficiency, aplastic anemia, RBC transfusions).
• Decreased % transferrin saturation with iron is seen in iron deficiency (usually saturation < 16%). It can also be used to assess nutritional status.`,
    interpretation: `Physiological basis
Plasma iron concentration is determined by absorption from the intestine; storage in the intestine, liver, spleen, bone marrow, rate of breakdown or loss of hemoglobin, and rate of synthesis of new hemoglobin.

Interpretation for Iron (Fe), serum or plasma:
• Increased in: Hemosiderosis (eg, multiple transfusions, excess iron administration), acute Fe poisoning (children), hemolytic anemia, pernicious anemia, aplastic or hypoplastic anemia, viral hepatitis, lead poisoning, thalassemia, hemochromatosis. Drugs: estrogens, ethanol, oral contraceptives.
• Decreased in: Iron deficiency, nephrotic syndrome, chronic renal failure, many infections, active hematopoiesis, remission of pernicious anemia, hypothyroidism, malignancy (carcinoma), postoperative state, kwashiorkor.

Total Iron Binding Capacity (TIBC):
TIBC correlates with serum transferrin, but the relationship is not linear over a wide range of transferrin values and is disrupted in diseases affecting transferrin-binding capacity or other iron-binding proteins.
• Increased in: Iron deficiency anemia, late pregnancy, infancy, acute hepatitis. Drugs: oral contraceptives.
• Decreased in: Hypoproteinemic states (eg, nephrotic syndrome, starvation, malnutrition, cancer), hemochromatosis, thalassemia, hyperthyroidism, chronic infections, chronic inflammatory disorders, chronic liver disease, and other chronic diseases.

Transferrin Saturation (%):
• Increased % transferrin saturation with iron is seen in iron overload (iron poisoning, hemolytic anemia, sideroblastic anemia, thalassemia, hemochromatosis, pyridoxine deficiency, aplastic anemia, RBC transfusions).
• Decreased % transferrin saturation with iron is seen in iron deficiency (usually saturation < 16%). It can also be used to assess nutritional status.`,
    parameters: [
      {
        name: 'Iron',
        referenceRange: '65 - 175',
        unit: 'µg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'UIBC',
        referenceRange: '155 - 355',
        unit: 'µg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Total Iron Binding Capacity (TIBC)',
        referenceRange: '240 - 450',
        unit: 'µg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Transferrin Saturation',
        referenceRange: '20 - 55',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'LH',
    title: 'LH (Luteinising Hormone)',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Quantitative measurement of Luteinising Hormone (LH) in serum to evaluate gonadal function, fertility, pituitary disorders, and PCOS.',
    notes: `Physiological basis :
LH is stimulated by the hypothalamic hormone gonadotropin- releasing hormone (GnRH). It is secreted from the anterior pituitary and acts on the gonads. LH is the principal regulator of steroid biosynthesis in the ovary and testis.

Interpretation :
Increased in: Primary hypogonadism, polycystic ovary syndrome, postmenopause, endometriosis, after depot leuprolide injection; immunoassay result may be falsely elevated in pregnancy.
Decreased in: Pituitary or hypothalamic failure, anorexia nervosa, bulimia, advanced prostate cancer, severe stress, malnutrition, Kallman syndrome (gonadotropin deficiency associated with anosmia). Drugs: digoxin, oral contraceptives, phenothiazines.

Comments
In male hypogonadism, serum LH and FSH levels can distinguish between primary (hypergonadotropic) and secondary (hypogonadotropic) hypogonadism. Hypogonadism associated with aging (andropause) may present a mixed picture, with low testosterone levels and low to low-normal gonadotropin levels. Repeated measurement may be required to diagnose gonadotropin deficiencies.
Elevated serum LH levels are a common feature in polycystic ovary syndrome, but measurement of total testosterone is the test of choice to diagnose polycystic ovary syndrome.`,
    interpretation: `Physiological basis :
LH is stimulated by the hypothalamic hormone gonadotropin- releasing hormone (GnRH). It is secreted from the anterior pituitary and acts on the gonads. LH is the principal regulator of steroid biosynthesis in the ovary and testis.

Interpretation :
Increased in: Primary hypogonadism, polycystic ovary syndrome, postmenopause, endometriosis, after depot leuprolide injection; immunoassay result may be falsely elevated in pregnancy.
Decreased in: Pituitary or hypothalamic failure, anorexia nervosa, bulimia, advanced prostate cancer, severe stress, malnutrition, Kallman syndrome (gonadotropin deficiency associated with anosmia). Drugs: digoxin, oral contraceptives, phenothiazines.

Comments
In male hypogonadism, serum LH and FSH levels can distinguish between primary (hypergonadotropic) and secondary (hypogonadotropic) hypogonadism. Hypogonadism associated with aging (andropause) may present a mixed picture, with low testosterone levels and low to low-normal gonadotropin levels. Repeated measurement may be required to diagnose gonadotropin deficiencies.
Elevated serum LH levels are a common feature in polycystic ovary syndrome, but measurement of total testosterone is the test of choice to diagnose polycystic ovary syndrome.`,
    parameters: [
      {
        name: 'Luteinising Hormone, LH',
        referenceRange: '1.7 - 8.6',
        unit: 'mIU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Lipase',
    title: 'Lipase',
    basePrice: 500,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Quantitative measurement of serum Lipase activity for the diagnosis and monitoring of acute pancreatitis and pancreatic disorders.',
    notes: `Physiologic Basis
Lipases are responsible for hydrolysis of glycerol esters of long-chain fatty acids to produce fatty acids and glycerol.

Interpretation
Increased in: Acute, recurrent, or chronic pancreatitis, pancreatic pseudocyst, pancreatic malignancy, peritonitis, biliary disease, hepatic disease, diabetes mellitus (especially diabetic ketoacidosis), intestinal disease, gastric malignancy or perforation, cystic fibrosis, inflammatory bowel disease (Crohn disease and ulcerative colitis).

Comments
Serum lipase may be a more reliable test than serum amylase for the initial diagnosis of acute pancreatitis, because of its increased sensitivity in acute alcoholic pancreatitis and because lipase remains elevated longer than amylase.`,
    interpretation: `Physiologic Basis
Lipases are responsible for hydrolysis of glycerol esters of long-chain fatty acids to produce fatty acids and glycerol.

Interpretation
Increased in: Acute, recurrent, or chronic pancreatitis, pancreatic pseudocyst, pancreatic malignancy, peritonitis, biliary disease, hepatic disease, diabetes mellitus (especially diabetic ketoacidosis), intestinal disease, gastric malignancy or perforation, cystic fibrosis, inflammatory bowel disease (Crohn disease and ulcerative colitis).

Comments
Serum lipase may be a more reliable test than serum amylase for the initial diagnosis of acute pancreatitis, because of its increased sensitivity in acute alcoholic pancreatitis and because lipase remains elevated longer than amylase.`,
    parameters: [
      {
        name: 'Lipase',
        referenceRange: '0 - 67',
        unit: 'U/l',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'LDL Cholesterol',
    title: 'LDL Cholesterol',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Direct measurement of Low-Density Lipoprotein (LDL) Cholesterol in serum for cardiovascular risk assessment and lipid disorder management.',
    notes: `Clinical Significance:
Low-Density Lipoprotein (LDL) cholesterol is the primary atherogenic lipoprotein. Elevated levels of circulating LDL cholesterol lead to plaque deposition in arterial walls (atherosclerosis), increasing the risk of coronary artery disease (CAD), myocardial infarction, and stroke.

National Cholesterol Education Program (NCEP ATP III) Risk Categories:
• < 100 mg/dL : Optimal
• 100 – 129 mg/dL : Near optimal / Above optimal
• 130 – 159 mg/dL : Borderline high
• 160 – 189 mg/dL : High
• ≥ 190 mg/dL : Very high

Causes of Elevated LDL:
• Familial hypercholesterolemia, familial combined hyperlipidemia
• High saturated fat and trans-fat diets, obesity, sedentary lifestyle
• Secondary causes: Hypothyroidism, nephrotic syndrome, chronic kidney disease, diabetes mellitus, cholestasis
• Drugs: Progestins, anabolic steroids, corticosteroids

Comments & Clinical Management:
Target LDL goals depend on individual cardiovascular risk profile (history of CAD, diabetes, smoking, hypertension). Lifestyle modifications and statin therapy are primary interventions.`,
    interpretation: `Clinical Significance:
Low-Density Lipoprotein (LDL) cholesterol is the primary atherogenic lipoprotein. Elevated levels of circulating LDL cholesterol lead to plaque deposition in arterial walls (atherosclerosis), increasing the risk of coronary artery disease (CAD), myocardial infarction, and stroke.

National Cholesterol Education Program (NCEP ATP III) Risk Categories:
• < 100 mg/dL : Optimal
• 100 – 129 mg/dL : Near optimal / Above optimal
• 130 – 159 mg/dL : Borderline high
• 160 – 189 mg/dL : High
• ≥ 190 mg/dL : Very high

Causes of Elevated LDL:
• Familial hypercholesterolemia, familial combined hyperlipidemia
• High saturated fat and trans-fat diets, obesity, sedentary lifestyle
• Secondary causes: Hypothyroidism, nephrotic syndrome, chronic kidney disease, diabetes mellitus, cholestasis
• Drugs: Progestins, anabolic steroids, corticosteroids

Comments & Clinical Management:
Target LDL goals depend on individual cardiovascular risk profile (history of CAD, diabetes, smoking, hypertension). Lifestyle modifications and statin therapy are primary interventions.`,
    parameters: [
      {
        name: 'LDL Cholesterol',
        referenceRange: '85 - 130',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'LDL / HDL',
    title: 'LDL / HDL Ratio',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Calculated ratio of Low-Density Lipoprotein (LDL) to High-Density Lipoprotein (HDL) for atherogenic risk assessment and cardiovascular disease evaluation.',
    notes: `Clinical Significance:
The LDL/HDL Ratio is an important atherogenic index used to evaluate the balance between pro-atherogenic (LDL) and anti-atherogenic (HDL) lipoprotein fractions. It provides superior risk stratification for coronary artery disease (CAD) and cardiovascular events compared to LDL cholesterol alone.

Interpretation & Risk Stratification:
• < 1.5 : Low cardiovascular risk / Desirable
• 1.5 – 3.5 : Average / Moderate cardiovascular risk
• 3.5 – 5.0 : High cardiovascular risk
• > 5.0 : Very high risk of coronary heart disease

Clinical Indications:
• Comprehensive coronary heart disease risk profiling
• Monitoring the efficacy of lipid-lowering therapies (e.g., statins, fibrates)
• Evaluating metabolic syndrome, diabetes mellitus, and atherogenic dyslipidemia

Recommendations:
An optimal cardiovascular risk profile is supported by maintaining an LDL/HDL ratio < 3.0 (ideally < 2.5 in patients with established coronary disease or diabetes) alongside lifestyle changes including regular aerobic exercise, smoking cessation, and a diet rich in unsaturated fats.`,
    interpretation: `Clinical Significance:
The LDL/HDL Ratio is an important atherogenic index used to evaluate the balance between pro-atherogenic (LDL) and anti-atherogenic (HDL) lipoprotein fractions. It provides superior risk stratification for coronary artery disease (CAD) and cardiovascular events compared to LDL cholesterol alone.

Interpretation & Risk Stratification:
• < 1.5 : Low cardiovascular risk / Desirable
• 1.5 – 3.5 : Average / Moderate cardiovascular risk
• 3.5 – 5.0 : High cardiovascular risk
• > 5.0 : Very high risk of coronary heart disease

Clinical Indications:
• Comprehensive coronary heart disease risk profiling
• Monitoring the efficacy of lipid-lowering therapies (e.g., statins, fibrates)
• Evaluating metabolic syndrome, diabetes mellitus, and atherogenic dyslipidemia

Recommendations:
An optimal cardiovascular risk profile is supported by maintaining an LDL/HDL ratio < 3.0 (ideally < 2.5 in patients with established coronary disease or diabetes) alongside lifestyle changes including regular aerobic exercise, smoking cessation, and a diet rich in unsaturated fats.`,
    parameters: [
      {
        name: 'LDL / HDL',
        referenceRange: '1.5 - 3.5',
        unit: '',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Leukemia DLC',
    title: 'Leukemia DLC',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: 'Same Day',
    description: 'Specialized Differential Leukocyte Count (DLC) for detecting and quantifying immature precursor cells including Blast Cells, Promyelocytes, Myelocytes, Metamyelocytes, and Band Forms.',
    notes: `Clinical Significance:
Leukemia DLC (Differential Leukocyte Count) evaluates the presence and percentages of immature myeloid and lymphoid precursors in peripheral blood. The appearance of immature granulocytic precursors (promyelocytes, myelocytes, metamyelocytes, band forms) and blast cells indicates left shift, leukemoid reactions, myeloproliferative neoplasms (e.g., Chronic Myeloid Leukemia - CML), or acute leukemias (AML/ALL).

Reference Ranges:
• Blast Cells: 0% (Nil in normal peripheral blood)
• Promyelocytes: 0% (Nil)
• Myelocytes: 0% (Nil)
• Metamyelocytes: 0% (Nil)
• BAND Cells: 0 – 5%

Clinical Associations:
1. Acute Leukemias (AML, ALL): Marked proliferation of blast cells (typically ≥ 20% in bone marrow / prominent in peripheral blood) with hiatus leukaemicus.
2. Chronic Myeloid Leukemia (CML): Spectrum of all stages of myeloid maturation (blasts, promyelocytes, myelocytes, metamyelocytes, bands, neutrophils) with prominent basophilia and eosinophilia.
3. Leukemoid Reaction: Severe infections, burns, or tissue necrosis causing significant left shift with toxic granulation and Dohle bodies, but usually low blasts (< 5%).
4. Myelodysplastic Syndromes (MDS): Dysplastic maturation, cytopenias, and variable blast percentages.

Comments & Guidance:
Correlation with complete blood counts (CBC), peripheral blood smear morphology, bone marrow aspirate/biopsy, cytochemistry, flow cytometry (immunophenotyping), and cytogenetics/molecular testing (e.g., BCR-ABL1) is recommended.`,
    interpretation: `Clinical Significance:
Leukemia DLC (Differential Leukocyte Count) evaluates the presence and percentages of immature myeloid and lymphoid precursors in peripheral blood. The appearance of immature granulocytic precursors (promyelocytes, myelocytes, metamyelocytes, band forms) and blast cells indicates left shift, leukemoid reactions, myeloproliferative neoplasms (e.g., Chronic Myeloid Leukemia - CML), or acute leukemias (AML/ALL).

Reference Ranges:
• Blast Cells: 0% (Nil in normal peripheral blood)
• Promyelocytes: 0% (Nil)
• Myelocytes: 0% (Nil)
• Metamyelocytes: 0% (Nil)
• BAND Cells: 0 – 5%

Clinical Associations:
1. Acute Leukemias (AML, ALL): Marked proliferation of blast cells (typically ≥ 20% in bone marrow / prominent in peripheral blood) with hiatus leukaemicus.
2. Chronic Myeloid Leukemia (CML): Spectrum of all stages of myeloid maturation (blasts, promyelocytes, myelocytes, metamyelocytes, bands, neutrophils) with prominent basophilia and eosinophilia.
3. Leukemoid Reaction: Severe infections, burns, or tissue necrosis causing significant left shift with toxic granulation and Dohle bodies, but usually low blasts (< 5%).
4. Myelodysplastic Syndromes (MDS): Dysplastic maturation, cytopenias, and variable blast percentages.

Comments & Guidance:
Correlation with complete blood counts (CBC), peripheral blood smear morphology, bone marrow aspirate/biopsy, cytochemistry, flow cytometry (immunophenotyping), and cytogenetics/molecular testing (e.g., BCR-ABL1) is recommended.`,
    parameters: [
      {
        name: 'Metamyelocytes',
        referenceRange: '0 - 0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Myelocytes',
        referenceRange: '0 - 0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Promyelocytes',
        referenceRange: '0 - 0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Blast Cells',
        referenceRange: '0 - 0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'BAND Cells',
        referenceRange: '0 - 5',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Homocysteine',
    title: 'Homocysteine',
    basePrice: 850,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: 'Same Day',
    description: 'Quantitative measurement of total Homocysteine in serum/plasma for cardiovascular risk evaluation, thrombosis screening, and assessing Vitamin B12/Folate status.',
    notes: `Interpretation:
• 5 – 15 µmol/L → Normal
• 15 – 30 µmol/L → Mild elevation
• 30 – 100 µmol/L → Moderate elevation
• > 100 µmol/L → Severe elevation

Clinical Significance:
Homocysteine is a sulfur-containing amino acid derived from methionine metabolism. Elevated plasma homocysteine (hyperhomocysteinemia) is an independent risk factor for atherosclerotic vascular disease (coronary artery disease, cerebrovascular disease, peripheral artery disease) and deep vein thrombosis / thromboembolism.

Causes of Hyperhomocysteinemia:
1. Nutritional Deficiencies: Vitamin B12, Vitamin B6 (pyridoxine), and Folate (folic acid) deficiencies.
2. Genetic Defects: Cystathionine β-synthase (CBS) deficiency (homocystinuria), MTHFR gene mutations (C677T / A1298C variants).
3. Chronic Renal Disease: Decreased renal clearance and altered metabolism.
4. Lifestyle & Medications: Smoking, advancing age, high coffee consumption, methotrexate, phenytoin, metformin.

Comments:
Therapeutic response to supplementation with Folic Acid, Vitamin B6, and Vitamin B12 often normalizes elevated plasma homocysteine levels.`,
    interpretation: `Interpretation:
• 5 – 15 µmol/L → Normal
• 15 – 30 µmol/L → Mild elevation
• 30 – 100 µmol/L → Moderate elevation
• > 100 µmol/L → Severe elevation

Clinical Significance:
Homocysteine is a sulfur-containing amino acid derived from methionine metabolism. Elevated plasma homocysteine (hyperhomocysteinemia) is an independent risk factor for atherosclerotic vascular disease (coronary artery disease, cerebrovascular disease, peripheral artery disease) and deep vein thrombosis / thromboembolism.

Causes of Hyperhomocysteinemia:
1. Nutritional Deficiencies: Vitamin B12, Vitamin B6 (pyridoxine), and Folate (folic acid) deficiencies.
2. Genetic Defects: Cystathionine β-synthase (CBS) deficiency (homocystinuria), MTHFR gene mutations (C677T / A1298C variants).
3. Chronic Renal Disease: Decreased renal clearance and altered metabolism.
4. Lifestyle & Medications: Smoking, advancing age, high coffee consumption, methotrexate, phenytoin, metformin.

Comments:
Therapeutic response to supplementation with Folic Acid, Vitamin B6, and Vitamin B12 often normalizes elevated plasma homocysteine levels.`,
    parameters: [
      {
        name: 'Homocysteine',
        referenceRange: '5 - 15',
        unit: 'µmol/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HIV (Card Test)',
    title: 'HIV (Card Test)',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: 'Same Day',
    description: 'Rapid immunochromatographic card test for the differential detection of Antibodies to Human Immunodeficiency Virus Type 1 and Type 2 (HIV-1 & HIV-2) in serum/plasma.',
    notes: `Rapid card tests are screening tests, false positive and false negative results may occur due to various factors which may influence test results.
Advise: Kindly confirm by ELISA or Western blot method.

1. A negative result implies that no Anti HIV – 1 & HIV - 2 antibodies have been detected in the sample by this method. This means that either the patient has not been exposed to HIV-1 or HIV-2 infection or the sample has been tested during the “WINDOW PHASE” (before the development of detectable levels of antibodies).
2. A positive result suggests the possibilities of HIV-I and/or HIV-II infection. However, these results must be verified by a confirmatory test (IFA / WESTERN BLOT I-II) before pronouncing the patient positive for HIV-1 and/or HIV-2 infection.

ALL reactive samples should be confirmed by using HIV Western Blot/PCR.`,
    interpretation: `Rapid card tests are screening tests, false positive and false negative results may occur due to various factors which may influence test results.
Advise: Kindly confirm by ELISA or Western blot method.

1. A negative result implies that no Anti HIV – 1 & HIV - 2 antibodies have been detected in the sample by this method. This means that either the patient has not been exposed to HIV-1 or HIV-2 infection or the sample has been tested during the “WINDOW PHASE” (before the development of detectable levels of antibodies).
2. A positive result suggests the possibilities of HIV-I and/or HIV-II infection. However, these results must be verified by a confirmatory test (IFA / WESTERN BLOT I-II) before pronouncing the patient positive for HIV-1 and/or HIV-2 infection.

ALL reactive samples should be confirmed by using HIV Western Blot/PCR.`,
    parameters: [
      {
        name: 'HIV - 1',
        referenceRange: 'Non-Reactive',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Non-Reactive', isAbnormal: false },
          { value: 'Reactive', isAbnormal: true },
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'HIV - 2',
        referenceRange: 'Non-Reactive',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Non-Reactive', isAbnormal: false },
          { value: 'Reactive', isAbnormal: true },
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HIV ELISA I/II',
    title: 'HIV ELISA I/II',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: '24 Hours',
    description: 'Quantitative/Qualitative Enzyme-Linked Immunosorbent Assay (ELISA) for the simultaneous detection of Antibodies to HIV-1 and HIV-2 (including p24 antigen).',
    notes: `Methodology: Enzyme-Linked Immunosorbent Assay (ELISA) / 4th Generation Ag-Ab Assay

Result Interpretation Guidelines:
• Non-Reactive (< 0.90 S/CO Index) : No detectable HIV-1/2 antibodies or p24 antigen.
• Equivocal / Borderline (0.90 – 1.10 S/CO Index) : Retest recommended with a fresh sample after 2 to 4 weeks.
• Reactive (≥ 1.10 S/CO Index) : Presumptive presence of HIV-1/2 antibodies and/or p24 antigen.

Clinical Significance & Advisory:
1. Non-Reactive Result: Indicates that HIV-1/2 antibodies (and p24 antigen in 4th Gen assays) were not detected. It does not exclude acute early infection during the initial "Window Period" (typically 2–4 weeks post-exposure). In cases of recent suspected exposure, repeat testing after 4–6 weeks is strongly recommended.
2. Reactive Result: A reactive screening ELISA test must not be considered a definitive diagnosis of HIV infection. According to national (NACO / CDC / WHO) guidelines, ALL initially reactive specimens MUST be subjected to supplementary confirmatory testing (HIV Western Blot / Line Immunoassay / HIV-1 RNA Qualitative PCR) before establishing a final positive diagnosis.
3. False Positives: May occasionally occur due to autoimmune conditions (SLE, rheumatoid factor), pregnancy, prior vaccinations, or severe hypergammaglobulinemia.

Guidance:
Confirmatory testing and pre/post-test counseling are strongly recommended for all reactive outcomes.`,
    interpretation: `Methodology: Enzyme-Linked Immunosorbent Assay (ELISA) / 4th Generation Ag-Ab Assay

Result Interpretation Guidelines:
• Non-Reactive (< 0.90 S/CO Index) : No detectable HIV-1/2 antibodies or p24 antigen.
• Equivocal / Borderline (0.90 – 1.10 S/CO Index) : Retest recommended with a fresh sample after 2 to 4 weeks.
• Reactive (≥ 1.10 S/CO Index) : Presumptive presence of HIV-1/2 antibodies and/or p24 antigen.

Clinical Significance & Advisory:
1. Non-Reactive Result: Indicates that HIV-1/2 antibodies (and p24 antigen in 4th Gen assays) were not detected. It does not exclude acute early infection during the initial "Window Period" (typically 2–4 weeks post-exposure). In cases of recent suspected exposure, repeat testing after 4–6 weeks is strongly recommended.
2. Reactive Result: A reactive screening ELISA test must not be considered a definitive diagnosis of HIV infection. According to national (NACO / CDC / WHO) guidelines, ALL initially reactive specimens MUST be subjected to supplementary confirmatory testing (HIV Western Blot / Line Immunoassay / HIV-1 RNA Qualitative PCR) before establishing a final positive diagnosis.
3. False Positives: May occasionally occur due to autoimmune conditions (SLE, rheumatoid factor), pregnancy, prior vaccinations, or severe hypergammaglobulinemia.

Guidance:
Confirmatory testing and pre/post-test counseling are strongly recommended for all reactive outcomes.`,
    parameters: [
      {
        name: 'HIV ELISA I/II',
        referenceRange: 'Non-Reactive (< 0.90)',
        unit: 'Units',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Non-Reactive', isAbnormal: false },
          { value: 'Borderline / Equivocal', isAbnormal: true },
          { value: 'Reactive', isAbnormal: true },
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HCV',
    title: 'Hepatitis C Virus (HCV)',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: 'Same Day',
    description: 'Serological test for the detection of antibodies to Hepatitis C Virus (Anti-HCV) in human serum or plasma.',
    notes: `Interpretation:
• Non-Reactive : Absence of antibodies to the Hepatitis C virus.
• Reactive : Presence of antibodies to Hepatitis C virus.

Clinical Significance & Advisory:
1. Reactive test result indicates the presence of Hepatitis C virus infection. Active infection to be confirmed by HCV RNA PCR test. It cannot differentiate between the stages of Hepatitis C viral infection nor used to monitor the efficacy of treatment.
2. Non-Reactive test result indicates Hepatitis C virus infection is unlikely.
3. False positive results may be observed in patients receiving mouse monoclonal antibodies, on heparin therapy, on biotin supplements for diagnosis or therapy or presence of heterophilic antibodies in serum.
4. False negative reaction may be due to processing of sample collected early in the course of disease, Prozone phenomenon, Immunosuppression & Immuno-incompetence.

Uses:
I. To diagnose suspected HCV infection in the risk group.
II. Prenatal Screening of pregnant women and pre-surgical/interventional procedures work up.`,
    interpretation: `Interpretation:
• Non-Reactive : Absence of antibodies to the Hepatitis C virus.
• Reactive : Presence of antibodies to Hepatitis C virus.

Clinical Significance & Advisory:
1. Reactive test result indicates the presence of Hepatitis C virus infection. Active infection to be confirmed by HCV RNA PCR test. It cannot differentiate between the stages of Hepatitis C viral infection nor used to monitor the efficacy of treatment.
2. Non-Reactive test result indicates Hepatitis C virus infection is unlikely.
3. False positive results may be observed in patients receiving mouse monoclonal antibodies, on heparin therapy, on biotin supplements for diagnosis or therapy or presence of heterophilic antibodies in serum.
4. False negative reaction may be due to processing of sample collected early in the course of disease, Prozone phenomenon, Immunosuppression & Immuno-incompetence.

Uses:
I. To diagnose suspected HCV infection in the risk group.
II. Prenatal Screening of pregnant women and pre-surgical/interventional procedures work up.`,
    parameters: [
      {
        name: 'Hepatitis C Virus, HCV',
        referenceRange: 'Non-Reactive',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Non-Reactive', isAbnormal: false },
          { value: 'Reactive', isAbnormal: true },
          { value: 'Borderline / Equivocal', isAbnormal: true },
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HCT',
    title: 'Hematocrit Value, Hct',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative determination of Hematocrit (Packed Cell Volume - PCV) in whole blood for assessing anemia, polycythemia, and hydration status.',
    notes: `Clinical Significance:
Hematocrit (Hct), also known as Packed Cell Volume (PCV), is the proportion of whole blood volume that is occupied by red blood cells (erythrocytes). It is a vital hematological parameter used in the evaluation of anemias, polycythemia, hemoconcentration, and fluid status.

Reference Ranges:
• Adult Males: 40 – 50 %
• Adult Females: 36 – 46 %
• Children (varies by age): 31 – 43 %
• Newborns: 44 – 64 %

Clinical Associations:
1. Increased Hematocrit (Polycythemia / Hemoconcentration):
   - Primary: Polycythemia vera.
   - Secondary: Chronic hypoxia (COPD, cyanotic congenital heart disease, high altitude residence, heavy smoking).
   - Relative (Hemoconcentration): Dehydration, severe burns, dengue hemorrhagic fever, shock, diabetic ketoacidosis.
2. Decreased Hematocrit (Anemia / Hemodilution):
   - Blood loss: Acute hemorrhage, chronic occult GI bleeding.
   - Decreased erythropoiesis: Iron deficiency anemia, megaloblastic anemia (B12/folate deficiency), aplastic anemia, bone marrow infiltration, chronic kidney disease (erythropoietin deficiency).
   - Increased destruction (Hemolysis): Autoimmune hemolytic anemia, sickle cell disease, thalassemia, microangiopathic hemolytic anemias.
   - Fluid overload / Hemodilution: Congestive heart failure, excess IV fluid administration, pregnancy.

Comments:
Hematocrit should always be interpreted alongside Hemoglobin (Hb), Total RBC Count, Red Cell Indices (MCV, MCH, MCHC, RDW), and the patient's hydration status.`,
    interpretation: `Clinical Significance:
Hematocrit (Hct), also known as Packed Cell Volume (PCV), is the proportion of whole blood volume that is occupied by red blood cells (erythrocytes). It is a vital hematological parameter used in the evaluation of anemias, polycythemia, hemoconcentration, and fluid status.

Reference Ranges:
• Adult Males: 40 – 50 %
• Adult Females: 36 – 46 %
• Children (varies by age): 31 – 43 %
• Newborns: 44 – 64 %

Clinical Associations:
1. Increased Hematocrit (Polycythemia / Hemoconcentration):
   - Primary: Polycythemia vera.
   - Secondary: Chronic hypoxia (COPD, cyanotic congenital heart disease, high altitude residence, heavy smoking).
   - Relative (Hemoconcentration): Dehydration, severe burns, dengue hemorrhagic fever, shock, diabetic ketoacidosis.
2. Decreased Hematocrit (Anemia / Hemodilution):
   - Blood loss: Acute hemorrhage, chronic occult GI bleeding.
   - Decreased erythropoiesis: Iron deficiency anemia, megaloblastic anemia (B12/folate deficiency), aplastic anemia, bone marrow infiltration, chronic kidney disease (erythropoietin deficiency).
   - Increased destruction (Hemolysis): Autoimmune hemolytic anemia, sickle cell disease, thalassemia, microangiopathic hemolytic anemias.
   - Fluid overload / Hemodilution: Congestive heart failure, excess IV fluid administration, pregnancy.

Comments:
Hematocrit should always be interpreted alongside Hemoglobin (Hb), Total RBC Count, Red Cell Indices (MCV, MCH, MCHC, RDW), and the patient's hydration status.`,
    parameters: [
      {
        name: 'Hematocrit Value, Hct',
        referenceRange: '40 - 50',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HB',
    title: 'Hemoglobin (Hb)',
    basePrice: 120,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative measurement of Hemoglobin concentration in whole blood for diagnosing and managing anemias, polycythemia, and oxygen transport capacity.',
    notes: `Hemoglobin is the major protein of erythrocytes that transports oxygen from the lungs to peripheral tissues. It is measured by spectrophotometry on automated instruments after lysis of red cells and conversion of all hemoglobin to cyanmethemoglobin.

Increased in:
1. Hemoconcentration (as in dehydration, Burns, vomiting)
2. Polycythemia (erythrocytosis)
3. Extreme physical exercise.

Decreased in:
1. Macrocytic anemia (liver disease, hypothyroidism, vitamin B 12 deficiency, folate deficiency, myelodysplasia)
2. Normocytic anemia (early iron deficiency, anemia of chronic disease, hemolytic anemia, acute hemorrhage, bone marrow infiltration)
3. Microcytic anemia (iron deficiency, thalassemia)
4. Hemodilution (fluid overload, pregnancy)

Comments:
The cyanmethemoglobin technique is the method of choice selected by the International Committee for Standardization in Hematology. The method measures all hemoglobin derivatives except sulfhemoglobin by hemolyzing the specimen and adding a reducing agent. As such, this method does not distinguish between intracellular versus extracellular hemoglobin (hemolysis). Hypertriglyceridemia and very high white blood cell counts can cause false elevations of Hb.`,
    interpretation: `Hemoglobin is the major protein of erythrocytes that transports oxygen from the lungs to peripheral tissues. It is measured by spectrophotometry on automated instruments after lysis of red cells and conversion of all hemoglobin to cyanmethemoglobin.

Increased in:
1. Hemoconcentration (as in dehydration, Burns, vomiting)
2. Polycythemia (erythrocytosis)
3. Extreme physical exercise.

Decreased in:
1. Macrocytic anemia (liver disease, hypothyroidism, vitamin B 12 deficiency, folate deficiency, myelodysplasia)
2. Normocytic anemia (early iron deficiency, anemia of chronic disease, hemolytic anemia, acute hemorrhage, bone marrow infiltration)
3. Microcytic anemia (iron deficiency, thalassemia)
4. Hemodilution (fluid overload, pregnancy)

Comments:
The cyanmethemoglobin technique is the method of choice selected by the International Committee for Standardization in Hematology. The method measures all hemoglobin derivatives except sulfhemoglobin by hemolyzing the specimen and adding a reducing agent. As such, this method does not distinguish between intracellular versus extracellular hemoglobin (hemolysis). Hypertriglyceridemia and very high white blood cell counts can cause false elevations of Hb.`,
    parameters: [
      {
        name: 'Hemoglobin',
        referenceRange: '13 - 17',
        unit: 'g/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HAV IgM',
    title: 'Hepatitis A Virus IgM (HAV IgM)',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: 'Same Day',
    description: 'Immunoassay for the qualitative and semi-quantitative detection of IgM antibodies to Hepatitis A Virus in human serum or plasma for diagnosing acute hepatitis A infection.',
    notes: `Interpretation:
• < 2.0 AU/mL : Non-Reactive / Negative (No detectable IgM antibodies to Hepatitis A Virus)
• 2.0 – 2.5 AU/mL : Borderline / Equivocal (Retest recommended with a fresh sample in 1–2 weeks if clinically indicated)
• > 2.5 AU/mL : Reactive / Positive (Presence of IgM antibodies to Hepatitis A Virus)

Clinical Significance:
1. Anti-HAV IgM antibodies develop rapidly during the acute phase of Hepatitis A virus infection, usually detectable at or before the onset of clinical symptoms and peak within the first few weeks of illness.
2. A Positive / Reactive result indicates acute or recent Hepatitis A infection. Anti-HAV IgM levels typically remain detectable for 3 to 6 months following infection.
3. A Negative / Non-Reactive result indicates absence of acute Hepatitis A infection. It does not exclude previous exposure or immunity, which is determined by Anti-HAV IgG testing.
4. Transient false-positive results may rarely occur due to cross-reactivity with other viral infections, autoimmune disorders, or recent administration of immunoglobulin / Hepatitis A vaccine.

Clinical Correlation:
Results should always be interpreted in conjunction with clinical symptoms (jaundice, nausea, abdominal discomfort, dark urine) and other liver function tests (Total Bilirubin, SGPT/ALT, SGOT/AST).`,
    interpretation: `Interpretation:
• < 2.0 AU/mL : Non-Reactive / Negative (No detectable IgM antibodies to Hepatitis A Virus)
• 2.0 – 2.5 AU/mL : Borderline / Equivocal (Retest recommended with a fresh sample in 1–2 weeks if clinically indicated)
• > 2.5 AU/mL : Reactive / Positive (Presence of IgM antibodies to Hepatitis A Virus)

Clinical Significance:
1. Anti-HAV IgM antibodies develop rapidly during the acute phase of Hepatitis A virus infection, usually detectable at or before the onset of clinical symptoms and peak within the first few weeks of illness.
2. A Positive / Reactive result indicates acute or recent Hepatitis A infection. Anti-HAV IgM levels typically remain detectable for 3 to 6 months following infection.
3. A Negative / Non-Reactive result indicates absence of acute Hepatitis A infection. It does not exclude previous exposure or immunity, which is determined by Anti-HAV IgG testing.
4. Transient false-positive results may rarely occur due to cross-reactivity with other viral infections, autoimmune disorders, or recent administration of immunoglobulin / Hepatitis A vaccine.

Clinical Correlation:
Results should always be interpreted in conjunction with clinical symptoms (jaundice, nausea, abdominal discomfort, dark urine) and other liver function tests (Total Bilirubin, SGPT/ALT, SGOT/AST).`,
    parameters: [
      {
        name: 'HAV IgM',
        referenceRange: '< 2 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'H-ALB',
    title: 'H-ALB',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Urine (Spot / Random Urine)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative determination of Microalbumin (Human Albumin / H-ALB) in urine for early detection of diabetic nephropathy, hypertensive kidney damage, and vascular injury.',
    notes: `Clinical Significance:
H-ALB (Human Albumin / High-Sensitivity Urine Albumin / Microalbumin) is an early and sensitive biomarker for the detection of glomerular injury and endothelial dysfunction, particularly in patients with diabetes mellitus and systemic arterial hypertension.

Reference Ranges (Spot / Random Urine):
• Normal (Normoalbuminuria) : < 10 µg/mL (or < 20 mg/L)
• Microalbuminuria (Early Nephropathy) : 10 – 200 µg/mL (20 – 200 mg/L)
• Macroalbuminuria (Overt Clinical Nephropathy) : > 200 µg/mL (> 200 mg/L)

Clinical Associations:
1. Diabetic Nephropathy: Persistent microalbuminuria is the earliest clinical herald of diabetic nephropathy in both Type 1 and Type 2 diabetes. Early detection and aggressive glycemic/BP control (with ACEi / ARBs) can retard or reverse progressive renal decline.
2. Hypertensive Renal Damage: Marker of target organ damage and increased cardiovascular morbidity/mortality risk.
3. Glomerular & Endothelial Dysfunction: Preeclampsia, systemic lupus erythematosus (SLE) nephritis, glomerulonephritis, and generalized vascular inflammation.

Transient Non-Specific Elevations (False Positives):
Transient increases in urinary albumin excretion may occur due to vigorous physical exercise, urinary tract infection (UTI), acute febrile illness, hematuria, congestive heart failure, upright posture (orthostatic proteinuria), or severe hyperglycemia.

Recommendation:
Confirmation of persistent microalbuminuria requires at least 2 of 3 positive specimens collected over a 3 to 6-month period, ideally alongside an Albumin-to-Creatinine Ratio (ACR).`,
    interpretation: `Clinical Significance:
H-ALB (Human Albumin / High-Sensitivity Urine Albumin / Microalbumin) is an early and sensitive biomarker for the detection of glomerular injury and endothelial dysfunction, particularly in patients with diabetes mellitus and systemic arterial hypertension.

Reference Ranges (Spot / Random Urine):
• Normal (Normoalbuminuria) : < 10 µg/mL (or < 20 mg/L)
• Microalbuminuria (Early Nephropathy) : 10 – 200 µg/mL (20 – 200 mg/L)
• Macroalbuminuria (Overt Clinical Nephropathy) : > 200 µg/mL (> 200 mg/L)

Clinical Associations:
1. Diabetic Nephropathy: Persistent microalbuminuria is the earliest clinical herald of diabetic nephropathy in both Type 1 and Type 2 diabetes. Early detection and aggressive glycemic/BP control (with ACEi / ARBs) can retard or reverse progressive renal decline.
2. Hypertensive Renal Damage: Marker of target organ damage and increased cardiovascular morbidity/mortality risk.
3. Glomerular & Endothelial Dysfunction: Preeclampsia, systemic lupus erythematosus (SLE) nephritis, glomerulonephritis, and generalized vascular inflammation.

Transient Non-Specific Elevations (False Positives):
Transient increases in urinary albumin excretion may occur due to vigorous physical exercise, urinary tract infection (UTI), acute febrile illness, hematuria, congestive heart failure, upright posture (orthostatic proteinuria), or severe hyperglycemia.

Recommendation:
Confirmation of persistent microalbuminuria requires at least 2 of 3 positive specimens collected over a 3 to 6-month period, ideally alongside an Albumin-to-Creatinine Ratio (ACR).`,
    parameters: [
      {
        name: 'H-ALB',
        referenceRange: '< 10 µg/mL',
        unit: 'µg/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'GTT',
    title: 'Glucose Tolerance Test (GTT)',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Blood Fluoride Plasma',
    turnaroundTime: 'Same Day',
    description: 'Serial plasma glucose measurements following oral glucose load for the diagnosis of impaired fasting glucose, impaired glucose tolerance, diabetes mellitus, and gestational diabetes.',
    notes: `Interpretation (ADA / WHO Diagnostic Thresholds):

Status | Fasting Plasma Glucose | Post 75g Glucose Load (2 hr)
• Normal : 70 - 100 mg/dL | 70 - 140 mg/dL
• Impaired Fasting Glucose (IFG) : 101 - 125 mg/dL | 70 - 140 mg/dL
• Impaired Glucose Tolerance (IGT) : 70 - 100 mg/dL | 141 - 199 mg/dL
• Pre-Diabetes (IFG / IGT) : 101 - 125 mg/dL | 141 - 199 mg/dL
• Diabetes Mellitus : ≥ 126 mg/dL | ≥ 200 mg/dL

Diagnostic Criteria:
The diagnosis of Diabetes requires a fasting plasma glucose of ≥ 126 mg/dL or a random / 2 hr post glucose value of ≥ 200 mg/dL on at least 2 separate occasions.

Gestational Diabetes (GDM) 3-Hour Reference Cutoffs:
• Fasting: < 100 mg/dL
• 1 Hour: < 190 mg/dL
• 2 Hour: < 165 mg/dL
• 3 Hour: < 145 mg/dL`,
    interpretation: `Interpretation (ADA / WHO Diagnostic Thresholds):

Status | Fasting Plasma Glucose | Post 75g Glucose Load (2 hr)
• Normal : 70 - 100 mg/dL | 70 - 140 mg/dL
• Impaired Fasting Glucose (IFG) : 101 - 125 mg/dL | 70 - 140 mg/dL
• Impaired Glucose Tolerance (IGT) : 70 - 100 mg/dL | 141 - 199 mg/dL
• Pre-Diabetes (IFG / IGT) : 101 - 125 mg/dL | 141 - 199 mg/dL
• Diabetes Mellitus : ≥ 126 mg/dL | ≥ 200 mg/dL

Diagnostic Criteria:
The diagnosis of Diabetes requires a fasting plasma glucose of ≥ 126 mg/dL or a random / 2 hr post glucose value of ≥ 200 mg/dL on at least 2 separate occasions.

Gestational Diabetes (GDM) 3-Hour Reference Cutoffs:
• Fasting: < 100 mg/dL
• 1 Hour: < 190 mg/dL
• 2 Hour: < 165 mg/dL
• 3 Hour: < 145 mg/dL`,
    parameters: [
      {
        name: 'Fasting',
        referenceRange: '< 100',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: '1 Hour',
        referenceRange: '< 190',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: '2 Hour',
        referenceRange: '< 165',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: '3 Hour',
        referenceRange: '< 145',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: "Gram's Stain",
    title: "Gram's Stain",
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Pus / Swab / Sputum / Body Fluid / Urine',
    turnaroundTime: 'Same Day',
    description: 'Direct microscopic examination following Gram staining for preliminary identification of bacterial and fungal pathogens and cellular response.',
    notes: `Clinical Significance:
Gram stain is a rapid differential staining technique that categorizes bacteria into Gram-positive (violet/purple) and Gram-negative (pink/red) based on the structural and biochemical properties of their cell walls. It provides critical preliminary diagnostic information to guide immediate empirical antimicrobial therapy before definitive culture and antibiotic sensitivity test (AST) results are available.

Microscopic Findings & Interpretation:
1. Gram-Positive Cocci:
   - In clusters: Suggestive of Staphylococcus spp. (e.g., S. aureus, CoNS).
   - In chains / pairs: Suggestive of Streptococcus spp. (e.g., S. pyogenes, S. pneumoniae, Enterococcus spp.).
2. Gram-Negative Bacilli (Rods):
   - Suggestive of Enterobacteriaceae (E. coli, Klebsiella, Proteus) or non-fermenting bacilli (Pseudomonas aeruginosa, Acinetobacter).
3. Gram-Negative Diplococci:
   - Intracellular / extracellular: Suggestive of Neisseria meningitidis, Neisseria gonorrhoeae, or Moraxella catarrhalis.
4. Gram-Positive Bacilli:
   - Suggestive of Corynebacterium spp., Listeria, Bacillus spp., Clostridium spp., or Lactobacillus.
5. Fungal Elements:
   - Budding yeast-like cells with or without pseudohyphae: Suggestive of Candida species.

Advisory:
Gram stain is a presumptive rapid screening test. Definitive identification and antimicrobial susceptibility require aerobic/anaerobic bacterial culture and AST.`,
    interpretation: `Clinical Significance:
Gram stain is a rapid differential staining technique that categorizes bacteria into Gram-positive (violet/purple) and Gram-negative (pink/red) based on the structural and biochemical properties of their cell walls. It provides critical preliminary diagnostic information to guide immediate empirical antimicrobial therapy before definitive culture and antibiotic sensitivity test (AST) results are available.

Microscopic Findings & Interpretation:
1. Gram-Positive Cocci:
   - In clusters: Suggestive of Staphylococcus spp. (e.g., S. aureus, CoNS).
   - In chains / pairs: Suggestive of Streptococcus spp. (e.g., S. pyogenes, S. pneumoniae, Enterococcus spp.).
2. Gram-Negative Bacilli (Rods):
   - Suggestive of Enterobacteriaceae (E. coli, Klebsiella, Proteus) or non-fermenting bacilli (Pseudomonas aeruginosa, Acinetobacter).
3. Gram-Negative Diplococci:
   - Intracellular / extracellular: Suggestive of Neisseria meningitidis, Neisseria gonorrhoeae, or Moraxella catarrhalis.
4. Gram-Positive Bacilli:
   - Suggestive of Corynebacterium spp., Listeria, Bacillus spp., Clostridium spp., or Lactobacillus.
5. Fungal Elements:
   - Budding yeast-like cells with or without pseudohyphae: Suggestive of Candida species.

Advisory:
Gram stain is a presumptive rapid screening test. Definitive identification and antimicrobial susceptibility require aerobic/anaerobic bacterial culture and AST.`,
    parameters: [
      {
        name: 'Sample Type',
        referenceRange: 'Pus / Swab / Sputum / Fluid',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Pus / Exudate', isAbnormal: false },
          { value: 'Sputum', isAbnormal: false },
          { value: 'Throat / Nasal Swab', isAbnormal: false },
          { value: 'Wound Swab', isAbnormal: false },
          { value: 'Urine', isAbnormal: false },
          { value: 'Body Fluid (Pleural / Ascitic / Synovial / CSF)', isAbnormal: false },
          { value: 'High Vaginal Swab (HVS)', isAbnormal: false },
          { value: 'Blood Culture Broth', isAbnormal: false }
        ],
        status: 'Active'
      },
      {
        name: 'Result',
        referenceRange: 'No organisms or pus cells seen',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'No bacteria or pus cells seen on direct microscopic examination.', isAbnormal: false },
          { value: 'Few Pus cells (1-3/hpf) seen. No microorganisms detected.', isAbnormal: false },
          { value: 'Gram-positive cocci seen in clusters (suggestive of Staphylococci species). Pus cells: Moderate (5-10/hpf).', isAbnormal: true },
          { value: 'Gram-positive cocci seen in pairs/chains (suggestive of Streptococci species). Pus cells: Present.', isAbnormal: true },
          { value: 'Gram-negative bacilli seen. Pus cells: Moderate to plenty (15-20/hpf).', isAbnormal: true },
          { value: 'Gram-negative intracellular diplococci seen (suggestive of Neisseria species). Plenty of pus cells.', isAbnormal: true },
          { value: 'Gram-positive bacilli seen.', isAbnormal: true },
          { value: 'Budding yeast cells with pseudohyphae seen (suggestive of Candida species).', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'GTT (Pregnancy)',
    title: 'Glucose Tolerance Test, GTT (Pregnancy)',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Blood Fluoride Plasma',
    turnaroundTime: 'Same Day',
    description: 'Oral Glucose Tolerance Test during pregnancy (24-28 weeks) for screening and diagnosis of Gestational Diabetes Mellitus (GDM) using ADA One-Step Strategy.',
    notes: `According to American Diabetes Association (ADA) Guidelines 2024 for Screening and Diagnosis of Gestational Diabetes Mellitus (GDM), the One-Step Strategy is followed.

Method - One-step strategy:
Perform a 75-g OGTT, with plasma glucose measurement when an individual is fasting and at 1 and 2 h, at 24-28 weeks of gestation in individuals not previously diagnosed with diabetes. The OGTT should be performed in the morning after an overnight fast of at least 8 hours.

Normal Values / Reference Cutoffs:
• Fasting : < 92 mg/dL (5.1 mmol/L) [Reference: 65 - 92 mg/dL]
• At 1 hour : < 180 mg/dL (10.0 mmol/L) [Reference: 100 - 180 mg/dL]
• At 2 hour : < 153 mg/dL (8.5 mmol/L) [Reference: 65 - 153 mg/dL]
• At 3 hour : < 125 mg/dL [Reference: 70 - 125 mg/dL]

The diagnosis of GDM is made when ANY ONE of the plasma glucose values is met or exceeded.`,
    interpretation: `According to American Diabetes Association (ADA) Guidelines 2024 for Screening and Diagnosis of Gestational Diabetes Mellitus (GDM), the One-Step Strategy is followed.

Method - One-step strategy:
Perform a 75-g OGTT, with plasma glucose measurement when an individual is fasting and at 1 and 2 h, at 24-28 weeks of gestation in individuals not previously diagnosed with diabetes. The OGTT should be performed in the morning after an overnight fast of at least 8 hours.

Normal Values / Reference Cutoffs:
• Fasting : < 92 mg/dL (5.1 mmol/L) [Reference: 65 - 92 mg/dL]
• At 1 hour : < 180 mg/dL (10.0 mmol/L) [Reference: 100 - 180 mg/dL]
• At 2 hour : < 153 mg/dL (8.5 mmol/L) [Reference: 65 - 153 mg/dL]
• At 3 hour : < 125 mg/dL [Reference: 70 - 125 mg/dL]

The diagnosis of GDM is made when ANY ONE of the plasma glucose values is met or exceeded.`,
    parameters: [
      {
        name: 'Fasting',
        referenceRange: '65 - 92',
        unit: 'mg/dL',
        gender: 'Female',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: '1 hour',
        referenceRange: '100 - 180',
        unit: 'mg/dL',
        gender: 'Female',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: '2 hour',
        referenceRange: '65 - 153',
        unit: 'mg/dL',
        gender: 'Female',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: '3 hour',
        referenceRange: '70 - 125',
        unit: 'mg/dL',
        gender: 'Female',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Globulin',
    title: 'Globulin',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Quantitative determination of Serum Globulin fraction for evaluating liver disease, chronic infections, autoimmune disorders, and plasma cell dyscrasias.',
    notes: `Clinical Significance:
Globulins are a diverse group of proteins in blood serum comprising alpha-1, alpha-2, beta, and gamma globulins. They play critical roles in immune defense (immunoglobulins/antibodies), blood clotting, enzymatic actions, and the transport of hormones, lipids, and minerals (e.g., transferrin, haptoglobin, ceruloplasmin). Calculated as: Globulin = Total Protein – Albumin.

Reference Range:
• Normal Serum Globulin : 1.8 – 3.6 g/dL

Clinical Associations:
1. Hyperglobulinemia (Elevated Globulin Levels):
   - Chronic Infections: Tuberculosis, subacute bacterial endocarditis, chronic hepatitis (HBV/HCV), HIV, parasitic infections (leishmaniasis/Kala-Azar, malaria).
   - Autoimmune & Inflammatory Diseases: Systemic lupus erythematosus (SLE), rheumatoid arthritis, sarcoidosis, autoimmune hepatitis.
   - Hematological Malignancies / Monoclonal Gammopathies: Multiple myeloma, Waldenström's macroglobulinemia, monoclonal gammopathy of undetermined significance (MGUS), lymphomas.
   - Chronic Liver Disease: Cirrhosis (elevated polyclonal gamma-globulin fraction with A/G ratio reversal).
2. Hypoglobulinemia (Decreased Globulin Levels):
   - Immunodeficiency states: Congenital or acquired agammaglobulinemia/hypogammaglobulinemia.
   - Severe protein loss: Protein-losing enteropathies, extensive burns.
   - Malnutrition and malabsorption disorders.

Recommendation:
Abnormal globulin levels, especially when associated with an inverted A/G ratio (< 1.0) or unexplained elevated total protein, warrant Serum Protein Electrophoresis (SPEP) and immunofixation electrophoresis (IFE) for definitive characterization.`,
    interpretation: `Clinical Significance:
Globulins are a diverse group of proteins in blood serum comprising alpha-1, alpha-2, beta, and gamma globulins. They play critical roles in immune defense (immunoglobulins/antibodies), blood clotting, enzymatic actions, and the transport of hormones, lipids, and minerals (e.g., transferrin, haptoglobin, ceruloplasmin). Calculated as: Globulin = Total Protein – Albumin.

Reference Range:
• Normal Serum Globulin : 1.8 – 3.6 g/dL

Clinical Associations:
1. Hyperglobulinemia (Elevated Globulin Levels):
   - Chronic Infections: Tuberculosis, subacute bacterial endocarditis, chronic hepatitis (HBV/HCV), HIV, parasitic infections (leishmaniasis/Kala-Azar, malaria).
   - Autoimmune & Inflammatory Diseases: Systemic lupus erythematosus (SLE), rheumatoid arthritis, sarcoidosis, autoimmune hepatitis.
   - Hematological Malignancies / Monoclonal Gammopathies: Multiple myeloma, Waldenström's macroglobulinemia, monoclonal gammopathy of undetermined significance (MGUS), lymphomas.
   - Chronic Liver Disease: Cirrhosis (elevated polyclonal gamma-globulin fraction with A/G ratio reversal).
2. Hypoglobulinemia (Decreased Globulin Levels):
   - Immunodeficiency states: Congenital or acquired agammaglobulinemia/hypogammaglobulinemia.
   - Severe protein loss: Protein-losing enteropathies, extensive burns.
   - Malnutrition and malabsorption disorders.

Recommendation:
Abnormal globulin levels, especially when associated with an inverted A/G ratio (< 1.0) or unexplained elevated total protein, warrant Serum Protein Electrophoresis (SPEP) and immunofixation electrophoresis (IFE) for definitive characterization.`,
    parameters: [
      {
        name: 'Globulin',
        referenceRange: '1.8 - 3.6',
        unit: 'g/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'GGT',
    title: 'Gamma Glutamyl Transferase, GGT',
    basePrice: 300,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Enzymatic measurement of Gamma-Glutamyl Transferase (GGT) in serum for assessing hepatobiliary disorders, biliary obstruction, and alcohol-induced liver injury.',
    notes: `Interpretation:
Synthesis of GGT is stimulated by many drugs e.g., phenytoin, phenobarbitone, primidone, alcohol and possibly some antidepressants. GGT is a sensitive test for excess alcohol intake but is not specific.

Abnormal test results:
1. Raised GGT and raised mean corpuscular volume (MCV) suggest alcohol abuse.
2. Raised GGT, history of excessive alcohol intake, raised ALT and raised MCV suggest liver cell damage.
3. Very high GGT (10 times normal upper limit) occurs in biliary obstruction and hepatic malignancies.
4. Raised GGT and raised ALP (more than three times upper limit of normal) suggest cholestasis.
5. Raised GGT may be due to non-specific causes e.g., MI, cerebrovascular accident, diabetes mellitus, pancreatic disease, renal failure and chronic lung disease.
6. LFTs (transaminase and GGT) are also affected by lack of exercise, obesity and smoking, as well as excess alcohol intake. Elevated results may, therefore, occur if several of these factors coexist, even if alcohol intake is not excessive.
7. The effect of alcohol on GGT is complex. About 50% of people who drink alcohol to excess on a regular basis will have biochemical abnormalities, while the other 50% will not.`,
    interpretation: `Interpretation:
Synthesis of GGT is stimulated by many drugs e.g., phenytoin, phenobarbitone, primidone, alcohol and possibly some antidepressants. GGT is a sensitive test for excess alcohol intake but is not specific.

Abnormal test results:
1. Raised GGT and raised mean corpuscular volume (MCV) suggest alcohol abuse.
2. Raised GGT, history of excessive alcohol intake, raised ALT and raised MCV suggest liver cell damage.
3. Very high GGT (10 times normal upper limit) occurs in biliary obstruction and hepatic malignancies.
4. Raised GGT and raised ALP (more than three times upper limit of normal) suggest cholestasis.
5. Raised GGT may be due to non-specific causes e.g., MI, cerebrovascular accident, diabetes mellitus, pancreatic disease, renal failure and chronic lung disease.
6. LFTs (transaminase and GGT) are also affected by lack of exercise, obesity and smoking, as well as excess alcohol intake. Elevated results may, therefore, occur if several of these factors coexist, even if alcohol intake is not excessive.
7. The effect of alcohol on GGT is complex. About 50% of people who drink alcohol to excess on a regular basis will have biochemical abnormalities, while the other 50% will not.`,
    parameters: [
      {
        name: 'Gamma Glutamyl Transferase, GGT',
        referenceRange: '9 - 52',
        unit: 'IU/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'GCT',
    title: 'Glucose Challenge Test (GCT); Pregnancy , 75g Glucose',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Blood Fluoride Plasma',
    turnaroundTime: 'Same Day',
    description: 'Gestational Diabetes Mellitus (GDM) screening test measuring plasma glucose after a 75g oral glucose challenge during pregnancy (24-28 weeks).',
    notes: `Clinical Significance:
The Glucose Challenge Test (GCT) is a standard screening test for Gestational Diabetes Mellitus (GDM), typically performed between 24 and 28 weeks of gestation in pregnant women. Plasma glucose is measured after oral administration of a 75g glucose load.

Reference Range:
• Normal Screening Value : 70 – 140 mg/dL (< 140 mg/dL)

Clinical Interpretation:
• Plasma Glucose < 140 mg/dL : Negative screen (GDM unlikely).
• Plasma Glucose 140 – 199 mg/dL : Positive screen (Impaired gestational glucose tolerance; warrants follow-up diagnostic oral glucose tolerance testing - OGTT / DIPSI criteria).
• Plasma Glucose ≥ 200 mg/dL : Highly suggestive of Gestational Diabetes Mellitus.

Comments:
According to DIPSI (Diabetes in Pregnancy Study Group India) guidelines, a 2-hour plasma glucose ≥ 140 mg/dL after a 75g oral glucose load in the non-fasting state is diagnostic of GDM.`,
    interpretation: `Clinical Significance:
The Glucose Challenge Test (GCT) is a standard screening test for Gestational Diabetes Mellitus (GDM), typically performed between 24 and 28 weeks of gestation in pregnant women. Plasma glucose is measured after oral administration of a 75g glucose load.

Reference Range:
• Normal Screening Value : 70 – 140 mg/dL (< 140 mg/dL)

Clinical Interpretation:
• Plasma Glucose < 140 mg/dL : Negative screen (GDM unlikely).
• Plasma Glucose 140 – 199 mg/dL : Positive screen (Impaired gestational glucose tolerance; warrants follow-up diagnostic oral glucose tolerance testing - OGTT / DIPSI criteria).
• Plasma Glucose ≥ 200 mg/dL : Highly suggestive of Gestational Diabetes Mellitus.

Comments:
According to DIPSI (Diabetes in Pregnancy Study Group India) guidelines, a 2-hour plasma glucose ≥ 140 mg/dL after a 75g oral glucose load in the non-fasting state is diagnostic of GDM.`,
    parameters: [
      {
        name: 'Glucose Challenge Test (GCT); Pregnancy , 75g Glucose',
        referenceRange: '70 - 140',
        unit: 'mg/dL',
        gender: 'Female',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'G6PD',
    title: 'Glucose-6-Phosphate Dehydrogenase (G6PD)',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'EDTA Whole Blood',
    turnaroundTime: 'Same Day',
    description: 'Quantitative measurement of Glucose-6-Phosphate Dehydrogenase enzyme activity in erythrocytes for diagnosing G6PD deficiency, hemolytic anemia, and pre-medication risk assessment.',
    notes: `Clinical Significance:
Glucose-6-Phosphate Dehydrogenase (G6PD) is a critical housekeeping enzyme in the hexose monophosphate (HMP) shunt pathway. In erythrocytes (RBCs), G6PD is the sole source of NADPH, which maintains reduced glutathione (GSH) to protect red blood cells and hemoglobin against oxidative stressors and free radicals.

Reference Ranges (Quantitative Spectrophotometry at 37°C):
• Normal / Adequate Activity : 6.4 – 12.9 U/g Hb
• Intermediate Deficiency : 2.1 – 6.3 U/g Hb (30% – 70% of normal mean)
• Severe / Deficient Activity : < 2.1 U/g Hb (< 30% of normal mean)

Clinical Interpretation & WHO Classification:
1. G6PD Deficiency is an X-linked recessive enzymopathy primarily affecting males (hemizygotes) and homozygous females; heterozygous females exhibit variable mosaic expression due to lyonization (X-inactivation).
2. Acute Hemolytic Anemia (AHA) Triggers:
   - Oxidant Drugs: Antimalarials (primaquine, tafenoquine), sulfonamides/cotrimoxazole, nitrofurantoin, dapsone, rasburicase, methylene blue.
   - Dietary: Ingestion of fava beans (Vicia faba) causing Favism.
   - Acute Infections: Viral hepatitis, pneumonia, typhoid, severe sepsis, or diabetic ketoacidosis.
   - Neonatal Jaundice: Severe unconjugated hyperbilirubinemia with risk of acute kernicterus.

Diagnostic Cautions:
• Testing during or immediately following an acute hemolytic episode or blood transfusion may yield falsely normal/elevated enzyme levels because older G6PD-deficient erythrocytes have lysed, leaving younger reticulocytes and transfused donor RBCs with high enzyme levels.
• Re-testing 2–3 months after resolution of hemolysis is strongly recommended to establish true baseline enzymatic activity.`,
    interpretation: `Clinical Significance:
Glucose-6-Phosphate Dehydrogenase (G6PD) is a critical housekeeping enzyme in the hexose monophosphate (HMP) shunt pathway. In erythrocytes (RBCs), G6PD is the sole source of NADPH, which maintains reduced glutathione (GSH) to protect red blood cells and hemoglobin against oxidative stressors and free radicals.

Reference Ranges (Quantitative Spectrophotometry at 37°C):
• Normal / Adequate Activity : 6.4 – 12.9 U/g Hb
• Intermediate Deficiency : 2.1 – 6.3 U/g Hb (30% – 70% of normal mean)
• Severe / Deficient Activity : < 2.1 U/g Hb (< 30% of normal mean)

Clinical Interpretation & WHO Classification:
1. G6PD Deficiency is an X-linked recessive enzymopathy primarily affecting males (hemizygotes) and homozygous females; heterozygous females exhibit variable mosaic expression due to lyonization (X-inactivation).
2. Acute Hemolytic Anemia (AHA) Triggers:
   - Oxidant Drugs: Antimalarials (primaquine, tafenoquine), sulfonamides/cotrimoxazole, nitrofurantoin, dapsone, rasburicase, methylene blue.
   - Dietary: Ingestion of fava beans (Vicia faba) causing Favism.
   - Acute Infections: Viral hepatitis, pneumonia, typhoid, severe sepsis, or diabetic ketoacidosis.
   - Neonatal Jaundice: Severe unconjugated hyperbilirubinemia with risk of acute kernicterus.

Diagnostic Cautions:
• Testing during or immediately following an acute hemolytic episode or blood transfusion may yield falsely normal/elevated enzyme levels because older G6PD-deficient erythrocytes have lysed, leaving younger reticulocytes and transfused donor RBCs with high enzyme levels.
• Re-testing 2–3 months after resolution of hemolysis is strongly recommended to establish true baseline enzymatic activity.`,
    parameters: [
      {
        name: 'Glucose-6-Phosphate Dehydrogenase (G6PD)',
        referenceRange: '6.4 - 12.9',
        unit: 'U/g Hb',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Fungal Scraping Smear',
    title: 'Fungal Scraping Smear (KOH Mount)',
    basePrice: 250,
    taxPercentage: 0,
    sampleType: 'Skin Scrapings / Nail Clippings / Hair / Corneal Scrapings',
    turnaroundTime: 'Same Day',
    description: 'Direct microscopic examination following 10%-20% KOH mount preparation for detecting dermatophytes, Candida, Malassezia, and opportunistic fungal elements.',
    notes: `Clinical Significance:
Direct microscopic examination of clinical specimens treated with 10%–20% Potassium Hydroxide (KOH) is a rapid and highly effective primary screening method for superficial, cutaneous, and subcutaneous fungal infections (mycoses). KOH dissolves keratin and cellular debris, making fungal cell walls (hyphae, pseudohyphae, spores) clearly visible.

Microscopic Morphological Interpretation:
1. Dermatophytosis (Tinea / Ringworm):
   - Refractile, branching, uniform septate hyphae with arthroconidia (spores).
2. Candidiasis:
   - Budding yeast-like blastoconidia with elongated pseudohyphae and true hyphae.
3. Pityriasis / Tinea Versicolor (Malassezia furfur):
   - "Spaghetti and meatballs" appearance consisting of short, curved hyphae mixed with round, thick-walled yeast clusters.
4. Onychomycosis:
   - Subungual hyperkeratotic nail debris showing fungal hyphal elements.
5. Deep / Invasive Molds (e.g., Aspergillus / Mucorales):
   - Acute-angle branching septate hyphae (Aspergillus) or broad, non-septate ribbon-like hyphae with wide branching angles (Mucorales).

Advisory:
KOH mount provides rapid presumptive screening. Sabouraud Dextrose Agar (SDA) fungal culture is recommended for definitive species identification and antifungal sensitivity.`,
    interpretation: `Clinical Significance:
Direct microscopic examination of clinical specimens treated with 10%–20% Potassium Hydroxide (KOH) is a rapid and highly effective primary screening method for superficial, cutaneous, and subcutaneous fungal infections (mycoses). KOH dissolves keratin and cellular debris, making fungal cell walls (hyphae, pseudohyphae, spores) clearly visible.

Microscopic Morphological Interpretation:
1. Dermatophytosis (Tinea / Ringworm):
   - Refractile, branching, uniform septate hyphae with arthroconidia (spores).
2. Candidiasis:
   - Budding yeast-like blastoconidia with elongated pseudohyphae and true hyphae.
3. Pityriasis / Tinea Versicolor (Malassezia furfur):
   - "Spaghetti and meatballs" appearance consisting of short, curved hyphae mixed with round, thick-walled yeast clusters.
4. Onychomycosis:
   - Subungual hyperkeratotic nail debris showing fungal hyphal elements.
5. Deep / Invasive Molds (e.g., Aspergillus / Mucorales):
   - Acute-angle branching septate hyphae (Aspergillus) or broad, non-septate ribbon-like hyphae with wide branching angles (Mucorales).

Advisory:
KOH mount provides rapid presumptive screening. Sabouraud Dextrose Agar (SDA) fungal culture is recommended for definitive species identification and antifungal sensitivity.`,
    parameters: [
      {
        name: 'Sample Site / Specimen',
        referenceRange: 'Skin / Nail / Hair / Corneal',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Skin Scrapings', isAbnormal: false },
          { value: 'Nail Clippings / Subungual Scrapings', isAbnormal: false },
          { value: 'Hair Plucks / Scalp Scrapings', isAbnormal: false },
          { value: 'Corneal Scrapings', isAbnormal: false },
          { value: 'Mucosal Swab / Scraping', isAbnormal: false }
        ],
        status: 'Active'
      },
      {
        name: 'Microscopic Examination (KOH Mount 10-20%)',
        referenceRange: 'No fungal elements seen',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'No fungal elements (hyphae, pseudohyphae, or spores) detected on direct 10% - 20% KOH mount examination.', isAbnormal: false },
          { value: 'Branching, septate fungal hyphae and arthrospores seen (suggestive of Dermatophyte infection / Tinea / Ringworm).', isAbnormal: true },
          { value: 'Budding yeast cells with pseudohyphae seen (suggestive of Candida species / Candidiasis).', isAbnormal: true },
          { value: 'Clusters of spherical yeast cells with short, curved hyphae ("spaghetti and meatballs" appearance - suggestive of Malassezia furfur / Tinea Versicolor / Pityriasis Versicolor).', isAbnormal: true },
          { value: 'Broad, aseptate/pauci-septate ribbon-like right-angle branching fungal hyphae seen (suggestive of Zygomycetes / Mucorales).', isAbnormal: true },
          { value: 'Septate, acute-angle (40-45°) branching, uniform fungal hyphae seen (suggestive of Aspergillus species).', isAbnormal: true },
          { value: 'Brown-pigmented (dematiaceous) fungal elements seen.', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'FSH',
    title: 'Follicle Stimulating Hormone, FSH',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Chemiluminescence Immunoassay (CLIA) for quantitative determination of Follicle Stimulating Hormone (FSH) in serum to assess fertility, hypogonadism, and pituitary-gonadal axis.',
    notes: `Biological Reference Intervals:
• Males (Adult): 1.5 - 12.4 mIU/mL

• Females:
  - Follicular Phase: 3.5 - 12.5 mIU/mL
  - Mid-Cycle Peak (Ovulatory): 4.7 - 21.5 mIU/mL
  - Luteal Phase: 1.7 - 7.7 mIU/mL
  - Postmenopausal: 25.8 - 134.8 mIU/mL
  - Oral Contraceptives: < 4.9 mIU/mL

• Pre-pubertal Children:
  - Males: 0.3 - 3.2 mIU/mL
  - Females: 0.3 - 6.7 mIU/mL

Clinical Significance:
FSH is secreted by the anterior pituitary gland. In females, it stimulates ovarian follicular growth and estrogen secretion. In males, it stimulates Sertoli cells to support spermatogenesis.

Elevated Levels:
• Primary gonadal failure, menopause, premature ovarian failure (POF), Turner syndrome, Klinefelter syndrome, testicular failure.

Decreased Levels:
• Pituitary or hypothalamic dysfunction, hypogonadotropic hypogonadism, Kallmann syndrome, severe stress/anorexia, hyperprolactinemia.`,
    interpretation: `Biological Reference Intervals:
• Males (Adult): 1.5 - 12.4 mIU/mL

• Females:
  - Follicular Phase: 3.5 - 12.5 mIU/mL
  - Mid-Cycle Peak (Ovulatory): 4.7 - 21.5 mIU/mL
  - Luteal Phase: 1.7 - 7.7 mIU/mL
  - Postmenopausal: 25.8 - 134.8 mIU/mL
  - Oral Contraceptives: < 4.9 mIU/mL

• Pre-pubertal Children:
  - Males: 0.3 - 3.2 mIU/mL
  - Females: 0.3 - 6.7 mIU/mL

Clinical Significance:
FSH is secreted by the anterior pituitary gland. In females, it stimulates ovarian follicular growth and estrogen secretion. In males, it stimulates Sertoli cells to support spermatogenesis.

Elevated Levels:
• Primary gonadal failure, menopause, premature ovarian failure (POF), Turner syndrome, Klinefelter syndrome, testicular failure.

Decreased Levels:
• Pituitary or hypothalamic dysfunction, hypogonadotropic hypogonadism, Kallmann syndrome, severe stress/anorexia, hyperprolactinemia.`,
    parameters: [
      {
        name: 'Follicle Stimulating Hormone, FSH',
        referenceRange: 'Males: 1.5 - 12.4 | Females: Follicular 3.5 - 12.5, Ovulatory 4.7 - 21.5, Luteal 1.7 - 7.7, Postmenopausal 25.8 - 134.8',
        unit: 'mIU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'FT3',
    title: 'Free Triiodothyronine I, FT3',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Quantitative measurement of unbound, biologically active Free Triiodothyronine (FT3) in serum to diagnose hyperthyroidism, T3-thyrotoxicosis, and thyroid dysfunction.',
    notes: `Clinical Significance:
Triiodothyronine (T3) is the metabolically active thyroid hormone. While over 99.7% of circulating T3 is bound to serum carrier proteins (primarily TBG and albumin), only the unbound Free T3 (FT3) is biologically active.

Reference Range:
• Normal Serum Free T3 (FT3) : 2 - 4.2 pg/mL

Clinical Associations:
1. Elevated FT3:
   - Graves' disease, toxic multinodular goiter, toxic adenoma.
   - T3-Thyrotoxicosis (isolated elevated FT3 with suppressed TSH).
   - Early phase of subacute / postpartum thyroiditis.
2. Decreased FT3:
   - Primary / secondary hypothyroidism.
   - Euthyroid Sick Syndrome (Low T3 syndrome) seen in severe non-thyroidal systemic illness, sepsis, starvation, and ICU patients.`,
    interpretation: `Clinical Significance:
Triiodothyronine (T3) is the metabolically active thyroid hormone. While over 99.7% of circulating T3 is bound to serum carrier proteins (primarily TBG and albumin), only the unbound Free T3 (FT3) is biologically active.

Reference Range:
• Normal Serum Free T3 (FT3) : 2 - 4.2 pg/mL

Clinical Associations:
1. Elevated FT3:
   - Graves' disease, toxic multinodular goiter, toxic adenoma.
   - T3-Thyrotoxicosis (isolated elevated FT3 with suppressed TSH).
   - Early phase of subacute / postpartum thyroiditis.
2. Decreased FT3:
   - Primary / secondary hypothyroidism.
   - Euthyroid Sick Syndrome (Low T3 syndrome) seen in severe non-thyroidal systemic illness, sepsis, starvation, and ICU patients.`,
    parameters: [
      {
        name: 'Free Triiodothyronine I, FT3',
        referenceRange: '2 - 4.2',
        unit: 'pg/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'FT4',
    title: 'Free Thyroxine, FT4',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Quantitative measurement of unbound, biologically active Free Thyroxine (FT4) in serum for assessing thyroid function, hypothyroidism, and hyperthyroidism.',
    notes: `Clinical Significance:
Thyroxine (T4) is the principal hormone secreted by the thyroid follicular cells. Over 99.9% of circulating T4 is bound to carrier proteins (primarily TBG, transthyretin, and albumin). Free T4 (FT4) represents the unbound, biologically active fraction that diffuses into target cells and exerts metabolic effects, independent of alterations in binding protein concentrations.

Reference Range:
• Normal Serum Free T4 (FT4) : 8.9 - 17.2 pg/mL

Clinical Associations:
1. Elevated FT4:
   - Graves' disease, toxic multinodular goiter, toxic solitary adenoma.
   - Subacute / postpartum thyroiditis (early thyrotoxic phase).
   - Exogenous levothyroxine over-replacement.
2. Decreased FT4:
   - Primary Hypothyroidism: Hashimoto's thyroiditis, post-surgical/radioiodine ablation.
   - Central (Secondary / Tertiary) Hypothyroidism: Pituitary or hypothalamic insufficiency.`,
    interpretation: `Clinical Significance:
Thyroxine (T4) is the principal hormone secreted by the thyroid follicular cells. Over 99.9% of circulating T4 is bound to carrier proteins (primarily TBG, transthyretin, and albumin). Free T4 (FT4) represents the unbound, biologically active fraction that diffuses into target cells and exerts metabolic effects, independent of alterations in binding protein concentrations.

Reference Range:
• Normal Serum Free T4 (FT4) : 8.9 - 17.2 pg/mL

Clinical Associations:
1. Elevated FT4:
   - Graves' disease, toxic multinodular goiter, toxic solitary adenoma.
   - Subacute / postpartum thyroiditis (early thyrotoxic phase).
   - Exogenous levothyroxine over-replacement.
2. Decreased FT4:
   - Primary Hypothyroidism: Hashimoto's thyroiditis, post-surgical/radioiodine ablation.
   - Central (Secondary / Tertiary) Hypothyroidism: Pituitary or hypothalamic insufficiency.`,
    parameters: [
      {
        name: 'Free Thyroxine, FT4',
        referenceRange: '8.9 - 17.2',
        unit: 'pg/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Folic Acid',
    title: 'Folic Acid',
    basePrice: 800,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Quantitative determination of Serum Folate / Folic Acid level by Chemiluminescence Immunoassay (CLIA) to diagnose megaloblastic anemia, malnutrition, and malabsorption.',
    notes: `Note:
1. Drugs like Methotrexate and Leucovorin can affect folate test results.
2. To tell apart vitamin B12 deficiency from folate deficiency, check levels of Methylmalonic acid (MMA) in urine and Homocysteine in blood.
3. Folic acid has a low risk of toxicity because it's a water-soluble vitamin that's usually excreted in urine.

Comments:
Folate is crucial for making DNA components and for red blood cell maturation. It comes mainly from plants and some organ meats, but cooking can destroy over half of it. Folate deficiency is common in people with alcoholic liver disease, pregnant women, and the elderly. It can result from poor absorption, inadequate diet, high demand (like in pregnancy or cancer), or certain drugs such as Methotrexate and anticonvulsants.

Interpretation:
Reference Range: 3.1 - 17.5 ng/mL (Normal: > 5.38 ng/mL)
Decreased Levels: Megaloblastic anemia, Infantile hyperthyroidism, Alcoholism, Malnutrition, Scurvy, Liver disease, B12 deficiency, dietary amino acid excess, adult Celiac disease, Tropical Sprue, Crohn's disease, Hemolytic anemias, Carcinomas, Myelofibrosis, vitamin B6 deficiency, pregnancy, Whipple's disease, extensive intestinal resection and severe exfoliative dermatitis.`,
    interpretation: `Note:
1. Drugs like Methotrexate and Leucovorin can affect folate test results.
2. To tell apart vitamin B12 deficiency from folate deficiency, check levels of Methylmalonic acid (MMA) in urine and Homocysteine in blood.
3. Folic acid has a low risk of toxicity because it's a water-soluble vitamin that's usually excreted in urine.

Comments:
Folate is crucial for making DNA components and for red blood cell maturation. It comes mainly from plants and some organ meats, but cooking can destroy over half of it. Folate deficiency is common in people with alcoholic liver disease, pregnant women, and the elderly. It can result from poor absorption, inadequate diet, high demand (like in pregnancy or cancer), or certain drugs such as Methotrexate and anticonvulsants.

Interpretation:
Reference Range: 3.1 - 17.5 ng/mL (Normal: > 5.38 ng/mL)
Decreased Levels: Megaloblastic anemia, Infantile hyperthyroidism, Alcoholism, Malnutrition, Scurvy, Liver disease, B12 deficiency, dietary amino acid excess, adult Celiac disease, Tropical Sprue, Crohn's disease, Hemolytic anemias, Carcinomas, Myelofibrosis, vitamin B6 deficiency, pregnancy, Whipple's disease, extensive intestinal resection and severe exfoliative dermatitis.`,
    parameters: [
      {
        name: 'Folic Acid',
        referenceRange: '3.1 - 17.5',
        unit: 'ng/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Free PSA',
    title: 'Free Prostate Specific Antigen (Free PSA)',
    basePrice: 850,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Chemiluminescence Immunoassay (CLIA) for measurement of Free PSA and % Free/Total PSA ratio to differentiate Benign Prostatic Hyperplasia (BPH) from Prostate Cancer in men with total PSA 4-10 ng/mL.',
    notes: `Clinical Significance:
Prostate-Specific Antigen (PSA) is produced by the secretory epithelium of the prostate. In men with Total PSA levels in the diagnostic "gray zone" of 4.0 to 10.0 ng/mL, the percentage of Free PSA (% fPSA = [Free PSA / Total PSA] × 100) enhances diagnostic specificity to distinguish Benign Prostatic Hyperplasia (BPH) from Prostate Cancer (PCa).

Probability of Prostate Cancer Based on % Free PSA (Total PSA 4.0 - 10.0 ng/mL):
• % Free PSA > 25% : Low Risk (~8% - 10% probability of cancer) -> BPH likely
• % Free PSA 19% - 25% : Intermediate-Low Risk (~18% probability of cancer)
• % Free PSA 15% - 18% : Moderate Risk (~24% probability of cancer)
• % Free PSA 10% - 14% : Intermediate-High Risk (~33% - 40% probability of cancer)
• % Free PSA < 10% : High Risk (~56% probability of cancer) -> Prostate Biopsy Recommended

Clinical Guidance & Pre-test Precautions:
1. Men with % Free PSA < 10% have significantly higher risk of aggressive prostate adenocarcinoma.
2. Blood collection should occur before digital rectal exam (DRE), prostate massage, cystoscopy, or 48 hours afterward.
3. 5-alpha reductase inhibitors (Finasteride, Dutasteride) reduce serum PSA by ~50% within 6 months.`,
    interpretation: `Clinical Significance:
Prostate-Specific Antigen (PSA) is produced by the secretory epithelium of the prostate. In men with Total PSA levels in the diagnostic "gray zone" of 4.0 to 10.0 ng/mL, the percentage of Free PSA (% fPSA = [Free PSA / Total PSA] × 100) enhances diagnostic specificity to distinguish Benign Prostatic Hyperplasia (BPH) from Prostate Cancer (PCa).

Probability of Prostate Cancer Based on % Free PSA (Total PSA 4.0 - 10.0 ng/mL):
• % Free PSA > 25% : Low Risk (~8% - 10% probability of cancer) -> BPH likely
• % Free PSA 19% - 25% : Intermediate-Low Risk (~18% probability of cancer)
• % Free PSA 15% - 18% : Moderate Risk (~24% probability of cancer)
• % Free PSA 10% - 14% : Intermediate-High Risk (~33% - 40% probability of cancer)
• % Free PSA < 10% : High Risk (~56% probability of cancer) -> Prostate Biopsy Recommended

Clinical Guidance & Pre-test Precautions:
1. Men with % Free PSA < 10% have significantly higher risk of aggressive prostate adenocarcinoma.
2. Blood collection should occur before digital rectal exam (DRE), prostate massage, cystoscopy, or 48 hours afterward.
3. 5-alpha reductase inhibitors (Finasteride, Dutasteride) reduce serum PSA by ~50% within 6 months.`,
    parameters: [
      {
        name: 'Free Prostate Specific Antigen (Free PSA)',
        referenceRange: '0.05 - 0.50',
        unit: 'ng/mL',
        gender: 'Male',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Total PSA',
        referenceRange: '0.0 - 4.0',
        unit: 'ng/mL',
        gender: 'Male',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: '% Free PSA Ratio (% fPSA / tPSA)',
        referenceRange: '> 25 % (Low Risk)',
        unit: '%',
        gender: 'Male',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'DHEA',
    title: 'Dehydroepiandrosterone, DHEA',
    basePrice: 800,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Chemiluminescence Immunoassay (CLIA) for quantitative determination of Dehydroepiandrosterone (DHEA) in serum to evaluate adrenal cortex function, androgen excess, and PCOS.',
    notes: `Physiologic Basis:
DHEA is a 19-carbon endogenous steroid hormone secreted by the adrenal glands. It is converted to DHEA-S in the adrenals, liver, and small intestine. DHEA-S is albumin-bound in the circulation, and there is no diurnal variation in DHEA-S levels. Levels of DHEA-S are about 300 × higher than DHEA and more stable. It serves as the precursor of androgens and estrogens.

Interpretation:
Reference Range (µg/dl):
• Males: 1.8 - 12.5 µg/dl
• Females: 1.3 - 9.8 µg/dl

Increased in:
• Adrenal hyperplasia, adrenal cancer, congenital adrenal hyperplasia (CAH), polycystic ovarian syndrome (PCOS).

Decreased in:
• Adrenal insufficiency (Addison's disease), hypopituitarism, rheumatoid arthritis (females), insulin, and corticosteroids.

Comments:
DHEA measurement is typically used along with other steroid and peptide hormones to evaluate adrenal function, to help diagnose adrenal cortex tumors, and polycystic ovarian syndrome (in females). Orally ingested DHEA is converted to DHEA-S when passing through intestines and liver. People taking DHEA supplements have elevated blood levels of DHEA-S. Use by athletes is prohibited by the World Anti-doping Agency.`,
    interpretation: `Physiologic Basis:
DHEA is a 19-carbon endogenous steroid hormone secreted by the adrenal glands. It is converted to DHEA-S in the adrenals, liver, and small intestine. DHEA-S is albumin-bound in the circulation, and there is no diurnal variation in DHEA-S levels. Levels of DHEA-S are about 300 × higher than DHEA and more stable. It serves as the precursor of androgens and estrogens.

Interpretation:
Reference Range (µg/dl):
• Males: 1.8 - 12.5 µg/dl
• Females: 1.3 - 9.8 µg/dl

Increased in:
• Adrenal hyperplasia, adrenal cancer, congenital adrenal hyperplasia (CAH), polycystic ovarian syndrome (PCOS).

Decreased in:
• Adrenal insufficiency (Addison's disease), hypopituitarism, rheumatoid arthritis (females), insulin, and corticosteroids.

Comments:
DHEA measurement is typically used along with other steroid and peptide hormones to evaluate adrenal function, to help diagnose adrenal cortex tumors, and polycystic ovarian syndrome (in females). Orally ingested DHEA is converted to DHEA-S when passing through intestines and liver. People taking DHEA supplements have elevated blood levels of DHEA-S. Use by athletes is prohibited by the World Anti-doping Agency.`,
    parameters: [
      {
        name: 'DHEA',
        referenceRange: 'Males: 1.8 - 12.5 | Females: 1.3 - 9.8',
        unit: 'µg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Diabetic Package',
    title: 'Diabetic Package / Comprehensive Diabetic Profile',
    basePrice: 1200,
    taxPercentage: 0,
    sampleType: 'Blood (Fluoride, EDTA, Serum)',
    turnaroundTime: 'Same Day',
    description: 'Comprehensive diabetes screening and metabolic monitoring panel including Fasting & Postprandial Glucose, HbA1c, Complete Lipid Profile, and Renal Function Tests (Urea & Creatinine).',
    notes: `I. GLUCOSE METABOLISM & DIABETES DIAGNOSTIC CRITERIA (ADA Guidelines):
Elevated glucose levels (hyperglycemia) are most often encountered clinically in diabetes mellitus, but may also occur with pancreatic disorders, hyperthyroidism, and adrenocortical dysfunction. Decreased levels (hypoglycemia) result from insulin excess, prolonged starvation, or liver disease.

Diagnostic Criteria:
• Fasting Blood Sugar: < 100 mg/dL (Normal) | 100 - 125 mg/dL (Pre-Diabetes / IFG) | ≥ 126 mg/dL (Diabetes)
• Postprandial Blood Sugar: < 140 mg/dL (Normal) | 140 - 199 mg/dL (Pre-Diabetes / IGT) | ≥ 200 mg/dL (Diabetes)
• HbA1c: < 5.7 % (Normal) | 5.7 - 6.4 % (Prediabetes) | ≥ 6.5 % (Diabetes)

II. LIPID PROFILE IN DIABETES:
Abnormalities of lipids increase coronary artery disease (CAD) risk in diabetes. Typical diabetic dyslipidemia features high Triglycerides, low HDL-C, and elevated small dense LDL particles.
LAI Statin Initiation Guidelines (2020):
• Extreme / Very High Risk: LDL Goal < 50 mg/dL, Non-HDL Goal < 80 mg/dL
• High Risk: LDL Goal < 70 mg/dL, Non-HDL Goal < 100 mg/dL
• Moderate Risk: LDL Goal < 100 mg/dL, Non-HDL Goal < 130 mg/dL

III. RENAL FUNCTION (DIABETIC NEPHROPATHY SCREENING):
Serum Creatinine and Blood Urea assess glomerular filtration and renal clearance to detect early diabetic nephropathy.`,
    interpretation: `I. GLUCOSE METABOLISM & DIABETES DIAGNOSTIC CRITERIA (ADA Guidelines):
Elevated glucose levels (hyperglycemia) are most often encountered clinically in diabetes mellitus, but may also occur with pancreatic disorders, hyperthyroidism, and adrenocortical dysfunction. Decreased levels (hypoglycemia) result from insulin excess, prolonged starvation, or liver disease.

Diagnostic Criteria:
• Fasting Blood Sugar: < 100 mg/dL (Normal) | 100 - 125 mg/dL (Pre-Diabetes / IFG) | ≥ 126 mg/dL (Diabetes)
• Postprandial Blood Sugar: < 140 mg/dL (Normal) | 140 - 199 mg/dL (Pre-Diabetes / IGT) | ≥ 200 mg/dL (Diabetes)
• HbA1c: < 5.7 % (Normal) | 5.7 - 6.4 % (Prediabetes) | ≥ 6.5 % (Diabetes)

II. LIPID PROFILE IN DIABETES:
Abnormalities of lipids increase coronary artery disease (CAD) risk in diabetes. Typical diabetic dyslipidemia features high Triglycerides, low HDL-C, and elevated small dense LDL particles.
LAI Statin Initiation Guidelines (2020):
• Extreme / Very High Risk: LDL Goal < 50 mg/dL, Non-HDL Goal < 80 mg/dL
• High Risk: LDL Goal < 70 mg/dL, Non-HDL Goal < 100 mg/dL
• Moderate Risk: LDL Goal < 100 mg/dL, Non-HDL Goal < 130 mg/dL

III. RENAL FUNCTION (DIABETIC NEPHROPATHY SCREENING):
Serum Creatinine and Blood Urea assess glomerular filtration and renal clearance to detect early diabetic nephropathy.`,
    parameters: [
      {
        name: 'Fasting Blood Sugar',
        referenceRange: '70 - 100',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Blood Sugar PP',
        referenceRange: '< 180 mg/dl',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'HbA1c (Glycated Hemoglobin)',
        referenceRange: '< 5.7 % (Normal) | 5.7 - 6.4 % (Prediabetes) | >= 6.5 % (Diabetes)',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Estimated Average Glucose (eAG)',
        referenceRange: '70 - 126',
        unit: 'mg/dL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Total Cholesterol',
        referenceRange: '125 - 200',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Triglycerides',
        referenceRange: '25 - 200',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'HDL Cholesterol',
        referenceRange: '35 - 80',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'LDL Cholesterol',
        referenceRange: '85 - 130',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'VLDL Cholesterol',
        referenceRange: '5 - 40',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'LDL / HDL',
        referenceRange: '1.5 - 3.5',
        unit: '',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Total Cholesterol / HDL',
        referenceRange: '3.5 - 5.0',
        unit: '',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'TG / HDL',
        referenceRange: '< 3.0',
        unit: '',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Non-HDL cholesterol',
        referenceRange: '< 130',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Urea',
        referenceRange: '19 - 45',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Creatinine',
        referenceRange: '0.72 - 1.18',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'DLC',
    title: 'Differential Leucocyte Count (DLC)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: 'Same Day',
    description: 'Microscopic and automated differential leukocyte count (DLC) evaluating proportions of neutrophils, lymphocytes, eosinophils, monocytes, and basophils.',
    notes: `Differential Leucocyte Count (DLC) Reference Ranges & Clinical Interpretation:

1. Neutrophils (40 - 80 %):
• Increased in: Infection (bacterial or early viral), acute stress, acute and chronic inflammation, tumors, drugs (eg, G-CSF), diabetic ketoacidosis, leukemia (rare).
• Decreased in: Aplastic anemia, drug-induced neutropenia, chemotherapy, folate or B12 deficiency, myelodysplasia, marrow infiltration, cyclic neutropenia, autoimmune/isoimmune neutropenia, Felty syndrome, hypersplenism, sepsis, viral marrow suppression, bone marrow failure syndromes.

2. Lymphocytes (20 - 40 %):
• Increased in: Viral infection (especially infectious mononucleosis, pertussis), thyrotoxicosis, adrenal insufficiency, lymphoid leukemia/lymphoma, chronic infection, drug and allergic reactions, autoimmune diseases.
• Decreased in: Immune deficiency syndromes (eg, HIV), idiopathic drugs.

3. Monocytes (2 - 10 %):
• Increased in: Inflammation, infection, malignancy, tuberculosis, myeloproliferative disorders (eg, CMML).
• Decreased in: Depleted in overwhelming bacterial infection, hairy cell leukemia.

4. Eosinophils (1 - 6 %):
• Increased in: Allergic states, asthma, drug sensitivity reactions, skin disorders, parasitic and certain fungal infections, Churg-Strauss syndrome, polyarteritis nodosa, response to malignancy (eg, Hodgkin disease, T-cell lymphoma, adenocarcinoma), eosinophilic pneumonia, hypereosinophilic syndrome, leukemia (eg, chronic eosinophilic leukemia), myeloid/lymphoid neoplasms with PDGF/FGF receptor abnormalities, mastocytosis.
• Decreased in: Depleted in overwhelming bacterial infection, hairy cell leukemia.

5. Basophils (< 2 %):
• Increased in: Hypersensitivity reactions, drugs, myeloproliferative disorders (eg, CML), basophilic or mast cell variant of acute/chronic leukemia, inflammatory reaction, certain infections, hypothyroidism.
• Decreased in: Not applicable.`,
    interpretation: `Differential Leucocyte Count (DLC) Reference Ranges & Clinical Interpretation:

1. Neutrophils (40 - 80 %):
• Increased in: Infection (bacterial or early viral), acute stress, acute and chronic inflammation, tumors, drugs (eg, G-CSF), diabetic ketoacidosis, leukemia (rare).
• Decreased in: Aplastic anemia, drug-induced neutropenia, chemotherapy, folate or B12 deficiency, myelodysplasia, marrow infiltration, cyclic neutropenia, autoimmune/isoimmune neutropenia, Felty syndrome, hypersplenism, sepsis, viral marrow suppression, bone marrow failure syndromes.

2. Lymphocytes (20 - 40 %):
• Increased in: Viral infection (especially infectious mononucleosis, pertussis), thyrotoxicosis, adrenal insufficiency, lymphoid leukemia/lymphoma, chronic infection, drug and allergic reactions, autoimmune diseases.
• Decreased in: Immune deficiency syndromes (eg, HIV), idiopathic drugs.

3. Monocytes (2 - 10 %):
• Increased in: Inflammation, infection, malignancy, tuberculosis, myeloproliferative disorders (eg, CMML).
• Decreased in: Depleted in overwhelming bacterial infection, hairy cell leukemia.

4. Eosinophils (1 - 6 %):
• Increased in: Allergic states, asthma, drug sensitivity reactions, skin disorders, parasitic and certain fungal infections, Churg-Strauss syndrome, polyarteritis nodosa, response to malignancy (eg, Hodgkin disease, T-cell lymphoma, adenocarcinoma), eosinophilic pneumonia, hypereosinophilic syndrome, leukemia (eg, chronic eosinophilic leukemia), myeloid/lymphoid neoplasms with PDGF/FGF receptor abnormalities, mastocytosis.
• Decreased in: Depleted in overwhelming bacterial infection, hairy cell leukemia.

5. Basophils (< 2 %):
• Increased in: Hypersensitivity reactions, drugs, myeloproliferative disorders (eg, CML), basophilic or mast cell variant of acute/chronic leukemia, inflammatory reaction, certain infections, hypothyroidism.
• Decreased in: Not applicable.`,
    parameters: [
      {
        name: 'Neutrophils',
        referenceRange: '40 - 80',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Lymphocytes',
        referenceRange: '20 - 40',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Eosinophils',
        referenceRange: '1 - 6',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Monocytes',
        referenceRange: '2 - 10',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Basophils',
        referenceRange: '< 2',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Estradiol',
    title: 'Estradiol (E2)',
    basePrice: 550,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Chemiluminescence Immunoassay (CLIA) for quantitative determination of 17-beta Estradiol (E2) in serum to assess ovarian function, menstrual disorders, fertility, and menopausal status.',
    notes: `Biological Reference Intervals (pg/mL):
• Males (Adult): 11.3 - 43.2 pg/mL

• Females:
  - Follicular Phase: 12.5 - 166.0 pg/mL
  - Mid-Cycle Peak (Ovulatory): 85.8 - 498.0 pg/mL
  - Luteal Phase: 43.8 - 211.0 pg/mL
  - Postmenopausal: < 5.0 - 54.7 pg/mL
  - Oral Contraceptives: < 50 pg/mL

• Pre-pubertal Children:
  - Males: < 15 pg/mL
  - Females: < 20 pg/mL

Clinical Significance:
Estradiol (E2) is the most potent circulating natural estrogen. In females, it is primarily synthesized by maturing ovarian follicles and the corpus luteum under the stimulation of FSH and LH. In males, small amounts are produced by testes and peripheral aromatization in adipose tissue.

Elevated Levels:
• Estrogen-producing ovarian granulosa cell tumors, thecomas, testicular Leydig cell tumors, liver cirrhosis, precocious puberty, exogenous estrogen intake.

Decreased Levels:
• Premature ovarian failure (POF), menopause, Turner syndrome, hypopituitarism, hypothalamic dysfunction (Kallmann syndrome, severe anorexia nervosa, strenuous exercise).`,
    interpretation: `Biological Reference Intervals (pg/mL):
• Males (Adult): 11.3 - 43.2 pg/mL

• Females:
  - Follicular Phase: 12.5 - 166.0 pg/mL
  - Mid-Cycle Peak (Ovulatory): 85.8 - 498.0 pg/mL
  - Luteal Phase: 43.8 - 211.0 pg/mL
  - Postmenopausal: < 5.0 - 54.7 pg/mL
  - Oral Contraceptives: < 50 pg/mL

• Pre-pubertal Children:
  - Males: < 15 pg/mL
  - Females: < 20 pg/mL

Clinical Significance:
Estradiol (E2) is the most potent circulating natural estrogen. In females, it is primarily synthesized by maturing ovarian follicles and the corpus luteum under the stimulation of FSH and LH. In males, small amounts are produced by testes and peripheral aromatization in adipose tissue.

Elevated Levels:
• Estrogen-producing ovarian granulosa cell tumors, thecomas, testicular Leydig cell tumors, liver cirrhosis, precocious puberty, exogenous estrogen intake.

Decreased Levels:
• Premature ovarian failure (POF), menopause, Turner syndrome, hypopituitarism, hypothalamic dysfunction (Kallmann syndrome, severe anorexia nervosa, strenuous exercise).`,
    parameters: [
      {
        name: 'Estradiol',
        referenceRange: 'Males: 11.3 - 43.2 | Females: Follicular 12.5 - 166.0, Ovulatory 85.8 - 498.0, Luteal 43.8 - 211.0, Postmenopausal < 5.0 - 54.7',
        unit: 'pg/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Ferritin',
    title: 'Ferritin',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Chemiluminescence Immunoassay (CLIA) for quantitative determination of Serum Ferritin to assess body iron stores, iron deficiency anemia, and iron overload conditions.',
    notes: `Interpretation:
Ferritin is iron storage protein. Determination of ferritin is necessary in Iron deficiency anemia, monitoring iron therapy, and in differential diagnosis of Anaemia.

Elevation levels-
Hemochromatosis, Porphyria, Rheumatoid arthritis, Leukaemia, Hodgkin's lymphoma, Liver disease, Multiple blood transfusion, Acute phase reactant, Increased in all inflammatory condition.

Decreased level-
Iron deficiency anemia.`,
    interpretation: `Interpretation:
Ferritin is iron storage protein. Determination of ferritin is necessary in Iron deficiency anemia, monitoring iron therapy, and in differential diagnosis of Anaemia.

Elevation levels-
Hemochromatosis, Porphyria, Rheumatoid arthritis, Leukaemia, Hodgkin's lymphoma, Liver disease, Multiple blood transfusion, Acute phase reactant, Increased in all inflammatory condition.

Decreased level-
Iron deficiency anemia.`,
    parameters: [
      {
        name: 'Ferritin',
        referenceRange: '22 - 332',
        unit: 'ng/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'eGFR',
    title: 'Estimated Glomerular Filtration Rate (eGFR)',
    basePrice: 250,
    taxPercentage: 0,
    sampleType: 'Blood Serum',
    turnaroundTime: 'Same Day',
    description: 'Quantitative calculation of Estimated Glomerular Filtration Rate (eGFR) using standardized equations based on serum creatinine, age, and sex for kidney function and CKD staging.',
    notes: `Clinical Significance:
Estimated Glomerular Filtration Rate (eGFR) is the premier metric used to evaluate renal function, detect acute kidney injury (AKI), diagnose Chronic Kidney Disease (CKD), and guide drug dosing. eGFR is calculated based on serum creatinine, age, and sex normalized to a standard body surface area (1.73 m²).

KDIGO CKD Staging Classification:
• Stage G1 (Normal / High): eGFR ≥ 90 mL/min/1.73m² (Normal if no kidney damage/albuminuria)
• Stage G2 (Mildly Decreased): eGFR 60 - 89 mL/min/1.73m²
• Stage G3a (Mild-to-Moderately Decreased): eGFR 45 - 59 mL/min/1.73m² (Diagnostic of CKD if sustained > 3 months)
• Stage G3b (Moderately-to-Severely Decreased): eGFR 30 - 44 mL/min/1.73m²
• Stage G4 (Severely Decreased): eGFR 15 - 29 mL/min/1.73m²
• Stage G5 (Kidney Failure / ESRD): eGFR < 15 mL/min/1.73m² (Dialysis/transplant needed)

Clinical Guidance:
1. Persistent eGFR < 60 mL/min/1.73m² for ≥ 3 months confirms Chronic Kidney Disease (CKD).
2. eGFR ≥ 60 mL/min/1.73m² without urine albuminuria does not constitute CKD.`,
    interpretation: `Clinical Significance:
Estimated Glomerular Filtration Rate (eGFR) is the premier metric used to evaluate renal function, detect acute kidney injury (AKI), diagnose Chronic Kidney Disease (CKD), and guide drug dosing. eGFR is calculated based on serum creatinine, age, and sex normalized to a standard body surface area (1.73 m²).

KDIGO CKD Staging Classification:
• Stage G1 (Normal / High): eGFR ≥ 90 mL/min/1.73m² (Normal if no kidney damage/albuminuria)
• Stage G2 (Mildly Decreased): eGFR 60 - 89 mL/min/1.73m²
• Stage G3a (Mild-to-Moderately Decreased): eGFR 45 - 59 mL/min/1.73m² (Diagnostic of CKD if sustained > 3 months)
• Stage G3b (Moderately-to-Severely Decreased): eGFR 30 - 44 mL/min/1.73m²
• Stage G4 (Severely Decreased): eGFR 15 - 29 mL/min/1.73m²
• Stage G5 (Kidney Failure / ESRD): eGFR < 15 mL/min/1.73m² (Dialysis/transplant needed)

Clinical Guidance:
1. Persistent eGFR < 60 mL/min/1.73m² for ≥ 3 months confirms Chronic Kidney Disease (CKD).
2. eGFR ≥ 60 mL/min/1.73m² without urine albuminuria does not constitute CKD.`,
    parameters: [
      {
        name: 'Creatinine',
        referenceRange: '0.72 - 1.18',
        unit: 'mg/dL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'eGFR',
        referenceRange: '> 90',
        unit: 'ml/min/1.73m^2',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'eGFR Category',
        referenceRange: 'Stage G1: Normal (>=90)',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Stage G1: Normal or high kidney function (≥ 90 mL/min/1.73m²)', isAbnormal: false },
          { value: 'Stage G2: Mildly decreased kidney function (60 - 89 mL/min/1.73m²)', isAbnormal: false },
          { value: 'Stage G3a: Mild-to-moderately decreased (45 - 59 mL/min/1.73m²)', isAbnormal: true },
          { value: 'Stage G3b: Moderately-to-severely decreased (30 - 44 mL/min/1.73m²)', isAbnormal: true },
          { value: 'Stage G4: Severely decreased kidney function (15 - 29 mL/min/1.73m²)', isAbnormal: true },
          { value: 'Stage G5: Kidney failure / End-stage renal disease (< 15 mL/min/1.73m²)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Dengue NS1 Antigen',
    title: 'Dengue NS1 Antigen',
    basePrice: 600,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: 'Same Day',
    description: 'Rapid immunochromatographic / ELISA test for early detection of Dengue Virus Non-Structural Protein 1 (NS1) antigen in serum during the acute febrile phase (Day 1 - 9).',
    notes: `Dengue virus, transmitted by Aedes mosquitoes, belongs to the Flavivirus genus and has four serotypes: DEN-1, DEN-2, DEN-3, and DEN-4. Immunity from one serotype is lifelong but does not protect against the others.

Dengue infection ranges from mild fever to severe, potentially fatal hemorrhagic disease. The WHO classifies dengue infections as primary or secondary. Secondary infections with different serotypes carry a higher risk of complications such as Dengue Hemorrhagic Fever (DHF) and Dengue Shock Syndrome (DSS).

Test Utility:
• Dengue NS1 antigen can be detected in serum from day 1 to day 9 after symptoms begin. Dengue-specific IgM antibodies appear as early as 5 days after fever starts and usually last 30-90 days, though they can occasionally be detectable for up to 8 months.
• IgM is also present in secondary and tertiary dengue infections, but often at lower and more transient levels. Dengue IgG levels typically rise by the end of the first week of a primary infection and can persist for months or even a lifetime.
• In primary dengue, patients are usually IgM positive and IgG negative with high IgM levels. In secondary infections, patients are often positive for both IgG and IgM, with higher IgG concentrations.

Confirmed diagnosis of Dengue fever can be established in a suspected case with at least one of the following tests:
1) Demonstration of NS1 antigen by ELISA / Rapid Card
2) Demonstration of IgM antibody titre by ELISA in single serum sample
3) IgG seroconversion in paired sera after 2 weeks with 4 fold rise in titre
4) Demonstration of viral nucleic acid by PCR

Limitations:
• Cross-reactivity due to other flavivirus infections (Tick-borne encephalitis, Japanese encephalitis etc) can give false positive dengue test.
• Differential diagnoses during the acute phase of illness should include measles, rubella, influenza, typhoid, leptospirosis, malaria, other viral hemorrhagic fevers, and any other disease that may present as a nonspecific viral syndrome.`,
    interpretation: `Dengue virus, transmitted by Aedes mosquitoes, belongs to the Flavivirus genus and has four serotypes: DEN-1, DEN-2, DEN-3, and DEN-4. Immunity from one serotype is lifelong but does not protect against the others.

Dengue infection ranges from mild fever to severe, potentially fatal hemorrhagic disease. The WHO classifies dengue infections as primary or secondary. Secondary infections with different serotypes carry a higher risk of complications such as Dengue Hemorrhagic Fever (DHF) and Dengue Shock Syndrome (DSS).

Test Utility:
• Dengue NS1 antigen can be detected in serum from day 1 to day 9 after symptoms begin. Dengue-specific IgM antibodies appear as early as 5 days after fever starts and usually last 30-90 days, though they can occasionally be detectable for up to 8 months.
• IgM is also present in secondary and tertiary dengue infections, but often at lower and more transient levels. Dengue IgG levels typically rise by the end of the first week of a primary infection and can persist for months or even a lifetime.
• In primary dengue, patients are usually IgM positive and IgG negative with high IgM levels. In secondary infections, patients are often positive for both IgG and IgM, with higher IgG concentrations.

Confirmed diagnosis of Dengue fever can be established in a suspected case with at least one of the following tests:
1) Demonstration of NS1 antigen by ELISA / Rapid Card
2) Demonstration of IgM antibody titre by ELISA in single serum sample
3) IgG seroconversion in paired sera after 2 weeks with 4 fold rise in titre
4) Demonstration of viral nucleic acid by PCR

Limitations:
• Cross-reactivity due to other flavivirus infections (Tick-borne encephalitis, Japanese encephalitis etc) can give false positive dengue test.
• Differential diagnoses during the acute phase of illness should include measles, rubella, influenza, typhoid, leptospirosis, malaria, other viral hemorrhagic fevers, and any other disease that may present as a nonspecific viral syndrome.`,
    parameters: [
      {
        name: 'Dengue NS1 Antigen',
        referenceRange: 'Non-Reactive (Negative)',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Non-Reactive (Negative)', isAbnormal: false },
          { value: 'Reactive (Positive)', isAbnormal: true },
          { value: 'Equivocal / Borderline', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'DLC Leukemia',
    title: 'DLC Leukemia',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: 'Same Day',
    description: 'Specialized differential leukocyte count examining peripheral blood smear for abnormal immature myeloid/lymphoid precursors and blast cells.',
    notes: `Clinical Significance:
In healthy adult peripheral blood, immature granulocytic precursors (promyelocytes, myelocytes, metamyelocytes) and blast cells (myeloblasts, lymphoblasts) are normally absent (0%). Their presence in the peripheral circulation indicates severe left-shift, leukemoid reaction, or hematological malignancies such as acute/chronic leukemia or myeloproliferative neoplasms.

Reference Intervals:
• Immature / Band Forms: 0 % (Absent)
• Promyelocytes: 0 % (Absent)
• Myelocytes: 0 % (Absent)
• Blast Cells: 0 % (Absent)
• Meta Myelocytes: 0 % (Absent)

Diagnostic Indications:
1. Chronic Myeloid Leukemia (CML): Marked leukocytosis with complete granulocytic spectrum (myeloblasts, promyelocytes, myelocytes, metamyelocytes, bands, neutrophils) with basophilia.
2. Acute Leukemias (AML / ALL): Presence of circulating blast cells (≥ 20% diagnostic of acute leukemia), cytopenias, and leukemic hiatus.
3. Leukemoid Reaction: Reactive left-shift up to myelocytes/metamyelocytes secondary to severe bacterial infection, tissue necrosis, or malignancy.
4. Myelodysplastic Syndromes (MDS): Dysplastic precursors or circulating blasts.`,
    interpretation: `Clinical Significance:
In healthy adult peripheral blood, immature granulocytic precursors (promyelocytes, myelocytes, metamyelocytes) and blast cells (myeloblasts, lymphoblasts) are normally absent (0%). Their presence in the peripheral circulation indicates severe left-shift, leukemoid reaction, or hematological malignancies such as acute/chronic leukemia or myeloproliferative neoplasms.

Reference Intervals:
• Immature / Band Forms: 0 % (Absent)
• Promyelocytes: 0 % (Absent)
• Myelocytes: 0 % (Absent)
• Blast Cells: 0 % (Absent)
• Meta Myelocytes: 0 % (Absent)

Diagnostic Indications:
1. Chronic Myeloid Leukemia (CML): Marked leukocytosis with complete granulocytic spectrum (myeloblasts, promyelocytes, myelocytes, metamyelocytes, bands, neutrophils) with basophilia.
2. Acute Leukemias (AML / ALL): Presence of circulating blast cells (≥ 20% diagnostic of acute leukemia), cytopenias, and leukemic hiatus.
3. Leukemoid Reaction: Reactive left-shift up to myelocytes/metamyelocytes secondary to severe bacterial infection, tissue necrosis, or malignancy.
4. Myelodysplastic Syndromes (MDS): Dysplastic precursors or circulating blasts.`,
    parameters: [
      {
        name: 'Immature',
        referenceRange: '0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Promyelocytes',
        referenceRange: '0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Myelocytes',
        referenceRange: '0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Blast Cells',
        referenceRange: '0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Meta Myelocytes',
        referenceRange: '0',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Lipid Profile',
    title: 'Lipid Profile',
    basePrice: 550,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Fasting 10-12 hrs)',
    turnaroundTime: 'Same Day',
    description: 'Comprehensive lipid panel evaluating Total Cholesterol, Triglycerides, HDL, LDL, VLDL, and cardiovascular atherogenic ratios.',
    notes: `Abnormalities of lipids are associated with increased risk of coronary artery disease (CAD) in patients with DM. This risk can be reduced by intensive treatment of lipid abnormalities. The usual pattern of lipid abnormalities in type 2 DM is elevated triglycerides, decreased HDL cholesterol and higher proportion of small, dense LDL particles. Cholesterol is a lipid found in all cell membranes and in blood plasma. It is an essential component of the cell membranes, and is necessary for synthesis of steroid hormones, and for the formation of bile acids. Cholesterol is synthesized by the liver and many other organs, and is also ingested in the diet. Triglycerides are lipids in which three long-chain fatty acids are attached to glycerol. They are present in dietary fat and also synthesized by liver and adipose tissue.

Newer treatment goals and statin initiation thresholds based on the risk categories proposed by Lipid Association of India in 2020:
• Extreme Risk Group Category A:
  - Treatment Goal: LDL-C < 50 mg/dl (Optional Goal <= 30), Non-HDL-C < 80 mg/dl (Optional Goal <= 60)
  - Consider Therapy: LDL-C >= 50 mg/dl, Non-HDL-C >= 80 mg/dl
• Extreme Risk Group Category B:
  - Treatment Goal: LDL-C <= 30 mg/dl, Non-HDL-C <= 60 mg/dl
  - Consider Therapy: LDL-C > 30 mg/dl, Non-HDL-C > 60 mg/dl
• Very High Risk:
  - Treatment Goal: LDL-C < 50 mg/dl, Non-HDL-C < 80 mg/dl
  - Consider Therapy: LDL-C >= 50 mg/dl, Non-HDL-C >= 80 mg/dl
• High Risk:
  - Treatment Goal: LDL-C < 70 mg/dl, Non-HDL-C < 100 mg/dl
  - Consider Therapy: LDL-C >= 70 mg/dl, Non-HDL-C >= 100 mg/dl
• Moderate Risk:
  - Treatment Goal: LDL-C < 100 mg/dl, Non-HDL-C < 130 mg/dl
  - Consider Therapy: LDL-C >= 100 mg/dl, Non-HDL-C >= 130 mg/dl
• Low Risk:
  - Treatment Goal: LDL-C < 100 mg/dl, Non-HDL-C < 130 mg/dl
  - Consider Therapy: LDL-C >= 130* mg/dl, Non-HDL-C >= 160* mg/dl
*In low risk patient, consider therapy after an initial non-pharmacological intervention for at least 3 months.`,
    interpretation: `Abnormalities of lipids are associated with increased risk of coronary artery disease (CAD) in patients with DM. This risk can be reduced by intensive treatment of lipid abnormalities. The usual pattern of lipid abnormalities in type 2 DM is elevated triglycerides, decreased HDL cholesterol and higher proportion of small, dense LDL particles. Cholesterol is a lipid found in all cell membranes and in blood plasma. It is an essential component of the cell membranes, and is necessary for synthesis of steroid hormones, and for the formation of bile acids. Cholesterol is synthesized by the liver and many other organs, and is also ingested in the diet. Triglycerides are lipids in which three long-chain fatty acids are attached to glycerol. They are present in dietary fat and also synthesized by liver and adipose tissue.

Newer treatment goals and statin initiation thresholds based on the risk categories proposed by Lipid Association of India in 2020:
• Extreme Risk Group Category A:
  - Treatment Goal: LDL-C < 50 mg/dl (Optional Goal <= 30), Non-HDL-C < 80 mg/dl (Optional Goal <= 60)
  - Consider Therapy: LDL-C >= 50 mg/dl, Non-HDL-C >= 80 mg/dl
• Extreme Risk Group Category B:
  - Treatment Goal: LDL-C <= 30 mg/dl, Non-HDL-C <= 60 mg/dl
  - Consider Therapy: LDL-C > 30 mg/dl, Non-HDL-C > 60 mg/dl
• Very High Risk:
  - Treatment Goal: LDL-C < 50 mg/dl, Non-HDL-C < 80 mg/dl
  - Consider Therapy: LDL-C >= 50 mg/dl, Non-HDL-C >= 80 mg/dl
• High Risk:
  - Treatment Goal: LDL-C < 70 mg/dl, Non-HDL-C < 100 mg/dl
  - Consider Therapy: LDL-C >= 70 mg/dl, Non-HDL-C >= 100 mg/dl
• Moderate Risk:
  - Treatment Goal: LDL-C < 100 mg/dl, Non-HDL-C < 130 mg/dl
  - Consider Therapy: LDL-C >= 100 mg/dl, Non-HDL-C >= 130 mg/dl
• Low Risk:
  - Treatment Goal: LDL-C < 100 mg/dl, Non-HDL-C < 130 mg/dl
  - Consider Therapy: LDL-C >= 130* mg/dl, Non-HDL-C >= 160* mg/dl
*In low risk patient, consider therapy after an initial non-pharmacological intervention for at least 3 months.`,
    parameters: [
      {
        name: 'Total Cholesterol',
        referenceRange: '125 - 200',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Triglycerides',
        referenceRange: '25 - 200',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'HDL Cholesterol',
        referenceRange: '35 - 80',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'LDL Cholesterol',
        referenceRange: '85 - 130',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'VLDL Cholesterol',
        referenceRange: '5 - 40',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'LDL / HDL',
        referenceRange: '1.5 - 3.5',
        unit: '',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Total Cholesterol / HDL',
        referenceRange: '3.5 - 5.0',
        unit: '',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'TG / HDL',
        referenceRange: '< 3.0',
        unit: '',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Non-HDL cholesterol',
        referenceRange: '< 130',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HBeAg',
    title: 'Hepatitis B Envelope Antigen (HBeAg)',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: 'Same Day',
    description: 'Chemiluminescent Microparticle Immunoassay (CMIA) / ELISA for qualitative and semi-quantitative detection of Hepatitis B "e" Antigen (HBeAg) in human serum to assess HBV replication and infectivity.',
    notes: `Physiological Basis:
HBeAg is a soluble protein secreted by HBV, related to HBcAg, indicating viral replication and infectivity. Two distinct serologic types of hepatitis B have been described, one with a positive HBeAg, and the other with a negative HBeAg and a positive anti-HBe antibody.

Interpretation:
Increased (positive) in: HBV (acute, chronic) hepatitis.

Comments:
The assumption has been that loss of HBeAg and accumulation of HBeAb are associated with decreased infectivity. Testing has proved unreliable, and tests are not routinely needed as indicators of infectivity. All patients positive for HBeAg must be considered infectious.`,
    interpretation: `Physiological Basis:
HBeAg is a soluble protein secreted by HBV, related to HBcAg, indicating viral replication and infectivity. Two distinct serologic types of hepatitis B have been described, one with a positive HBeAg, and the other with a negative HBeAg and a positive anti-HBe antibody.

Interpretation:
Increased (positive) in: HBV (acute, chronic) hepatitis.

Comments:
The assumption has been that loss of HBeAg and accumulation of HBeAb are associated with decreased infectivity. Testing has proved unreliable, and tests are not routinely needed as indicators of infectivity. All patients positive for HBeAg must be considered infectious.`,
    parameters: [
      {
        name: 'HBeAg',
        referenceRange: '< 15 index/mL',
        unit: 'index/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HBsAg',
    title: 'Hepatitis B Surface Antigen (HBsAg)',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: 'Same Day',
    description: 'Qualitative immunochromatographic rapid card / Chemiluminescence immunoassay (CLIA) for the detection of Hepatitis B Surface Antigen (HBsAg) in human serum/plasma.',
    notes: `Interpretation:
• Non-Reactive: Hepatitis B surface antigen absent.
• Reactive: Hepatitis B surface antigen present.

Presence of Hepatitis B antigen indicates reactive result which monitors HBsAg levels during the disease but cannot predict the stages of disease. Rapid card tests are screening tests, false positive and false negative results may occur due to various factors which may influence test results.

Test Utility:
HBsAg is the first serologic marker appearing in the serum 6-16 weeks following hepatitis B viral infection. In a typical HBV infection, HBsAg will be detected 2-4 weeks before the liver enzyme levels (ALT) become abnormal and 3-5 weeks before the patient develops jaundice. In acute cases, HBsAg usually disappears 1-2 months after the onset of symptoms. Persistence of HBsAg for more than 6 months indicates the development of either a chronic carrier state or chronic liver disease. The presence of HBsAg is frequently associated with infectivity. HBsAg when accompanied by Hepatitis B e-antigen (HBeAg) and/or hepatitis B viral DNA almost always indicates high infectivity.`,
    interpretation: `Interpretation:
• Non-Reactive: Hepatitis B surface antigen absent.
• Reactive: Hepatitis B surface antigen present.

Presence of Hepatitis B antigen indicates reactive result which monitors HBsAg levels during the disease but cannot predict the stages of disease. Rapid card tests are screening tests, false positive and false negative results may occur due to various factors which may influence test results.

Test Utility:
HBsAg is the first serologic marker appearing in the serum 6-16 weeks following hepatitis B viral infection. In a typical HBV infection, HBsAg will be detected 2-4 weeks before the liver enzyme levels (ALT) become abnormal and 3-5 weeks before the patient develops jaundice. In acute cases, HBsAg usually disappears 1-2 months after the onset of symptoms. Persistence of HBsAg for more than 6 months indicates the development of either a chronic carrier state or chronic liver disease. The presence of HBsAg is frequently associated with infectivity. HBsAg when accompanied by Hepatitis B e-antigen (HBeAg) and/or hepatitis B viral DNA almost always indicates high infectivity.`,
    parameters: [
      {
        name: 'HBsAg',
        referenceRange: 'Non-Reactive (Negative)',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Non-Reactive (Negative)', isAbnormal: false },
          { value: 'Reactive (Positive)', isAbnormal: true },
          { value: 'Equivocal / Borderline', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HBsAg ELISA',
    title: 'HBsAg ELISA',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: 'Same Day',
    description: 'Enzyme-Linked Immunosorbent Assay (ELISA) for highly sensitive and specific detection of Hepatitis B Surface Antigen (HBsAg) in human serum/plasma.',
    notes: `Interpretation & Cut-off Criteria (ELISA):
• Non-Reactive (Negative): Signal-to-Cutoff Ratio (S/CO) < 0.90 Units. Hepatitis B surface antigen absent.
• Equivocal / Borderline: S/CO 0.90 - 1.10 Units. Retesting in duplicate or sample collected after 1-2 weeks recommended.
• Reactive (Positive): S/CO > 1.10 Units. Hepatitis B surface antigen detected, indicating active (acute or chronic) HBV infection.

Method: Enzyme-Linked Immunosorbent Assay (ELISA).

Clinical Significance:
HBsAg is the primary serological marker for diagnosing Hepatitis B Virus (HBV) infection. ELISA methodology provides high analytical sensitivity and specificity for qualitative/semi-quantitative detection.

Diagnostic Utility:
1. Acute Infection: HBsAg appears 2 to 8 weeks before clinical symptoms or liver enzyme elevation and persists throughout acute phase.
2. Chronic Infection: Persistence for > 6 months confirms chronic HBV infection / carrier state.
3. Infectivity Assessment: High correlation with viral replication. Follow-up testing with HBeAg, Anti-HBe, and HBV DNA PCR is recommended.`,
    interpretation: `Interpretation & Cut-off Criteria (ELISA):
• Non-Reactive (Negative): Signal-to-Cutoff Ratio (S/CO) < 0.90 Units. Hepatitis B surface antigen absent.
• Equivocal / Borderline: S/CO 0.90 - 1.10 Units. Retesting in duplicate or sample collected after 1-2 weeks recommended.
• Reactive (Positive): S/CO > 1.10 Units. Hepatitis B surface antigen detected, indicating active (acute or chronic) HBV infection.

Method: Enzyme-Linked Immunosorbent Assay (ELISA).

Clinical Significance:
HBsAg is the primary serological marker for diagnosing Hepatitis B Virus (HBV) infection. ELISA methodology provides high analytical sensitivity and specificity for qualitative/semi-quantitative detection.

Diagnostic Utility:
1. Acute Infection: HBsAg appears 2 to 8 weeks before clinical symptoms or liver enzyme elevation and persists throughout acute phase.
2. Chronic Infection: Persistence for > 6 months confirms chronic HBV infection / carrier state.
3. Infectivity Assessment: High correlation with viral replication. Follow-up testing with HBeAg, Anti-HBe, and HBV DNA PCR is recommended.`,
    parameters: [
      {
        name: 'HBsAg ELISA',
        referenceRange: 'Non-Reactive (< 0.90)',
        unit: 'Units',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Non-Reactive (Negative)', isAbnormal: false },
          { value: 'Reactive (Positive)', isAbnormal: true },
          { value: 'Borderline / Equivocal', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HB,TLC,DLC',
    title: 'Hemoglobin, TLC & DLC (HB, TLC, DLC)',
    basePrice: 250,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: 'Same Day',
    description: 'Basic hematology profile evaluating Hemoglobin (Hb), Total Leukocyte Count (TLC), and 5-part Differential Leukocyte Count (DLC).',
    notes: `1. HEMOGLOBIN (Hb):
Hemoglobin is the major protein of erythrocytes that transports oxygen from the lungs to peripheral tissues. It is measured by spectrophotometry on automated instruments after lysis of red cells and conversion of all hemoglobin to cyanmethemoglobin.
• Increased in: Hemoconcentration (dehydration, burns, vomiting), Polycythemia (erythrocytosis), Extreme physical exercise.
• Decreased in: Macrocytic anemia (liver disease, hypothyroidism, vitamin B12/folate deficiency, myelodysplasia), Normocytic anemia (early iron deficiency, anemia of chronic disease, hemolytic anemia, acute hemorrhage, bone marrow infiltration), Microcytic anemia (iron deficiency, thalassemia), Hemodilution.
• Comments: Hypertriglyceridemia and marked leukocytosis can cause false elevations of Hb.

2. TOTAL LEUKOCYTE COUNT (TLC / WBC):
The WBC count determines the total number of circulating white blood cells.
• Increased in: Acute infections, inflammatory disorders, acute and chronic leukemias, myeloproliferative disorders, solid tumors (paraneoplastic), circulating lymphoma, tissue injury/necrosis, G-CSF stimulation, corticosteroids, allergies, stress, smoking.
• Decreased in: Infections, constitutional and acquired myeloid hypoplasia, myelosuppression (chemotherapy, radiation), myelodysplasia, collagen vascular diseases, hypersplenism, autoimmune neutropenia.

3. DIFFERENTIAL LEUCOCYTE COUNT (DLC):
• Neutrophils (40 - 80%): Increased in bacterial/viral infections, acute stress, inflammation, tissue necrosis, G-CSF, DKA, leukemia. Decreased in aplastic anemia, drug-induced neutropenia, chemotherapy, B12/folate deficiency, sepsis.
• Lymphocytes (20 - 40%): Increased in viral infections (infectious mononucleosis, pertussis), thyrotoxicosis, lymphoid leukemia/lymphoma. Decreased in immunodeficiency syndromes (HIV), immunosuppressive drugs.
• Monocytes (2 - 10%): Increased in inflammation, tuberculosis, malignancy, CMML. Decreased in overwhelming bacterial infection, hairy cell leukemia.
• Eosinophils (1 - 6%): Increased in allergic states, asthma, parasitic/fungal infections, Churg-Strauss, hypereosinophilic syndrome. Decreased in acute stress, overwhelming infection.
• Basophils (< 2%): Increased in hypersensitivity reactions, CML, myeloproliferative disorders, hypothyroidism.`,
    interpretation: `1. HEMOGLOBIN (Hb):
Hemoglobin is the major protein of erythrocytes that transports oxygen from the lungs to peripheral tissues. It is measured by spectrophotometry on automated instruments after lysis of red cells and conversion of all hemoglobin to cyanmethemoglobin.
• Increased in: Hemoconcentration (dehydration, burns, vomiting), Polycythemia (erythrocytosis), Extreme physical exercise.
• Decreased in: Macrocytic anemia (liver disease, hypothyroidism, vitamin B12/folate deficiency, myelodysplasia), Normocytic anemia (early iron deficiency, anemia of chronic disease, hemolytic anemia, acute hemorrhage, bone marrow infiltration), Microcytic anemia (iron deficiency, thalassemia), Hemodilution.
• Comments: Hypertriglyceridemia and marked leukocytosis can cause false elevations of Hb.

2. TOTAL LEUKOCYTE COUNT (TLC / WBC):
The WBC count determines the total number of circulating white blood cells.
• Increased in: Acute infections, inflammatory disorders, acute and chronic leukemias, myeloproliferative disorders, solid tumors (paraneoplastic), circulating lymphoma, tissue injury/necrosis, G-CSF stimulation, corticosteroids, allergies, stress, smoking.
• Decreased in: Infections, constitutional and acquired myeloid hypoplasia, myelosuppression (chemotherapy, radiation), myelodysplasia, collagen vascular diseases, hypersplenism, autoimmune neutropenia.

3. DIFFERENTIAL LEUCOCYTE COUNT (DLC):
• Neutrophils (40 - 80%): Increased in bacterial/viral infections, acute stress, inflammation, tissue necrosis, G-CSF, DKA, leukemia. Decreased in aplastic anemia, drug-induced neutropenia, chemotherapy, B12/folate deficiency, sepsis.
• Lymphocytes (20 - 40%): Increased in viral infections (infectious mononucleosis, pertussis), thyrotoxicosis, lymphoid leukemia/lymphoma. Decreased in immunodeficiency syndromes (HIV), immunosuppressive drugs.
• Monocytes (2 - 10%): Increased in inflammation, tuberculosis, malignancy, CMML. Decreased in overwhelming bacterial infection, hairy cell leukemia.
• Eosinophils (1 - 6%): Increased in allergic states, asthma, parasitic/fungal infections, Churg-Strauss, hypereosinophilic syndrome. Decreased in acute stress, overwhelming infection.
• Basophils (< 2%): Increased in hypersensitivity reactions, CML, myeloproliferative disorders, hypothyroidism.`,
    parameters: [
      {
        name: 'Hemoglobin',
        referenceRange: '13 - 17',
        unit: 'g/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Total Leukocyte Count',
        referenceRange: '4,800 - 10,800',
        unit: 'cumm',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Neutrophils',
        referenceRange: '40 - 80',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Lymphocytes',
        referenceRange: '20 - 40',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Eosinophils',
        referenceRange: '1 - 6',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Monocytes',
        referenceRange: '2 - 10',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Basophils',
        referenceRange: '< 2',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'ESR(Wintrobe)',
    title: 'Erythrocyte Sedimentation Rate (Wintrobe)',
    basePrice: 100,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA / Citrate)',
    turnaroundTime: 'Same Day',
    description: 'Measurement of the rate at which red blood cells sediment in a period of 1 hour by Wintrobe method to evaluate systemic inflammation.',
    notes: `Interpretation:

Raised ESR can be found in:
1. Connective tissue disorders (e.g., SLE, Rheumatoid Arthritis, Systemic Sclerosis)
2. Infections (e.g., Tuberculosis, acute hepatitis, bacterial infections)
3. Hematological disease (e.g., multiple myeloma, anemia of acute or chronic disease, alone or combined with iron deficiency anemia)
4. Malignancy (e.g., lymphoma, breast or colon cancer)
5. Pregnancy
6. Oral contraceptive pill users
7. Obesity can cause a moderately raised ESR

Low ESR is found in:
1. Heart failure
2. Cachexia
3. Polycythemia vera (PRV) or secondary conditions featuring abnormal blood cells (e.g., sickle cell anemia, hereditary spherocytosis, acanthocytosis)
4. Microcytosis
5. Hypofibrinogenemia (e.g., DIC)
6. Massive hepatic necrosis
7. High white cell count (extreme leukocytosis)
8. Treatment with steroids

NB: Very high (> 100 mm/hr) ESR is found in autoimmune disease, malignancy, acute post-trauma, and serious infection (e.g. TB, osteomyelitis). A false high ESR can occur if the ambient temperature is unusually high or if the tube is tilted.`,
    interpretation: `Interpretation:

Raised ESR can be found in:
1. Connective tissue disorders (e.g., SLE, Rheumatoid Arthritis, Systemic Sclerosis)
2. Infections (e.g., Tuberculosis, acute hepatitis, bacterial infections)
3. Hematological disease (e.g., multiple myeloma, anemia of acute or chronic disease, alone or combined with iron deficiency anemia)
4. Malignancy (e.g., lymphoma, breast or colon cancer)
5. Pregnancy
6. Oral contraceptive pill users
7. Obesity can cause a moderately raised ESR

Low ESR is found in:
1. Heart failure
2. Cachexia
3. Polycythemia vera (PRV) or secondary conditions featuring abnormal blood cells (e.g., sickle cell anemia, hereditary spherocytosis, acanthocytosis)
4. Microcytosis
5. Hypofibrinogenemia (e.g., DIC)
6. Massive hepatic necrosis
7. High white cell count (extreme leukocytosis)
8. Treatment with steroids

NB: Very high (> 100 mm/hr) ESR is found in autoimmune disease, malignancy, acute post-trauma, and serious infection (e.g. TB, osteomyelitis). A false high ESR can occur if the ambient temperature is unusually high or if the tube is tilted.`,
    parameters: [
      {
        name: 'Erythrocyte Sedimentation Rate (Wintrobe)',
        referenceRange: '0 - 9',
        unit: 'mm for 1st hour',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HCV RNA Quantitative',
    title: 'HCV RNA Quantitative (Real-Time PCR)',
    basePrice: 2800,
    taxPercentage: 0,
    sampleType: 'EDTA Plasma / Serum',
    turnaroundTime: '24 - 48 Hours',
    description: 'Quantitative measurement of Hepatitis C Viral RNA (viral load) using Real-Time Reverse Transcription Polymerase Chain Reaction (RT-PCR).',
    notes: `Methodology: Real-Time Reverse Transcription Polymerase Chain Reaction (RT-PCR).

Analytical Parameters:
• Limit of Detection (LOD): 15 IU/mL
• Linear Dynamic Range: 15 to 100,000,000 IU/mL (1.18 to 8.00 log10 IU/mL)

Clinical Interpretation:
1. Target Not Detected (< 15 IU/mL): HCV RNA is not detected in the specimen. Does not exclude infection below the detection limit.
2. Target Detected (< 15 IU/mL): HCV RNA is detected below the lower limit of quantification (LLoQ).
3. Target Detected (> 15 IU/mL): Active HCV viral replication confirmed with quantitative viral load in IU/mL.

Clinical Applications:
• Diagnosis of active Hepatitis C Virus (HCV) infection.
• Baseline viral load quantification prior to Direct-Acting Antiviral (DAA) therapy.
• Assessment of Sustained Virological Response (SVR12 / SVR24) post-treatment completion.`,
    interpretation: `Methodology: Real-Time Reverse Transcription Polymerase Chain Reaction (RT-PCR).

Analytical Parameters:
• Limit of Detection (LOD): 15 IU/mL
• Linear Dynamic Range: 15 to 100,000,000 IU/mL (1.18 to 8.00 log10 IU/mL)

Clinical Interpretation:
1. Target Not Detected (< 15 IU/mL): HCV RNA is not detected in the specimen. Does not exclude infection below the detection limit.
2. Target Detected (< 15 IU/mL): HCV RNA is detected below the lower limit of quantification (LLoQ).
3. Target Detected (> 15 IU/mL): Active HCV viral replication confirmed with quantitative viral load in IU/mL.

Clinical Applications:
• Diagnosis of active Hepatitis C Virus (HCV) infection.
• Baseline viral load quantification prior to Direct-Acting Antiviral (DAA) therapy.
• Assessment of Sustained Virological Response (SVR12 / SVR24) post-treatment completion.`,
    parameters: [
      {
        name: 'Sample Type',
        referenceRange: 'EDTA Plasma / Serum',
        unit: 'Units',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'EDTA Plasma', isAbnormal: false },
          { value: 'Serum', isAbnormal: false }
        ],
        status: 'Active'
      },
      {
        name: 'HCV RNA',
        referenceRange: 'Target Not Detected (< 15 IU/mL)',
        unit: 'IU/mL',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Target Not Detected (< 15 IU/mL)', isAbnormal: false },
          { value: 'Target Detected (< 15 IU/mL)', isAbnormal: true },
          { value: 'Detected (See Viral Load Value)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HDL Cholesterol',
    title: 'HDL Cholesterol',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Fasting 10-12 hrs)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative determination of High-Density Lipoprotein Cholesterol (HDL-C) in human serum to assess anti-atherogenic capacity and coronary heart disease risk.',
    notes: `Clinical Significance & Interpretation:
High-Density Lipoprotein (HDL) cholesterol, often referred to as "good cholesterol", plays a key role in reverse cholesterol transport by transporting excess cholesterol from peripheral tissues and vascular endothelium back to the liver for excretion in bile.

Reference Risk Stratification (NCEP ATP III / LAI Guidelines):
• < 40 mg/dl (Males) / < 50 mg/dl (Females): Low HDL-C (Major risk factor for Coronary Artery Disease / Atherosclerosis).
• 40 - 59 mg/dl: Moderate / Borderline level.
• ≥ 60 mg/dl: High HDL-C (Cardioprotective / Negative risk factor for heart disease).

Causes of Decreased HDL Cholesterol (< 40 mg/dl):
• Metabolic syndrome, Type 2 Diabetes Mellitus, insulin resistance.
• Sedentary lifestyle, obesity, cigarette smoking.
• High triglyceride levels (Hypertriglyceridemia).
• Drugs: Beta-blockers, anabolic steroids, progestins.
• Genetic dyslipidemias (Tangier disease, familial hypoalphalipoproteinemia).

Causes of Elevated HDL Cholesterol (> 80 mg/dl):
• Regular aerobic exercise, moderate alcohol intake, estrogen replacement therapy.
• Familial hyperalphalipoproteinemia, CETP gene mutations.`,
    interpretation: `Clinical Significance & Interpretation:
High-Density Lipoprotein (HDL) cholesterol, often referred to as "good cholesterol", plays a key role in reverse cholesterol transport by transporting excess cholesterol from peripheral tissues and vascular endothelium back to the liver for excretion in bile.

Reference Risk Stratification (NCEP ATP III / LAI Guidelines):
• < 40 mg/dl (Males) / < 50 mg/dl (Females): Low HDL-C (Major risk factor for Coronary Artery Disease / Atherosclerosis).
• 40 - 59 mg/dl: Moderate / Borderline level.
• ≥ 60 mg/dl: High HDL-C (Cardioprotective / Negative risk factor for heart disease).

Causes of Decreased HDL Cholesterol (< 40 mg/dl):
• Metabolic syndrome, Type 2 Diabetes Mellitus, insulin resistance.
• Sedentary lifestyle, obesity, cigarette smoking.
• High triglyceride levels (Hypertriglyceridemia).
• Drugs: Beta-blockers, anabolic steroids, progestins.
• Genetic dyslipidemias (Tangier disease, familial hypoalphalipoproteinemia).

Causes of Elevated HDL Cholesterol (> 80 mg/dl):
• Regular aerobic exercise, moderate alcohol intake, estrogen replacement therapy.
• Familial hyperalphalipoproteinemia, CETP gene mutations.`,
    parameters: [
      {
        name: 'HDL Cholesterol',
        referenceRange: '35 - 80',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HSV-1/2 IgM',
    title: 'Herpes Simplex Virus 1/2 IgM (HSV-1/2 IgM)',
    basePrice: 750,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: 'Same Day',
    description: 'Chemiluminescence Immunoassay (CLIA) / ELISA for the qualitative and semi-quantitative detection of IgM antibodies to Herpes Simplex Virus Types 1 and 2.',
    notes: `Interpretation Criteria (CLIA / ELISA):
• Negative (< 2.0 AU/mL): No detectable HSV-1/2 IgM antibodies. Indicates no evidence of recent primary HSV-1 or HSV-2 infection.
• Equivocal / Grey Zone (2.0 - 4.0 AU/mL): Borderline antibody level. Retesting in 1–2 weeks with a fresh serum sample is recommended.
• Positive (≥ 4.0 AU/mL): Detectable HSV-1/2 IgM antibodies. Suggests acute, recent primary infection or reactivation of Herpes Simplex Virus.

Clinical Utility:
Herpes Simplex Virus Type 1 (HSV-1) primarily causes orofacial herpes (cold sores) and gingivostomatitis, while HSV-2 primarily causes genital herpes. However, both strains can infect either site.

Diagnostic Considerations:
1. IgM antibodies appear within the first 1 to 2 weeks post-infection and may persist for several months.
2. Cross-reactivity between HSV-1 and HSV-2 IgM antibodies is common; type-specific IgG testing (Glycoprotein G-based HSV-1 IgG / HSV-2 IgG) or Real-Time PCR on vesicular lesions is recommended for definitive typing.`,
    interpretation: `Interpretation Criteria (CLIA / ELISA):
• Negative (< 2.0 AU/mL): No detectable HSV-1/2 IgM antibodies. Indicates no evidence of recent primary HSV-1 or HSV-2 infection.
• Equivocal / Grey Zone (2.0 - 4.0 AU/mL): Borderline antibody level. Retesting in 1–2 weeks with a fresh serum sample is recommended.
• Positive (≥ 4.0 AU/mL): Detectable HSV-1/2 IgM antibodies. Suggests acute, recent primary infection or reactivation of Herpes Simplex Virus.

Clinical Utility:
Herpes Simplex Virus Type 1 (HSV-1) primarily causes orofacial herpes (cold sores) and gingivostomatitis, while HSV-2 primarily causes genital herpes. However, both strains can infect either site.

Diagnostic Considerations:
1. IgM antibodies appear within the first 1 to 2 weeks post-infection and may persist for several months.
2. Cross-reactivity between HSV-1 and HSV-2 IgM antibodies is common; type-specific IgG testing (Glycoprotein G-based HSV-1 IgG / HSV-2 IgG) or Real-Time PCR on vesicular lesions is recommended for definitive typing.`,
    parameters: [
      {
        name: 'HSV-1/2 IgM',
        referenceRange: 'Neg. < 2 AU/mL\nGrey Zone 2 - 4 AU/mL\nPos. >= 4 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'HSV-2 IgG',
    title: 'Herpes Simplex Virus 2 IgG (HSV-2 IgG)',
    basePrice: 750,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma',
    turnaroundTime: 'Same Day',
    description: 'Type-specific Chemiluminescence Immunoassay (CLIA) / ELISA for the qualitative and semi-quantitative detection of IgG antibodies to Herpes Simplex Virus Type 2 (gG-2).',
    notes: `Interpretation Criteria (CLIA / ELISA):
• Negative (< 2.0 AU/mL): No detectable HSV-2 specific IgG antibodies. Indicates lack of prior exposure or infection with Herpes Simplex Virus Type 2.
• Equivocal / Grey Zone (2.0 - 4.0 AU/mL): Borderline antibody level. Retesting in 1–2 weeks with a fresh serum sample is recommended.
• Positive (≥ 4.0 AU/mL): Detectable HSV-2 IgG antibodies. Indicates prior exposure, past infection, or latent infection with Herpes Simplex Virus Type 2.

Clinical Significance:
HSV-2 is the primary cause of genital herpes infections and neonatal herpes (via perinatal transmission). Type-specific serologic assays utilize recombinant Glycoprotein G-2 (gG-2) to distinguish HSV-2 antibodies specifically from HSV-1 antibodies without antigenic cross-reactivity.

Diagnostic Notes:
1. Seroconversion: Specific IgG antibodies generally develop 2 to 12 weeks after primary infection and persist indefinitely.
2. Positive IgG confirms past or chronic/latent infection but does not determine the exact timing of acquisition or active shedding.`,
    interpretation: `Interpretation Criteria (CLIA / ELISA):
• Negative (< 2.0 AU/mL): No detectable HSV-2 specific IgG antibodies. Indicates lack of prior exposure or infection with Herpes Simplex Virus Type 2.
• Equivocal / Grey Zone (2.0 - 4.0 AU/mL): Borderline antibody level. Retesting in 1–2 weeks with a fresh serum sample is recommended.
• Positive (≥ 4.0 AU/mL): Detectable HSV-2 IgG antibodies. Indicates prior exposure, past infection, or latent infection with Herpes Simplex Virus Type 2.

Clinical Significance:
HSV-2 is the primary cause of genital herpes infections and neonatal herpes (via perinatal transmission). Type-specific serologic assays utilize recombinant Glycoprotein G-2 (gG-2) to distinguish HSV-2 antibodies specifically from HSV-1 antibodies without antigenic cross-reactivity.

Diagnostic Notes:
1. Seroconversion: Specific IgG antibodies generally develop 2 to 12 weeks after primary infection and persist indefinitely.
2. Positive IgG confirms past or chronic/latent infection but does not determine the exact timing of acquisition or active shedding.`,
    parameters: [
      {
        name: 'HSV-2 IgG',
        referenceRange: '< 2.0 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Dialysis Package',
    title: 'Dialysis Package / Profile',
    basePrice: 1200,
    taxPercentage: 0,
    sampleType: 'Blood Serum & Whole Blood (EDTA)',
    turnaroundTime: 'Same Day',
    description: 'Comprehensive multi-parameter dialysis monitoring panel assessing renal function, small solute clearance, fluid-electrolyte balance, acid-base status, mineral metabolism (CKD-MBD), nutritional protein markers, and hematocrit.',
    notes: `Clinical Significance & Dialysis Adequacy Guidelines (KDOQI / KDIGO):

1. Dialysis Adequacy & Clearance:
• Urea Reduction Ratio (URR): Target ≥ 65% per hemodialysis session (equivalent to single-pool Kt/V ≥ 1.2 for thrice-weekly HD). Inadequate clearance is associated with increased uremic toxicity, morbidity, and hospitalizations.
• Serum Creatinine: Reflects residual kidney function, lean muscle mass, and dietary protein intake in ESRD patients.

2. Fluid & Electrolyte Homeostasis:
• Potassium (K+): Predialysis target 4.0 – 5.5 mEq/L. Hyperkalemia (> 6.0 mEq/L) carries high risk for life-threatening cardiac arrhythmias; postdialysis hypokalemia (< 3.5 mEq/L) must also be avoided.
• Sodium (Na+) & Chloride: Interdialytic sodium and fluid overload contribute to hypertension and intradialytic hypotension/pulmonary congestion.
• Bicarbonate (HCO3-): Predialysis target ≥ 22 mEq/L. Chronic metabolic acidosis exacerbates muscle wasting, protein catabolism, and bone resorption.

3. Chronic Kidney Disease - Mineral and Bone Disorder (CKD-MBD):
• Phosphorus: Target 3.5 – 5.5 mg/dl in ESRD. Hyperphosphatemia drives vascular calcification, secondary hyperparathyroidism, and cardiovascular mortality.
• Calcium: Corrected calcium target 8.4 – 9.5 mg/dl to prevent calcium-phosphorus precipitation (Ca x P < 55 mg²/dl²).

4. Nutritional Status & Anemia Management:
• Serum Albumin: Target ≥ 4.0 g/dl. Serum albumin is a powerful prognostic marker of protein-energy wasting (PEW) and systemic inflammation in dialysis cohorts.
• Hemoglobin (Hb): Target 10.0 – 11.5 g/dl for patients receiving Erythropoiesis-Stimulating Agents (ESAs) and iron supplementation. Avoid Hb > 13.0 g/dl due to increased thrombotic/stroke risks.`,
    interpretation: `Clinical Significance & Dialysis Adequacy Guidelines (KDOQI / KDIGO):

1. Dialysis Adequacy & Clearance:
• Urea Reduction Ratio (URR): Target ≥ 65% per hemodialysis session (equivalent to single-pool Kt/V ≥ 1.2 for thrice-weekly HD). Inadequate clearance is associated with increased uremic toxicity, morbidity, and hospitalizations.
• Serum Creatinine: Reflects residual kidney function, lean muscle mass, and dietary protein intake in ESRD patients.

2. Fluid & Electrolyte Homeostasis:
• Potassium (K+): Predialysis target 4.0 – 5.5 mEq/L. Hyperkalemia (> 6.0 mEq/L) carries high risk for life-threatening cardiac arrhythmias; postdialysis hypokalemia (< 3.5 mEq/L) must also be avoided.
• Sodium (Na+) & Chloride: Interdialytic sodium and fluid overload contribute to hypertension and intradialytic hypotension/pulmonary congestion.
• Bicarbonate (HCO3-): Predialysis target ≥ 22 mEq/L. Chronic metabolic acidosis exacerbates muscle wasting, protein catabolism, and bone resorption.

3. Chronic Kidney Disease - Mineral and Bone Disorder (CKD-MBD):
• Phosphorus: Target 3.5 – 5.5 mg/dl in ESRD. Hyperphosphatemia drives vascular calcification, secondary hyperparathyroidism, and cardiovascular mortality.
• Calcium: Corrected calcium target 8.4 – 9.5 mg/dl to prevent calcium-phosphorus precipitation (Ca x P < 55 mg²/dl²).

4. Nutritional Status & Anemia Management:
• Serum Albumin: Target ≥ 4.0 g/dl. Serum albumin is a powerful prognostic marker of protein-energy wasting (PEW) and systemic inflammation in dialysis cohorts.
• Hemoglobin (Hb): Target 10.0 – 11.5 g/dl for patients receiving Erythropoiesis-Stimulating Agents (ESAs) and iron supplementation. Avoid Hb > 13.0 g/dl due to increased thrombotic/stroke risks.`,
    parameters: [
      {
        name: 'Urea (Pre-Dialysis)',
        referenceRange: '15 - 40',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Creatinine (Pre-Dialysis)',
        referenceRange: '0.6 - 1.2',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Sodium (Na+)',
        referenceRange: '135 - 145',
        unit: 'mEq/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Potassium (K+)',
        referenceRange: '3.5 - 5.1',
        unit: 'mEq/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Chloride (Cl-)',
        referenceRange: '96 - 106',
        unit: 'mEq/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Bicarbonate (HCO3-)',
        referenceRange: '22 - 29',
        unit: 'mEq/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Calcium',
        referenceRange: '8.8 - 10.2',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Phosphorus',
        referenceRange: '2.5 - 4.5',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Total Protein',
        referenceRange: '6.4 - 8.3',
        unit: 'g/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Albumin',
        referenceRange: '3.5 - 5.0',
        unit: 'g/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Globulin',
        referenceRange: '2.0 - 3.5',
        unit: 'g/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'A / G Ratio',
        referenceRange: '1.2 - 2.0',
        unit: '',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Hemoglobin (Hb)',
        referenceRange: '11.0 - 16.0',
        unit: 'g/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Urea Reduction Ratio (URR)',
        referenceRange: '> 65',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Electrolytes Panel',
    title: 'Electrolytes Panel (Serum Na, K, Cl, Ca, iCa)',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Heparinized Plasma',
    turnaroundTime: 'Same Day',
    description: 'Comprehensive electrolyte profile determining Serum Sodium, Potassium, Chloride, Total Calcium, and Ionized Calcium (iCalcium) for fluid, electrolyte, and acid-base assessment.',
    notes: `Clinical Significance:
Electrolytes are essential minerals present in body fluids that carry an electric charge and regulate nerve/muscle function, acid-base equilibrium, hydration, and cellular osmotic pressure.

1. Serum Sodium (Na+):
• Major extracellular cation maintaining plasma osmolality and extracellular volume.
• Hyponatremia (< 136 mmol/L): SIADH, congestive heart failure, cirrhosis, nephrotic syndrome, diuretic therapy, vomiting, diarrhea, adrenal insufficiency.
• Hypernatremia (> 146 mmol/L): Dehydration, diabetes insipidus, excessive salt intake, osmotic diuresis.

2. Serum Potassium (K+):
• Major intracellular cation critical for cardiac neuromuscular excitability and rhythm.
• Hypokalemia (< 3.5 mmol/L): Diuretics, vomiting, diarrhea, hyperaldosteronism, alkalosis.
• Hyperkalemia (> 5.1 mmol/L): Acute/chronic renal failure, potassium-sparing diuretics, ACE inhibitors/ARBs, Addison's disease, severe tissue trauma/rhabdomyolysis, metabolic acidosis.

3. Serum Chloride (Cl-):
• Major extracellular anion involved in maintaining acid-base balance and electroneutrality.
• Alterations frequently parallel sodium abnormalities and acid-base disturbances (anion gap calculation).

4. Serum Total & Ionized Calcium (Ca2+ / iCalcium):
• Ionized Calcium (iCalcium) is the physiologically active, unbound fraction of serum calcium essential for cardiac contractility, neuromuscular transmission, enzyme activation, and blood coagulation.
• Hypocalcemia / Low iCalcium: Hypoparathyroidism, vitamin D deficiency, renal failure, acute pancreatitis, critical illness/sepsis, alkalosis.
• Hypercalcemia / Elevated iCalcium: Primary hyperparathyroidism, malignancies (osteolytic metastases, PTHrP production), granulomatous diseases (sarcoidosis, TB), hypervitaminosis D.`,
    interpretation: `Clinical Significance:
Electrolytes are essential minerals present in body fluids that carry an electric charge and regulate nerve/muscle function, acid-base equilibrium, hydration, and cellular osmotic pressure.

1. Serum Sodium (Na+):
• Major extracellular cation maintaining plasma osmolality and extracellular volume.
• Hyponatremia (< 136 mmol/L): SIADH, congestive heart failure, cirrhosis, nephrotic syndrome, diuretic therapy, vomiting, diarrhea, adrenal insufficiency.
• Hypernatremia (> 146 mmol/L): Dehydration, diabetes insipidus, excessive salt intake, osmotic diuresis.

2. Serum Potassium (K+):
• Major intracellular cation critical for cardiac neuromuscular excitability and rhythm.
• Hypokalemia (< 3.5 mmol/L): Diuretics, vomiting, diarrhea, hyperaldosteronism, alkalosis.
• Hyperkalemia (> 5.1 mmol/L): Acute/chronic renal failure, potassium-sparing diuretics, ACE inhibitors/ARBs, Addison's disease, severe tissue trauma/rhabdomyolysis, metabolic acidosis.

3. Serum Chloride (Cl-):
• Major extracellular anion involved in maintaining acid-base balance and electroneutrality.
• Alterations frequently parallel sodium abnormalities and acid-base disturbances (anion gap calculation).

4. Serum Total & Ionized Calcium (Ca2+ / iCalcium):
• Ionized Calcium (iCalcium) is the physiologically active, unbound fraction of serum calcium essential for cardiac contractility, neuromuscular transmission, enzyme activation, and blood coagulation.
• Hypocalcemia / Low iCalcium: Hypoparathyroidism, vitamin D deficiency, renal failure, acute pancreatitis, critical illness/sepsis, alkalosis.
• Hypercalcemia / Elevated iCalcium: Primary hyperparathyroidism, malignancies (osteolytic metastases, PTHrP production), granulomatous diseases (sarcoidosis, TB), hypervitaminosis D.`,
    parameters: [
      {
        name: 'Serum Sodium',
        referenceRange: '136 - 146',
        unit: 'mmol/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Potassium',
        referenceRange: '3.5 - 5.1',
        unit: 'mmol/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Chloride',
        referenceRange: '98 - 107',
        unit: 'mmol/l',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Calcium',
        referenceRange: '8.8 - 10.6',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'iCalcium',
        referenceRange: '1.13 - 1.33',
        unit: 'mmol/l',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'ESR(Westergren)',
    title: 'Erythrocyte sedimentation rate (Westergren)',
    basePrice: 100,
    taxPercentage: 0,
    sampleType: 'Whole Blood (Sodium Citrate / EDTA)',
    turnaroundTime: 'Same Day',
    description: 'Gold-standard measurement of Erythrocyte Sedimentation Rate by the International Council for Standardization in Haematology (ICSH) Westergren method for assessing acute phase response and systemic inflammation.',
    notes: `Interpretation:

Raised ESR can be found in:
1. Connective tissue disorders (e.g., SLE, Rheumatoid Arthritis, Systemic Sclerosis)
2. Infections (e.g., Tuberculosis, acute hepatitis, bacterial infections)
3. Hematological disease (e.g., multiple myeloma, anemia of acute or chronic disease, alone or combined with iron deficiency anemia)
4. Malignancy (e.g., lymphoma, breast or colon cancer)
5. Pregnancy
6. Oral contraceptive pill users
7. Obesity can cause a moderately raised ESR

Low ESR is found in:
1. Heart failure
2. Cachexia
3. Polycythemia vera (PRV) or secondary conditions featuring abnormal blood cells (e.g., sickle cell anemia, hereditary spherocytosis, acanthocytosis)
4. Microcytosis
5. Hypofibrinogenemia (e.g., DIC)
6. Massive hepatic necrosis
7. High white cell count (extreme leukocytosis)
8. Treatment with steroids

NB: Very high (> 100 mm/1st hour) ESR is found in autoimmune disease, malignancy, acute post-trauma, and serious infection (e.g. TB, osteomyelitis, temporal arteritis). A false high ESR can occur if the ambient temperature is unusually high or if the sedimentation tube is not strictly vertical.`,
    interpretation: `Interpretation:

Raised ESR can be found in:
1. Connective tissue disorders (e.g., SLE, Rheumatoid Arthritis, Systemic Sclerosis)
2. Infections (e.g., Tuberculosis, acute hepatitis, bacterial infections)
3. Hematological disease (e.g., multiple myeloma, anemia of acute or chronic disease, alone or combined with iron deficiency anemia)
4. Malignancy (e.g., lymphoma, breast or colon cancer)
5. Pregnancy
6. Oral contraceptive pill users
7. Obesity can cause a moderately raised ESR

Low ESR is found in:
1. Heart failure
2. Cachexia
3. Polycythemia vera (PRV) or secondary conditions featuring abnormal blood cells (e.g., sickle cell anemia, hereditary spherocytosis, acanthocytosis)
4. Microcytosis
5. Hypofibrinogenemia (e.g., DIC)
6. Massive hepatic necrosis
7. High white cell count (extreme leukocytosis)
8. Treatment with steroids

NB: Very high (> 100 mm/1st hour) ESR is found in autoimmune disease, malignancy, acute post-trauma, and serious infection (e.g. TB, osteomyelitis, temporal arteritis). A false high ESR can occur if the ambient temperature is unusually high or if the sedimentation tube is not strictly vertical.`,
    parameters: [
      {
        name: 'Erythrocyte sedimentation rate (Westergren)',
        referenceRange: '0 - 10',
        unit: 'mm for 1st hour',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Fluid Examination',
    title: 'Fluid Examination (Physical, Chemical & Microscopic)',
    basePrice: 500,
    taxPercentage: 0,
    sampleType: 'Body Fluid (Pleural / Ascitic / Synovial / Pericardial / CSF)',
    turnaroundTime: 'Same Day',
    description: 'Comprehensive physical, chemical, and microscopic examination of serous body fluids (Pleural, Ascitic, Peritoneal, Synovial, Pericardial) for transudate vs. exudate differentiation, infection, and cellularity.',
    notes: `Clinical Significance & Interpretation:
Body fluid examination (Ascitic, Pleural, Peritoneal, Pericardial, Synovial) is crucial for differentiating transudative effusions from exudative effusions.

1. Transudate vs. Exudate Differentiation (Light's Criteria):
• Transudative Fluid: Non-inflammatory effusion caused by hydrostatic pressure imbalance or decreased plasma oncotic pressure (e.g., Congestive Heart Failure, Cirrhosis, Nephrotic Syndrome, Malnutrition).
  - Appearance: Clear, straw-colored, no coagulum.
  - Protein: < 3.0 g/dl (< 3000 mg%), Fluid/Serum Protein ratio < 0.5.
  - Glucose: Equivalent to serum glucose (> 60 mg%).
  - Total Leukocyte Count (TLC): < 1,000 cells/cumm with predominantly mononuclear / lymphocytes.
  - Specific Gravity: < 1.015.

• Exudative Fluid: Inflammatory or malignant effusion caused by increased vascular permeability or impaired lymphatic drainage (e.g., Bacterial Pneumonia/Parapneumonic, Tuberculosis, Malignancy, Pulmonary Embolism, Pancreatitis).
  - Appearance: Turbid, cloudy, hemorrhagic, or purulent; may form spontaneous fibrinous coagulum.
  - Protein: ≥ 3.0 g/dl (≥ 3000 mg%), Fluid/Serum Protein ratio > 0.5.
  - Glucose: Often decreased (< 60 mg%), especially in bacterial empyema, TB, or rheumatoid effusion.
  - Total Leukocyte Count (TLC): ≥ 1,000 cells/cumm (often > 10,000 in acute bacterial infection).
  - Differential: Neutrophil predominance (> 50%) indicates acute bacterial infection; Lymphocyte predominance (> 50%) suggests Tuberculosis, chronic inflammation, or malignancy.

2. Diagnostic Notes:
• Hemorrhagic fluid: May indicate malignancy, pulmonary infarction, trauma, or traumatic tap.
• Presence of atypical cells requires cytopathological examination (cell block / Papanicolaou staining).`,
    interpretation: `Clinical Significance & Interpretation:
Body fluid examination (Ascitic, Pleural, Peritoneal, Pericardial, Synovial) is crucial for differentiating transudative effusions from exudative effusions.

1. Transudate vs. Exudate Differentiation (Light's Criteria):
• Transudative Fluid: Non-inflammatory effusion caused by hydrostatic pressure imbalance or decreased plasma oncotic pressure (e.g., Congestive Heart Failure, Cirrhosis, Nephrotic Syndrome, Malnutrition).
  - Appearance: Clear, straw-colored, no coagulum.
  - Protein: < 3.0 g/dl (< 3000 mg%), Fluid/Serum Protein ratio < 0.5.
  - Glucose: Equivalent to serum glucose (> 60 mg%).
  - Total Leukocyte Count (TLC): < 1,000 cells/cumm with predominantly mononuclear / lymphocytes.
  - Specific Gravity: < 1.015.

• Exudative Fluid: Inflammatory or malignant effusion caused by increased vascular permeability or impaired lymphatic drainage (e.g., Bacterial Pneumonia/Parapneumonic, Tuberculosis, Malignancy, Pulmonary Embolism, Pancreatitis).
  - Appearance: Turbid, cloudy, hemorrhagic, or purulent; may form spontaneous fibrinous coagulum.
  - Protein: ≥ 3.0 g/dl (≥ 3000 mg%), Fluid/Serum Protein ratio > 0.5.
  - Glucose: Often decreased (< 60 mg%), especially in bacterial empyema, TB, or rheumatoid effusion.
  - Total Leukocyte Count (TLC): ≥ 1,000 cells/cumm (often > 10,000 in acute bacterial infection).
  - Differential: Neutrophil predominance (> 50%) indicates acute bacterial infection; Lymphocyte predominance (> 50%) suggests Tuberculosis, chronic inflammation, or malignancy.

2. Diagnostic Notes:
• Hemorrhagic fluid: May indicate malignancy, pulmonary infarction, trauma, or traumatic tap.
• Presence of atypical cells requires cytopathological examination (cell block / Papanicolaou staining).`,
    parameters: [
      {
        name: 'Sample Type',
        referenceRange: 'Pleural / Ascitic / Synovial / Pericardial / CSF',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Pleural Fluid', isAbnormal: false },
          { value: 'Ascitic / Peritoneal Fluid', isAbnormal: false },
          { value: 'Synovial Fluid', isAbnormal: false },
          { value: 'Pericardial Fluid', isAbnormal: false },
          { value: 'Cerebrospinal Fluid (CSF)', isAbnormal: false },
          { value: 'Cystic Fluid', isAbnormal: false }
        ],
        status: 'Active'
      },
      {
        name: 'Coagulum',
        referenceRange: 'Absent',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Absent / No Clot Formed', isAbnormal: false },
          { value: 'Present (Cobweb / Fibrinous Coagulum)', isAbnormal: true },
          { value: 'Fine Coagulum', isAbnormal: true },
          { value: 'Gross Clot Formed', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Volume',
        referenceRange: '',
        unit: 'ml',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Appearance',
        referenceRange: 'Clear',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Clear / Transparent', isAbnormal: false },
          { value: 'Slightly Hazy / Opalescent', isAbnormal: true },
          { value: 'Turbid / Cloudy', isAbnormal: true },
          { value: 'Purulent', isAbnormal: true },
          { value: 'Hemorrhagic / Sanguinous', isAbnormal: true },
          { value: 'Milky / Chylous', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Colour',
        referenceRange: 'Pale Yellow',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Pale Yellow / Straw', isAbnormal: false },
          { value: 'Yellow', isAbnormal: false },
          { value: 'Amber', isAbnormal: false },
          { value: 'Reddish / Hemorrhagic', isAbnormal: true },
          { value: 'Brownish / Dark', isAbnormal: true },
          { value: 'Turbid White', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'pH (Reaction)',
        referenceRange: '7.35 - 7.45',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Alkaline (7.35 - 7.45)', isAbnormal: false },
          { value: 'Acidic (< 7.30)', isAbnormal: true },
          { value: 'Neutral (7.0 - 7.3)', isAbnormal: false }
        ],
        status: 'Active'
      },
      {
        name: 'Protein',
        referenceRange: 'Transudate < 3000 mg% | Exudate >= 3000 mg%',
        unit: 'mg%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Glucose',
        referenceRange: '60 - 100',
        unit: 'mg%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Total Leukocyte Count',
        referenceRange: 'Transudate < 1000 cumm | Exudate >= 1000 cumm',
        unit: 'cumm',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Neutrophils',
        referenceRange: '< 50',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Lymphocyte',
        referenceRange: '> 50',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'RBCs',
        referenceRange: 'Nil / Occasional',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Nil / Absent', isAbnormal: false },
          { value: 'Occasional (0 - 5 / HPF)', isAbnormal: false },
          { value: 'Plenty / Numerous', isAbnormal: true },
          { value: 'Heavily Hemorrhagic', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Others (Optional)',
        referenceRange: 'Nil',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'No atypical or malignant cells seen', isAbnormal: false },
          { value: 'Mesothelial cells present', isAbnormal: false },
          { value: 'Atypical / Malignant cells noted (Advise Cytology / Cell Block)', isAbnormal: true },
          { value: 'Gram stain / AFB negative', isAbnormal: false }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'FNAC',
    title: 'FNAC (Fine Needle Aspiration)',
    basePrice: 850,
    taxPercentage: 0,
    sampleType: 'Aspirate Smear (Fine Needle Aspiration Cytology)',
    turnaroundTime: '24 - 48 Hours',
    description: 'Cytopathological evaluation of fine needle aspirates from palpable and non-palpable lesions (Thyroid, Breast, Lymph nodes, Salivary glands, Soft tissue) to diagnose benign, inflammatory, and malignant pathologies.',
    notes: `FNAC Reporting Protocol & Cytological Guidelines:

1. Specimen Adequacy Criteria:
• Adequate / Satisfactory for evaluation: Presence of sufficient diagnostic cellular material with well-preserved cytomorphological details.
• Unsatisfactory / Inadequate: Scanty cellularity, excessive blood/crush artifact, or drying artifacts precluding definitive cytological evaluation (repeat aspiration recommended).

2. General Diagnostic Categorization:
• Category I (Unsatisfactory / Non-diagnostic): Insufficient diagnostic cells.
• Category II (Benign / Negative for Malignancy): Inflammatory, reactive, hyperplastic, or typical benign cytological features.
• Category III (Atypia of Undetermined Significance / AUS): Cytological atypia insufficient to diagnose neoplasm or malignancy.
• Category IV (Suspicious for Neoplasm / Follicular Neoplasm): Cellular features suggestive of neoplasm.
• Category V (Suspicious for Malignancy): Marked cellular and nuclear atypia strongly suggestive of malignancy.
• Category VI (Malignant / Positive for Malignancy): Definitive cytological criteria of carcinoma, lymphoma, melanoma, or sarcoma.

3. Clinical & Histopathological Correlation:
FNAC is a rapid and highly accurate screening/diagnostic cytological modality. Histopathological examination (core needle biopsy or surgical excision) is recommended for definitive histological typing, grading, surgical margin assessment, and immunohistochemistry (IHC) profiling.`,
    interpretation: `FNAC Reporting Protocol & Cytological Guidelines:

1. Specimen Adequacy Criteria:
• Adequate / Satisfactory for evaluation: Presence of sufficient diagnostic cellular material with well-preserved cytomorphological details.
• Unsatisfactory / Inadequate: Scanty cellularity, excessive blood/crush artifact, or drying artifacts precluding definitive cytological evaluation (repeat aspiration recommended).

2. General Diagnostic Categorization:
• Category I (Unsatisfactory / Non-diagnostic): Insufficient diagnostic cells.
• Category II (Benign / Negative for Malignancy): Inflammatory, reactive, hyperplastic, or typical benign cytological features.
• Category III (Atypia of Undetermined Significance / AUS): Cytological atypia insufficient to diagnose neoplasm or malignancy.
• Category IV (Suspicious for Neoplasm / Follicular Neoplasm): Cellular features suggestive of neoplasm.
• Category V (Suspicious for Malignancy): Marked cellular and nuclear atypia strongly suggestive of malignancy.
• Category VI (Malignant / Positive for Malignancy): Definitive cytological criteria of carcinoma, lymphoma, melanoma, or sarcoma.

3. Clinical & Histopathological Correlation:
FNAC is a rapid and highly accurate screening/diagnostic cytological modality. Histopathological examination (core needle biopsy or surgical excision) is recommended for definitive histological typing, grading, surgical margin assessment, and immunohistochemistry (IHC) profiling.`,
    parameters: [
      {
        name: 'SPECIMEN',
        referenceRange: 'As indicated',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'FNAC - Thyroid Gland', isAbnormal: false },
          { value: 'FNAC - Breast Lump / Mass', isAbnormal: false },
          { value: 'FNAC - Lymph Node (Cervical / Axillary / Inguinal)', isAbnormal: false },
          { value: 'FNAC - Salivary Gland (Parotid / Submandibular)', isAbnormal: false },
          { value: 'FNAC - Soft Tissue Swelling / Subcutaneous Nodule', isAbnormal: false },
          { value: 'FNAC - Testicular / Epididymal Swelling', isAbnormal: false }
        ],
        status: 'Active'
      },
      {
        name: 'MICROSCOPIC EXAMINATION',
        referenceRange: 'Descriptive cytomorphological evaluation',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'IMPRESSION',
        referenceRange: 'Cytological Impression',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Category II: Negative for Malignant Cells (Benign Cytology)', isAbnormal: false },
          { value: 'Category I: Unsatisfactory / Inadequate Smear (Scanty Cellularity)', isAbnormal: true },
          { value: 'Category III: Atypia of Undetermined Significance (AUS)', isAbnormal: true },
          { value: 'Category IV: Follicular Neoplasm / Suspicious for Neoplasm', isAbnormal: true },
          { value: 'Category V: Suspicious for Malignancy', isAbnormal: true },
          { value: 'Category VI: Malignant (Positive for Malignancy)', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'NOTE',
        referenceRange: 'Histopathological correlation advised',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Histopathological examination & tissue biopsy is advised for definitive histological grading and staging.', isAbnormal: false },
          { value: 'Repeat aspiration under ultrasound guidance or core needle biopsy recommended if clinical suspicion persists.', isAbnormal: false },
          { value: 'Clinical and radiological (USG/Mammography/CT) correlation recommended.', isAbnormal: false }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Direct Coombs Test',
    title: "Direct Coomb's Test (DAT - Direct Antiglobulin Test)",
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA / Heparin / Clotted Cord Blood)',
    turnaroundTime: 'Same Day',
    description: 'Hemagglutination assay (Direct Antiglobulin Test / DAT) to detect in vivo sensitization of erythrocytes with antibodies (IgG) and/or complement components (C3d).',
    notes: `Clinical Significance & Interpretation:
The Direct Antiglobulin Test (DAT / Direct Coombs Test) detects in vivo coating of red blood cells with immunoglobulins (IgG) and/or complement components (C3d).

1. Negative Result:
• Indicates the absence of detectable cell-bound IgG antibodies or complement on the patient's red blood cells.

2. Positive Result (Graded 1+ to 4+):
A positive DAT indicates in vivo sensitization of erythrocytes and is observed in:
• Autoimmune Hemolytic Anemia (AIHA):
  - Warm Antibody AIHA (predominantly IgG ± C3d, often idiopathic, SLE, CLL, lymphoma)
  - Cold Agglutinin Disease / Cold AIHA (predominantly C3d, Mycoplasma pneumoniae, EBV, lymphoproliferative disorders)
  - Paroxysmal Cold Hemoglobinuria (PCH / Donath-Landsteiner antibody)
• Hemolytic Disease of the Fetus and Newborn (HDFN):
  - Maternal IgG antibodies (Anti-D, Anti-c, Anti-Kell, ABO incompatibility) crossing placenta and coating fetal RBCs.
• Immune-Mediated Hemolytic Transfusion Reactions (Acute or Delayed):
  - Recipient antibodies coating transfused incompatible donor RBCs.
• Drug-Induced Immune Hemolytic Anemia (DIIHA):
  - Drugs such as Cephalosporins (Ceftriaxone), Penicillins, Methyldopa, Quinidine, NSAIDs acting via drug-adsorption, immune complex, or autoantibody mechanisms.

Diagnostic Notes:
1. A positive DAT must always be interpreted in conjunction with clinical findings, reticulocyte count, serum LDH, indirect bilirubin, and serum haptoglobin levels.
2. In cases of a positive polyspecific DAT, monospecific anti-IgG and anti-C3d testing with eluate evaluation is recommended.`,
    interpretation: `Clinical Significance & Interpretation:
The Direct Antiglobulin Test (DAT / Direct Coombs Test) detects in vivo coating of red blood cells with immunoglobulins (IgG) and/or complement components (C3d).

1. Negative Result:
• Indicates the absence of detectable cell-bound IgG antibodies or complement on the patient's red blood cells.

2. Positive Result (Graded 1+ to 4+):
A positive DAT indicates in vivo sensitization of erythrocytes and is observed in:
• Autoimmune Hemolytic Anemia (AIHA):
  - Warm Antibody AIHA (predominantly IgG ± C3d, often idiopathic, SLE, CLL, lymphoma)
  - Cold Agglutinin Disease / Cold AIHA (predominantly C3d, Mycoplasma pneumoniae, EBV, lymphoproliferative disorders)
  - Paroxysmal Cold Hemoglobinuria (PCH / Donath-Landsteiner antibody)
• Hemolytic Disease of the Fetus and Newborn (HDFN):
  - Maternal IgG antibodies (Anti-D, Anti-c, Anti-Kell, ABO incompatibility) crossing placenta and coating fetal RBCs.
• Immune-Mediated Hemolytic Transfusion Reactions (Acute or Delayed):
  - Recipient antibodies coating transfused incompatible donor RBCs.
• Drug-Induced Immune Hemolytic Anemia (DIIHA):
  - Drugs such as Cephalosporins (Ceftriaxone), Penicillins, Methyldopa, Quinidine, NSAIDs acting via drug-adsorption, immune complex, or autoantibody mechanisms.

Diagnostic Notes:
1. A positive DAT must always be interpreted in conjunction with clinical findings, reticulocyte count, serum LDH, indirect bilirubin, and serum haptoglobin levels.
2. In cases of a positive polyspecific DAT, monospecific anti-IgG and anti-C3d testing with eluate evaluation is recommended.`,
    parameters: [
      {
        name: "Direct Coomb's Test",
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [
          { value: 'Negative (No Agglutination)', isAbnormal: false },
          { value: 'Positive 1+ (Weak Agglutination)', isAbnormal: true },
          { value: 'Positive 2+ (Moderate Agglutination)', isAbnormal: true },
          { value: 'Positive 3+ (Strong Agglutination)', isAbnormal: true },
          { value: 'Positive 4+ (Solid Agglutination Clump)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'DLC 3 Parts',
    title: 'Differential Leucocyte Count, 3-Part (DLC 3 Parts)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: 'Same Day',
    description: 'Automated 3-part differential leukocyte count measuring absolute numbers and relative percentages of Granulocytes, Lymphocytes, and Mid-sized cells (Monocytes, Eosinophils, Basophils).',
    notes: `Clinical Significance of 3-Part Differential:
Automated 3-part hematology analyzers classify circulating leukocytes into three distinct volumetric cell clusters:

1. Granulocytes (Gran # / Gran %):
• Primarily comprises segmented neutrophils, band forms, eosinophils, and basophils.
• Granulocytosis (Elevated Gran # / Gran %): Acute bacterial infections, systemic inflammation, tissue necrosis, metabolic intoxications (uremia, DKA), acute hemorrhage, corticosteroid therapy, myeloproliferative disorders.
• Granulocytopenia (Decreased Gran # / Gran %): Bone marrow suppression (chemotherapy, radiation), severe overwhelming sepsis, aplastic anemia, drug-induced agranulocytosis.

2. Lymphocytes (Lym # / Lym %):
• Represents circulating T-cells, B-cells, and natural killer (NK) cells.
• Lymphocytosis (Elevated Lym # / Lym %): Acute viral infections (infectious mononucleosis, CMV, viral hepatitis), pertussis, chronic lymphocytic leukemia (CLL), autoimmune conditions.
• Lymphopenia (Decreased Lym # / Lym %): Acute stress, advanced HIV/AIDS, immunosuppressive therapy, systemic lupus erythematosus (SLE), radiation exposure.

3. Mid-Sized Cells (Mid # / Mid % - Monocytes, Eosinophils & Basophils):
• Encompasses monocytes, eosinophils, basophils, and precursor cells of intermediate size.
• Elevated Mid-Cell Fraction: Chronic inflammatory conditions, tuberculosis, allergic reactions/asthma, parasitic infestations, convalescent stage of acute infections, myelomonocytic neoplasms (CMML).`,
    interpretation: `Clinical Significance of 3-Part Differential:
Automated 3-part hematology analyzers classify circulating leukocytes into three distinct volumetric cell clusters:

1. Granulocytes (Gran # / Gran %):
• Primarily comprises segmented neutrophils, band forms, eosinophils, and basophils.
• Granulocytosis (Elevated Gran # / Gran %): Acute bacterial infections, systemic inflammation, tissue necrosis, metabolic intoxications (uremia, DKA), acute hemorrhage, corticosteroid therapy, myeloproliferative disorders.
• Granulocytopenia (Decreased Gran # / Gran %): Bone marrow suppression (chemotherapy, radiation), severe overwhelming sepsis, aplastic anemia, drug-induced agranulocytosis.

2. Lymphocytes (Lym # / Lym %):
• Represents circulating T-cells, B-cells, and natural killer (NK) cells.
• Lymphocytosis (Elevated Lym # / Lym %): Acute viral infections (infectious mononucleosis, CMV, viral hepatitis), pertussis, chronic lymphocytic leukemia (CLL), autoimmune conditions.
• Lymphopenia (Decreased Lym # / Lym %): Acute stress, advanced HIV/AIDS, immunosuppressive therapy, systemic lupus erythematosus (SLE), radiation exposure.

3. Mid-Sized Cells (Mid # / Mid % - Monocytes, Eosinophils & Basophils):
• Encompasses monocytes, eosinophils, basophils, and precursor cells of intermediate size.
• Elevated Mid-Cell Fraction: Chronic inflammatory conditions, tuberculosis, allergic reactions/asthma, parasitic infestations, convalescent stage of acute infections, myelomonocytic neoplasms (CMML).`,
    parameters: [
      {
        name: 'Gran #',
        referenceRange: '2 - 7',
        unit: 'x10^3/µL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Lym #',
        referenceRange: '1 - 3',
        unit: 'x10^3/µL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Mid #',
        referenceRange: '0.2 - 1.2',
        unit: 'x10^3/µL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Gran %',
        referenceRange: '40 - 75',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Lym %',
        referenceRange: '20 - 40',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Mid %',
        referenceRange: '2 - 10',
        unit: '%',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Double Marker, Maternal Screen - 2 tests',
    title: 'Double Marker, Maternal Screen - 2 tests',
    basePrice: 2200,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: '24 - 48 Hours',
    description: 'First trimester maternal serum biochemical screening assay measuring Pregnancy-Associated Plasma Protein-A (PAPP-A) and Free Beta hCG to assess fetal risk for Trisomies 21 (Down syndrome), 18 (Edwards syndrome), and 13 (Patau syndrome).',
    notes: `Clinical Significance & Interpretation (First Trimester Maternal Screen / Double Marker):
The Double Marker Test is a prenatal screening tool performed between 11 weeks 0 days and 13 weeks 6 days of gestation (Crown-Rump Length CRL 45 to 84 mm) to assess the statistical risk of fetal chromosomal aneuploidies:
• Trisomy 21 (Down Syndrome)
• Trisomy 18 (Edwards Syndrome)
• Trisomy 13 (Patau Syndrome)

1. Biochemical Markers Measured:
• Pregnancy-Associated Plasma Protein-A (PAPP-A): A large zinc metalloproteinase produced by the syncytiotrophoblast.
• Free Beta human Chorionic Gonadotropin (Free β-hCG): The beta subunit of human chorionic gonadotropin secreted by the placenta.

2. Typical Risk Pattern in Fetal Aneuploidies:
• Down Syndrome (Trisomy 21): Significantly elevated Free β-hCG (median ~2.0 MoM) and decreased PAPP-A (median ~0.4 MoM).
• Edwards Syndrome (Trisomy 18) & Patau Syndrome (Trisomy 13): Markedly decreased Free β-hCG (< 0.5 MoM) and markedly decreased PAPP-A (< 0.3 MoM).

3. Multiple of Median (MoM) & Risk Calculation:
Raw analyte concentrations are converted into gestational age-adjusted Multiples of the Median (MoM), corrected for maternal weight, ethnicity, smoking status, IVF, and diabetes. Combined risk assessment incorporates maternal age, Ultrasound Nuchal Translucency (NT), and nasal bone visualization.

4. Important Clinical Notes:
• Screening Test Only: A "Screen Negative / Low Risk" result reduces but does not eliminate the risk of aneuploidy. A "Screen Positive / High Risk" (cutoff typically ≥ 1:250) indicates an increased statistical probability and warrants genetic counseling, cell-free DNA (NIPT), or definitive invasive diagnostic testing (Chorionic Villus Sampling CVS or Amniocentesis).
• Isolated Low PAPP-A (< 0.4 MoM) with normal chromosomes is an independent predictive marker for adverse pregnancy outcomes including pre-eclampsia, fetal growth restriction (FGR/IUGR), and preterm delivery.`,
    interpretation: `Clinical Significance & Interpretation (First Trimester Maternal Screen / Double Marker):
The Double Marker Test is a prenatal screening tool performed between 11 weeks 0 days and 13 weeks 6 days of gestation (Crown-Rump Length CRL 45 to 84 mm) to assess the statistical risk of fetal chromosomal aneuploidies:
• Trisomy 21 (Down Syndrome)
• Trisomy 18 (Edwards Syndrome)
• Trisomy 13 (Patau Syndrome)

1. Biochemical Markers Measured:
• Pregnancy-Associated Plasma Protein-A (PAPP-A): A large zinc metalloproteinase produced by the syncytiotrophoblast.
• Free Beta human Chorionic Gonadotropin (Free β-hCG): The beta subunit of human chorionic gonadotropin secreted by the placenta.

2. Typical Risk Pattern in Fetal Aneuploidies:
• Down Syndrome (Trisomy 21): Significantly elevated Free β-hCG (median ~2.0 MoM) and decreased PAPP-A (median ~0.4 MoM).
• Edwards Syndrome (Trisomy 18) & Patau Syndrome (Trisomy 13): Markedly decreased Free β-hCG (< 0.5 MoM) and markedly decreased PAPP-A (< 0.3 MoM).

3. Multiple of Median (MoM) & Risk Calculation:
Raw analyte concentrations are converted into gestational age-adjusted Multiples of the Median (MoM), corrected for maternal weight, ethnicity, smoking status, IVF, and diabetes. Combined risk assessment incorporates maternal age, Ultrasound Nuchal Translucency (NT), and nasal bone visualization.

4. Important Clinical Notes:
• Screening Test Only: A "Screen Negative / Low Risk" result reduces but does not eliminate the risk of aneuploidy. A "Screen Positive / High Risk" (cutoff typically ≥ 1:250) indicates an increased statistical probability and warrants genetic counseling, cell-free DNA (NIPT), or definitive invasive diagnostic testing (Chorionic Villus Sampling CVS or Amniocentesis).
• Isolated Low PAPP-A (< 0.4 MoM) with normal chromosomes is an independent predictive marker for adverse pregnancy outcomes including pre-eclampsia, fetal growth restriction (FGR/IUGR), and preterm delivery.`,
    parameters: [
      {
        name: 'PAPPA Level',
        referenceRange: '0.5 - 2.5 MoM (11 - 13+6 Weeks)',
        unit: 'ng/mL',
        gender: 'Female',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'HCG Level',
        referenceRange: '0.5 - 2.5 MoM (11 - 13+6 Weeks)',
        unit: 'mIU/mL',
        gender: 'Female',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Fasting Blood Sugar',
    title: 'Fasting Blood Sugar',
    basePrice: 80,
    taxPercentage: 0,
    sampleType: 'Plasma (Fluoride) / Serum (Fasting 8-12 hrs)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative determination of plasma glucose concentration after an overnight fast (8-12 hours) to diagnose and monitor diabetes mellitus and impaired fasting glucose.',
    notes: `Clinical Notes
Elevated glucose levels (hyperglycemia) are most often encountered clinically in the setting of diabetes mellitus, but they may also occur with pancreatic neoplasms, hyperthyroidism, and adrenocortical dysfunction. Decreased glucose levels (hypoglycemia) may result from endogenous or exogenous insulin excess, prolonged starvation, or liver disease.

Fasting Glucose (mg/dL) | 2 hours PP Glucose (mg/dL) | Diagnosis
• < 100                 | < 140                      | Normal
• 100 to 125            | 140 to 199                 | Pre-Diabetes
• > 126                 | > 200                      | Diabetes

A level of 126 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.
IGT (2 hrs Post meal), means a person has an increased risk of developing type 2 diabetes but does not have it yet.
A 2-hour glucose level of 200 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.`,
    interpretation: `Clinical Notes
Elevated glucose levels (hyperglycemia) are most often encountered clinically in the setting of diabetes mellitus, but they may also occur with pancreatic neoplasms, hyperthyroidism, and adrenocortical dysfunction. Decreased glucose levels (hypoglycemia) may result from endogenous or exogenous insulin excess, prolonged starvation, or liver disease.

Fasting Glucose (mg/dL) | 2 hours PP Glucose (mg/dL) | Diagnosis
• < 100                 | < 140                      | Normal
• 100 to 125            | 140 to 199                 | Pre-Diabetes
• > 126                 | > 200                      | Diabetes

A level of 126 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.
IGT (2 hrs Post meal), means a person has an increased risk of developing type 2 diabetes but does not have it yet.
A 2-hour glucose level of 200 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.`,
    parameters: [
      {
        name: 'Fasting Blood Sugar',
        referenceRange: '70 - 100',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Fasting Insulin',
    title: 'Fasting Insulin (Serum Insulin, Fasting)',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Fasting 8-12 hrs)',
    turnaroundTime: 'Same Day',
    description: 'Chemiluminescence Immunoassay (CLIA) for quantitative measurement of fasting serum insulin to evaluate insulin resistance, metabolic syndrome, beta-cell secretory capacity, and hyperinsulinemic hypoglycemia.',
    notes: `Clinical Significance & Interpretation (Fasting Insulin):
Insulin is a peptide hormone synthesized and secreted by the beta cells of pancreatic islets of Langerhans. It regulates glucose homeostasis by promoting peripheral glucose uptake into muscle and adipose tissue and suppressing hepatic gluconeogenesis.

1. Reference Interval (Fasting):
• Normal Fasting Insulin: 2.0 - 25.0 µIU/mL (Optimal metabolic fasting insulin is typically < 10.0 µIU/mL).

2. Elevated Fasting Insulin (Hyperinsulinemia):
• Insulin Resistance Syndrome & Metabolic Syndrome
• Type 2 Diabetes Mellitus (early/compensatory hyperinsulinemic phase)
• Polycystic Ovarian Syndrome (PCOS)
• Insulinoma (pancreatic islet beta-cell tumor)
• Obesity and excessive visceral adiposity
• Cushing's Syndrome & Acromegaly
• Exogenous insulin administration / Sulfonylurea use

3. Decreased Fasting Insulin (Hypoinsulinemia):
• Type 1 Diabetes Mellitus (absolute autoimmune beta-cell deficiency)
• Late-stage / End-stage Type 2 Diabetes (beta-cell exhaustion)
• Pancreatectomy, severe chronic pancreatitis, or cystic fibrosis
• Hypopituitarism

4. Assessment of Insulin Resistance (HOMA-IR):
Fasting insulin paired with fasting blood sugar enables the calculation of Homeostatic Model Assessment for Insulin Resistance:
• HOMA-IR = [Fasting Glucose (mg/dL) × Fasting Insulin (µIU/mL)] / 405
• HOMA-IR < 2.0: Normal Insulin Sensitivity
• HOMA-IR ≥ 2.5: Significant Insulin Resistance`,
    interpretation: `Clinical Significance & Interpretation (Fasting Insulin):
Insulin is a peptide hormone synthesized and secreted by the beta cells of pancreatic islets of Langerhans. It regulates glucose homeostasis by promoting peripheral glucose uptake into muscle and adipose tissue and suppressing hepatic gluconeogenesis.

1. Reference Interval (Fasting):
• Normal Fasting Insulin: 2.0 - 25.0 µIU/mL (Optimal metabolic fasting insulin is typically < 10.0 µIU/mL).

2. Elevated Fasting Insulin (Hyperinsulinemia):
• Insulin Resistance Syndrome & Metabolic Syndrome
• Type 2 Diabetes Mellitus (early/compensatory hyperinsulinemic phase)
• Polycystic Ovarian Syndrome (PCOS)
• Insulinoma (pancreatic islet beta-cell tumor)
• Obesity and excessive visceral adiposity
• Cushing's Syndrome & Acromegaly
• Exogenous insulin administration / Sulfonylurea use

3. Decreased Fasting Insulin (Hypoinsulinemia):
• Type 1 Diabetes Mellitus (absolute autoimmune beta-cell deficiency)
• Late-stage / End-stage Type 2 Diabetes (beta-cell exhaustion)
• Pancreatectomy, severe chronic pancreatitis, or cystic fibrosis
• Hypopituitarism

4. Assessment of Insulin Resistance (HOMA-IR):
Fasting insulin paired with fasting blood sugar enables the calculation of Homeostatic Model Assessment for Insulin Resistance:
• HOMA-IR = [Fasting Glucose (mg/dL) × Fasting Insulin (µIU/mL)] / 405
• HOMA-IR < 2.0: Normal Insulin Sensitivity
• HOMA-IR ≥ 2.5: Significant Insulin Resistance`,
    parameters: [
      {
        name: 'Fasting Insulin',
        referenceRange: '2 - 25',
        unit: 'µIU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'TORCH Profile',
    title: 'TORCH Profile (Toxoplasma, Rubella, CMV, HSV-1/2)',
    basePrice: 2000,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: '24 - 48 Hours',
    description: 'Comprehensive Chemiluminescence / ELISA immunoassay panel for detecting IgG and IgM antibodies against Toxoplasma gondii, Rubella virus, Cytomegalovirus (CMV), and Herpes Simplex Viruses (HSV 1 & 2) in maternal antenatal screening.',
    notes: `Clinical Significance & Interpretation (TORCH Panel / Profile):
The TORCH profile is a serological panel designed to detect antibodies against Toxoplasma gondii, Rubella virus, Cytomegalovirus (CMV), and Herpes Simplex Virus (HSV-1 and HSV-2), primarily used during preconception and antenatal screening to prevent congenital infections.

1. Serological Pattern Interpretation:
• IgG Negative (-) & IgM Negative (-): No evidence of past exposure or current infection; Patient is susceptible to primary infection. Preventive counseling and hygiene advised.
• IgG Positive (+) & IgM Negative (-): Indicates past infection and acquired immunity (protective against primary maternal infection for Rubella and Toxoplasma). Low fetal risk.
• IgG Negative (-) & IgM Positive (+): Suggestive of acute primary / early infection or false positive IgM. Advise repeat testing in 2-3 weeks for IgG seroconversion. High risk of vertical transmission.
• IgG Positive (+) & IgM Positive (+): Possible acute recent infection, persistent IgM, or secondary reactivation. IgG avidity testing is recommended to differentiate recent primary infection (< 3-4 months) from remote infection (> 4 months).

2. Pathogen Specific Notes:
• Toxoplasma gondii: Primary infection in pregnancy carries risk of congenital toxoplasmosis (hydrocephalus, intracranial calcifications, chorioretinitis).
• Rubella Virus: Acute primary infection during first trimester causes Congenital Rubella Syndrome (CRS - cataract, cardiac defects, sensorineural deafness).
• Cytomegalovirus (CMV): Most common congenital viral infection causing sensorineural hearing loss, microcephaly, and developmental delay.
• Herpes Simplex Virus (HSV 1/2): High risk of neonatal transmission during vaginal delivery if active maternal genital lesions or primary infection are present near term.`,
    interpretation: `Clinical Significance & Interpretation (TORCH Panel / Profile):
The TORCH profile is a serological panel designed to detect antibodies against Toxoplasma gondii, Rubella virus, Cytomegalovirus (CMV), and Herpes Simplex Virus (HSV-1 and HSV-2), primarily used during preconception and antenatal screening to prevent congenital infections.

1. Serological Pattern Interpretation:
• IgG Negative (-) & IgM Negative (-): No evidence of past exposure or current infection; Patient is susceptible to primary infection. Preventive counseling and hygiene advised.
• IgG Positive (+) & IgM Negative (-): Indicates past infection and acquired immunity (protective against primary maternal infection for Rubella and Toxoplasma). Low fetal risk.
• IgG Negative (-) & IgM Positive (+): Suggestive of acute primary / early infection or false positive IgM. Advise repeat testing in 2-3 weeks for IgG seroconversion. High risk of vertical transmission.
• IgG Positive (+) & IgM Positive (+): Possible acute recent infection, persistent IgM, or secondary reactivation. IgG avidity testing is recommended to differentiate recent primary infection (< 3-4 months) from remote infection (> 4 months).

2. Pathogen Specific Notes:
• Toxoplasma gondii: Primary infection in pregnancy carries risk of congenital toxoplasmosis (hydrocephalus, intracranial calcifications, chorioretinitis).
• Rubella Virus: Acute primary infection during first trimester causes Congenital Rubella Syndrome (CRS - cataract, cardiac defects, sensorineural deafness).
• Cytomegalovirus (CMV): Most common congenital viral infection causing sensorineural hearing loss, microcephaly, and developmental delay.
• Herpes Simplex Virus (HSV 1/2): High risk of neonatal transmission during vaginal delivery if active maternal genital lesions or primary infection are present near term.`,
    parameters: [
      {
        name: 'Toxo IgG',
        referenceRange: '< 2 IU/mL',
        unit: 'IU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Toxo IgM',
        referenceRange: 'Neg. < 2 AU/mL | Grey Zone 2 - 2.6 AU/mL | Pos. > 2.6 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Rubella IgG',
        referenceRange: '< 2 IU/mL',
        unit: 'IU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Rubella IgM',
        referenceRange: 'Neg. < 2 AU/mL | Grey Zone 2 - 3 AU/mL | Pos. > 3 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'CMV IgG',
        referenceRange: '< 2 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'CMV IgM',
        referenceRange: 'Neg. < 2.0 AU/mL | Grey Zone 2 - 4.2 AU/mL | Pos. > 4.2 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'HSV-1/2 IgG',
        referenceRange: '< 2.0 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'HSV-1/2 IgM',
        referenceRange: 'Neg. < 2 AU/mL | Grey Zone 2 - 4 AU/mL | Pos. >= 4 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'HSV-2 IgG',
        referenceRange: '< 2.0 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'HSV-2 IgM',
        referenceRange: 'Neg. < 2.0 AU/mL | Grey Zone 2 - 4.0 AU/mL | Pos. >= 4.0 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'TLC',
    title: 'Total Leukocyte Count (TLC)',
    basePrice: 100,
    taxPercentage: 0,
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: 'Same Day',
    description: 'Automated quantitative enumeration of total circulating white blood cells (WBC / Leukocytes) in peripheral whole blood to screen for infection, inflammation, bone marrow disorders, and leukemia.',
    notes: `Physiological basis
The WBC count and differential determine the total number of white blood cells as well as the percentage and absolute number of each type of white cell in a blood sample. It is typically generated by an automated laboratory hematology analyzer as part of the CBC panel.

Interpretation
Increased in: Acute infections, inflammatory disorders, acute and chronic leukemias, myeloproliferative disorders, solid tumor (paraneoplastic reaction), circulating lymphoma, tissue injury/necrosis, G-CSF stimulation, various drugs, corticosteroids, allergies, hypersensitivity reactions, stress, smoking.

Decreased in: Infections, constitutional and acquired myeloid hypoplasia, myelosuppression (eg, chemotherapy, radiation, various drugs), myelodysplasia, collagen vascular diseases, hypersplenism, cyclic neutropenia, autoimmune neutropenia, alcoholism.

Comments
There are five types of white cells, each with different functions: neutrophils, lymphocytes, monocytes, eosinophils, and basophils. Absolute counts for individual cell populations can be calculated from a combination of the WBC count and the percentage of each cell type from the differential.`,
    interpretation: `Physiological basis
The WBC count and differential determine the total number of white blood cells as well as the percentage and absolute number of each type of white cell in a blood sample. It is typically generated by an automated laboratory hematology analyzer as part of the CBC panel.

Interpretation
Increased in: Acute infections, inflammatory disorders, acute and chronic leukemias, myeloproliferative disorders, solid tumor (paraneoplastic reaction), circulating lymphoma, tissue injury/necrosis, G-CSF stimulation, various drugs, corticosteroids, allergies, hypersensitivity reactions, stress, smoking.

Decreased in: Infections, constitutional and acquired myeloid hypoplasia, myelosuppression (eg, chemotherapy, radiation, various drugs), myelodysplasia, collagen vascular diseases, hypersplenism, cyclic neutropenia, autoimmune neutropenia, alcoholism.

Comments
There are five types of white cells, each with different functions: neutrophils, lymphocytes, monocytes, eosinophils, and basophils. Absolute counts for individual cell populations can be calculated from a combination of the WBC count and the percentage of each cell type from the differential.`,
    parameters: [
      {
        name: 'Total Leukocyte Count',
        referenceRange: '4,800 - 10,800',
        unit: 'cumm',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'TG / HDL',
    title: 'TG / HDL (Triglycerides / HDL Cholesterol Ratio)',
    basePrice: 100,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma (Fasting 10-12 hrs)',
    turnaroundTime: 'Same Day',
    description: 'Calculated ratio of serum triglycerides to high-density lipoprotein cholesterol (TG/HDL-C), serving as a powerful surrogate marker for insulin resistance, atherogenic small dense LDL particles, and cardiometabolic risk.',
    notes: `Clinical Significance & Interpretation (TG / HDL Ratio):
The Triglycerides to HDL-Cholesterol ratio (TG/HDL-C) is a powerful, non-invasive surrogate biomarker of insulin resistance, cardiometabolic risk, and the presence of atherogenic small dense low-density lipoprotein (sdLDL) particles.

1. Reference Interval & Risk Stratification:
• < 2.0 (Ideal / Low Risk): Indicates optimal insulin sensitivity, low atherogenic particle burden, and minimal cardiometabolic risk.
• 2.0 - 4.0 (Borderline / Moderate Risk): Indicates emerging insulin resistance, early atherogenic dyslipidemia, and moderate cardiovascular risk.
• > 4.0 (High Risk): Strongly associated with significant insulin resistance, metabolic syndrome, non-alcoholic fatty liver disease (NAFLD/MASLD), and elevated risk for coronary artery disease (CAD).

2. Pathophysiological Insights:
• sdLDL Proxy: A high TG/HDL ratio closely mirrors high circulating levels of small, dense, easily oxidized LDL particles even when standard LDL-C levels appear normal.
• Insulin Resistance & Metabolic Health: TG/HDL ratio > 3.0 in males or > 2.5 in females correlates strongly with hyperinsulinemia and visceral adiposity.
• Lifestyle & Therapeutic Interventions: Dietary carbohydrate restriction, weight optimization, regular aerobic and resistance exercise, and omega-3 fatty acid supplementation effectively reduce the TG/HDL ratio.`,
    interpretation: `Clinical Significance & Interpretation (TG / HDL Ratio):
The Triglycerides to HDL-Cholesterol ratio (TG/HDL-C) is a powerful, non-invasive surrogate biomarker of insulin resistance, cardiometabolic risk, and the presence of atherogenic small dense low-density lipoprotein (sdLDL) particles.

1. Reference Interval & Risk Stratification:
• < 2.0 (Ideal / Low Risk): Indicates optimal insulin sensitivity, low atherogenic particle burden, and minimal cardiometabolic risk.
• 2.0 - 4.0 (Borderline / Moderate Risk): Indicates emerging insulin resistance, early atherogenic dyslipidemia, and moderate cardiovascular risk.
• > 4.0 (High Risk): Strongly associated with significant insulin resistance, metabolic syndrome, non-alcoholic fatty liver disease (NAFLD/MASLD), and elevated risk for coronary artery disease (CAD).

2. Pathophysiological Insights:
• sdLDL Proxy: A high TG/HDL ratio closely mirrors high circulating levels of small, dense, easily oxidized LDL particles even when standard LDL-C levels appear normal.
• Insulin Resistance & Metabolic Health: TG/HDL ratio > 3.0 in males or > 2.5 in females correlates strongly with hyperinsulinemia and visceral adiposity.
• Lifestyle & Therapeutic Interventions: Dietary carbohydrate restriction, weight optimization, regular aerobic and resistance exercise, and omega-3 fatty acid supplementation effectively reduce the TG/HDL ratio.`,
    parameters: [
      {
        name: 'TG / HDL',
        referenceRange: '< 2.0 (Desirable) | 2.0 - 4.0 (Borderline) | > 4.0 (High Risk)',
        unit: 'Ratio',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Testosterone Total',
    title: 'Testosterone Total',
    basePrice: 550,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Morning 7-10 AM preferred)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative measurement of total serum testosterone (bound and free fractions) via Chemiluminescence Immunoassay (CLIA) to assess gonadal function, hypogonadism, hirsutism, and endocrine disorders.',
    notes: `Physiological basis
Testosterone is the principal male sex hormone, produced by the Leydig cells of the testes. Dehydroepiandrosterone (DHEA) is produced in the adrenal cortex, testes, and ovaries and is the main precursor for serum testosterone in women. In normal males after puberty, the testosterone level is twice as high as all androgens in females. In serum, it is largely bound to albumin (38%) and to a specific steroid hormone-binding globulin (SHBG) (60%), but it is the free hormone (2%) that is physiologically active. The total testosterone level measures both bound and free testosterone in the serum (by immunoassay). Free or bioavailable testosterone may be calculated or measured.

Interpretation
Increased in: Idiopathic sexual precocity (in boys, levels may be in adult range), adrenal hyperplasia (boys), adrenocortical tumors, trophoblastic disease during pregnancy, idiopathic hirsutism, virilizing ovarian tumors, arrhenoblastoma, virilizing luteoma, testicular feminization (normal or moderately elevated), cirrhosis (through increased SHBG), hyperthyroidism. Drugs: anticonvulsants, barbiturates, estrogens, oral contraceptives (through increased SHBG).
Decreased in: Hypogonadism (primary and secondary, orchidectomy, Klinefelter syndrome, uremia, hemodialysis, hepatic insufficiency, ethanol [men]). Drugs: digoxin, spironolactone, acarbose.

Comments
Diurnal variation is present in adult males with highest levels in the early morning (around 8 AM) and lowest levels in the evening (around 8 PM). Early morning collection is recommended.`,
    interpretation: `Physiological basis
Testosterone is the principal male sex hormone, produced by the Leydig cells of the testes. Dehydroepiandrosterone (DHEA) is produced in the adrenal cortex, testes, and ovaries and is the main precursor for serum testosterone in women. In normal males after puberty, the testosterone level is twice as high as all androgens in females. In serum, it is largely bound to albumin (38%) and to a specific steroid hormone-binding globulin (SHBG) (60%), but it is the free hormone (2%) that is physiologically active. The total testosterone level measures both bound and free testosterone in the serum (by immunoassay). Free or bioavailable testosterone may be calculated or measured.

Interpretation
Increased in: Idiopathic sexual precocity (in boys, levels may be in adult range), adrenal hyperplasia (boys), adrenocortical tumors, trophoblastic disease during pregnancy, idiopathic hirsutism, virilizing ovarian tumors, arrhenoblastoma, virilizing luteoma, testicular feminization (normal or moderately elevated), cirrhosis (through increased SHBG), hyperthyroidism. Drugs: anticonvulsants, barbiturates, estrogens, oral contraceptives (through increased SHBG).
Decreased in: Hypogonadism (primary and secondary, orchidectomy, Klinefelter syndrome, uremia, hemodialysis, hepatic insufficiency, ethanol [men]). Drugs: digoxin, spironolactone, acarbose.

Comments
Diurnal variation is present in adult males with highest levels in the early morning (around 8 AM) and lowest levels in the evening (around 8 PM). Early morning collection is recommended.`,
    parameters: [
      {
        name: 'Testosterone Total',
        referenceRange: 'Males: 240 - 870 | Females: 15 - 70',
        unit: 'ng/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Testosterone Free',
    title: 'Testosterone Free',
    basePrice: 750,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Morning 7-10 AM preferred)',
    turnaroundTime: '24 - 48 Hours',
    description: 'Quantitative determination of unbound, biologically active free testosterone in serum via enzyme immunoassay (ELISA) / equilibrium dialysis to assess functional androgen activity in conditions of altered SHBG binding.',
    notes: `Clinical Use
1. As a secondary test to investigate alterations in physiologically active testosterone levels.
2. To evaluate androgen status in cases with suspected or established abnormalities in sex hormone-binding globulin (SHBG).
3. To assess functional serum testosterone levels in early pubertal males and older adult men.
4. To measure functional circulating testosterone in females presenting with symptoms or signs of hyperandrogenism despite having normal total testosterone concentrations.

Comments
Testosterone circulates in the blood bound to three proteins: sex hormone-binding globulin (SHBG) (60-80%), albumin, and cortisol-binding globulin. Approximately 1-2% of circulating testosterone remains unbound or free. Measuring free testosterone provides an estimate of the biologically active hormone. This is particularly useful to account for variations in transport proteins that can affect total testosterone levels. Elevated SHBG levels, which can occur with conditions like obesity or advanced age, might obscure a true testosterone deficiency. In conditions such as Polycystic Ovary Syndrome (PCOS), where insulin resistance is prevalent and SHBG levels are often reduced, free or bioavailable testosterone levels may be significantly elevated.`,
    interpretation: `Clinical Use
1. As a secondary test to investigate alterations in physiologically active testosterone levels.
2. To evaluate androgen status in cases with suspected or established abnormalities in sex hormone-binding globulin (SHBG).
3. To assess functional serum testosterone levels in early pubertal males and older adult men.
4. To measure functional circulating testosterone in females presenting with symptoms or signs of hyperandrogenism despite having normal total testosterone concentrations.

Comments
Testosterone circulates in the blood bound to three proteins: sex hormone-binding globulin (SHBG) (60-80%), albumin, and cortisol-binding globulin. Approximately 1-2% of circulating testosterone remains unbound or free. Measuring free testosterone provides an estimate of the biologically active hormone. This is particularly useful to account for variations in transport proteins that can affect total testosterone levels. Elevated SHBG levels, which can occur with conditions like obesity or advanced age, might obscure a true testosterone deficiency. In conditions such as Polycystic Ovary Syndrome (PCOS), where insulin resistance is prevalent and SHBG levels are often reduced, free or bioavailable testosterone levels may be significantly elevated.`,
    parameters: [
      {
        name: 'Testosterone Free',
        referenceRange: 'Males: 4.5 - 25.0 | Females: 0.1 - 4.1',
        unit: 'pg/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'test',
    title: 'test',
    basePrice: 100,
    taxPercentage: 0,
    sampleType: 'Biological Specimen',
    turnaroundTime: 'Same Day',
    description: 'Custom laboratory test panel containing quantitative measurement parameter AAA and multi-option selection parameter BBB.',
    notes: '',
    interpretation: '',
    parameters: [
      {
        name: 'AAA',
        referenceRange: '5.4 - 8',
        unit: '',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'BBB',
        referenceRange: '',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'Normal', isAbnormal: false },
          { value: 'Abnormal', isAbnormal: true },
          { value: 'Positive', isAbnormal: true },
          { value: 'Negative', isAbnormal: false }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'T4',
    title: 'Serum thyroxine, T4',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative immunoassay measurement of total circulating serum thyroxine (T4) to evaluate thyroid metabolic function, hyperthyroidism, and hypothyroidism.',
    notes: `Clinical Significance & Interpretation (Serum Thyroxine, Total T4):
Thyroxine (T4) is the major circulating thyroid hormone synthesized and secreted by the follicular cells of the thyroid gland under the regulatory control of Pituitary Thyroid Stimulating Hormone (TSH). More than 99.9% of circulating T4 is bound to plasma transport proteins (predominantly Thyroxine-Binding Globulin [TBG], transthyretin, and albumin), while the remaining unbound fraction represents free T4 (FT4).

1. Clinical Indications & Diagnostics:
• Increased in (Hyperthyroidism / Thyrotoxicosis): Graves' disease, toxic multinodular goiter, toxic adenoma, subacute thyroiditis (early release phase), exogenous thyroid hormone administration, elevated TBG states (pregnancy, estrogen therapy, oral contraceptives, acute hepatitis).
• Decreased in (Hypothyroidism): Primary hypothyroidism (Hashimoto's thyroiditis, post-ablative, post-surgical, iodine deficiency), secondary/central hypothyroidism (pituitary or hypothalamic insufficiency), severe non-thyroidal illness (euthyroid sick syndrome), decreased TBG states (nephrotic syndrome, protein-losing enteropathy, major hepatic failure, androgen/anabolic steroid use).

2. Diagnostic Guidance:
Total T4 levels reflect both bound and unbound hormone. Conditions altering TBG concentrations may alter Total T4 without impacting thyroid metabolic status. Assessing Free T4 (FT4) and TSH is recommended for definitive diagnosis when binding protein abnormalities are suspected.`,
    interpretation: `Clinical Significance & Interpretation (Serum Thyroxine, Total T4):
Thyroxine (T4) is the major circulating thyroid hormone synthesized and secreted by the follicular cells of the thyroid gland under the regulatory control of Pituitary Thyroid Stimulating Hormone (TSH). More than 99.9% of circulating T4 is bound to plasma transport proteins (predominantly Thyroxine-Binding Globulin [TBG], transthyretin, and albumin), while the remaining unbound fraction represents free T4 (FT4).

1. Clinical Indications & Diagnostics:
• Increased in (Hyperthyroidism / Thyrotoxicosis): Graves' disease, toxic multinodular goiter, toxic adenoma, subacute thyroiditis (early release phase), exogenous thyroid hormone administration, elevated TBG states (pregnancy, estrogen therapy, oral contraceptives, acute hepatitis).
• Decreased in (Hypothyroidism): Primary hypothyroidism (Hashimoto's thyroiditis, post-ablative, post-surgical, iodine deficiency), secondary/central hypothyroidism (pituitary or hypothalamic insufficiency), severe non-thyroidal illness (euthyroid sick syndrome), decreased TBG states (nephrotic syndrome, protein-losing enteropathy, major hepatic failure, androgen/anabolic steroid use).

2. Diagnostic Guidance:
Total T4 levels reflect both bound and unbound hormone. Conditions altering TBG concentrations may alter Total T4 without impacting thyroid metabolic status. Assessing Free T4 (FT4) and TSH is recommended for definitive diagnosis when binding protein abnormalities are suspected.`,
    parameters: [
      {
        name: 'Serum thyroxine, T4',
        referenceRange: '52 - 127',
        unit: 'ng/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'T3',
    title: 'Serum Triiodothyronine, T3',
    basePrice: 200,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative immunoassay determination of total circulating serum triiodothyronine (T3) for assessing thyroid hyperactivity, T3 thyrotoxicosis, and peripheral thyroid hormone status.',
    notes: `Physiologic Basis
T3 is the primary active thyroid hormone. Approximately 80% of T3 is produced by extrathyroidal deiodination of T4 and the rest by thyroid gland. Total T3 is influenced by levels of thyroxine binding proteins.

Interpretation
Increased in: Hyperthyroidism (some) Increased thyroid binding globulin.
Decreased in: Hypothyroidism, nonthyroidal illness, decreased thyroid binding globulin. Drugs: Amiodarone.

Comments
T3 may be increased in approximately 5% of hyperthyroid patients in whom free T4 is normal (T3 toxicosis). Therefore, the test is indicated when hyperthyroidism is suspected and free T4 value is normal. Test is of no value in the diagnosis and treatment of primary hypothyroidism.`,
    interpretation: `Physiologic Basis
T3 is the primary active thyroid hormone. Approximately 80% of T3 is produced by extrathyroidal deiodination of T4 and the rest by thyroid gland. Total T3 is influenced by levels of thyroxine binding proteins.

Interpretation
Increased in: Hyperthyroidism (some) Increased thyroid binding globulin.
Decreased in: Hypothyroidism, nonthyroidal illness, decreased thyroid binding globulin. Drugs: Amiodarone.

Comments
T3 may be increased in approximately 5% of hyperthyroid patients in whom free T4 is normal (T3 toxicosis). Therefore, the test is indicated when hyperthyroidism is suspected and free T4 value is normal. Test is of no value in the diagnosis and treatment of primary hypothyroidism.`,
    parameters: [
      {
        name: 'Serum Triiodothyronine, T3',
        referenceRange: '0.69 - 2.15',
        unit: 'ng/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Stool Routine Examination',
    title: 'Stool Routine Examination (Routine & Microscopy)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Fresh Stool / Feces (Sterile Container)',
    turnaroundTime: 'Same Day',
    description: 'Comprehensive physical, chemical, and microscopic examination of fecal specimens to evaluate gastrointestinal disorders, intestinal parasites, dysentery, occult bleeding, and malabsorption.',
    notes: `Clinical Significance & Interpretation (Stool Routine Examination):
Stool Routine & Microscopic Examination is a vital diagnostic evaluation of gastrointestinal health, intestinal infections, malabsorption disorders, and gastrointestinal bleeding.

1. Macroscopic Findings:
• Colour: Normal stool colour ranges from light to dark brown due to stercobilin. Pale/Clay-coloured stool suggests biliary obstruction (lack of urobilinogen). Black/Tarry stool (melena) indicates upper GI bleeding. Red/Bloody stool (hematochezia) suggests lower GI bleeding, hemorrhoids, or fissures.
• Consistency: Watery or loose stools reflect hypermotility or secretory/osmotic diarrhea. Hard stools indicate delayed transit/constipation. Mucoid stools suggest colonic inflammation, irritable bowel syndrome, or infectious enteritis.
• Occult Blood: Positive occult blood is an indicator of asymptomatic colorectal bleeding, polyps, inflammatory bowel disease (IBD), ulcers, or early colorectal neoplasia.

2. Microscopic Findings:
• Pus Cells (Leukocytes) & RBCs: Presence of significant pus cells (> 5/HPF) with RBCs indicates invasive or inflammatory bacterial infection (e.g., Shigella, Salmonella, Campylobacter, invasive E. coli) or active IBD (Ulcerative Colitis / Crohn's Disease).
• Cysts & Trophozoites: Detection of Entamoeba histolytica (amebiasis) or Giardia lamblia (giardiasis) cysts/trophozoites confirms parasitic intestinal protozoal infection.
• Helminthic Ova: Identification of ova (Ascaris, Hookworm, Trichuris, Taenia) confirms helminthic infestation requiring targeted anthelmintic therapy.
• Undigested Food & Macrophages: Excessive undigested meat fibers/starch or macrophages suggests maldigestion, pancreatic exocrine insufficiency, or severe mucosal inflammation.`,
    interpretation: `Clinical Significance & Interpretation (Stool Routine Examination):
Stool Routine & Microscopic Examination is a vital diagnostic evaluation of gastrointestinal health, intestinal infections, malabsorption disorders, and gastrointestinal bleeding.

1. Macroscopic Findings:
• Colour: Normal stool colour ranges from light to dark brown due to stercobilin. Pale/Clay-coloured stool suggests biliary obstruction (lack of urobilinogen). Black/Tarry stool (melena) indicates upper GI bleeding. Red/Bloody stool (hematochezia) suggests lower GI bleeding, hemorrhoids, or fissures.
• Consistency: Watery or loose stools reflect hypermotility or secretory/osmotic diarrhea. Hard stools indicate delayed transit/constipation. Mucoid stools suggest colonic inflammation, irritable bowel syndrome, or infectious enteritis.
• Occult Blood: Positive occult blood is an indicator of asymptomatic colorectal bleeding, polyps, inflammatory bowel disease (IBD), ulcers, or early colorectal neoplasia.

2. Microscopic Findings:
• Pus Cells (Leukocytes) & RBCs: Presence of significant pus cells (> 5/HPF) with RBCs indicates invasive or inflammatory bacterial infection (e.g., Shigella, Salmonella, Campylobacter, invasive E. coli) or active IBD (Ulcerative Colitis / Crohn's Disease).
• Cysts & Trophozoites: Detection of Entamoeba histolytica (amebiasis) or Giardia lamblia (giardiasis) cysts/trophozoites confirms parasitic intestinal protozoal infection.
• Helminthic Ova: Identification of ova (Ascaris, Hookworm, Trichuris, Taenia) confirms helminthic infestation requiring targeted anthelmintic therapy.
• Undigested Food & Macrophages: Excessive undigested meat fibers/starch or macrophages suggests maldigestion, pancreatic exocrine insufficiency, or severe mucosal inflammation.`,
    parameters: [
      {
        name: 'Colour',
        referenceRange: 'Yellowish Brown / Brown',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'Brown', isAbnormal: false },
          { value: 'Yellowish Brown', isAbnormal: false },
          { value: 'Dark Brown', isAbnormal: false },
          { value: 'Clay Coloured', isAbnormal: true },
          { value: 'Black / Tarry', isAbnormal: true },
          { value: 'Greenish', isAbnormal: true },
          { value: 'Red / Bloody', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Consistency',
        referenceRange: 'Formed / Semi-formed',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'Formed', isAbnormal: false },
          { value: 'Semi-formed', isAbnormal: false },
          { value: 'Soft', isAbnormal: false },
          { value: 'Loose / Watery', isAbnormal: true },
          { value: 'Hard', isAbnormal: true },
          { value: 'Mucoid', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Mucus',
        referenceRange: 'Absent / NIL',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'NIL', isAbnormal: false },
          { value: 'Present', isAbnormal: true },
          { value: 'Trace', isAbnormal: false },
          { value: 'Moderate', isAbnormal: true },
          { value: 'Copious', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Blood',
        referenceRange: 'Absent / NIL',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'NIL', isAbnormal: false },
          { value: 'Present', isAbnormal: true },
          { value: 'Trace', isAbnormal: true },
          { value: 'Occasional', isAbnormal: true },
          { value: 'Gross Blood Present', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Occult Blood',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Weakly Positive', isAbnormal: true },
          { value: 'Trace', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Parasites',
        referenceRange: 'Not Seen / NIL',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'Not Seen', isAbnormal: false },
          { value: 'NIL', isAbnormal: false },
          { value: 'Present', isAbnormal: true },
          { value: 'Adult Worm / Segment Seen', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Undigested Food Particles',
        referenceRange: 'Absent / Occasional',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'Absent', isAbnormal: false },
          { value: 'NIL', isAbnormal: false },
          { value: 'Present', isAbnormal: true },
          { value: 'Occasional', isAbnormal: false },
          { value: 'Moderate Amount', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'OVA',
        referenceRange: 'NIL / Not Seen',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'NIL', isAbnormal: false },
          { value: 'Not Seen', isAbnormal: false },
          { value: 'Ascaris lumbricoides seen', isAbnormal: true },
          { value: 'Hookworm ova seen', isAbnormal: true },
          { value: 'Trichuris trichiura seen', isAbnormal: true },
          { value: 'Taenia ova seen', isAbnormal: true },
          { value: 'Enterobius vermicularis seen', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Cysts',
        referenceRange: 'NIL / Not Seen',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'NIL', isAbnormal: false },
          { value: 'Not Seen', isAbnormal: false },
          { value: 'E. histolytica cyst seen', isAbnormal: true },
          { value: 'Giardia lamblia cyst seen', isAbnormal: true },
          { value: 'E. coli cyst seen', isAbnormal: false },
          { value: 'Balantidium coli cyst seen', isAbnormal: true },
          { value: 'Blastocystis hominis seen', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Pus Cells',
        referenceRange: '0 - 2 /HPF',
        unit: '/HPF',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'NIL', isAbnormal: false },
          { value: '0 - 2', isAbnormal: false },
          { value: '2 - 4', isAbnormal: false },
          { value: '5 - 10', isAbnormal: true },
          { value: '10 - 20', isAbnormal: true },
          { value: 'Plenty / Numerous', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Red Blood Cells',
        referenceRange: 'NIL /HPF',
        unit: '/HPF',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'NIL', isAbnormal: false },
          { value: '0 - 1', isAbnormal: false },
          { value: '1 - 2', isAbnormal: true },
          { value: '2 - 5', isAbnormal: true },
          { value: '5 - 10', isAbnormal: true },
          { value: 'Plenty / Numerous', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Macrophages',
        referenceRange: 'Absent / NIL',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'NIL', isAbnormal: false },
          { value: 'Absent', isAbnormal: false },
          { value: 'Present', isAbnormal: true },
          { value: 'Occasional', isAbnormal: false },
          { value: 'Few', isAbnormal: false }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Stool reducing substances',
    title: 'Stool Reducing Substances (Fecal Reducing Substances)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Fresh Stool Specimen (Sterile Container)',
    turnaroundTime: 'Same Day',
    description: 'Semi-quantitative chemical screening test (Benedict’s / Clinitest method) to detect reducing carbohydrates (lactose, glucose, galactose, fructose) in stool for diagnosing carbohydrate malabsorption and disaccharidase deficiency.',
    notes: `Clinical Significance & Interpretation (Stool Reducing Substances):
Fecal reducing substances testing (Benedict's / Clinitest method) is a critical diagnostic screening tool for carbohydrate malabsorption and disaccharidase deficiencies in infants and young children presenting with chronic watery diarrhea, perianal excoriation, abdominal distension, and failure to thrive.

1. Reference Interval & Grading:
• Negative (< 0.25% or < 0.25 g/dL): Normal carbohydrate absorption without significant fecal loss of reducing sugars.
• Borderline / Suspicious (0.25% - 0.5%): Questionable or mild malabsorption; repeat testing after dietary challenge may be warranted.
• Positive (> 0.5% or > 0.5 g/dL): Clinically significant carbohydrate malabsorption.

2. Clinical Etiologies of Positive Results:
• Primary / Congenital Disaccharidase Deficiencies: Congenital lactase deficiency, sucrase-isomaltase deficiency, glucose-galactose malabsorption.
• Secondary / Acquired Intestinal Malabsorption: Post-rotaviral / post-gastroenteritis mucosal brush border injury, cow's milk protein allergy, celiac disease, short bowel syndrome, or small intestinal bacterial overgrowth (SIBO).

3. Correlative Biomarkers & Pre-analytical Notes:
• Fecal pH: Malabsorbed carbohydrates are fermented by colonic flora into short-chain fatty acids, reducing stool pH to acidic levels (< 5.5).
• Non-reducing Sugars (Sucrose): Sucrose is not a reducing sugar unless acid hydrolyzed. If sucrose malabsorption is suspected, acid hydrolysis prior to testing is required.
• Sample Handling: Feces must be collected fresh and processed immediately to prevent bacterial consumption of sugars prior to analysis.`,
    interpretation: `Clinical Significance & Interpretation (Stool Reducing Substances):
Fecal reducing substances testing (Benedict's / Clinitest method) is a critical diagnostic screening tool for carbohydrate malabsorption and disaccharidase deficiencies in infants and young children presenting with chronic watery diarrhea, perianal excoriation, abdominal distension, and failure to thrive.

1. Reference Interval & Grading:
• Negative (< 0.25% or < 0.25 g/dL): Normal carbohydrate absorption without significant fecal loss of reducing sugars.
• Borderline / Suspicious (0.25% - 0.5%): Questionable or mild malabsorption; repeat testing after dietary challenge may be warranted.
• Positive (> 0.5% or > 0.5 g/dL): Clinically significant carbohydrate malabsorption.

2. Clinical Etiologies of Positive Results:
• Primary / Congenital Disaccharidase Deficiencies: Congenital lactase deficiency, sucrase-isomaltase deficiency, glucose-galactose malabsorption.
• Secondary / Acquired Intestinal Malabsorption: Post-rotaviral / post-gastroenteritis mucosal brush border injury, cow's milk protein allergy, celiac disease, short bowel syndrome, or small intestinal bacterial overgrowth (SIBO).

3. Correlative Biomarkers & Pre-analytical Notes:
• Fecal pH: Malabsorbed carbohydrates are fermented by colonic flora into short-chain fatty acids, reducing stool pH to acidic levels (< 5.5).
• Non-reducing Sugars (Sucrose): Sucrose is not a reducing sugar unless acid hydrolyzed. If sucrose malabsorption is suspected, acid hydrolysis prior to testing is required.
• Sample Handling: Feces must be collected fresh and processed immediately to prevent bacterial consumption of sugars prior to analysis.`,
    parameters: [
      {
        name: 'Stool reducing substances',
        referenceRange: 'Negative (< 0.25%)',
        unit: '%',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'Negative (< 0.25%)', isAbnormal: false },
          { value: 'Borderline (0.25% - 0.5%)', isAbnormal: true },
          { value: 'Positive (> 0.5%)', isAbnormal: true },
          { value: 'Strongly Positive (> 1.0%)', isAbnormal: true }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Skin test for Leprosy',
    title: 'Skin test for Leprosy (Lepromin Test)',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Intradermal Antigen (Lepromin)',
    turnaroundTime: '48 Hours (Fernandez) / 21-28 Days (Mitsuda)',
    description: 'Delayed-type hypersensitivity skin test using Lepromin antigen to assess cell-mediated immunity (CMI) against Mycobacterium leprae for classification, prognostication, and host resistance evaluation.',
    notes: `Clinical Significance & Interpretation (Skin Test for Leprosy / Lepromin Test):
The Lepromin test (Mitsuda and Fernandez reactions) is a delayed-type hypersensitivity skin test used to assess cell-mediated immunity (CMI) to Mycobacterium leprae. It is primarily used for classification and prognosis of leprosy rather than initial diagnosis.

1. Reaction Types & Interpretation:
• Fernandez Reaction (Early Reaction, read at 48 hours): Erythema and induration > 10 mm indicates pre-existing delayed hypersensitivity to soluble M. leprae antigens.
• Mitsuda Reaction (Late Reaction, read at 21-28 days): Nodular induration > 5 mm indicates intact, functional cell-mediated immunity against M. leprae antigens.

2. Immunological & Prognostic Significance:
• Positive Mitsuda Test: Indicates strong cell-mediated immunity. Associated with Tuberculoid Leprosy (TT) or Borderline Tuberculoid (BT), characterized by low bacterial index (paucibacillary), localized granulomas, and favorable clinical prognosis.
• Negative Mitsuda Test: Indicates deficient cell-mediated immunity to M. leprae. Associated with Lepromatous Leprosy (LL) or Borderline Lepromatous (BL), characterized by high bacterial burden (multibacillary), diffuse skin infiltration, and high transmission potential.
• Note: Healthy non-exposed individuals and BCG-vaccinated persons may exhibit a positive Mitsuda reaction due to cross-reactive mycobacterial immunity.`,
    interpretation: `Clinical Significance & Interpretation (Skin Test for Leprosy / Lepromin Test):
The Lepromin test (Mitsuda and Fernandez reactions) is a delayed-type hypersensitivity skin test used to assess cell-mediated immunity (CMI) to Mycobacterium leprae. It is primarily used for classification and prognosis of leprosy rather than initial diagnosis.

1. Reaction Types & Interpretation:
• Fernandez Reaction (Early Reaction, read at 48 hours): Erythema and induration > 10 mm indicates pre-existing delayed hypersensitivity to soluble M. leprae antigens.
• Mitsuda Reaction (Late Reaction, read at 21-28 days): Nodular induration > 5 mm indicates intact, functional cell-mediated immunity against M. leprae antigens.

2. Immunological & Prognostic Significance:
• Positive Mitsuda Test: Indicates strong cell-mediated immunity. Associated with Tuberculoid Leprosy (TT) or Borderline Tuberculoid (BT), characterized by low bacterial index (paucibacillary), localized granulomas, and favorable clinical prognosis.
• Negative Mitsuda Test: Indicates deficient cell-mediated immunity to M. leprae. Associated with Lepromatous Leprosy (LL) or Borderline Lepromatous (BL), characterized by high bacterial burden (multibacillary), diffuse skin infiltration, and high transmission potential.
• Note: Healthy non-exposed individuals and BCG-vaccinated persons may exhibit a positive Mitsuda reaction due to cross-reactive mycobacterial immunity.`,
    parameters: [
      {
        name: 'Skin test for Leprosy',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive (+)', isAbnormal: true },
          { value: 'Strongly Positive (++)', isAbnormal: true },
          { value: 'Equivocal / Doubtful', isAbnormal: false }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Stool/cs',
    title: 'Stool Culture and Sensitivity (Stool C/S)',
    basePrice: 600,
    taxPercentage: 0,
    sampleType: 'Fresh Stool / Feces (Sterile Container / Cary-Blair Transport)',
    turnaroundTime: '48 - 72 Hours',
    description: 'Microbiological culture, pathogen identification, and antibiotic susceptibility testing on stool specimens to isolate bacterial causes of acute gastroenteritis and dysentery.',
    notes: `Clinical Significance & Interpretation (Stool Culture & Sensitivity - Stool C/S):
Stool culture is performed to isolate and identify enteric bacterial pathogens responsible for infectious gastroenteritis, food poisoning, and bacterial dysentery, followed by antibiotic sensitivity testing.

1. Common Enteric Pathogens Isolated:
• Salmonella species (S. enterica, S. typhi): Causes acute enterocolitis, enteric fever.
• Shigella species (S. dysenteriae, S. flexneri, S. sonnei): Causes classic bacillary dysentery with bloody, mucoid stools.
• Vibrio cholerae: Causes severe secretory rice-water diarrhea and life-threatening dehydration.
• Campylobacter jejuni: Common cause of bacterial gastroenteritis and inflammatory enterocolitis.
• Enteropathogenic / Enterohemorrhagic E. coli (EPEC/EHEC): Associated with epidemic infantile diarrhea and Hemolytic Uremic Syndrome (HUS).

2. Clinical Guidance:
Isolation of normal commensal colonic flora is reported as "Normal Colonic Flora Grown / No Enteric Pathogen Isolated". In positive cultures, antimicrobial susceptibility testing (AST) guides targeted antibiotic therapy.`,
    interpretation: `Clinical Significance & Interpretation (Stool Culture & Sensitivity - Stool C/S):
Stool culture is performed to isolate and identify enteric bacterial pathogens responsible for infectious gastroenteritis, food poisoning, and bacterial dysentery, followed by antibiotic sensitivity testing.

1. Common Enteric Pathogens Isolated:
• Salmonella species (S. enterica, S. typhi): Causes acute enterocolitis, enteric fever.
• Shigella species (S. dysenteriae, S. flexneri, S. sonnei): Causes classic bacillary dysentery with bloody, mucoid stools.
• Vibrio cholerae: Causes severe secretory rice-water diarrhea and life-threatening dehydration.
• Campylobacter jejuni: Common cause of bacterial gastroenteritis and inflammatory enterocolitis.
• Enteropathogenic / Enterohemorrhagic E. coli (EPEC/EHEC): Associated with epidemic infantile diarrhea and Hemolytic Uremic Syndrome (HUS).

2. Clinical Guidance:
Isolation of normal commensal colonic flora is reported as "Normal Colonic Flora Grown / No Enteric Pathogen Isolated". In positive cultures, antimicrobial susceptibility testing (AST) guides targeted antibiotic therapy.`,
    parameters: [
      {
        name: 'Growth / Pathogen Isolated',
        referenceRange: 'No enteric pathogen isolated',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'Normal Colonic Flora Grown', isAbnormal: false },
          { value: 'No Pathogenic Organisms Isolated', isAbnormal: false },
          { value: 'Salmonella species isolated', isAbnormal: true },
          { value: 'Shigella species isolated', isAbnormal: true },
          { value: 'Vibrio cholerae isolated', isAbnormal: true },
          { value: 'Campylobacter jejuni isolated', isAbnormal: true },
          { value: 'Enteropathogenic E. coli isolated', isAbnormal: true }
        ],
        status: 'Active'
      },
      {
        name: 'Antibiotic Sensitivity',
        referenceRange: 'Sensitive to reported antibiotics',
        unit: '',
        gender: 'Both',
        fieldType: 'Text',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'SGPT',
    title: 'SGPT (ALT) - Alanine Aminotransferase',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Enzyme biomarker test measuring Serum Glutamic Pyruvic Transaminase (SGPT/ALT) to evaluate hepatic cellular integrity, parenchymal liver damage, and monitor hepatotoxic therapies.',
    notes: `Physiological basis:
Intracellular enzyme involved in amino acid metabolism. Present in large concentrations in liver, kidney; in smaller amounts, in skeletal muscle and heart. Released with tissue damage, particularly liver injury.

Interpretation:
Increased in: Acute viral hepatitis (ALT > AST), biliary tract obstruction (cholangitis, choledocholithiasis), alcoholic hepatitis and cirrhosis (AST > ALT), liver abscess, metastatic or primary liver cancer; nonalcoholic steatohepatitis; right heart failure, ischemia or hypoxia, injury to liver ("shock liver"), extensive trauma; drugs that cause cholestasis or hepatotoxicity.
Decreased in: Pyridoxine (vitamin B6) deficiency.

Comments:
ALT is the preferred enzyme for evaluation of liver injury.`,
    interpretation: `Physiological basis:
Intracellular enzyme involved in amino acid metabolism. Present in large concentrations in liver, kidney; in smaller amounts, in skeletal muscle and heart. Released with tissue damage, particularly liver injury.

Interpretation:
Increased in: Acute viral hepatitis (ALT > AST), biliary tract obstruction (cholangitis, choledocholithiasis), alcoholic hepatitis and cirrhosis (AST > ALT), liver abscess, metastatic or primary liver cancer; nonalcoholic steatohepatitis; right heart failure, ischemia or hypoxia, injury to liver ("shock liver"), extensive trauma; drugs that cause cholestasis or hepatotoxicity.
Decreased in: Pyridoxine (vitamin B6) deficiency.

Comments:
ALT is the preferred enzyme for evaluation of liver injury.`,
    parameters: [
      {
        name: 'SGPT (ALT)',
        referenceRange: '13 - 40',
        unit: 'U/l',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'SGOT',
    title: 'SGOT (AST) - Aspartate Aminotransferase',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Enzyme biomarker test measuring Serum Glutamic Oxaloacetic Transaminase (SGOT/AST) to evaluate hepatic and muscular cellular integrity, parenchymal tissue damage, and AST/ALT de Ritis ratio.',
    notes: `Physiological basis:
Intracellular enzyme involved in amino acid metabolism. Present in large concentrations in liver, skeletal muscle, brain, red cells, and heart. Released into the bloodstream when tissue is damaged, especially in liver injury.

Interpretation:
Increased in: Acute viral hepatitis (ALT > AST), biliary tract obstruction (cholangitis, choledocholithiasis), alcoholic hepatitis and cirrhosis (AST > ALT), liver abscess, metastatic or primary liver cancer; right heart failure, ischemic or hypoxic injury to liver ("shock liver"), extensive trauma. Drugs that cause cholestasis or hepatotoxicity.
Decreased in: Pyridoxine (vitamin B6) deficiency

Comments:
Test is not indicated for diagnosis of myocardial infarction.
AST/ALT ratio >1 suggests cirrhosis in patients with hepatitis C`,
    interpretation: `Physiological basis:
Intracellular enzyme involved in amino acid metabolism. Present in large concentrations in liver, skeletal muscle, brain, red cells, and heart. Released into the bloodstream when tissue is damaged, especially in liver injury.

Interpretation:
Increased in: Acute viral hepatitis (ALT > AST), biliary tract obstruction (cholangitis, choledocholithiasis), alcoholic hepatitis and cirrhosis (AST > ALT), liver abscess, metastatic or primary liver cancer; right heart failure, ischemic or hypoxic injury to liver ("shock liver"), extensive trauma. Drugs that cause cholestasis or hepatotoxicity.
Decreased in: Pyridoxine (vitamin B6) deficiency

Comments:
Test is not indicated for diagnosis of myocardial infarction.
AST/ALT ratio >1 suggests cirrhosis in patients with hepatitis C`,
    parameters: [
      {
        name: 'SGOT (AST)',
        referenceRange: '0 - 37',
        unit: 'U/l',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Zinc',
    title: 'Serum Zinc (Trace Element)',
    basePrice: 900,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Trace Element-Free Plain / Royal Blue Tube)',
    turnaroundTime: '24 - 48 Hours',
    description: 'Trace element biomarker quantitative assay measuring serum zinc levels to diagnose zinc nutritional deficiency, acrodermatitis enteropathica, chronic malabsorption, and monitor trace element therapy.',
    notes: `Clinical Significance & Interpretation (Serum Zinc):
Zinc (Zn) is an essential trace element and vital cofactor for more than 300 metalloenzymes (including carbonic anhydrase, alkaline phosphatase, RNA/DNA polymerases, and superoxide dismutase). It plays crucial roles in cellular growth, DNA synthesis, protein metabolism, wound healing, immune function, and spermatogenesis.

1. Reference Interval:
• Normal Serum Zinc: 70 - 120 µg/dL

2. Clinical Implications of Decreased Levels (< 70 µg/dL):
• Inadequate Dietary Intake & Malnutrition: Protein-energy malnutrition, total parenteral nutrition (TPN) without trace element supplementation, anorexia nervosa.
• Gastrointestinal Malabsorption: Celiac disease, Crohn's disease, short bowel syndrome, chronic diarrhea, bariatric surgery.
• Acrodermatitis Enteropathica: Rare autosomal recessive genetic disorder causing severe zinc malabsorption, characterized by periorificial dermatitis, alopecia, chronic diarrhea, and delayed development.
• Increased Losses & Increased Demand: Chronic alcoholism (increased urinary excretion), severe thermal burns, chronic kidney disease (hemodialysis), pregnancy, and lactation.
• Clinical Manifestations of Deficiency: Impaired wound healing, recurrent infections, growth retardation, hypogonadism, skin lesions, alopecia, impaired taste (hypogeusia) and smell (hyposmia), night blindness, and neuropsychiatric disturbances.

3. Clinical Implications of Elevated Levels (> 120 µg/dL):
• Occupational / Industrial Inhalation (Zinc Fume Fever): Inhalation of zinc oxide fumes during welding or metal galvanization.
• Excessive Supplementation / Toxicity: Ingestion of high-dose zinc supplements or zinc-containing dental adhesives, which can induce secondary copper deficiency, sideroblastic anemia, and neutropenia.

4. Pre-analytical Considerations:
• Diurnal Variation: Serum zinc levels peak in the morning (by ~10-15%) and decrease in the evening. Fasting morning collection is recommended.
• Contamination Avoidance: Use trace element-free collection tubes (e.g., Royal Blue top) to prevent environmental zinc contamination. Hemolysis must be avoided as erythrocytes contain high concentrations of zinc.`,
    interpretation: `Clinical Significance & Interpretation (Serum Zinc):
Zinc (Zn) is an essential trace element and vital cofactor for more than 300 metalloenzymes (including carbonic anhydrase, alkaline phosphatase, RNA/DNA polymerases, and superoxide dismutase). It plays crucial roles in cellular growth, DNA synthesis, protein metabolism, wound healing, immune function, and spermatogenesis.

1. Reference Interval:
• Normal Serum Zinc: 70 - 120 µg/dL

2. Clinical Implications of Decreased Levels (< 70 µg/dL):
• Inadequate Dietary Intake & Malnutrition: Protein-energy malnutrition, total parenteral nutrition (TPN) without trace element supplementation, anorexia nervosa.
• Gastrointestinal Malabsorption: Celiac disease, Crohn's disease, short bowel syndrome, chronic diarrhea, bariatric surgery.
• Acrodermatitis Enteropathica: Rare autosomal recessive genetic disorder causing severe zinc malabsorption, characterized by periorificial dermatitis, alopecia, chronic diarrhea, and delayed development.
• Increased Losses & Increased Demand: Chronic alcoholism (increased urinary excretion), severe thermal burns, chronic kidney disease (hemodialysis), pregnancy, and lactation.
• Clinical Manifestations of Deficiency: Impaired wound healing, recurrent infections, growth retardation, hypogonadism, skin lesions, alopecia, impaired taste (hypogeusia) and smell (hyposmia), night blindness, and neuropsychiatric disturbances.

3. Clinical Implications of Elevated Levels (> 120 µg/dL):
• Occupational / Industrial Inhalation (Zinc Fume Fever): Inhalation of zinc oxide fumes during welding or metal galvanization.
• Excessive Supplementation / Toxicity: Ingestion of high-dose zinc supplements or zinc-containing dental adhesives, which can induce secondary copper deficiency, sideroblastic anemia, and neutropenia.

4. Pre-analytical Considerations:
• Diurnal Variation: Serum zinc levels peak in the morning (by ~10-15%) and decrease in the evening. Fasting morning collection is recommended.
• Contamination Avoidance: Use trace element-free collection tubes (e.g., Royal Blue top) to prevent environmental zinc contamination. Hemolysis must be avoided as erythrocytes contain high concentrations of zinc.`,
    parameters: [
      {
        name: 'Serum Zinc',
        referenceRange: '70 - 120',
        unit: 'µg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Urea',
    title: 'Serum Urea (Blood Urea Nitrogen / Urea)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Plasma (Plain / Gel / Heparin Tube)',
    turnaroundTime: 'Same Day',
    description: 'Renal function biomarker measuring serum urea concentration to assess glomerular filtration, nitrogenous waste clearance, hydration status, and monitor renal disease progression.',
    notes: `Interpretation:
Urea is derived in the liver from amino acids and therefore from protein, whether originating from the diet or from tissues. The normal kidney can excrete large amounts of urea. If the rate of production exceeds the rate of clearance, plasma concentrations rise. The rate of production is accelerated by:
- a high-protein diet
- absorption of amino acids and peptides from digested blood after hemorrhage into the gastrointestinal lumen or soft tissues
- increased catabolism due to starvation, tissue damage, sepsis or steroid treatment.
In catabolic states, glomerular function is often impaired due to circulatory factors and this contributes more to the uraemia than does increased production. Conversely, the plasma urea concentration may be lower than 1.0 mmol/L, the causes of which include the following:

Due to increased GFR or haemodilution:
• Pregnancy
• Overenthusiastic intravenous infusion
• 'Inappropriate' ADH secretion (SIADH)

Due to decreased synthesis:
• Use of amino acids for protein anabolism during growth, especially in children
• Low protein intake, very severe liver disease
• Inborn errors of the urea cycle are rare and usually only occur in infants.`,
    interpretation: `Interpretation:
Urea is derived in the liver from amino acids and therefore from protein, whether originating from the diet or from tissues. The normal kidney can excrete large amounts of urea. If the rate of production exceeds the rate of clearance, plasma concentrations rise. The rate of production is accelerated by:
- a high-protein diet
- absorption of amino acids and peptides from digested blood after hemorrhage into the gastrointestinal lumen or soft tissues
- increased catabolism due to starvation, tissue damage, sepsis or steroid treatment.
In catabolic states, glomerular function is often impaired due to circulatory factors and this contributes more to the uraemia than does increased production. Conversely, the plasma urea concentration may be lower than 1.0 mmol/L, the causes of which include the following:

Due to increased GFR or haemodilution:
• Pregnancy
• Overenthusiastic intravenous infusion
• 'Inappropriate' ADH secretion (SIADH)

Due to decreased synthesis:
• Use of amino acids for protein anabolism during growth, especially in children
• Low protein intake, very severe liver disease
• Inborn errors of the urea cycle are rare and usually only occur in infants.`,
    parameters: [
      {
        name: 'Serum Urea',
        referenceRange: '19 - 45',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Sodium',
    title: 'Serum Sodium (Na+)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Heparin Plasma (Plain / Gel / Lithium Heparin Tube)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative electrolyte assay measuring serum sodium concentration to assess fluid and electrolyte balance, osmolality, hydration status, and renal/endocrine disorders.',
    notes: `Physiologic Basis
Sodium is the predominant extracellular cation. The serum sodium level is primarily determined by the volume status of the individual. Hyponatremia can be divided into hypovolemia, euvolemia, and hypervolemia categories.

Interpretation
Increased in: Dehydration (excessive sweating, severe vomiting, or diarrhea), polyuria (diabetes mellitus, diabetes insipidus), hyperaldosteronism, inadequate water intake (coma, hypothalamic disease).
Drugs: steroids, licorice, oral contraceptives.
Decreased in: CHF, cirrhosis, vomiting, diarrhea, exercise, excessive sweating (with replacement of water but not salt, eg, marathon running), salt-losing nephropathy, adrenal insufficiency, nephrotic syndrome, water intoxication, syndrome of inappropriate antidiuretic hormone (SIADH), AIDS.
Drugs: thiazides, diuretics, ACE inhibitors, chlorpropamide, carbamazepine, antidepressants (SSRI), antipsychotics.

Comments
Hyponatremia in a normovolemic patient with urine osmolality higher than serum (or plasma) osmolality suggests the possibility of SIADH, myxedema, hypopituitarism, or reset osmostat. Treatment of disorders of sodium balance relies on clinical assessment of the patient's extracellular fluid volume rather than the serum sodium.`,
    interpretation: `Physiologic Basis
Sodium is the predominant extracellular cation. The serum sodium level is primarily determined by the volume status of the individual. Hyponatremia can be divided into hypovolemia, euvolemia, and hypervolemia categories.

Interpretation
Increased in: Dehydration (excessive sweating, severe vomiting, or diarrhea), polyuria (diabetes mellitus, diabetes insipidus), hyperaldosteronism, inadequate water intake (coma, hypothalamic disease).
Drugs: steroids, licorice, oral contraceptives.
Decreased in: CHF, cirrhosis, vomiting, diarrhea, exercise, excessive sweating (with replacement of water but not salt, eg, marathon running), salt-losing nephropathy, adrenal insufficiency, nephrotic syndrome, water intoxication, syndrome of inappropriate antidiuretic hormone (SIADH), AIDS.
Drugs: thiazides, diuretics, ACE inhibitors, chlorpropamide, carbamazepine, antidepressants (SSRI), antipsychotics.

Comments
Hyponatremia in a normovolemic patient with urine osmolality higher than serum (or plasma) osmolality suggests the possibility of SIADH, myxedema, hypopituitarism, or reset osmostat. Treatment of disorders of sodium balance relies on clinical assessment of the patient's extracellular fluid volume rather than the serum sodium.`,
    parameters: [
      {
        name: 'Serum Sodium',
        referenceRange: '136 - 146',
        unit: 'mmol/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Protein',
    title: 'Serum Protein (Total Protein)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative assay measuring total serum protein concentration (albumin and globulins) to evaluate nutritional status, hepatic synthesis capacity, renal protein loss, and monoclonal gammopathies.',
    notes: `Physiological basis
Plasma protein concentration is determined by nutritional state, hepatic function, renal function, hydration, and various disease states. Plasma protein concentration determines the colloidal osmotic pressure.

Interpretation
Increased in: Polyclonal or monoclonal gammopathies, marked dehydration. Drugs: anabolic steroids, androgens, corticosteroids, epinephrine.
Decreased in: Protein-losing enteropathies, acute burns, nephrotic syndrome, severe dietary protein deficiency, chronic liver disease, malabsorption syndrome, agammaglobulinemia, cancer cachexia.

Comments
Serum total protein consists primarily of albumin and globulin. Serum globulin level is calculated as total protein minus albumin. Hypoproteinemia usually indicates hypoalbuminemia, because albumin is the major serum protein`,
    interpretation: `Physiological basis
Plasma protein concentration is determined by nutritional state, hepatic function, renal function, hydration, and various disease states. Plasma protein concentration determines the colloidal osmotic pressure.

Interpretation
Increased in: Polyclonal or monoclonal gammopathies, marked dehydration. Drugs: anabolic steroids, androgens, corticosteroids, epinephrine.
Decreased in: Protein-losing enteropathies, acute burns, nephrotic syndrome, severe dietary protein deficiency, chronic liver disease, malabsorption syndrome, agammaglobulinemia, cancer cachexia.

Comments
Serum total protein consists primarily of albumin and globulin. Serum globulin level is calculated as total protein minus albumin. Hypoproteinemia usually indicates hypoalbuminemia, because albumin is the major serum protein`,
    parameters: [
      {
        name: 'Serum Protein',
        referenceRange: '6.4 - 8.3',
        unit: 'g/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Potassium',
    title: 'Serum Potassium (K+)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Heparin Plasma (Plain / Gel / Lithium Heparin Tube)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative electrolyte assay measuring serum potassium concentration to evaluate neuromuscular excitability, cardiac conduction, acid-base homeostasis, and renal excretion disorders.',
    notes: `Physiologic Basis
Potassium is predominantly an intracellular cation whose plasma level is regulated by renal excretion. Elevated or depressed potassium concentrations interfere with muscle contraction.

Interpretation
Increased in: Massive hemolysis, severe tissue damage, rhabdomyolysis, acidosis, dehydration, acute or chronic renal failure, Addison disease, renal tubular acidosis type IV (hyporeninemic) hypoaldosteronism, (hyperkalemic) familial periodic paralysis, exercise (transient).
Drugs: potassium salts, potassium-sparing diuretics (eg, spironolactone, triamterene, eplerenone), nonsteroidal anti-inflammatory drugs, β-blockers, ACE inhibitors, ACE-receptor blockers, high-dose trimethoprim-sulfamethoxazole.
Decreased in: Low potassium intake, prolonged vomiting or diarrhea, renal tubular acidosis types I and II, hyperaldosteronism, Cushing syndrome, osmotic diuresis (eg, hyperglycemia), alkalosis, (hypokalemic) familial periodic paralysis, trauma (transient), subarachnoid hemorrhage, genetic hypokalemic salt-losing tubulopathies such as Gitelman syndrome (familial hypokalemia- hypocalcemia-hypomagnesemia).
Drugs: adrenergic agents (isoproterenol), diuretics.

Comments
Spurious hyperkalemia can occur with hemolysis of a sample, delayed separation of serum from erythrocytes, prolonged fist clenching during blood drawing, and prolonged tourniquet application.`,
    interpretation: `Physiologic Basis
Potassium is predominantly an intracellular cation whose plasma level is regulated by renal excretion. Elevated or depressed potassium concentrations interfere with muscle contraction.

Interpretation
Increased in: Massive hemolysis, severe tissue damage, rhabdomyolysis, acidosis, dehydration, acute or chronic renal failure, Addison disease, renal tubular acidosis type IV (hyporeninemic) hypoaldosteronism, (hyperkalemic) familial periodic paralysis, exercise (transient).
Drugs: potassium salts, potassium-sparing diuretics (eg, spironolactone, triamterene, eplerenone), nonsteroidal anti-inflammatory drugs, β-blockers, ACE inhibitors, ACE-receptor blockers, high-dose trimethoprim-sulfamethoxazole.
Decreased in: Low potassium intake, prolonged vomiting or diarrhea, renal tubular acidosis types I and II, hyperaldosteronism, Cushing syndrome, osmotic diuresis (eg, hyperglycemia), alkalosis, (hypokalemic) familial periodic paralysis, trauma (transient), subarachnoid hemorrhage, genetic hypokalemic salt-losing tubulopathies such as Gitelman syndrome (familial hypokalemia- hypocalcemia-hypomagnesemia).
Drugs: adrenergic agents (isoproterenol), diuretics.

Comments
Spurious hyperkalemia can occur with hemolysis of a sample, delayed separation of serum from erythrocytes, prolonged fist clenching during blood drawing, and prolonged tourniquet application.`,
    parameters: [
      {
        name: 'Serum Potassium',
        referenceRange: '3.5 - 5.1',
        unit: 'mmol/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Phosphorus',
    title: 'Serum Phosphorus (Inorganic Phosphate)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative assay measuring serum inorganic phosphorus (phosphate) to evaluate mineral and bone metabolism, parathyroid disorders, vitamin D status, and renal tubular function.',
    notes: `Physiologic Basis
The plasma concentration of inorganic phosphate is determined by parathyroid gland function, action of vitamin D, intestinal absorption, renal function, bone metabolism, and nutrition. Serum phosphorus concentrations have a circadian rhythm (highest level in late morning, lowest in evening) and are subject to rapid change secondary to environmental factors such as diet (carbohydrate), phosphate binding antacids, and fluctuations in GH, insulin, and renal function.

Interpretation
Increased in:
Renal failure, Massive blood transfusion, hypoparathyroidism, neoplasms, adrenal insufficiency, hypervitaminosis D, osteolytic metastases to bone, leukemia, Pseudohypoparathyroidism, Cirrhosis, lactic acidosis.
Drugs: phosphate infusions or enemas, anabolic steroids, ergocalciferol, furosemide, hydrochlorothiazide, clonidine, verapamil, potassium supplements

Decreased in:
Hyperparathyroidism, hypovitaminosis D, starvation or cachexia, refeeding syndrome, bone marrow transplantation, GH deficiency, chronic alcoholism, Severe diarrhea, acute pancreatitis, severe hypercalcemia, acid-base disturbances, hypokalemia, hemodialysis.
Drugs: acetazolamide, phosphate-binding antacids, anticonvulsants, β-adrenergic agonists, catecholamines, estrogens, isoniazid, oral contraceptives, prolonged use of thiazides, glucose infusion, insulin therapy, salicylates (toxicity).`,
    interpretation: `Physiologic Basis
The plasma concentration of inorganic phosphate is determined by parathyroid gland function, action of vitamin D, intestinal absorption, renal function, bone metabolism, and nutrition. Serum phosphorus concentrations have a circadian rhythm (highest level in late morning, lowest in evening) and are subject to rapid change secondary to environmental factors such as diet (carbohydrate), phosphate binding antacids, and fluctuations in GH, insulin, and renal function.

Interpretation
Increased in:
Renal failure, Massive blood transfusion, hypoparathyroidism, neoplasms, adrenal insufficiency, hypervitaminosis D, osteolytic metastases to bone, leukemia, Pseudohypoparathyroidism, Cirrhosis, lactic acidosis.
Drugs: phosphate infusions or enemas, anabolic steroids, ergocalciferol, furosemide, hydrochlorothiazide, clonidine, verapamil, potassium supplements

Decreased in:
Hyperparathyroidism, hypovitaminosis D, starvation or cachexia, refeeding syndrome, bone marrow transplantation, GH deficiency, chronic alcoholism, Severe diarrhea, acute pancreatitis, severe hypercalcemia, acid-base disturbances, hypokalemia, hemodialysis.
Drugs: acetazolamide, phosphate-binding antacids, anticonvulsants, β-adrenergic agonists, catecholamines, estrogens, isoniazid, oral contraceptives, prolonged use of thiazides, glucose infusion, insulin therapy, salicylates (toxicity).`,
    parameters: [
      {
        name: 'Serum Phosphorus',
        referenceRange: '2.5 - 4.5',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum LDH',
    title: 'Serum LDH (Lactate Dehydrogenase)',
    basePrice: 300,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube - Non-hemolyzed)',
    turnaroundTime: 'Same Day',
    description: 'Enzyme quantitative assay measuring serum lactate dehydrogenase (LDH) activity to assess tissue turnover, hemolysis, myocardial/pulmonary injury, and monitor hematologic malignancies/lymphomas.',
    notes: `Clinical Significance & Interpretation (Serum Lactate Dehydrogenase - LDH):
Lactate dehydrogenase (LDH) is an intracellular zinc metalloenzyme that catalyzes the reversible interconversion of lactate and pyruvate in anaerobic glycolysis. LDH is widely distributed in nearly all major body tissues, with highest concentrations in myocardium, erythrocytes, liver, kidneys, skeletal muscle, lungs, and lymphoreticular system.

1. Reference Interval:
• Normal Serum LDH: 140 - 280 U/L

2. Clinical Implications of Elevated Serum LDH (> 280 U/L):
• Hematologic & Hemolytic Disorders: Intravascular hemolysis, megaloblastic anemia (B12 / folate deficiency — marked elevation due to ineffective erythropoiesis), sickle cell crisis, autoimmune hemolytic anemia, thrombotic thrombocytopenic purpura (TTP).
• Malignancies & Tumor Marker Role: Non-Hodgkin lymphoma, Hodgkin lymphoma, acute and chronic leukemias, germ cell tumors (seminoma, dysgerminoma), metastatic carcinoma, neuroblastoma, melanoma. Serum LDH correlates with overall tumor burden, growth kinetics, and cellular turnover.
• Cardiac & Tissue Ischemia: Acute myocardial infarction (peaks at 48-72 hours, remains elevated 10-14 days), pulmonary embolism, renal infarction, mesenteric ischemia.
• Hepatic & Muscle Pathology: Acute viral hepatitis, toxic/ischemic hepatitis, rhabdomyolysis, progressive muscular dystrophy, extensive polymyositis.
• Infectious & Pulmonary Diseases: Severe pneumonia, Pneumocystis jirovecii pneumonia (PCP in immunocompromised patients), sepsis, severe COVID-19/ARDS (reflecting systemic inflammatory damage).

3. Pre-analytical Considerations & Pitfalls:
• Hemolysis: Erythrocytes contain ~150-fold higher LDH concentration than serum. Even minor in vitro hemolysis causes false elevation (spurious hyper-LDH).
• Specimen Handling: Serum must be promptly separated from the clot. Avoid freezing/thawing or extreme temperatures.`,
    interpretation: `Clinical Significance & Interpretation (Serum Lactate Dehydrogenase - LDH):
Lactate dehydrogenase (LDH) is an intracellular zinc metalloenzyme that catalyzes the reversible interconversion of lactate and pyruvate in anaerobic glycolysis. LDH is widely distributed in nearly all major body tissues, with highest concentrations in myocardium, erythrocytes, liver, kidneys, skeletal muscle, lungs, and lymphoreticular system.

1. Reference Interval:
• Normal Serum LDH: 140 - 280 U/L

2. Clinical Implications of Elevated Serum LDH (> 280 U/L):
• Hematologic & Hemolytic Disorders: Intravascular hemolysis, megaloblastic anemia (B12 / folate deficiency — marked elevation due to ineffective erythropoiesis), sickle cell crisis, autoimmune hemolytic anemia, thrombotic thrombocytopenic purpura (TTP).
• Malignancies & Tumor Marker Role: Non-Hodgkin lymphoma, Hodgkin lymphoma, acute and chronic leukemias, germ cell tumors (seminoma, dysgerminoma), metastatic carcinoma, neuroblastoma, melanoma. Serum LDH correlates with overall tumor burden, growth kinetics, and cellular turnover.
• Cardiac & Tissue Ischemia: Acute myocardial infarction (peaks at 48-72 hours, remains elevated 10-14 days), pulmonary embolism, renal infarction, mesenteric ischemia.
• Hepatic & Muscle Pathology: Acute viral hepatitis, toxic/ischemic hepatitis, rhabdomyolysis, progressive muscular dystrophy, extensive polymyositis.
• Infectious & Pulmonary Diseases: Severe pneumonia, Pneumocystis jirovecii pneumonia (PCP in immunocompromised patients), sepsis, severe COVID-19/ARDS (reflecting systemic inflammatory damage).

3. Pre-analytical Considerations & Pitfalls:
• Hemolysis: Erythrocytes contain ~150-fold higher LDH concentration than serum. Even minor in vitro hemolysis causes false elevation (spurious hyper-LDH).
• Specimen Handling: Serum must be promptly separated from the clot. Avoid freezing/thawing or extreme temperatures.`,
    parameters: [
      {
        name: 'Serum LDH',
        referenceRange: '140 - 280',
        unit: 'U/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum IgM',
    title: 'Serum IgM (Immunoglobulin M)',
    basePrice: 650,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative nephelometric/turbidimetric immunoassay measuring serum Immunoglobulin M (IgM) to evaluate acute immune response, humoral immunodeficiencies, Waldenström macroglobulinemia, and congenital or autoimmune disorders.',
    notes: `Clinical Significance & Interpretation (Serum Immunoglobulin M - IgM):
Immunoglobulin M (IgM) is a high molecular weight pentameric antibody and the primary immunoglobulin synthesized during the early initial immune response to antigenic challenge. It provides early-phase protective humoral immunity against bacterial, viral, and parasitic bloodstream pathogens.

1. Reference Interval:
• Normal Serum IgM: 400 - 2,500 µg/mL (40 - 250 mg/dL)

2. Clinical Implications of Elevated Serum IgM (> 2,500 µg/mL):
• Monoclonal Gammopathy: Waldenström's macroglobulinemia (monoclonal IgM spike producing hyperviscosity syndrome), IgM-MGUS (Monoclonal Gammopathy of Undetermined Significance), non-Hodgkin lymphoma.
• Acute & Recent Infections: Viral hepatitis (HAV, HBV, HCV), infectious mononucleosis (EBV), Cytomegalovirus (CMV), Mycoplasma pneumoniae, Toxoplasmosis, Rubella, acute bacterial bacteremia.
• Autoimmune & Inflammatory Diseases: Primary biliary cholangitis (PBC / primary biliary cirrhosis - classic polyclonal IgM elevation), rheumatoid arthritis (rheumatoid factor is primarily IgM), systemic lupus erythematosus (SLE).
• Congenital / Neonatal Infection: Elevated cord blood IgM indicates intrauterine congenital infection (TORCH panel pathogens).

3. Clinical Implications of Decreased Serum IgM (< 400 µg/mL):
• Primary Immunodeficiency Disorders: Selective IgM deficiency, Common Variable Immunodeficiency (CVID), severe combined immunodeficiency (SCID), X-linked agammaglobulinemia (Bruton's).
• Secondary Hypogammaglobulinemia: Multiple myeloma (IgG/IgA types with suppressed non-involved IgM), chronic lymphocytic leukemia (CLL), amyloidosis, severe protein loss (nephrotic syndrome, protein-losing enteropathy), immunosuppressive/cytotoxic therapy.`,
    interpretation: `Clinical Significance & Interpretation (Serum Immunoglobulin M - IgM):
Immunoglobulin M (IgM) is a high molecular weight pentameric antibody and the primary immunoglobulin synthesized during the early initial immune response to antigenic challenge. It provides early-phase protective humoral immunity against bacterial, viral, and parasitic bloodstream pathogens.

1. Reference Interval:
• Normal Serum IgM: 400 - 2,500 µg/mL (40 - 250 mg/dL)

2. Clinical Implications of Elevated Serum IgM (> 2,500 µg/mL):
• Monoclonal Gammopathy: Waldenström's macroglobulinemia (monoclonal IgM spike producing hyperviscosity syndrome), IgM-MGUS (Monoclonal Gammopathy of Undetermined Significance), non-Hodgkin lymphoma.
• Acute & Recent Infections: Viral hepatitis (HAV, HBV, HCV), infectious mononucleosis (EBV), Cytomegalovirus (CMV), Mycoplasma pneumoniae, Toxoplasmosis, Rubella, acute bacterial bacteremia.
• Autoimmune & Inflammatory Diseases: Primary biliary cholangitis (PBC / primary biliary cirrhosis - classic polyclonal IgM elevation), rheumatoid arthritis (rheumatoid factor is primarily IgM), systemic lupus erythematosus (SLE).
• Congenital / Neonatal Infection: Elevated cord blood IgM indicates intrauterine congenital infection (TORCH panel pathogens).

3. Clinical Implications of Decreased Serum IgM (< 400 µg/mL):
• Primary Immunodeficiency Disorders: Selective IgM deficiency, Common Variable Immunodeficiency (CVID), severe combined immunodeficiency (SCID), X-linked agammaglobulinemia (Bruton's).
• Secondary Hypogammaglobulinemia: Multiple myeloma (IgG/IgA types with suppressed non-involved IgM), chronic lymphocytic leukemia (CLL), amyloidosis, severe protein loss (nephrotic syndrome, protein-losing enteropathy), immunosuppressive/cytotoxic therapy.`,
    parameters: [
      {
        name: 'Serum IgM',
        referenceRange: '400 - 2,500',
        unit: 'µg/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Electrolyte',
    title: 'Serum Electrolyte (Serum Electrolytes - Na+, K+)',
    basePrice: 300,
    taxPercentage: 0,
    sampleType: 'Blood Serum / Heparin Plasma (Plain / Gel / Lithium Heparin Tube)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative electrolyte panel measuring serum sodium and potassium concentrations to evaluate fluid-electrolyte balance, renal function, hydration status, and neuromuscular homeostasis.',
    notes: `SERUM SODIUM (Na+):
Physiologic Basis
Sodium is the predominant extracellular cation. The serum sodium level is primarily determined by the volume status of the individual. Hyponatremia can be divided into hypovolemia, euvolemia, and hypervolemia categories.

Interpretation
Increased in: Dehydration (excessive sweating, severe vomiting, or diarrhea), polyuria (diabetes mellitus, diabetes insipidus), hyperaldosteronism, inadequate water intake (coma, hypothalamic disease).
Drugs: steroids, licorice, oral contraceptives.
Decreased in: CHF, cirrhosis, vomiting, diarrhea, exercise, excessive sweating (with replacement of water but not salt, eg, marathon running), salt-losing nephropathy, adrenal insufficiency, nephrotic syndrome, water intoxication, syndrome of inappropriate antidiuretic hormone (SIADH), AIDS.
Drugs: thiazides, diuretics, ACE inhibitors, chlorpropamide, carbamazepine, antidepressants (SSRI), antipsychotics.

Comments
Hyponatremia in a normovolemic patient with urine osmolality higher than serum (or plasma) osmolality suggests the possibility of SIADH, myxedema, hypopituitarism, or reset osmostat. Treatment of disorders of sodium balance relies on clinical assessment of the patient's extracellular fluid volume rather than the serum sodium.

--------------------------------------------------

SERUM POTASSIUM (K+):
Physiologic Basis
Potassium is predominantly an intracellular cation whose plasma level is regulated by renal excretion. Elevated or depressed potassium concentrations interfere with muscle contraction.

Interpretation
Increased in: Massive hemolysis, severe tissue damage, rhabdomyolysis, acidosis, dehydration, acute or chronic renal failure, Addison disease, renal tubular acidosis type IV (hyporeninemic) hypoaldosteronism, (hyperkalemic) familial periodic paralysis, exercise (transient).
Drugs: potassium salts, potassium-sparing diuretics (eg, spironolactone, triamterene, eplerenone), nonsteroidal anti-inflammatory drugs, β-blockers, ACE inhibitors, ACE-receptor blockers, high-dose trimethoprim-sulfamethoxazole.
Decreased in: Low potassium intake, prolonged vomiting or diarrhea, renal tubular acidosis types I and II, hyperaldosteronism, Cushing syndrome, osmotic diuresis (eg, hyperglycemia), alkalosis, (hypokalemic) familial periodic paralysis, trauma (transient), subarachnoid hemorrhage, genetic hypokalemic salt-losing tubulopathies such as Gitelman syndrome (familial hypokalemia- hypocalcemia-hypomagnesemia).
Drugs: adrenergic agents (isoproterenol), diuretics.

Comments
Spurious hyperkalemia can occur with hemolysis of a sample, delayed separation of serum from erythrocytes, prolonged fist clenching during blood drawing, and prolonged tourniquet placement. Very high white blood cell or platelet counts may cause spurious elevation of serum potassium, but plasma potassium levels are normal.`,
    interpretation: `SERUM SODIUM (Na+):
Physiologic Basis
Sodium is the predominant extracellular cation. The serum sodium level is primarily determined by the volume status of the individual. Hyponatremia can be divided into hypovolemia, euvolemia, and hypervolemia categories.

Interpretation
Increased in: Dehydration (excessive sweating, severe vomiting, or diarrhea), polyuria (diabetes mellitus, diabetes insipidus), hyperaldosteronism, inadequate water intake (coma, hypothalamic disease).
Drugs: steroids, licorice, oral contraceptives.
Decreased in: CHF, cirrhosis, vomiting, diarrhea, exercise, excessive sweating (with replacement of water but not salt, eg, marathon running), salt-losing nephropathy, adrenal insufficiency, nephrotic syndrome, water intoxication, syndrome of inappropriate antidiuretic hormone (SIADH), AIDS.
Drugs: thiazides, diuretics, ACE inhibitors, chlorpropamide, carbamazepine, antidepressants (SSRI), antipsychotics.

Comments
Hyponatremia in a normovolemic patient with urine osmolality higher than serum (or plasma) osmolality suggests the possibility of SIADH, myxedema, hypopituitarism, or reset osmostat. Treatment of disorders of sodium balance relies on clinical assessment of the patient's extracellular fluid volume rather than the serum sodium.

--------------------------------------------------

SERUM POTASSIUM (K+):
Physiologic Basis
Potassium is predominantly an intracellular cation whose plasma level is regulated by renal excretion. Elevated or depressed potassium concentrations interfere with muscle contraction.

Interpretation
Increased in: Massive hemolysis, severe tissue damage, rhabdomyolysis, acidosis, dehydration, acute or chronic renal failure, Addison disease, renal tubular acidosis type IV (hyporeninemic) hypoaldosteronism, (hyperkalemic) familial periodic paralysis, exercise (transient).
Drugs: potassium salts, potassium-sparing diuretics (eg, spironolactone, triamterene, eplerenone), nonsteroidal anti-inflammatory drugs, β-blockers, ACE inhibitors, ACE-receptor blockers, high-dose trimethoprim-sulfamethoxazole.
Decreased in: Low potassium intake, prolonged vomiting or diarrhea, renal tubular acidosis types I and II, hyperaldosteronism, Cushing syndrome, osmotic diuresis (eg, hyperglycemia), alkalosis, (hypokalemic) familial periodic paralysis, trauma (transient), subarachnoid hemorrhage, genetic hypokalemic salt-losing tubulopathies such as Gitelman syndrome (familial hypokalemia- hypocalcemia-hypomagnesemia).
Drugs: adrenergic agents (isoproterenol), diuretics.

Comments
Spurious hyperkalemia can occur with hemolysis of a sample, delayed separation of serum from erythrocytes, prolonged fist clenching during blood drawing, and prolonged tourniquet placement. Very high white blood cell or platelet counts may cause spurious elevation of serum potassium, but plasma potassium levels are normal.`,
    parameters: [
      {
        name: 'Serum Sodium',
        referenceRange: '136 - 146',
        unit: 'mmol/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      },
      {
        name: 'Serum Potassium',
        referenceRange: '3.5 - 5.1',
        unit: 'mmol/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Albumin',
    title: 'Serum Albumin',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative assay measuring serum albumin concentration to evaluate hepatic synthesis capacity, nutritional status, renal protein-losing nephropathies, and oncotic pressure regulation.',
    notes: `Physiologic Basis
Major components of plasma proteins are influenced by nutritional state, hepatic function, renal function, and various diseases. It is a major binding protein, although there are more than 50 different genetic variants (alloalbumins), only occasionally does a mutation cause abnormal binding (eg, in familial dysalbuminemic hyperthyroxinemia).

Interpretation
Increased in: Dehydration, shock, hemoconcentration.
Decreased in: Decreased hepatic synthesis (chronic liver disease, malnutrition, malabsorption, malignancy, congenital analbuminemia [rare]). Increased losses (nephrotic syndrome, burns, trauma, hemorrhage with fluid replacement, fistulas, enteropathy, acute or chronic glomerulonephritis). Hemodilution (pregnancy, CHF). Drugs: estrogens.

Comments
Serum albumin indicates severity in chronic liver disease.
Useful in nutritional assessment if there is no impairment in production or increased loss of albumin. Independent risk factor for all-cause mortality in the elderly (age >70) and for complications in hospitalized and post-surgical patients.
There is a 10% reduction in serum albumin level in late pregnancy (related to hemodilution).`,
    interpretation: `Physiologic Basis
Major components of plasma proteins are influenced by nutritional state, hepatic function, renal function, and various diseases. It is a major binding protein, although there are more than 50 different genetic variants (alloalbumins), only occasionally does a mutation cause abnormal binding (eg, in familial dysalbuminemic hyperthyroxinemia).

Interpretation
Increased in: Dehydration, shock, hemoconcentration.
Decreased in: Decreased hepatic synthesis (chronic liver disease, malnutrition, malabsorption, malignancy, congenital analbuminemia [rare]). Increased losses (nephrotic syndrome, burns, trauma, hemorrhage with fluid replacement, fistulas, enteropathy, acute or chronic glomerulonephritis). Hemodilution (pregnancy, CHF). Drugs: estrogens.

Comments
Serum albumin indicates severity in chronic liver disease.
Useful in nutritional assessment if there is no impairment in production or increased loss of albumin. Independent risk factor for all-cause mortality in the elderly (age >70) and for complications in hospitalized and post-surgical patients.
There is a 10% reduction in serum albumin level in late pregnancy (related to hemodilution).`,
    parameters: [
      {
        name: 'Serum Albumin',
        referenceRange: '3.5 - 5.2',
        unit: 'g/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Alkaline Phosphatase',
    title: 'Serum Alkaline Phosphatase (ALP)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Enzyme assay measuring serum alkaline phosphatase (ALP) activity to evaluate hepatobiliary obstructive disorders, bone diseases with osteoblastic activity, and monitor bone metastases.',
    notes: `Physiologic Basis:
Alkaline phosphatases are primarily found in liver, bone, intestines, kidney, and placenta. Test is used to detect liver disease and bone disorders.

Interpretation:
Increased in: Obstructive hepatobiliary disease, bone disease (physiologic bone growth, Paget disease, osteomalacia, osteogenic sarcoma, bone metastases), hyperparathyroidism, rickets, benign familial hyperphosphatasemia, pregnancy (third trimester), GI disease (perforated ulcer or bowel infarct), hepatotoxic drugs.
Decreased in: Hypophosphatasia.

Comment:
Alkaline phosphatase performs well in measuring the extent of bone metastases in prostate cancer. Alkaline phosphatase isoenzyme separation by electrophoresis or differential heat inactivation is unreliable. Use γ-glutamyl transpeptidase, which increases in hepatobiliary disease but not in bone disease, to infer the origin of increased alkaline phosphatase.`,
    interpretation: `Physiologic Basis:
Alkaline phosphatases are primarily found in liver, bone, intestines, kidney, and placenta. Test is used to detect liver disease and bone disorders.

Interpretation:
Increased in: Obstructive hepatobiliary disease, bone disease (physiologic bone growth, Paget disease, osteomalacia, osteogenic sarcoma, bone metastases), hyperparathyroidism, rickets, benign familial hyperphosphatasemia, pregnancy (third trimester), GI disease (perforated ulcer or bowel infarct), hepatotoxic drugs.
Decreased in: Hypophosphatasia.

Comment:
Alkaline phosphatase performs well in measuring the extent of bone metastases in prostate cancer. Alkaline phosphatase isoenzyme separation by electrophoresis or differential heat inactivation is unreliable. Use γ-glutamyl transpeptidase, which increases in hepatobiliary disease but not in bone disease, to infer the origin of increased alkaline phosphatase.`,
    parameters: [
      {
        name: 'Serum Alkaline Phosphatase',
        referenceRange: '30 - 120',
        unit: 'U/l',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Amylase',
    title: 'Serum Amylase',
    basePrice: 250,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Enzyme quantitative assay measuring serum amylase activity to diagnose and monitor acute pancreatitis, pancreatic duct obstruction, and other abdominal/salivary pathologies.',
    notes: `Physiological basis
Amylase hydrolyzes complex carbohydrates. Serum amylase is derived primarily from pancreas and salivary glands and is increased with inflammation or obstruction of these glands. Other tissues have some amylase activity, including ovaries, small and large intestine, and skeletal muscle.

Interpretation
Increased in:
Acute pancreatitis (70–95%), pancreatic pseudocyst, pancreatic duct obstruction (cholecystitis, choledocholithiasis, pancreatic carcinoma, stone, stricture, duct sphincter spasm), bowel obstruction and infarction, mumps, parotitis, diabetic keto- acidosis, penetrating peptic ulcer, peritonitis, ruptured ectopic pregnancy, macroamylasemia.
Drugs: azathioprine, hydrochlorothiazide.

Decreased in:
Pancreatic insufficiency, cystic fibrosis. Usually normal or low in chronic pancreatitis.

Comments
Macroamylasemia is indicated by high serum but low urine amylase. Serum or plasma lipase is an alternative test for acute pancreatitis. It has clinical sensitivity equivalent to that of amylase but with better specificity.`,
    interpretation: `Physiological basis
Amylase hydrolyzes complex carbohydrates. Serum amylase is derived primarily from pancreas and salivary glands and is increased with inflammation or obstruction of these glands. Other tissues have some amylase activity, including ovaries, small and large intestine, and skeletal muscle.

Interpretation
Increased in:
Acute pancreatitis (70–95%), pancreatic pseudocyst, pancreatic duct obstruction (cholecystitis, choledocholithiasis, pancreatic carcinoma, stone, stricture, duct sphincter spasm), bowel obstruction and infarction, mumps, parotitis, diabetic keto- acidosis, penetrating peptic ulcer, peritonitis, ruptured ectopic pregnancy, macroamylasemia.
Drugs: azathioprine, hydrochlorothiazide.

Decreased in:
Pancreatic insufficiency, cystic fibrosis. Usually normal or low in chronic pancreatitis.

Comments
Macroamylasemia is indicated by high serum but low urine amylase. Serum or plasma lipase is an alternative test for acute pancreatitis. It has clinical sensitivity equivalent to that of amylase but with better specificity.`,
    parameters: [
      {
        name: 'Serum Amylase',
        referenceRange: '0 - 120',
        unit: 'IU/L',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Bilirubin (Direct)',
    title: 'Serum Bilirubin (Direct) (Conjugated Bilirubin)',
    basePrice: 120,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube - Light Protected)',
    turnaroundTime: 'Same Day',
    description: 'Photometric diazo assay measuring direct (conjugated) serum bilirubin to differentiate intrahepatic and post-hepatic obstructive jaundice from pre-hepatic hemolytic hyperbilirubinemia.',
    notes: `Physiological basis
Bilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin (heme). The majority of bilirubin comes from senescent red cells. It is biotransformed in the liver and excreted in bile and urine. Some conjugated bilirubin is bound to serum albumin, so-called D (delta) bilirubin.

Interpretation
Increased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.

Comments
Assay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin. Only conjugated bilirubin appears in the urine, and it is indicative of liver disease and biliary tract obstruction. Hemolysis is associated with increased unconjugated bilirubin. Unbound (free) serum or plasma bilirubin level correlates better than total bilirubin with CNS bilirubin concentrations and bilirubin encephalopathy (kernicterus) in newborn jaundice.`,
    interpretation: `Physiological basis
Bilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin (heme). The majority of bilirubin comes from senescent red cells. It is biotransformed in the liver and excreted in bile and urine. Some conjugated bilirubin is bound to serum albumin, so-called D (delta) bilirubin.

Interpretation
Increased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.

Comments
Assay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin. Only conjugated bilirubin appears in the urine, and it is indicative of liver disease and biliary tract obstruction. Hemolysis is associated with increased unconjugated bilirubin. Unbound (free) serum or plasma bilirubin level correlates better than total bilirubin with CNS bilirubin concentrations and bilirubin encephalopathy (kernicterus) in newborn jaundice.`,
    parameters: [
      {
        name: 'Serum Bilirubin (Direct)',
        referenceRange: '0 - 0.3',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Bilirubin (Indirect)',
    title: 'Serum Bilirubin (Indirect) (Unconjugated Bilirubin)',
    basePrice: 120,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube - Light Protected)',
    turnaroundTime: 'Same Day',
    description: 'Quantitative assay calculating indirect (unconjugated) serum bilirubin (Total Bilirubin minus Direct Bilirubin) to evaluate hemolytic anemias, neonatal physiologic jaundice, and congenital glucuronyl transferase deficiencies.',
    notes: `Physiological basis
Bilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin (heme). The majority of bilirubin comes from senescent red cells. It is biotransformed in the liver and excreted in bile and urine. Some conjugated bilirubin is bound to serum albumin, so-called D (delta) bilirubin.

Interpretation
Increased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.

Comments
Assay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin. Only conjugated bilirubin appears in the urine, and it is indicative of liver disease and biliary tract obstruction. Hemolysis is associated with increased unconjugated bilirubin. Unbound (free) serum or plasma bilirubin level correlates better than total bilirubin with CNS bilirubin concentrations and bilirubin encephalopathy (kernicterus) in newborn jaundice.`,
    interpretation: `Physiological basis
Bilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin (heme). The majority of bilirubin comes from senescent red cells. It is biotransformed in the liver and excreted in bile and urine. Some conjugated bilirubin is bound to serum albumin, so-called D (delta) bilirubin.

Interpretation
Increased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.

Comments
Assay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin. Only conjugated bilirubin appears in the urine, and it is indicative of liver disease and biliary tract obstruction. Hemolysis is associated with increased unconjugated bilirubin. Unbound (free) serum or plasma bilirubin level correlates better than total bilirubin with CNS bilirubin concentrations and bilirubin encephalopathy (kernicterus) in newborn jaundice.`,
    parameters: [
      {
        name: 'Serum Bilirubin (Indirect)',
        referenceRange: '0.2 - 1',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Calcium',
    title: 'Serum Calcium (Total Calcium)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Colorimetric assay measuring total serum calcium (bound and ionized) to evaluate parathyroid function, bone metabolism, vitamin D disorders, and hypercalcemia of malignancy.',
    notes: `Physiological basis
Serum calcium is the sum of ionized calcium plus complex calcium and calcium bound to proteins (mostly albumin). Level of ionized calcium is regulated by parathyroid hormone and vitamin D.

Interpretation
Common causes of Hypocalcemia:
1. Chronic renal failure
2. Hypomagnesemia
3. Hypoalbuminemia

Causes of Hypercalcemia:
1. Increased intestinal absorption (vitamin d intoxication)
2. Increased skeletal resorption
3. Primary hyperparathyroidism

Primary hyperparathyroidism and malignancy account for 90–95% of cases of hypercalcemia.

Comments
Need to know serum albumin to interpret calcium level. For every decrease in albumin by 1mg/dL, calcium should be corrected upward by 0.8 mg/dL. In 10% of patients with malignancies, hypercalcemia is attributable to coexistent hyperparathyroidism, suggesting that serum PTH levels should be measured at the initial presentation of all hypercalcemic patients.`,
    interpretation: `Physiological basis
Serum calcium is the sum of ionized calcium plus complex calcium and calcium bound to proteins (mostly albumin). Level of ionized calcium is regulated by parathyroid hormone and vitamin D.

Interpretation
Common causes of Hypocalcemia:
1. Chronic renal failure
2. Hypomagnesemia
3. Hypoalbuminemia

Causes of Hypercalcemia:
1. Increased intestinal absorption (vitamin d intoxication)
2. Increased skeletal resorption
3. Primary hyperparathyroidism

Primary hyperparathyroidism and malignancy account for 90–95% of cases of hypercalcemia.

Comments
Need to know serum albumin to interpret calcium level. For every decrease in albumin by 1mg/dL, calcium should be corrected upward by 0.8 mg/dL. In 10% of patients with malignancies, hypercalcemia is attributable to coexistent hyperparathyroidism, suggesting that serum PTH levels should be measured at the initial presentation of all hypercalcemic patients.`,
    parameters: [
      {
        name: 'Serum Calcium',
        referenceRange: '8.8 - 10.6',
        unit: 'mg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Cortisol',
    title: 'Serum Cortisol (Morning Cortisol)',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube - Morning 8 AM preferred)',
    turnaroundTime: 'Same Day',
    description: 'Chemiluminescent immunoassay (CLIA) measuring serum cortisol levels to diagnose adrenal dysfunction, Cushing syndrome, Addison disease, and secondary adrenocortical insufficiency.',
    notes: `Physiological basis
Cortisol is the major glucocorticoid hormone secreted by the adrenal cortex under the stimulation of pituitary ACTH. Cortisol displays a marked diurnal / circadian rhythm, with highest levels in early morning (8:00 AM) and lowest levels around midnight. It plays a critical role in glucose metabolism, vascular reactivity, immune system suppression, and stress response.

Reference Ranges (Diurnal Variation):
- Morning (7:00 AM - 9:00 AM): 5.27 - 22.45 µg/dl
- Afternoon (3:00 PM - 5:00 PM): 3.0 - 16.0 µg/dl
- Midnight: < 5.0 µg/dl

Interpretation:
Increased in (Hypercortisolemia / Cushing's syndrome):
- Cushing syndrome (pituitary ACTH-secreting adenoma - Cushing disease)
- Adrenal adenoma or carcinoma (ACTH-independent)
- Ectopic ACTH secretion (e.g., small cell lung carcinoma)
- Physiological stress (severe illness, trauma, surgery, sepsis, depression, acute hypoglycemia)
- Pregnancy and oral contraceptive / estrogen therapy (increased cortisol-binding globulin)

Decreased in (Hypocortisolemia / Adrenal Insufficiency):
- Primary adrenal insufficiency (Addison disease - autoimmune adrenalitis, tuberculosis, adrenal hemorrhage)
- Secondary adrenal insufficiency (pituitary ACTH deficiency, hypopituitarism)
- Tertiary adrenal insufficiency (hypothalamic CRH deficiency, abrupt withdrawal of prolonged exogenous corticosteroid therapy)
- Congenital adrenal hyperplasia (CAH - e.g., 21-hydroxylase deficiency)

Comments:
- A single random cortisol level is often insufficient for definitive diagnosis of Cushing syndrome or Addison disease due to diurnal fluctuation and stress sensitivity.
- Dynamic endocrine testing is recommended: Low-dose / High-dose Dexamethasone suppression test for hypercortisolism, and ACTH (Cosyntropin) stimulation test for suspected adrenal insufficiency.
- Midnight salivary cortisol or 24-hour urinary free cortisol (UFC) provides high diagnostic specificity for loss of diurnal rhythm in Cushing syndrome.`,
    interpretation: `Physiological basis
Cortisol is the major glucocorticoid hormone secreted by the adrenal cortex under the stimulation of pituitary ACTH. Cortisol displays a marked diurnal / circadian rhythm, with highest levels in early morning (8:00 AM) and lowest levels around midnight. It plays a critical role in glucose metabolism, vascular reactivity, immune system suppression, and stress response.

Reference Ranges (Diurnal Variation):
- Morning (7:00 AM - 9:00 AM): 5.27 - 22.45 µg/dl
- Afternoon (3:00 PM - 5:00 PM): 3.0 - 16.0 µg/dl
- Midnight: < 5.0 µg/dl

Interpretation:
Increased in (Hypercortisolemia / Cushing's syndrome):
- Cushing syndrome (pituitary ACTH-secreting adenoma - Cushing disease)
- Adrenal adenoma or carcinoma (ACTH-independent)
- Ectopic ACTH secretion (e.g., small cell lung carcinoma)
- Physiological stress (severe illness, trauma, surgery, sepsis, depression, acute hypoglycemia)
- Pregnancy and oral contraceptive / estrogen therapy (increased cortisol-binding globulin)

Decreased in (Hypocortisolemia / Adrenal Insufficiency):
- Primary adrenal insufficiency (Addison disease - autoimmune adrenalitis, tuberculosis, adrenal hemorrhage)
- Secondary adrenal insufficiency (pituitary ACTH deficiency, hypopituitarism)
- Tertiary adrenal insufficiency (hypothalamic CRH deficiency, abrupt withdrawal of prolonged exogenous corticosteroid therapy)
- Congenital adrenal hyperplasia (CAH - e.g., 21-hydroxylase deficiency)

Comments:
- A single random cortisol level is often insufficient for definitive diagnosis of Cushing syndrome or Addison disease due to diurnal fluctuation and stress sensitivity.
- Dynamic endocrine testing is recommended: Low-dose / High-dose Dexamethasone suppression test for hypercortisolism, and ACTH (Cosyntropin) stimulation test for suspected adrenal insufficiency.
- Midnight salivary cortisol or 24-hour urinary free cortisol (UFC) provides high diagnostic specificity for loss of diurnal rhythm in Cushing syndrome.`,
    parameters: [
      {
        name: 'Serum Cortisol',
        referenceRange: '5.27 - 22.45',
        unit: 'µg/dl',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Rubella IgM',
    title: 'Rubella IgM (Rubella Virus Antibody IgM)',
    basePrice: 450,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Chemiluminescent immunoassay (CLIA) / ELISA for quantitative/semi-quantitative detection of IgM antibodies to Rubella virus to diagnose acute or recent German measles infection during pregnancy and congenital evaluation.',
    notes: `Clinical Interpretation:
Rubella IgM antibodies indicate recent or acute infection with the Rubella virus (German measles) or recent vaccination. Rubella is an acute contagious viral infection characterized by rash, fever, and lymphadenopathy. Primary infection during early pregnancy poses high risk of Congenital Rubella Syndrome (CRS) resulting in congenital heart defects, cataracts, sensorineural deafness, and microcephaly.

Interpretation Guide:
- Negative (< 2.0 AU/mL): No detectable Rubella IgM antibodies. No evidence of acute or recent infection.
- Equivocal / Grey Zone (2.0 - 3.0 AU/mL): Borderline antibody level. Repeat testing with a fresh sample collected 7-14 days later is recommended to assess seroconversion or rising titer.
- Positive (> 3.0 AU/mL): Detectable Rubella IgM antibodies suggestive of acute or recent Rubella virus infection or recent immunization.`,
    interpretation: `Clinical Interpretation:
Rubella IgM antibodies indicate recent or acute infection with the Rubella virus (German measles) or recent vaccination. Rubella is an acute contagious viral infection characterized by rash, fever, and lymphadenopathy. Primary infection during early pregnancy poses high risk of Congenital Rubella Syndrome (CRS) resulting in congenital heart defects, cataracts, sensorineural deafness, and microcephaly.

Interpretation Guide:
- Negative (< 2.0 AU/mL): No detectable Rubella IgM antibodies. No evidence of acute or recent infection.
- Equivocal / Grey Zone (2.0 - 3.0 AU/mL): Borderline antibody level. Repeat testing with a fresh sample collected 7-14 days later is recommended to assess seroconversion or rising titer.
- Positive (> 3.0 AU/mL): Detectable Rubella IgM antibodies suggestive of acute or recent Rubella virus infection or recent immunization.`,
    parameters: [
      {
        name: 'Rubella IgM',
        referenceRange: 'Neg. < 2 AU/mL\nGrey Zone 2-3 AU/mL\nPos. > 3 AU/mL',
        unit: 'AU/mL',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Scrub Typhus',
    title: 'Scrub Typhus (Orientia tsutsugamushi Antibodies - IgG & IgM)',
    basePrice: 600,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Rapid immunochromatographic assay / ELISA for qualitative detection of IgG and IgM antibodies against Orientia tsutsugamushi in human serum to aid in the diagnosis of acute and recent Scrub Typhus.',
    notes: `Clinical Interpretation:
Scrub Typhus (also known as bush typhus) is an acute febrile zoonotic disease caused by Orientia tsutsugamushi (formerly Rickettsia tsutsugamushi), transmitted to humans through the bite of infected larval mites (chiggers - Leptotrombidium deliense). Common clinical manifestations include acute high-grade fever, chills, severe headache, myalgia, generalized lymphadenopathy, maculopapular rash, and the characteristic diagnostic 'eschar' (cigarette-burn like lesion at the bite site).

Interpretation Guide:
- IgM Positive: Indicates acute / current or recent active Scrub Typhus infection. IgM antibodies appear by the end of the 1st week of fever and peak during the 2nd–3rd week.
- IgG Positive: Indicates past exposure, secondary immune response, or convalescent phase. A 4-fold rise in IgG titer in paired sera confirms active infection.
- IgM & IgG Negative: No detectable antibodies to Orientia tsutsugamushi. If clinical suspicion is high and sample was collected within the first 5-7 days of illness, repeat testing after 5-7 days is advised.`,
    interpretation: `Clinical Interpretation:
Scrub Typhus (also known as bush typhus) is an acute febrile zoonotic disease caused by Orientia tsutsugamushi (formerly Rickettsia tsutsugamushi), transmitted to humans through the bite of infected larval mites (chiggers - Leptotrombidium deliense). Common clinical manifestations include acute high-grade fever, chills, severe headache, myalgia, generalized lymphadenopathy, maculopapular rash, and the characteristic diagnostic 'eschar' (cigarette-burn like lesion at the bite site).

Interpretation Guide:
- IgM Positive: Indicates acute / current or recent active Scrub Typhus infection. IgM antibodies appear by the end of the 1st week of fever and peak during the 2nd–3rd week.
- IgG Positive: Indicates past exposure, secondary immune response, or convalescent phase. A 4-fold rise in IgG titer in paired sera confirms active infection.
- IgM & IgG Negative: No detectable antibodies to Orientia tsutsugamushi. If clinical suspicion is high and sample was collected within the first 5-7 days of illness, repeat testing after 5-7 days is advised.`,
    parameters: [
      {
        name: 'IgG',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Equivocal', isAbnormal: false }
        ],
        status: 'Active'
      },
      {
        name: 'IgM',
        referenceRange: 'Negative',
        unit: '',
        gender: 'Both',
        fieldType: 'Select',
        valueOptions: [
          { value: 'Negative', isAbnormal: false },
          { value: 'Positive', isAbnormal: true },
          { value: 'Equivocal', isAbnormal: false }
        ],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Serum Chloride',
    title: 'Serum Chloride (Cl-)',
    basePrice: 150,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Ion-selective electrode (ISE) assay measuring serum chloride concentration to assess electrolyte balance, acid-base equilibrium, hydration status, and renal tubular function.',
    notes: `Physiological Basis
Chloride, the principal inorganic anion of extracellular fluid, is important in maintaining proper body water distribution, osmotic pressure, and normal acid-base balance. If chloride is lost (as HCl or NH4Cl), alkalosis ensues; if chloride is ingested or retained, acidosis ensues.

Interpretation
Increased in: Renal failure, nephrotic syndrome, renal tubular acidosis, dehydration, overtreatment with saline, hyperparathyroidism, diabetes insipidus, metabolic acidosis from diarrhea (loss of HCO3–), respiratory alkalosis, hyperadrenocorticism.
Drugs: acetazolamide (hyperchloremic acidosis), androgens, hydrochlorothiazide, salicylates (intoxication).

Decreased in: Vomiting, diarrhea, gastrointestinal suction, renal failure combined with salt deprivation, over-treatment with diuretics, chronic respiratory acidosis, diabetic ketoacidosis, excessive sweating, SIADH, salt-losing nephropathy, acute intermittent porphyria, water intoxication, expansion of extracellular fluid volume, adrenal insufficiency, hyperaldosteronism, metabolic alkalosis.
Drugs: chronic laxative or bicarbonate ingestion, corticosteroids, diuretics.

Comments
Test is helpful in assessing normal and increased anion gap metabolic acidosis. It is somewhat helpful in distinguishing hypercalcemia due to primary hyperparathyroidism (high serum chloride) from that due to malignancy (normal serum chloride).`,
    interpretation: `Physiological Basis
Chloride, the principal inorganic anion of extracellular fluid, is important in maintaining proper body water distribution, osmotic pressure, and normal acid-base balance. If chloride is lost (as HCl or NH4Cl), alkalosis ensues; if chloride is ingested or retained, acidosis ensues.

Interpretation
Increased in: Renal failure, nephrotic syndrome, renal tubular acidosis, dehydration, overtreatment with saline, hyperparathyroidism, diabetes insipidus, metabolic acidosis from diarrhea (loss of HCO3–), respiratory alkalosis, hyperadrenocorticism.
Drugs: acetazolamide (hyperchloremic acidosis), androgens, hydrochlorothiazide, salicylates (intoxication).

Decreased in: Vomiting, diarrhea, gastrointestinal suction, renal failure combined with salt deprivation, over-treatment with diuretics, chronic respiratory acidosis, diabetic ketoacidosis, excessive sweating, SIADH, salt-losing nephropathy, acute intermittent porphyria, water intoxication, expansion of extracellular fluid volume, adrenal insufficiency, hyperaldosteronism, metabolic alkalosis.
Drugs: chronic laxative or bicarbonate ingestion, corticosteroids, diuretics.

Comments
Test is helpful in assessing normal and increased anion gap metabolic acidosis. It is somewhat helpful in distinguishing hypercalcemia due to primary hyperparathyroidism (high serum chloride) from that due to malignancy (normal serum chloride).`,
    parameters: [
      {
        name: 'Serum Chloride',
        referenceRange: '98 - 107',
        unit: 'mmol/l',
        gender: 'Both',
        fieldType: 'Number',
        valueOptions: [],
        status: 'Active'
      }
    ]
  },
  {
    category: 'LAB',
    test: 'Rheumatoid Factor, RA (Quantitative)',
    title: 'Rheumatoid Factor, RA (Quantitative) (RF Quantitative)',
    basePrice: 350,
    taxPercentage: 0,
    sampleType: 'Blood Serum (Plain / Gel Tube)',
    turnaroundTime: 'Same Day',
    description: 'Turbidimetric / Nephelometric immunoassay for quantitative determination of Rheumatoid Factor (IgM-class autoantibodies) in human serum to assist in diagnosis and prognosis of Rheumatoid Arthritis.',
    notes: `Physiologic Basis
Rheumatoid factor (RF) consists of heterogeneous autoantibodies usually of the IgM class that react against the Fc region of human IgG. Most methods detect only IgM-class RF.

Interpretation
Positive in: Rheumatoid arthritis (75–90%), Sjögren syndrome (80–90%), scleroderma, dermatomyositis, SLE (30%), sarcoidosis, Waldenström macroglobulinemia, chronic infection.
Drugs: methyldopa, others.
Low-titers of RF (eg, ≤1:80) are questionable and can be found in healthy older patients (20%), in 1–4% of normal individuals, and in a variety of acute immune responses (eg, viral infections, including infectious mononucleosis and viral hepatitis), chronic bacterial infections (tuberculosis, leprosy, subacute infective endocarditis), and chronic active hepatitis.

Comments
Rheumatoid factor can be useful in differentiating rheumatoid arthritis from other chronic inflammatory arthritides. However, a positive RF test is only one of several criteria needed to make the diagnosis of rheumatoid arthritis.
RF must be ordered selectively because its predictive value is low (34%) if it is used as a screening test. The test has poor positive predictive value because of its lack of specificity. The subset of patients with seronegative rheumatic disease limits its sensitivity and negative predictive value.`,
    interpretation: `Physiologic Basis
Rheumatoid factor (RF) consists of heterogeneous autoantibodies usually of the IgM class that react against the Fc region of human IgG. Most methods detect only IgM-class RF.

Interpretation
Positive in: Rheumatoid arthritis (75–90%), Sjögren syndrome (80–90%), scleroderma, dermatomyositis, SLE (30%), sarcoidosis, Waldenström macroglobulinemia, chronic infection.
Drugs: methyldopa, others.
Low-titers of RF (eg, ≤1:80) are questionable and can be found in healthy older patients (20%), in 1–4% of normal individuals, and in a variety of acute immune responses (eg, viral infections, including infectious mononucleosis and viral hepatitis), chronic bacterial infections (tuberculosis, leprosy, subacute infective endocarditis), and chronic active hepatitis.

Comments
Rheumatoid factor can be useful in differentiating rheumatoid arthritis from other chronic inflammatory arthritides. However, a positive RF test is only one of several criteria needed to make the diagnosis of rheumatoid arthritis.
RF must be ordered selectively because its predictive value is low (34%) if it is used as a screening test. The test has poor positive predictive value because of its lack of specificity. The subset of patients with seronegative rheumatic disease limits its sensitivity and negative predictive value.`,
    parameters: [
      {
        name: 'Rheumatoid Factor, RA (Quantitative)',
        referenceRange: '0 - 20',
        unit: 'IU/mL',
        gender: 'Both',
        fieldType: 'Number',
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

      // Delete any conflicting record with the same title under this category to avoid duplicate key index collision
      await LabTest.deleteMany({
        hospitalId: null,
        categoryKey: catKey,
        title: item.title,
        testKey: { $ne: testKey }
      });

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
