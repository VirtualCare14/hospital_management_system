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
    "category": "LAB",
    "test": "Adenosine Deaminase (ADA)",
    "title": "Adenosine Deaminase (ADA)",
    "basePrice": 550,
    "taxPercentage": 0,
    "sampleType": "Fluid / Serum",
    "turnaroundTime": "4 Hours",
    "description": "Adenosine Deaminase (ADA) activity estimation in Pleural fluid, Ascitic fluid, CSF or Blood Serum.",
    "notes": "",
    "interpretation": "ADA values interpreted in clinical context. Elevated in Tuberculosis.",
    "parameters": [
      {
        "name": "Sample Type",
        "referenceRange": "",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Pleural fluid",
            "isAbnormal": false
          },
          {
            "value": "Ascitic fluid",
            "isAbnormal": false
          },
          {
            "value": "CSF (cerebrospinal fluid)",
            "isAbnormal": false
          },
          {
            "value": "Blood serum",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "Result",
        "referenceRange": "0 - 40",
        "unit": "U/L",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Absolute Eosinophil Count (AEC)",
    "title": "Absolute Eosinophil Count (AEC)",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Measures the absolute number of eosinophils in a given volume of blood.",
    "notes": "",
    "interpretation": "Physiological basis\nThe Absolute Eosinophil Count (AEC) is a measure of the number of eosinophils, a type of white blood cell, in a given volume of blood. The Absolute Eosinophil Count (AEC) is calculated by multiplying the percentage of eosinophils in the total white blood cell count by the total white blood cell count.\n\nElevated AEC (Eosinophilia):\n- Allergic Reactions\n- Parasitic Infections\n- Autoimmune Diseases\n\nLow AEC:\n- Acute Infections\n- Adrenal Insufficiency\n\nComments:\nThe AEC is typically assessed as part of a complete blood count (CBC) with a differential. If your AEC is outside the normal range, it's important to consult with a healthcare provider to determine the underlying cause and appropriate treatment.",
    "parameters": [
      {
        "name": "Absolute Eosinophil Count",
        "referenceRange": "0 - 440",
        "unit": "cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Acid - Fast Bacilli (AFB)",
    "title": "Acid - Fast Bacilli (AFB)",
    "basePrice": 300,
    "taxPercentage": 0,
    "sampleType": "Sputum / Body Fluid",
    "turnaroundTime": "24 Hours",
    "description": "Microscopic examination for Acid-Fast Bacilli (AFB) to detect Mycobacterial infections.",
    "notes": "",
    "interpretation": "Note:\nA positive Acid-Fast Bacillus (AFB) smear result provides an initial indication of a Mycobacterial infection, the relative bacterial burden and correlate with the clinical presentation of the disease. Conversely, a negative AFB smear may indicate the absence of Mycobacterial infection or that the bacteria are not detected under the microscope. It does not, however, differentiate between viable and non-viable organisms, nor does it distinguish between different Mycobacterial species.\n\nUsage:\nThis test is employed to detect acid-fast bacteria, primarily Mycobacterium tuberculosis, for the purposes of diagnosing and monitoring tuberculosis.",
    "parameters": [
      {
        "name": "Sample Type",
        "referenceRange": "",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Sputum",
            "isAbnormal": false
          },
          {
            "value": "CSF Fluid",
            "isAbnormal": false
          },
          {
            "value": "Pleural Fluid",
            "isAbnormal": false
          },
          {
            "value": "Ascitic Fluid",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "Result",
        "referenceRange": "",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Positive After 1st Day",
            "isAbnormal": true
          },
          {
            "value": "Positive After 2nd Day",
            "isAbnormal": true
          },
          {
            "value": "Positive After 3rd Day",
            "isAbnormal": true
          },
          {
            "value": "Negative After 1st Day",
            "isAbnormal": false
          },
          {
            "value": "Negative After 2nd Day",
            "isAbnormal": false
          },
          {
            "value": "Negative After 3rd Day",
            "isAbnormal": false
          },
          {
            "value": "No AFB Seen",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "AFP(Alfa Fetoprotein)",
    "title": "AFP(Alfa Fetoprotein)",
    "basePrice": 850,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "24 Hours",
    "description": "Quantitative measurement of Alpha-fetoprotein (AFP) level in serum as a tumor and fetal biomarker.",
    "notes": "",
    "interpretation": "Alpha-fetoprotein (AFP) is a crucial protein found in fetal serum, serving a physiological role akin to that of albumin. It is primarily produced in the yolk sac, the fetal liver, and the fetal gastrointestinal tract. However, shortly after birth, AFP levels drop precipitously, becoming virtually undetectable. In healthy adults, AFP levels are typically below 5.4 ng/mL.\n\nWhile elevated AFP levels can occur in various benign conditions, a level exceeding 500 ng/mL is rarely associated with non-malignant issues. During a normal pregnancy, AFP levels may rise but generally do not exceed 100 ng/mL. Elevated AFP levels are also observed in chronic liver diseases such as cirrhosis and hepatitis.\n\nAFP plays a pivotal role in the detection of hepatocellular carcinoma and yolk sac tumors. Additionally, it may be sporadically elevated in other malignancies, including certain hepatoid variants of gastric carcinoma. In the case of yolk sac tumors, the AFP level is closely linked to prognosis, with levels surpassing 10,000 ng/mL indicating a poor outcome. For hepatocellular carcinoma, AFP elevation is reported in approximately 70% of patients, underscoring its significance as a biomarker in the diagnosis and management of liver cancer.",
    "parameters": [
      {
        "name": "AFP(Alfa Fetoprotein)",
        "referenceRange": "< 10",
        "unit": "ng/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "A/G Ratio",
    "title": "A/G Ratio",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "4 Hours",
    "description": "Calculates the ratio of Albumin to Globulin in blood serum.",
    "notes": "",
    "interpretation": "The Albumin to Globulin (A/G) ratio is a calculated value obtained by dividing the albumin concentration by the globulin concentration (calculated as Total Protein minus Albumin). A normal ratio is between 1.1 and 2.1. A low A/G ratio may indicate overproduction of globulins (e.g., in multiple myeloma or autoimmune diseases) or underproduction of albumin (e.g., in cirrhosis or nephrotic syndrome).",
    "parameters": [
      {
        "name": "A/G Ratio",
        "referenceRange": "1.1 - 2.1",
        "unit": "",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "AMH(Anti Mullerian Hormone)",
    "title": "AMH(Anti Mullerian Hormone)",
    "basePrice": 1500,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "24 Hours",
    "description": "Quantitative measurement of Anti-Müllerian Hormone (AMH) to assess ovarian reserve and fertility.",
    "notes": "",
    "interpretation": "Notes\nAnti-Müllerian Hormone (AMH) starts to drop several years before Follicle-Stimulating Hormone (FSH) levels increase. Because of this, AMH is a more sensitive indicator of ovarian reserve. Sometimes, AMH levels and Antral Follicle Count (AFC) can give different results. AMH reflects the overall number of early-stage follicles that aren't visible yet, while AFC counts only the follicles that can be seen on an ultrasound.\n\nInterpretation:\nAMH LEVEL IN ng/mL | Remarks\n<0.50 | Predictive of poor response\n0.50 - <1.0 | Suggestive of limited ovarian reserve\n1.00 - 3.50 | Predictive of optimal response\n>3.50 | Predictive of Ovarian hyperstimulation syndrome / PCOS\n\nComment\nAntimüllerian Hormone (AMH) is produced by Sertoli cells in males and granulosa cells in females. In males, AMH levels are high in infancy, drop before puberty, and decrease sharply during puberty. In females, AMH is made by small follicles from around 36 weeks of pregnancy until menopause, when levels become very low. AMH is a valuable marker for assessing gender, fertility, and gonadal tumors. It provides a steady measure of ovarian reserve throughout the menstrual cycle. Women with higher AMH levels generally respond better to fertility treatments and produce more eggs. Elevated AMH can also indicate risks such as ovarian hyperstimulation syndrome or conditions like Polycystic Ovary Syndrome (PCOS). Additionally, high AMH levels can be seen in some ovarian tumors.\n\nClinical Applications of AMH:\n1. Assess Ovarian Health\n2. Check Menopausal Status\n3. Evaluate PCOS\n4. Examine Infants with Ambiguous Genitalia\n5. Testicular Function in Children\n6. Diagnose and Monitor Tumors",
    "parameters": [
      {
        "name": "AMH(Anti Mullerian Hormone)",
        "referenceRange": "",
        "unit": "ng/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "CCP(Cyclic-citrullinated-peptide)",
    "title": "CCP(Cyclic-citrullinated-peptide)",
    "basePrice": 1200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "24 Hours",
    "description": "Quantitative determination of Anti-Cyclic Citrullinated Peptide (Anti-CCP) antibodies in human serum for rheumatoid arthritis diagnosis.",
    "notes": "",
    "interpretation": "Physiological Basis\nPost-translational deamination of arginine residues by peptidyl arginine deaminase (citrullination) during inflammation results in production of antigenic epitope. Antibodies to citrullinated proteins (particularly filaggrin) are frequently elevated in rheumatoid arthritis (RA).\n\nInterpretation: Increased in- RA (sensitivity 70–80%).\n\nComments: Specificity of anti-CCP (90–95%) for RA is higher than that of rheumatoid factor.",
    "parameters": [
      {
        "name": "Anti cyclic-citrullinated-peptide",
        "referenceRange": "< 5",
        "unit": "U/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "KALA AZAR",
    "title": "KALA AZAR",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Qualitative detection of antibodies to Leishmania donovani (rK-39 antigen) in human serum for diagnosis of Visceral Leishmaniasis (Kala-azar).",
    "notes": "Interpretation\n\n• Positive → Suggestive of Visceral Leishmaniasis (Kala-azar)\n• Negative → No serological evidence of Kala-azar\n• Clinical correlation required",
    "interpretation": "Interpretation\n\n• Positive → Suggestive of Visceral Leishmaniasis (Kala-azar)\n• Negative → No serological evidence of Kala-azar\n• Clinical correlation required",
    "parameters": [
      {
        "name": "LEISHMANIA rK-39 ANTIBODY, SERUM",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Insulin Random",
    "title": "Insulin Random",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative measurement of random insulin levels in serum to evaluate glucose metabolism, beta-cell function, and insulin resistance.",
    "notes": "Note\n1. A single random blood sample for insulin may not be sufficient because insulin levels and blood glucose can vary widely over time.\n2. Insulin secretion can be stimulated by various factors, including high blood glucose, glucagon, amino acids, growth hormone, and catecholamines.\n3. Insulin assay results can be affected by insulin antibodies that develop in patients receiving bovine or porcine insulin treatments.\n\nClinical Utility\n• Evaluation of fasting hypoglycemia\n• Evaluation of Polycystic Ovary syndrome\n• Classification of Diabetes mellitus\n• Predict Diabetes mellitus\n• Assessment of Beta cell activity\n• Select optimal therapy for Diabetes\n• Investigation of insulin resistance\n• Predict the development of Coronary Artery Disease\n\nInterpretation\nIncreased levels - Insulinoma, Some Type II diabetic patients, Infantile hypoglycemia, Hyperinsulinism, Obesity, Cushing's syndrome, Oral contraceptives, Acromegaly, Hyperthyroidism\nDecreased levels - Untreated Type I Diabetes mellitus",
    "interpretation": "Note\n1. A single random blood sample for insulin may not be sufficient because insulin levels and blood glucose can vary widely over time.\n2. Insulin secretion can be stimulated by various factors, including high blood glucose, glucagon, amino acids, growth hormone, and catecholamines.\n3. Insulin assay results can be affected by insulin antibodies that develop in patients receiving bovine or porcine insulin treatments.\n\nClinical Utility\n• Evaluation of fasting hypoglycemia\n• Evaluation of Polycystic Ovary syndrome\n• Classification of Diabetes mellitus\n• Predict Diabetes mellitus\n• Assessment of Beta cell activity\n• Select optimal therapy for Diabetes\n• Investigation of insulin resistance\n• Predict the development of Coronary Artery Disease\n\nInterpretation\nIncreased levels - Insulinoma, Some Type II diabetic patients, Infantile hypoglycemia, Hyperinsulinism, Obesity, Cushing's syndrome, Oral contraceptives, Acromegaly, Hyperthyroidism\nDecreased levels - Untreated Type I Diabetes mellitus",
    "parameters": [
      {
        "name": "Insulin Random",
        "referenceRange": "2.6 - 24.9",
        "unit": "µU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Iron",
    "title": "Iron",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative measurement of serum Iron level to evaluate iron metabolism, iron deficiency anemia, and hemochromatosis.",
    "notes": "Physiological basis\nPlasma iron concentration is determined by absorption from the intestine; storage in the intestine, liver, spleen, bone marrow; rate of breakdown or loss of hemoglobin; and rate of synthesis of new hemoglobin. The key regulator of iron homeostasis is hepcidin. Hepcidin excess or deficiency contributes to the dysregulation of iron homeostasis in hereditary and acquired iron disorders.\n\nInterpretation\nIncreased in: Hemosiderosis (eg, multiple transfusions, excess iron administration), acute Fe poisoning (children), hemolytic anemia, pernicious anemia, aplastic or hypoplastic anemia, viral hepatitis, lead poisoning, thalassemia, hemochromatosis. Drugs: estrogens, ethanol, oral contraceptives.\nDecreased in: Iron deficiency, nephrotic syndrome, chronic renal failure, many infections, active hematopoiesis, remission of pernicious anemia, hypothyroidism, malignancy (carcinoma), postoperative state, kwashiorkor.\n\nComments\nAbsence of stainable iron on bone marrow aspirate differentiates iron deficiency from other causes of microcytic anemia (eg, thalassemia, sideroblastic anemia, some chronic disease anemias), but the procedure is invasive and expensive. Serum iron, iron-binding capacity, transferrin saturation, serum ferritin or soluble transferrin receptor may obviate the need for bone marrow examination. Serum iron, transferrin saturation and ferritin are useful in screening family members for hereditary hemochromatosis.",
    "interpretation": "Physiological basis\nPlasma iron concentration is determined by absorption from the intestine; storage in the intestine, liver, spleen, bone marrow; rate of breakdown or loss of hemoglobin; and rate of synthesis of new hemoglobin. The key regulator of iron homeostasis is hepcidin. Hepcidin excess or deficiency contributes to the dysregulation of iron homeostasis in hereditary and acquired iron disorders.\n\nInterpretation\nIncreased in: Hemosiderosis (eg, multiple transfusions, excess iron administration), acute Fe poisoning (children), hemolytic anemia, pernicious anemia, aplastic or hypoplastic anemia, viral hepatitis, lead poisoning, thalassemia, hemochromatosis. Drugs: estrogens, ethanol, oral contraceptives.\nDecreased in: Iron deficiency, nephrotic syndrome, chronic renal failure, many infections, active hematopoiesis, remission of pernicious anemia, hypothyroidism, malignancy (carcinoma), postoperative state, kwashiorkor.\n\nComments\nAbsence of stainable iron on bone marrow aspirate differentiates iron deficiency from other causes of microcytic anemia (eg, thalassemia, sideroblastic anemia, some chronic disease anemias), but the procedure is invasive and expensive. Serum iron, iron-binding capacity, transferrin saturation, serum ferritin or soluble transferrin receptor may obviate the need for bone marrow examination. Serum iron, transferrin saturation and ferritin are useful in screening family members for hereditary hemochromatosis.",
    "parameters": [
      {
        "name": "Iron",
        "referenceRange": "65 - 175",
        "unit": "µg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HPLC",
    "title": "HPLC",
    "basePrice": 1200,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "24 Hours",
    "description": "Hemoglobin HPLC (High-Performance Liquid Chromatography) / Electrophoresis for screening and diagnosis of thalassemia syndromes and hemoglobinopathies.",
    "notes": "Methodology: High Performance Liquid Chromatography (CE-HPLC) / Hemoglobin Electrophoresis\n\nPhysiological Basis:\nHigh Performance Liquid Chromatography (HPLC) is used for the qualitative and quantitative determination of normal and abnormal hemoglobin variants (hemoglobinopathies) and thalassemia syndromes (especially Beta Thalassemia). Normal adult hemoglobin is predominantly Hb A (Hb Adult, >95%), with small amounts of Hb A2 (2.0 - 3.5%) and Hb F (<1.0%).\n\nInterpretation:\n1. Normal Adult Pattern:\n   • Hb Adult (Hb A0): 95.0 – 98.0 %\n   • Hb A2: 2.0 – 3.5 %\n   • Hb F: < 1.0 %\n\n2. Beta Thalassemia Trait (Minor):\n   • Hb A2: Elevated between 3.6% and 9.0% (Diagnostic cutoff: >3.5%)\n   • Hb F: Normal or slightly elevated (1.0 - 5.0%)\n   • Red Cell Indices: Microcytic hypochromic picture (Low MCV < 80 fL, Low MCH < 27 pg)\n\n3. Beta Thalassemia Major / Intermedia:\n   • Hb F: Markedly elevated (10% to >90%)\n   • Hb A0: Significantly reduced or absent\n   • Hb A2: Variable\n\n4. Other Hemoglobin Variants:\n   • Hb S: Sickle cell trait (Hb A + Hb S) or Sickle cell anemia (Hb S + Hb F, no Hb A)\n   • Hb E / Hb D-Punjab / Hb C: Identified in specific chromatographic retention windows\n\nComments & Clinical Guidance:\n• Severe iron deficiency anemia can artificially lower Hb A2 levels and may mask a concurrent Beta Thalassemia Trait. Evaluation and correction of iron status (Serum Ferritin/Iron) is recommended prior to re-testing if clinically indicated.\n• Partner screening (antenatal / premarital counseling) and molecular genetic (DNA) analysis are recommended for definitive genetic risk assessment.",
    "interpretation": "Methodology: High Performance Liquid Chromatography (CE-HPLC) / Hemoglobin Electrophoresis\n\nPhysiological Basis:\nHigh Performance Liquid Chromatography (HPLC) is used for the qualitative and quantitative determination of normal and abnormal hemoglobin variants (hemoglobinopathies) and thalassemia syndromes (especially Beta Thalassemia). Normal adult hemoglobin is predominantly Hb A (Hb Adult, >95%), with small amounts of Hb A2 (2.0 - 3.5%) and Hb F (<1.0%).\n\nInterpretation:\n1. Normal Adult Pattern:\n   • Hb Adult (Hb A0): 95.0 – 98.0 %\n   • Hb A2: 2.0 – 3.5 %\n   • Hb F: < 1.0 %\n\n2. Beta Thalassemia Trait (Minor):\n   • Hb A2: Elevated between 3.6% and 9.0% (Diagnostic cutoff: >3.5%)\n   • Hb F: Normal or slightly elevated (1.0 - 5.0%)\n   • Red Cell Indices: Microcytic hypochromic picture (Low MCV < 80 fL, Low MCH < 27 pg)\n\n3. Beta Thalassemia Major / Intermedia:\n   • Hb F: Markedly elevated (10% to >90%)\n   • Hb A0: Significantly reduced or absent\n   • Hb A2: Variable\n\n4. Other Hemoglobin Variants:\n   • Hb S: Sickle cell trait (Hb A + Hb S) or Sickle cell anemia (Hb S + Hb F, no Hb A)\n   • Hb E / Hb D-Punjab / Hb C: Identified in specific chromatographic retention windows\n\nComments & Clinical Guidance:\n• Severe iron deficiency anemia can artificially lower Hb A2 levels and may mask a concurrent Beta Thalassemia Trait. Evaluation and correction of iron status (Serum Ferritin/Iron) is recommended prior to re-testing if clinically indicated.\n• Partner screening (antenatal / premarital counseling) and molecular genetic (DNA) analysis are recommended for definitive genetic risk assessment.",
    "parameters": [
      {
        "name": "Hb F",
        "referenceRange": "< 1.0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Peak 2",
        "referenceRange": "0 - 2.5",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Hb Adult",
        "referenceRange": "95.0 - 98.0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Hb A2",
        "referenceRange": "2.0 - 3.5",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Hemoglobin",
        "referenceRange": "12.0 - 16.0",
        "unit": "g/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "RBC Count",
        "referenceRange": "4.0 - 5.5",
        "unit": "Mill/cml.",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Packed Cell Volume (PCV)",
        "referenceRange": "36.0 - 48.0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "MCV",
        "referenceRange": "80 - 100",
        "unit": "fL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "MCH",
        "referenceRange": "27 - 32",
        "unit": "Pg",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "RDW",
        "referenceRange": "11.5 - 14.5",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Hscrp",
    "title": "Hscrp (High-Sensitivity C-Reactive Protein)",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "High-Sensitivity C-Reactive Protein (hs-CRP) quantitative estimation in serum for assessing systemic inflammation and cardiovascular risk stratification.",
    "notes": "Physiologic Basis\nCRP is an acute-phase reactant protein. Hepatic secretion is stimulated in response to inflammatory cytokines. Unlike other acute-phase proteins, CRP is not affected by hormones. CRP activates the complement system, binds to Fc receptors, and serves as an opsonin for some microorganisms. Rapid, marked increases in CRP occur with inflammation, infection, trauma and tissue necrosis, malignancies, and autoimmune disorders. CRP levels are also valuable in assessing vascular inflammation and cardiovascular risk stratification. CRP level has been shown to be an independent risk factor for atherosclerotic disease. Elevated CRP levels are associated with increased cardiovascular morbidity and mortality in patients with coronary artery disease.\n\nInterpretation\nIncreased in: Inflammatory states, including arteriosclerotic disorders.\n\nComments\nCRP is a very sensitive but nonspecific marker of inflammation. A variety of conditions other than arteriosclerosis may cause dramatic increases in CRP levels. CRP levels increase within 2 hours of acute insult (eg, surgery, infection) and should peak and begin decreasing within 48 hours if no other inflammatory event occurs. In patients with rheumatoid arthritis, persistently elevated CRP concentrations are present when the disease is active and usually fall to normal during periods of complete remission. Patients with high hs-CRP concentrations are more likely to develop stroke, myocardial infarction, and severe peripheral vascular disease.",
    "interpretation": "Physiologic Basis\nCRP is an acute-phase reactant protein. Hepatic secretion is stimulated in response to inflammatory cytokines. Unlike other acute-phase proteins, CRP is not affected by hormones. CRP activates the complement system, binds to Fc receptors, and serves as an opsonin for some microorganisms. Rapid, marked increases in CRP occur with inflammation, infection, trauma and tissue necrosis, malignancies, and autoimmune disorders. CRP levels are also valuable in assessing vascular inflammation and cardiovascular risk stratification. CRP level has been shown to be an independent risk factor for atherosclerotic disease. Elevated CRP levels are associated with increased cardiovascular morbidity and mortality in patients with coronary artery disease.\n\nInterpretation\nIncreased in: Inflammatory states, including arteriosclerotic disorders.\n\nComments\nCRP is a very sensitive but nonspecific marker of inflammation. A variety of conditions other than arteriosclerosis may cause dramatic increases in CRP levels. CRP levels increase within 2 hours of acute insult (eg, surgery, infection) and should peak and begin decreasing within 48 hours if no other inflammatory event occurs. In patients with rheumatoid arthritis, persistently elevated CRP concentrations are present when the disease is active and usually fall to normal during periods of complete remission. Patients with high hs-CRP concentrations are more likely to develop stroke, myocardial infarction, and severe peripheral vascular disease.",
    "parameters": [
      {
        "name": "High-Sensitivity C-Reactive Protein",
        "referenceRange": "< 1.0",
        "unit": "mg/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "department": "BIOCHEMISTRY",
    "test": "Ammonia",
    "title": "Ammonia",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Plasma (EDTA / Heparin - Placed immediately on ice)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative measurement of Ammonia level in blood plasma for evaluating hepatic encephalopathy, liver function, and urea cycle metabolic disorders.",
    "notes": "Physiological Basis:\nAmmonia (NH3/NH4+) is produced in the gastrointestinal tract by bacterial degradation of dietary amines and amino acids, as well as mucosal glutamine metabolism. It is transported to the liver via the portal circulation and metabolized through the urea cycle into urea, which is subsequently excreted by the kidneys. Elevated systemic blood ammonia crosses the blood-brain barrier and can cause astrocyte swelling, cerebral edema, and neurotoxicity.\n\nReference Range:\n• Normal: 11 - 32 µmol/L (18 - 54 µg/dL)\n\nClinical Significance:\nElevated Levels (Hyperammonemia):\n- Hepatic Encephalopathy / Acute Liver Failure / Advanced Cirrhosis / Portosystemic Shunting\n- Inborn Errors of Metabolism (Urea Cycle Enzyme Deficiencies, Organic Acidemias)\n- Reye's Syndrome\n- Total Parenteral Nutrition (TPN)\n- Severe Congestive Heart Failure\n- Valproic Acid / Carbamazepine therapy\n\nPre-analytical Requirements:\nSample must be collected in EDTA or Heparin tube without stasis (avoid fist clenching), immediately placed on crushed ice, and transported promptly to the laboratory for centrifugation and cold analysis to prevent in vitro generation of ammonia from amino acid deamination.",
    "interpretation": "Physiological Basis:\nAmmonia (NH3/NH4+) is produced in the gastrointestinal tract by bacterial degradation of dietary amines and amino acids, as well as mucosal glutamine metabolism. It is transported to the liver via the portal circulation and metabolized through the urea cycle into urea, which is subsequently excreted by the kidneys. Elevated systemic blood ammonia crosses the blood-brain barrier and can cause astrocyte swelling, cerebral edema, and neurotoxicity.\n\nReference Range:\n• Normal: 11 - 32 µmol/L (18 - 54 µg/dL)\n\nClinical Significance:\nElevated Levels (Hyperammonemia):\n- Hepatic Encephalopathy / Acute Liver Failure / Advanced Cirrhosis / Portosystemic Shunting\n- Inborn Errors of Metabolism (Urea Cycle Enzyme Deficiencies, Organic Acidemias)\n- Reye's Syndrome\n- Total Parenteral Nutrition (TPN)\n- Severe Congestive Heart Failure\n- Valproic Acid / Carbamazepine therapy\n\nPre-analytical Requirements:\nSample must be collected in EDTA or Heparin tube without stasis (avoid fist clenching), immediately placed on crushed ice, and transported promptly to the laboratory for centrifugation and cold analysis to prevent in vitro generation of ammonia from amino acid deamination.",
    "parameters": [
      {
        "name": "Ammonia",
        "displayName": "Ammonia",
        "referenceRange": "11 - 32",
        "unit": "µmol/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "department": "PATHOLOGY",
    "test": "Anemia Package",
    "title": "Anemia Package",
    "basePrice": 1200,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA) & Blood Serum",
    "turnaroundTime": "6 Hours",
    "description": "Comprehensive Anemia Profile evaluating complete red blood cell indices, iron metabolism (Iron, TIBC, UIBC, Transferrin Saturation, Ferritin), Vitamin B12, Folate, Reticulocytes, and Peripheral Blood Smear examination.",
    "notes": "Clinical Utility:\nAnemia profiling allows comprehensive differential diagnosis of microcytic, normocytic, and macrocytic anemias, distinguishing nutritional deficiencies (Iron, Vitamin B12, Folate), anemia of chronic disease, hemolytic disorders, and hemoglobinopathies.\n\nCalculated Indices & Formulas:\n• Transferrin Saturation (%) = (Serum Iron ÷ TIBC) × 100\n• UIBC (µg/dL) = TIBC − Serum Iron\n• MCV (fL) = (Hematocrit % × 10) ÷ RBC Count (million/µL)\n• MCH (pg) = (Hemoglobin g/dL × 10) ÷ RBC Count (million/µL)\n• MCHC (g/dL) = (Hemoglobin g/dL ÷ Hematocrit %) × 100",
    "interpretation": "Clinical Interpretation & Diagnostic Guidance:\n\n1. Microcytic Hypochromic Anemia (MCV < 80 fL):\n• Iron Deficiency Anemia: Low Serum Iron (< 65 µg/dL), Elevated TIBC (> 450 µg/dL), Low Transferrin Saturation (< 16%), Low Serum Ferritin (< 30 ng/mL in males, < 13 ng/mL in females), High RDW-CV (> 14.5%).\n• Anemia of Chronic Disease / Inflammation: Low/Normal Iron, Low/Normal TIBC, Normal or High Ferritin (acute phase reactant), Low Transferrin Saturation.\n• Thalassemia Trait: Markedly low MCV and MCH with normal/high RBC count, normal iron studies, normal RDW.\n\n2. Macrocytic Anemia (MCV > 100 fL):\n• Megaloblastic Anemia: Low Vitamin B12 (< 200 pg/mL) and/or Low Folate (< 3 ng/mL), oval macrocytes, hypersegmented neutrophils on peripheral smear, low reticulocyte response.\n• Non-Megaloblastic Causes: Liver disease, alcohol excess, hypothyroidism, myelodysplastic syndrome (MDS).\n\n3. Normocytic Normochromic Anemia (MCV 80–100 fL):\n• Hemolytic Anemia: Elevated Reticulocyte Count (> 2.5%), polychromasia, elevated indirect bilirubin.\n• Acute Blood Loss or Bone Marrow Suppression: Normal iron/B12, variable reticulocyte response.\n\nFormulas & Calculations:\n• Transferrin Saturation (%) = (Serum Iron ÷ TIBC) × 100\n• UIBC (µg/dL) = TIBC − Serum Iron\n• MCV (fL) = (Hematocrit % × 10) ÷ RBC Count\n• MCH (pg) = (Hemoglobin × 10) ÷ RBC Count\n• MCHC (g/dL) = (Hemoglobin ÷ Hematocrit %) × 100",
    "parameters": [
      {
        "name": "Hemoglobin (Hb)",
        "displayName": "Hemoglobin (Hb)",
        "referenceRange": "Male: 13.5–17.5 / Female: 12.0–15.5",
        "unit": "g/dL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "RBC Count",
        "displayName": "RBC Count",
        "referenceRange": "Male: 4.5–5.9 / Female: 4.1–5.1",
        "unit": "million/µL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Hematocrit (PCV)",
        "displayName": "Hematocrit (PCV)",
        "referenceRange": "Male: 41–53 / Female: 36–46",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "MCV",
        "displayName": "MCV",
        "referenceRange": "80–100",
        "unit": "fL",
        "gender": "Both",
        "fieldType": "Number",
        "formula": "Formula: MCV (fL) = (Hematocrit % × 10) ÷ RBC Count",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "MCH",
        "displayName": "MCH",
        "referenceRange": "27–33",
        "unit": "pg",
        "gender": "Both",
        "fieldType": "Number",
        "formula": "Formula: MCH (pg) = (Hemoglobin × 10) ÷ RBC Count",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "MCHC",
        "displayName": "MCHC",
        "referenceRange": "32–36",
        "unit": "g/dL",
        "gender": "Both",
        "fieldType": "Number",
        "formula": "Formula: MCHC (g/dL) = (Hemoglobin ÷ Hematocrit %) × 100",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "RDW-CV",
        "displayName": "RDW-CV",
        "referenceRange": "11.5–14.5",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Iron",
        "displayName": "Serum Iron",
        "referenceRange": "65–175",
        "unit": "µg/dL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "TIBC",
        "displayName": "TIBC",
        "referenceRange": "250–450",
        "unit": "µg/dL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "UIBC",
        "displayName": "UIBC",
        "referenceRange": "155–355",
        "unit": "µg/dL",
        "gender": "Both",
        "fieldType": "Number",
        "formula": "Formula: UIBC = TIBC − Serum Iron",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Transferrin Saturation",
        "displayName": "Transferrin Saturation",
        "referenceRange": "20–50",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "formula": "Formula: Transferrin Saturation (%) = (Serum Iron ÷ TIBC) × 100",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Ferritin",
        "displayName": "Serum Ferritin",
        "referenceRange": "Male: 30–400 / Female: 13–150",
        "unit": "ng/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Vitamin B12",
        "displayName": "Vitamin B12",
        "referenceRange": "200–900",
        "unit": "pg/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Folate (Vitamin B9)",
        "displayName": "Folate (Vitamin B9)",
        "referenceRange": "3–20",
        "unit": "ng/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Reticulocyte Count",
        "displayName": "Reticulocyte Count",
        "referenceRange": "0.5–2.5",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Peripheral Smear",
        "displayName": "Peripheral Smear",
        "referenceRange": "Morphology-based interpretation",
        "unit": "—",
        "gender": "Both",
        "fieldType": "Multiline",
        "valueOptions": [
          { "value": "Normocytic Normochromic RBCs with normal morphology", "isAbnormal": false },
          { "value": "Microcytic Hypochromic RBCs with marked Anisopoikilocytosis and pencil cells", "isAbnormal": true },
          { "value": "Macrocytic RBCs with Hypersegmented Neutrophils", "isAbnormal": true },
          { "value": "Dimorphic RBC population (Microcytic Hypochromic + Macrocytic)", "isAbnormal": true },
          { "value": "Normocytic Normochromic with Polychromasia and Reticulocytosis", "isAbnormal": true }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "department": "BIOCHEMISTRY",
    "test": "H-ALB",
    "title": "H-ALB",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Random Urine)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative determination of Microalbumin (Human Albumin / H-ALB) in urine for early detection of diabetic nephropathy, hypertensive kidney damage, and vascular injury.",
    "notes": "Clinical Significance:\nH-ALB (Human Albumin / High-Sensitivity Urine Albumin / Microalbumin) is an early and sensitive biomarker for the detection of glomerular injury and endothelial dysfunction, particularly in patients with diabetes mellitus and systemic arterial hypertension.\n\nReference Ranges (Spot / Random Urine):\n• Normal (Normoalbuminuria) : < 10 µg/mL (or < 20 mg/L)\n• Microalbuminuria (Early Nephropathy) : 10 – 200 µg/mL (20 – 200 mg/L)\n• Macroalbuminuria (Overt Clinical Nephropathy) : > 200 µg/mL (> 200 mg/L)\n\nClinical Associations:\n1. Diabetic Nephropathy: Persistent microalbuminuria is the earliest clinical herald of diabetic nephropathy in both Type 1 and Type 2 diabetes. Early detection and aggressive glycemic/BP control (with ACEi / ARBs) can retard or reverse progressive renal decline.\n2. Hypertensive Renal Damage: Marker of target organ damage and increased cardiovascular morbidity/mortality risk.\n3. Glomerular & Endothelial Dysfunction: Preeclampsia, systemic lupus erythematosus (SLE) nephritis, glomerulonephritis, and generalized vascular inflammation.\n\nTransient Non-Specific Elevations (False Positives):\nTransient increases in urinary albumin excretion may occur due to vigorous physical exercise, urinary tract infection (UTI), acute febrile illness, hematuria, congestive heart failure, upright posture (orthostatic proteinuria), or severe hyperglycemia.\n\nRecommendation:\nConfirmation of persistent microalbuminuria requires at least 2 of 3 positive specimens collected over a 3 to 6-month period, ideally alongside an Albumin-to-Creatinine Ratio (ACR).",
    "interpretation": "Clinical Significance:\nH-ALB (Human Albumin / High-Sensitivity Urine Albumin / Microalbumin) is an early and sensitive biomarker for the detection of glomerular injury and endothelial dysfunction, particularly in patients with diabetes mellitus and systemic arterial hypertension.\n\nReference Ranges (Spot / Random Urine):\n• Normal (Normoalbuminuria) : < 10 µg/mL (or < 20 mg/L)\n• Microalbuminuria (Early Nephropathy) : 10 – 200 µg/mL (20 – 200 mg/L)\n• Macroalbuminuria (Overt Clinical Nephropathy) : > 200 µg/mL (> 200 mg/L)\n\nClinical Associations:\n1. Diabetic Nephropathy: Persistent microalbuminuria is the earliest clinical herald of diabetic nephropathy in both Type 1 and Type 2 diabetes. Early detection and aggressive glycemic/BP control (with ACEi / ARBs) can retard or reverse progressive renal decline.\n2. Hypertensive Renal Damage: Marker of target organ damage and increased cardiovascular morbidity/mortality risk.\n3. Glomerular & Endothelial Dysfunction: Preeclampsia, systemic lupus erythematosus (SLE) nephritis, glomerulonephritis, and generalized vascular inflammation.\n\nTransient Non-Specific Elevations (False Positives):\nTransient increases in urinary albumin excretion may occur due to vigorous physical exercise, urinary tract infection (UTI), acute febrile illness, hematuria, congestive heart failure, upright posture (orthostatic proteinuria), or severe hyperglycemia.\n\nRecommendation:\nConfirmation of persistent microalbuminuria requires at least 2 of 3 positive specimens collected over a 3 to 6-month period, ideally alongside an Albumin-to-Creatinine Ratio (ACR).",
    "parameters": [
      {
        "name": "H-ALB",
        "displayName": "H-ALB",
        "referenceRange": "< 10 µg/mL",
        "unit": "µg/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "department": "MICROBIOLOGY",
    "test": "Fluid c/s",
    "title": "Fluid c/s",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Body Fluid (Pleural / Ascitic / Synovial / Peritoneal / CSF)",
    "turnaroundTime": "48 - 72 Hours",
    "description": "Microbiological culture, bacterial identification, colony count, and antibiotic sensitivity testing for body fluid specimens.",
    "notes": "Sterile after 48 Hours. Incubation at 37°C.\n\nDate of Sample Collection:\nDate of Reporting:\n\nSample Type:\nOrganism Isolated:\nColony Count: <count> Cfu/ml.\n\nAntibiogram / Sensitivity Table:\nEvaluates 39 standard antibiotic susceptibility markers against isolated bacterial strains according to CLSI guidelines.",
    "interpretation": "MICROBIOLOGY - Culture and Sensitivity\n\nSterile after 48 Hours. Incubation at 37°C.\n\nDate of Sample Collection:\nDate of Reporting:\n\nSample Type:\nOrganism Isolated:\nColony Count: <count> Cfu/ml.\n\nAntibiotic Sensitivity Table:\n1. AMOXYCLAV (AMC)\n2. AMIKACIN (AK)\n3. AMPICILLIN (AMP)\n4. AMPICILLIN / SULBACTUM ( A/S)\n5. AZITHROMYCIN (AZM)\n6. AZTREONAM (AT)\n7. BACITRACIN (B)\n8. CEFADROXIL (CFR)\n9. CEFAZOLIN (CZ)\n10. CEFEPIME (CPM)\n11. CEFOPERAZONE (CPZ)\n12. CEFUROXIME (CXM)\n13. CEPHALOTHIN (CEP)\n14. CHLORAMPHENICOL (C)\n15. CIPROFLOXACIN (CIP)\n16. CLINDAMYCIN (CD)\n17. CO - TRIMOXAZOLE (COT)\n18. DOXYCYCLINE HYDROCHORIDE (DO)\n19. ERTAPENEM (ETP)\n20. ERYTHROMYCIN (E)\n21. FAROPENEM (FAR)\n22. GENTAMICIN (GEN)\n23. IMIPENEM (IPM)\n24. LEVOFLOXACIN (LE)\n25. LINEZOLIN (LZ)\n26. MEROPENEM (MRP)\n27. METHICILLIN (MET)\n28. MOXIFLOXACIN (MO)\n29. MUPIROCIN (MUP)\n30. NALIDIXIC ACID (NA)\n31. NETILLIN (NET)\n32. NITROFURANTOIN (NIT)\n33. NORFLOXACIN (NX)\n34. OFLOXACIN (OF)\n35. PIPERACILLIN /TAZOBACTAM (PIT)\n36. RIFAMPICIN (RIF)\n37. TEICOPLANIN (TEI)\n38. TETRACYCLINE (TE)\n39. VANCOMYCIN (VA)",
    "parameters": [
      {
        "name": "Incubation Status",
        "displayName": "Incubation Status",
        "referenceRange": "Sterile after 48 Hours. Incubation at 37°C.",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          { "value": "Sterile after 48 Hours. Incubation at 37°C.", "isAbnormal": false },
          { "value": "Sterile after 24 Hours. Incubation at 37°C.", "isAbnormal": false },
          { "value": "Growth Seen after 24 Hours.", "isAbnormal": true },
          { "value": "Growth Seen after 48 Hours.", "isAbnormal": true }
        ],
        "status": "Active"
      },
      {
        "name": "Sample Type",
        "displayName": "Sample Type",
        "referenceRange": "Pleural / Ascitic / Synovial / Peritoneal / CSF",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Pleural Fluid", "isAbnormal": false },
          { "value": "Ascitic Fluid", "isAbnormal": false },
          { "value": "Peritoneal Fluid", "isAbnormal": false },
          { "value": "Synovial Fluid", "isAbnormal": false },
          { "value": "Pericardial Fluid", "isAbnormal": false },
          { "value": "CSF (Cerebrospinal Fluid)", "isAbnormal": false },
          { "value": "Body Fluid", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "Organism Isolated",
        "displayName": "Organism Isolated",
        "referenceRange": "No Growth / Sterile",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          { "value": "No Growth", "isAbnormal": false },
          { "value": "Sterile", "isAbnormal": false },
          { "value": "Staphylococcus aureus", "isAbnormal": true },
          { "value": "Methicillin-Resistant Staphylococcus aureus (MRSA)", "isAbnormal": true },
          { "value": "Escherichia coli", "isAbnormal": true },
          { "value": "Klebsiella pneumoniae", "isAbnormal": true },
          { "value": "Pseudomonas aeruginosa", "isAbnormal": true },
          { "value": "Acinetobacter baumannii", "isAbnormal": true },
          { "value": "Enterococcus faecalis", "isAbnormal": true },
          { "value": "Streptococcus pneumoniae", "isAbnormal": true }
        ],
        "status": "Active"
      },
      {
        "name": "Colony Count",
        "displayName": "Colony Count",
        "referenceRange": "< 10^3 Cfu/ml",
        "unit": "Cfu/ml",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "1. AMOXYCLAV (AMC)",
        "displayName": "1. AMOXYCLAV (AMC)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "2. AMIKACIN (AK)",
        "displayName": "2. AMIKACIN (AK)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "3. AMPICILLIN (AMP)",
        "displayName": "3. AMPICILLIN (AMP)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "4. AMPICILLIN / SULBACTUM ( A/S)",
        "displayName": "4. AMPICILLIN / SULBACTUM ( A/S)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "5. AZITHROMYCIN (AZM)",
        "displayName": "5. AZITHROMYCIN (AZM)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "6. AZTREONAM (AT)",
        "displayName": "6. AZTREONAM (AT)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "7. BACITRACIN (B)",
        "displayName": "7. BACITRACIN (B)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "8. CEFADROXIL (CFR)",
        "displayName": "8. CEFADROXIL (CFR)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "9. CEFAZOLIN (CZ)",
        "displayName": "9. CEFAZOLIN (CZ)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "10. CEFEPIME (CPM)",
        "displayName": "10. CEFEPIME (CPM)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "11. CEFOPERAZONE (CPZ)",
        "displayName": "11. CEFOPERAZONE (CPZ)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "12. CEFUROXIME (CXM)",
        "displayName": "12. CEFUROXIME (CXM)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "13. CEPHALOTHIN (CEP)",
        "displayName": "13. CEPHALOTHIN (CEP)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "14. CHLORAMPHENICOL (C)",
        "displayName": "14. CHLORAMPHENICOL (C)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "15. CIPROFLOXACIN (CIP)",
        "displayName": "15. CIPROFLOXACIN (CIP)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "16. CLINDAMYCIN (CD)",
        "displayName": "16. CLINDAMYCIN (CD)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "17. CO - TRIMOXAZOLE (COT)",
        "displayName": "17. CO - TRIMOXAZOLE (COT)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "18. DOXYCYCLINE HYDROCHORIDE (DO)",
        "displayName": "18. DOXYCYCLINE HYDROCHORIDE (DO)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "19. ERTAPENEM (ETP)",
        "displayName": "19. ERTAPENEM (ETP)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "20. ERYTHROMYCIN (E)",
        "displayName": "20. ERYTHROMYCIN (E)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "21. FAROPENEM (FAR)",
        "displayName": "21. FAROPENEM (FAR)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "22. GENTAMICIN (GEN)",
        "displayName": "22. GENTAMICIN (GEN)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "23. IMIPENEM (IPM)",
        "displayName": "23. IMIPENEM (IPM)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "24. LEVOFLOXACIN (LE)",
        "displayName": "24. LEVOFLOXACIN (LE)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "25. LINEZOLIN (LZ)",
        "displayName": "25. LINEZOLIN (LZ)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "26. MEROPENEM (MRP)",
        "displayName": "26. MEROPENEM (MRP)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "27. METHICILLIN (MET)",
        "displayName": "27. METHICILLIN (MET)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "28. MOXIFLOXACIN (MO)",
        "displayName": "28. MOXIFLOXACIN (MO)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "29. MUPIROCIN (MUP)",
        "displayName": "29. MUPIROCIN (MUP)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "30. NALIDIXIC ACID (NA)",
        "displayName": "30. NALIDIXIC ACID (NA)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "31. NETILLIN (NET)",
        "displayName": "31. NETILLIN (NET)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "32. NITROFURANTOIN (NIT)",
        "displayName": "32. NITROFURANTOIN (NIT)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "33. NORFLOXACIN (NX)",
        "displayName": "33. NORFLOXACIN (NX)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "34. OFLOXACIN (OF)",
        "displayName": "34. OFLOXACIN (OF)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "35. PIPERACILLIN /TAZOBACTAM (PIT)",
        "displayName": "35. PIPERACILLIN /TAZOBACTAM (PIT)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "36. RIFAMPICIN (RIF)",
        "displayName": "36. RIFAMPICIN (RIF)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "37. TEICOPLANIN (TEI)",
        "displayName": "37. TEICOPLANIN (TEI)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "38. TETRACYCLINE (TE)",
        "displayName": "38. TETRACYCLINE (TE)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      },
      {
        "name": "39. VANCOMYCIN (VA)",
        "displayName": "39. VANCOMYCIN (VA)",
        "referenceRange": "Sensitive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          { "value": "Sensitive", "isAbnormal": false },
          { "value": "Resistant", "isAbnormal": true },
          { "value": "Intermediate", "isAbnormal": true },
          { "value": "Moderate Sensitive", "isAbnormal": false },
          { "value": "Not Tested", "isAbnormal": false },
          { "value": "—", "isAbnormal": false }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "department": "SEROLOGY & IMMUNOLOGY",
    "test": "Anti Cardiolipin IgG",
    "title": "Anti Cardiolipin IgG",
    "basePrice": 850,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative determination of Anti-Cardiolipin IgG (ACA IgG) antibodies in serum for the diagnosis and risk assessment of Antiphospholipid Syndrome (APS), thrombosis, and recurrent fetal loss.",
    "notes": "RESULT IN GPL | REMARKS\n<15           | Negative\n15-20         | Equivocal\n20-80         | Low Positive\n>80           | High Positive\n\nComments:\nACA is a type of antiphospholipid antibody.\nDiagnostic Importance: ACA are significant in diagnosing -\n1. Venous or arterial thrombosis\n2. Thrombocytopenia\n3. Livedo Reticularis\n4. Recurrent miscarriages\n5. Neurological symptoms\nOther Associations: Elevated ACA levels can also be linked to cardiovascular insufficiency and myocardial infarction.",
    "interpretation": "RESULT IN GPL | REMARKS\n<15           | Negative\n15-20         | Equivocal\n20-80         | Low Positive\n>80           | High Positive\n\nComments:\nACA is a type of antiphospholipid antibody.\nDiagnostic Importance: ACA are significant in diagnosing -\n1. Venous or arterial thrombosis\n2. Thrombocytopenia\n3. Livedo Reticularis\n4. Recurrent miscarriages\n5. Neurological symptoms\nOther Associations: Elevated ACA levels can also be linked to cardiovascular insufficiency and myocardial infarction.",
    "parameters": [
      {
        "name": "Anti Cardiolipin IgG",
        "displayName": "Anti Cardiolipin IgG",
        "referenceRange": "< 15",
        "unit": "GPL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "department": "SEROLOGY & IMMUNOLOGY",
    "test": "Anti Cardiolipin IgM",
    "title": "Anti Cardiolipin IgM",
    "basePrice": 850,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative determination of Anti-Cardiolipin IgM (ACA IgM) antibodies in serum for the diagnosis and risk assessment of Antiphospholipid Syndrome (APS), acute thrombosis, and autoimmune vascular disorders.",
    "notes": "RESULT IN MPL | REMARKS\n<15           | Negative\n15-20         | Equivocal\n20-80         | Low Positive\n>80           | High Positive\n\nComments:\nACA is a type of antiphospholipid antibody.\nDiagnostic Importance: ACA are significant in diagnosing -\n1. Venous or arterial thrombosis\n2. Thrombocytopenia\n3. Livedo Reticularis\n4. Recurrent miscarriages\n5. Neurological symptoms\nOther Associations: Elevated ACA levels can also be linked to cardiovascular insufficiency and myocardial infarction.",
    "interpretation": "RESULT IN MPL | REMARKS\n<15           | Negative\n15-20         | Equivocal\n20-80         | Low Positive\n>80           | High Positive\n\nComments:\nACA is a type of antiphospholipid antibody.\nDiagnostic Importance: ACA are significant in diagnosing -\n1. Venous or arterial thrombosis\n2. Thrombocytopenia\n3. Livedo Reticularis\n4. Recurrent miscarriages\n5. Neurological symptoms\nOther Associations: Elevated ACA levels can also be linked to cardiovascular insufficiency and myocardial infarction.",
    "parameters": [
      {
        "name": "Anti Cardiolipin IgM",
        "displayName": "Anti Cardiolipin IgM",
        "referenceRange": "< 15",
        "unit": "MPL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "department": "SEROLOGY & IMMUNOLOGY",
    "test": "Anti-HAV",
    "title": "Anti-HAV",
    "basePrice": 750,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative determination of total antibodies to Hepatitis A Virus (Anti-HAV Total / IgG + IgM) in serum for assessing past exposure, natural immunity, or response to Hepatitis A vaccination.",
    "notes": "Clinical Significance & Interpretation:\nAnti-HAV (Total Antibody) measures both IgG and IgM antibodies to Hepatitis A Virus. It is used to detect past exposure, verify immunity post-vaccination, or evaluate suspected Hepatitis A infection.\n\nReference Cut-offs (mIU/mL):\n• < 20 mIU/mL : Non-Reactive / Negative (Non-Immune / No detectable antibodies to Hepatitis A Virus)\n• ≥ 20 mIU/mL : Reactive / Positive (Immune / Detectable antibodies to Hepatitis A Virus due to past infection or vaccination)\n\nClinical Guidance:\n1. Reactive (≥ 20 mIU/mL): Indicates immunity to Hepatitis A Virus acquired either from past resolved infection or successful Hepatitis A vaccination.\n2. Non-Reactive (< 20 mIU/mL): Indicates non-immunity and susceptibility to Hepatitis A infection. Vaccination is recommended for high-risk individuals and travelers.\n3. For acute infection evaluation: If acute viral hepatitis is clinically suspected (elevated ALT/AST, acute jaundice), Anti-HAV IgM testing should be performed.",
    "interpretation": "Clinical Significance & Interpretation:\nAnti-HAV (Total Antibody) measures both IgG and IgM antibodies to Hepatitis A Virus. It is used to detect past exposure, verify immunity post-vaccination, or evaluate suspected Hepatitis A infection.\n\nReference Cut-offs (mIU/mL):\n• < 20 mIU/mL : Non-Reactive / Negative (Non-Immune / No detectable antibodies to Hepatitis A Virus)\n• ≥ 20 mIU/mL : Reactive / Positive (Immune / Detectable antibodies to Hepatitis A Virus due to past infection or vaccination)\n\nClinical Guidance:\n1. Reactive (≥ 20 mIU/mL): Indicates immunity to Hepatitis A Virus acquired either from past resolved infection or successful Hepatitis A vaccination.\n2. Non-Reactive (< 20 mIU/mL): Indicates non-immunity and susceptibility to Hepatitis A infection. Vaccination is recommended for high-risk individuals and travelers.\n3. For acute infection evaluation: If acute viral hepatitis is clinically suspected (elevated ALT/AST, acute jaundice), Anti-HAV IgM testing should be performed.",
    "parameters": [
      {
        "name": "Anti-HAV",
        "displayName": "Anti-HAV",
        "referenceRange": "< 20 mIU/mL",
        "unit": "mIU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HSV-2 IgG",
    "title": "HSV-2 IgG",
    "basePrice": 750,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative/Qualitative determination of Herpes Simplex Virus Type 2 (HSV-2) IgG antibodies in human serum.",
    "notes": "Methodology: Chemiluminescence Immunoassay (CLIA) / ELISA\n\nClinical Utility:\nHerpes Simplex Virus Type 2 (HSV-2) is the primary causative agent of genital ulcer disease and neonatal herpes infections. Detection of specific IgG antibodies is used for assessing exposure history, diagnosis of past/chronic infection, and identification of asymptomatic HSV-2 carriers.\n\nInterpretation:\n• < 2.0 AU/mL : Negative (No detectable HSV-2 IgG antibodies)\n• ≥ 2.0 AU/mL : Positive (Detectable HSV-2 IgG antibodies present)\n\nComments & Clinical Guidance:\n1. A Negative (< 2.0 AU/mL) result indicates no detectable HSV-2 IgG antibodies. If primary infection is clinically suspected, retesting in 2-4 weeks is advised to allow for seroconversion.\n2. A Positive (≥ 2.0 AU/mL) result indicates prior exposure and antibody production. Because HSV remains latent after initial infection, the presence of IgG antibodies indicates latent carriage and does not distinguish between acute, recurrent, or remote asymptomatic infection.\n3. Clinical correlation and direct diagnostic methods (e.g. HSV PCR / viral swab from active lesions) should be used during acute clinical presentations.",
    "interpretation": "Methodology: Chemiluminescence Immunoassay (CLIA) / ELISA\n\nClinical Utility:\nHerpes Simplex Virus Type 2 (HSV-2) is the primary causative agent of genital ulcer disease and neonatal herpes infections. Detection of specific IgG antibodies is used for assessing exposure history, diagnosis of past/chronic infection, and identification of asymptomatic HSV-2 carriers.\n\nInterpretation:\n• < 2.0 AU/mL : Negative (No detectable HSV-2 IgG antibodies)\n• ≥ 2.0 AU/mL : Positive (Detectable HSV-2 IgG antibodies present)\n\nComments & Clinical Guidance:\n1. A Negative (< 2.0 AU/mL) result indicates no detectable HSV-2 IgG antibodies. If primary infection is clinically suspected, retesting in 2-4 weeks is advised to allow for seroconversion.\n2. A Positive (≥ 2.0 AU/mL) result indicates prior exposure and antibody production. Because HSV remains latent after initial infection, the presence of IgG antibodies indicates latent carriage and does not distinguish between acute, recurrent, or remote asymptomatic infection.\n3. Clinical correlation and direct diagnostic methods (e.g. HSV PCR / viral swab from active lesions) should be used during acute clinical presentations.",
    "parameters": [
      {
        "name": "HSV-2 IgG",
        "referenceRange": "< 2.0",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "iCalcium",
    "title": "iCalcium",
    "basePrice": 400,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative measurement of Ionized Calcium (iCalcium) in blood to evaluate physiologically active calcium and calcium homeostasis.",
    "notes": "Physiological Basis\nCalcium circulates in three forms: as free Ca2+ (50–55%), protein bound to albumin and globulins (40–45%), and as calcium-ligand complexes (5–10%) (with citrate, bicarbonate, lactate, phosphate, and sulfate). Protein binding is highly pH-dependent, and acidosis results in an increased free calcium fraction. Ionized Ca2+ is the form that is physiologically active. Ionized calcium is a more accurate reflection of physiologic status than total calcium in patients with altered serum proteins (renal failure, nephrotic syndrome, multiple myeloma, etc), altered concentrations of calcium-binding ligands, and acid-base disturbances. Measurement of ionized calcium is by ion-selective electrodes. Ionized calcium levels vary inversely with pH, about 0.2 mg/dL per 0.1 pH unit change.\n\nInterpretation\nIncreased in: ↓ Blood pH.\nDecreased in: ↑ Blood pH, citrate, EDTA.\n\nComments\nIonized calcium measurements may be needed in special circumstances, eg, massive blood transfusion, transfusion of whole blood in neonates, liver transplantation, neonatal hypocalcemia, cardiac bypass surgery, and possibly monitoring of patients with secondary hyperparathyroidism from renal failure.",
    "interpretation": "Physiological Basis\nCalcium circulates in three forms: as free Ca2+ (50–55%), protein bound to albumin and globulins (40–45%), and as calcium-ligand complexes (5–10%) (with citrate, bicarbonate, lactate, phosphate, and sulfate). Protein binding is highly pH-dependent, and acidosis results in an increased free calcium fraction. Ionized Ca2+ is the form that is physiologically active. Ionized calcium is a more accurate reflection of physiologic status than total calcium in patients with altered serum proteins (renal failure, nephrotic syndrome, multiple myeloma, etc), altered concentrations of calcium-binding ligands, and acid-base disturbances. Measurement of ionized calcium is by ion-selective electrodes. Ionized calcium levels vary inversely with pH, about 0.2 mg/dL per 0.1 pH unit change.\n\nInterpretation\nIncreased in: ↓ Blood pH.\nDecreased in: ↑ Blood pH, citrate, EDTA.\n\nComments\nIonized calcium measurements may be needed in special circumstances, eg, massive blood transfusion, transfusion of whole blood in neonates, liver transplantation, neonatal hypocalcemia, cardiac bypass surgery, and possibly monitoring of patients with secondary hyperparathyroidism from renal failure.",
    "parameters": [
      {
        "name": "iCalcium",
        "referenceRange": "1.13 - 1.33",
        "unit": "mmol/l",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "IgA (Urine)",
    "title": "IgA (Urine)",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Urine",
    "turnaroundTime": "24 Hours",
    "description": "Quantitative measurement of Immunoglobulin A (IgA) in urine for evaluating renal glomerular damage and IgA nephropathy.",
    "notes": "Methodology: Nephelometry / Turbidimetry / ELISA\n\nClinical Utility:\nImmunoglobulin A (IgA) is the principal immunoglobulin of mucosal immunity. In normal kidneys, intact immunoglobulins like IgA are minimally filtered across the glomerular filtration barrier. Increased urinary excretion of IgA is observed in diseases involving glomerular injury, particularly IgA Nephropathy (Berger's Disease), Henoch-Schönlein purpura (HSP) nephritis, and active urinary tract immune responses.\n\nInterpretation:\n• < 6.0 µg/mL : Normal urinary IgA excretion.\n• ≥ 6.0 µg/mL : Elevated urinary IgA excretion.\n\nClinical Significance of Elevated Urinary IgA:\n1. IgA Nephropathy (Berger's Disease): Associated with mesangial IgA deposition and increased urinary loss during active episodes.\n2. Glomerulonephritis / Nephrotic Syndrome: Increased glomerular permeability leading to proteinuria.\n3. Systemic Vasculitis / Autoimmune Disorders: Henoch-Schönlein Purpura (IgA vasculitis), SLE nephritis.\n4. Severe Urinary Tract Infection (UTI): Local mucosal antibody response to urothelial infection.\n\nComments & Guidance:\n• Urinary IgA should be interpreted in conjunction with total urinary protein, urine microalbumin, serum IgA, renal function tests (serum creatinine, BUN), and renal biopsy when clinically indicated.",
    "interpretation": "Methodology: Nephelometry / Turbidimetry / ELISA\n\nClinical Utility:\nImmunoglobulin A (IgA) is the principal immunoglobulin of mucosal immunity. In normal kidneys, intact immunoglobulins like IgA are minimally filtered across the glomerular filtration barrier. Increased urinary excretion of IgA is observed in diseases involving glomerular injury, particularly IgA Nephropathy (Berger's Disease), Henoch-Schönlein purpura (HSP) nephritis, and active urinary tract immune responses.\n\nInterpretation:\n• < 6.0 µg/mL : Normal urinary IgA excretion.\n• ≥ 6.0 µg/mL : Elevated urinary IgA excretion.\n\nClinical Significance of Elevated Urinary IgA:\n1. IgA Nephropathy (Berger's Disease): Associated with mesangial IgA deposition and increased urinary loss during active episodes.\n2. Glomerulonephritis / Nephrotic Syndrome: Increased glomerular permeability leading to proteinuria.\n3. Systemic Vasculitis / Autoimmune Disorders: Henoch-Schönlein Purpura (IgA vasculitis), SLE nephritis.\n4. Severe Urinary Tract Infection (UTI): Local mucosal antibody response to urothelial infection.\n\nComments & Guidance:\n• Urinary IgA should be interpreted in conjunction with total urinary protein, urine microalbumin, serum IgA, renal function tests (serum creatinine, BUN), and renal biopsy when clinically indicated.",
    "parameters": [
      {
        "name": "IgA (Urine)",
        "referenceRange": "< 6.0",
        "unit": "µg/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Indirect Coomb's Test",
    "title": "Indirect Coomb's Test",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Indirect Antiglobulin Test (IAT / Indirect Coombs Test) for detecting circulating red blood cell alloantibodies and autoantibodies.",
    "notes": "Physiologic Basis\nIndirect antiglobulin test is used to demonstrate the presence in the patient’s serum/plasma of unexpected antibody to ABO and Rh-compatible reagent red blood cells. Patient serum or plasma is incubated in vitro with reagent red cells, which are then washed to remove unbound globulins. Agglutination that occurs when antihuman globulin (AHG, Coombs) reagent is added indicates that antibody has bound to a specific antigen present on the red cells.\n\nInterpretation\nPositive in: Presence of alloantibody or autoantibody. Drugs: methyldopa.\n\nComments\nThe technique is used in antibody detection and identification, and in the AHG crossmatch prior to transfusion.",
    "interpretation": "Physiologic Basis\nIndirect antiglobulin test is used to demonstrate the presence in the patient’s serum/plasma of unexpected antibody to ABO and Rh-compatible reagent red blood cells. Patient serum or plasma is incubated in vitro with reagent red cells, which are then washed to remove unbound globulins. Agglutination that occurs when antihuman globulin (AHG, Coombs) reagent is added indicates that antibody has bound to a specific antigen present on the red cells.\n\nInterpretation\nPositive in: Presence of alloantibody or autoantibody. Drugs: methyldopa.\n\nComments\nThe technique is used in antibody detection and identification, and in the AHG crossmatch prior to transfusion.",
    "parameters": [
      {
        "name": "Indirect Coomb's Test",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Positive (1+)",
            "isAbnormal": true
          },
          {
            "value": "Positive (2+)",
            "isAbnormal": true
          },
          {
            "value": "Positive (3+)",
            "isAbnormal": true
          },
          {
            "value": "Positive (4+)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Iron Studies",
    "title": "Iron Studies",
    "basePrice": 850,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Comprehensive iron profile including Serum Iron, UIBC, Total Iron Binding Capacity (TIBC), and Transferrin Saturation for diagnosing iron deficiency and iron overload disorders.",
    "notes": "Physiological basis\nPlasma iron concentration is determined by absorption from the intestine; storage in the intestine, liver, spleen, bone marrow, rate of breakdown or loss of hemoglobin, and rate of synthesis of new hemoglobin.\n\nInterpretation for Iron (Fe), serum or plasma:\n• Increased in: Hemosiderosis (eg, multiple transfusions, excess iron administration), acute Fe poisoning (children), hemolytic anemia, pernicious anemia, aplastic or hypoplastic anemia, viral hepatitis, lead poisoning, thalassemia, hemochromatosis. Drugs: estrogens, ethanol, oral contraceptives.\n• Decreased in: Iron deficiency, nephrotic syndrome, chronic renal failure, many infections, active hematopoiesis, remission of pernicious anemia, hypothyroidism, malignancy (carcinoma), postoperative state, kwashiorkor.\n\nTotal Iron Binding Capacity (TIBC):\nTIBC correlates with serum transferrin, but the relationship is not linear over a wide range of transferrin values and is disrupted in diseases affecting transferrin-binding capacity or other iron-binding proteins.\n• Increased in: Iron deficiency anemia, late pregnancy, infancy, acute hepatitis. Drugs: oral contraceptives.\n• Decreased in: Hypoproteinemic states (eg, nephrotic syndrome, starvation, malnutrition, cancer), hemochromatosis, thalassemia, hyperthyroidism, chronic infections, chronic inflammatory disorders, chronic liver disease, and other chronic diseases.\n\nTransferrin Saturation (%):\n• Increased % transferrin saturation with iron is seen in iron overload (iron poisoning, hemolytic anemia, sideroblastic anemia, thalassemia, hemochromatosis, pyridoxine deficiency, aplastic anemia, RBC transfusions).\n• Decreased % transferrin saturation with iron is seen in iron deficiency (usually saturation < 16%). It can also be used to assess nutritional status.",
    "interpretation": "Physiological basis\nPlasma iron concentration is determined by absorption from the intestine; storage in the intestine, liver, spleen, bone marrow, rate of breakdown or loss of hemoglobin, and rate of synthesis of new hemoglobin.\n\nInterpretation for Iron (Fe), serum or plasma:\n• Increased in: Hemosiderosis (eg, multiple transfusions, excess iron administration), acute Fe poisoning (children), hemolytic anemia, pernicious anemia, aplastic or hypoplastic anemia, viral hepatitis, lead poisoning, thalassemia, hemochromatosis. Drugs: estrogens, ethanol, oral contraceptives.\n• Decreased in: Iron deficiency, nephrotic syndrome, chronic renal failure, many infections, active hematopoiesis, remission of pernicious anemia, hypothyroidism, malignancy (carcinoma), postoperative state, kwashiorkor.\n\nTotal Iron Binding Capacity (TIBC):\nTIBC correlates with serum transferrin, but the relationship is not linear over a wide range of transferrin values and is disrupted in diseases affecting transferrin-binding capacity or other iron-binding proteins.\n• Increased in: Iron deficiency anemia, late pregnancy, infancy, acute hepatitis. Drugs: oral contraceptives.\n• Decreased in: Hypoproteinemic states (eg, nephrotic syndrome, starvation, malnutrition, cancer), hemochromatosis, thalassemia, hyperthyroidism, chronic infections, chronic inflammatory disorders, chronic liver disease, and other chronic diseases.\n\nTransferrin Saturation (%):\n• Increased % transferrin saturation with iron is seen in iron overload (iron poisoning, hemolytic anemia, sideroblastic anemia, thalassemia, hemochromatosis, pyridoxine deficiency, aplastic anemia, RBC transfusions).\n• Decreased % transferrin saturation with iron is seen in iron deficiency (usually saturation < 16%). It can also be used to assess nutritional status.",
    "parameters": [
      {
        "name": "Iron",
        "referenceRange": "65 - 175",
        "unit": "µg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "UIBC",
        "referenceRange": "155 - 355",
        "unit": "µg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total Iron Binding Capacity (TIBC)",
        "referenceRange": "240 - 450",
        "unit": "µg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Transferrin Saturation",
        "referenceRange": "20 - 55",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "LH",
    "title": "LH (Luteinising Hormone)",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative measurement of Luteinising Hormone (LH) in serum to evaluate gonadal function, fertility, pituitary disorders, and PCOS.",
    "notes": "Physiological basis :\nLH is stimulated by the hypothalamic hormone gonadotropin- releasing hormone (GnRH). It is secreted from the anterior pituitary and acts on the gonads. LH is the principal regulator of steroid biosynthesis in the ovary and testis.\n\nInterpretation :\nIncreased in: Primary hypogonadism, polycystic ovary syndrome, postmenopause, endometriosis, after depot leuprolide injection; immunoassay result may be falsely elevated in pregnancy.\nDecreased in: Pituitary or hypothalamic failure, anorexia nervosa, bulimia, advanced prostate cancer, severe stress, malnutrition, Kallman syndrome (gonadotropin deficiency associated with anosmia). Drugs: digoxin, oral contraceptives, phenothiazines.\n\nComments\nIn male hypogonadism, serum LH and FSH levels can distinguish between primary (hypergonadotropic) and secondary (hypogonadotropic) hypogonadism. Hypogonadism associated with aging (andropause) may present a mixed picture, with low testosterone levels and low to low-normal gonadotropin levels. Repeated measurement may be required to diagnose gonadotropin deficiencies.\nElevated serum LH levels are a common feature in polycystic ovary syndrome, but measurement of total testosterone is the test of choice to diagnose polycystic ovary syndrome.",
    "interpretation": "Physiological basis :\nLH is stimulated by the hypothalamic hormone gonadotropin- releasing hormone (GnRH). It is secreted from the anterior pituitary and acts on the gonads. LH is the principal regulator of steroid biosynthesis in the ovary and testis.\n\nInterpretation :\nIncreased in: Primary hypogonadism, polycystic ovary syndrome, postmenopause, endometriosis, after depot leuprolide injection; immunoassay result may be falsely elevated in pregnancy.\nDecreased in: Pituitary or hypothalamic failure, anorexia nervosa, bulimia, advanced prostate cancer, severe stress, malnutrition, Kallman syndrome (gonadotropin deficiency associated with anosmia). Drugs: digoxin, oral contraceptives, phenothiazines.\n\nComments\nIn male hypogonadism, serum LH and FSH levels can distinguish between primary (hypergonadotropic) and secondary (hypogonadotropic) hypogonadism. Hypogonadism associated with aging (andropause) may present a mixed picture, with low testosterone levels and low to low-normal gonadotropin levels. Repeated measurement may be required to diagnose gonadotropin deficiencies.\nElevated serum LH levels are a common feature in polycystic ovary syndrome, but measurement of total testosterone is the test of choice to diagnose polycystic ovary syndrome.",
    "parameters": [
      {
        "name": "Luteinising Hormone, LH",
        "referenceRange": "1.7 - 8.6",
        "unit": "mIU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Lipase",
    "title": "Lipase",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative measurement of serum Lipase activity for the diagnosis and monitoring of acute pancreatitis and pancreatic disorders.",
    "notes": "Physiologic Basis\nLipases are responsible for hydrolysis of glycerol esters of long-chain fatty acids to produce fatty acids and glycerol.\n\nInterpretation\nIncreased in: Acute, recurrent, or chronic pancreatitis, pancreatic pseudocyst, pancreatic malignancy, peritonitis, biliary disease, hepatic disease, diabetes mellitus (especially diabetic ketoacidosis), intestinal disease, gastric malignancy or perforation, cystic fibrosis, inflammatory bowel disease (Crohn disease and ulcerative colitis).\n\nComments\nSerum lipase may be a more reliable test than serum amylase for the initial diagnosis of acute pancreatitis, because of its increased sensitivity in acute alcoholic pancreatitis and because lipase remains elevated longer than amylase.",
    "interpretation": "Physiologic Basis\nLipases are responsible for hydrolysis of glycerol esters of long-chain fatty acids to produce fatty acids and glycerol.\n\nInterpretation\nIncreased in: Acute, recurrent, or chronic pancreatitis, pancreatic pseudocyst, pancreatic malignancy, peritonitis, biliary disease, hepatic disease, diabetes mellitus (especially diabetic ketoacidosis), intestinal disease, gastric malignancy or perforation, cystic fibrosis, inflammatory bowel disease (Crohn disease and ulcerative colitis).\n\nComments\nSerum lipase may be a more reliable test than serum amylase for the initial diagnosis of acute pancreatitis, because of its increased sensitivity in acute alcoholic pancreatitis and because lipase remains elevated longer than amylase.",
    "parameters": [
      {
        "name": "Lipase",
        "referenceRange": "0 - 67",
        "unit": "U/l",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "LDL Cholesterol",
    "title": "LDL Cholesterol",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Direct measurement of Low-Density Lipoprotein (LDL) Cholesterol in serum for cardiovascular risk assessment and lipid disorder management.",
    "notes": "Clinical Significance:\nLow-Density Lipoprotein (LDL) cholesterol is the primary atherogenic lipoprotein. Elevated levels of circulating LDL cholesterol lead to plaque deposition in arterial walls (atherosclerosis), increasing the risk of coronary artery disease (CAD), myocardial infarction, and stroke.\n\nNational Cholesterol Education Program (NCEP ATP III) Risk Categories:\n• < 100 mg/dL : Optimal\n• 100 – 129 mg/dL : Near optimal / Above optimal\n• 130 – 159 mg/dL : Borderline high\n• 160 – 189 mg/dL : High\n• ≥ 190 mg/dL : Very high\n\nCauses of Elevated LDL:\n• Familial hypercholesterolemia, familial combined hyperlipidemia\n• High saturated fat and trans-fat diets, obesity, sedentary lifestyle\n• Secondary causes: Hypothyroidism, nephrotic syndrome, chronic kidney disease, diabetes mellitus, cholestasis\n• Drugs: Progestins, anabolic steroids, corticosteroids\n\nComments & Clinical Management:\nTarget LDL goals depend on individual cardiovascular risk profile (history of CAD, diabetes, smoking, hypertension). Lifestyle modifications and statin therapy are primary interventions.",
    "interpretation": "Clinical Significance:\nLow-Density Lipoprotein (LDL) cholesterol is the primary atherogenic lipoprotein. Elevated levels of circulating LDL cholesterol lead to plaque deposition in arterial walls (atherosclerosis), increasing the risk of coronary artery disease (CAD), myocardial infarction, and stroke.\n\nNational Cholesterol Education Program (NCEP ATP III) Risk Categories:\n• < 100 mg/dL : Optimal\n• 100 – 129 mg/dL : Near optimal / Above optimal\n• 130 – 159 mg/dL : Borderline high\n• 160 – 189 mg/dL : High\n• ≥ 190 mg/dL : Very high\n\nCauses of Elevated LDL:\n• Familial hypercholesterolemia, familial combined hyperlipidemia\n• High saturated fat and trans-fat diets, obesity, sedentary lifestyle\n• Secondary causes: Hypothyroidism, nephrotic syndrome, chronic kidney disease, diabetes mellitus, cholestasis\n• Drugs: Progestins, anabolic steroids, corticosteroids\n\nComments & Clinical Management:\nTarget LDL goals depend on individual cardiovascular risk profile (history of CAD, diabetes, smoking, hypertension). Lifestyle modifications and statin therapy are primary interventions.",
    "parameters": [
      {
        "name": "LDL Cholesterol",
        "referenceRange": "85 - 130",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "LDL / HDL",
    "title": "LDL / HDL Ratio",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Calculated ratio of Low-Density Lipoprotein (LDL) to High-Density Lipoprotein (HDL) for atherogenic risk assessment and cardiovascular disease evaluation.",
    "notes": "Clinical Significance:\nThe LDL/HDL Ratio is an important atherogenic index used to evaluate the balance between pro-atherogenic (LDL) and anti-atherogenic (HDL) lipoprotein fractions. It provides superior risk stratification for coronary artery disease (CAD) and cardiovascular events compared to LDL cholesterol alone.\n\nInterpretation & Risk Stratification:\n• < 1.5 : Low cardiovascular risk / Desirable\n• 1.5 – 3.5 : Average / Moderate cardiovascular risk\n• 3.5 – 5.0 : High cardiovascular risk\n• > 5.0 : Very high risk of coronary heart disease\n\nClinical Indications:\n• Comprehensive coronary heart disease risk profiling\n• Monitoring the efficacy of lipid-lowering therapies (e.g., statins, fibrates)\n• Evaluating metabolic syndrome, diabetes mellitus, and atherogenic dyslipidemia\n\nRecommendations:\nAn optimal cardiovascular risk profile is supported by maintaining an LDL/HDL ratio < 3.0 (ideally < 2.5 in patients with established coronary disease or diabetes) alongside lifestyle changes including regular aerobic exercise, smoking cessation, and a diet rich in unsaturated fats.",
    "interpretation": "Clinical Significance:\nThe LDL/HDL Ratio is an important atherogenic index used to evaluate the balance between pro-atherogenic (LDL) and anti-atherogenic (HDL) lipoprotein fractions. It provides superior risk stratification for coronary artery disease (CAD) and cardiovascular events compared to LDL cholesterol alone.\n\nInterpretation & Risk Stratification:\n• < 1.5 : Low cardiovascular risk / Desirable\n• 1.5 – 3.5 : Average / Moderate cardiovascular risk\n• 3.5 – 5.0 : High cardiovascular risk\n• > 5.0 : Very high risk of coronary heart disease\n\nClinical Indications:\n• Comprehensive coronary heart disease risk profiling\n• Monitoring the efficacy of lipid-lowering therapies (e.g., statins, fibrates)\n• Evaluating metabolic syndrome, diabetes mellitus, and atherogenic dyslipidemia\n\nRecommendations:\nAn optimal cardiovascular risk profile is supported by maintaining an LDL/HDL ratio < 3.0 (ideally < 2.5 in patients with established coronary disease or diabetes) alongside lifestyle changes including regular aerobic exercise, smoking cessation, and a diet rich in unsaturated fats.",
    "parameters": [
      {
        "name": "LDL / HDL",
        "referenceRange": "1.5 - 3.5",
        "unit": "",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Leukemia DLC",
    "title": "Leukemia DLC",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "Same Day",
    "description": "Specialized Differential Leukocyte Count (DLC) for detecting and quantifying immature precursor cells including Blast Cells, Promyelocytes, Myelocytes, Metamyelocytes, and Band Forms.",
    "notes": "Clinical Significance:\nLeukemia DLC (Differential Leukocyte Count) evaluates the presence and percentages of immature myeloid and lymphoid precursors in peripheral blood. The appearance of immature granulocytic precursors (promyelocytes, myelocytes, metamyelocytes, band forms) and blast cells indicates left shift, leukemoid reactions, myeloproliferative neoplasms (e.g., Chronic Myeloid Leukemia - CML), or acute leukemias (AML/ALL).\n\nReference Ranges:\n• Blast Cells: 0% (Nil in normal peripheral blood)\n• Promyelocytes: 0% (Nil)\n• Myelocytes: 0% (Nil)\n• Metamyelocytes: 0% (Nil)\n• BAND Cells: 0 – 5%\n\nClinical Associations:\n1. Acute Leukemias (AML, ALL): Marked proliferation of blast cells (typically ≥ 20% in bone marrow / prominent in peripheral blood) with hiatus leukaemicus.\n2. Chronic Myeloid Leukemia (CML): Spectrum of all stages of myeloid maturation (blasts, promyelocytes, myelocytes, metamyelocytes, bands, neutrophils) with prominent basophilia and eosinophilia.\n3. Leukemoid Reaction: Severe infections, burns, or tissue necrosis causing significant left shift with toxic granulation and Dohle bodies, but usually low blasts (< 5%).\n4. Myelodysplastic Syndromes (MDS): Dysplastic maturation, cytopenias, and variable blast percentages.\n\nComments & Guidance:\nCorrelation with complete blood counts (CBC), peripheral blood smear morphology, bone marrow aspirate/biopsy, cytochemistry, flow cytometry (immunophenotyping), and cytogenetics/molecular testing (e.g., BCR-ABL1) is recommended.",
    "interpretation": "Clinical Significance:\nLeukemia DLC (Differential Leukocyte Count) evaluates the presence and percentages of immature myeloid and lymphoid precursors in peripheral blood. The appearance of immature granulocytic precursors (promyelocytes, myelocytes, metamyelocytes, band forms) and blast cells indicates left shift, leukemoid reactions, myeloproliferative neoplasms (e.g., Chronic Myeloid Leukemia - CML), or acute leukemias (AML/ALL).\n\nReference Ranges:\n• Blast Cells: 0% (Nil in normal peripheral blood)\n• Promyelocytes: 0% (Nil)\n• Myelocytes: 0% (Nil)\n• Metamyelocytes: 0% (Nil)\n• BAND Cells: 0 – 5%\n\nClinical Associations:\n1. Acute Leukemias (AML, ALL): Marked proliferation of blast cells (typically ≥ 20% in bone marrow / prominent in peripheral blood) with hiatus leukaemicus.\n2. Chronic Myeloid Leukemia (CML): Spectrum of all stages of myeloid maturation (blasts, promyelocytes, myelocytes, metamyelocytes, bands, neutrophils) with prominent basophilia and eosinophilia.\n3. Leukemoid Reaction: Severe infections, burns, or tissue necrosis causing significant left shift with toxic granulation and Dohle bodies, but usually low blasts (< 5%).\n4. Myelodysplastic Syndromes (MDS): Dysplastic maturation, cytopenias, and variable blast percentages.\n\nComments & Guidance:\nCorrelation with complete blood counts (CBC), peripheral blood smear morphology, bone marrow aspirate/biopsy, cytochemistry, flow cytometry (immunophenotyping), and cytogenetics/molecular testing (e.g., BCR-ABL1) is recommended.",
    "parameters": [
      {
        "name": "Metamyelocytes",
        "referenceRange": "0 - 0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Myelocytes",
        "referenceRange": "0 - 0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Promyelocytes",
        "referenceRange": "0 - 0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Blast Cells",
        "referenceRange": "0 - 0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "BAND Cells",
        "referenceRange": "0 - 5",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Homocysteine",
    "title": "Homocysteine",
    "basePrice": 850,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "Same Day",
    "description": "Quantitative measurement of total Homocysteine in serum/plasma for cardiovascular risk evaluation, thrombosis screening, and assessing Vitamin B12/Folate status.",
    "notes": "Interpretation:\n• 5 – 15 µmol/L → Normal\n• 15 – 30 µmol/L → Mild elevation\n• 30 – 100 µmol/L → Moderate elevation\n• > 100 µmol/L → Severe elevation\n\nClinical Significance:\nHomocysteine is a sulfur-containing amino acid derived from methionine metabolism. Elevated plasma homocysteine (hyperhomocysteinemia) is an independent risk factor for atherosclerotic vascular disease (coronary artery disease, cerebrovascular disease, peripheral artery disease) and deep vein thrombosis / thromboembolism.\n\nCauses of Hyperhomocysteinemia:\n1. Nutritional Deficiencies: Vitamin B12, Vitamin B6 (pyridoxine), and Folate (folic acid) deficiencies.\n2. Genetic Defects: Cystathionine β-synthase (CBS) deficiency (homocystinuria), MTHFR gene mutations (C677T / A1298C variants).\n3. Chronic Renal Disease: Decreased renal clearance and altered metabolism.\n4. Lifestyle & Medications: Smoking, advancing age, high coffee consumption, methotrexate, phenytoin, metformin.\n\nComments:\nTherapeutic response to supplementation with Folic Acid, Vitamin B6, and Vitamin B12 often normalizes elevated plasma homocysteine levels.",
    "interpretation": "Interpretation:\n• 5 – 15 µmol/L → Normal\n• 15 – 30 µmol/L → Mild elevation\n• 30 – 100 µmol/L → Moderate elevation\n• > 100 µmol/L → Severe elevation\n\nClinical Significance:\nHomocysteine is a sulfur-containing amino acid derived from methionine metabolism. Elevated plasma homocysteine (hyperhomocysteinemia) is an independent risk factor for atherosclerotic vascular disease (coronary artery disease, cerebrovascular disease, peripheral artery disease) and deep vein thrombosis / thromboembolism.\n\nCauses of Hyperhomocysteinemia:\n1. Nutritional Deficiencies: Vitamin B12, Vitamin B6 (pyridoxine), and Folate (folic acid) deficiencies.\n2. Genetic Defects: Cystathionine β-synthase (CBS) deficiency (homocystinuria), MTHFR gene mutations (C677T / A1298C variants).\n3. Chronic Renal Disease: Decreased renal clearance and altered metabolism.\n4. Lifestyle & Medications: Smoking, advancing age, high coffee consumption, methotrexate, phenytoin, metformin.\n\nComments:\nTherapeutic response to supplementation with Folic Acid, Vitamin B6, and Vitamin B12 often normalizes elevated plasma homocysteine levels.",
    "parameters": [
      {
        "name": "Homocysteine",
        "referenceRange": "5 - 15",
        "unit": "µmol/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HIV (Card Test)",
    "title": "HIV (Card Test)",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "Same Day",
    "description": "Rapid immunochromatographic card test for the differential detection of Antibodies to Human Immunodeficiency Virus Type 1 and Type 2 (HIV-1 & HIV-2) in serum/plasma.",
    "notes": "Rapid card tests are screening tests, false positive and false negative results may occur due to various factors which may influence test results.\nAdvise: Kindly confirm by ELISA or Western blot method.\n\n1. A negative result implies that no Anti HIV – 1 & HIV - 2 antibodies have been detected in the sample by this method. This means that either the patient has not been exposed to HIV-1 or HIV-2 infection or the sample has been tested during the “WINDOW PHASE” (before the development of detectable levels of antibodies).\n2. A positive result suggests the possibilities of HIV-I and/or HIV-II infection. However, these results must be verified by a confirmatory test (IFA / WESTERN BLOT I-II) before pronouncing the patient positive for HIV-1 and/or HIV-2 infection.\n\nALL reactive samples should be confirmed by using HIV Western Blot/PCR.",
    "interpretation": "Rapid card tests are screening tests, false positive and false negative results may occur due to various factors which may influence test results.\nAdvise: Kindly confirm by ELISA or Western blot method.\n\n1. A negative result implies that no Anti HIV – 1 & HIV - 2 antibodies have been detected in the sample by this method. This means that either the patient has not been exposed to HIV-1 or HIV-2 infection or the sample has been tested during the “WINDOW PHASE” (before the development of detectable levels of antibodies).\n2. A positive result suggests the possibilities of HIV-I and/or HIV-II infection. However, these results must be verified by a confirmatory test (IFA / WESTERN BLOT I-II) before pronouncing the patient positive for HIV-1 and/or HIV-2 infection.\n\nALL reactive samples should be confirmed by using HIV Western Blot/PCR.",
    "parameters": [
      {
        "name": "HIV - 1",
        "referenceRange": "Non-Reactive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "HIV - 2",
        "referenceRange": "Non-Reactive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HIV ELISA I/II",
    "title": "HIV ELISA I/II",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "24 Hours",
    "description": "Quantitative/Qualitative Enzyme-Linked Immunosorbent Assay (ELISA) for the simultaneous detection of Antibodies to HIV-1 and HIV-2 (including p24 antigen).",
    "notes": "Methodology: Enzyme-Linked Immunosorbent Assay (ELISA) / 4th Generation Ag-Ab Assay\n\nResult Interpretation Guidelines:\n• Non-Reactive (< 0.90 S/CO Index) : No detectable HIV-1/2 antibodies or p24 antigen.\n• Equivocal / Borderline (0.90 – 1.10 S/CO Index) : Retest recommended with a fresh sample after 2 to 4 weeks.\n• Reactive (≥ 1.10 S/CO Index) : Presumptive presence of HIV-1/2 antibodies and/or p24 antigen.\n\nClinical Significance & Advisory:\n1. Non-Reactive Result: Indicates that HIV-1/2 antibodies (and p24 antigen in 4th Gen assays) were not detected. It does not exclude acute early infection during the initial \"Window Period\" (typically 2–4 weeks post-exposure). In cases of recent suspected exposure, repeat testing after 4–6 weeks is strongly recommended.\n2. Reactive Result: A reactive screening ELISA test must not be considered a definitive diagnosis of HIV infection. According to national (NACO / CDC / WHO) guidelines, ALL initially reactive specimens MUST be subjected to supplementary confirmatory testing (HIV Western Blot / Line Immunoassay / HIV-1 RNA Qualitative PCR) before establishing a final positive diagnosis.\n3. False Positives: May occasionally occur due to autoimmune conditions (SLE, rheumatoid factor), pregnancy, prior vaccinations, or severe hypergammaglobulinemia.\n\nGuidance:\nConfirmatory testing and pre/post-test counseling are strongly recommended for all reactive outcomes.",
    "interpretation": "Methodology: Enzyme-Linked Immunosorbent Assay (ELISA) / 4th Generation Ag-Ab Assay\n\nResult Interpretation Guidelines:\n• Non-Reactive (< 0.90 S/CO Index) : No detectable HIV-1/2 antibodies or p24 antigen.\n• Equivocal / Borderline (0.90 – 1.10 S/CO Index) : Retest recommended with a fresh sample after 2 to 4 weeks.\n• Reactive (≥ 1.10 S/CO Index) : Presumptive presence of HIV-1/2 antibodies and/or p24 antigen.\n\nClinical Significance & Advisory:\n1. Non-Reactive Result: Indicates that HIV-1/2 antibodies (and p24 antigen in 4th Gen assays) were not detected. It does not exclude acute early infection during the initial \"Window Period\" (typically 2–4 weeks post-exposure). In cases of recent suspected exposure, repeat testing after 4–6 weeks is strongly recommended.\n2. Reactive Result: A reactive screening ELISA test must not be considered a definitive diagnosis of HIV infection. According to national (NACO / CDC / WHO) guidelines, ALL initially reactive specimens MUST be subjected to supplementary confirmatory testing (HIV Western Blot / Line Immunoassay / HIV-1 RNA Qualitative PCR) before establishing a final positive diagnosis.\n3. False Positives: May occasionally occur due to autoimmune conditions (SLE, rheumatoid factor), pregnancy, prior vaccinations, or severe hypergammaglobulinemia.\n\nGuidance:\nConfirmatory testing and pre/post-test counseling are strongly recommended for all reactive outcomes.",
    "parameters": [
      {
        "name": "HIV ELISA I/II",
        "referenceRange": "Non-Reactive (< 0.90)",
        "unit": "Units",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Borderline / Equivocal",
            "isAbnormal": true
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HCV",
    "title": "Hepatitis C Virus (HCV)",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "Same Day",
    "description": "Serological test for the detection of antibodies to Hepatitis C Virus (Anti-HCV) in human serum or plasma.",
    "notes": "Interpretation:\n• Non-Reactive : Absence of antibodies to the Hepatitis C virus.\n• Reactive : Presence of antibodies to Hepatitis C virus.\n\nClinical Significance & Advisory:\n1. Reactive test result indicates the presence of Hepatitis C virus infection. Active infection to be confirmed by HCV RNA PCR test. It cannot differentiate between the stages of Hepatitis C viral infection nor used to monitor the efficacy of treatment.\n2. Non-Reactive test result indicates Hepatitis C virus infection is unlikely.\n3. False positive results may be observed in patients receiving mouse monoclonal antibodies, on heparin therapy, on biotin supplements for diagnosis or therapy or presence of heterophilic antibodies in serum.\n4. False negative reaction may be due to processing of sample collected early in the course of disease, Prozone phenomenon, Immunosuppression & Immuno-incompetence.\n\nUses:\nI. To diagnose suspected HCV infection in the risk group.\nII. Prenatal Screening of pregnant women and pre-surgical/interventional procedures work up.",
    "interpretation": "Interpretation:\n• Non-Reactive : Absence of antibodies to the Hepatitis C virus.\n• Reactive : Presence of antibodies to Hepatitis C virus.\n\nClinical Significance & Advisory:\n1. Reactive test result indicates the presence of Hepatitis C virus infection. Active infection to be confirmed by HCV RNA PCR test. It cannot differentiate between the stages of Hepatitis C viral infection nor used to monitor the efficacy of treatment.\n2. Non-Reactive test result indicates Hepatitis C virus infection is unlikely.\n3. False positive results may be observed in patients receiving mouse monoclonal antibodies, on heparin therapy, on biotin supplements for diagnosis or therapy or presence of heterophilic antibodies in serum.\n4. False negative reaction may be due to processing of sample collected early in the course of disease, Prozone phenomenon, Immunosuppression & Immuno-incompetence.\n\nUses:\nI. To diagnose suspected HCV infection in the risk group.\nII. Prenatal Screening of pregnant women and pre-surgical/interventional procedures work up.",
    "parameters": [
      {
        "name": "Hepatitis C Virus, HCV",
        "referenceRange": "Non-Reactive",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          },
          {
            "value": "Borderline / Equivocal",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HCT",
    "title": "Hematocrit Value, Hct",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative determination of Hematocrit (Packed Cell Volume - PCV) in whole blood for assessing anemia, polycythemia, and hydration status.",
    "notes": "Clinical Significance:\nHematocrit (Hct), also known as Packed Cell Volume (PCV), is the proportion of whole blood volume that is occupied by red blood cells (erythrocytes). It is a vital hematological parameter used in the evaluation of anemias, polycythemia, hemoconcentration, and fluid status.\n\nReference Ranges:\n• Adult Males: 40 – 50 %\n• Adult Females: 36 – 46 %\n• Children (varies by age): 31 – 43 %\n• Newborns: 44 – 64 %\n\nClinical Associations:\n1. Increased Hematocrit (Polycythemia / Hemoconcentration):\n   - Primary: Polycythemia vera.\n   - Secondary: Chronic hypoxia (COPD, cyanotic congenital heart disease, high altitude residence, heavy smoking).\n   - Relative (Hemoconcentration): Dehydration, severe burns, dengue hemorrhagic fever, shock, diabetic ketoacidosis.\n2. Decreased Hematocrit (Anemia / Hemodilution):\n   - Blood loss: Acute hemorrhage, chronic occult GI bleeding.\n   - Decreased erythropoiesis: Iron deficiency anemia, megaloblastic anemia (B12/folate deficiency), aplastic anemia, bone marrow infiltration, chronic kidney disease (erythropoietin deficiency).\n   - Increased destruction (Hemolysis): Autoimmune hemolytic anemia, sickle cell disease, thalassemia, microangiopathic hemolytic anemias.\n   - Fluid overload / Hemodilution: Congestive heart failure, excess IV fluid administration, pregnancy.\n\nComments:\nHematocrit should always be interpreted alongside Hemoglobin (Hb), Total RBC Count, Red Cell Indices (MCV, MCH, MCHC, RDW), and the patient's hydration status.",
    "interpretation": "Clinical Significance:\nHematocrit (Hct), also known as Packed Cell Volume (PCV), is the proportion of whole blood volume that is occupied by red blood cells (erythrocytes). It is a vital hematological parameter used in the evaluation of anemias, polycythemia, hemoconcentration, and fluid status.\n\nReference Ranges:\n• Adult Males: 40 – 50 %\n• Adult Females: 36 – 46 %\n• Children (varies by age): 31 – 43 %\n• Newborns: 44 – 64 %\n\nClinical Associations:\n1. Increased Hematocrit (Polycythemia / Hemoconcentration):\n   - Primary: Polycythemia vera.\n   - Secondary: Chronic hypoxia (COPD, cyanotic congenital heart disease, high altitude residence, heavy smoking).\n   - Relative (Hemoconcentration): Dehydration, severe burns, dengue hemorrhagic fever, shock, diabetic ketoacidosis.\n2. Decreased Hematocrit (Anemia / Hemodilution):\n   - Blood loss: Acute hemorrhage, chronic occult GI bleeding.\n   - Decreased erythropoiesis: Iron deficiency anemia, megaloblastic anemia (B12/folate deficiency), aplastic anemia, bone marrow infiltration, chronic kidney disease (erythropoietin deficiency).\n   - Increased destruction (Hemolysis): Autoimmune hemolytic anemia, sickle cell disease, thalassemia, microangiopathic hemolytic anemias.\n   - Fluid overload / Hemodilution: Congestive heart failure, excess IV fluid administration, pregnancy.\n\nComments:\nHematocrit should always be interpreted alongside Hemoglobin (Hb), Total RBC Count, Red Cell Indices (MCV, MCH, MCHC, RDW), and the patient's hydration status.",
    "parameters": [
      {
        "name": "Hematocrit Value, Hct",
        "referenceRange": "40 - 50",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HB",
    "title": "Hemoglobin (Hb)",
    "basePrice": 120,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative measurement of Hemoglobin concentration in whole blood for diagnosing and managing anemias, polycythemia, and oxygen transport capacity.",
    "notes": "Hemoglobin is the major protein of erythrocytes that transports oxygen from the lungs to peripheral tissues. It is measured by spectrophotometry on automated instruments after lysis of red cells and conversion of all hemoglobin to cyanmethemoglobin.\n\nIncreased in:\n1. Hemoconcentration (as in dehydration, Burns, vomiting)\n2. Polycythemia (erythrocytosis)\n3. Extreme physical exercise.\n\nDecreased in:\n1. Macrocytic anemia (liver disease, hypothyroidism, vitamin B 12 deficiency, folate deficiency, myelodysplasia)\n2. Normocytic anemia (early iron deficiency, anemia of chronic disease, hemolytic anemia, acute hemorrhage, bone marrow infiltration)\n3. Microcytic anemia (iron deficiency, thalassemia)\n4. Hemodilution (fluid overload, pregnancy)\n\nComments:\nThe cyanmethemoglobin technique is the method of choice selected by the International Committee for Standardization in Hematology. The method measures all hemoglobin derivatives except sulfhemoglobin by hemolyzing the specimen and adding a reducing agent. As such, this method does not distinguish between intracellular versus extracellular hemoglobin (hemolysis). Hypertriglyceridemia and very high white blood cell counts can cause false elevations of Hb.",
    "interpretation": "Hemoglobin is the major protein of erythrocytes that transports oxygen from the lungs to peripheral tissues. It is measured by spectrophotometry on automated instruments after lysis of red cells and conversion of all hemoglobin to cyanmethemoglobin.\n\nIncreased in:\n1. Hemoconcentration (as in dehydration, Burns, vomiting)\n2. Polycythemia (erythrocytosis)\n3. Extreme physical exercise.\n\nDecreased in:\n1. Macrocytic anemia (liver disease, hypothyroidism, vitamin B 12 deficiency, folate deficiency, myelodysplasia)\n2. Normocytic anemia (early iron deficiency, anemia of chronic disease, hemolytic anemia, acute hemorrhage, bone marrow infiltration)\n3. Microcytic anemia (iron deficiency, thalassemia)\n4. Hemodilution (fluid overload, pregnancy)\n\nComments:\nThe cyanmethemoglobin technique is the method of choice selected by the International Committee for Standardization in Hematology. The method measures all hemoglobin derivatives except sulfhemoglobin by hemolyzing the specimen and adding a reducing agent. As such, this method does not distinguish between intracellular versus extracellular hemoglobin (hemolysis). Hypertriglyceridemia and very high white blood cell counts can cause false elevations of Hb.",
    "parameters": [
      {
        "name": "Hemoglobin",
        "referenceRange": "13 - 17",
        "unit": "g/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HAV IgM",
    "title": "Hepatitis A Virus IgM (HAV IgM)",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "Same Day",
    "description": "Immunoassay for the qualitative and semi-quantitative detection of IgM antibodies to Hepatitis A Virus in human serum or plasma for diagnosing acute hepatitis A infection.",
    "notes": "Interpretation:\n• < 2.0 AU/mL : Non-Reactive / Negative (No detectable IgM antibodies to Hepatitis A Virus)\n• 2.0 – 2.5 AU/mL : Borderline / Equivocal (Retest recommended with a fresh sample in 1–2 weeks if clinically indicated)\n• > 2.5 AU/mL : Reactive / Positive (Presence of IgM antibodies to Hepatitis A Virus)\n\nClinical Significance:\n1. Anti-HAV IgM antibodies develop rapidly during the acute phase of Hepatitis A virus infection, usually detectable at or before the onset of clinical symptoms and peak within the first few weeks of illness.\n2. A Positive / Reactive result indicates acute or recent Hepatitis A infection. Anti-HAV IgM levels typically remain detectable for 3 to 6 months following infection.\n3. A Negative / Non-Reactive result indicates absence of acute Hepatitis A infection. It does not exclude previous exposure or immunity, which is determined by Anti-HAV IgG testing.\n4. Transient false-positive results may rarely occur due to cross-reactivity with other viral infections, autoimmune disorders, or recent administration of immunoglobulin / Hepatitis A vaccine.\n\nClinical Correlation:\nResults should always be interpreted in conjunction with clinical symptoms (jaundice, nausea, abdominal discomfort, dark urine) and other liver function tests (Total Bilirubin, SGPT/ALT, SGOT/AST).",
    "interpretation": "Interpretation:\n• < 2.0 AU/mL : Non-Reactive / Negative (No detectable IgM antibodies to Hepatitis A Virus)\n• 2.0 – 2.5 AU/mL : Borderline / Equivocal (Retest recommended with a fresh sample in 1–2 weeks if clinically indicated)\n• > 2.5 AU/mL : Reactive / Positive (Presence of IgM antibodies to Hepatitis A Virus)\n\nClinical Significance:\n1. Anti-HAV IgM antibodies develop rapidly during the acute phase of Hepatitis A virus infection, usually detectable at or before the onset of clinical symptoms and peak within the first few weeks of illness.\n2. A Positive / Reactive result indicates acute or recent Hepatitis A infection. Anti-HAV IgM levels typically remain detectable for 3 to 6 months following infection.\n3. A Negative / Non-Reactive result indicates absence of acute Hepatitis A infection. It does not exclude previous exposure or immunity, which is determined by Anti-HAV IgG testing.\n4. Transient false-positive results may rarely occur due to cross-reactivity with other viral infections, autoimmune disorders, or recent administration of immunoglobulin / Hepatitis A vaccine.\n\nClinical Correlation:\nResults should always be interpreted in conjunction with clinical symptoms (jaundice, nausea, abdominal discomfort, dark urine) and other liver function tests (Total Bilirubin, SGPT/ALT, SGOT/AST).",
    "parameters": [
      {
        "name": "HAV IgM",
        "referenceRange": "< 2 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "H-ALB",
    "title": "H-ALB",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Random Urine)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative determination of Microalbumin (Human Albumin / H-ALB) in urine for early detection of diabetic nephropathy, hypertensive kidney damage, and vascular injury.",
    "notes": "Clinical Significance:\nH-ALB (Human Albumin / High-Sensitivity Urine Albumin / Microalbumin) is an early and sensitive biomarker for the detection of glomerular injury and endothelial dysfunction, particularly in patients with diabetes mellitus and systemic arterial hypertension.\n\nReference Ranges (Spot / Random Urine):\n• Normal (Normoalbuminuria) : < 10 µg/mL (or < 20 mg/L)\n• Microalbuminuria (Early Nephropathy) : 10 – 200 µg/mL (20 – 200 mg/L)\n• Macroalbuminuria (Overt Clinical Nephropathy) : > 200 µg/mL (> 200 mg/L)\n\nClinical Associations:\n1. Diabetic Nephropathy: Persistent microalbuminuria is the earliest clinical herald of diabetic nephropathy in both Type 1 and Type 2 diabetes. Early detection and aggressive glycemic/BP control (with ACEi / ARBs) can retard or reverse progressive renal decline.\n2. Hypertensive Renal Damage: Marker of target organ damage and increased cardiovascular morbidity/mortality risk.\n3. Glomerular & Endothelial Dysfunction: Preeclampsia, systemic lupus erythematosus (SLE) nephritis, glomerulonephritis, and generalized vascular inflammation.\n\nTransient Non-Specific Elevations (False Positives):\nTransient increases in urinary albumin excretion may occur due to vigorous physical exercise, urinary tract infection (UTI), acute febrile illness, hematuria, congestive heart failure, upright posture (orthostatic proteinuria), or severe hyperglycemia.\n\nRecommendation:\nConfirmation of persistent microalbuminuria requires at least 2 of 3 positive specimens collected over a 3 to 6-month period, ideally alongside an Albumin-to-Creatinine Ratio (ACR).",
    "interpretation": "Clinical Significance:\nH-ALB (Human Albumin / High-Sensitivity Urine Albumin / Microalbumin) is an early and sensitive biomarker for the detection of glomerular injury and endothelial dysfunction, particularly in patients with diabetes mellitus and systemic arterial hypertension.\n\nReference Ranges (Spot / Random Urine):\n• Normal (Normoalbuminuria) : < 10 µg/mL (or < 20 mg/L)\n• Microalbuminuria (Early Nephropathy) : 10 – 200 µg/mL (20 – 200 mg/L)\n• Macroalbuminuria (Overt Clinical Nephropathy) : > 200 µg/mL (> 200 mg/L)\n\nClinical Associations:\n1. Diabetic Nephropathy: Persistent microalbuminuria is the earliest clinical herald of diabetic nephropathy in both Type 1 and Type 2 diabetes. Early detection and aggressive glycemic/BP control (with ACEi / ARBs) can retard or reverse progressive renal decline.\n2. Hypertensive Renal Damage: Marker of target organ damage and increased cardiovascular morbidity/mortality risk.\n3. Glomerular & Endothelial Dysfunction: Preeclampsia, systemic lupus erythematosus (SLE) nephritis, glomerulonephritis, and generalized vascular inflammation.\n\nTransient Non-Specific Elevations (False Positives):\nTransient increases in urinary albumin excretion may occur due to vigorous physical exercise, urinary tract infection (UTI), acute febrile illness, hematuria, congestive heart failure, upright posture (orthostatic proteinuria), or severe hyperglycemia.\n\nRecommendation:\nConfirmation of persistent microalbuminuria requires at least 2 of 3 positive specimens collected over a 3 to 6-month period, ideally alongside an Albumin-to-Creatinine Ratio (ACR).",
    "parameters": [
      {
        "name": "H-ALB",
        "referenceRange": "< 10 µg/mL",
        "unit": "µg/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "GTT",
    "title": "Glucose Tolerance Test (GTT)",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Blood Fluoride Plasma",
    "turnaroundTime": "Same Day",
    "description": "Serial plasma glucose measurements following oral glucose load for the diagnosis of impaired fasting glucose, impaired glucose tolerance, diabetes mellitus, and gestational diabetes.",
    "notes": "Interpretation (ADA / WHO Diagnostic Thresholds):\n\nStatus | Fasting Plasma Glucose | Post 75g Glucose Load (2 hr)\n• Normal : 70 - 100 mg/dL | 70 - 140 mg/dL\n• Impaired Fasting Glucose (IFG) : 101 - 125 mg/dL | 70 - 140 mg/dL\n• Impaired Glucose Tolerance (IGT) : 70 - 100 mg/dL | 141 - 199 mg/dL\n• Pre-Diabetes (IFG / IGT) : 101 - 125 mg/dL | 141 - 199 mg/dL\n• Diabetes Mellitus : ≥ 126 mg/dL | ≥ 200 mg/dL\n\nDiagnostic Criteria:\nThe diagnosis of Diabetes requires a fasting plasma glucose of ≥ 126 mg/dL or a random / 2 hr post glucose value of ≥ 200 mg/dL on at least 2 separate occasions.\n\nGestational Diabetes (GDM) 3-Hour Reference Cutoffs:\n• Fasting: < 100 mg/dL\n• 1 Hour: < 190 mg/dL\n• 2 Hour: < 165 mg/dL\n• 3 Hour: < 145 mg/dL",
    "interpretation": "Interpretation (ADA / WHO Diagnostic Thresholds):\n\nStatus | Fasting Plasma Glucose | Post 75g Glucose Load (2 hr)\n• Normal : 70 - 100 mg/dL | 70 - 140 mg/dL\n• Impaired Fasting Glucose (IFG) : 101 - 125 mg/dL | 70 - 140 mg/dL\n• Impaired Glucose Tolerance (IGT) : 70 - 100 mg/dL | 141 - 199 mg/dL\n• Pre-Diabetes (IFG / IGT) : 101 - 125 mg/dL | 141 - 199 mg/dL\n• Diabetes Mellitus : ≥ 126 mg/dL | ≥ 200 mg/dL\n\nDiagnostic Criteria:\nThe diagnosis of Diabetes requires a fasting plasma glucose of ≥ 126 mg/dL or a random / 2 hr post glucose value of ≥ 200 mg/dL on at least 2 separate occasions.\n\nGestational Diabetes (GDM) 3-Hour Reference Cutoffs:\n• Fasting: < 100 mg/dL\n• 1 Hour: < 190 mg/dL\n• 2 Hour: < 165 mg/dL\n• 3 Hour: < 145 mg/dL",
    "parameters": [
      {
        "name": "Fasting",
        "referenceRange": "< 100",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "1 Hour",
        "referenceRange": "< 190",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "2 Hour",
        "referenceRange": "< 165",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "3 Hour",
        "referenceRange": "< 145",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Gram's Stain",
    "title": "Gram's Stain",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Pus / Swab / Sputum / Body Fluid / Urine",
    "turnaroundTime": "Same Day",
    "description": "Direct microscopic examination following Gram staining for preliminary identification of bacterial and fungal pathogens and cellular response.",
    "notes": "Clinical Significance:\nGram stain is a rapid differential staining technique that categorizes bacteria into Gram-positive (violet/purple) and Gram-negative (pink/red) based on the structural and biochemical properties of their cell walls. It provides critical preliminary diagnostic information to guide immediate empirical antimicrobial therapy before definitive culture and antibiotic sensitivity test (AST) results are available.\n\nMicroscopic Findings & Interpretation:\n1. Gram-Positive Cocci:\n   - In clusters: Suggestive of Staphylococcus spp. (e.g., S. aureus, CoNS).\n   - In chains / pairs: Suggestive of Streptococcus spp. (e.g., S. pyogenes, S. pneumoniae, Enterococcus spp.).\n2. Gram-Negative Bacilli (Rods):\n   - Suggestive of Enterobacteriaceae (E. coli, Klebsiella, Proteus) or non-fermenting bacilli (Pseudomonas aeruginosa, Acinetobacter).\n3. Gram-Negative Diplococci:\n   - Intracellular / extracellular: Suggestive of Neisseria meningitidis, Neisseria gonorrhoeae, or Moraxella catarrhalis.\n4. Gram-Positive Bacilli:\n   - Suggestive of Corynebacterium spp., Listeria, Bacillus spp., Clostridium spp., or Lactobacillus.\n5. Fungal Elements:\n   - Budding yeast-like cells with or without pseudohyphae: Suggestive of Candida species.\n\nAdvisory:\nGram stain is a presumptive rapid screening test. Definitive identification and antimicrobial susceptibility require aerobic/anaerobic bacterial culture and AST.",
    "interpretation": "Clinical Significance:\nGram stain is a rapid differential staining technique that categorizes bacteria into Gram-positive (violet/purple) and Gram-negative (pink/red) based on the structural and biochemical properties of their cell walls. It provides critical preliminary diagnostic information to guide immediate empirical antimicrobial therapy before definitive culture and antibiotic sensitivity test (AST) results are available.\n\nMicroscopic Findings & Interpretation:\n1. Gram-Positive Cocci:\n   - In clusters: Suggestive of Staphylococcus spp. (e.g., S. aureus, CoNS).\n   - In chains / pairs: Suggestive of Streptococcus spp. (e.g., S. pyogenes, S. pneumoniae, Enterococcus spp.).\n2. Gram-Negative Bacilli (Rods):\n   - Suggestive of Enterobacteriaceae (E. coli, Klebsiella, Proteus) or non-fermenting bacilli (Pseudomonas aeruginosa, Acinetobacter).\n3. Gram-Negative Diplococci:\n   - Intracellular / extracellular: Suggestive of Neisseria meningitidis, Neisseria gonorrhoeae, or Moraxella catarrhalis.\n4. Gram-Positive Bacilli:\n   - Suggestive of Corynebacterium spp., Listeria, Bacillus spp., Clostridium spp., or Lactobacillus.\n5. Fungal Elements:\n   - Budding yeast-like cells with or without pseudohyphae: Suggestive of Candida species.\n\nAdvisory:\nGram stain is a presumptive rapid screening test. Definitive identification and antimicrobial susceptibility require aerobic/anaerobic bacterial culture and AST.",
    "parameters": [
      {
        "name": "Sample Type",
        "referenceRange": "Pus / Swab / Sputum / Fluid",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Pus / Exudate",
            "isAbnormal": false
          },
          {
            "value": "Sputum",
            "isAbnormal": false
          },
          {
            "value": "Throat / Nasal Swab",
            "isAbnormal": false
          },
          {
            "value": "Wound Swab",
            "isAbnormal": false
          },
          {
            "value": "Urine",
            "isAbnormal": false
          },
          {
            "value": "Body Fluid (Pleural / Ascitic / Synovial / CSF)",
            "isAbnormal": false
          },
          {
            "value": "High Vaginal Swab (HVS)",
            "isAbnormal": false
          },
          {
            "value": "Blood Culture Broth",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "Result",
        "referenceRange": "No organisms or pus cells seen",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "No bacteria or pus cells seen on direct microscopic examination.",
            "isAbnormal": false
          },
          {
            "value": "Few Pus cells (1-3/hpf) seen. No microorganisms detected.",
            "isAbnormal": false
          },
          {
            "value": "Gram-positive cocci seen in clusters (suggestive of Staphylococci species). Pus cells: Moderate (5-10/hpf).",
            "isAbnormal": true
          },
          {
            "value": "Gram-positive cocci seen in pairs/chains (suggestive of Streptococci species). Pus cells: Present.",
            "isAbnormal": true
          },
          {
            "value": "Gram-negative bacilli seen. Pus cells: Moderate to plenty (15-20/hpf).",
            "isAbnormal": true
          },
          {
            "value": "Gram-negative intracellular diplococci seen (suggestive of Neisseria species). Plenty of pus cells.",
            "isAbnormal": true
          },
          {
            "value": "Gram-positive bacilli seen.",
            "isAbnormal": true
          },
          {
            "value": "Budding yeast cells with pseudohyphae seen (suggestive of Candida species).",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "GTT (Pregnancy)",
    "title": "Glucose Tolerance Test, GTT (Pregnancy)",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Blood Fluoride Plasma",
    "turnaroundTime": "Same Day",
    "description": "Oral Glucose Tolerance Test during pregnancy (24-28 weeks) for screening and diagnosis of Gestational Diabetes Mellitus (GDM) using ADA One-Step Strategy.",
    "notes": "According to American Diabetes Association (ADA) Guidelines 2024 for Screening and Diagnosis of Gestational Diabetes Mellitus (GDM), the One-Step Strategy is followed.\n\nMethod - One-step strategy:\nPerform a 75-g OGTT, with plasma glucose measurement when an individual is fasting and at 1 and 2 h, at 24-28 weeks of gestation in individuals not previously diagnosed with diabetes. The OGTT should be performed in the morning after an overnight fast of at least 8 hours.\n\nNormal Values / Reference Cutoffs:\n• Fasting : < 92 mg/dL (5.1 mmol/L) [Reference: 65 - 92 mg/dL]\n• At 1 hour : < 180 mg/dL (10.0 mmol/L) [Reference: 100 - 180 mg/dL]\n• At 2 hour : < 153 mg/dL (8.5 mmol/L) [Reference: 65 - 153 mg/dL]\n• At 3 hour : < 125 mg/dL [Reference: 70 - 125 mg/dL]\n\nThe diagnosis of GDM is made when ANY ONE of the plasma glucose values is met or exceeded.",
    "interpretation": "According to American Diabetes Association (ADA) Guidelines 2024 for Screening and Diagnosis of Gestational Diabetes Mellitus (GDM), the One-Step Strategy is followed.\n\nMethod - One-step strategy:\nPerform a 75-g OGTT, with plasma glucose measurement when an individual is fasting and at 1 and 2 h, at 24-28 weeks of gestation in individuals not previously diagnosed with diabetes. The OGTT should be performed in the morning after an overnight fast of at least 8 hours.\n\nNormal Values / Reference Cutoffs:\n• Fasting : < 92 mg/dL (5.1 mmol/L) [Reference: 65 - 92 mg/dL]\n• At 1 hour : < 180 mg/dL (10.0 mmol/L) [Reference: 100 - 180 mg/dL]\n• At 2 hour : < 153 mg/dL (8.5 mmol/L) [Reference: 65 - 153 mg/dL]\n• At 3 hour : < 125 mg/dL [Reference: 70 - 125 mg/dL]\n\nThe diagnosis of GDM is made when ANY ONE of the plasma glucose values is met or exceeded.",
    "parameters": [
      {
        "name": "Fasting",
        "referenceRange": "65 - 92",
        "unit": "mg/dL",
        "gender": "Female",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "1 hour",
        "referenceRange": "100 - 180",
        "unit": "mg/dL",
        "gender": "Female",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "2 hour",
        "referenceRange": "65 - 153",
        "unit": "mg/dL",
        "gender": "Female",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "3 hour",
        "referenceRange": "70 - 125",
        "unit": "mg/dL",
        "gender": "Female",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Globulin",
    "title": "Globulin",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative determination of Serum Globulin fraction for evaluating liver disease, chronic infections, autoimmune disorders, and plasma cell dyscrasias.",
    "notes": "Clinical Significance:\nGlobulins are a diverse group of proteins in blood serum comprising alpha-1, alpha-2, beta, and gamma globulins. They play critical roles in immune defense (immunoglobulins/antibodies), blood clotting, enzymatic actions, and the transport of hormones, lipids, and minerals (e.g., transferrin, haptoglobin, ceruloplasmin). Calculated as: Globulin = Total Protein – Albumin.\n\nReference Range:\n• Normal Serum Globulin : 1.8 – 3.6 g/dL\n\nClinical Associations:\n1. Hyperglobulinemia (Elevated Globulin Levels):\n   - Chronic Infections: Tuberculosis, subacute bacterial endocarditis, chronic hepatitis (HBV/HCV), HIV, parasitic infections (leishmaniasis/Kala-Azar, malaria).\n   - Autoimmune & Inflammatory Diseases: Systemic lupus erythematosus (SLE), rheumatoid arthritis, sarcoidosis, autoimmune hepatitis.\n   - Hematological Malignancies / Monoclonal Gammopathies: Multiple myeloma, Waldenström's macroglobulinemia, monoclonal gammopathy of undetermined significance (MGUS), lymphomas.\n   - Chronic Liver Disease: Cirrhosis (elevated polyclonal gamma-globulin fraction with A/G ratio reversal).\n2. Hypoglobulinemia (Decreased Globulin Levels):\n   - Immunodeficiency states: Congenital or acquired agammaglobulinemia/hypogammaglobulinemia.\n   - Severe protein loss: Protein-losing enteropathies, extensive burns.\n   - Malnutrition and malabsorption disorders.\n\nRecommendation:\nAbnormal globulin levels, especially when associated with an inverted A/G ratio (< 1.0) or unexplained elevated total protein, warrant Serum Protein Electrophoresis (SPEP) and immunofixation electrophoresis (IFE) for definitive characterization.",
    "interpretation": "Clinical Significance:\nGlobulins are a diverse group of proteins in blood serum comprising alpha-1, alpha-2, beta, and gamma globulins. They play critical roles in immune defense (immunoglobulins/antibodies), blood clotting, enzymatic actions, and the transport of hormones, lipids, and minerals (e.g., transferrin, haptoglobin, ceruloplasmin). Calculated as: Globulin = Total Protein – Albumin.\n\nReference Range:\n• Normal Serum Globulin : 1.8 – 3.6 g/dL\n\nClinical Associations:\n1. Hyperglobulinemia (Elevated Globulin Levels):\n   - Chronic Infections: Tuberculosis, subacute bacterial endocarditis, chronic hepatitis (HBV/HCV), HIV, parasitic infections (leishmaniasis/Kala-Azar, malaria).\n   - Autoimmune & Inflammatory Diseases: Systemic lupus erythematosus (SLE), rheumatoid arthritis, sarcoidosis, autoimmune hepatitis.\n   - Hematological Malignancies / Monoclonal Gammopathies: Multiple myeloma, Waldenström's macroglobulinemia, monoclonal gammopathy of undetermined significance (MGUS), lymphomas.\n   - Chronic Liver Disease: Cirrhosis (elevated polyclonal gamma-globulin fraction with A/G ratio reversal).\n2. Hypoglobulinemia (Decreased Globulin Levels):\n   - Immunodeficiency states: Congenital or acquired agammaglobulinemia/hypogammaglobulinemia.\n   - Severe protein loss: Protein-losing enteropathies, extensive burns.\n   - Malnutrition and malabsorption disorders.\n\nRecommendation:\nAbnormal globulin levels, especially when associated with an inverted A/G ratio (< 1.0) or unexplained elevated total protein, warrant Serum Protein Electrophoresis (SPEP) and immunofixation electrophoresis (IFE) for definitive characterization.",
    "parameters": [
      {
        "name": "Globulin",
        "referenceRange": "1.8 - 3.6",
        "unit": "g/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "GGT",
    "title": "Gamma Glutamyl Transferase, GGT",
    "basePrice": 300,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Enzymatic measurement of Gamma-Glutamyl Transferase (GGT) in serum for assessing hepatobiliary disorders, biliary obstruction, and alcohol-induced liver injury.",
    "notes": "Interpretation:\nSynthesis of GGT is stimulated by many drugs e.g., phenytoin, phenobarbitone, primidone, alcohol and possibly some antidepressants. GGT is a sensitive test for excess alcohol intake but is not specific.\n\nAbnormal test results:\n1. Raised GGT and raised mean corpuscular volume (MCV) suggest alcohol abuse.\n2. Raised GGT, history of excessive alcohol intake, raised ALT and raised MCV suggest liver cell damage.\n3. Very high GGT (10 times normal upper limit) occurs in biliary obstruction and hepatic malignancies.\n4. Raised GGT and raised ALP (more than three times upper limit of normal) suggest cholestasis.\n5. Raised GGT may be due to non-specific causes e.g., MI, cerebrovascular accident, diabetes mellitus, pancreatic disease, renal failure and chronic lung disease.\n6. LFTs (transaminase and GGT) are also affected by lack of exercise, obesity and smoking, as well as excess alcohol intake. Elevated results may, therefore, occur if several of these factors coexist, even if alcohol intake is not excessive.\n7. The effect of alcohol on GGT is complex. About 50% of people who drink alcohol to excess on a regular basis will have biochemical abnormalities, while the other 50% will not.",
    "interpretation": "Interpretation:\nSynthesis of GGT is stimulated by many drugs e.g., phenytoin, phenobarbitone, primidone, alcohol and possibly some antidepressants. GGT is a sensitive test for excess alcohol intake but is not specific.\n\nAbnormal test results:\n1. Raised GGT and raised mean corpuscular volume (MCV) suggest alcohol abuse.\n2. Raised GGT, history of excessive alcohol intake, raised ALT and raised MCV suggest liver cell damage.\n3. Very high GGT (10 times normal upper limit) occurs in biliary obstruction and hepatic malignancies.\n4. Raised GGT and raised ALP (more than three times upper limit of normal) suggest cholestasis.\n5. Raised GGT may be due to non-specific causes e.g., MI, cerebrovascular accident, diabetes mellitus, pancreatic disease, renal failure and chronic lung disease.\n6. LFTs (transaminase and GGT) are also affected by lack of exercise, obesity and smoking, as well as excess alcohol intake. Elevated results may, therefore, occur if several of these factors coexist, even if alcohol intake is not excessive.\n7. The effect of alcohol on GGT is complex. About 50% of people who drink alcohol to excess on a regular basis will have biochemical abnormalities, while the other 50% will not.",
    "parameters": [
      {
        "name": "Gamma Glutamyl Transferase, GGT",
        "referenceRange": "9 - 52",
        "unit": "IU/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "GCT",
    "title": "Glucose Challenge Test (GCT); Pregnancy , 75g Glucose",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Blood Fluoride Plasma",
    "turnaroundTime": "Same Day",
    "description": "Gestational Diabetes Mellitus (GDM) screening test measuring plasma glucose after a 75g oral glucose challenge during pregnancy (24-28 weeks).",
    "notes": "Clinical Significance:\nThe Glucose Challenge Test (GCT) is a standard screening test for Gestational Diabetes Mellitus (GDM), typically performed between 24 and 28 weeks of gestation in pregnant women. Plasma glucose is measured after oral administration of a 75g glucose load.\n\nReference Range:\n• Normal Screening Value : 70 – 140 mg/dL (< 140 mg/dL)\n\nClinical Interpretation:\n• Plasma Glucose < 140 mg/dL : Negative screen (GDM unlikely).\n• Plasma Glucose 140 – 199 mg/dL : Positive screen (Impaired gestational glucose tolerance; warrants follow-up diagnostic oral glucose tolerance testing - OGTT / DIPSI criteria).\n• Plasma Glucose ≥ 200 mg/dL : Highly suggestive of Gestational Diabetes Mellitus.\n\nComments:\nAccording to DIPSI (Diabetes in Pregnancy Study Group India) guidelines, a 2-hour plasma glucose ≥ 140 mg/dL after a 75g oral glucose load in the non-fasting state is diagnostic of GDM.",
    "interpretation": "Clinical Significance:\nThe Glucose Challenge Test (GCT) is a standard screening test for Gestational Diabetes Mellitus (GDM), typically performed between 24 and 28 weeks of gestation in pregnant women. Plasma glucose is measured after oral administration of a 75g glucose load.\n\nReference Range:\n• Normal Screening Value : 70 – 140 mg/dL (< 140 mg/dL)\n\nClinical Interpretation:\n• Plasma Glucose < 140 mg/dL : Negative screen (GDM unlikely).\n• Plasma Glucose 140 – 199 mg/dL : Positive screen (Impaired gestational glucose tolerance; warrants follow-up diagnostic oral glucose tolerance testing - OGTT / DIPSI criteria).\n• Plasma Glucose ≥ 200 mg/dL : Highly suggestive of Gestational Diabetes Mellitus.\n\nComments:\nAccording to DIPSI (Diabetes in Pregnancy Study Group India) guidelines, a 2-hour plasma glucose ≥ 140 mg/dL after a 75g oral glucose load in the non-fasting state is diagnostic of GDM.",
    "parameters": [
      {
        "name": "Glucose Challenge Test (GCT); Pregnancy , 75g Glucose",
        "referenceRange": "70 - 140",
        "unit": "mg/dL",
        "gender": "Female",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "G6PD",
    "title": "Glucose-6-Phosphate Dehydrogenase (G6PD)",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "EDTA Whole Blood",
    "turnaroundTime": "Same Day",
    "description": "Quantitative measurement of Glucose-6-Phosphate Dehydrogenase enzyme activity in erythrocytes for diagnosing G6PD deficiency, hemolytic anemia, and pre-medication risk assessment.",
    "notes": "Clinical Significance:\nGlucose-6-Phosphate Dehydrogenase (G6PD) is a critical housekeeping enzyme in the hexose monophosphate (HMP) shunt pathway. In erythrocytes (RBCs), G6PD is the sole source of NADPH, which maintains reduced glutathione (GSH) to protect red blood cells and hemoglobin against oxidative stressors and free radicals.\n\nReference Ranges (Quantitative Spectrophotometry at 37°C):\n• Normal / Adequate Activity : 6.4 – 12.9 U/g Hb\n• Intermediate Deficiency : 2.1 – 6.3 U/g Hb (30% – 70% of normal mean)\n• Severe / Deficient Activity : < 2.1 U/g Hb (< 30% of normal mean)\n\nClinical Interpretation & WHO Classification:\n1. G6PD Deficiency is an X-linked recessive enzymopathy primarily affecting males (hemizygotes) and homozygous females; heterozygous females exhibit variable mosaic expression due to lyonization (X-inactivation).\n2. Acute Hemolytic Anemia (AHA) Triggers:\n   - Oxidant Drugs: Antimalarials (primaquine, tafenoquine), sulfonamides/cotrimoxazole, nitrofurantoin, dapsone, rasburicase, methylene blue.\n   - Dietary: Ingestion of fava beans (Vicia faba) causing Favism.\n   - Acute Infections: Viral hepatitis, pneumonia, typhoid, severe sepsis, or diabetic ketoacidosis.\n   - Neonatal Jaundice: Severe unconjugated hyperbilirubinemia with risk of acute kernicterus.\n\nDiagnostic Cautions:\n• Testing during or immediately following an acute hemolytic episode or blood transfusion may yield falsely normal/elevated enzyme levels because older G6PD-deficient erythrocytes have lysed, leaving younger reticulocytes and transfused donor RBCs with high enzyme levels.\n• Re-testing 2–3 months after resolution of hemolysis is strongly recommended to establish true baseline enzymatic activity.",
    "interpretation": "Clinical Significance:\nGlucose-6-Phosphate Dehydrogenase (G6PD) is a critical housekeeping enzyme in the hexose monophosphate (HMP) shunt pathway. In erythrocytes (RBCs), G6PD is the sole source of NADPH, which maintains reduced glutathione (GSH) to protect red blood cells and hemoglobin against oxidative stressors and free radicals.\n\nReference Ranges (Quantitative Spectrophotometry at 37°C):\n• Normal / Adequate Activity : 6.4 – 12.9 U/g Hb\n• Intermediate Deficiency : 2.1 – 6.3 U/g Hb (30% – 70% of normal mean)\n• Severe / Deficient Activity : < 2.1 U/g Hb (< 30% of normal mean)\n\nClinical Interpretation & WHO Classification:\n1. G6PD Deficiency is an X-linked recessive enzymopathy primarily affecting males (hemizygotes) and homozygous females; heterozygous females exhibit variable mosaic expression due to lyonization (X-inactivation).\n2. Acute Hemolytic Anemia (AHA) Triggers:\n   - Oxidant Drugs: Antimalarials (primaquine, tafenoquine), sulfonamides/cotrimoxazole, nitrofurantoin, dapsone, rasburicase, methylene blue.\n   - Dietary: Ingestion of fava beans (Vicia faba) causing Favism.\n   - Acute Infections: Viral hepatitis, pneumonia, typhoid, severe sepsis, or diabetic ketoacidosis.\n   - Neonatal Jaundice: Severe unconjugated hyperbilirubinemia with risk of acute kernicterus.\n\nDiagnostic Cautions:\n• Testing during or immediately following an acute hemolytic episode or blood transfusion may yield falsely normal/elevated enzyme levels because older G6PD-deficient erythrocytes have lysed, leaving younger reticulocytes and transfused donor RBCs with high enzyme levels.\n• Re-testing 2–3 months after resolution of hemolysis is strongly recommended to establish true baseline enzymatic activity.",
    "parameters": [
      {
        "name": "Glucose-6-Phosphate Dehydrogenase (G6PD)",
        "referenceRange": "6.4 - 12.9",
        "unit": "U/g Hb",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Fungal Scraping Smear",
    "title": "Fungal Scraping Smear (KOH Mount)",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Skin Scrapings / Nail Clippings / Hair / Corneal Scrapings",
    "turnaroundTime": "Same Day",
    "description": "Direct microscopic examination following 10%-20% KOH mount preparation for detecting dermatophytes, Candida, Malassezia, and opportunistic fungal elements.",
    "notes": "Clinical Significance:\nDirect microscopic examination of clinical specimens treated with 10%–20% Potassium Hydroxide (KOH) is a rapid and highly effective primary screening method for superficial, cutaneous, and subcutaneous fungal infections (mycoses). KOH dissolves keratin and cellular debris, making fungal cell walls (hyphae, pseudohyphae, spores) clearly visible.\n\nMicroscopic Morphological Interpretation:\n1. Dermatophytosis (Tinea / Ringworm):\n   - Refractile, branching, uniform septate hyphae with arthroconidia (spores).\n2. Candidiasis:\n   - Budding yeast-like blastoconidia with elongated pseudohyphae and true hyphae.\n3. Pityriasis / Tinea Versicolor (Malassezia furfur):\n   - \"Spaghetti and meatballs\" appearance consisting of short, curved hyphae mixed with round, thick-walled yeast clusters.\n4. Onychomycosis:\n   - Subungual hyperkeratotic nail debris showing fungal hyphal elements.\n5. Deep / Invasive Molds (e.g., Aspergillus / Mucorales):\n   - Acute-angle branching septate hyphae (Aspergillus) or broad, non-septate ribbon-like hyphae with wide branching angles (Mucorales).\n\nAdvisory:\nKOH mount provides rapid presumptive screening. Sabouraud Dextrose Agar (SDA) fungal culture is recommended for definitive species identification and antifungal sensitivity.",
    "interpretation": "Clinical Significance:\nDirect microscopic examination of clinical specimens treated with 10%–20% Potassium Hydroxide (KOH) is a rapid and highly effective primary screening method for superficial, cutaneous, and subcutaneous fungal infections (mycoses). KOH dissolves keratin and cellular debris, making fungal cell walls (hyphae, pseudohyphae, spores) clearly visible.\n\nMicroscopic Morphological Interpretation:\n1. Dermatophytosis (Tinea / Ringworm):\n   - Refractile, branching, uniform septate hyphae with arthroconidia (spores).\n2. Candidiasis:\n   - Budding yeast-like blastoconidia with elongated pseudohyphae and true hyphae.\n3. Pityriasis / Tinea Versicolor (Malassezia furfur):\n   - \"Spaghetti and meatballs\" appearance consisting of short, curved hyphae mixed with round, thick-walled yeast clusters.\n4. Onychomycosis:\n   - Subungual hyperkeratotic nail debris showing fungal hyphal elements.\n5. Deep / Invasive Molds (e.g., Aspergillus / Mucorales):\n   - Acute-angle branching septate hyphae (Aspergillus) or broad, non-septate ribbon-like hyphae with wide branching angles (Mucorales).\n\nAdvisory:\nKOH mount provides rapid presumptive screening. Sabouraud Dextrose Agar (SDA) fungal culture is recommended for definitive species identification and antifungal sensitivity.",
    "parameters": [
      {
        "name": "Sample Site / Specimen",
        "referenceRange": "Skin / Nail / Hair / Corneal",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Skin Scrapings",
            "isAbnormal": false
          },
          {
            "value": "Nail Clippings / Subungual Scrapings",
            "isAbnormal": false
          },
          {
            "value": "Hair Plucks / Scalp Scrapings",
            "isAbnormal": false
          },
          {
            "value": "Corneal Scrapings",
            "isAbnormal": false
          },
          {
            "value": "Mucosal Swab / Scraping",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "Microscopic Examination (KOH Mount 10-20%)",
        "referenceRange": "No fungal elements seen",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "No fungal elements (hyphae, pseudohyphae, or spores) detected on direct 10% - 20% KOH mount examination.",
            "isAbnormal": false
          },
          {
            "value": "Branching, septate fungal hyphae and arthrospores seen (suggestive of Dermatophyte infection / Tinea / Ringworm).",
            "isAbnormal": true
          },
          {
            "value": "Budding yeast cells with pseudohyphae seen (suggestive of Candida species / Candidiasis).",
            "isAbnormal": true
          },
          {
            "value": "Clusters of spherical yeast cells with short, curved hyphae (\"spaghetti and meatballs\" appearance - suggestive of Malassezia furfur / Tinea Versicolor / Pityriasis Versicolor).",
            "isAbnormal": true
          },
          {
            "value": "Broad, aseptate/pauci-septate ribbon-like right-angle branching fungal hyphae seen (suggestive of Zygomycetes / Mucorales).",
            "isAbnormal": true
          },
          {
            "value": "Septate, acute-angle (40-45°) branching, uniform fungal hyphae seen (suggestive of Aspergillus species).",
            "isAbnormal": true
          },
          {
            "value": "Brown-pigmented (dematiaceous) fungal elements seen.",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "FSH",
    "title": "Follicle Stimulating Hormone, FSH",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Chemiluminescence Immunoassay (CLIA) for quantitative determination of Follicle Stimulating Hormone (FSH) in serum to assess fertility, hypogonadism, and pituitary-gonadal axis.",
    "notes": "Biological Reference Intervals:\n• Males (Adult): 1.5 - 12.4 mIU/mL\n\n• Females:\n  - Follicular Phase: 3.5 - 12.5 mIU/mL\n  - Mid-Cycle Peak (Ovulatory): 4.7 - 21.5 mIU/mL\n  - Luteal Phase: 1.7 - 7.7 mIU/mL\n  - Postmenopausal: 25.8 - 134.8 mIU/mL\n  - Oral Contraceptives: < 4.9 mIU/mL\n\n• Pre-pubertal Children:\n  - Males: 0.3 - 3.2 mIU/mL\n  - Females: 0.3 - 6.7 mIU/mL\n\nClinical Significance:\nFSH is secreted by the anterior pituitary gland. In females, it stimulates ovarian follicular growth and estrogen secretion. In males, it stimulates Sertoli cells to support spermatogenesis.\n\nElevated Levels:\n• Primary gonadal failure, menopause, premature ovarian failure (POF), Turner syndrome, Klinefelter syndrome, testicular failure.\n\nDecreased Levels:\n• Pituitary or hypothalamic dysfunction, hypogonadotropic hypogonadism, Kallmann syndrome, severe stress/anorexia, hyperprolactinemia.",
    "interpretation": "Biological Reference Intervals:\n• Males (Adult): 1.5 - 12.4 mIU/mL\n\n• Females:\n  - Follicular Phase: 3.5 - 12.5 mIU/mL\n  - Mid-Cycle Peak (Ovulatory): 4.7 - 21.5 mIU/mL\n  - Luteal Phase: 1.7 - 7.7 mIU/mL\n  - Postmenopausal: 25.8 - 134.8 mIU/mL\n  - Oral Contraceptives: < 4.9 mIU/mL\n\n• Pre-pubertal Children:\n  - Males: 0.3 - 3.2 mIU/mL\n  - Females: 0.3 - 6.7 mIU/mL\n\nClinical Significance:\nFSH is secreted by the anterior pituitary gland. In females, it stimulates ovarian follicular growth and estrogen secretion. In males, it stimulates Sertoli cells to support spermatogenesis.\n\nElevated Levels:\n• Primary gonadal failure, menopause, premature ovarian failure (POF), Turner syndrome, Klinefelter syndrome, testicular failure.\n\nDecreased Levels:\n• Pituitary or hypothalamic dysfunction, hypogonadotropic hypogonadism, Kallmann syndrome, severe stress/anorexia, hyperprolactinemia.",
    "parameters": [
      {
        "name": "Follicle Stimulating Hormone, FSH",
        "referenceRange": "Males: 1.5 - 12.4 | Females: Follicular 3.5 - 12.5, Ovulatory 4.7 - 21.5, Luteal 1.7 - 7.7, Postmenopausal 25.8 - 134.8",
        "unit": "mIU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "FT3",
    "title": "Free Triiodothyronine I, FT3",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative measurement of unbound, biologically active Free Triiodothyronine (FT3) in serum to diagnose hyperthyroidism, T3-thyrotoxicosis, and thyroid dysfunction.",
    "notes": "Clinical Significance:\nTriiodothyronine (T3) is the metabolically active thyroid hormone. While over 99.7% of circulating T3 is bound to serum carrier proteins (primarily TBG and albumin), only the unbound Free T3 (FT3) is biologically active.\n\nReference Range:\n• Normal Serum Free T3 (FT3) : 2 - 4.2 pg/mL\n\nClinical Associations:\n1. Elevated FT3:\n   - Graves' disease, toxic multinodular goiter, toxic adenoma.\n   - T3-Thyrotoxicosis (isolated elevated FT3 with suppressed TSH).\n   - Early phase of subacute / postpartum thyroiditis.\n2. Decreased FT3:\n   - Primary / secondary hypothyroidism.\n   - Euthyroid Sick Syndrome (Low T3 syndrome) seen in severe non-thyroidal systemic illness, sepsis, starvation, and ICU patients.",
    "interpretation": "Clinical Significance:\nTriiodothyronine (T3) is the metabolically active thyroid hormone. While over 99.7% of circulating T3 is bound to serum carrier proteins (primarily TBG and albumin), only the unbound Free T3 (FT3) is biologically active.\n\nReference Range:\n• Normal Serum Free T3 (FT3) : 2 - 4.2 pg/mL\n\nClinical Associations:\n1. Elevated FT3:\n   - Graves' disease, toxic multinodular goiter, toxic adenoma.\n   - T3-Thyrotoxicosis (isolated elevated FT3 with suppressed TSH).\n   - Early phase of subacute / postpartum thyroiditis.\n2. Decreased FT3:\n   - Primary / secondary hypothyroidism.\n   - Euthyroid Sick Syndrome (Low T3 syndrome) seen in severe non-thyroidal systemic illness, sepsis, starvation, and ICU patients.",
    "parameters": [
      {
        "name": "Free Triiodothyronine I, FT3",
        "referenceRange": "2 - 4.2",
        "unit": "pg/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "FT4",
    "title": "Free Thyroxine, FT4",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative measurement of unbound, biologically active Free Thyroxine (FT4) in serum for assessing thyroid function, hypothyroidism, and hyperthyroidism.",
    "notes": "Clinical Significance:\nThyroxine (T4) is the principal hormone secreted by the thyroid follicular cells. Over 99.9% of circulating T4 is bound to carrier proteins (primarily TBG, transthyretin, and albumin). Free T4 (FT4) represents the unbound, biologically active fraction that diffuses into target cells and exerts metabolic effects, independent of alterations in binding protein concentrations.\n\nReference Range:\n• Normal Serum Free T4 (FT4) : 8.9 - 17.2 pg/mL\n\nClinical Associations:\n1. Elevated FT4:\n   - Graves' disease, toxic multinodular goiter, toxic solitary adenoma.\n   - Subacute / postpartum thyroiditis (early thyrotoxic phase).\n   - Exogenous levothyroxine over-replacement.\n2. Decreased FT4:\n   - Primary Hypothyroidism: Hashimoto's thyroiditis, post-surgical/radioiodine ablation.\n   - Central (Secondary / Tertiary) Hypothyroidism: Pituitary or hypothalamic insufficiency.",
    "interpretation": "Clinical Significance:\nThyroxine (T4) is the principal hormone secreted by the thyroid follicular cells. Over 99.9% of circulating T4 is bound to carrier proteins (primarily TBG, transthyretin, and albumin). Free T4 (FT4) represents the unbound, biologically active fraction that diffuses into target cells and exerts metabolic effects, independent of alterations in binding protein concentrations.\n\nReference Range:\n• Normal Serum Free T4 (FT4) : 8.9 - 17.2 pg/mL\n\nClinical Associations:\n1. Elevated FT4:\n   - Graves' disease, toxic multinodular goiter, toxic solitary adenoma.\n   - Subacute / postpartum thyroiditis (early thyrotoxic phase).\n   - Exogenous levothyroxine over-replacement.\n2. Decreased FT4:\n   - Primary Hypothyroidism: Hashimoto's thyroiditis, post-surgical/radioiodine ablation.\n   - Central (Secondary / Tertiary) Hypothyroidism: Pituitary or hypothalamic insufficiency.",
    "parameters": [
      {
        "name": "Free Thyroxine, FT4",
        "referenceRange": "8.9 - 17.2",
        "unit": "pg/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Folic Acid",
    "title": "Folic Acid",
    "basePrice": 800,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative determination of Serum Folate / Folic Acid level by Chemiluminescence Immunoassay (CLIA) to diagnose megaloblastic anemia, malnutrition, and malabsorption.",
    "notes": "Note:\n1. Drugs like Methotrexate and Leucovorin can affect folate test results.\n2. To tell apart vitamin B12 deficiency from folate deficiency, check levels of Methylmalonic acid (MMA) in urine and Homocysteine in blood.\n3. Folic acid has a low risk of toxicity because it's a water-soluble vitamin that's usually excreted in urine.\n\nComments:\nFolate is crucial for making DNA components and for red blood cell maturation. It comes mainly from plants and some organ meats, but cooking can destroy over half of it. Folate deficiency is common in people with alcoholic liver disease, pregnant women, and the elderly. It can result from poor absorption, inadequate diet, high demand (like in pregnancy or cancer), or certain drugs such as Methotrexate and anticonvulsants.\n\nInterpretation:\nReference Range: 3.1 - 17.5 ng/mL (Normal: > 5.38 ng/mL)\nDecreased Levels: Megaloblastic anemia, Infantile hyperthyroidism, Alcoholism, Malnutrition, Scurvy, Liver disease, B12 deficiency, dietary amino acid excess, adult Celiac disease, Tropical Sprue, Crohn's disease, Hemolytic anemias, Carcinomas, Myelofibrosis, vitamin B6 deficiency, pregnancy, Whipple's disease, extensive intestinal resection and severe exfoliative dermatitis.",
    "interpretation": "Note:\n1. Drugs like Methotrexate and Leucovorin can affect folate test results.\n2. To tell apart vitamin B12 deficiency from folate deficiency, check levels of Methylmalonic acid (MMA) in urine and Homocysteine in blood.\n3. Folic acid has a low risk of toxicity because it's a water-soluble vitamin that's usually excreted in urine.\n\nComments:\nFolate is crucial for making DNA components and for red blood cell maturation. It comes mainly from plants and some organ meats, but cooking can destroy over half of it. Folate deficiency is common in people with alcoholic liver disease, pregnant women, and the elderly. It can result from poor absorption, inadequate diet, high demand (like in pregnancy or cancer), or certain drugs such as Methotrexate and anticonvulsants.\n\nInterpretation:\nReference Range: 3.1 - 17.5 ng/mL (Normal: > 5.38 ng/mL)\nDecreased Levels: Megaloblastic anemia, Infantile hyperthyroidism, Alcoholism, Malnutrition, Scurvy, Liver disease, B12 deficiency, dietary amino acid excess, adult Celiac disease, Tropical Sprue, Crohn's disease, Hemolytic anemias, Carcinomas, Myelofibrosis, vitamin B6 deficiency, pregnancy, Whipple's disease, extensive intestinal resection and severe exfoliative dermatitis.",
    "parameters": [
      {
        "name": "Folic Acid",
        "referenceRange": "3.1 - 17.5",
        "unit": "ng/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Free PSA",
    "title": "Free Prostate Specific Antigen (Free PSA)",
    "basePrice": 850,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Chemiluminescence Immunoassay (CLIA) for measurement of Free PSA and % Free/Total PSA ratio to differentiate Benign Prostatic Hyperplasia (BPH) from Prostate Cancer in men with total PSA 4-10 ng/mL.",
    "notes": "Clinical Significance:\nProstate-Specific Antigen (PSA) is produced by the secretory epithelium of the prostate. In men with Total PSA levels in the diagnostic \"gray zone\" of 4.0 to 10.0 ng/mL, the percentage of Free PSA (% fPSA = [Free PSA / Total PSA] × 100) enhances diagnostic specificity to distinguish Benign Prostatic Hyperplasia (BPH) from Prostate Cancer (PCa).\n\nProbability of Prostate Cancer Based on % Free PSA (Total PSA 4.0 - 10.0 ng/mL):\n• % Free PSA > 25% : Low Risk (~8% - 10% probability of cancer) -> BPH likely\n• % Free PSA 19% - 25% : Intermediate-Low Risk (~18% probability of cancer)\n• % Free PSA 15% - 18% : Moderate Risk (~24% probability of cancer)\n• % Free PSA 10% - 14% : Intermediate-High Risk (~33% - 40% probability of cancer)\n• % Free PSA < 10% : High Risk (~56% probability of cancer) -> Prostate Biopsy Recommended\n\nClinical Guidance & Pre-test Precautions:\n1. Men with % Free PSA < 10% have significantly higher risk of aggressive prostate adenocarcinoma.\n2. Blood collection should occur before digital rectal exam (DRE), prostate massage, cystoscopy, or 48 hours afterward.\n3. 5-alpha reductase inhibitors (Finasteride, Dutasteride) reduce serum PSA by ~50% within 6 months.",
    "interpretation": "Clinical Significance:\nProstate-Specific Antigen (PSA) is produced by the secretory epithelium of the prostate. In men with Total PSA levels in the diagnostic \"gray zone\" of 4.0 to 10.0 ng/mL, the percentage of Free PSA (% fPSA = [Free PSA / Total PSA] × 100) enhances diagnostic specificity to distinguish Benign Prostatic Hyperplasia (BPH) from Prostate Cancer (PCa).\n\nProbability of Prostate Cancer Based on % Free PSA (Total PSA 4.0 - 10.0 ng/mL):\n• % Free PSA > 25% : Low Risk (~8% - 10% probability of cancer) -> BPH likely\n• % Free PSA 19% - 25% : Intermediate-Low Risk (~18% probability of cancer)\n• % Free PSA 15% - 18% : Moderate Risk (~24% probability of cancer)\n• % Free PSA 10% - 14% : Intermediate-High Risk (~33% - 40% probability of cancer)\n• % Free PSA < 10% : High Risk (~56% probability of cancer) -> Prostate Biopsy Recommended\n\nClinical Guidance & Pre-test Precautions:\n1. Men with % Free PSA < 10% have significantly higher risk of aggressive prostate adenocarcinoma.\n2. Blood collection should occur before digital rectal exam (DRE), prostate massage, cystoscopy, or 48 hours afterward.\n3. 5-alpha reductase inhibitors (Finasteride, Dutasteride) reduce serum PSA by ~50% within 6 months.",
    "parameters": [
      {
        "name": "Free Prostate Specific Antigen (Free PSA)",
        "referenceRange": "0.05 - 0.50",
        "unit": "ng/mL",
        "gender": "Male",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total PSA",
        "referenceRange": "0.0 - 4.0",
        "unit": "ng/mL",
        "gender": "Male",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "% Free PSA Ratio (% fPSA / tPSA)",
        "referenceRange": "> 25 % (Low Risk)",
        "unit": "%",
        "gender": "Male",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "DHEA",
    "title": "Dehydroepiandrosterone, DHEA",
    "basePrice": 800,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Chemiluminescence Immunoassay (CLIA) for quantitative determination of Dehydroepiandrosterone (DHEA) in serum to evaluate adrenal cortex function, androgen excess, and PCOS.",
    "notes": "Physiologic Basis:\nDHEA is a 19-carbon endogenous steroid hormone secreted by the adrenal glands. It is converted to DHEA-S in the adrenals, liver, and small intestine. DHEA-S is albumin-bound in the circulation, and there is no diurnal variation in DHEA-S levels. Levels of DHEA-S are about 300 × higher than DHEA and more stable. It serves as the precursor of androgens and estrogens.\n\nInterpretation:\nReference Range (µg/dl):\n• Males: 1.8 - 12.5 µg/dl\n• Females: 1.3 - 9.8 µg/dl\n\nIncreased in:\n• Adrenal hyperplasia, adrenal cancer, congenital adrenal hyperplasia (CAH), polycystic ovarian syndrome (PCOS).\n\nDecreased in:\n• Adrenal insufficiency (Addison's disease), hypopituitarism, rheumatoid arthritis (females), insulin, and corticosteroids.\n\nComments:\nDHEA measurement is typically used along with other steroid and peptide hormones to evaluate adrenal function, to help diagnose adrenal cortex tumors, and polycystic ovarian syndrome (in females). Orally ingested DHEA is converted to DHEA-S when passing through intestines and liver. People taking DHEA supplements have elevated blood levels of DHEA-S. Use by athletes is prohibited by the World Anti-doping Agency.",
    "interpretation": "Physiologic Basis:\nDHEA is a 19-carbon endogenous steroid hormone secreted by the adrenal glands. It is converted to DHEA-S in the adrenals, liver, and small intestine. DHEA-S is albumin-bound in the circulation, and there is no diurnal variation in DHEA-S levels. Levels of DHEA-S are about 300 × higher than DHEA and more stable. It serves as the precursor of androgens and estrogens.\n\nInterpretation:\nReference Range (µg/dl):\n• Males: 1.8 - 12.5 µg/dl\n• Females: 1.3 - 9.8 µg/dl\n\nIncreased in:\n• Adrenal hyperplasia, adrenal cancer, congenital adrenal hyperplasia (CAH), polycystic ovarian syndrome (PCOS).\n\nDecreased in:\n• Adrenal insufficiency (Addison's disease), hypopituitarism, rheumatoid arthritis (females), insulin, and corticosteroids.\n\nComments:\nDHEA measurement is typically used along with other steroid and peptide hormones to evaluate adrenal function, to help diagnose adrenal cortex tumors, and polycystic ovarian syndrome (in females). Orally ingested DHEA is converted to DHEA-S when passing through intestines and liver. People taking DHEA supplements have elevated blood levels of DHEA-S. Use by athletes is prohibited by the World Anti-doping Agency.",
    "parameters": [
      {
        "name": "DHEA",
        "referenceRange": "Males: 1.8 - 12.5 | Females: 1.3 - 9.8",
        "unit": "µg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Diabetic Package",
    "title": "Diabetic Package / Comprehensive Diabetic Profile",
    "basePrice": 1200,
    "taxPercentage": 0,
    "sampleType": "Blood (Fluoride, EDTA, Serum)",
    "turnaroundTime": "Same Day",
    "description": "Comprehensive diabetes screening and metabolic monitoring panel including Fasting & Postprandial Glucose, HbA1c, Complete Lipid Profile, and Renal Function Tests (Urea & Creatinine).",
    "notes": "I. GLUCOSE METABOLISM & DIABETES DIAGNOSTIC CRITERIA (ADA Guidelines):\nElevated glucose levels (hyperglycemia) are most often encountered clinically in diabetes mellitus, but may also occur with pancreatic disorders, hyperthyroidism, and adrenocortical dysfunction. Decreased levels (hypoglycemia) result from insulin excess, prolonged starvation, or liver disease.\n\nDiagnostic Criteria:\n• Fasting Blood Sugar: < 100 mg/dL (Normal) | 100 - 125 mg/dL (Pre-Diabetes / IFG) | ≥ 126 mg/dL (Diabetes)\n• Postprandial Blood Sugar: < 140 mg/dL (Normal) | 140 - 199 mg/dL (Pre-Diabetes / IGT) | ≥ 200 mg/dL (Diabetes)\n• HbA1c: < 5.7 % (Normal) | 5.7 - 6.4 % (Prediabetes) | ≥ 6.5 % (Diabetes)\n\nII. LIPID PROFILE IN DIABETES:\nAbnormalities of lipids increase coronary artery disease (CAD) risk in diabetes. Typical diabetic dyslipidemia features high Triglycerides, low HDL-C, and elevated small dense LDL particles.\nLAI Statin Initiation Guidelines (2020):\n• Extreme / Very High Risk: LDL Goal < 50 mg/dL, Non-HDL Goal < 80 mg/dL\n• High Risk: LDL Goal < 70 mg/dL, Non-HDL Goal < 100 mg/dL\n• Moderate Risk: LDL Goal < 100 mg/dL, Non-HDL Goal < 130 mg/dL\n\nIII. RENAL FUNCTION (DIABETIC NEPHROPATHY SCREENING):\nSerum Creatinine and Blood Urea assess glomerular filtration and renal clearance to detect early diabetic nephropathy.",
    "interpretation": "I. GLUCOSE METABOLISM & DIABETES DIAGNOSTIC CRITERIA (ADA Guidelines):\nElevated glucose levels (hyperglycemia) are most often encountered clinically in diabetes mellitus, but may also occur with pancreatic disorders, hyperthyroidism, and adrenocortical dysfunction. Decreased levels (hypoglycemia) result from insulin excess, prolonged starvation, or liver disease.\n\nDiagnostic Criteria:\n• Fasting Blood Sugar: < 100 mg/dL (Normal) | 100 - 125 mg/dL (Pre-Diabetes / IFG) | ≥ 126 mg/dL (Diabetes)\n• Postprandial Blood Sugar: < 140 mg/dL (Normal) | 140 - 199 mg/dL (Pre-Diabetes / IGT) | ≥ 200 mg/dL (Diabetes)\n• HbA1c: < 5.7 % (Normal) | 5.7 - 6.4 % (Prediabetes) | ≥ 6.5 % (Diabetes)\n\nII. LIPID PROFILE IN DIABETES:\nAbnormalities of lipids increase coronary artery disease (CAD) risk in diabetes. Typical diabetic dyslipidemia features high Triglycerides, low HDL-C, and elevated small dense LDL particles.\nLAI Statin Initiation Guidelines (2020):\n• Extreme / Very High Risk: LDL Goal < 50 mg/dL, Non-HDL Goal < 80 mg/dL\n• High Risk: LDL Goal < 70 mg/dL, Non-HDL Goal < 100 mg/dL\n• Moderate Risk: LDL Goal < 100 mg/dL, Non-HDL Goal < 130 mg/dL\n\nIII. RENAL FUNCTION (DIABETIC NEPHROPATHY SCREENING):\nSerum Creatinine and Blood Urea assess glomerular filtration and renal clearance to detect early diabetic nephropathy.",
    "parameters": [
      {
        "name": "Fasting Blood Sugar",
        "referenceRange": "70 - 100",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Blood Sugar PP",
        "referenceRange": "< 180 mg/dl",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "HbA1c (Glycated Hemoglobin)",
        "referenceRange": "< 5.7 % (Normal) | 5.7 - 6.4 % (Prediabetes) | >= 6.5 % (Diabetes)",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Estimated Average Glucose (eAG)",
        "referenceRange": "70 - 126",
        "unit": "mg/dL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total Cholesterol",
        "referenceRange": "125 - 200",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Triglycerides",
        "referenceRange": "25 - 200",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "HDL Cholesterol",
        "referenceRange": "35 - 80",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "LDL Cholesterol",
        "referenceRange": "85 - 130",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "VLDL Cholesterol",
        "referenceRange": "5 - 40",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "LDL / HDL",
        "referenceRange": "1.5 - 3.5",
        "unit": "",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total Cholesterol / HDL",
        "referenceRange": "3.5 - 5.0",
        "unit": "",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "TG / HDL",
        "referenceRange": "< 3.0",
        "unit": "",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Non-HDL cholesterol",
        "referenceRange": "< 130",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Urea",
        "referenceRange": "19 - 45",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Creatinine",
        "referenceRange": "0.72 - 1.18",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "DLC",
    "title": "Differential Leucocyte Count (DLC)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "Same Day",
    "description": "Microscopic and automated differential leukocyte count (DLC) evaluating proportions of neutrophils, lymphocytes, eosinophils, monocytes, and basophils.",
    "notes": "Differential Leucocyte Count (DLC) Reference Ranges & Clinical Interpretation:\n\n1. Neutrophils (40 - 80 %):\n• Increased in: Infection (bacterial or early viral), acute stress, acute and chronic inflammation, tumors, drugs (eg, G-CSF), diabetic ketoacidosis, leukemia (rare).\n• Decreased in: Aplastic anemia, drug-induced neutropenia, chemotherapy, folate or B12 deficiency, myelodysplasia, marrow infiltration, cyclic neutropenia, autoimmune/isoimmune neutropenia, Felty syndrome, hypersplenism, sepsis, viral marrow suppression, bone marrow failure syndromes.\n\n2. Lymphocytes (20 - 40 %):\n• Increased in: Viral infection (especially infectious mononucleosis, pertussis), thyrotoxicosis, adrenal insufficiency, lymphoid leukemia/lymphoma, chronic infection, drug and allergic reactions, autoimmune diseases.\n• Decreased in: Immune deficiency syndromes (eg, HIV), idiopathic drugs.\n\n3. Monocytes (2 - 10 %):\n• Increased in: Inflammation, infection, malignancy, tuberculosis, myeloproliferative disorders (eg, CMML).\n• Decreased in: Depleted in overwhelming bacterial infection, hairy cell leukemia.\n\n4. Eosinophils (1 - 6 %):\n• Increased in: Allergic states, asthma, drug sensitivity reactions, skin disorders, parasitic and certain fungal infections, Churg-Strauss syndrome, polyarteritis nodosa, response to malignancy (eg, Hodgkin disease, T-cell lymphoma, adenocarcinoma), eosinophilic pneumonia, hypereosinophilic syndrome, leukemia (eg, chronic eosinophilic leukemia), myeloid/lymphoid neoplasms with PDGF/FGF receptor abnormalities, mastocytosis.\n• Decreased in: Depleted in overwhelming bacterial infection, hairy cell leukemia.\n\n5. Basophils (< 2 %):\n• Increased in: Hypersensitivity reactions, drugs, myeloproliferative disorders (eg, CML), basophilic or mast cell variant of acute/chronic leukemia, inflammatory reaction, certain infections, hypothyroidism.\n• Decreased in: Not applicable.",
    "interpretation": "Differential Leucocyte Count (DLC) Reference Ranges & Clinical Interpretation:\n\n1. Neutrophils (40 - 80 %):\n• Increased in: Infection (bacterial or early viral), acute stress, acute and chronic inflammation, tumors, drugs (eg, G-CSF), diabetic ketoacidosis, leukemia (rare).\n• Decreased in: Aplastic anemia, drug-induced neutropenia, chemotherapy, folate or B12 deficiency, myelodysplasia, marrow infiltration, cyclic neutropenia, autoimmune/isoimmune neutropenia, Felty syndrome, hypersplenism, sepsis, viral marrow suppression, bone marrow failure syndromes.\n\n2. Lymphocytes (20 - 40 %):\n• Increased in: Viral infection (especially infectious mononucleosis, pertussis), thyrotoxicosis, adrenal insufficiency, lymphoid leukemia/lymphoma, chronic infection, drug and allergic reactions, autoimmune diseases.\n• Decreased in: Immune deficiency syndromes (eg, HIV), idiopathic drugs.\n\n3. Monocytes (2 - 10 %):\n• Increased in: Inflammation, infection, malignancy, tuberculosis, myeloproliferative disorders (eg, CMML).\n• Decreased in: Depleted in overwhelming bacterial infection, hairy cell leukemia.\n\n4. Eosinophils (1 - 6 %):\n• Increased in: Allergic states, asthma, drug sensitivity reactions, skin disorders, parasitic and certain fungal infections, Churg-Strauss syndrome, polyarteritis nodosa, response to malignancy (eg, Hodgkin disease, T-cell lymphoma, adenocarcinoma), eosinophilic pneumonia, hypereosinophilic syndrome, leukemia (eg, chronic eosinophilic leukemia), myeloid/lymphoid neoplasms with PDGF/FGF receptor abnormalities, mastocytosis.\n• Decreased in: Depleted in overwhelming bacterial infection, hairy cell leukemia.\n\n5. Basophils (< 2 %):\n• Increased in: Hypersensitivity reactions, drugs, myeloproliferative disorders (eg, CML), basophilic or mast cell variant of acute/chronic leukemia, inflammatory reaction, certain infections, hypothyroidism.\n• Decreased in: Not applicable.",
    "parameters": [
      {
        "name": "Neutrophils",
        "referenceRange": "40 - 80",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Lymphocytes",
        "referenceRange": "20 - 40",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Eosinophils",
        "referenceRange": "1 - 6",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Monocytes",
        "referenceRange": "2 - 10",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Basophils",
        "referenceRange": "< 2",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Estradiol",
    "title": "Estradiol (E2)",
    "basePrice": 550,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Chemiluminescence Immunoassay (CLIA) for quantitative determination of 17-beta Estradiol (E2) in serum to assess ovarian function, menstrual disorders, fertility, and menopausal status.",
    "notes": "Biological Reference Intervals (pg/mL):\n• Males (Adult): 11.3 - 43.2 pg/mL\n\n• Females:\n  - Follicular Phase: 12.5 - 166.0 pg/mL\n  - Mid-Cycle Peak (Ovulatory): 85.8 - 498.0 pg/mL\n  - Luteal Phase: 43.8 - 211.0 pg/mL\n  - Postmenopausal: < 5.0 - 54.7 pg/mL\n  - Oral Contraceptives: < 50 pg/mL\n\n• Pre-pubertal Children:\n  - Males: < 15 pg/mL\n  - Females: < 20 pg/mL\n\nClinical Significance:\nEstradiol (E2) is the most potent circulating natural estrogen. In females, it is primarily synthesized by maturing ovarian follicles and the corpus luteum under the stimulation of FSH and LH. In males, small amounts are produced by testes and peripheral aromatization in adipose tissue.\n\nElevated Levels:\n• Estrogen-producing ovarian granulosa cell tumors, thecomas, testicular Leydig cell tumors, liver cirrhosis, precocious puberty, exogenous estrogen intake.\n\nDecreased Levels:\n• Premature ovarian failure (POF), menopause, Turner syndrome, hypopituitarism, hypothalamic dysfunction (Kallmann syndrome, severe anorexia nervosa, strenuous exercise).",
    "interpretation": "Biological Reference Intervals (pg/mL):\n• Males (Adult): 11.3 - 43.2 pg/mL\n\n• Females:\n  - Follicular Phase: 12.5 - 166.0 pg/mL\n  - Mid-Cycle Peak (Ovulatory): 85.8 - 498.0 pg/mL\n  - Luteal Phase: 43.8 - 211.0 pg/mL\n  - Postmenopausal: < 5.0 - 54.7 pg/mL\n  - Oral Contraceptives: < 50 pg/mL\n\n• Pre-pubertal Children:\n  - Males: < 15 pg/mL\n  - Females: < 20 pg/mL\n\nClinical Significance:\nEstradiol (E2) is the most potent circulating natural estrogen. In females, it is primarily synthesized by maturing ovarian follicles and the corpus luteum under the stimulation of FSH and LH. In males, small amounts are produced by testes and peripheral aromatization in adipose tissue.\n\nElevated Levels:\n• Estrogen-producing ovarian granulosa cell tumors, thecomas, testicular Leydig cell tumors, liver cirrhosis, precocious puberty, exogenous estrogen intake.\n\nDecreased Levels:\n• Premature ovarian failure (POF), menopause, Turner syndrome, hypopituitarism, hypothalamic dysfunction (Kallmann syndrome, severe anorexia nervosa, strenuous exercise).",
    "parameters": [
      {
        "name": "Estradiol",
        "referenceRange": "Males: 11.3 - 43.2 | Females: Follicular 12.5 - 166.0, Ovulatory 85.8 - 498.0, Luteal 43.8 - 211.0, Postmenopausal < 5.0 - 54.7",
        "unit": "pg/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Ferritin",
    "title": "Ferritin",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Chemiluminescence Immunoassay (CLIA) for quantitative determination of Serum Ferritin to assess body iron stores, iron deficiency anemia, and iron overload conditions.",
    "notes": "Interpretation:\nFerritin is iron storage protein. Determination of ferritin is necessary in Iron deficiency anemia, monitoring iron therapy, and in differential diagnosis of Anaemia.\n\nElevation levels-\nHemochromatosis, Porphyria, Rheumatoid arthritis, Leukaemia, Hodgkin's lymphoma, Liver disease, Multiple blood transfusion, Acute phase reactant, Increased in all inflammatory condition.\n\nDecreased level-\nIron deficiency anemia.",
    "interpretation": "Interpretation:\nFerritin is iron storage protein. Determination of ferritin is necessary in Iron deficiency anemia, monitoring iron therapy, and in differential diagnosis of Anaemia.\n\nElevation levels-\nHemochromatosis, Porphyria, Rheumatoid arthritis, Leukaemia, Hodgkin's lymphoma, Liver disease, Multiple blood transfusion, Acute phase reactant, Increased in all inflammatory condition.\n\nDecreased level-\nIron deficiency anemia.",
    "parameters": [
      {
        "name": "Ferritin",
        "referenceRange": "22 - 332",
        "unit": "ng/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "eGFR",
    "title": "Estimated Glomerular Filtration Rate (eGFR)",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "Same Day",
    "description": "Quantitative calculation of Estimated Glomerular Filtration Rate (eGFR) using standardized equations based on serum creatinine, age, and sex for kidney function and CKD staging.",
    "notes": "Clinical Significance:\nEstimated Glomerular Filtration Rate (eGFR) is the premier metric used to evaluate renal function, detect acute kidney injury (AKI), diagnose Chronic Kidney Disease (CKD), and guide drug dosing. eGFR is calculated based on serum creatinine, age, and sex normalized to a standard body surface area (1.73 m²).\n\nKDIGO CKD Staging Classification:\n• Stage G1 (Normal / High): eGFR ≥ 90 mL/min/1.73m² (Normal if no kidney damage/albuminuria)\n• Stage G2 (Mildly Decreased): eGFR 60 - 89 mL/min/1.73m²\n• Stage G3a (Mild-to-Moderately Decreased): eGFR 45 - 59 mL/min/1.73m² (Diagnostic of CKD if sustained > 3 months)\n• Stage G3b (Moderately-to-Severely Decreased): eGFR 30 - 44 mL/min/1.73m²\n• Stage G4 (Severely Decreased): eGFR 15 - 29 mL/min/1.73m²\n• Stage G5 (Kidney Failure / ESRD): eGFR < 15 mL/min/1.73m² (Dialysis/transplant needed)\n\nClinical Guidance:\n1. Persistent eGFR < 60 mL/min/1.73m² for ≥ 3 months confirms Chronic Kidney Disease (CKD).\n2. eGFR ≥ 60 mL/min/1.73m² without urine albuminuria does not constitute CKD.",
    "interpretation": "Clinical Significance:\nEstimated Glomerular Filtration Rate (eGFR) is the premier metric used to evaluate renal function, detect acute kidney injury (AKI), diagnose Chronic Kidney Disease (CKD), and guide drug dosing. eGFR is calculated based on serum creatinine, age, and sex normalized to a standard body surface area (1.73 m²).\n\nKDIGO CKD Staging Classification:\n• Stage G1 (Normal / High): eGFR ≥ 90 mL/min/1.73m² (Normal if no kidney damage/albuminuria)\n• Stage G2 (Mildly Decreased): eGFR 60 - 89 mL/min/1.73m²\n• Stage G3a (Mild-to-Moderately Decreased): eGFR 45 - 59 mL/min/1.73m² (Diagnostic of CKD if sustained > 3 months)\n• Stage G3b (Moderately-to-Severely Decreased): eGFR 30 - 44 mL/min/1.73m²\n• Stage G4 (Severely Decreased): eGFR 15 - 29 mL/min/1.73m²\n• Stage G5 (Kidney Failure / ESRD): eGFR < 15 mL/min/1.73m² (Dialysis/transplant needed)\n\nClinical Guidance:\n1. Persistent eGFR < 60 mL/min/1.73m² for ≥ 3 months confirms Chronic Kidney Disease (CKD).\n2. eGFR ≥ 60 mL/min/1.73m² without urine albuminuria does not constitute CKD.",
    "parameters": [
      {
        "name": "Creatinine",
        "referenceRange": "0.72 - 1.18",
        "unit": "mg/dL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "eGFR",
        "referenceRange": "> 90",
        "unit": "ml/min/1.73m^2",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "eGFR Category",
        "referenceRange": "Stage G1: Normal (>=90)",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Stage G1: Normal or high kidney function (≥ 90 mL/min/1.73m²)",
            "isAbnormal": false
          },
          {
            "value": "Stage G2: Mildly decreased kidney function (60 - 89 mL/min/1.73m²)",
            "isAbnormal": false
          },
          {
            "value": "Stage G3a: Mild-to-moderately decreased (45 - 59 mL/min/1.73m²)",
            "isAbnormal": true
          },
          {
            "value": "Stage G3b: Moderately-to-severely decreased (30 - 44 mL/min/1.73m²)",
            "isAbnormal": true
          },
          {
            "value": "Stage G4: Severely decreased kidney function (15 - 29 mL/min/1.73m²)",
            "isAbnormal": true
          },
          {
            "value": "Stage G5: Kidney failure / End-stage renal disease (< 15 mL/min/1.73m²)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Dengue NS1 Antigen",
    "title": "Dengue NS1 Antigen",
    "basePrice": 600,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "Same Day",
    "description": "Rapid immunochromatographic / ELISA test for early detection of Dengue Virus Non-Structural Protein 1 (NS1) antigen in serum during the acute febrile phase (Day 1 - 9).",
    "notes": "Dengue virus, transmitted by Aedes mosquitoes, belongs to the Flavivirus genus and has four serotypes: DEN-1, DEN-2, DEN-3, and DEN-4. Immunity from one serotype is lifelong but does not protect against the others.\n\nDengue infection ranges from mild fever to severe, potentially fatal hemorrhagic disease. The WHO classifies dengue infections as primary or secondary. Secondary infections with different serotypes carry a higher risk of complications such as Dengue Hemorrhagic Fever (DHF) and Dengue Shock Syndrome (DSS).\n\nTest Utility:\n• Dengue NS1 antigen can be detected in serum from day 1 to day 9 after symptoms begin. Dengue-specific IgM antibodies appear as early as 5 days after fever starts and usually last 30-90 days, though they can occasionally be detectable for up to 8 months.\n• IgM is also present in secondary and tertiary dengue infections, but often at lower and more transient levels. Dengue IgG levels typically rise by the end of the first week of a primary infection and can persist for months or even a lifetime.\n• In primary dengue, patients are usually IgM positive and IgG negative with high IgM levels. In secondary infections, patients are often positive for both IgG and IgM, with higher IgG concentrations.\n\nConfirmed diagnosis of Dengue fever can be established in a suspected case with at least one of the following tests:\n1) Demonstration of NS1 antigen by ELISA / Rapid Card\n2) Demonstration of IgM antibody titre by ELISA in single serum sample\n3) IgG seroconversion in paired sera after 2 weeks with 4 fold rise in titre\n4) Demonstration of viral nucleic acid by PCR\n\nLimitations:\n• Cross-reactivity due to other flavivirus infections (Tick-borne encephalitis, Japanese encephalitis etc) can give false positive dengue test.\n• Differential diagnoses during the acute phase of illness should include measles, rubella, influenza, typhoid, leptospirosis, malaria, other viral hemorrhagic fevers, and any other disease that may present as a nonspecific viral syndrome.",
    "interpretation": "Dengue virus, transmitted by Aedes mosquitoes, belongs to the Flavivirus genus and has four serotypes: DEN-1, DEN-2, DEN-3, and DEN-4. Immunity from one serotype is lifelong but does not protect against the others.\n\nDengue infection ranges from mild fever to severe, potentially fatal hemorrhagic disease. The WHO classifies dengue infections as primary or secondary. Secondary infections with different serotypes carry a higher risk of complications such as Dengue Hemorrhagic Fever (DHF) and Dengue Shock Syndrome (DSS).\n\nTest Utility:\n• Dengue NS1 antigen can be detected in serum from day 1 to day 9 after symptoms begin. Dengue-specific IgM antibodies appear as early as 5 days after fever starts and usually last 30-90 days, though they can occasionally be detectable for up to 8 months.\n• IgM is also present in secondary and tertiary dengue infections, but often at lower and more transient levels. Dengue IgG levels typically rise by the end of the first week of a primary infection and can persist for months or even a lifetime.\n• In primary dengue, patients are usually IgM positive and IgG negative with high IgM levels. In secondary infections, patients are often positive for both IgG and IgM, with higher IgG concentrations.\n\nConfirmed diagnosis of Dengue fever can be established in a suspected case with at least one of the following tests:\n1) Demonstration of NS1 antigen by ELISA / Rapid Card\n2) Demonstration of IgM antibody titre by ELISA in single serum sample\n3) IgG seroconversion in paired sera after 2 weeks with 4 fold rise in titre\n4) Demonstration of viral nucleic acid by PCR\n\nLimitations:\n• Cross-reactivity due to other flavivirus infections (Tick-borne encephalitis, Japanese encephalitis etc) can give false positive dengue test.\n• Differential diagnoses during the acute phase of illness should include measles, rubella, influenza, typhoid, leptospirosis, malaria, other viral hemorrhagic fevers, and any other disease that may present as a nonspecific viral syndrome.",
    "parameters": [
      {
        "name": "Dengue NS1 Antigen",
        "referenceRange": "Non-Reactive (Negative)",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Non-Reactive (Negative)",
            "isAbnormal": false
          },
          {
            "value": "Reactive (Positive)",
            "isAbnormal": true
          },
          {
            "value": "Equivocal / Borderline",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "DLC Leukemia",
    "title": "DLC Leukemia",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "Same Day",
    "description": "Specialized differential leukocyte count examining peripheral blood smear for abnormal immature myeloid/lymphoid precursors and blast cells.",
    "notes": "Clinical Significance:\nIn healthy adult peripheral blood, immature granulocytic precursors (promyelocytes, myelocytes, metamyelocytes) and blast cells (myeloblasts, lymphoblasts) are normally absent (0%). Their presence in the peripheral circulation indicates severe left-shift, leukemoid reaction, or hematological malignancies such as acute/chronic leukemia or myeloproliferative neoplasms.\n\nReference Intervals:\n• Immature / Band Forms: 0 % (Absent)\n• Promyelocytes: 0 % (Absent)\n• Myelocytes: 0 % (Absent)\n• Blast Cells: 0 % (Absent)\n• Meta Myelocytes: 0 % (Absent)\n\nDiagnostic Indications:\n1. Chronic Myeloid Leukemia (CML): Marked leukocytosis with complete granulocytic spectrum (myeloblasts, promyelocytes, myelocytes, metamyelocytes, bands, neutrophils) with basophilia.\n2. Acute Leukemias (AML / ALL): Presence of circulating blast cells (≥ 20% diagnostic of acute leukemia), cytopenias, and leukemic hiatus.\n3. Leukemoid Reaction: Reactive left-shift up to myelocytes/metamyelocytes secondary to severe bacterial infection, tissue necrosis, or malignancy.\n4. Myelodysplastic Syndromes (MDS): Dysplastic precursors or circulating blasts.",
    "interpretation": "Clinical Significance:\nIn healthy adult peripheral blood, immature granulocytic precursors (promyelocytes, myelocytes, metamyelocytes) and blast cells (myeloblasts, lymphoblasts) are normally absent (0%). Their presence in the peripheral circulation indicates severe left-shift, leukemoid reaction, or hematological malignancies such as acute/chronic leukemia or myeloproliferative neoplasms.\n\nReference Intervals:\n• Immature / Band Forms: 0 % (Absent)\n• Promyelocytes: 0 % (Absent)\n• Myelocytes: 0 % (Absent)\n• Blast Cells: 0 % (Absent)\n• Meta Myelocytes: 0 % (Absent)\n\nDiagnostic Indications:\n1. Chronic Myeloid Leukemia (CML): Marked leukocytosis with complete granulocytic spectrum (myeloblasts, promyelocytes, myelocytes, metamyelocytes, bands, neutrophils) with basophilia.\n2. Acute Leukemias (AML / ALL): Presence of circulating blast cells (≥ 20% diagnostic of acute leukemia), cytopenias, and leukemic hiatus.\n3. Leukemoid Reaction: Reactive left-shift up to myelocytes/metamyelocytes secondary to severe bacterial infection, tissue necrosis, or malignancy.\n4. Myelodysplastic Syndromes (MDS): Dysplastic precursors or circulating blasts.",
    "parameters": [
      {
        "name": "Immature",
        "referenceRange": "0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Promyelocytes",
        "referenceRange": "0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Myelocytes",
        "referenceRange": "0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Blast Cells",
        "referenceRange": "0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Meta Myelocytes",
        "referenceRange": "0",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Lipid Profile",
    "title": "Lipid Profile",
    "basePrice": 550,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Fasting 10-12 hrs)",
    "turnaroundTime": "Same Day",
    "description": "Comprehensive lipid panel evaluating Total Cholesterol, Triglycerides, HDL, LDL, VLDL, and cardiovascular atherogenic ratios.",
    "notes": "Abnormalities of lipids are associated with increased risk of coronary artery disease (CAD) in patients with DM. This risk can be reduced by intensive treatment of lipid abnormalities. The usual pattern of lipid abnormalities in type 2 DM is elevated triglycerides, decreased HDL cholesterol and higher proportion of small, dense LDL particles. Cholesterol is a lipid found in all cell membranes and in blood plasma. It is an essential component of the cell membranes, and is necessary for synthesis of steroid hormones, and for the formation of bile acids. Cholesterol is synthesized by the liver and many other organs, and is also ingested in the diet. Triglycerides are lipids in which three long-chain fatty acids are attached to glycerol. They are present in dietary fat and also synthesized by liver and adipose tissue.\n\nNewer treatment goals and statin initiation thresholds based on the risk categories proposed by Lipid Association of India in 2020:\n• Extreme Risk Group Category A:\n  - Treatment Goal: LDL-C < 50 mg/dl (Optional Goal <= 30), Non-HDL-C < 80 mg/dl (Optional Goal <= 60)\n  - Consider Therapy: LDL-C >= 50 mg/dl, Non-HDL-C >= 80 mg/dl\n• Extreme Risk Group Category B:\n  - Treatment Goal: LDL-C <= 30 mg/dl, Non-HDL-C <= 60 mg/dl\n  - Consider Therapy: LDL-C > 30 mg/dl, Non-HDL-C > 60 mg/dl\n• Very High Risk:\n  - Treatment Goal: LDL-C < 50 mg/dl, Non-HDL-C < 80 mg/dl\n  - Consider Therapy: LDL-C >= 50 mg/dl, Non-HDL-C >= 80 mg/dl\n• High Risk:\n  - Treatment Goal: LDL-C < 70 mg/dl, Non-HDL-C < 100 mg/dl\n  - Consider Therapy: LDL-C >= 70 mg/dl, Non-HDL-C >= 100 mg/dl\n• Moderate Risk:\n  - Treatment Goal: LDL-C < 100 mg/dl, Non-HDL-C < 130 mg/dl\n  - Consider Therapy: LDL-C >= 100 mg/dl, Non-HDL-C >= 130 mg/dl\n• Low Risk:\n  - Treatment Goal: LDL-C < 100 mg/dl, Non-HDL-C < 130 mg/dl\n  - Consider Therapy: LDL-C >= 130* mg/dl, Non-HDL-C >= 160* mg/dl\n*In low risk patient, consider therapy after an initial non-pharmacological intervention for at least 3 months.",
    "interpretation": "Abnormalities of lipids are associated with increased risk of coronary artery disease (CAD) in patients with DM. This risk can be reduced by intensive treatment of lipid abnormalities. The usual pattern of lipid abnormalities in type 2 DM is elevated triglycerides, decreased HDL cholesterol and higher proportion of small, dense LDL particles. Cholesterol is a lipid found in all cell membranes and in blood plasma. It is an essential component of the cell membranes, and is necessary for synthesis of steroid hormones, and for the formation of bile acids. Cholesterol is synthesized by the liver and many other organs, and is also ingested in the diet. Triglycerides are lipids in which three long-chain fatty acids are attached to glycerol. They are present in dietary fat and also synthesized by liver and adipose tissue.\n\nNewer treatment goals and statin initiation thresholds based on the risk categories proposed by Lipid Association of India in 2020:\n• Extreme Risk Group Category A:\n  - Treatment Goal: LDL-C < 50 mg/dl (Optional Goal <= 30), Non-HDL-C < 80 mg/dl (Optional Goal <= 60)\n  - Consider Therapy: LDL-C >= 50 mg/dl, Non-HDL-C >= 80 mg/dl\n• Extreme Risk Group Category B:\n  - Treatment Goal: LDL-C <= 30 mg/dl, Non-HDL-C <= 60 mg/dl\n  - Consider Therapy: LDL-C > 30 mg/dl, Non-HDL-C > 60 mg/dl\n• Very High Risk:\n  - Treatment Goal: LDL-C < 50 mg/dl, Non-HDL-C < 80 mg/dl\n  - Consider Therapy: LDL-C >= 50 mg/dl, Non-HDL-C >= 80 mg/dl\n• High Risk:\n  - Treatment Goal: LDL-C < 70 mg/dl, Non-HDL-C < 100 mg/dl\n  - Consider Therapy: LDL-C >= 70 mg/dl, Non-HDL-C >= 100 mg/dl\n• Moderate Risk:\n  - Treatment Goal: LDL-C < 100 mg/dl, Non-HDL-C < 130 mg/dl\n  - Consider Therapy: LDL-C >= 100 mg/dl, Non-HDL-C >= 130 mg/dl\n• Low Risk:\n  - Treatment Goal: LDL-C < 100 mg/dl, Non-HDL-C < 130 mg/dl\n  - Consider Therapy: LDL-C >= 130* mg/dl, Non-HDL-C >= 160* mg/dl\n*In low risk patient, consider therapy after an initial non-pharmacological intervention for at least 3 months.",
    "parameters": [
      {
        "name": "Total Cholesterol",
        "referenceRange": "125 - 200",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Triglycerides",
        "referenceRange": "25 - 200",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "HDL Cholesterol",
        "referenceRange": "35 - 80",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "LDL Cholesterol",
        "referenceRange": "85 - 130",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "VLDL Cholesterol",
        "referenceRange": "5 - 40",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "LDL / HDL",
        "referenceRange": "1.5 - 3.5",
        "unit": "",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total Cholesterol / HDL",
        "referenceRange": "3.5 - 5.0",
        "unit": "",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "TG / HDL",
        "referenceRange": "< 3.0",
        "unit": "",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Non-HDL cholesterol",
        "referenceRange": "< 130",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HBeAg",
    "title": "Hepatitis B Envelope Antigen (HBeAg)",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "Same Day",
    "description": "Chemiluminescent Microparticle Immunoassay (CMIA) / ELISA for qualitative and semi-quantitative detection of Hepatitis B \"e\" Antigen (HBeAg) in human serum to assess HBV replication and infectivity.",
    "notes": "Physiological Basis:\nHBeAg is a soluble protein secreted by HBV, related to HBcAg, indicating viral replication and infectivity. Two distinct serologic types of hepatitis B have been described, one with a positive HBeAg, and the other with a negative HBeAg and a positive anti-HBe antibody.\n\nInterpretation:\nIncreased (positive) in: HBV (acute, chronic) hepatitis.\n\nComments:\nThe assumption has been that loss of HBeAg and accumulation of HBeAb are associated with decreased infectivity. Testing has proved unreliable, and tests are not routinely needed as indicators of infectivity. All patients positive for HBeAg must be considered infectious.",
    "interpretation": "Physiological Basis:\nHBeAg is a soluble protein secreted by HBV, related to HBcAg, indicating viral replication and infectivity. Two distinct serologic types of hepatitis B have been described, one with a positive HBeAg, and the other with a negative HBeAg and a positive anti-HBe antibody.\n\nInterpretation:\nIncreased (positive) in: HBV (acute, chronic) hepatitis.\n\nComments:\nThe assumption has been that loss of HBeAg and accumulation of HBeAb are associated with decreased infectivity. Testing has proved unreliable, and tests are not routinely needed as indicators of infectivity. All patients positive for HBeAg must be considered infectious.",
    "parameters": [
      {
        "name": "HBeAg",
        "referenceRange": "< 15 index/mL",
        "unit": "index/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HBsAg",
    "title": "Hepatitis B Surface Antigen (HBsAg)",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "Same Day",
    "description": "Qualitative immunochromatographic rapid card / Chemiluminescence immunoassay (CLIA) for the detection of Hepatitis B Surface Antigen (HBsAg) in human serum/plasma.",
    "notes": "Interpretation:\n• Non-Reactive: Hepatitis B surface antigen absent.\n• Reactive: Hepatitis B surface antigen present.\n\nPresence of Hepatitis B antigen indicates reactive result which monitors HBsAg levels during the disease but cannot predict the stages of disease. Rapid card tests are screening tests, false positive and false negative results may occur due to various factors which may influence test results.\n\nTest Utility:\nHBsAg is the first serologic marker appearing in the serum 6-16 weeks following hepatitis B viral infection. In a typical HBV infection, HBsAg will be detected 2-4 weeks before the liver enzyme levels (ALT) become abnormal and 3-5 weeks before the patient develops jaundice. In acute cases, HBsAg usually disappears 1-2 months after the onset of symptoms. Persistence of HBsAg for more than 6 months indicates the development of either a chronic carrier state or chronic liver disease. The presence of HBsAg is frequently associated with infectivity. HBsAg when accompanied by Hepatitis B e-antigen (HBeAg) and/or hepatitis B viral DNA almost always indicates high infectivity.",
    "interpretation": "Interpretation:\n• Non-Reactive: Hepatitis B surface antigen absent.\n• Reactive: Hepatitis B surface antigen present.\n\nPresence of Hepatitis B antigen indicates reactive result which monitors HBsAg levels during the disease but cannot predict the stages of disease. Rapid card tests are screening tests, false positive and false negative results may occur due to various factors which may influence test results.\n\nTest Utility:\nHBsAg is the first serologic marker appearing in the serum 6-16 weeks following hepatitis B viral infection. In a typical HBV infection, HBsAg will be detected 2-4 weeks before the liver enzyme levels (ALT) become abnormal and 3-5 weeks before the patient develops jaundice. In acute cases, HBsAg usually disappears 1-2 months after the onset of symptoms. Persistence of HBsAg for more than 6 months indicates the development of either a chronic carrier state or chronic liver disease. The presence of HBsAg is frequently associated with infectivity. HBsAg when accompanied by Hepatitis B e-antigen (HBeAg) and/or hepatitis B viral DNA almost always indicates high infectivity.",
    "parameters": [
      {
        "name": "HBsAg",
        "referenceRange": "Non-Reactive (Negative)",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Non-Reactive (Negative)",
            "isAbnormal": false
          },
          {
            "value": "Reactive (Positive)",
            "isAbnormal": true
          },
          {
            "value": "Equivocal / Borderline",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HBsAg ELISA",
    "title": "HBsAg ELISA",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "Same Day",
    "description": "Enzyme-Linked Immunosorbent Assay (ELISA) for highly sensitive and specific detection of Hepatitis B Surface Antigen (HBsAg) in human serum/plasma.",
    "notes": "Interpretation & Cut-off Criteria (ELISA):\n• Non-Reactive (Negative): Signal-to-Cutoff Ratio (S/CO) < 0.90 Units. Hepatitis B surface antigen absent.\n• Equivocal / Borderline: S/CO 0.90 - 1.10 Units. Retesting in duplicate or sample collected after 1-2 weeks recommended.\n• Reactive (Positive): S/CO > 1.10 Units. Hepatitis B surface antigen detected, indicating active (acute or chronic) HBV infection.\n\nMethod: Enzyme-Linked Immunosorbent Assay (ELISA).\n\nClinical Significance:\nHBsAg is the primary serological marker for diagnosing Hepatitis B Virus (HBV) infection. ELISA methodology provides high analytical sensitivity and specificity for qualitative/semi-quantitative detection.\n\nDiagnostic Utility:\n1. Acute Infection: HBsAg appears 2 to 8 weeks before clinical symptoms or liver enzyme elevation and persists throughout acute phase.\n2. Chronic Infection: Persistence for > 6 months confirms chronic HBV infection / carrier state.\n3. Infectivity Assessment: High correlation with viral replication. Follow-up testing with HBeAg, Anti-HBe, and HBV DNA PCR is recommended.",
    "interpretation": "Interpretation & Cut-off Criteria (ELISA):\n• Non-Reactive (Negative): Signal-to-Cutoff Ratio (S/CO) < 0.90 Units. Hepatitis B surface antigen absent.\n• Equivocal / Borderline: S/CO 0.90 - 1.10 Units. Retesting in duplicate or sample collected after 1-2 weeks recommended.\n• Reactive (Positive): S/CO > 1.10 Units. Hepatitis B surface antigen detected, indicating active (acute or chronic) HBV infection.\n\nMethod: Enzyme-Linked Immunosorbent Assay (ELISA).\n\nClinical Significance:\nHBsAg is the primary serological marker for diagnosing Hepatitis B Virus (HBV) infection. ELISA methodology provides high analytical sensitivity and specificity for qualitative/semi-quantitative detection.\n\nDiagnostic Utility:\n1. Acute Infection: HBsAg appears 2 to 8 weeks before clinical symptoms or liver enzyme elevation and persists throughout acute phase.\n2. Chronic Infection: Persistence for > 6 months confirms chronic HBV infection / carrier state.\n3. Infectivity Assessment: High correlation with viral replication. Follow-up testing with HBeAg, Anti-HBe, and HBV DNA PCR is recommended.",
    "parameters": [
      {
        "name": "HBsAg ELISA",
        "referenceRange": "Non-Reactive (< 0.90)",
        "unit": "Units",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Non-Reactive (Negative)",
            "isAbnormal": false
          },
          {
            "value": "Reactive (Positive)",
            "isAbnormal": true
          },
          {
            "value": "Borderline / Equivocal",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HB,TLC,DLC",
    "title": "Hemoglobin, TLC & DLC (HB, TLC, DLC)",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "Same Day",
    "description": "Basic hematology profile evaluating Hemoglobin (Hb), Total Leukocyte Count (TLC), and 5-part Differential Leukocyte Count (DLC).",
    "notes": "1. HEMOGLOBIN (Hb):\nHemoglobin is the major protein of erythrocytes that transports oxygen from the lungs to peripheral tissues. It is measured by spectrophotometry on automated instruments after lysis of red cells and conversion of all hemoglobin to cyanmethemoglobin.\n• Increased in: Hemoconcentration (dehydration, burns, vomiting), Polycythemia (erythrocytosis), Extreme physical exercise.\n• Decreased in: Macrocytic anemia (liver disease, hypothyroidism, vitamin B12/folate deficiency, myelodysplasia), Normocytic anemia (early iron deficiency, anemia of chronic disease, hemolytic anemia, acute hemorrhage, bone marrow infiltration), Microcytic anemia (iron deficiency, thalassemia), Hemodilution.\n• Comments: Hypertriglyceridemia and marked leukocytosis can cause false elevations of Hb.\n\n2. TOTAL LEUKOCYTE COUNT (TLC / WBC):\nThe WBC count determines the total number of circulating white blood cells.\n• Increased in: Acute infections, inflammatory disorders, acute and chronic leukemias, myeloproliferative disorders, solid tumors (paraneoplastic), circulating lymphoma, tissue injury/necrosis, G-CSF stimulation, corticosteroids, allergies, stress, smoking.\n• Decreased in: Infections, constitutional and acquired myeloid hypoplasia, myelosuppression (chemotherapy, radiation), myelodysplasia, collagen vascular diseases, hypersplenism, autoimmune neutropenia.\n\n3. DIFFERENTIAL LEUCOCYTE COUNT (DLC):\n• Neutrophils (40 - 80%): Increased in bacterial/viral infections, acute stress, inflammation, tissue necrosis, G-CSF, DKA, leukemia. Decreased in aplastic anemia, drug-induced neutropenia, chemotherapy, B12/folate deficiency, sepsis.\n• Lymphocytes (20 - 40%): Increased in viral infections (infectious mononucleosis, pertussis), thyrotoxicosis, lymphoid leukemia/lymphoma. Decreased in immunodeficiency syndromes (HIV), immunosuppressive drugs.\n• Monocytes (2 - 10%): Increased in inflammation, tuberculosis, malignancy, CMML. Decreased in overwhelming bacterial infection, hairy cell leukemia.\n• Eosinophils (1 - 6%): Increased in allergic states, asthma, parasitic/fungal infections, Churg-Strauss, hypereosinophilic syndrome. Decreased in acute stress, overwhelming infection.\n• Basophils (< 2%): Increased in hypersensitivity reactions, CML, myeloproliferative disorders, hypothyroidism.",
    "interpretation": "1. HEMOGLOBIN (Hb):\nHemoglobin is the major protein of erythrocytes that transports oxygen from the lungs to peripheral tissues. It is measured by spectrophotometry on automated instruments after lysis of red cells and conversion of all hemoglobin to cyanmethemoglobin.\n• Increased in: Hemoconcentration (dehydration, burns, vomiting), Polycythemia (erythrocytosis), Extreme physical exercise.\n• Decreased in: Macrocytic anemia (liver disease, hypothyroidism, vitamin B12/folate deficiency, myelodysplasia), Normocytic anemia (early iron deficiency, anemia of chronic disease, hemolytic anemia, acute hemorrhage, bone marrow infiltration), Microcytic anemia (iron deficiency, thalassemia), Hemodilution.\n• Comments: Hypertriglyceridemia and marked leukocytosis can cause false elevations of Hb.\n\n2. TOTAL LEUKOCYTE COUNT (TLC / WBC):\nThe WBC count determines the total number of circulating white blood cells.\n• Increased in: Acute infections, inflammatory disorders, acute and chronic leukemias, myeloproliferative disorders, solid tumors (paraneoplastic), circulating lymphoma, tissue injury/necrosis, G-CSF stimulation, corticosteroids, allergies, stress, smoking.\n• Decreased in: Infections, constitutional and acquired myeloid hypoplasia, myelosuppression (chemotherapy, radiation), myelodysplasia, collagen vascular diseases, hypersplenism, autoimmune neutropenia.\n\n3. DIFFERENTIAL LEUCOCYTE COUNT (DLC):\n• Neutrophils (40 - 80%): Increased in bacterial/viral infections, acute stress, inflammation, tissue necrosis, G-CSF, DKA, leukemia. Decreased in aplastic anemia, drug-induced neutropenia, chemotherapy, B12/folate deficiency, sepsis.\n• Lymphocytes (20 - 40%): Increased in viral infections (infectious mononucleosis, pertussis), thyrotoxicosis, lymphoid leukemia/lymphoma. Decreased in immunodeficiency syndromes (HIV), immunosuppressive drugs.\n• Monocytes (2 - 10%): Increased in inflammation, tuberculosis, malignancy, CMML. Decreased in overwhelming bacterial infection, hairy cell leukemia.\n• Eosinophils (1 - 6%): Increased in allergic states, asthma, parasitic/fungal infections, Churg-Strauss, hypereosinophilic syndrome. Decreased in acute stress, overwhelming infection.\n• Basophils (< 2%): Increased in hypersensitivity reactions, CML, myeloproliferative disorders, hypothyroidism.",
    "parameters": [
      {
        "name": "Hemoglobin",
        "referenceRange": "13 - 17",
        "unit": "g/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total Leukocyte Count",
        "referenceRange": "4,800 - 10,800",
        "unit": "cumm",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Neutrophils",
        "referenceRange": "40 - 80",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Lymphocytes",
        "referenceRange": "20 - 40",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Eosinophils",
        "referenceRange": "1 - 6",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Monocytes",
        "referenceRange": "2 - 10",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Basophils",
        "referenceRange": "< 2",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "department": "HAEMATOLOGY",
    "test": "ESR (Wintrobe)",
    "title": "ESR (Wintrobe)",
    "basePrice": 100,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA / Sodium Citrate)",
    "turnaroundTime": "Same Day",
    "description": "Measurement of the rate at which red blood cells sediment in a period of 1 hour by Wintrobe method to evaluate systemic inflammation.",
    "notes": "Raised ESR can be found in\n1. Connective tissue disorders\n2. Infections e.g., TB, acute hepatitis, bacterial\n3. Hematological disease e.g., multiple myeloma, anemia of acute or chronic disease, alone or combined with iron deficiency anemia\n4. Malignancy e.g., lymphoma, breast or colon cancer\n5. Pregnancy\n6. Oral contraceptive pill users\n7. Obesity can cause a moderately raised ESR\n\nLow ESR is found in:\n1. Heart failure\n2. Cachexia\n3. PRV or secondary Conditions featuring abnormal blood cells e.g., sickle cell anemia, hereditary spherocytosis, acanthocytosis\n4. Microcytosis\n5. Hypofibrinogenemia e.g. DIC,\n6. Massive hepatic necrosis\n7. High white cell count\n8. Treatment with steroids\n\nNB: Very high (>100) ESR is found in autoimmune disease, malignancy, acute post-trauma, and serious infection. A false high ESR can occur if the ambient temperature is unusually high.",
    "interpretation": "Raised ESR can be found in\n1. Connective tissue disorders\n2. Infections e.g., TB, acute hepatitis, bacterial\n3. Hematological disease e.g., multiple myeloma, anemia of acute or chronic disease, alone or combined with iron deficiency anemia\n4. Malignancy e.g., lymphoma, breast or colon cancer\n5. Pregnancy\n6. Oral contraceptive pill users\n7. Obesity can cause a moderately raised ESR\n\nLow ESR is found in:\n1. Heart failure\n2. Cachexia\n3. PRV or secondary Conditions featuring abnormal blood cells e.g., sickle cell anemia, hereditary spherocytosis, acanthocytosis\n4. Microcytosis\n5. Hypofibrinogenemia e.g. DIC,\n6. Massive hepatic necrosis\n7. High white cell count\n8. Treatment with steroids\n\nNB: Very high (>100) ESR is found in autoimmune disease, malignancy, acute post-trauma, and serious infection. A false high ESR can occur if the ambient temperature is unusually high.",
    "parameters": [
      {
        "name": "Erythrocyte Sedimentation Rate (Wintrobe)",
        "displayName": "Erythrocyte Sedimentation Rate (Wintrobe)",
        "referenceRange": "0 - 9",
        "unit": "mm for 1st hour",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HCV RNA Quantitative",
    "title": "HCV RNA Quantitative (Real-Time PCR)",
    "basePrice": 2800,
    "taxPercentage": 0,
    "sampleType": "EDTA Plasma / Serum",
    "turnaroundTime": "24 - 48 Hours",
    "description": "Quantitative measurement of Hepatitis C Viral RNA (viral load) using Real-Time Reverse Transcription Polymerase Chain Reaction (RT-PCR).",
    "notes": "Methodology: Real-Time Reverse Transcription Polymerase Chain Reaction (RT-PCR).\n\nAnalytical Parameters:\n• Limit of Detection (LOD): 15 IU/mL\n• Linear Dynamic Range: 15 to 100,000,000 IU/mL (1.18 to 8.00 log10 IU/mL)\n\nClinical Interpretation:\n1. Target Not Detected (< 15 IU/mL): HCV RNA is not detected in the specimen. Does not exclude infection below the detection limit.\n2. Target Detected (< 15 IU/mL): HCV RNA is detected below the lower limit of quantification (LLoQ).\n3. Target Detected (> 15 IU/mL): Active HCV viral replication confirmed with quantitative viral load in IU/mL.\n\nClinical Applications:\n• Diagnosis of active Hepatitis C Virus (HCV) infection.\n• Baseline viral load quantification prior to Direct-Acting Antiviral (DAA) therapy.\n• Assessment of Sustained Virological Response (SVR12 / SVR24) post-treatment completion.",
    "interpretation": "Methodology: Real-Time Reverse Transcription Polymerase Chain Reaction (RT-PCR).\n\nAnalytical Parameters:\n• Limit of Detection (LOD): 15 IU/mL\n• Linear Dynamic Range: 15 to 100,000,000 IU/mL (1.18 to 8.00 log10 IU/mL)\n\nClinical Interpretation:\n1. Target Not Detected (< 15 IU/mL): HCV RNA is not detected in the specimen. Does not exclude infection below the detection limit.\n2. Target Detected (< 15 IU/mL): HCV RNA is detected below the lower limit of quantification (LLoQ).\n3. Target Detected (> 15 IU/mL): Active HCV viral replication confirmed with quantitative viral load in IU/mL.\n\nClinical Applications:\n• Diagnosis of active Hepatitis C Virus (HCV) infection.\n• Baseline viral load quantification prior to Direct-Acting Antiviral (DAA) therapy.\n• Assessment of Sustained Virological Response (SVR12 / SVR24) post-treatment completion.",
    "parameters": [
      {
        "name": "Sample Type",
        "referenceRange": "EDTA Plasma / Serum",
        "unit": "Units",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "EDTA Plasma",
            "isAbnormal": false
          },
          {
            "value": "Serum",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "HCV RNA",
        "referenceRange": "Target Not Detected (< 15 IU/mL)",
        "unit": "IU/mL",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Target Not Detected (< 15 IU/mL)",
            "isAbnormal": false
          },
          {
            "value": "Target Detected (< 15 IU/mL)",
            "isAbnormal": true
          },
          {
            "value": "Detected (See Viral Load Value)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HDL Cholesterol",
    "title": "HDL Cholesterol",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Fasting 10-12 hrs)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative determination of High-Density Lipoprotein Cholesterol (HDL-C) in human serum to assess anti-atherogenic capacity and coronary heart disease risk.",
    "notes": "Clinical Significance & Interpretation:\nHigh-Density Lipoprotein (HDL) cholesterol, often referred to as \"good cholesterol\", plays a key role in reverse cholesterol transport by transporting excess cholesterol from peripheral tissues and vascular endothelium back to the liver for excretion in bile.\n\nReference Risk Stratification (NCEP ATP III / LAI Guidelines):\n• < 40 mg/dl (Males) / < 50 mg/dl (Females): Low HDL-C (Major risk factor for Coronary Artery Disease / Atherosclerosis).\n• 40 - 59 mg/dl: Moderate / Borderline level.\n• ≥ 60 mg/dl: High HDL-C (Cardioprotective / Negative risk factor for heart disease).\n\nCauses of Decreased HDL Cholesterol (< 40 mg/dl):\n• Metabolic syndrome, Type 2 Diabetes Mellitus, insulin resistance.\n• Sedentary lifestyle, obesity, cigarette smoking.\n• High triglyceride levels (Hypertriglyceridemia).\n• Drugs: Beta-blockers, anabolic steroids, progestins.\n• Genetic dyslipidemias (Tangier disease, familial hypoalphalipoproteinemia).\n\nCauses of Elevated HDL Cholesterol (> 80 mg/dl):\n• Regular aerobic exercise, moderate alcohol intake, estrogen replacement therapy.\n• Familial hyperalphalipoproteinemia, CETP gene mutations.",
    "interpretation": "Clinical Significance & Interpretation:\nHigh-Density Lipoprotein (HDL) cholesterol, often referred to as \"good cholesterol\", plays a key role in reverse cholesterol transport by transporting excess cholesterol from peripheral tissues and vascular endothelium back to the liver for excretion in bile.\n\nReference Risk Stratification (NCEP ATP III / LAI Guidelines):\n• < 40 mg/dl (Males) / < 50 mg/dl (Females): Low HDL-C (Major risk factor for Coronary Artery Disease / Atherosclerosis).\n• 40 - 59 mg/dl: Moderate / Borderline level.\n• ≥ 60 mg/dl: High HDL-C (Cardioprotective / Negative risk factor for heart disease).\n\nCauses of Decreased HDL Cholesterol (< 40 mg/dl):\n• Metabolic syndrome, Type 2 Diabetes Mellitus, insulin resistance.\n• Sedentary lifestyle, obesity, cigarette smoking.\n• High triglyceride levels (Hypertriglyceridemia).\n• Drugs: Beta-blockers, anabolic steroids, progestins.\n• Genetic dyslipidemias (Tangier disease, familial hypoalphalipoproteinemia).\n\nCauses of Elevated HDL Cholesterol (> 80 mg/dl):\n• Regular aerobic exercise, moderate alcohol intake, estrogen replacement therapy.\n• Familial hyperalphalipoproteinemia, CETP gene mutations.",
    "parameters": [
      {
        "name": "HDL Cholesterol",
        "referenceRange": "35 - 80",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HSV-1/2 IgM",
    "title": "Herpes Simplex Virus 1/2 IgM (HSV-1/2 IgM)",
    "basePrice": 750,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "Same Day",
    "description": "Chemiluminescence Immunoassay (CLIA) / ELISA for the qualitative and semi-quantitative detection of IgM antibodies to Herpes Simplex Virus Types 1 and 2.",
    "notes": "Interpretation Criteria (CLIA / ELISA):\n• Negative (< 2.0 AU/mL): No detectable HSV-1/2 IgM antibodies. Indicates no evidence of recent primary HSV-1 or HSV-2 infection.\n• Equivocal / Grey Zone (2.0 - 4.0 AU/mL): Borderline antibody level. Retesting in 1–2 weeks with a fresh serum sample is recommended.\n• Positive (≥ 4.0 AU/mL): Detectable HSV-1/2 IgM antibodies. Suggests acute, recent primary infection or reactivation of Herpes Simplex Virus.\n\nClinical Utility:\nHerpes Simplex Virus Type 1 (HSV-1) primarily causes orofacial herpes (cold sores) and gingivostomatitis, while HSV-2 primarily causes genital herpes. However, both strains can infect either site.\n\nDiagnostic Considerations:\n1. IgM antibodies appear within the first 1 to 2 weeks post-infection and may persist for several months.\n2. Cross-reactivity between HSV-1 and HSV-2 IgM antibodies is common; type-specific IgG testing (Glycoprotein G-based HSV-1 IgG / HSV-2 IgG) or Real-Time PCR on vesicular lesions is recommended for definitive typing.",
    "interpretation": "Interpretation Criteria (CLIA / ELISA):\n• Negative (< 2.0 AU/mL): No detectable HSV-1/2 IgM antibodies. Indicates no evidence of recent primary HSV-1 or HSV-2 infection.\n• Equivocal / Grey Zone (2.0 - 4.0 AU/mL): Borderline antibody level. Retesting in 1–2 weeks with a fresh serum sample is recommended.\n• Positive (≥ 4.0 AU/mL): Detectable HSV-1/2 IgM antibodies. Suggests acute, recent primary infection or reactivation of Herpes Simplex Virus.\n\nClinical Utility:\nHerpes Simplex Virus Type 1 (HSV-1) primarily causes orofacial herpes (cold sores) and gingivostomatitis, while HSV-2 primarily causes genital herpes. However, both strains can infect either site.\n\nDiagnostic Considerations:\n1. IgM antibodies appear within the first 1 to 2 weeks post-infection and may persist for several months.\n2. Cross-reactivity between HSV-1 and HSV-2 IgM antibodies is common; type-specific IgG testing (Glycoprotein G-based HSV-1 IgG / HSV-2 IgG) or Real-Time PCR on vesicular lesions is recommended for definitive typing.",
    "parameters": [
      {
        "name": "HSV-1/2 IgM",
        "referenceRange": "Neg. < 2 AU/mL\nGrey Zone 2 - 4 AU/mL\nPos. >= 4 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HSV-2 IgG",
    "title": "Herpes Simplex Virus 2 IgG (HSV-2 IgG)",
    "basePrice": 750,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "Same Day",
    "description": "Type-specific Chemiluminescence Immunoassay (CLIA) / ELISA for the qualitative and semi-quantitative detection of IgG antibodies to Herpes Simplex Virus Type 2 (gG-2).",
    "notes": "Interpretation Criteria (CLIA / ELISA):\n• Negative (< 2.0 AU/mL): No detectable HSV-2 specific IgG antibodies. Indicates lack of prior exposure or infection with Herpes Simplex Virus Type 2.\n• Equivocal / Grey Zone (2.0 - 4.0 AU/mL): Borderline antibody level. Retesting in 1–2 weeks with a fresh serum sample is recommended.\n• Positive (≥ 4.0 AU/mL): Detectable HSV-2 IgG antibodies. Indicates prior exposure, past infection, or latent infection with Herpes Simplex Virus Type 2.\n\nClinical Significance:\nHSV-2 is the primary cause of genital herpes infections and neonatal herpes (via perinatal transmission). Type-specific serologic assays utilize recombinant Glycoprotein G-2 (gG-2) to distinguish HSV-2 antibodies specifically from HSV-1 antibodies without antigenic cross-reactivity.\n\nDiagnostic Notes:\n1. Seroconversion: Specific IgG antibodies generally develop 2 to 12 weeks after primary infection and persist indefinitely.\n2. Positive IgG confirms past or chronic/latent infection but does not determine the exact timing of acquisition or active shedding.",
    "interpretation": "Interpretation Criteria (CLIA / ELISA):\n• Negative (< 2.0 AU/mL): No detectable HSV-2 specific IgG antibodies. Indicates lack of prior exposure or infection with Herpes Simplex Virus Type 2.\n• Equivocal / Grey Zone (2.0 - 4.0 AU/mL): Borderline antibody level. Retesting in 1–2 weeks with a fresh serum sample is recommended.\n• Positive (≥ 4.0 AU/mL): Detectable HSV-2 IgG antibodies. Indicates prior exposure, past infection, or latent infection with Herpes Simplex Virus Type 2.\n\nClinical Significance:\nHSV-2 is the primary cause of genital herpes infections and neonatal herpes (via perinatal transmission). Type-specific serologic assays utilize recombinant Glycoprotein G-2 (gG-2) to distinguish HSV-2 antibodies specifically from HSV-1 antibodies without antigenic cross-reactivity.\n\nDiagnostic Notes:\n1. Seroconversion: Specific IgG antibodies generally develop 2 to 12 weeks after primary infection and persist indefinitely.\n2. Positive IgG confirms past or chronic/latent infection but does not determine the exact timing of acquisition or active shedding.",
    "parameters": [
      {
        "name": "HSV-2 IgG",
        "referenceRange": "< 2.0 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Dialysis Package",
    "title": "Dialysis Package / Profile",
    "basePrice": 1200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum & Whole Blood (EDTA)",
    "turnaroundTime": "Same Day",
    "description": "Comprehensive multi-parameter dialysis monitoring panel assessing renal function, small solute clearance, fluid-electrolyte balance, acid-base status, mineral metabolism (CKD-MBD), nutritional protein markers, and hematocrit.",
    "notes": "Clinical Significance & Dialysis Adequacy Guidelines (KDOQI / KDIGO):\n\n1. Dialysis Adequacy & Clearance:\n• Urea Reduction Ratio (URR): Target ≥ 65% per hemodialysis session (equivalent to single-pool Kt/V ≥ 1.2 for thrice-weekly HD). Inadequate clearance is associated with increased uremic toxicity, morbidity, and hospitalizations.\n• Serum Creatinine: Reflects residual kidney function, lean muscle mass, and dietary protein intake in ESRD patients.\n\n2. Fluid & Electrolyte Homeostasis:\n• Potassium (K+): Predialysis target 4.0 – 5.5 mEq/L. Hyperkalemia (> 6.0 mEq/L) carries high risk for life-threatening cardiac arrhythmias; postdialysis hypokalemia (< 3.5 mEq/L) must also be avoided.\n• Sodium (Na+) & Chloride: Interdialytic sodium and fluid overload contribute to hypertension and intradialytic hypotension/pulmonary congestion.\n• Bicarbonate (HCO3-): Predialysis target ≥ 22 mEq/L. Chronic metabolic acidosis exacerbates muscle wasting, protein catabolism, and bone resorption.\n\n3. Chronic Kidney Disease - Mineral and Bone Disorder (CKD-MBD):\n• Phosphorus: Target 3.5 – 5.5 mg/dl in ESRD. Hyperphosphatemia drives vascular calcification, secondary hyperparathyroidism, and cardiovascular mortality.\n• Calcium: Corrected calcium target 8.4 – 9.5 mg/dl to prevent calcium-phosphorus precipitation (Ca x P < 55 mg²/dl²).\n\n4. Nutritional Status & Anemia Management:\n• Serum Albumin: Target ≥ 4.0 g/dl. Serum albumin is a powerful prognostic marker of protein-energy wasting (PEW) and systemic inflammation in dialysis cohorts.\n• Hemoglobin (Hb): Target 10.0 – 11.5 g/dl for patients receiving Erythropoiesis-Stimulating Agents (ESAs) and iron supplementation. Avoid Hb > 13.0 g/dl due to increased thrombotic/stroke risks.",
    "interpretation": "Clinical Significance & Dialysis Adequacy Guidelines (KDOQI / KDIGO):\n\n1. Dialysis Adequacy & Clearance:\n• Urea Reduction Ratio (URR): Target ≥ 65% per hemodialysis session (equivalent to single-pool Kt/V ≥ 1.2 for thrice-weekly HD). Inadequate clearance is associated with increased uremic toxicity, morbidity, and hospitalizations.\n• Serum Creatinine: Reflects residual kidney function, lean muscle mass, and dietary protein intake in ESRD patients.\n\n2. Fluid & Electrolyte Homeostasis:\n• Potassium (K+): Predialysis target 4.0 – 5.5 mEq/L. Hyperkalemia (> 6.0 mEq/L) carries high risk for life-threatening cardiac arrhythmias; postdialysis hypokalemia (< 3.5 mEq/L) must also be avoided.\n• Sodium (Na+) & Chloride: Interdialytic sodium and fluid overload contribute to hypertension and intradialytic hypotension/pulmonary congestion.\n• Bicarbonate (HCO3-): Predialysis target ≥ 22 mEq/L. Chronic metabolic acidosis exacerbates muscle wasting, protein catabolism, and bone resorption.\n\n3. Chronic Kidney Disease - Mineral and Bone Disorder (CKD-MBD):\n• Phosphorus: Target 3.5 – 5.5 mg/dl in ESRD. Hyperphosphatemia drives vascular calcification, secondary hyperparathyroidism, and cardiovascular mortality.\n• Calcium: Corrected calcium target 8.4 – 9.5 mg/dl to prevent calcium-phosphorus precipitation (Ca x P < 55 mg²/dl²).\n\n4. Nutritional Status & Anemia Management:\n• Serum Albumin: Target ≥ 4.0 g/dl. Serum albumin is a powerful prognostic marker of protein-energy wasting (PEW) and systemic inflammation in dialysis cohorts.\n• Hemoglobin (Hb): Target 10.0 – 11.5 g/dl for patients receiving Erythropoiesis-Stimulating Agents (ESAs) and iron supplementation. Avoid Hb > 13.0 g/dl due to increased thrombotic/stroke risks.",
    "parameters": [
      {
        "name": "Urea (Pre-Dialysis)",
        "referenceRange": "15 - 40",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Creatinine (Pre-Dialysis)",
        "referenceRange": "0.6 - 1.2",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Sodium (Na+)",
        "referenceRange": "135 - 145",
        "unit": "mEq/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Potassium (K+)",
        "referenceRange": "3.5 - 5.1",
        "unit": "mEq/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Chloride (Cl-)",
        "referenceRange": "96 - 106",
        "unit": "mEq/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Bicarbonate (HCO3-)",
        "referenceRange": "22 - 29",
        "unit": "mEq/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Calcium",
        "referenceRange": "8.8 - 10.2",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Phosphorus",
        "referenceRange": "2.5 - 4.5",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Total Protein",
        "referenceRange": "6.4 - 8.3",
        "unit": "g/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Albumin",
        "referenceRange": "3.5 - 5.0",
        "unit": "g/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Globulin",
        "referenceRange": "2.0 - 3.5",
        "unit": "g/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "A / G Ratio",
        "referenceRange": "1.2 - 2.0",
        "unit": "",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Hemoglobin (Hb)",
        "referenceRange": "11.0 - 16.0",
        "unit": "g/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Urea Reduction Ratio (URR)",
        "referenceRange": "> 65",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Electrolytes Panel",
    "title": "Electrolytes Panel (Serum Na, K, Cl, Ca, iCa)",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Heparinized Plasma",
    "turnaroundTime": "Same Day",
    "description": "Comprehensive electrolyte profile determining Serum Sodium, Potassium, Chloride, Total Calcium, and Ionized Calcium (iCalcium) for fluid, electrolyte, and acid-base assessment.",
    "notes": "Clinical Significance:\nElectrolytes are essential minerals present in body fluids that carry an electric charge and regulate nerve/muscle function, acid-base equilibrium, hydration, and cellular osmotic pressure.\n\n1. Serum Sodium (Na+):\n• Major extracellular cation maintaining plasma osmolality and extracellular volume.\n• Hyponatremia (< 136 mmol/L): SIADH, congestive heart failure, cirrhosis, nephrotic syndrome, diuretic therapy, vomiting, diarrhea, adrenal insufficiency.\n• Hypernatremia (> 146 mmol/L): Dehydration, diabetes insipidus, excessive salt intake, osmotic diuresis.\n\n2. Serum Potassium (K+):\n• Major intracellular cation critical for cardiac neuromuscular excitability and rhythm.\n• Hypokalemia (< 3.5 mmol/L): Diuretics, vomiting, diarrhea, hyperaldosteronism, alkalosis.\n• Hyperkalemia (> 5.1 mmol/L): Acute/chronic renal failure, potassium-sparing diuretics, ACE inhibitors/ARBs, Addison's disease, severe tissue trauma/rhabdomyolysis, metabolic acidosis.\n\n3. Serum Chloride (Cl-):\n• Major extracellular anion involved in maintaining acid-base balance and electroneutrality.\n• Alterations frequently parallel sodium abnormalities and acid-base disturbances (anion gap calculation).\n\n4. Serum Total & Ionized Calcium (Ca2+ / iCalcium):\n• Ionized Calcium (iCalcium) is the physiologically active, unbound fraction of serum calcium essential for cardiac contractility, neuromuscular transmission, enzyme activation, and blood coagulation.\n• Hypocalcemia / Low iCalcium: Hypoparathyroidism, vitamin D deficiency, renal failure, acute pancreatitis, critical illness/sepsis, alkalosis.\n• Hypercalcemia / Elevated iCalcium: Primary hyperparathyroidism, malignancies (osteolytic metastases, PTHrP production), granulomatous diseases (sarcoidosis, TB), hypervitaminosis D.",
    "interpretation": "Clinical Significance:\nElectrolytes are essential minerals present in body fluids that carry an electric charge and regulate nerve/muscle function, acid-base equilibrium, hydration, and cellular osmotic pressure.\n\n1. Serum Sodium (Na+):\n• Major extracellular cation maintaining plasma osmolality and extracellular volume.\n• Hyponatremia (< 136 mmol/L): SIADH, congestive heart failure, cirrhosis, nephrotic syndrome, diuretic therapy, vomiting, diarrhea, adrenal insufficiency.\n• Hypernatremia (> 146 mmol/L): Dehydration, diabetes insipidus, excessive salt intake, osmotic diuresis.\n\n2. Serum Potassium (K+):\n• Major intracellular cation critical for cardiac neuromuscular excitability and rhythm.\n• Hypokalemia (< 3.5 mmol/L): Diuretics, vomiting, diarrhea, hyperaldosteronism, alkalosis.\n• Hyperkalemia (> 5.1 mmol/L): Acute/chronic renal failure, potassium-sparing diuretics, ACE inhibitors/ARBs, Addison's disease, severe tissue trauma/rhabdomyolysis, metabolic acidosis.\n\n3. Serum Chloride (Cl-):\n• Major extracellular anion involved in maintaining acid-base balance and electroneutrality.\n• Alterations frequently parallel sodium abnormalities and acid-base disturbances (anion gap calculation).\n\n4. Serum Total & Ionized Calcium (Ca2+ / iCalcium):\n• Ionized Calcium (iCalcium) is the physiologically active, unbound fraction of serum calcium essential for cardiac contractility, neuromuscular transmission, enzyme activation, and blood coagulation.\n• Hypocalcemia / Low iCalcium: Hypoparathyroidism, vitamin D deficiency, renal failure, acute pancreatitis, critical illness/sepsis, alkalosis.\n• Hypercalcemia / Elevated iCalcium: Primary hyperparathyroidism, malignancies (osteolytic metastases, PTHrP production), granulomatous diseases (sarcoidosis, TB), hypervitaminosis D.",
    "parameters": [
      {
        "name": "Serum Sodium",
        "referenceRange": "136 - 146",
        "unit": "mmol/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Potassium",
        "referenceRange": "3.5 - 5.1",
        "unit": "mmol/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Chloride",
        "referenceRange": "98 - 107",
        "unit": "mmol/l",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Calcium",
        "referenceRange": "8.8 - 10.6",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "iCalcium",
        "referenceRange": "1.13 - 1.33",
        "unit": "mmol/l",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "ESR(Westergren)",
    "title": "Erythrocyte sedimentation rate (Westergren)",
    "basePrice": 100,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (Sodium Citrate / EDTA)",
    "turnaroundTime": "Same Day",
    "description": "Gold-standard measurement of Erythrocyte Sedimentation Rate by the International Council for Standardization in Haematology (ICSH) Westergren method for assessing acute phase response and systemic inflammation.",
    "notes": "Interpretation:\n\nRaised ESR can be found in:\n1. Connective tissue disorders (e.g., SLE, Rheumatoid Arthritis, Systemic Sclerosis)\n2. Infections (e.g., Tuberculosis, acute hepatitis, bacterial infections)\n3. Hematological disease (e.g., multiple myeloma, anemia of acute or chronic disease, alone or combined with iron deficiency anemia)\n4. Malignancy (e.g., lymphoma, breast or colon cancer)\n5. Pregnancy\n6. Oral contraceptive pill users\n7. Obesity can cause a moderately raised ESR\n\nLow ESR is found in:\n1. Heart failure\n2. Cachexia\n3. Polycythemia vera (PRV) or secondary conditions featuring abnormal blood cells (e.g., sickle cell anemia, hereditary spherocytosis, acanthocytosis)\n4. Microcytosis\n5. Hypofibrinogenemia (e.g., DIC)\n6. Massive hepatic necrosis\n7. High white cell count (extreme leukocytosis)\n8. Treatment with steroids\n\nNB: Very high (> 100 mm/1st hour) ESR is found in autoimmune disease, malignancy, acute post-trauma, and serious infection (e.g. TB, osteomyelitis, temporal arteritis). A false high ESR can occur if the ambient temperature is unusually high or if the sedimentation tube is not strictly vertical.",
    "interpretation": "Interpretation:\n\nRaised ESR can be found in:\n1. Connective tissue disorders (e.g., SLE, Rheumatoid Arthritis, Systemic Sclerosis)\n2. Infections (e.g., Tuberculosis, acute hepatitis, bacterial infections)\n3. Hematological disease (e.g., multiple myeloma, anemia of acute or chronic disease, alone or combined with iron deficiency anemia)\n4. Malignancy (e.g., lymphoma, breast or colon cancer)\n5. Pregnancy\n6. Oral contraceptive pill users\n7. Obesity can cause a moderately raised ESR\n\nLow ESR is found in:\n1. Heart failure\n2. Cachexia\n3. Polycythemia vera (PRV) or secondary conditions featuring abnormal blood cells (e.g., sickle cell anemia, hereditary spherocytosis, acanthocytosis)\n4. Microcytosis\n5. Hypofibrinogenemia (e.g., DIC)\n6. Massive hepatic necrosis\n7. High white cell count (extreme leukocytosis)\n8. Treatment with steroids\n\nNB: Very high (> 100 mm/1st hour) ESR is found in autoimmune disease, malignancy, acute post-trauma, and serious infection (e.g. TB, osteomyelitis, temporal arteritis). A false high ESR can occur if the ambient temperature is unusually high or if the sedimentation tube is not strictly vertical.",
    "parameters": [
      {
        "name": "Erythrocyte sedimentation rate (Westergren)",
        "referenceRange": "0 - 10",
        "unit": "mm for 1st hour",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Fluid Examination",
    "title": "Fluid Examination (Physical, Chemical & Microscopic)",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Body Fluid (Pleural / Ascitic / Synovial / Pericardial / CSF)",
    "turnaroundTime": "Same Day",
    "description": "Comprehensive physical, chemical, and microscopic examination of serous body fluids (Pleural, Ascitic, Peritoneal, Synovial, Pericardial) for transudate vs. exudate differentiation, infection, and cellularity.",
    "notes": "Clinical Significance & Interpretation:\nBody fluid examination (Ascitic, Pleural, Peritoneal, Pericardial, Synovial) is crucial for differentiating transudative effusions from exudative effusions.\n\n1. Transudate vs. Exudate Differentiation (Light's Criteria):\n• Transudative Fluid: Non-inflammatory effusion caused by hydrostatic pressure imbalance or decreased plasma oncotic pressure (e.g., Congestive Heart Failure, Cirrhosis, Nephrotic Syndrome, Malnutrition).\n  - Appearance: Clear, straw-colored, no coagulum.\n  - Protein: < 3.0 g/dl (< 3000 mg%), Fluid/Serum Protein ratio < 0.5.\n  - Glucose: Equivalent to serum glucose (> 60 mg%).\n  - Total Leukocyte Count (TLC): < 1,000 cells/cumm with predominantly mononuclear / lymphocytes.\n  - Specific Gravity: < 1.015.\n\n• Exudative Fluid: Inflammatory or malignant effusion caused by increased vascular permeability or impaired lymphatic drainage (e.g., Bacterial Pneumonia/Parapneumonic, Tuberculosis, Malignancy, Pulmonary Embolism, Pancreatitis).\n  - Appearance: Turbid, cloudy, hemorrhagic, or purulent; may form spontaneous fibrinous coagulum.\n  - Protein: ≥ 3.0 g/dl (≥ 3000 mg%), Fluid/Serum Protein ratio > 0.5.\n  - Glucose: Often decreased (< 60 mg%), especially in bacterial empyema, TB, or rheumatoid effusion.\n  - Total Leukocyte Count (TLC): ≥ 1,000 cells/cumm (often > 10,000 in acute bacterial infection).\n  - Differential: Neutrophil predominance (> 50%) indicates acute bacterial infection; Lymphocyte predominance (> 50%) suggests Tuberculosis, chronic inflammation, or malignancy.\n\n2. Diagnostic Notes:\n• Hemorrhagic fluid: May indicate malignancy, pulmonary infarction, trauma, or traumatic tap.\n• Presence of atypical cells requires cytopathological examination (cell block / Papanicolaou staining).",
    "interpretation": "Clinical Significance & Interpretation:\nBody fluid examination (Ascitic, Pleural, Peritoneal, Pericardial, Synovial) is crucial for differentiating transudative effusions from exudative effusions.\n\n1. Transudate vs. Exudate Differentiation (Light's Criteria):\n• Transudative Fluid: Non-inflammatory effusion caused by hydrostatic pressure imbalance or decreased plasma oncotic pressure (e.g., Congestive Heart Failure, Cirrhosis, Nephrotic Syndrome, Malnutrition).\n  - Appearance: Clear, straw-colored, no coagulum.\n  - Protein: < 3.0 g/dl (< 3000 mg%), Fluid/Serum Protein ratio < 0.5.\n  - Glucose: Equivalent to serum glucose (> 60 mg%).\n  - Total Leukocyte Count (TLC): < 1,000 cells/cumm with predominantly mononuclear / lymphocytes.\n  - Specific Gravity: < 1.015.\n\n• Exudative Fluid: Inflammatory or malignant effusion caused by increased vascular permeability or impaired lymphatic drainage (e.g., Bacterial Pneumonia/Parapneumonic, Tuberculosis, Malignancy, Pulmonary Embolism, Pancreatitis).\n  - Appearance: Turbid, cloudy, hemorrhagic, or purulent; may form spontaneous fibrinous coagulum.\n  - Protein: ≥ 3.0 g/dl (≥ 3000 mg%), Fluid/Serum Protein ratio > 0.5.\n  - Glucose: Often decreased (< 60 mg%), especially in bacterial empyema, TB, or rheumatoid effusion.\n  - Total Leukocyte Count (TLC): ≥ 1,000 cells/cumm (often > 10,000 in acute bacterial infection).\n  - Differential: Neutrophil predominance (> 50%) indicates acute bacterial infection; Lymphocyte predominance (> 50%) suggests Tuberculosis, chronic inflammation, or malignancy.\n\n2. Diagnostic Notes:\n• Hemorrhagic fluid: May indicate malignancy, pulmonary infarction, trauma, or traumatic tap.\n• Presence of atypical cells requires cytopathological examination (cell block / Papanicolaou staining).",
    "parameters": [
      {
        "name": "Sample Type",
        "referenceRange": "Pleural / Ascitic / Synovial / Pericardial / CSF",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Pleural Fluid",
            "isAbnormal": false
          },
          {
            "value": "Ascitic / Peritoneal Fluid",
            "isAbnormal": false
          },
          {
            "value": "Synovial Fluid",
            "isAbnormal": false
          },
          {
            "value": "Pericardial Fluid",
            "isAbnormal": false
          },
          {
            "value": "Cerebrospinal Fluid (CSF)",
            "isAbnormal": false
          },
          {
            "value": "Cystic Fluid",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "Coagulum",
        "referenceRange": "Absent",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Absent / No Clot Formed",
            "isAbnormal": false
          },
          {
            "value": "Present (Cobweb / Fibrinous Coagulum)",
            "isAbnormal": true
          },
          {
            "value": "Fine Coagulum",
            "isAbnormal": true
          },
          {
            "value": "Gross Clot Formed",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Volume",
        "referenceRange": "",
        "unit": "ml",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Appearance",
        "referenceRange": "Clear",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Clear / Transparent",
            "isAbnormal": false
          },
          {
            "value": "Slightly Hazy / Opalescent",
            "isAbnormal": true
          },
          {
            "value": "Turbid / Cloudy",
            "isAbnormal": true
          },
          {
            "value": "Purulent",
            "isAbnormal": true
          },
          {
            "value": "Hemorrhagic / Sanguinous",
            "isAbnormal": true
          },
          {
            "value": "Milky / Chylous",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Colour",
        "referenceRange": "Pale Yellow",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Pale Yellow / Straw",
            "isAbnormal": false
          },
          {
            "value": "Yellow",
            "isAbnormal": false
          },
          {
            "value": "Amber",
            "isAbnormal": false
          },
          {
            "value": "Reddish / Hemorrhagic",
            "isAbnormal": true
          },
          {
            "value": "Brownish / Dark",
            "isAbnormal": true
          },
          {
            "value": "Turbid White",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "pH (Reaction)",
        "referenceRange": "7.35 - 7.45",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Alkaline (7.35 - 7.45)",
            "isAbnormal": false
          },
          {
            "value": "Acidic (< 7.30)",
            "isAbnormal": true
          },
          {
            "value": "Neutral (7.0 - 7.3)",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "Protein",
        "referenceRange": "Transudate < 3000 mg% | Exudate >= 3000 mg%",
        "unit": "mg%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Glucose",
        "referenceRange": "60 - 100",
        "unit": "mg%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total Leukocyte Count",
        "referenceRange": "Transudate < 1000 cumm | Exudate >= 1000 cumm",
        "unit": "cumm",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Neutrophils",
        "referenceRange": "< 50",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Lymphocyte",
        "referenceRange": "> 50",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "RBCs",
        "referenceRange": "Nil / Occasional",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Nil / Absent",
            "isAbnormal": false
          },
          {
            "value": "Occasional (0 - 5 / HPF)",
            "isAbnormal": false
          },
          {
            "value": "Plenty / Numerous",
            "isAbnormal": true
          },
          {
            "value": "Heavily Hemorrhagic",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Others (Optional)",
        "referenceRange": "Nil",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "No atypical or malignant cells seen",
            "isAbnormal": false
          },
          {
            "value": "Mesothelial cells present",
            "isAbnormal": false
          },
          {
            "value": "Atypical / Malignant cells noted (Advise Cytology / Cell Block)",
            "isAbnormal": true
          },
          {
            "value": "Gram stain / AFB negative",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "FNAC",
    "title": "FNAC (Fine Needle Aspiration)",
    "basePrice": 850,
    "taxPercentage": 0,
    "sampleType": "Aspirate Smear (Fine Needle Aspiration Cytology)",
    "turnaroundTime": "24 - 48 Hours",
    "description": "Cytopathological evaluation of fine needle aspirates from palpable and non-palpable lesions (Thyroid, Breast, Lymph nodes, Salivary glands, Soft tissue) to diagnose benign, inflammatory, and malignant pathologies.",
    "notes": "FNAC Reporting Protocol & Cytological Guidelines:\n\n1. Specimen Adequacy Criteria:\n• Adequate / Satisfactory for evaluation: Presence of sufficient diagnostic cellular material with well-preserved cytomorphological details.\n• Unsatisfactory / Inadequate: Scanty cellularity, excessive blood/crush artifact, or drying artifacts precluding definitive cytological evaluation (repeat aspiration recommended).\n\n2. General Diagnostic Categorization:\n• Category I (Unsatisfactory / Non-diagnostic): Insufficient diagnostic cells.\n• Category II (Benign / Negative for Malignancy): Inflammatory, reactive, hyperplastic, or typical benign cytological features.\n• Category III (Atypia of Undetermined Significance / AUS): Cytological atypia insufficient to diagnose neoplasm or malignancy.\n• Category IV (Suspicious for Neoplasm / Follicular Neoplasm): Cellular features suggestive of neoplasm.\n• Category V (Suspicious for Malignancy): Marked cellular and nuclear atypia strongly suggestive of malignancy.\n• Category VI (Malignant / Positive for Malignancy): Definitive cytological criteria of carcinoma, lymphoma, melanoma, or sarcoma.\n\n3. Clinical & Histopathological Correlation:\nFNAC is a rapid and highly accurate screening/diagnostic cytological modality. Histopathological examination (core needle biopsy or surgical excision) is recommended for definitive histological typing, grading, surgical margin assessment, and immunohistochemistry (IHC) profiling.",
    "interpretation": "FNAC Reporting Protocol & Cytological Guidelines:\n\n1. Specimen Adequacy Criteria:\n• Adequate / Satisfactory for evaluation: Presence of sufficient diagnostic cellular material with well-preserved cytomorphological details.\n• Unsatisfactory / Inadequate: Scanty cellularity, excessive blood/crush artifact, or drying artifacts precluding definitive cytological evaluation (repeat aspiration recommended).\n\n2. General Diagnostic Categorization:\n• Category I (Unsatisfactory / Non-diagnostic): Insufficient diagnostic cells.\n• Category II (Benign / Negative for Malignancy): Inflammatory, reactive, hyperplastic, or typical benign cytological features.\n• Category III (Atypia of Undetermined Significance / AUS): Cytological atypia insufficient to diagnose neoplasm or malignancy.\n• Category IV (Suspicious for Neoplasm / Follicular Neoplasm): Cellular features suggestive of neoplasm.\n• Category V (Suspicious for Malignancy): Marked cellular and nuclear atypia strongly suggestive of malignancy.\n• Category VI (Malignant / Positive for Malignancy): Definitive cytological criteria of carcinoma, lymphoma, melanoma, or sarcoma.\n\n3. Clinical & Histopathological Correlation:\nFNAC is a rapid and highly accurate screening/diagnostic cytological modality. Histopathological examination (core needle biopsy or surgical excision) is recommended for definitive histological typing, grading, surgical margin assessment, and immunohistochemistry (IHC) profiling.",
    "parameters": [
      {
        "name": "SPECIMEN",
        "referenceRange": "As indicated",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "FNAC - Thyroid Gland",
            "isAbnormal": false
          },
          {
            "value": "FNAC - Breast Lump / Mass",
            "isAbnormal": false
          },
          {
            "value": "FNAC - Lymph Node (Cervical / Axillary / Inguinal)",
            "isAbnormal": false
          },
          {
            "value": "FNAC - Salivary Gland (Parotid / Submandibular)",
            "isAbnormal": false
          },
          {
            "value": "FNAC - Soft Tissue Swelling / Subcutaneous Nodule",
            "isAbnormal": false
          },
          {
            "value": "FNAC - Testicular / Epididymal Swelling",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "MICROSCOPIC EXAMINATION",
        "referenceRange": "Descriptive cytomorphological evaluation",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "IMPRESSION",
        "referenceRange": "Cytological Impression",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Category II: Negative for Malignant Cells (Benign Cytology)",
            "isAbnormal": false
          },
          {
            "value": "Category I: Unsatisfactory / Inadequate Smear (Scanty Cellularity)",
            "isAbnormal": true
          },
          {
            "value": "Category III: Atypia of Undetermined Significance (AUS)",
            "isAbnormal": true
          },
          {
            "value": "Category IV: Follicular Neoplasm / Suspicious for Neoplasm",
            "isAbnormal": true
          },
          {
            "value": "Category V: Suspicious for Malignancy",
            "isAbnormal": true
          },
          {
            "value": "Category VI: Malignant (Positive for Malignancy)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "NOTE",
        "referenceRange": "Histopathological correlation advised",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Histopathological examination & tissue biopsy is advised for definitive histological grading and staging.",
            "isAbnormal": false
          },
          {
            "value": "Repeat aspiration under ultrasound guidance or core needle biopsy recommended if clinical suspicion persists.",
            "isAbnormal": false
          },
          {
            "value": "Clinical and radiological (USG/Mammography/CT) correlation recommended.",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Direct Coombs Test",
    "title": "Direct Coomb's Test (DAT - Direct Antiglobulin Test)",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA / Heparin / Clotted Cord Blood)",
    "turnaroundTime": "Same Day",
    "description": "Hemagglutination assay (Direct Antiglobulin Test / DAT) to detect in vivo sensitization of erythrocytes with antibodies (IgG) and/or complement components (C3d).",
    "notes": "Clinical Significance & Interpretation:\nThe Direct Antiglobulin Test (DAT / Direct Coombs Test) detects in vivo coating of red blood cells with immunoglobulins (IgG) and/or complement components (C3d).\n\n1. Negative Result:\n• Indicates the absence of detectable cell-bound IgG antibodies or complement on the patient's red blood cells.\n\n2. Positive Result (Graded 1+ to 4+):\nA positive DAT indicates in vivo sensitization of erythrocytes and is observed in:\n• Autoimmune Hemolytic Anemia (AIHA):\n  - Warm Antibody AIHA (predominantly IgG ± C3d, often idiopathic, SLE, CLL, lymphoma)\n  - Cold Agglutinin Disease / Cold AIHA (predominantly C3d, Mycoplasma pneumoniae, EBV, lymphoproliferative disorders)\n  - Paroxysmal Cold Hemoglobinuria (PCH / Donath-Landsteiner antibody)\n• Hemolytic Disease of the Fetus and Newborn (HDFN):\n  - Maternal IgG antibodies (Anti-D, Anti-c, Anti-Kell, ABO incompatibility) crossing placenta and coating fetal RBCs.\n• Immune-Mediated Hemolytic Transfusion Reactions (Acute or Delayed):\n  - Recipient antibodies coating transfused incompatible donor RBCs.\n• Drug-Induced Immune Hemolytic Anemia (DIIHA):\n  - Drugs such as Cephalosporins (Ceftriaxone), Penicillins, Methyldopa, Quinidine, NSAIDs acting via drug-adsorption, immune complex, or autoantibody mechanisms.\n\nDiagnostic Notes:\n1. A positive DAT must always be interpreted in conjunction with clinical findings, reticulocyte count, serum LDH, indirect bilirubin, and serum haptoglobin levels.\n2. In cases of a positive polyspecific DAT, monospecific anti-IgG and anti-C3d testing with eluate evaluation is recommended.",
    "interpretation": "Clinical Significance & Interpretation:\nThe Direct Antiglobulin Test (DAT / Direct Coombs Test) detects in vivo coating of red blood cells with immunoglobulins (IgG) and/or complement components (C3d).\n\n1. Negative Result:\n• Indicates the absence of detectable cell-bound IgG antibodies or complement on the patient's red blood cells.\n\n2. Positive Result (Graded 1+ to 4+):\nA positive DAT indicates in vivo sensitization of erythrocytes and is observed in:\n• Autoimmune Hemolytic Anemia (AIHA):\n  - Warm Antibody AIHA (predominantly IgG ± C3d, often idiopathic, SLE, CLL, lymphoma)\n  - Cold Agglutinin Disease / Cold AIHA (predominantly C3d, Mycoplasma pneumoniae, EBV, lymphoproliferative disorders)\n  - Paroxysmal Cold Hemoglobinuria (PCH / Donath-Landsteiner antibody)\n• Hemolytic Disease of the Fetus and Newborn (HDFN):\n  - Maternal IgG antibodies (Anti-D, Anti-c, Anti-Kell, ABO incompatibility) crossing placenta and coating fetal RBCs.\n• Immune-Mediated Hemolytic Transfusion Reactions (Acute or Delayed):\n  - Recipient antibodies coating transfused incompatible donor RBCs.\n• Drug-Induced Immune Hemolytic Anemia (DIIHA):\n  - Drugs such as Cephalosporins (Ceftriaxone), Penicillins, Methyldopa, Quinidine, NSAIDs acting via drug-adsorption, immune complex, or autoantibody mechanisms.\n\nDiagnostic Notes:\n1. A positive DAT must always be interpreted in conjunction with clinical findings, reticulocyte count, serum LDH, indirect bilirubin, and serum haptoglobin levels.\n2. In cases of a positive polyspecific DAT, monospecific anti-IgG and anti-C3d testing with eluate evaluation is recommended.",
    "parameters": [
      {
        "name": "Direct Coomb's Test",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [
          {
            "value": "Negative (No Agglutination)",
            "isAbnormal": false
          },
          {
            "value": "Positive 1+ (Weak Agglutination)",
            "isAbnormal": true
          },
          {
            "value": "Positive 2+ (Moderate Agglutination)",
            "isAbnormal": true
          },
          {
            "value": "Positive 3+ (Strong Agglutination)",
            "isAbnormal": true
          },
          {
            "value": "Positive 4+ (Solid Agglutination Clump)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "DLC 3 Parts",
    "title": "Differential Leucocyte Count, 3-Part (DLC 3 Parts)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "Same Day",
    "description": "Automated 3-part differential leukocyte count measuring absolute numbers and relative percentages of Granulocytes, Lymphocytes, and Mid-sized cells (Monocytes, Eosinophils, Basophils).",
    "notes": "Clinical Significance of 3-Part Differential:\nAutomated 3-part hematology analyzers classify circulating leukocytes into three distinct volumetric cell clusters:\n\n1. Granulocytes (Gran # / Gran %):\n• Primarily comprises segmented neutrophils, band forms, eosinophils, and basophils.\n• Granulocytosis (Elevated Gran # / Gran %): Acute bacterial infections, systemic inflammation, tissue necrosis, metabolic intoxications (uremia, DKA), acute hemorrhage, corticosteroid therapy, myeloproliferative disorders.\n• Granulocytopenia (Decreased Gran # / Gran %): Bone marrow suppression (chemotherapy, radiation), severe overwhelming sepsis, aplastic anemia, drug-induced agranulocytosis.\n\n2. Lymphocytes (Lym # / Lym %):\n• Represents circulating T-cells, B-cells, and natural killer (NK) cells.\n• Lymphocytosis (Elevated Lym # / Lym %): Acute viral infections (infectious mononucleosis, CMV, viral hepatitis), pertussis, chronic lymphocytic leukemia (CLL), autoimmune conditions.\n• Lymphopenia (Decreased Lym # / Lym %): Acute stress, advanced HIV/AIDS, immunosuppressive therapy, systemic lupus erythematosus (SLE), radiation exposure.\n\n3. Mid-Sized Cells (Mid # / Mid % - Monocytes, Eosinophils & Basophils):\n• Encompasses monocytes, eosinophils, basophils, and precursor cells of intermediate size.\n• Elevated Mid-Cell Fraction: Chronic inflammatory conditions, tuberculosis, allergic reactions/asthma, parasitic infestations, convalescent stage of acute infections, myelomonocytic neoplasms (CMML).",
    "interpretation": "Clinical Significance of 3-Part Differential:\nAutomated 3-part hematology analyzers classify circulating leukocytes into three distinct volumetric cell clusters:\n\n1. Granulocytes (Gran # / Gran %):\n• Primarily comprises segmented neutrophils, band forms, eosinophils, and basophils.\n• Granulocytosis (Elevated Gran # / Gran %): Acute bacterial infections, systemic inflammation, tissue necrosis, metabolic intoxications (uremia, DKA), acute hemorrhage, corticosteroid therapy, myeloproliferative disorders.\n• Granulocytopenia (Decreased Gran # / Gran %): Bone marrow suppression (chemotherapy, radiation), severe overwhelming sepsis, aplastic anemia, drug-induced agranulocytosis.\n\n2. Lymphocytes (Lym # / Lym %):\n• Represents circulating T-cells, B-cells, and natural killer (NK) cells.\n• Lymphocytosis (Elevated Lym # / Lym %): Acute viral infections (infectious mononucleosis, CMV, viral hepatitis), pertussis, chronic lymphocytic leukemia (CLL), autoimmune conditions.\n• Lymphopenia (Decreased Lym # / Lym %): Acute stress, advanced HIV/AIDS, immunosuppressive therapy, systemic lupus erythematosus (SLE), radiation exposure.\n\n3. Mid-Sized Cells (Mid # / Mid % - Monocytes, Eosinophils & Basophils):\n• Encompasses monocytes, eosinophils, basophils, and precursor cells of intermediate size.\n• Elevated Mid-Cell Fraction: Chronic inflammatory conditions, tuberculosis, allergic reactions/asthma, parasitic infestations, convalescent stage of acute infections, myelomonocytic neoplasms (CMML).",
    "parameters": [
      {
        "name": "Gran #",
        "referenceRange": "2 - 7",
        "unit": "x10^3/µL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Lym #",
        "referenceRange": "1 - 3",
        "unit": "x10^3/µL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mid #",
        "referenceRange": "0.2 - 1.2",
        "unit": "x10^3/µL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Gran %",
        "referenceRange": "40 - 75",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Lym %",
        "referenceRange": "20 - 40",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mid %",
        "referenceRange": "2 - 10",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Double Marker, Maternal Screen - 2 tests",
    "title": "Double Marker, Maternal Screen - 2 tests",
    "basePrice": 2200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "24 - 48 Hours",
    "description": "First trimester maternal serum biochemical screening assay measuring Pregnancy-Associated Plasma Protein-A (PAPP-A) and Free Beta hCG to assess fetal risk for Trisomies 21 (Down syndrome), 18 (Edwards syndrome), and 13 (Patau syndrome).",
    "notes": "Clinical Significance & Interpretation (First Trimester Maternal Screen / Double Marker):\nThe Double Marker Test is a prenatal screening tool performed between 11 weeks 0 days and 13 weeks 6 days of gestation (Crown-Rump Length CRL 45 to 84 mm) to assess the statistical risk of fetal chromosomal aneuploidies:\n• Trisomy 21 (Down Syndrome)\n• Trisomy 18 (Edwards Syndrome)\n• Trisomy 13 (Patau Syndrome)\n\n1. Biochemical Markers Measured:\n• Pregnancy-Associated Plasma Protein-A (PAPP-A): A large zinc metalloproteinase produced by the syncytiotrophoblast.\n• Free Beta human Chorionic Gonadotropin (Free β-hCG): The beta subunit of human chorionic gonadotropin secreted by the placenta.\n\n2. Typical Risk Pattern in Fetal Aneuploidies:\n• Down Syndrome (Trisomy 21): Significantly elevated Free β-hCG (median ~2.0 MoM) and decreased PAPP-A (median ~0.4 MoM).\n• Edwards Syndrome (Trisomy 18) & Patau Syndrome (Trisomy 13): Markedly decreased Free β-hCG (< 0.5 MoM) and markedly decreased PAPP-A (< 0.3 MoM).\n\n3. Multiple of Median (MoM) & Risk Calculation:\nRaw analyte concentrations are converted into gestational age-adjusted Multiples of the Median (MoM), corrected for maternal weight, ethnicity, smoking status, IVF, and diabetes. Combined risk assessment incorporates maternal age, Ultrasound Nuchal Translucency (NT), and nasal bone visualization.\n\n4. Important Clinical Notes:\n• Screening Test Only: A \"Screen Negative / Low Risk\" result reduces but does not eliminate the risk of aneuploidy. A \"Screen Positive / High Risk\" (cutoff typically ≥ 1:250) indicates an increased statistical probability and warrants genetic counseling, cell-free DNA (NIPT), or definitive invasive diagnostic testing (Chorionic Villus Sampling CVS or Amniocentesis).\n• Isolated Low PAPP-A (< 0.4 MoM) with normal chromosomes is an independent predictive marker for adverse pregnancy outcomes including pre-eclampsia, fetal growth restriction (FGR/IUGR), and preterm delivery.",
    "interpretation": "Clinical Significance & Interpretation (First Trimester Maternal Screen / Double Marker):\nThe Double Marker Test is a prenatal screening tool performed between 11 weeks 0 days and 13 weeks 6 days of gestation (Crown-Rump Length CRL 45 to 84 mm) to assess the statistical risk of fetal chromosomal aneuploidies:\n• Trisomy 21 (Down Syndrome)\n• Trisomy 18 (Edwards Syndrome)\n• Trisomy 13 (Patau Syndrome)\n\n1. Biochemical Markers Measured:\n• Pregnancy-Associated Plasma Protein-A (PAPP-A): A large zinc metalloproteinase produced by the syncytiotrophoblast.\n• Free Beta human Chorionic Gonadotropin (Free β-hCG): The beta subunit of human chorionic gonadotropin secreted by the placenta.\n\n2. Typical Risk Pattern in Fetal Aneuploidies:\n• Down Syndrome (Trisomy 21): Significantly elevated Free β-hCG (median ~2.0 MoM) and decreased PAPP-A (median ~0.4 MoM).\n• Edwards Syndrome (Trisomy 18) & Patau Syndrome (Trisomy 13): Markedly decreased Free β-hCG (< 0.5 MoM) and markedly decreased PAPP-A (< 0.3 MoM).\n\n3. Multiple of Median (MoM) & Risk Calculation:\nRaw analyte concentrations are converted into gestational age-adjusted Multiples of the Median (MoM), corrected for maternal weight, ethnicity, smoking status, IVF, and diabetes. Combined risk assessment incorporates maternal age, Ultrasound Nuchal Translucency (NT), and nasal bone visualization.\n\n4. Important Clinical Notes:\n• Screening Test Only: A \"Screen Negative / Low Risk\" result reduces but does not eliminate the risk of aneuploidy. A \"Screen Positive / High Risk\" (cutoff typically ≥ 1:250) indicates an increased statistical probability and warrants genetic counseling, cell-free DNA (NIPT), or definitive invasive diagnostic testing (Chorionic Villus Sampling CVS or Amniocentesis).\n• Isolated Low PAPP-A (< 0.4 MoM) with normal chromosomes is an independent predictive marker for adverse pregnancy outcomes including pre-eclampsia, fetal growth restriction (FGR/IUGR), and preterm delivery.",
    "parameters": [
      {
        "name": "PAPPA Level",
        "referenceRange": "0.5 - 2.5 MoM (11 - 13+6 Weeks)",
        "unit": "ng/mL",
        "gender": "Female",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "HCG Level",
        "referenceRange": "0.5 - 2.5 MoM (11 - 13+6 Weeks)",
        "unit": "mIU/mL",
        "gender": "Female",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Fasting Blood Sugar",
    "title": "Fasting Blood Sugar",
    "basePrice": 80,
    "taxPercentage": 0,
    "sampleType": "Plasma (Fluoride) / Serum (Fasting 8-12 hrs)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative determination of plasma glucose concentration after an overnight fast (8-12 hours) to diagnose and monitor diabetes mellitus and impaired fasting glucose.",
    "notes": "Clinical Notes\nElevated glucose levels (hyperglycemia) are most often encountered clinically in the setting of diabetes mellitus, but they may also occur with pancreatic neoplasms, hyperthyroidism, and adrenocortical dysfunction. Decreased glucose levels (hypoglycemia) may result from endogenous or exogenous insulin excess, prolonged starvation, or liver disease.\n\nFasting Glucose (mg/dL) | 2 hours PP Glucose (mg/dL) | Diagnosis\n• < 100                 | < 140                      | Normal\n• 100 to 125            | 140 to 199                 | Pre-Diabetes\n• > 126                 | > 200                      | Diabetes\n\nA level of 126 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.\nIGT (2 hrs Post meal), means a person has an increased risk of developing type 2 diabetes but does not have it yet.\nA 2-hour glucose level of 200 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.",
    "interpretation": "Clinical Notes\nElevated glucose levels (hyperglycemia) are most often encountered clinically in the setting of diabetes mellitus, but they may also occur with pancreatic neoplasms, hyperthyroidism, and adrenocortical dysfunction. Decreased glucose levels (hypoglycemia) may result from endogenous or exogenous insulin excess, prolonged starvation, or liver disease.\n\nFasting Glucose (mg/dL) | 2 hours PP Glucose (mg/dL) | Diagnosis\n• < 100                 | < 140                      | Normal\n• 100 to 125            | 140 to 199                 | Pre-Diabetes\n• > 126                 | > 200                      | Diabetes\n\nA level of 126 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.\nIGT (2 hrs Post meal), means a person has an increased risk of developing type 2 diabetes but does not have it yet.\nA 2-hour glucose level of 200 mg/dL or above, confirmed by repeating the test on another day, means a person has diabetes.",
    "parameters": [
      {
        "name": "Fasting Blood Sugar",
        "referenceRange": "70 - 100",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Fasting Insulin",
    "title": "Fasting Insulin (Serum Insulin, Fasting)",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Fasting 8-12 hrs)",
    "turnaroundTime": "Same Day",
    "description": "Chemiluminescence Immunoassay (CLIA) for quantitative measurement of fasting serum insulin to evaluate insulin resistance, metabolic syndrome, beta-cell secretory capacity, and hyperinsulinemic hypoglycemia.",
    "notes": "Clinical Significance & Interpretation (Fasting Insulin):\nInsulin is a peptide hormone synthesized and secreted by the beta cells of pancreatic islets of Langerhans. It regulates glucose homeostasis by promoting peripheral glucose uptake into muscle and adipose tissue and suppressing hepatic gluconeogenesis.\n\n1. Reference Interval (Fasting):\n• Normal Fasting Insulin: 2.0 - 25.0 µIU/mL (Optimal metabolic fasting insulin is typically < 10.0 µIU/mL).\n\n2. Elevated Fasting Insulin (Hyperinsulinemia):\n• Insulin Resistance Syndrome & Metabolic Syndrome\n• Type 2 Diabetes Mellitus (early/compensatory hyperinsulinemic phase)\n• Polycystic Ovarian Syndrome (PCOS)\n• Insulinoma (pancreatic islet beta-cell tumor)\n• Obesity and excessive visceral adiposity\n• Cushing's Syndrome & Acromegaly\n• Exogenous insulin administration / Sulfonylurea use\n\n3. Decreased Fasting Insulin (Hypoinsulinemia):\n• Type 1 Diabetes Mellitus (absolute autoimmune beta-cell deficiency)\n• Late-stage / End-stage Type 2 Diabetes (beta-cell exhaustion)\n• Pancreatectomy, severe chronic pancreatitis, or cystic fibrosis\n• Hypopituitarism\n\n4. Assessment of Insulin Resistance (HOMA-IR):\nFasting insulin paired with fasting blood sugar enables the calculation of Homeostatic Model Assessment for Insulin Resistance:\n• HOMA-IR = [Fasting Glucose (mg/dL) × Fasting Insulin (µIU/mL)] / 405\n• HOMA-IR < 2.0: Normal Insulin Sensitivity\n• HOMA-IR ≥ 2.5: Significant Insulin Resistance",
    "interpretation": "Clinical Significance & Interpretation (Fasting Insulin):\nInsulin is a peptide hormone synthesized and secreted by the beta cells of pancreatic islets of Langerhans. It regulates glucose homeostasis by promoting peripheral glucose uptake into muscle and adipose tissue and suppressing hepatic gluconeogenesis.\n\n1. Reference Interval (Fasting):\n• Normal Fasting Insulin: 2.0 - 25.0 µIU/mL (Optimal metabolic fasting insulin is typically < 10.0 µIU/mL).\n\n2. Elevated Fasting Insulin (Hyperinsulinemia):\n• Insulin Resistance Syndrome & Metabolic Syndrome\n• Type 2 Diabetes Mellitus (early/compensatory hyperinsulinemic phase)\n• Polycystic Ovarian Syndrome (PCOS)\n• Insulinoma (pancreatic islet beta-cell tumor)\n• Obesity and excessive visceral adiposity\n• Cushing's Syndrome & Acromegaly\n• Exogenous insulin administration / Sulfonylurea use\n\n3. Decreased Fasting Insulin (Hypoinsulinemia):\n• Type 1 Diabetes Mellitus (absolute autoimmune beta-cell deficiency)\n• Late-stage / End-stage Type 2 Diabetes (beta-cell exhaustion)\n• Pancreatectomy, severe chronic pancreatitis, or cystic fibrosis\n• Hypopituitarism\n\n4. Assessment of Insulin Resistance (HOMA-IR):\nFasting insulin paired with fasting blood sugar enables the calculation of Homeostatic Model Assessment for Insulin Resistance:\n• HOMA-IR = [Fasting Glucose (mg/dL) × Fasting Insulin (µIU/mL)] / 405\n• HOMA-IR < 2.0: Normal Insulin Sensitivity\n• HOMA-IR ≥ 2.5: Significant Insulin Resistance",
    "parameters": [
      {
        "name": "Fasting Insulin",
        "referenceRange": "2 - 25",
        "unit": "µIU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "TORCH Profile",
    "title": "TORCH Profile (Toxoplasma, Rubella, CMV, HSV-1/2)",
    "basePrice": 2000,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "24 - 48 Hours",
    "description": "Comprehensive Chemiluminescence / ELISA immunoassay panel for detecting IgG and IgM antibodies against Toxoplasma gondii, Rubella virus, Cytomegalovirus (CMV), and Herpes Simplex Viruses (HSV 1 & 2) in maternal antenatal screening.",
    "notes": "Clinical Significance & Interpretation (TORCH Panel / Profile):\nThe TORCH profile is a serological panel designed to detect antibodies against Toxoplasma gondii, Rubella virus, Cytomegalovirus (CMV), and Herpes Simplex Virus (HSV-1 and HSV-2), primarily used during preconception and antenatal screening to prevent congenital infections.\n\n1. Serological Pattern Interpretation:\n• IgG Negative (-) & IgM Negative (-): No evidence of past exposure or current infection; Patient is susceptible to primary infection. Preventive counseling and hygiene advised.\n• IgG Positive (+) & IgM Negative (-): Indicates past infection and acquired immunity (protective against primary maternal infection for Rubella and Toxoplasma). Low fetal risk.\n• IgG Negative (-) & IgM Positive (+): Suggestive of acute primary / early infection or false positive IgM. Advise repeat testing in 2-3 weeks for IgG seroconversion. High risk of vertical transmission.\n• IgG Positive (+) & IgM Positive (+): Possible acute recent infection, persistent IgM, or secondary reactivation. IgG avidity testing is recommended to differentiate recent primary infection (< 3-4 months) from remote infection (> 4 months).\n\n2. Pathogen Specific Notes:\n• Toxoplasma gondii: Primary infection in pregnancy carries risk of congenital toxoplasmosis (hydrocephalus, intracranial calcifications, chorioretinitis).\n• Rubella Virus: Acute primary infection during first trimester causes Congenital Rubella Syndrome (CRS - cataract, cardiac defects, sensorineural deafness).\n• Cytomegalovirus (CMV): Most common congenital viral infection causing sensorineural hearing loss, microcephaly, and developmental delay.\n• Herpes Simplex Virus (HSV 1/2): High risk of neonatal transmission during vaginal delivery if active maternal genital lesions or primary infection are present near term.",
    "interpretation": "Clinical Significance & Interpretation (TORCH Panel / Profile):\nThe TORCH profile is a serological panel designed to detect antibodies against Toxoplasma gondii, Rubella virus, Cytomegalovirus (CMV), and Herpes Simplex Virus (HSV-1 and HSV-2), primarily used during preconception and antenatal screening to prevent congenital infections.\n\n1. Serological Pattern Interpretation:\n• IgG Negative (-) & IgM Negative (-): No evidence of past exposure or current infection; Patient is susceptible to primary infection. Preventive counseling and hygiene advised.\n• IgG Positive (+) & IgM Negative (-): Indicates past infection and acquired immunity (protective against primary maternal infection for Rubella and Toxoplasma). Low fetal risk.\n• IgG Negative (-) & IgM Positive (+): Suggestive of acute primary / early infection or false positive IgM. Advise repeat testing in 2-3 weeks for IgG seroconversion. High risk of vertical transmission.\n• IgG Positive (+) & IgM Positive (+): Possible acute recent infection, persistent IgM, or secondary reactivation. IgG avidity testing is recommended to differentiate recent primary infection (< 3-4 months) from remote infection (> 4 months).\n\n2. Pathogen Specific Notes:\n• Toxoplasma gondii: Primary infection in pregnancy carries risk of congenital toxoplasmosis (hydrocephalus, intracranial calcifications, chorioretinitis).\n• Rubella Virus: Acute primary infection during first trimester causes Congenital Rubella Syndrome (CRS - cataract, cardiac defects, sensorineural deafness).\n• Cytomegalovirus (CMV): Most common congenital viral infection causing sensorineural hearing loss, microcephaly, and developmental delay.\n• Herpes Simplex Virus (HSV 1/2): High risk of neonatal transmission during vaginal delivery if active maternal genital lesions or primary infection are present near term.",
    "parameters": [
      {
        "name": "Toxo IgG",
        "referenceRange": "< 2 IU/mL",
        "unit": "IU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Toxo IgM",
        "referenceRange": "Neg. < 2 AU/mL | Grey Zone 2 - 2.6 AU/mL | Pos. > 2.6 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Rubella IgG",
        "referenceRange": "< 2 IU/mL",
        "unit": "IU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Rubella IgM",
        "referenceRange": "Neg. < 2 AU/mL | Grey Zone 2 - 3 AU/mL | Pos. > 3 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "CMV IgG",
        "referenceRange": "< 2 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "CMV IgM",
        "referenceRange": "Neg. < 2.0 AU/mL | Grey Zone 2 - 4.2 AU/mL | Pos. > 4.2 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "HSV-1/2 IgG",
        "referenceRange": "< 2.0 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "HSV-1/2 IgM",
        "referenceRange": "Neg. < 2 AU/mL | Grey Zone 2 - 4 AU/mL | Pos. >= 4 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "HSV-2 IgG",
        "referenceRange": "< 2.0 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "HSV-2 IgM",
        "referenceRange": "Neg. < 2.0 AU/mL | Grey Zone 2 - 4.0 AU/mL | Pos. >= 4.0 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "TLC",
    "title": "Total Leukocyte Count (TLC)",
    "basePrice": 100,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "Same Day",
    "description": "Automated quantitative enumeration of total circulating white blood cells (WBC / Leukocytes) in peripheral whole blood to screen for infection, inflammation, bone marrow disorders, and leukemia.",
    "notes": "Physiological basis\nThe WBC count and differential determine the total number of white blood cells as well as the percentage and absolute number of each type of white cell in a blood sample. It is typically generated by an automated laboratory hematology analyzer as part of the CBC panel.\n\nInterpretation\nIncreased in: Acute infections, inflammatory disorders, acute and chronic leukemias, myeloproliferative disorders, solid tumor (paraneoplastic reaction), circulating lymphoma, tissue injury/necrosis, G-CSF stimulation, various drugs, corticosteroids, allergies, hypersensitivity reactions, stress, smoking.\n\nDecreased in: Infections, constitutional and acquired myeloid hypoplasia, myelosuppression (eg, chemotherapy, radiation, various drugs), myelodysplasia, collagen vascular diseases, hypersplenism, cyclic neutropenia, autoimmune neutropenia, alcoholism.\n\nComments\nThere are five types of white cells, each with different functions: neutrophils, lymphocytes, monocytes, eosinophils, and basophils. Absolute counts for individual cell populations can be calculated from a combination of the WBC count and the percentage of each cell type from the differential.",
    "interpretation": "Physiological basis\nThe WBC count and differential determine the total number of white blood cells as well as the percentage and absolute number of each type of white cell in a blood sample. It is typically generated by an automated laboratory hematology analyzer as part of the CBC panel.\n\nInterpretation\nIncreased in: Acute infections, inflammatory disorders, acute and chronic leukemias, myeloproliferative disorders, solid tumor (paraneoplastic reaction), circulating lymphoma, tissue injury/necrosis, G-CSF stimulation, various drugs, corticosteroids, allergies, hypersensitivity reactions, stress, smoking.\n\nDecreased in: Infections, constitutional and acquired myeloid hypoplasia, myelosuppression (eg, chemotherapy, radiation, various drugs), myelodysplasia, collagen vascular diseases, hypersplenism, cyclic neutropenia, autoimmune neutropenia, alcoholism.\n\nComments\nThere are five types of white cells, each with different functions: neutrophils, lymphocytes, monocytes, eosinophils, and basophils. Absolute counts for individual cell populations can be calculated from a combination of the WBC count and the percentage of each cell type from the differential.",
    "parameters": [
      {
        "name": "Total Leukocyte Count",
        "referenceRange": "4,800 - 10,800",
        "unit": "cumm",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "TG / HDL",
    "title": "TG / HDL (Triglycerides / HDL Cholesterol Ratio)",
    "basePrice": 100,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma (Fasting 10-12 hrs)",
    "turnaroundTime": "Same Day",
    "description": "Calculated ratio of serum triglycerides to high-density lipoprotein cholesterol (TG/HDL-C), serving as a powerful surrogate marker for insulin resistance, atherogenic small dense LDL particles, and cardiometabolic risk.",
    "notes": "Clinical Significance & Interpretation (TG / HDL Ratio):\nThe Triglycerides to HDL-Cholesterol ratio (TG/HDL-C) is a powerful, non-invasive surrogate biomarker of insulin resistance, cardiometabolic risk, and the presence of atherogenic small dense low-density lipoprotein (sdLDL) particles.\n\n1. Reference Interval & Risk Stratification:\n• < 2.0 (Ideal / Low Risk): Indicates optimal insulin sensitivity, low atherogenic particle burden, and minimal cardiometabolic risk.\n• 2.0 - 4.0 (Borderline / Moderate Risk): Indicates emerging insulin resistance, early atherogenic dyslipidemia, and moderate cardiovascular risk.\n• > 4.0 (High Risk): Strongly associated with significant insulin resistance, metabolic syndrome, non-alcoholic fatty liver disease (NAFLD/MASLD), and elevated risk for coronary artery disease (CAD).\n\n2. Pathophysiological Insights:\n• sdLDL Proxy: A high TG/HDL ratio closely mirrors high circulating levels of small, dense, easily oxidized LDL particles even when standard LDL-C levels appear normal.\n• Insulin Resistance & Metabolic Health: TG/HDL ratio > 3.0 in males or > 2.5 in females correlates strongly with hyperinsulinemia and visceral adiposity.\n• Lifestyle & Therapeutic Interventions: Dietary carbohydrate restriction, weight optimization, regular aerobic and resistance exercise, and omega-3 fatty acid supplementation effectively reduce the TG/HDL ratio.",
    "interpretation": "Clinical Significance & Interpretation (TG / HDL Ratio):\nThe Triglycerides to HDL-Cholesterol ratio (TG/HDL-C) is a powerful, non-invasive surrogate biomarker of insulin resistance, cardiometabolic risk, and the presence of atherogenic small dense low-density lipoprotein (sdLDL) particles.\n\n1. Reference Interval & Risk Stratification:\n• < 2.0 (Ideal / Low Risk): Indicates optimal insulin sensitivity, low atherogenic particle burden, and minimal cardiometabolic risk.\n• 2.0 - 4.0 (Borderline / Moderate Risk): Indicates emerging insulin resistance, early atherogenic dyslipidemia, and moderate cardiovascular risk.\n• > 4.0 (High Risk): Strongly associated with significant insulin resistance, metabolic syndrome, non-alcoholic fatty liver disease (NAFLD/MASLD), and elevated risk for coronary artery disease (CAD).\n\n2. Pathophysiological Insights:\n• sdLDL Proxy: A high TG/HDL ratio closely mirrors high circulating levels of small, dense, easily oxidized LDL particles even when standard LDL-C levels appear normal.\n• Insulin Resistance & Metabolic Health: TG/HDL ratio > 3.0 in males or > 2.5 in females correlates strongly with hyperinsulinemia and visceral adiposity.\n• Lifestyle & Therapeutic Interventions: Dietary carbohydrate restriction, weight optimization, regular aerobic and resistance exercise, and omega-3 fatty acid supplementation effectively reduce the TG/HDL ratio.",
    "parameters": [
      {
        "name": "TG / HDL",
        "referenceRange": "< 2.0 (Desirable) | 2.0 - 4.0 (Borderline) | > 4.0 (High Risk)",
        "unit": "Ratio",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Testosterone Total",
    "title": "Testosterone Total",
    "basePrice": 550,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Morning 7-10 AM preferred)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative measurement of total serum testosterone (bound and free fractions) via Chemiluminescence Immunoassay (CLIA) to assess gonadal function, hypogonadism, hirsutism, and endocrine disorders.",
    "notes": "Physiological basis\nTestosterone is the principal male sex hormone, produced by the Leydig cells of the testes. Dehydroepiandrosterone (DHEA) is produced in the adrenal cortex, testes, and ovaries and is the main precursor for serum testosterone in women. In normal males after puberty, the testosterone level is twice as high as all androgens in females. In serum, it is largely bound to albumin (38%) and to a specific steroid hormone-binding globulin (SHBG) (60%), but it is the free hormone (2%) that is physiologically active. The total testosterone level measures both bound and free testosterone in the serum (by immunoassay). Free or bioavailable testosterone may be calculated or measured.\n\nInterpretation\nIncreased in: Idiopathic sexual precocity (in boys, levels may be in adult range), adrenal hyperplasia (boys), adrenocortical tumors, trophoblastic disease during pregnancy, idiopathic hirsutism, virilizing ovarian tumors, arrhenoblastoma, virilizing luteoma, testicular feminization (normal or moderately elevated), cirrhosis (through increased SHBG), hyperthyroidism. Drugs: anticonvulsants, barbiturates, estrogens, oral contraceptives (through increased SHBG).\nDecreased in: Hypogonadism (primary and secondary, orchidectomy, Klinefelter syndrome, uremia, hemodialysis, hepatic insufficiency, ethanol [men]). Drugs: digoxin, spironolactone, acarbose.\n\nComments\nDiurnal variation is present in adult males with highest levels in the early morning (around 8 AM) and lowest levels in the evening (around 8 PM). Early morning collection is recommended.",
    "interpretation": "Physiological basis\nTestosterone is the principal male sex hormone, produced by the Leydig cells of the testes. Dehydroepiandrosterone (DHEA) is produced in the adrenal cortex, testes, and ovaries and is the main precursor for serum testosterone in women. In normal males after puberty, the testosterone level is twice as high as all androgens in females. In serum, it is largely bound to albumin (38%) and to a specific steroid hormone-binding globulin (SHBG) (60%), but it is the free hormone (2%) that is physiologically active. The total testosterone level measures both bound and free testosterone in the serum (by immunoassay). Free or bioavailable testosterone may be calculated or measured.\n\nInterpretation\nIncreased in: Idiopathic sexual precocity (in boys, levels may be in adult range), adrenal hyperplasia (boys), adrenocortical tumors, trophoblastic disease during pregnancy, idiopathic hirsutism, virilizing ovarian tumors, arrhenoblastoma, virilizing luteoma, testicular feminization (normal or moderately elevated), cirrhosis (through increased SHBG), hyperthyroidism. Drugs: anticonvulsants, barbiturates, estrogens, oral contraceptives (through increased SHBG).\nDecreased in: Hypogonadism (primary and secondary, orchidectomy, Klinefelter syndrome, uremia, hemodialysis, hepatic insufficiency, ethanol [men]). Drugs: digoxin, spironolactone, acarbose.\n\nComments\nDiurnal variation is present in adult males with highest levels in the early morning (around 8 AM) and lowest levels in the evening (around 8 PM). Early morning collection is recommended.",
    "parameters": [
      {
        "name": "Testosterone Total",
        "referenceRange": "Males: 240 - 870 | Females: 15 - 70",
        "unit": "ng/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Testosterone Free",
    "title": "Testosterone Free",
    "basePrice": 750,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Morning 7-10 AM preferred)",
    "turnaroundTime": "24 - 48 Hours",
    "description": "Quantitative determination of unbound, biologically active free testosterone in serum via enzyme immunoassay (ELISA) / equilibrium dialysis to assess functional androgen activity in conditions of altered SHBG binding.",
    "notes": "Clinical Use\n1. As a secondary test to investigate alterations in physiologically active testosterone levels.\n2. To evaluate androgen status in cases with suspected or established abnormalities in sex hormone-binding globulin (SHBG).\n3. To assess functional serum testosterone levels in early pubertal males and older adult men.\n4. To measure functional circulating testosterone in females presenting with symptoms or signs of hyperandrogenism despite having normal total testosterone concentrations.\n\nComments\nTestosterone circulates in the blood bound to three proteins: sex hormone-binding globulin (SHBG) (60-80%), albumin, and cortisol-binding globulin. Approximately 1-2% of circulating testosterone remains unbound or free. Measuring free testosterone provides an estimate of the biologically active hormone. This is particularly useful to account for variations in transport proteins that can affect total testosterone levels. Elevated SHBG levels, which can occur with conditions like obesity or advanced age, might obscure a true testosterone deficiency. In conditions such as Polycystic Ovary Syndrome (PCOS), where insulin resistance is prevalent and SHBG levels are often reduced, free or bioavailable testosterone levels may be significantly elevated.",
    "interpretation": "Clinical Use\n1. As a secondary test to investigate alterations in physiologically active testosterone levels.\n2. To evaluate androgen status in cases with suspected or established abnormalities in sex hormone-binding globulin (SHBG).\n3. To assess functional serum testosterone levels in early pubertal males and older adult men.\n4. To measure functional circulating testosterone in females presenting with symptoms or signs of hyperandrogenism despite having normal total testosterone concentrations.\n\nComments\nTestosterone circulates in the blood bound to three proteins: sex hormone-binding globulin (SHBG) (60-80%), albumin, and cortisol-binding globulin. Approximately 1-2% of circulating testosterone remains unbound or free. Measuring free testosterone provides an estimate of the biologically active hormone. This is particularly useful to account for variations in transport proteins that can affect total testosterone levels. Elevated SHBG levels, which can occur with conditions like obesity or advanced age, might obscure a true testosterone deficiency. In conditions such as Polycystic Ovary Syndrome (PCOS), where insulin resistance is prevalent and SHBG levels are often reduced, free or bioavailable testosterone levels may be significantly elevated.",
    "parameters": [
      {
        "name": "Testosterone Free",
        "referenceRange": "Males: 4.5 - 25.0 | Females: 0.1 - 4.1",
        "unit": "pg/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "test",
    "title": "test",
    "basePrice": 100,
    "taxPercentage": 0,
    "sampleType": "Biological Specimen",
    "turnaroundTime": "Same Day",
    "description": "Custom laboratory test panel containing quantitative measurement parameter AAA and multi-option selection parameter BBB.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "AAA",
        "referenceRange": "5.4 - 8",
        "unit": "",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "BBB",
        "referenceRange": "",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "Normal",
            "isAbnormal": false
          },
          {
            "value": "Abnormal",
            "isAbnormal": true
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "T4",
    "title": "Serum thyroxine, T4",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative immunoassay measurement of total circulating serum thyroxine (T4) to evaluate thyroid metabolic function, hyperthyroidism, and hypothyroidism.",
    "notes": "Clinical Significance & Interpretation (Serum Thyroxine, Total T4):\nThyroxine (T4) is the major circulating thyroid hormone synthesized and secreted by the follicular cells of the thyroid gland under the regulatory control of Pituitary Thyroid Stimulating Hormone (TSH). More than 99.9% of circulating T4 is bound to plasma transport proteins (predominantly Thyroxine-Binding Globulin [TBG], transthyretin, and albumin), while the remaining unbound fraction represents free T4 (FT4).\n\n1. Clinical Indications & Diagnostics:\n• Increased in (Hyperthyroidism / Thyrotoxicosis): Graves' disease, toxic multinodular goiter, toxic adenoma, subacute thyroiditis (early release phase), exogenous thyroid hormone administration, elevated TBG states (pregnancy, estrogen therapy, oral contraceptives, acute hepatitis).\n• Decreased in (Hypothyroidism): Primary hypothyroidism (Hashimoto's thyroiditis, post-ablative, post-surgical, iodine deficiency), secondary/central hypothyroidism (pituitary or hypothalamic insufficiency), severe non-thyroidal illness (euthyroid sick syndrome), decreased TBG states (nephrotic syndrome, protein-losing enteropathy, major hepatic failure, androgen/anabolic steroid use).\n\n2. Diagnostic Guidance:\nTotal T4 levels reflect both bound and unbound hormone. Conditions altering TBG concentrations may alter Total T4 without impacting thyroid metabolic status. Assessing Free T4 (FT4) and TSH is recommended for definitive diagnosis when binding protein abnormalities are suspected.",
    "interpretation": "Clinical Significance & Interpretation (Serum Thyroxine, Total T4):\nThyroxine (T4) is the major circulating thyroid hormone synthesized and secreted by the follicular cells of the thyroid gland under the regulatory control of Pituitary Thyroid Stimulating Hormone (TSH). More than 99.9% of circulating T4 is bound to plasma transport proteins (predominantly Thyroxine-Binding Globulin [TBG], transthyretin, and albumin), while the remaining unbound fraction represents free T4 (FT4).\n\n1. Clinical Indications & Diagnostics:\n• Increased in (Hyperthyroidism / Thyrotoxicosis): Graves' disease, toxic multinodular goiter, toxic adenoma, subacute thyroiditis (early release phase), exogenous thyroid hormone administration, elevated TBG states (pregnancy, estrogen therapy, oral contraceptives, acute hepatitis).\n• Decreased in (Hypothyroidism): Primary hypothyroidism (Hashimoto's thyroiditis, post-ablative, post-surgical, iodine deficiency), secondary/central hypothyroidism (pituitary or hypothalamic insufficiency), severe non-thyroidal illness (euthyroid sick syndrome), decreased TBG states (nephrotic syndrome, protein-losing enteropathy, major hepatic failure, androgen/anabolic steroid use).\n\n2. Diagnostic Guidance:\nTotal T4 levels reflect both bound and unbound hormone. Conditions altering TBG concentrations may alter Total T4 without impacting thyroid metabolic status. Assessing Free T4 (FT4) and TSH is recommended for definitive diagnosis when binding protein abnormalities are suspected.",
    "parameters": [
      {
        "name": "Serum thyroxine, T4",
        "referenceRange": "52 - 127",
        "unit": "ng/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "T3",
    "title": "Serum Triiodothyronine, T3",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative immunoassay determination of total circulating serum triiodothyronine (T3) for assessing thyroid hyperactivity, T3 thyrotoxicosis, and peripheral thyroid hormone status.",
    "notes": "Physiologic Basis\nT3 is the primary active thyroid hormone. Approximately 80% of T3 is produced by extrathyroidal deiodination of T4 and the rest by thyroid gland. Total T3 is influenced by levels of thyroxine binding proteins.\n\nInterpretation\nIncreased in: Hyperthyroidism (some) Increased thyroid binding globulin.\nDecreased in: Hypothyroidism, nonthyroidal illness, decreased thyroid binding globulin. Drugs: Amiodarone.\n\nComments\nT3 may be increased in approximately 5% of hyperthyroid patients in whom free T4 is normal (T3 toxicosis). Therefore, the test is indicated when hyperthyroidism is suspected and free T4 value is normal. Test is of no value in the diagnosis and treatment of primary hypothyroidism.",
    "interpretation": "Physiologic Basis\nT3 is the primary active thyroid hormone. Approximately 80% of T3 is produced by extrathyroidal deiodination of T4 and the rest by thyroid gland. Total T3 is influenced by levels of thyroxine binding proteins.\n\nInterpretation\nIncreased in: Hyperthyroidism (some) Increased thyroid binding globulin.\nDecreased in: Hypothyroidism, nonthyroidal illness, decreased thyroid binding globulin. Drugs: Amiodarone.\n\nComments\nT3 may be increased in approximately 5% of hyperthyroid patients in whom free T4 is normal (T3 toxicosis). Therefore, the test is indicated when hyperthyroidism is suspected and free T4 value is normal. Test is of no value in the diagnosis and treatment of primary hypothyroidism.",
    "parameters": [
      {
        "name": "Serum Triiodothyronine, T3",
        "referenceRange": "0.69 - 2.15",
        "unit": "ng/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Stool Routine Examination",
    "title": "Stool Routine Examination (Routine & Microscopy)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Fresh Stool / Feces (Sterile Container)",
    "turnaroundTime": "Same Day",
    "description": "Comprehensive physical, chemical, and microscopic examination of fecal specimens to evaluate gastrointestinal disorders, intestinal parasites, dysentery, occult bleeding, and malabsorption.",
    "notes": "Clinical Significance & Interpretation (Stool Routine Examination):\nStool Routine & Microscopic Examination is a vital diagnostic evaluation of gastrointestinal health, intestinal infections, malabsorption disorders, and gastrointestinal bleeding.\n\n1. Macroscopic Findings:\n• Colour: Normal stool colour ranges from light to dark brown due to stercobilin. Pale/Clay-coloured stool suggests biliary obstruction (lack of urobilinogen). Black/Tarry stool (melena) indicates upper GI bleeding. Red/Bloody stool (hematochezia) suggests lower GI bleeding, hemorrhoids, or fissures.\n• Consistency: Watery or loose stools reflect hypermotility or secretory/osmotic diarrhea. Hard stools indicate delayed transit/constipation. Mucoid stools suggest colonic inflammation, irritable bowel syndrome, or infectious enteritis.\n• Occult Blood: Positive occult blood is an indicator of asymptomatic colorectal bleeding, polyps, inflammatory bowel disease (IBD), ulcers, or early colorectal neoplasia.\n\n2. Microscopic Findings:\n• Pus Cells (Leukocytes) & RBCs: Presence of significant pus cells (> 5/HPF) with RBCs indicates invasive or inflammatory bacterial infection (e.g., Shigella, Salmonella, Campylobacter, invasive E. coli) or active IBD (Ulcerative Colitis / Crohn's Disease).\n• Cysts & Trophozoites: Detection of Entamoeba histolytica (amebiasis) or Giardia lamblia (giardiasis) cysts/trophozoites confirms parasitic intestinal protozoal infection.\n• Helminthic Ova: Identification of ova (Ascaris, Hookworm, Trichuris, Taenia) confirms helminthic infestation requiring targeted anthelmintic therapy.\n• Undigested Food & Macrophages: Excessive undigested meat fibers/starch or macrophages suggests maldigestion, pancreatic exocrine insufficiency, or severe mucosal inflammation.",
    "interpretation": "Clinical Significance & Interpretation (Stool Routine Examination):\nStool Routine & Microscopic Examination is a vital diagnostic evaluation of gastrointestinal health, intestinal infections, malabsorption disorders, and gastrointestinal bleeding.\n\n1. Macroscopic Findings:\n• Colour: Normal stool colour ranges from light to dark brown due to stercobilin. Pale/Clay-coloured stool suggests biliary obstruction (lack of urobilinogen). Black/Tarry stool (melena) indicates upper GI bleeding. Red/Bloody stool (hematochezia) suggests lower GI bleeding, hemorrhoids, or fissures.\n• Consistency: Watery or loose stools reflect hypermotility or secretory/osmotic diarrhea. Hard stools indicate delayed transit/constipation. Mucoid stools suggest colonic inflammation, irritable bowel syndrome, or infectious enteritis.\n• Occult Blood: Positive occult blood is an indicator of asymptomatic colorectal bleeding, polyps, inflammatory bowel disease (IBD), ulcers, or early colorectal neoplasia.\n\n2. Microscopic Findings:\n• Pus Cells (Leukocytes) & RBCs: Presence of significant pus cells (> 5/HPF) with RBCs indicates invasive or inflammatory bacterial infection (e.g., Shigella, Salmonella, Campylobacter, invasive E. coli) or active IBD (Ulcerative Colitis / Crohn's Disease).\n• Cysts & Trophozoites: Detection of Entamoeba histolytica (amebiasis) or Giardia lamblia (giardiasis) cysts/trophozoites confirms parasitic intestinal protozoal infection.\n• Helminthic Ova: Identification of ova (Ascaris, Hookworm, Trichuris, Taenia) confirms helminthic infestation requiring targeted anthelmintic therapy.\n• Undigested Food & Macrophages: Excessive undigested meat fibers/starch or macrophages suggests maldigestion, pancreatic exocrine insufficiency, or severe mucosal inflammation.",
    "parameters": [
      {
        "name": "Colour",
        "referenceRange": "Yellowish Brown / Brown",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "Brown",
            "isAbnormal": false
          },
          {
            "value": "Yellowish Brown",
            "isAbnormal": false
          },
          {
            "value": "Dark Brown",
            "isAbnormal": false
          },
          {
            "value": "Clay Coloured",
            "isAbnormal": true
          },
          {
            "value": "Black / Tarry",
            "isAbnormal": true
          },
          {
            "value": "Greenish",
            "isAbnormal": true
          },
          {
            "value": "Red / Bloody",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Consistency",
        "referenceRange": "Formed / Semi-formed",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "Formed",
            "isAbnormal": false
          },
          {
            "value": "Semi-formed",
            "isAbnormal": false
          },
          {
            "value": "Soft",
            "isAbnormal": false
          },
          {
            "value": "Loose / Watery",
            "isAbnormal": true
          },
          {
            "value": "Hard",
            "isAbnormal": true
          },
          {
            "value": "Mucoid",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Mucus",
        "referenceRange": "Absent / NIL",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "NIL",
            "isAbnormal": false
          },
          {
            "value": "Present",
            "isAbnormal": true
          },
          {
            "value": "Trace",
            "isAbnormal": false
          },
          {
            "value": "Moderate",
            "isAbnormal": true
          },
          {
            "value": "Copious",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Blood",
        "referenceRange": "Absent / NIL",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "NIL",
            "isAbnormal": false
          },
          {
            "value": "Present",
            "isAbnormal": true
          },
          {
            "value": "Trace",
            "isAbnormal": true
          },
          {
            "value": "Occasional",
            "isAbnormal": true
          },
          {
            "value": "Gross Blood Present",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Occult Blood",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Weakly Positive",
            "isAbnormal": true
          },
          {
            "value": "Trace",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Parasites",
        "referenceRange": "Not Seen / NIL",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "Not Seen",
            "isAbnormal": false
          },
          {
            "value": "NIL",
            "isAbnormal": false
          },
          {
            "value": "Present",
            "isAbnormal": true
          },
          {
            "value": "Adult Worm / Segment Seen",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Undigested Food Particles",
        "referenceRange": "Absent / Occasional",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "Absent",
            "isAbnormal": false
          },
          {
            "value": "NIL",
            "isAbnormal": false
          },
          {
            "value": "Present",
            "isAbnormal": true
          },
          {
            "value": "Occasional",
            "isAbnormal": false
          },
          {
            "value": "Moderate Amount",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "OVA",
        "referenceRange": "NIL / Not Seen",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "NIL",
            "isAbnormal": false
          },
          {
            "value": "Not Seen",
            "isAbnormal": false
          },
          {
            "value": "Ascaris lumbricoides seen",
            "isAbnormal": true
          },
          {
            "value": "Hookworm ova seen",
            "isAbnormal": true
          },
          {
            "value": "Trichuris trichiura seen",
            "isAbnormal": true
          },
          {
            "value": "Taenia ova seen",
            "isAbnormal": true
          },
          {
            "value": "Enterobius vermicularis seen",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Cysts",
        "referenceRange": "NIL / Not Seen",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "NIL",
            "isAbnormal": false
          },
          {
            "value": "Not Seen",
            "isAbnormal": false
          },
          {
            "value": "E. histolytica cyst seen",
            "isAbnormal": true
          },
          {
            "value": "Giardia lamblia cyst seen",
            "isAbnormal": true
          },
          {
            "value": "E. coli cyst seen",
            "isAbnormal": false
          },
          {
            "value": "Balantidium coli cyst seen",
            "isAbnormal": true
          },
          {
            "value": "Blastocystis hominis seen",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Pus Cells",
        "referenceRange": "0 - 2 /HPF",
        "unit": "/HPF",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "NIL",
            "isAbnormal": false
          },
          {
            "value": "0 - 2",
            "isAbnormal": false
          },
          {
            "value": "2 - 4",
            "isAbnormal": false
          },
          {
            "value": "5 - 10",
            "isAbnormal": true
          },
          {
            "value": "10 - 20",
            "isAbnormal": true
          },
          {
            "value": "Plenty / Numerous",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Red Blood Cells",
        "referenceRange": "NIL /HPF",
        "unit": "/HPF",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "NIL",
            "isAbnormal": false
          },
          {
            "value": "0 - 1",
            "isAbnormal": false
          },
          {
            "value": "1 - 2",
            "isAbnormal": true
          },
          {
            "value": "2 - 5",
            "isAbnormal": true
          },
          {
            "value": "5 - 10",
            "isAbnormal": true
          },
          {
            "value": "Plenty / Numerous",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Macrophages",
        "referenceRange": "Absent / NIL",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "NIL",
            "isAbnormal": false
          },
          {
            "value": "Absent",
            "isAbnormal": false
          },
          {
            "value": "Present",
            "isAbnormal": true
          },
          {
            "value": "Occasional",
            "isAbnormal": false
          },
          {
            "value": "Few",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Stool reducing substances",
    "title": "Stool Reducing Substances (Fecal Reducing Substances)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Fresh Stool Specimen (Sterile Container)",
    "turnaroundTime": "Same Day",
    "description": "Semi-quantitative chemical screening test (Benedict’s / Clinitest method) to detect reducing carbohydrates (lactose, glucose, galactose, fructose) in stool for diagnosing carbohydrate malabsorption and disaccharidase deficiency.",
    "notes": "Clinical Significance & Interpretation (Stool Reducing Substances):\nFecal reducing substances testing (Benedict's / Clinitest method) is a critical diagnostic screening tool for carbohydrate malabsorption and disaccharidase deficiencies in infants and young children presenting with chronic watery diarrhea, perianal excoriation, abdominal distension, and failure to thrive.\n\n1. Reference Interval & Grading:\n• Negative (< 0.25% or < 0.25 g/dL): Normal carbohydrate absorption without significant fecal loss of reducing sugars.\n• Borderline / Suspicious (0.25% - 0.5%): Questionable or mild malabsorption; repeat testing after dietary challenge may be warranted.\n• Positive (> 0.5% or > 0.5 g/dL): Clinically significant carbohydrate malabsorption.\n\n2. Clinical Etiologies of Positive Results:\n• Primary / Congenital Disaccharidase Deficiencies: Congenital lactase deficiency, sucrase-isomaltase deficiency, glucose-galactose malabsorption.\n• Secondary / Acquired Intestinal Malabsorption: Post-rotaviral / post-gastroenteritis mucosal brush border injury, cow's milk protein allergy, celiac disease, short bowel syndrome, or small intestinal bacterial overgrowth (SIBO).\n\n3. Correlative Biomarkers & Pre-analytical Notes:\n• Fecal pH: Malabsorbed carbohydrates are fermented by colonic flora into short-chain fatty acids, reducing stool pH to acidic levels (< 5.5).\n• Non-reducing Sugars (Sucrose): Sucrose is not a reducing sugar unless acid hydrolyzed. If sucrose malabsorption is suspected, acid hydrolysis prior to testing is required.\n• Sample Handling: Feces must be collected fresh and processed immediately to prevent bacterial consumption of sugars prior to analysis.",
    "interpretation": "Clinical Significance & Interpretation (Stool Reducing Substances):\nFecal reducing substances testing (Benedict's / Clinitest method) is a critical diagnostic screening tool for carbohydrate malabsorption and disaccharidase deficiencies in infants and young children presenting with chronic watery diarrhea, perianal excoriation, abdominal distension, and failure to thrive.\n\n1. Reference Interval & Grading:\n• Negative (< 0.25% or < 0.25 g/dL): Normal carbohydrate absorption without significant fecal loss of reducing sugars.\n• Borderline / Suspicious (0.25% - 0.5%): Questionable or mild malabsorption; repeat testing after dietary challenge may be warranted.\n• Positive (> 0.5% or > 0.5 g/dL): Clinically significant carbohydrate malabsorption.\n\n2. Clinical Etiologies of Positive Results:\n• Primary / Congenital Disaccharidase Deficiencies: Congenital lactase deficiency, sucrase-isomaltase deficiency, glucose-galactose malabsorption.\n• Secondary / Acquired Intestinal Malabsorption: Post-rotaviral / post-gastroenteritis mucosal brush border injury, cow's milk protein allergy, celiac disease, short bowel syndrome, or small intestinal bacterial overgrowth (SIBO).\n\n3. Correlative Biomarkers & Pre-analytical Notes:\n• Fecal pH: Malabsorbed carbohydrates are fermented by colonic flora into short-chain fatty acids, reducing stool pH to acidic levels (< 5.5).\n• Non-reducing Sugars (Sucrose): Sucrose is not a reducing sugar unless acid hydrolyzed. If sucrose malabsorption is suspected, acid hydrolysis prior to testing is required.\n• Sample Handling: Feces must be collected fresh and processed immediately to prevent bacterial consumption of sugars prior to analysis.",
    "parameters": [
      {
        "name": "Stool reducing substances",
        "referenceRange": "Negative (< 0.25%)",
        "unit": "%",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "Negative (< 0.25%)",
            "isAbnormal": false
          },
          {
            "value": "Borderline (0.25% - 0.5%)",
            "isAbnormal": true
          },
          {
            "value": "Positive (> 0.5%)",
            "isAbnormal": true
          },
          {
            "value": "Strongly Positive (> 1.0%)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Skin test for Leprosy",
    "title": "Skin test for Leprosy (Lepromin Test)",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Intradermal Antigen (Lepromin)",
    "turnaroundTime": "48 Hours (Fernandez) / 21-28 Days (Mitsuda)",
    "description": "Delayed-type hypersensitivity skin test using Lepromin antigen to assess cell-mediated immunity (CMI) against Mycobacterium leprae for classification, prognostication, and host resistance evaluation.",
    "notes": "Clinical Significance & Interpretation (Skin Test for Leprosy / Lepromin Test):\nThe Lepromin test (Mitsuda and Fernandez reactions) is a delayed-type hypersensitivity skin test used to assess cell-mediated immunity (CMI) to Mycobacterium leprae. It is primarily used for classification and prognosis of leprosy rather than initial diagnosis.\n\n1. Reaction Types & Interpretation:\n• Fernandez Reaction (Early Reaction, read at 48 hours): Erythema and induration > 10 mm indicates pre-existing delayed hypersensitivity to soluble M. leprae antigens.\n• Mitsuda Reaction (Late Reaction, read at 21-28 days): Nodular induration > 5 mm indicates intact, functional cell-mediated immunity against M. leprae antigens.\n\n2. Immunological & Prognostic Significance:\n• Positive Mitsuda Test: Indicates strong cell-mediated immunity. Associated with Tuberculoid Leprosy (TT) or Borderline Tuberculoid (BT), characterized by low bacterial index (paucibacillary), localized granulomas, and favorable clinical prognosis.\n• Negative Mitsuda Test: Indicates deficient cell-mediated immunity to M. leprae. Associated with Lepromatous Leprosy (LL) or Borderline Lepromatous (BL), characterized by high bacterial burden (multibacillary), diffuse skin infiltration, and high transmission potential.\n• Note: Healthy non-exposed individuals and BCG-vaccinated persons may exhibit a positive Mitsuda reaction due to cross-reactive mycobacterial immunity.",
    "interpretation": "Clinical Significance & Interpretation (Skin Test for Leprosy / Lepromin Test):\nThe Lepromin test (Mitsuda and Fernandez reactions) is a delayed-type hypersensitivity skin test used to assess cell-mediated immunity (CMI) to Mycobacterium leprae. It is primarily used for classification and prognosis of leprosy rather than initial diagnosis.\n\n1. Reaction Types & Interpretation:\n• Fernandez Reaction (Early Reaction, read at 48 hours): Erythema and induration > 10 mm indicates pre-existing delayed hypersensitivity to soluble M. leprae antigens.\n• Mitsuda Reaction (Late Reaction, read at 21-28 days): Nodular induration > 5 mm indicates intact, functional cell-mediated immunity against M. leprae antigens.\n\n2. Immunological & Prognostic Significance:\n• Positive Mitsuda Test: Indicates strong cell-mediated immunity. Associated with Tuberculoid Leprosy (TT) or Borderline Tuberculoid (BT), characterized by low bacterial index (paucibacillary), localized granulomas, and favorable clinical prognosis.\n• Negative Mitsuda Test: Indicates deficient cell-mediated immunity to M. leprae. Associated with Lepromatous Leprosy (LL) or Borderline Lepromatous (BL), characterized by high bacterial burden (multibacillary), diffuse skin infiltration, and high transmission potential.\n• Note: Healthy non-exposed individuals and BCG-vaccinated persons may exhibit a positive Mitsuda reaction due to cross-reactive mycobacterial immunity.",
    "parameters": [
      {
        "name": "Skin test for Leprosy",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive (+)",
            "isAbnormal": true
          },
          {
            "value": "Strongly Positive (++)",
            "isAbnormal": true
          },
          {
            "value": "Equivocal / Doubtful",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Stool/cs",
    "title": "Stool Culture and Sensitivity (Stool C/S)",
    "basePrice": 600,
    "taxPercentage": 0,
    "sampleType": "Fresh Stool / Feces (Sterile Container / Cary-Blair Transport)",
    "turnaroundTime": "48 - 72 Hours",
    "description": "Microbiological culture, pathogen identification, and antibiotic susceptibility testing on stool specimens to isolate bacterial causes of acute gastroenteritis and dysentery.",
    "notes": "Clinical Significance & Interpretation (Stool Culture & Sensitivity - Stool C/S):\nStool culture is performed to isolate and identify enteric bacterial pathogens responsible for infectious gastroenteritis, food poisoning, and bacterial dysentery, followed by antibiotic sensitivity testing.\n\n1. Common Enteric Pathogens Isolated:\n• Salmonella species (S. enterica, S. typhi): Causes acute enterocolitis, enteric fever.\n• Shigella species (S. dysenteriae, S. flexneri, S. sonnei): Causes classic bacillary dysentery with bloody, mucoid stools.\n• Vibrio cholerae: Causes severe secretory rice-water diarrhea and life-threatening dehydration.\n• Campylobacter jejuni: Common cause of bacterial gastroenteritis and inflammatory enterocolitis.\n• Enteropathogenic / Enterohemorrhagic E. coli (EPEC/EHEC): Associated with epidemic infantile diarrhea and Hemolytic Uremic Syndrome (HUS).\n\n2. Clinical Guidance:\nIsolation of normal commensal colonic flora is reported as \"Normal Colonic Flora Grown / No Enteric Pathogen Isolated\". In positive cultures, antimicrobial susceptibility testing (AST) guides targeted antibiotic therapy.",
    "interpretation": "Clinical Significance & Interpretation (Stool Culture & Sensitivity - Stool C/S):\nStool culture is performed to isolate and identify enteric bacterial pathogens responsible for infectious gastroenteritis, food poisoning, and bacterial dysentery, followed by antibiotic sensitivity testing.\n\n1. Common Enteric Pathogens Isolated:\n• Salmonella species (S. enterica, S. typhi): Causes acute enterocolitis, enteric fever.\n• Shigella species (S. dysenteriae, S. flexneri, S. sonnei): Causes classic bacillary dysentery with bloody, mucoid stools.\n• Vibrio cholerae: Causes severe secretory rice-water diarrhea and life-threatening dehydration.\n• Campylobacter jejuni: Common cause of bacterial gastroenteritis and inflammatory enterocolitis.\n• Enteropathogenic / Enterohemorrhagic E. coli (EPEC/EHEC): Associated with epidemic infantile diarrhea and Hemolytic Uremic Syndrome (HUS).\n\n2. Clinical Guidance:\nIsolation of normal commensal colonic flora is reported as \"Normal Colonic Flora Grown / No Enteric Pathogen Isolated\". In positive cultures, antimicrobial susceptibility testing (AST) guides targeted antibiotic therapy.",
    "parameters": [
      {
        "name": "Growth / Pathogen Isolated",
        "referenceRange": "No enteric pathogen isolated",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "Normal Colonic Flora Grown",
            "isAbnormal": false
          },
          {
            "value": "No Pathogenic Organisms Isolated",
            "isAbnormal": false
          },
          {
            "value": "Salmonella species isolated",
            "isAbnormal": true
          },
          {
            "value": "Shigella species isolated",
            "isAbnormal": true
          },
          {
            "value": "Vibrio cholerae isolated",
            "isAbnormal": true
          },
          {
            "value": "Campylobacter jejuni isolated",
            "isAbnormal": true
          },
          {
            "value": "Enteropathogenic E. coli isolated",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Antibiotic Sensitivity",
        "referenceRange": "Sensitive to reported antibiotics",
        "unit": "",
        "gender": "Both",
        "fieldType": "Text",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "SGPT",
    "title": "SGPT (ALT) - Alanine Aminotransferase",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Enzyme biomarker test measuring Serum Glutamic Pyruvic Transaminase (SGPT/ALT) to evaluate hepatic cellular integrity, parenchymal liver damage, and monitor hepatotoxic therapies.",
    "notes": "Physiological basis:\nIntracellular enzyme involved in amino acid metabolism. Present in large concentrations in liver, kidney; in smaller amounts, in skeletal muscle and heart. Released with tissue damage, particularly liver injury.\n\nInterpretation:\nIncreased in: Acute viral hepatitis (ALT > AST), biliary tract obstruction (cholangitis, choledocholithiasis), alcoholic hepatitis and cirrhosis (AST > ALT), liver abscess, metastatic or primary liver cancer; nonalcoholic steatohepatitis; right heart failure, ischemia or hypoxia, injury to liver (\"shock liver\"), extensive trauma; drugs that cause cholestasis or hepatotoxicity.\nDecreased in: Pyridoxine (vitamin B6) deficiency.\n\nComments:\nALT is the preferred enzyme for evaluation of liver injury.",
    "interpretation": "Physiological basis:\nIntracellular enzyme involved in amino acid metabolism. Present in large concentrations in liver, kidney; in smaller amounts, in skeletal muscle and heart. Released with tissue damage, particularly liver injury.\n\nInterpretation:\nIncreased in: Acute viral hepatitis (ALT > AST), biliary tract obstruction (cholangitis, choledocholithiasis), alcoholic hepatitis and cirrhosis (AST > ALT), liver abscess, metastatic or primary liver cancer; nonalcoholic steatohepatitis; right heart failure, ischemia or hypoxia, injury to liver (\"shock liver\"), extensive trauma; drugs that cause cholestasis or hepatotoxicity.\nDecreased in: Pyridoxine (vitamin B6) deficiency.\n\nComments:\nALT is the preferred enzyme for evaluation of liver injury.",
    "parameters": [
      {
        "name": "SGPT (ALT)",
        "referenceRange": "13 - 40",
        "unit": "U/l",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "SGOT",
    "title": "SGOT (AST) - Aspartate Aminotransferase",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Enzyme biomarker test measuring Serum Glutamic Oxaloacetic Transaminase (SGOT/AST) to evaluate hepatic and muscular cellular integrity, parenchymal tissue damage, and AST/ALT de Ritis ratio.",
    "notes": "Physiological basis:\nIntracellular enzyme involved in amino acid metabolism. Present in large concentrations in liver, skeletal muscle, brain, red cells, and heart. Released into the bloodstream when tissue is damaged, especially in liver injury.\n\nInterpretation:\nIncreased in: Acute viral hepatitis (ALT > AST), biliary tract obstruction (cholangitis, choledocholithiasis), alcoholic hepatitis and cirrhosis (AST > ALT), liver abscess, metastatic or primary liver cancer; right heart failure, ischemic or hypoxic injury to liver (\"shock liver\"), extensive trauma. Drugs that cause cholestasis or hepatotoxicity.\nDecreased in: Pyridoxine (vitamin B6) deficiency\n\nComments:\nTest is not indicated for diagnosis of myocardial infarction.\nAST/ALT ratio >1 suggests cirrhosis in patients with hepatitis C",
    "interpretation": "Physiological basis:\nIntracellular enzyme involved in amino acid metabolism. Present in large concentrations in liver, skeletal muscle, brain, red cells, and heart. Released into the bloodstream when tissue is damaged, especially in liver injury.\n\nInterpretation:\nIncreased in: Acute viral hepatitis (ALT > AST), biliary tract obstruction (cholangitis, choledocholithiasis), alcoholic hepatitis and cirrhosis (AST > ALT), liver abscess, metastatic or primary liver cancer; right heart failure, ischemic or hypoxic injury to liver (\"shock liver\"), extensive trauma. Drugs that cause cholestasis or hepatotoxicity.\nDecreased in: Pyridoxine (vitamin B6) deficiency\n\nComments:\nTest is not indicated for diagnosis of myocardial infarction.\nAST/ALT ratio >1 suggests cirrhosis in patients with hepatitis C",
    "parameters": [
      {
        "name": "SGOT (AST)",
        "referenceRange": "0 - 37",
        "unit": "U/l",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Zinc",
    "title": "Serum Zinc (Trace Element)",
    "basePrice": 900,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Trace Element-Free Plain / Royal Blue Tube)",
    "turnaroundTime": "24 - 48 Hours",
    "description": "Trace element biomarker quantitative assay measuring serum zinc levels to diagnose zinc nutritional deficiency, acrodermatitis enteropathica, chronic malabsorption, and monitor trace element therapy.",
    "notes": "Clinical Significance & Interpretation (Serum Zinc):\nZinc (Zn) is an essential trace element and vital cofactor for more than 300 metalloenzymes (including carbonic anhydrase, alkaline phosphatase, RNA/DNA polymerases, and superoxide dismutase). It plays crucial roles in cellular growth, DNA synthesis, protein metabolism, wound healing, immune function, and spermatogenesis.\n\n1. Reference Interval:\n• Normal Serum Zinc: 70 - 120 µg/dL\n\n2. Clinical Implications of Decreased Levels (< 70 µg/dL):\n• Inadequate Dietary Intake & Malnutrition: Protein-energy malnutrition, total parenteral nutrition (TPN) without trace element supplementation, anorexia nervosa.\n• Gastrointestinal Malabsorption: Celiac disease, Crohn's disease, short bowel syndrome, chronic diarrhea, bariatric surgery.\n• Acrodermatitis Enteropathica: Rare autosomal recessive genetic disorder causing severe zinc malabsorption, characterized by periorificial dermatitis, alopecia, chronic diarrhea, and delayed development.\n• Increased Losses & Increased Demand: Chronic alcoholism (increased urinary excretion), severe thermal burns, chronic kidney disease (hemodialysis), pregnancy, and lactation.\n• Clinical Manifestations of Deficiency: Impaired wound healing, recurrent infections, growth retardation, hypogonadism, skin lesions, alopecia, impaired taste (hypogeusia) and smell (hyposmia), night blindness, and neuropsychiatric disturbances.\n\n3. Clinical Implications of Elevated Levels (> 120 µg/dL):\n• Occupational / Industrial Inhalation (Zinc Fume Fever): Inhalation of zinc oxide fumes during welding or metal galvanization.\n• Excessive Supplementation / Toxicity: Ingestion of high-dose zinc supplements or zinc-containing dental adhesives, which can induce secondary copper deficiency, sideroblastic anemia, and neutropenia.\n\n4. Pre-analytical Considerations:\n• Diurnal Variation: Serum zinc levels peak in the morning (by ~10-15%) and decrease in the evening. Fasting morning collection is recommended.\n• Contamination Avoidance: Use trace element-free collection tubes (e.g., Royal Blue top) to prevent environmental zinc contamination. Hemolysis must be avoided as erythrocytes contain high concentrations of zinc.",
    "interpretation": "Clinical Significance & Interpretation (Serum Zinc):\nZinc (Zn) is an essential trace element and vital cofactor for more than 300 metalloenzymes (including carbonic anhydrase, alkaline phosphatase, RNA/DNA polymerases, and superoxide dismutase). It plays crucial roles in cellular growth, DNA synthesis, protein metabolism, wound healing, immune function, and spermatogenesis.\n\n1. Reference Interval:\n• Normal Serum Zinc: 70 - 120 µg/dL\n\n2. Clinical Implications of Decreased Levels (< 70 µg/dL):\n• Inadequate Dietary Intake & Malnutrition: Protein-energy malnutrition, total parenteral nutrition (TPN) without trace element supplementation, anorexia nervosa.\n• Gastrointestinal Malabsorption: Celiac disease, Crohn's disease, short bowel syndrome, chronic diarrhea, bariatric surgery.\n• Acrodermatitis Enteropathica: Rare autosomal recessive genetic disorder causing severe zinc malabsorption, characterized by periorificial dermatitis, alopecia, chronic diarrhea, and delayed development.\n• Increased Losses & Increased Demand: Chronic alcoholism (increased urinary excretion), severe thermal burns, chronic kidney disease (hemodialysis), pregnancy, and lactation.\n• Clinical Manifestations of Deficiency: Impaired wound healing, recurrent infections, growth retardation, hypogonadism, skin lesions, alopecia, impaired taste (hypogeusia) and smell (hyposmia), night blindness, and neuropsychiatric disturbances.\n\n3. Clinical Implications of Elevated Levels (> 120 µg/dL):\n• Occupational / Industrial Inhalation (Zinc Fume Fever): Inhalation of zinc oxide fumes during welding or metal galvanization.\n• Excessive Supplementation / Toxicity: Ingestion of high-dose zinc supplements or zinc-containing dental adhesives, which can induce secondary copper deficiency, sideroblastic anemia, and neutropenia.\n\n4. Pre-analytical Considerations:\n• Diurnal Variation: Serum zinc levels peak in the morning (by ~10-15%) and decrease in the evening. Fasting morning collection is recommended.\n• Contamination Avoidance: Use trace element-free collection tubes (e.g., Royal Blue top) to prevent environmental zinc contamination. Hemolysis must be avoided as erythrocytes contain high concentrations of zinc.",
    "parameters": [
      {
        "name": "Serum Zinc",
        "referenceRange": "70 - 120",
        "unit": "µg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Urea",
    "title": "Serum Urea (Blood Urea Nitrogen / Urea)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma (Plain / Gel / Heparin Tube)",
    "turnaroundTime": "Same Day",
    "description": "Renal function biomarker measuring serum urea concentration to assess glomerular filtration, nitrogenous waste clearance, hydration status, and monitor renal disease progression.",
    "notes": "Interpretation:\nUrea is derived in the liver from amino acids and therefore from protein, whether originating from the diet or from tissues. The normal kidney can excrete large amounts of urea. If the rate of production exceeds the rate of clearance, plasma concentrations rise. The rate of production is accelerated by:\n- a high-protein diet\n- absorption of amino acids and peptides from digested blood after hemorrhage into the gastrointestinal lumen or soft tissues\n- increased catabolism due to starvation, tissue damage, sepsis or steroid treatment.\nIn catabolic states, glomerular function is often impaired due to circulatory factors and this contributes more to the uraemia than does increased production. Conversely, the plasma urea concentration may be lower than 1.0 mmol/L, the causes of which include the following:\n\nDue to increased GFR or haemodilution:\n• Pregnancy\n• Overenthusiastic intravenous infusion\n• 'Inappropriate' ADH secretion (SIADH)\n\nDue to decreased synthesis:\n• Use of amino acids for protein anabolism during growth, especially in children\n• Low protein intake, very severe liver disease\n• Inborn errors of the urea cycle are rare and usually only occur in infants.",
    "interpretation": "Interpretation:\nUrea is derived in the liver from amino acids and therefore from protein, whether originating from the diet or from tissues. The normal kidney can excrete large amounts of urea. If the rate of production exceeds the rate of clearance, plasma concentrations rise. The rate of production is accelerated by:\n- a high-protein diet\n- absorption of amino acids and peptides from digested blood after hemorrhage into the gastrointestinal lumen or soft tissues\n- increased catabolism due to starvation, tissue damage, sepsis or steroid treatment.\nIn catabolic states, glomerular function is often impaired due to circulatory factors and this contributes more to the uraemia than does increased production. Conversely, the plasma urea concentration may be lower than 1.0 mmol/L, the causes of which include the following:\n\nDue to increased GFR or haemodilution:\n• Pregnancy\n• Overenthusiastic intravenous infusion\n• 'Inappropriate' ADH secretion (SIADH)\n\nDue to decreased synthesis:\n• Use of amino acids for protein anabolism during growth, especially in children\n• Low protein intake, very severe liver disease\n• Inborn errors of the urea cycle are rare and usually only occur in infants.",
    "parameters": [
      {
        "name": "Serum Urea",
        "referenceRange": "19 - 45",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Sodium",
    "title": "Serum Sodium (Na+)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Heparin Plasma (Plain / Gel / Lithium Heparin Tube)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative electrolyte assay measuring serum sodium concentration to assess fluid and electrolyte balance, osmolality, hydration status, and renal/endocrine disorders.",
    "notes": "Physiologic Basis\nSodium is the predominant extracellular cation. The serum sodium level is primarily determined by the volume status of the individual. Hyponatremia can be divided into hypovolemia, euvolemia, and hypervolemia categories.\n\nInterpretation\nIncreased in: Dehydration (excessive sweating, severe vomiting, or diarrhea), polyuria (diabetes mellitus, diabetes insipidus), hyperaldosteronism, inadequate water intake (coma, hypothalamic disease).\nDrugs: steroids, licorice, oral contraceptives.\nDecreased in: CHF, cirrhosis, vomiting, diarrhea, exercise, excessive sweating (with replacement of water but not salt, eg, marathon running), salt-losing nephropathy, adrenal insufficiency, nephrotic syndrome, water intoxication, syndrome of inappropriate antidiuretic hormone (SIADH), AIDS.\nDrugs: thiazides, diuretics, ACE inhibitors, chlorpropamide, carbamazepine, antidepressants (SSRI), antipsychotics.\n\nComments\nHyponatremia in a normovolemic patient with urine osmolality higher than serum (or plasma) osmolality suggests the possibility of SIADH, myxedema, hypopituitarism, or reset osmostat. Treatment of disorders of sodium balance relies on clinical assessment of the patient's extracellular fluid volume rather than the serum sodium.",
    "interpretation": "Physiologic Basis\nSodium is the predominant extracellular cation. The serum sodium level is primarily determined by the volume status of the individual. Hyponatremia can be divided into hypovolemia, euvolemia, and hypervolemia categories.\n\nInterpretation\nIncreased in: Dehydration (excessive sweating, severe vomiting, or diarrhea), polyuria (diabetes mellitus, diabetes insipidus), hyperaldosteronism, inadequate water intake (coma, hypothalamic disease).\nDrugs: steroids, licorice, oral contraceptives.\nDecreased in: CHF, cirrhosis, vomiting, diarrhea, exercise, excessive sweating (with replacement of water but not salt, eg, marathon running), salt-losing nephropathy, adrenal insufficiency, nephrotic syndrome, water intoxication, syndrome of inappropriate antidiuretic hormone (SIADH), AIDS.\nDrugs: thiazides, diuretics, ACE inhibitors, chlorpropamide, carbamazepine, antidepressants (SSRI), antipsychotics.\n\nComments\nHyponatremia in a normovolemic patient with urine osmolality higher than serum (or plasma) osmolality suggests the possibility of SIADH, myxedema, hypopituitarism, or reset osmostat. Treatment of disorders of sodium balance relies on clinical assessment of the patient's extracellular fluid volume rather than the serum sodium.",
    "parameters": [
      {
        "name": "Serum Sodium",
        "referenceRange": "136 - 146",
        "unit": "mmol/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Protein",
    "title": "Serum Protein (Total Protein)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative assay measuring total serum protein concentration (albumin and globulins) to evaluate nutritional status, hepatic synthesis capacity, renal protein loss, and monoclonal gammopathies.",
    "notes": "Physiological basis\nPlasma protein concentration is determined by nutritional state, hepatic function, renal function, hydration, and various disease states. Plasma protein concentration determines the colloidal osmotic pressure.\n\nInterpretation\nIncreased in: Polyclonal or monoclonal gammopathies, marked dehydration. Drugs: anabolic steroids, androgens, corticosteroids, epinephrine.\nDecreased in: Protein-losing enteropathies, acute burns, nephrotic syndrome, severe dietary protein deficiency, chronic liver disease, malabsorption syndrome, agammaglobulinemia, cancer cachexia.\n\nComments\nSerum total protein consists primarily of albumin and globulin. Serum globulin level is calculated as total protein minus albumin. Hypoproteinemia usually indicates hypoalbuminemia, because albumin is the major serum protein",
    "interpretation": "Physiological basis\nPlasma protein concentration is determined by nutritional state, hepatic function, renal function, hydration, and various disease states. Plasma protein concentration determines the colloidal osmotic pressure.\n\nInterpretation\nIncreased in: Polyclonal or monoclonal gammopathies, marked dehydration. Drugs: anabolic steroids, androgens, corticosteroids, epinephrine.\nDecreased in: Protein-losing enteropathies, acute burns, nephrotic syndrome, severe dietary protein deficiency, chronic liver disease, malabsorption syndrome, agammaglobulinemia, cancer cachexia.\n\nComments\nSerum total protein consists primarily of albumin and globulin. Serum globulin level is calculated as total protein minus albumin. Hypoproteinemia usually indicates hypoalbuminemia, because albumin is the major serum protein",
    "parameters": [
      {
        "name": "Serum Protein",
        "referenceRange": "6.4 - 8.3",
        "unit": "g/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Potassium",
    "title": "Serum Potassium (K+)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Heparin Plasma (Plain / Gel / Lithium Heparin Tube)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative electrolyte assay measuring serum potassium concentration to evaluate neuromuscular excitability, cardiac conduction, acid-base homeostasis, and renal excretion disorders.",
    "notes": "Physiologic Basis\nPotassium is predominantly an intracellular cation whose plasma level is regulated by renal excretion. Elevated or depressed potassium concentrations interfere with muscle contraction.\n\nInterpretation\nIncreased in: Massive hemolysis, severe tissue damage, rhabdomyolysis, acidosis, dehydration, acute or chronic renal failure, Addison disease, renal tubular acidosis type IV (hyporeninemic) hypoaldosteronism, (hyperkalemic) familial periodic paralysis, exercise (transient).\nDrugs: potassium salts, potassium-sparing diuretics (eg, spironolactone, triamterene, eplerenone), nonsteroidal anti-inflammatory drugs, β-blockers, ACE inhibitors, ACE-receptor blockers, high-dose trimethoprim-sulfamethoxazole.\nDecreased in: Low potassium intake, prolonged vomiting or diarrhea, renal tubular acidosis types I and II, hyperaldosteronism, Cushing syndrome, osmotic diuresis (eg, hyperglycemia), alkalosis, (hypokalemic) familial periodic paralysis, trauma (transient), subarachnoid hemorrhage, genetic hypokalemic salt-losing tubulopathies such as Gitelman syndrome (familial hypokalemia- hypocalcemia-hypomagnesemia).\nDrugs: adrenergic agents (isoproterenol), diuretics.\n\nComments\nSpurious hyperkalemia can occur with hemolysis of a sample, delayed separation of serum from erythrocytes, prolonged fist clenching during blood drawing, and prolonged tourniquet application.",
    "interpretation": "Physiologic Basis\nPotassium is predominantly an intracellular cation whose plasma level is regulated by renal excretion. Elevated or depressed potassium concentrations interfere with muscle contraction.\n\nInterpretation\nIncreased in: Massive hemolysis, severe tissue damage, rhabdomyolysis, acidosis, dehydration, acute or chronic renal failure, Addison disease, renal tubular acidosis type IV (hyporeninemic) hypoaldosteronism, (hyperkalemic) familial periodic paralysis, exercise (transient).\nDrugs: potassium salts, potassium-sparing diuretics (eg, spironolactone, triamterene, eplerenone), nonsteroidal anti-inflammatory drugs, β-blockers, ACE inhibitors, ACE-receptor blockers, high-dose trimethoprim-sulfamethoxazole.\nDecreased in: Low potassium intake, prolonged vomiting or diarrhea, renal tubular acidosis types I and II, hyperaldosteronism, Cushing syndrome, osmotic diuresis (eg, hyperglycemia), alkalosis, (hypokalemic) familial periodic paralysis, trauma (transient), subarachnoid hemorrhage, genetic hypokalemic salt-losing tubulopathies such as Gitelman syndrome (familial hypokalemia- hypocalcemia-hypomagnesemia).\nDrugs: adrenergic agents (isoproterenol), diuretics.\n\nComments\nSpurious hyperkalemia can occur with hemolysis of a sample, delayed separation of serum from erythrocytes, prolonged fist clenching during blood drawing, and prolonged tourniquet application.",
    "parameters": [
      {
        "name": "Serum Potassium",
        "referenceRange": "3.5 - 5.1",
        "unit": "mmol/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Phosphorus",
    "title": "Serum Phosphorus (Inorganic Phosphate)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative assay measuring serum inorganic phosphorus (phosphate) to evaluate mineral and bone metabolism, parathyroid disorders, vitamin D status, and renal tubular function.",
    "notes": "Physiologic Basis\nThe plasma concentration of inorganic phosphate is determined by parathyroid gland function, action of vitamin D, intestinal absorption, renal function, bone metabolism, and nutrition. Serum phosphorus concentrations have a circadian rhythm (highest level in late morning, lowest in evening) and are subject to rapid change secondary to environmental factors such as diet (carbohydrate), phosphate binding antacids, and fluctuations in GH, insulin, and renal function.\n\nInterpretation\nIncreased in:\nRenal failure, Massive blood transfusion, hypoparathyroidism, neoplasms, adrenal insufficiency, hypervitaminosis D, osteolytic metastases to bone, leukemia, Pseudohypoparathyroidism, Cirrhosis, lactic acidosis.\nDrugs: phosphate infusions or enemas, anabolic steroids, ergocalciferol, furosemide, hydrochlorothiazide, clonidine, verapamil, potassium supplements\n\nDecreased in:\nHyperparathyroidism, hypovitaminosis D, starvation or cachexia, refeeding syndrome, bone marrow transplantation, GH deficiency, chronic alcoholism, Severe diarrhea, acute pancreatitis, severe hypercalcemia, acid-base disturbances, hypokalemia, hemodialysis.\nDrugs: acetazolamide, phosphate-binding antacids, anticonvulsants, β-adrenergic agonists, catecholamines, estrogens, isoniazid, oral contraceptives, prolonged use of thiazides, glucose infusion, insulin therapy, salicylates (toxicity).",
    "interpretation": "Physiologic Basis\nThe plasma concentration of inorganic phosphate is determined by parathyroid gland function, action of vitamin D, intestinal absorption, renal function, bone metabolism, and nutrition. Serum phosphorus concentrations have a circadian rhythm (highest level in late morning, lowest in evening) and are subject to rapid change secondary to environmental factors such as diet (carbohydrate), phosphate binding antacids, and fluctuations in GH, insulin, and renal function.\n\nInterpretation\nIncreased in:\nRenal failure, Massive blood transfusion, hypoparathyroidism, neoplasms, adrenal insufficiency, hypervitaminosis D, osteolytic metastases to bone, leukemia, Pseudohypoparathyroidism, Cirrhosis, lactic acidosis.\nDrugs: phosphate infusions or enemas, anabolic steroids, ergocalciferol, furosemide, hydrochlorothiazide, clonidine, verapamil, potassium supplements\n\nDecreased in:\nHyperparathyroidism, hypovitaminosis D, starvation or cachexia, refeeding syndrome, bone marrow transplantation, GH deficiency, chronic alcoholism, Severe diarrhea, acute pancreatitis, severe hypercalcemia, acid-base disturbances, hypokalemia, hemodialysis.\nDrugs: acetazolamide, phosphate-binding antacids, anticonvulsants, β-adrenergic agonists, catecholamines, estrogens, isoniazid, oral contraceptives, prolonged use of thiazides, glucose infusion, insulin therapy, salicylates (toxicity).",
    "parameters": [
      {
        "name": "Serum Phosphorus",
        "referenceRange": "2.5 - 4.5",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum LDH",
    "title": "Serum LDH (Lactate Dehydrogenase)",
    "basePrice": 300,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube - Non-hemolyzed)",
    "turnaroundTime": "Same Day",
    "description": "Enzyme quantitative assay measuring serum lactate dehydrogenase (LDH) activity to assess tissue turnover, hemolysis, myocardial/pulmonary injury, and monitor hematologic malignancies/lymphomas.",
    "notes": "Clinical Significance & Interpretation (Serum Lactate Dehydrogenase - LDH):\nLactate dehydrogenase (LDH) is an intracellular zinc metalloenzyme that catalyzes the reversible interconversion of lactate and pyruvate in anaerobic glycolysis. LDH is widely distributed in nearly all major body tissues, with highest concentrations in myocardium, erythrocytes, liver, kidneys, skeletal muscle, lungs, and lymphoreticular system.\n\n1. Reference Interval:\n• Normal Serum LDH: 140 - 280 U/L\n\n2. Clinical Implications of Elevated Serum LDH (> 280 U/L):\n• Hematologic & Hemolytic Disorders: Intravascular hemolysis, megaloblastic anemia (B12 / folate deficiency — marked elevation due to ineffective erythropoiesis), sickle cell crisis, autoimmune hemolytic anemia, thrombotic thrombocytopenic purpura (TTP).\n• Malignancies & Tumor Marker Role: Non-Hodgkin lymphoma, Hodgkin lymphoma, acute and chronic leukemias, germ cell tumors (seminoma, dysgerminoma), metastatic carcinoma, neuroblastoma, melanoma. Serum LDH correlates with overall tumor burden, growth kinetics, and cellular turnover.\n• Cardiac & Tissue Ischemia: Acute myocardial infarction (peaks at 48-72 hours, remains elevated 10-14 days), pulmonary embolism, renal infarction, mesenteric ischemia.\n• Hepatic & Muscle Pathology: Acute viral hepatitis, toxic/ischemic hepatitis, rhabdomyolysis, progressive muscular dystrophy, extensive polymyositis.\n• Infectious & Pulmonary Diseases: Severe pneumonia, Pneumocystis jirovecii pneumonia (PCP in immunocompromised patients), sepsis, severe COVID-19/ARDS (reflecting systemic inflammatory damage).\n\n3. Pre-analytical Considerations & Pitfalls:\n• Hemolysis: Erythrocytes contain ~150-fold higher LDH concentration than serum. Even minor in vitro hemolysis causes false elevation (spurious hyper-LDH).\n• Specimen Handling: Serum must be promptly separated from the clot. Avoid freezing/thawing or extreme temperatures.",
    "interpretation": "Clinical Significance & Interpretation (Serum Lactate Dehydrogenase - LDH):\nLactate dehydrogenase (LDH) is an intracellular zinc metalloenzyme that catalyzes the reversible interconversion of lactate and pyruvate in anaerobic glycolysis. LDH is widely distributed in nearly all major body tissues, with highest concentrations in myocardium, erythrocytes, liver, kidneys, skeletal muscle, lungs, and lymphoreticular system.\n\n1. Reference Interval:\n• Normal Serum LDH: 140 - 280 U/L\n\n2. Clinical Implications of Elevated Serum LDH (> 280 U/L):\n• Hematologic & Hemolytic Disorders: Intravascular hemolysis, megaloblastic anemia (B12 / folate deficiency — marked elevation due to ineffective erythropoiesis), sickle cell crisis, autoimmune hemolytic anemia, thrombotic thrombocytopenic purpura (TTP).\n• Malignancies & Tumor Marker Role: Non-Hodgkin lymphoma, Hodgkin lymphoma, acute and chronic leukemias, germ cell tumors (seminoma, dysgerminoma), metastatic carcinoma, neuroblastoma, melanoma. Serum LDH correlates with overall tumor burden, growth kinetics, and cellular turnover.\n• Cardiac & Tissue Ischemia: Acute myocardial infarction (peaks at 48-72 hours, remains elevated 10-14 days), pulmonary embolism, renal infarction, mesenteric ischemia.\n• Hepatic & Muscle Pathology: Acute viral hepatitis, toxic/ischemic hepatitis, rhabdomyolysis, progressive muscular dystrophy, extensive polymyositis.\n• Infectious & Pulmonary Diseases: Severe pneumonia, Pneumocystis jirovecii pneumonia (PCP in immunocompromised patients), sepsis, severe COVID-19/ARDS (reflecting systemic inflammatory damage).\n\n3. Pre-analytical Considerations & Pitfalls:\n• Hemolysis: Erythrocytes contain ~150-fold higher LDH concentration than serum. Even minor in vitro hemolysis causes false elevation (spurious hyper-LDH).\n• Specimen Handling: Serum must be promptly separated from the clot. Avoid freezing/thawing or extreme temperatures.",
    "parameters": [
      {
        "name": "Serum LDH",
        "referenceRange": "140 - 280",
        "unit": "U/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum IgM",
    "title": "Serum IgM (Immunoglobulin M)",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative nephelometric/turbidimetric immunoassay measuring serum Immunoglobulin M (IgM) to evaluate acute immune response, humoral immunodeficiencies, Waldenström macroglobulinemia, and congenital or autoimmune disorders.",
    "notes": "Clinical Significance & Interpretation (Serum Immunoglobulin M - IgM):\nImmunoglobulin M (IgM) is a high molecular weight pentameric antibody and the primary immunoglobulin synthesized during the early initial immune response to antigenic challenge. It provides early-phase protective humoral immunity against bacterial, viral, and parasitic bloodstream pathogens.\n\n1. Reference Interval:\n• Normal Serum IgM: 400 - 2,500 µg/mL (40 - 250 mg/dL)\n\n2. Clinical Implications of Elevated Serum IgM (> 2,500 µg/mL):\n• Monoclonal Gammopathy: Waldenström's macroglobulinemia (monoclonal IgM spike producing hyperviscosity syndrome), IgM-MGUS (Monoclonal Gammopathy of Undetermined Significance), non-Hodgkin lymphoma.\n• Acute & Recent Infections: Viral hepatitis (HAV, HBV, HCV), infectious mononucleosis (EBV), Cytomegalovirus (CMV), Mycoplasma pneumoniae, Toxoplasmosis, Rubella, acute bacterial bacteremia.\n• Autoimmune & Inflammatory Diseases: Primary biliary cholangitis (PBC / primary biliary cirrhosis - classic polyclonal IgM elevation), rheumatoid arthritis (rheumatoid factor is primarily IgM), systemic lupus erythematosus (SLE).\n• Congenital / Neonatal Infection: Elevated cord blood IgM indicates intrauterine congenital infection (TORCH panel pathogens).\n\n3. Clinical Implications of Decreased Serum IgM (< 400 µg/mL):\n• Primary Immunodeficiency Disorders: Selective IgM deficiency, Common Variable Immunodeficiency (CVID), severe combined immunodeficiency (SCID), X-linked agammaglobulinemia (Bruton's).\n• Secondary Hypogammaglobulinemia: Multiple myeloma (IgG/IgA types with suppressed non-involved IgM), chronic lymphocytic leukemia (CLL), amyloidosis, severe protein loss (nephrotic syndrome, protein-losing enteropathy), immunosuppressive/cytotoxic therapy.",
    "interpretation": "Clinical Significance & Interpretation (Serum Immunoglobulin M - IgM):\nImmunoglobulin M (IgM) is a high molecular weight pentameric antibody and the primary immunoglobulin synthesized during the early initial immune response to antigenic challenge. It provides early-phase protective humoral immunity against bacterial, viral, and parasitic bloodstream pathogens.\n\n1. Reference Interval:\n• Normal Serum IgM: 400 - 2,500 µg/mL (40 - 250 mg/dL)\n\n2. Clinical Implications of Elevated Serum IgM (> 2,500 µg/mL):\n• Monoclonal Gammopathy: Waldenström's macroglobulinemia (monoclonal IgM spike producing hyperviscosity syndrome), IgM-MGUS (Monoclonal Gammopathy of Undetermined Significance), non-Hodgkin lymphoma.\n• Acute & Recent Infections: Viral hepatitis (HAV, HBV, HCV), infectious mononucleosis (EBV), Cytomegalovirus (CMV), Mycoplasma pneumoniae, Toxoplasmosis, Rubella, acute bacterial bacteremia.\n• Autoimmune & Inflammatory Diseases: Primary biliary cholangitis (PBC / primary biliary cirrhosis - classic polyclonal IgM elevation), rheumatoid arthritis (rheumatoid factor is primarily IgM), systemic lupus erythematosus (SLE).\n• Congenital / Neonatal Infection: Elevated cord blood IgM indicates intrauterine congenital infection (TORCH panel pathogens).\n\n3. Clinical Implications of Decreased Serum IgM (< 400 µg/mL):\n• Primary Immunodeficiency Disorders: Selective IgM deficiency, Common Variable Immunodeficiency (CVID), severe combined immunodeficiency (SCID), X-linked agammaglobulinemia (Bruton's).\n• Secondary Hypogammaglobulinemia: Multiple myeloma (IgG/IgA types with suppressed non-involved IgM), chronic lymphocytic leukemia (CLL), amyloidosis, severe protein loss (nephrotic syndrome, protein-losing enteropathy), immunosuppressive/cytotoxic therapy.",
    "parameters": [
      {
        "name": "Serum IgM",
        "referenceRange": "400 - 2,500",
        "unit": "µg/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Electrolyte",
    "title": "Serum Electrolyte (Serum Electrolytes - Na+, K+)",
    "basePrice": 300,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Heparin Plasma (Plain / Gel / Lithium Heparin Tube)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative electrolyte panel measuring serum sodium and potassium concentrations to evaluate fluid-electrolyte balance, renal function, hydration status, and neuromuscular homeostasis.",
    "notes": "SERUM SODIUM (Na+):\nPhysiologic Basis\nSodium is the predominant extracellular cation. The serum sodium level is primarily determined by the volume status of the individual. Hyponatremia can be divided into hypovolemia, euvolemia, and hypervolemia categories.\n\nInterpretation\nIncreased in: Dehydration (excessive sweating, severe vomiting, or diarrhea), polyuria (diabetes mellitus, diabetes insipidus), hyperaldosteronism, inadequate water intake (coma, hypothalamic disease).\nDrugs: steroids, licorice, oral contraceptives.\nDecreased in: CHF, cirrhosis, vomiting, diarrhea, exercise, excessive sweating (with replacement of water but not salt, eg, marathon running), salt-losing nephropathy, adrenal insufficiency, nephrotic syndrome, water intoxication, syndrome of inappropriate antidiuretic hormone (SIADH), AIDS.\nDrugs: thiazides, diuretics, ACE inhibitors, chlorpropamide, carbamazepine, antidepressants (SSRI), antipsychotics.\n\nComments\nHyponatremia in a normovolemic patient with urine osmolality higher than serum (or plasma) osmolality suggests the possibility of SIADH, myxedema, hypopituitarism, or reset osmostat. Treatment of disorders of sodium balance relies on clinical assessment of the patient's extracellular fluid volume rather than the serum sodium.\n\n--------------------------------------------------\n\nSERUM POTASSIUM (K+):\nPhysiologic Basis\nPotassium is predominantly an intracellular cation whose plasma level is regulated by renal excretion. Elevated or depressed potassium concentrations interfere with muscle contraction.\n\nInterpretation\nIncreased in: Massive hemolysis, severe tissue damage, rhabdomyolysis, acidosis, dehydration, acute or chronic renal failure, Addison disease, renal tubular acidosis type IV (hyporeninemic) hypoaldosteronism, (hyperkalemic) familial periodic paralysis, exercise (transient).\nDrugs: potassium salts, potassium-sparing diuretics (eg, spironolactone, triamterene, eplerenone), nonsteroidal anti-inflammatory drugs, β-blockers, ACE inhibitors, ACE-receptor blockers, high-dose trimethoprim-sulfamethoxazole.\nDecreased in: Low potassium intake, prolonged vomiting or diarrhea, renal tubular acidosis types I and II, hyperaldosteronism, Cushing syndrome, osmotic diuresis (eg, hyperglycemia), alkalosis, (hypokalemic) familial periodic paralysis, trauma (transient), subarachnoid hemorrhage, genetic hypokalemic salt-losing tubulopathies such as Gitelman syndrome (familial hypokalemia- hypocalcemia-hypomagnesemia).\nDrugs: adrenergic agents (isoproterenol), diuretics.\n\nComments\nSpurious hyperkalemia can occur with hemolysis of a sample, delayed separation of serum from erythrocytes, prolonged fist clenching during blood drawing, and prolonged tourniquet placement. Very high white blood cell or platelet counts may cause spurious elevation of serum potassium, but plasma potassium levels are normal.",
    "interpretation": "SERUM SODIUM (Na+):\nPhysiologic Basis\nSodium is the predominant extracellular cation. The serum sodium level is primarily determined by the volume status of the individual. Hyponatremia can be divided into hypovolemia, euvolemia, and hypervolemia categories.\n\nInterpretation\nIncreased in: Dehydration (excessive sweating, severe vomiting, or diarrhea), polyuria (diabetes mellitus, diabetes insipidus), hyperaldosteronism, inadequate water intake (coma, hypothalamic disease).\nDrugs: steroids, licorice, oral contraceptives.\nDecreased in: CHF, cirrhosis, vomiting, diarrhea, exercise, excessive sweating (with replacement of water but not salt, eg, marathon running), salt-losing nephropathy, adrenal insufficiency, nephrotic syndrome, water intoxication, syndrome of inappropriate antidiuretic hormone (SIADH), AIDS.\nDrugs: thiazides, diuretics, ACE inhibitors, chlorpropamide, carbamazepine, antidepressants (SSRI), antipsychotics.\n\nComments\nHyponatremia in a normovolemic patient with urine osmolality higher than serum (or plasma) osmolality suggests the possibility of SIADH, myxedema, hypopituitarism, or reset osmostat. Treatment of disorders of sodium balance relies on clinical assessment of the patient's extracellular fluid volume rather than the serum sodium.\n\n--------------------------------------------------\n\nSERUM POTASSIUM (K+):\nPhysiologic Basis\nPotassium is predominantly an intracellular cation whose plasma level is regulated by renal excretion. Elevated or depressed potassium concentrations interfere with muscle contraction.\n\nInterpretation\nIncreased in: Massive hemolysis, severe tissue damage, rhabdomyolysis, acidosis, dehydration, acute or chronic renal failure, Addison disease, renal tubular acidosis type IV (hyporeninemic) hypoaldosteronism, (hyperkalemic) familial periodic paralysis, exercise (transient).\nDrugs: potassium salts, potassium-sparing diuretics (eg, spironolactone, triamterene, eplerenone), nonsteroidal anti-inflammatory drugs, β-blockers, ACE inhibitors, ACE-receptor blockers, high-dose trimethoprim-sulfamethoxazole.\nDecreased in: Low potassium intake, prolonged vomiting or diarrhea, renal tubular acidosis types I and II, hyperaldosteronism, Cushing syndrome, osmotic diuresis (eg, hyperglycemia), alkalosis, (hypokalemic) familial periodic paralysis, trauma (transient), subarachnoid hemorrhage, genetic hypokalemic salt-losing tubulopathies such as Gitelman syndrome (familial hypokalemia- hypocalcemia-hypomagnesemia).\nDrugs: adrenergic agents (isoproterenol), diuretics.\n\nComments\nSpurious hyperkalemia can occur with hemolysis of a sample, delayed separation of serum from erythrocytes, prolonged fist clenching during blood drawing, and prolonged tourniquet placement. Very high white blood cell or platelet counts may cause spurious elevation of serum potassium, but plasma potassium levels are normal.",
    "parameters": [
      {
        "name": "Serum Sodium",
        "referenceRange": "136 - 146",
        "unit": "mmol/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Serum Potassium",
        "referenceRange": "3.5 - 5.1",
        "unit": "mmol/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Albumin",
    "title": "Serum Albumin",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative assay measuring serum albumin concentration to evaluate hepatic synthesis capacity, nutritional status, renal protein-losing nephropathies, and oncotic pressure regulation.",
    "notes": "Physiologic Basis\nMajor components of plasma proteins are influenced by nutritional state, hepatic function, renal function, and various diseases. It is a major binding protein, although there are more than 50 different genetic variants (alloalbumins), only occasionally does a mutation cause abnormal binding (eg, in familial dysalbuminemic hyperthyroxinemia).\n\nInterpretation\nIncreased in: Dehydration, shock, hemoconcentration.\nDecreased in: Decreased hepatic synthesis (chronic liver disease, malnutrition, malabsorption, malignancy, congenital analbuminemia [rare]). Increased losses (nephrotic syndrome, burns, trauma, hemorrhage with fluid replacement, fistulas, enteropathy, acute or chronic glomerulonephritis). Hemodilution (pregnancy, CHF). Drugs: estrogens.\n\nComments\nSerum albumin indicates severity in chronic liver disease.\nUseful in nutritional assessment if there is no impairment in production or increased loss of albumin. Independent risk factor for all-cause mortality in the elderly (age >70) and for complications in hospitalized and post-surgical patients.\nThere is a 10% reduction in serum albumin level in late pregnancy (related to hemodilution).",
    "interpretation": "Physiologic Basis\nMajor components of plasma proteins are influenced by nutritional state, hepatic function, renal function, and various diseases. It is a major binding protein, although there are more than 50 different genetic variants (alloalbumins), only occasionally does a mutation cause abnormal binding (eg, in familial dysalbuminemic hyperthyroxinemia).\n\nInterpretation\nIncreased in: Dehydration, shock, hemoconcentration.\nDecreased in: Decreased hepatic synthesis (chronic liver disease, malnutrition, malabsorption, malignancy, congenital analbuminemia [rare]). Increased losses (nephrotic syndrome, burns, trauma, hemorrhage with fluid replacement, fistulas, enteropathy, acute or chronic glomerulonephritis). Hemodilution (pregnancy, CHF). Drugs: estrogens.\n\nComments\nSerum albumin indicates severity in chronic liver disease.\nUseful in nutritional assessment if there is no impairment in production or increased loss of albumin. Independent risk factor for all-cause mortality in the elderly (age >70) and for complications in hospitalized and post-surgical patients.\nThere is a 10% reduction in serum albumin level in late pregnancy (related to hemodilution).",
    "parameters": [
      {
        "name": "Serum Albumin",
        "referenceRange": "3.5 - 5.2",
        "unit": "g/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Alkaline Phosphatase",
    "title": "Serum Alkaline Phosphatase (ALP)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Enzyme assay measuring serum alkaline phosphatase (ALP) activity to evaluate hepatobiliary obstructive disorders, bone diseases with osteoblastic activity, and monitor bone metastases.",
    "notes": "Physiologic Basis:\nAlkaline phosphatases are primarily found in liver, bone, intestines, kidney, and placenta. Test is used to detect liver disease and bone disorders.\n\nInterpretation:\nIncreased in: Obstructive hepatobiliary disease, bone disease (physiologic bone growth, Paget disease, osteomalacia, osteogenic sarcoma, bone metastases), hyperparathyroidism, rickets, benign familial hyperphosphatasemia, pregnancy (third trimester), GI disease (perforated ulcer or bowel infarct), hepatotoxic drugs.\nDecreased in: Hypophosphatasia.\n\nComment:\nAlkaline phosphatase performs well in measuring the extent of bone metastases in prostate cancer. Alkaline phosphatase isoenzyme separation by electrophoresis or differential heat inactivation is unreliable. Use γ-glutamyl transpeptidase, which increases in hepatobiliary disease but not in bone disease, to infer the origin of increased alkaline phosphatase.",
    "interpretation": "Physiologic Basis:\nAlkaline phosphatases are primarily found in liver, bone, intestines, kidney, and placenta. Test is used to detect liver disease and bone disorders.\n\nInterpretation:\nIncreased in: Obstructive hepatobiliary disease, bone disease (physiologic bone growth, Paget disease, osteomalacia, osteogenic sarcoma, bone metastases), hyperparathyroidism, rickets, benign familial hyperphosphatasemia, pregnancy (third trimester), GI disease (perforated ulcer or bowel infarct), hepatotoxic drugs.\nDecreased in: Hypophosphatasia.\n\nComment:\nAlkaline phosphatase performs well in measuring the extent of bone metastases in prostate cancer. Alkaline phosphatase isoenzyme separation by electrophoresis or differential heat inactivation is unreliable. Use γ-glutamyl transpeptidase, which increases in hepatobiliary disease but not in bone disease, to infer the origin of increased alkaline phosphatase.",
    "parameters": [
      {
        "name": "Serum Alkaline Phosphatase",
        "referenceRange": "30 - 120",
        "unit": "U/l",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Amylase",
    "title": "Serum Amylase",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Enzyme quantitative assay measuring serum amylase activity to diagnose and monitor acute pancreatitis, pancreatic duct obstruction, and other abdominal/salivary pathologies.",
    "notes": "Physiological basis\nAmylase hydrolyzes complex carbohydrates. Serum amylase is derived primarily from pancreas and salivary glands and is increased with inflammation or obstruction of these glands. Other tissues have some amylase activity, including ovaries, small and large intestine, and skeletal muscle.\n\nInterpretation\nIncreased in:\nAcute pancreatitis (70–95%), pancreatic pseudocyst, pancreatic duct obstruction (cholecystitis, choledocholithiasis, pancreatic carcinoma, stone, stricture, duct sphincter spasm), bowel obstruction and infarction, mumps, parotitis, diabetic keto- acidosis, penetrating peptic ulcer, peritonitis, ruptured ectopic pregnancy, macroamylasemia.\nDrugs: azathioprine, hydrochlorothiazide.\n\nDecreased in:\nPancreatic insufficiency, cystic fibrosis. Usually normal or low in chronic pancreatitis.\n\nComments\nMacroamylasemia is indicated by high serum but low urine amylase. Serum or plasma lipase is an alternative test for acute pancreatitis. It has clinical sensitivity equivalent to that of amylase but with better specificity.",
    "interpretation": "Physiological basis\nAmylase hydrolyzes complex carbohydrates. Serum amylase is derived primarily from pancreas and salivary glands and is increased with inflammation or obstruction of these glands. Other tissues have some amylase activity, including ovaries, small and large intestine, and skeletal muscle.\n\nInterpretation\nIncreased in:\nAcute pancreatitis (70–95%), pancreatic pseudocyst, pancreatic duct obstruction (cholecystitis, choledocholithiasis, pancreatic carcinoma, stone, stricture, duct sphincter spasm), bowel obstruction and infarction, mumps, parotitis, diabetic keto- acidosis, penetrating peptic ulcer, peritonitis, ruptured ectopic pregnancy, macroamylasemia.\nDrugs: azathioprine, hydrochlorothiazide.\n\nDecreased in:\nPancreatic insufficiency, cystic fibrosis. Usually normal or low in chronic pancreatitis.\n\nComments\nMacroamylasemia is indicated by high serum but low urine amylase. Serum or plasma lipase is an alternative test for acute pancreatitis. It has clinical sensitivity equivalent to that of amylase but with better specificity.",
    "parameters": [
      {
        "name": "Serum Amylase",
        "referenceRange": "0 - 120",
        "unit": "IU/L",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Bilirubin (Direct)",
    "title": "Serum Bilirubin (Direct) (Conjugated Bilirubin)",
    "basePrice": 120,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube - Light Protected)",
    "turnaroundTime": "Same Day",
    "description": "Photometric diazo assay measuring direct (conjugated) serum bilirubin to differentiate intrahepatic and post-hepatic obstructive jaundice from pre-hepatic hemolytic hyperbilirubinemia.",
    "notes": "Physiological basis\nBilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin (heme). The majority of bilirubin comes from senescent red cells. It is biotransformed in the liver and excreted in bile and urine. Some conjugated bilirubin is bound to serum albumin, so-called D (delta) bilirubin.\n\nInterpretation\nIncreased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.\n\nComments\nAssay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin. Only conjugated bilirubin appears in the urine, and it is indicative of liver disease and biliary tract obstruction. Hemolysis is associated with increased unconjugated bilirubin. Unbound (free) serum or plasma bilirubin level correlates better than total bilirubin with CNS bilirubin concentrations and bilirubin encephalopathy (kernicterus) in newborn jaundice.",
    "interpretation": "Physiological basis\nBilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin (heme). The majority of bilirubin comes from senescent red cells. It is biotransformed in the liver and excreted in bile and urine. Some conjugated bilirubin is bound to serum albumin, so-called D (delta) bilirubin.\n\nInterpretation\nIncreased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.\n\nComments\nAssay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin. Only conjugated bilirubin appears in the urine, and it is indicative of liver disease and biliary tract obstruction. Hemolysis is associated with increased unconjugated bilirubin. Unbound (free) serum or plasma bilirubin level correlates better than total bilirubin with CNS bilirubin concentrations and bilirubin encephalopathy (kernicterus) in newborn jaundice.",
    "parameters": [
      {
        "name": "Serum Bilirubin (Direct)",
        "referenceRange": "0 - 0.3",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Bilirubin (Indirect)",
    "title": "Serum Bilirubin (Indirect) (Unconjugated Bilirubin)",
    "basePrice": 120,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube - Light Protected)",
    "turnaroundTime": "Same Day",
    "description": "Quantitative assay calculating indirect (unconjugated) serum bilirubin (Total Bilirubin minus Direct Bilirubin) to evaluate hemolytic anemias, neonatal physiologic jaundice, and congenital glucuronyl transferase deficiencies.",
    "notes": "Physiological basis\nBilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin (heme). The majority of bilirubin comes from senescent red cells. It is biotransformed in the liver and excreted in bile and urine. Some conjugated bilirubin is bound to serum albumin, so-called D (delta) bilirubin.\n\nInterpretation\nIncreased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.\n\nComments\nAssay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin. Only conjugated bilirubin appears in the urine, and it is indicative of liver disease and biliary tract obstruction. Hemolysis is associated with increased unconjugated bilirubin. Unbound (free) serum or plasma bilirubin level correlates better than total bilirubin with CNS bilirubin concentrations and bilirubin encephalopathy (kernicterus) in newborn jaundice.",
    "interpretation": "Physiological basis\nBilirubin is the orange-yellow pigment derived from the breakdown of hemoglobin (heme). The majority of bilirubin comes from senescent red cells. It is biotransformed in the liver and excreted in bile and urine. Some conjugated bilirubin is bound to serum albumin, so-called D (delta) bilirubin.\n\nInterpretation\nIncreased in: Acute or chronic hepatitis, cirrhosis, biliary tract obstruction, toxic hepatitis, neonatal jaundice (neonatal hyperbilirubinemia), congenital liver enzyme abnormalities (Dubin-Johnson, Rotor, Gilbert, Crigler-Najjar syndromes), fasting, hemolytic disorders. Hepatotoxic drugs.\n\nComments\nAssay of total bilirubin includes conjugated (direct) and unconjugated (indirect) bilirubin. Only conjugated bilirubin appears in the urine, and it is indicative of liver disease and biliary tract obstruction. Hemolysis is associated with increased unconjugated bilirubin. Unbound (free) serum or plasma bilirubin level correlates better than total bilirubin with CNS bilirubin concentrations and bilirubin encephalopathy (kernicterus) in newborn jaundice.",
    "parameters": [
      {
        "name": "Serum Bilirubin (Indirect)",
        "referenceRange": "0.2 - 1",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Calcium",
    "title": "Serum Calcium (Total Calcium)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Colorimetric assay measuring total serum calcium (bound and ionized) to evaluate parathyroid function, bone metabolism, vitamin D disorders, and hypercalcemia of malignancy.",
    "notes": "Physiological basis\nSerum calcium is the sum of ionized calcium plus complex calcium and calcium bound to proteins (mostly albumin). Level of ionized calcium is regulated by parathyroid hormone and vitamin D.\n\nInterpretation\nCommon causes of Hypocalcemia:\n1. Chronic renal failure\n2. Hypomagnesemia\n3. Hypoalbuminemia\n\nCauses of Hypercalcemia:\n1. Increased intestinal absorption (vitamin d intoxication)\n2. Increased skeletal resorption\n3. Primary hyperparathyroidism\n\nPrimary hyperparathyroidism and malignancy account for 90–95% of cases of hypercalcemia.\n\nComments\nNeed to know serum albumin to interpret calcium level. For every decrease in albumin by 1mg/dL, calcium should be corrected upward by 0.8 mg/dL. In 10% of patients with malignancies, hypercalcemia is attributable to coexistent hyperparathyroidism, suggesting that serum PTH levels should be measured at the initial presentation of all hypercalcemic patients.",
    "interpretation": "Physiological basis\nSerum calcium is the sum of ionized calcium plus complex calcium and calcium bound to proteins (mostly albumin). Level of ionized calcium is regulated by parathyroid hormone and vitamin D.\n\nInterpretation\nCommon causes of Hypocalcemia:\n1. Chronic renal failure\n2. Hypomagnesemia\n3. Hypoalbuminemia\n\nCauses of Hypercalcemia:\n1. Increased intestinal absorption (vitamin d intoxication)\n2. Increased skeletal resorption\n3. Primary hyperparathyroidism\n\nPrimary hyperparathyroidism and malignancy account for 90–95% of cases of hypercalcemia.\n\nComments\nNeed to know serum albumin to interpret calcium level. For every decrease in albumin by 1mg/dL, calcium should be corrected upward by 0.8 mg/dL. In 10% of patients with malignancies, hypercalcemia is attributable to coexistent hyperparathyroidism, suggesting that serum PTH levels should be measured at the initial presentation of all hypercalcemic patients.",
    "parameters": [
      {
        "name": "Serum Calcium",
        "referenceRange": "8.8 - 10.6",
        "unit": "mg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Cortisol",
    "title": "Serum Cortisol (Morning Cortisol)",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube - Morning 8 AM preferred)",
    "turnaroundTime": "Same Day",
    "description": "Chemiluminescent immunoassay (CLIA) measuring serum cortisol levels to diagnose adrenal dysfunction, Cushing syndrome, Addison disease, and secondary adrenocortical insufficiency.",
    "notes": "Physiological basis\nCortisol is the major glucocorticoid hormone secreted by the adrenal cortex under the stimulation of pituitary ACTH. Cortisol displays a marked diurnal / circadian rhythm, with highest levels in early morning (8:00 AM) and lowest levels around midnight. It plays a critical role in glucose metabolism, vascular reactivity, immune system suppression, and stress response.\n\nReference Ranges (Diurnal Variation):\n- Morning (7:00 AM - 9:00 AM): 5.27 - 22.45 µg/dl\n- Afternoon (3:00 PM - 5:00 PM): 3.0 - 16.0 µg/dl\n- Midnight: < 5.0 µg/dl\n\nInterpretation:\nIncreased in (Hypercortisolemia / Cushing's syndrome):\n- Cushing syndrome (pituitary ACTH-secreting adenoma - Cushing disease)\n- Adrenal adenoma or carcinoma (ACTH-independent)\n- Ectopic ACTH secretion (e.g., small cell lung carcinoma)\n- Physiological stress (severe illness, trauma, surgery, sepsis, depression, acute hypoglycemia)\n- Pregnancy and oral contraceptive / estrogen therapy (increased cortisol-binding globulin)\n\nDecreased in (Hypocortisolemia / Adrenal Insufficiency):\n- Primary adrenal insufficiency (Addison disease - autoimmune adrenalitis, tuberculosis, adrenal hemorrhage)\n- Secondary adrenal insufficiency (pituitary ACTH deficiency, hypopituitarism)\n- Tertiary adrenal insufficiency (hypothalamic CRH deficiency, abrupt withdrawal of prolonged exogenous corticosteroid therapy)\n- Congenital adrenal hyperplasia (CAH - e.g., 21-hydroxylase deficiency)\n\nComments:\n- A single random cortisol level is often insufficient for definitive diagnosis of Cushing syndrome or Addison disease due to diurnal fluctuation and stress sensitivity.\n- Dynamic endocrine testing is recommended: Low-dose / High-dose Dexamethasone suppression test for hypercortisolism, and ACTH (Cosyntropin) stimulation test for suspected adrenal insufficiency.\n- Midnight salivary cortisol or 24-hour urinary free cortisol (UFC) provides high diagnostic specificity for loss of diurnal rhythm in Cushing syndrome.",
    "interpretation": "Physiological basis\nCortisol is the major glucocorticoid hormone secreted by the adrenal cortex under the stimulation of pituitary ACTH. Cortisol displays a marked diurnal / circadian rhythm, with highest levels in early morning (8:00 AM) and lowest levels around midnight. It plays a critical role in glucose metabolism, vascular reactivity, immune system suppression, and stress response.\n\nReference Ranges (Diurnal Variation):\n- Morning (7:00 AM - 9:00 AM): 5.27 - 22.45 µg/dl\n- Afternoon (3:00 PM - 5:00 PM): 3.0 - 16.0 µg/dl\n- Midnight: < 5.0 µg/dl\n\nInterpretation:\nIncreased in (Hypercortisolemia / Cushing's syndrome):\n- Cushing syndrome (pituitary ACTH-secreting adenoma - Cushing disease)\n- Adrenal adenoma or carcinoma (ACTH-independent)\n- Ectopic ACTH secretion (e.g., small cell lung carcinoma)\n- Physiological stress (severe illness, trauma, surgery, sepsis, depression, acute hypoglycemia)\n- Pregnancy and oral contraceptive / estrogen therapy (increased cortisol-binding globulin)\n\nDecreased in (Hypocortisolemia / Adrenal Insufficiency):\n- Primary adrenal insufficiency (Addison disease - autoimmune adrenalitis, tuberculosis, adrenal hemorrhage)\n- Secondary adrenal insufficiency (pituitary ACTH deficiency, hypopituitarism)\n- Tertiary adrenal insufficiency (hypothalamic CRH deficiency, abrupt withdrawal of prolonged exogenous corticosteroid therapy)\n- Congenital adrenal hyperplasia (CAH - e.g., 21-hydroxylase deficiency)\n\nComments:\n- A single random cortisol level is often insufficient for definitive diagnosis of Cushing syndrome or Addison disease due to diurnal fluctuation and stress sensitivity.\n- Dynamic endocrine testing is recommended: Low-dose / High-dose Dexamethasone suppression test for hypercortisolism, and ACTH (Cosyntropin) stimulation test for suspected adrenal insufficiency.\n- Midnight salivary cortisol or 24-hour urinary free cortisol (UFC) provides high diagnostic specificity for loss of diurnal rhythm in Cushing syndrome.",
    "parameters": [
      {
        "name": "Serum Cortisol",
        "referenceRange": "5.27 - 22.45",
        "unit": "µg/dl",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Rubella IgM",
    "title": "Rubella IgM (Rubella Virus Antibody IgM)",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Chemiluminescent immunoassay (CLIA) / ELISA for quantitative/semi-quantitative detection of IgM antibodies to Rubella virus to diagnose acute or recent German measles infection during pregnancy and congenital evaluation.",
    "notes": "Clinical Interpretation:\nRubella IgM antibodies indicate recent or acute infection with the Rubella virus (German measles) or recent vaccination. Rubella is an acute contagious viral infection characterized by rash, fever, and lymphadenopathy. Primary infection during early pregnancy poses high risk of Congenital Rubella Syndrome (CRS) resulting in congenital heart defects, cataracts, sensorineural deafness, and microcephaly.\n\nInterpretation Guide:\n- Negative (< 2.0 AU/mL): No detectable Rubella IgM antibodies. No evidence of acute or recent infection.\n- Equivocal / Grey Zone (2.0 - 3.0 AU/mL): Borderline antibody level. Repeat testing with a fresh sample collected 7-14 days later is recommended to assess seroconversion or rising titer.\n- Positive (> 3.0 AU/mL): Detectable Rubella IgM antibodies suggestive of acute or recent Rubella virus infection or recent immunization.",
    "interpretation": "Clinical Interpretation:\nRubella IgM antibodies indicate recent or acute infection with the Rubella virus (German measles) or recent vaccination. Rubella is an acute contagious viral infection characterized by rash, fever, and lymphadenopathy. Primary infection during early pregnancy poses high risk of Congenital Rubella Syndrome (CRS) resulting in congenital heart defects, cataracts, sensorineural deafness, and microcephaly.\n\nInterpretation Guide:\n- Negative (< 2.0 AU/mL): No detectable Rubella IgM antibodies. No evidence of acute or recent infection.\n- Equivocal / Grey Zone (2.0 - 3.0 AU/mL): Borderline antibody level. Repeat testing with a fresh sample collected 7-14 days later is recommended to assess seroconversion or rising titer.\n- Positive (> 3.0 AU/mL): Detectable Rubella IgM antibodies suggestive of acute or recent Rubella virus infection or recent immunization.",
    "parameters": [
      {
        "name": "Rubella IgM",
        "referenceRange": "Neg. < 2 AU/mL\nGrey Zone 2-3 AU/mL\nPos. > 3 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Scrub Typhus",
    "title": "Scrub Typhus (Orientia tsutsugamushi Antibodies - IgG & IgM)",
    "basePrice": 600,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Rapid immunochromatographic assay / ELISA for qualitative detection of IgG and IgM antibodies against Orientia tsutsugamushi in human serum to aid in the diagnosis of acute and recent Scrub Typhus.",
    "notes": "Clinical Interpretation:\nScrub Typhus (also known as bush typhus) is an acute febrile zoonotic disease caused by Orientia tsutsugamushi (formerly Rickettsia tsutsugamushi), transmitted to humans through the bite of infected larval mites (chiggers - Leptotrombidium deliense). Common clinical manifestations include acute high-grade fever, chills, severe headache, myalgia, generalized lymphadenopathy, maculopapular rash, and the characteristic diagnostic 'eschar' (cigarette-burn like lesion at the bite site).\n\nInterpretation Guide:\n- IgM Positive: Indicates acute / current or recent active Scrub Typhus infection. IgM antibodies appear by the end of the 1st week of fever and peak during the 2nd–3rd week.\n- IgG Positive: Indicates past exposure, secondary immune response, or convalescent phase. A 4-fold rise in IgG titer in paired sera confirms active infection.\n- IgM & IgG Negative: No detectable antibodies to Orientia tsutsugamushi. If clinical suspicion is high and sample was collected within the first 5-7 days of illness, repeat testing after 5-7 days is advised.",
    "interpretation": "Clinical Interpretation:\nScrub Typhus (also known as bush typhus) is an acute febrile zoonotic disease caused by Orientia tsutsugamushi (formerly Rickettsia tsutsugamushi), transmitted to humans through the bite of infected larval mites (chiggers - Leptotrombidium deliense). Common clinical manifestations include acute high-grade fever, chills, severe headache, myalgia, generalized lymphadenopathy, maculopapular rash, and the characteristic diagnostic 'eschar' (cigarette-burn like lesion at the bite site).\n\nInterpretation Guide:\n- IgM Positive: Indicates acute / current or recent active Scrub Typhus infection. IgM antibodies appear by the end of the 1st week of fever and peak during the 2nd–3rd week.\n- IgG Positive: Indicates past exposure, secondary immune response, or convalescent phase. A 4-fold rise in IgG titer in paired sera confirms active infection.\n- IgM & IgG Negative: No detectable antibodies to Orientia tsutsugamushi. If clinical suspicion is high and sample was collected within the first 5-7 days of illness, repeat testing after 5-7 days is advised.",
    "parameters": [
      {
        "name": "IgG",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Equivocal",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "IgM",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "fieldType": "Select",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Equivocal",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Chloride",
    "title": "Serum Chloride (Cl-)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Ion-selective electrode (ISE) assay measuring serum chloride concentration to assess electrolyte balance, acid-base equilibrium, hydration status, and renal tubular function.",
    "notes": "Physiological Basis\nChloride, the principal inorganic anion of extracellular fluid, is important in maintaining proper body water distribution, osmotic pressure, and normal acid-base balance. If chloride is lost (as HCl or NH4Cl), alkalosis ensues; if chloride is ingested or retained, acidosis ensues.\n\nInterpretation\nIncreased in: Renal failure, nephrotic syndrome, renal tubular acidosis, dehydration, overtreatment with saline, hyperparathyroidism, diabetes insipidus, metabolic acidosis from diarrhea (loss of HCO3–), respiratory alkalosis, hyperadrenocorticism.\nDrugs: acetazolamide (hyperchloremic acidosis), androgens, hydrochlorothiazide, salicylates (intoxication).\n\nDecreased in: Vomiting, diarrhea, gastrointestinal suction, renal failure combined with salt deprivation, over-treatment with diuretics, chronic respiratory acidosis, diabetic ketoacidosis, excessive sweating, SIADH, salt-losing nephropathy, acute intermittent porphyria, water intoxication, expansion of extracellular fluid volume, adrenal insufficiency, hyperaldosteronism, metabolic alkalosis.\nDrugs: chronic laxative or bicarbonate ingestion, corticosteroids, diuretics.\n\nComments\nTest is helpful in assessing normal and increased anion gap metabolic acidosis. It is somewhat helpful in distinguishing hypercalcemia due to primary hyperparathyroidism (high serum chloride) from that due to malignancy (normal serum chloride).",
    "interpretation": "Physiological Basis\nChloride, the principal inorganic anion of extracellular fluid, is important in maintaining proper body water distribution, osmotic pressure, and normal acid-base balance. If chloride is lost (as HCl or NH4Cl), alkalosis ensues; if chloride is ingested or retained, acidosis ensues.\n\nInterpretation\nIncreased in: Renal failure, nephrotic syndrome, renal tubular acidosis, dehydration, overtreatment with saline, hyperparathyroidism, diabetes insipidus, metabolic acidosis from diarrhea (loss of HCO3–), respiratory alkalosis, hyperadrenocorticism.\nDrugs: acetazolamide (hyperchloremic acidosis), androgens, hydrochlorothiazide, salicylates (intoxication).\n\nDecreased in: Vomiting, diarrhea, gastrointestinal suction, renal failure combined with salt deprivation, over-treatment with diuretics, chronic respiratory acidosis, diabetic ketoacidosis, excessive sweating, SIADH, salt-losing nephropathy, acute intermittent porphyria, water intoxication, expansion of extracellular fluid volume, adrenal insufficiency, hyperaldosteronism, metabolic alkalosis.\nDrugs: chronic laxative or bicarbonate ingestion, corticosteroids, diuretics.\n\nComments\nTest is helpful in assessing normal and increased anion gap metabolic acidosis. It is somewhat helpful in distinguishing hypercalcemia due to primary hyperparathyroidism (high serum chloride) from that due to malignancy (normal serum chloride).",
    "parameters": [
      {
        "name": "Serum Chloride",
        "referenceRange": "98 - 107",
        "unit": "mmol/l",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Rheumatoid Factor, RA (Quantitative)",
    "title": "Rheumatoid Factor, RA (Quantitative) (RF Quantitative)",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Plain / Gel Tube)",
    "turnaroundTime": "Same Day",
    "description": "Turbidimetric / Nephelometric immunoassay for quantitative determination of Rheumatoid Factor (IgM-class autoantibodies) in human serum to assist in diagnosis and prognosis of Rheumatoid Arthritis.",
    "notes": "Physiologic Basis\nRheumatoid factor (RF) consists of heterogeneous autoantibodies usually of the IgM class that react against the Fc region of human IgG. Most methods detect only IgM-class RF.\n\nInterpretation\nPositive in: Rheumatoid arthritis (75–90%), Sjögren syndrome (80–90%), scleroderma, dermatomyositis, SLE (30%), sarcoidosis, Waldenström macroglobulinemia, chronic infection.\nDrugs: methyldopa, others.\nLow-titers of RF (eg, ≤1:80) are questionable and can be found in healthy older patients (20%), in 1–4% of normal individuals, and in a variety of acute immune responses (eg, viral infections, including infectious mononucleosis and viral hepatitis), chronic bacterial infections (tuberculosis, leprosy, subacute infective endocarditis), and chronic active hepatitis.\n\nComments\nRheumatoid factor can be useful in differentiating rheumatoid arthritis from other chronic inflammatory arthritides. However, a positive RF test is only one of several criteria needed to make the diagnosis of rheumatoid arthritis.\nRF must be ordered selectively because its predictive value is low (34%) if it is used as a screening test. The test has poor positive predictive value because of its lack of specificity. The subset of patients with seronegative rheumatic disease limits its sensitivity and negative predictive value.",
    "interpretation": "Physiologic Basis\nRheumatoid factor (RF) consists of heterogeneous autoantibodies usually of the IgM class that react against the Fc region of human IgG. Most methods detect only IgM-class RF.\n\nInterpretation\nPositive in: Rheumatoid arthritis (75–90%), Sjögren syndrome (80–90%), scleroderma, dermatomyositis, SLE (30%), sarcoidosis, Waldenström macroglobulinemia, chronic infection.\nDrugs: methyldopa, others.\nLow-titers of RF (eg, ≤1:80) are questionable and can be found in healthy older patients (20%), in 1–4% of normal individuals, and in a variety of acute immune responses (eg, viral infections, including infectious mononucleosis and viral hepatitis), chronic bacterial infections (tuberculosis, leprosy, subacute infective endocarditis), and chronic active hepatitis.\n\nComments\nRheumatoid factor can be useful in differentiating rheumatoid arthritis from other chronic inflammatory arthritides. However, a positive RF test is only one of several criteria needed to make the diagnosis of rheumatoid arthritis.\nRF must be ordered selectively because its predictive value is low (34%) if it is used as a screening test. The test has poor positive predictive value because of its lack of specificity. The subset of patients with seronegative rheumatic disease limits its sensitivity and negative predictive value.",
    "parameters": [
      {
        "name": "Rheumatoid Factor, RA (Quantitative)",
        "referenceRange": "0 - 20",
        "unit": "IU/mL",
        "gender": "Both",
        "fieldType": "Number",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "HbA1c (Glycosylated Hemoglobin)",
    "title": "HbA1c (Glycosylated Hemoglobin)",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "4 Hours",
    "description": "Quantitative measurement of HbA1c (Glycated Hemoglobin) and Estimated Average Glucose (eAG) to evaluate long-term glycemic control.",
    "notes": "Interpretation as per American Diabetes Association (ADA) Guidelines\n\nReference Group | Non-Diabetic adults >= 18 years | At Risk (Prediabetes) | Diagnosing Diabetes | Therapeutic goals for glycemic control\nHbA1c in % | 4.0-5.6 | 5.7-6.4 | >= 6.5 | <7.0\n\nClinical significance:\nHemoglobin A1c (HbA1c) level reflects the mean glucose concentration over the previous period (approximately 8-12 weeks). The following ranges may be used for interpretation of results. However, factors such as duration of diabetes, adherence to therapy and the age of the patient should also be considered in assessing the degree of blood glucose control.\n\nHaemoglobin A1c (%) NSGP | mmol/mol/IFCC Unit | eAG (mg/dl) | Degree of Glucose Control Unit\n>8 | >63.9 | >183 | Action Suggested*\n7-8 | 53.0 - 63.9 | 154-183 | Fair Control\n<7 | <63.9 | <154 | Goal**\n6-7 | 42.1 - 63.9 | 126-154 | Near-normal glycemia\n<6 | <42.1 | <126 | Non-Diabetic level\n\n*High risk of developing long term complications such as Retinopathy, Nephropathy, Neuropathy etc.\n\n**Some danger of hypoglycemic reaction in Type 1 diabetics. Some glucose intolerant individuals and \"subclinical\" diabetics may demonstrate HbA1c levels in this area.",
    "interpretation": "Interpretation as per American Diabetes Association (ADA) Guidelines\n\nReference Group | Non-Diabetic adults >= 18 years | At Risk (Prediabetes) | Diagnosing Diabetes | Therapeutic goals for glycemic control\nHbA1c in % | 4.0-5.6 | 5.7-6.4 | >= 6.5 | <7.0\n\nClinical significance:\nHemoglobin A1c (HbA1c) level reflects the mean glucose concentration over the previous period (approximately 8-12 weeks). The following ranges may be used for interpretation of results. However, factors such as duration of diabetes, adherence to therapy and the age of the patient should also be considered in assessing the degree of blood glucose control.\n\nHaemoglobin A1c (%) NSGP | mmol/mol/IFCC Unit | eAG (mg/dl) | Degree of Glucose Control Unit\n>8 | >63.9 | >183 | Action Suggested*\n7-8 | 53.0 - 63.9 | 154-183 | Fair Control\n<7 | <63.9 | <154 | Goal**\n6-7 | 42.1 - 63.9 | 126-154 | Near-normal glycemia\n<6 | <42.1 | <126 | Non-Diabetic level\n\n*High risk of developing long term complications such as Retinopathy, Nephropathy, Neuropathy etc.\n\n**Some danger of hypoglycemic reaction in Type 1 diabetics. Some glucose intolerant individuals and \"subclinical\" diabetics may demonstrate HbA1c levels in this area.",
    "parameters": [
      {
        "name": "HbA1c",
        "referenceRange": "4.0 - 5.6",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Estimated average glucose",
        "referenceRange": "< 126",
        "unit": "mg/dL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "BT & CT",
    "title": "BT & CT",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Capillary Blood / Whole Blood",
    "turnaroundTime": "1 Hour",
    "description": "Estimation of Bleeding Time (BT) and Clotting Time (CT) to assess primary and secondary hemostatic function.",
    "notes": "The bleeding time test assesses primary hemostasis (vascular and platelet components) and is dependent on adequate functioning of platelets and blood vessels.\n\nCauses of prolongation of bleeding time:\n1. Thrombocytopenia\n2. Disorders of platelet function\n3. Von Willebrand disease\n4. Disorders of blood vessels\n\nClotting time measures the time required for the blood to clot in a glass test tube kept at 37°C. Prolongation of clotting time only occurs in severe deficiency of a clotting factor and is normal in mild or moderate deficiency.\nNote: Recommended test is Prothrombin Time (PT) and Activated Partial Thromboplastin time (APTT)",
    "interpretation": "The bleeding time test assesses primary hemostasis (vascular and platelet components) and is dependent on adequate functioning of platelets and blood vessels.\n\nCauses of prolongation of bleeding time:\n1. Thrombocytopenia\n2. Disorders of platelet function\n3. Von Willebrand disease\n4. Disorders of blood vessels\n\nClotting time measures the time required for the blood to clot in a glass test tube kept at 37°C. Prolongation of clotting time only occurs in severe deficiency of a clotting factor and is normal in mild or moderate deficiency.\nNote: Recommended test is Prothrombin Time (PT) and Activated Partial Thromboplastin time (APTT)",
    "parameters": [
      {
        "name": "Bleeding Time",
        "referenceRange": "2 - 7",
        "unit": "min",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Clotting Time",
        "referenceRange": "4 - 9",
        "unit": "min",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Complete Blood Count (CBC)",
    "title": "Complete Blood Count (CBC)",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Complete Blood Count (CBC) including Automated Differential Leucocyte Count and Red Blood Cell Indices with auto-calculation.",
    "notes": "Clinical Notes:\nA complete blood count (CBC) is used to evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia. There have been some reports of WBC and platelet counts being lower in venous blood than in capillary blood samples, although still within these reference ranges.\n\nPossible causes of abnormal parameters:\n\n | High | Low\nRBC, Hb, or HCT | Dehydration, polycythemia, shock, chronic hypoxia | Anemia, thalassemia, and other hemoglobinopathies\nMCV | Macrocytic anemia, liver disease | Microcytic anemia\nWBC | Acute stress, infection, malignancies | Sepsis, marrow hypoplasia\nPlatelets | Risk of thrombosis | Risk of bleeding",
    "interpretation": "Clinical Notes:\nA complete blood count (CBC) is used to evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia. There have been some reports of WBC and platelet counts being lower in venous blood than in capillary blood samples, although still within these reference ranges.\n\nPossible causes of abnormal parameters:\n\n | High | Low\nRBC, Hb, or HCT | Dehydration, polycythemia, shock, chronic hypoxia | Anemia, thalassemia, and other hemoglobinopathies\nMCV | Macrocytic anemia, liver disease | Microcytic anemia\nWBC | Acute stress, infection, malignancies | Sepsis, marrow hypoplasia\nPlatelets | Risk of thrombosis | Risk of bleeding",
    "parameters": [
      {
        "name": "Hemoglobin",
        "referenceRange": "13 - 17",
        "unit": "g/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total Leukocyte Count",
        "referenceRange": "4,800 - 10,800",
        "unit": "cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Neutrophils",
        "group": "Differential Leucocyte Count",
        "referenceRange": "40 - 80",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Lymphocyte",
        "group": "Differential Leucocyte Count",
        "referenceRange": "20 - 40",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Eosinophils",
        "group": "Differential Leucocyte Count",
        "referenceRange": "1 - 6",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Monocytes",
        "group": "Differential Leucocyte Count",
        "referenceRange": "2 - 10",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Basophils",
        "group": "Differential Leucocyte Count",
        "referenceRange": "< 2",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Platelet Count",
        "referenceRange": "1.5 - 4.1",
        "unit": "lakhs/cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total RBC Count",
        "referenceRange": "4.5 - 5.5",
        "unit": "million/cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Hematocrit Value, Hct",
        "referenceRange": "40 - 50",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Corpuscular Volume, MCV",
        "referenceRange": "83 - 101",
        "unit": "fL",
        "gender": "Both",
        "formula": "Formula: MCV = (Hct * 10) / RBC in millions",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Cell Haemoglobin, MCH",
        "referenceRange": "27 - 32",
        "unit": "Pg",
        "gender": "Both",
        "formula": "Formula: MCH = (Hb * 10) / RBC in millions",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Cell Haemoglobin CON, MCHC",
        "referenceRange": "31.5 - 34.5",
        "unit": "%",
        "gender": "Both",
        "formula": "Formula: MCHC = (Hb * 100) / Hct",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Platelet Volume, MPV (Optional)",
        "referenceRange": "6.5 - 12",
        "unit": "fL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "R.D.W. - SD (Optional)",
        "referenceRange": "39 - 46",
        "unit": "fL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "R.D.W. - CV (Optional)",
        "referenceRange": "11.6 - 14",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "P-LCR (Optional)",
        "referenceRange": "19.7 - 42.4",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "P.D.W. (Optional)",
        "referenceRange": "9.6 - 15.2",
        "unit": "fL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "CBC (with absolute counts)",
    "title": "CBC (with absolute counts)",
    "basePrice": 400,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Complete Blood Count (CBC) with Absolute Leukocyte Counts and Red Blood Cell Indices with auto-calculation.",
    "notes": "Clinical Notes:\nA complete blood count (CBC) is used to evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia. There have been some reports of WBC and platelet counts being lower in venous blood than in capillary blood samples, although still within these reference ranges.\n\nPossible causes of abnormal parameters:\n\n | High | Low\nRBC, Hb, or HCT | Dehydration, polycythemia, shock, chronic hypoxia | Anemia, thalassemia, and other hemoglobinopathies\nMCV | Macrocytic anemia, liver disease | Microcytic anemia\nWBC | Acute stress, infection, malignancies | Sepsis, marrow hypoplasia\nPlatelets | Risk of thrombosis | Risk of bleeding",
    "interpretation": "Clinical Notes:\nA complete blood count (CBC) is used to evaluate overall health and detect a wide range of disorders, including anemia, infection, and leukemia. There have been some reports of WBC and platelet counts being lower in venous blood than in capillary blood samples, although still within these reference ranges.\n\nPossible causes of abnormal parameters:\n\n | High | Low\nRBC, Hb, or HCT | Dehydration, polycythemia, shock, chronic hypoxia | Anemia, thalassemia, and other hemoglobinopathies\nMCV | Macrocytic anemia, liver disease | Microcytic anemia\nWBC | Acute stress, infection, malignancies | Sepsis, marrow hypoplasia\nPlatelets | Risk of thrombosis | Risk of bleeding",
    "parameters": [
      {
        "name": "Hemoglobin",
        "referenceRange": "13 - 17",
        "unit": "g/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total Leukocyte Count",
        "referenceRange": "4,800 - 10,800",
        "unit": "cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Neutrophils",
        "group": "Differential Leucocyte Count",
        "referenceRange": "40 - 80",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Lymphocyte",
        "group": "Differential Leucocyte Count",
        "referenceRange": "20 - 40",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Eosinophils",
        "group": "Differential Leucocyte Count",
        "referenceRange": "1 - 6",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Monocytes",
        "group": "Differential Leucocyte Count",
        "referenceRange": "2 - 10",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Basophils",
        "group": "Differential Leucocyte Count",
        "referenceRange": "< 2",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Absolute Neutrophils Count",
        "displayName": "Neutrophils",
        "group": "Differential Leukocyte Count (Absolute count)",
        "referenceRange": "2 - 7",
        "unit": "x10^3/µL",
        "gender": "Both",
        "formula": "Formula: (TLC * Neutrophil percent / 1000)",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Absolute Lymphocyte Count",
        "displayName": "Lymphocytes",
        "group": "Differential Leukocyte Count (Absolute count)",
        "referenceRange": "1 - 3",
        "unit": "x10^3/µL",
        "gender": "Both",
        "formula": "Formula: (TLC * Lymphocyte percent / 1000)",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Absolute Eosinophils Count",
        "displayName": "Eosinophils",
        "group": "Differential Leukocyte Count (Absolute count)",
        "referenceRange": "0.02 - 0.5",
        "unit": "x10^3/µL",
        "gender": "Both",
        "formula": "Formula: (TLC * Eosinophils percent / 1000)",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Absolute Monocytes Count",
        "displayName": "Monocytes",
        "group": "Differential Leukocyte Count (Absolute count)",
        "referenceRange": "0.1 - 1",
        "unit": "x10^3/µL",
        "gender": "Both",
        "formula": "Formula: (TLC * Monocytes percent / 1000)",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Absolute Basophils Count",
        "displayName": "Basophils",
        "group": "Differential Leukocyte Count (Absolute count)",
        "referenceRange": "0.02 - 0.1",
        "unit": "x10^3/µL",
        "gender": "Both",
        "formula": "Formula: (TLC * Basophils percent / 1000)",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Neutrophil Lymphocyte Ratio",
        "displayName": "Neutrophil Lymphocyte Ratio",
        "referenceRange": "",
        "unit": "",
        "gender": "Both",
        "formula": "Formula: Neutrophil Lymphocyte Ratio (NLR) = Absolute Neutrophil count / absolute Lymphocyte count",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Platelet Count",
        "referenceRange": "1.5 - 4.1",
        "unit": "lakhs/cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total RBC Count",
        "referenceRange": "4.5 - 5.5",
        "unit": "million/cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Hematocrit Value, Hct",
        "referenceRange": "40 - 50",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Corpuscular Volume, MCV",
        "referenceRange": "83 - 101",
        "unit": "fL",
        "gender": "Both",
        "formula": "Formula: MCV = (Hct * 10) / RBC in millions",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Cell Haemoglobin, MCH",
        "referenceRange": "27 - 32",
        "unit": "Pg",
        "gender": "Both",
        "formula": "Formula: MCH = (Hb * 10) / RBC in millions",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Cell Haemoglobin CON, MCHC",
        "referenceRange": "31.5 - 34.5",
        "unit": "%",
        "gender": "Both",
        "formula": "Formula: MCHC = (Hb * 100) / Hct",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Platelet Volume, MPV (Optional)",
        "referenceRange": "6.5 - 12",
        "unit": "fL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "R.D.W. - CV (Optional)",
        "referenceRange": "11.6 - 14",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "R.D.W. - SD (Optional)",
        "referenceRange": "39 - 46",
        "unit": "fL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "CBC with ESR",
    "title": "CBC with ESR",
    "basePrice": 400,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Complete Blood Count (CBC) with Erythrocyte Sedimentation Rate (ESR) and Red Blood Cell Indices with auto-calculation.",
    "notes": "Clinical Notes:\nA complete blood count (CBC) with ESR is used to evaluate overall health and detect disorders including anemia, infection, inflammation, and leukemia.\n\nPossible causes of abnormal parameters:\n\n | High | Low\nRBC, Hb, or HCT | Dehydration, polycythemia, shock, chronic hypoxia | Anemia, thalassemia, and other hemoglobinopathies\nMCV | Macrocytic anemia, liver disease | Microcytic anemia\nWBC | Acute stress, infection, malignancies | Sepsis, marrow hypoplasia\nPlatelets | Risk of thrombosis | Risk of bleeding\nESR | Infection, inflammatory disease, autoimmune disorders, malignancy | Polycythemia, sickle cell anemia, severe leukocytosis",
    "interpretation": "Clinical Notes:\nA complete blood count (CBC) with ESR is used to evaluate overall health and detect disorders including anemia, infection, inflammation, and leukemia.\n\nPossible causes of abnormal parameters:\n\n | High | Low\nRBC, Hb, or HCT | Dehydration, polycythemia, shock, chronic hypoxia | Anemia, thalassemia, and other hemoglobinopathies\nMCV | Macrocytic anemia, liver disease | Microcytic anemia\nWBC | Acute stress, infection, malignancies | Sepsis, marrow hypoplasia\nPlatelets | Risk of thrombosis | Risk of bleeding\nESR | Infection, inflammatory disease, autoimmune disorders, malignancy | Polycythemia, sickle cell anemia, severe leukocytosis",
    "parameters": [
      {
        "name": "Hemoglobin",
        "referenceRange": "13 - 17",
        "unit": "g/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total Leukocyte Count",
        "referenceRange": "4,800 - 10,800",
        "unit": "cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Neutrophils",
        "group": "Differential Leucocyte Count",
        "referenceRange": "40 - 80",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Lymphocyte",
        "group": "Differential Leucocyte Count",
        "referenceRange": "20 - 40",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Eosinophils",
        "group": "Differential Leucocyte Count",
        "referenceRange": "1 - 6",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Monocytes",
        "group": "Differential Leucocyte Count",
        "referenceRange": "2 - 10",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Basophils",
        "group": "Differential Leucocyte Count",
        "referenceRange": "< 2",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Platelet Count",
        "referenceRange": "1.5 - 4.1",
        "unit": "lakhs/cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Total RBC Count",
        "referenceRange": "4.5 - 5.5",
        "unit": "million/cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Hematocrit Value, Hct",
        "referenceRange": "40 - 50",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Corpuscular Volume, MCV",
        "referenceRange": "83 - 101",
        "unit": "fL",
        "gender": "Both",
        "formula": "Formula: MCV = (Hct * 10) / RBC in millions",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Cell Haemoglobin, MCH",
        "referenceRange": "27 - 32",
        "unit": "Pg",
        "gender": "Both",
        "formula": "Formula: MCH = (Hb * 10) / RBC in millions",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Cell Haemoglobin CON, MCHC",
        "referenceRange": "31.5 - 34.5",
        "unit": "%",
        "gender": "Both",
        "formula": "Formula: MCHC = (Hb * 100) / Hct",
        "isCalculated": true,
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Mean Platelet Volume, MPV (Optional)",
        "referenceRange": "6.5 - 12",
        "unit": "fL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "R.D.W. - SD (Optional)",
        "referenceRange": "39 - 46",
        "unit": "fL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "R.D.W. - CV (Optional)",
        "referenceRange": "11.6 - 14",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "P-LCR (Optional)",
        "referenceRange": "19.7 - 42.4",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "P.D.W. (Optional)",
        "referenceRange": "9.6 - 15.2",
        "unit": "fL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Erythrocyte Sedimentation Rate (Wintrobe)",
        "referenceRange": "0 - 9",
        "unit": "mm for 1st hour",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Widal Test (Slide Method)",
    "title": "Widal Test (Slide Method)",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Serum",
    "turnaroundTime": "2 Hours",
    "department": "SEROLOGY & IMMUNOLOGY",
    "description": "Widal slide agglutination test for qualitative and semi-quantitative detection of Salmonella antibodies (S. Typhi O, H and S. Paratyphi AH, BH).",
    "notes": "Note:\n1. Titres ≥1:80 of \"O\" antigen & ≥1:160 of \"H\" antigen for Salmonella typhi and titres ≥1:80 of \"H\" antigen for Salmonella paratyphi A & B are significant.\n2. Reactive results indicate ongoing or recent infection by Salmonella species and it will vary with stage of the disease with appearance in 1st week to increase in titres till end of 4th week post which it starts decreasing.\n3. False positive - Past enteric infection during unrelated fevers like Malaria, Influenzae etc. in the form of transient rise in H antibody in Widal test.\n4. False negative - Sample collected early in the course of disease (1st week) and immunosuppression.\n\nUses of widal test\n1. To diagnose infection due to Salmonella species (Enteric fever).\n2. To monitor the progression of disease.\n3. To assess the response to therapy (decreasing titres) in patients being treated for Enteric fever.",
    "interpretation": "Note:\n1. Titres ≥1:80 of \"O\" antigen & ≥1:160 of \"H\" antigen for Salmonella typhi and titres ≥1:80 of \"H\" antigen for Salmonella paratyphi A & B are significant.\n2. Reactive results indicate ongoing or recent infection by Salmonella species and it will vary with stage of the disease with appearance in 1st week to increase in titres till end of 4th week post which it starts decreasing.\n3. False positive - Past enteric infection during unrelated fevers like Malaria, Influenzae etc. in the form of transient rise in H antibody in Widal test.\n4. False negative - Sample collected early in the course of disease (1st week) and immunosuppression.\n\nUses of widal test\n1. To diagnose infection due to Salmonella species (Enteric fever).\n2. To monitor the progression of disease.\n3. To assess the response to therapy (decreasing titres) in patients being treated for Enteric fever.",
    "parameters": [
      {
        "name": "Salmonella Typhi 'O'",
        "displayName": "Salmonella Typhi 'O'",
        "unit": "",
        "referenceRange": "",
        "fieldType": "Text",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "1:20",
            "isAbnormal": false
          },
          {
            "value": "1:40",
            "isAbnormal": false
          },
          {
            "value": "1:80",
            "isAbnormal": true
          },
          {
            "value": "1:160",
            "isAbnormal": true
          },
          {
            "value": "1:320",
            "isAbnormal": true
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Salmonella Typhi 'H'",
        "displayName": "Salmonella Typhi 'H'",
        "unit": "",
        "referenceRange": "",
        "fieldType": "Text",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "1:20",
            "isAbnormal": false
          },
          {
            "value": "1:40",
            "isAbnormal": false
          },
          {
            "value": "1:80",
            "isAbnormal": false
          },
          {
            "value": "1:160",
            "isAbnormal": true
          },
          {
            "value": "1:320",
            "isAbnormal": true
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Salmonella Typhi 'AH'",
        "displayName": "Salmonella Typhi 'AH'",
        "unit": "",
        "referenceRange": "",
        "fieldType": "Text",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "1:20",
            "isAbnormal": false
          },
          {
            "value": "1:40",
            "isAbnormal": false
          },
          {
            "value": "1:80",
            "isAbnormal": true
          },
          {
            "value": "1:160",
            "isAbnormal": true
          },
          {
            "value": "1:320",
            "isAbnormal": true
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Salmonella Typhi 'BH'",
        "displayName": "Salmonella Typhi 'BH'",
        "unit": "",
        "referenceRange": "",
        "fieldType": "Text",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "1:20",
            "isAbnormal": false
          },
          {
            "value": "1:40",
            "isAbnormal": false
          },
          {
            "value": "1:80",
            "isAbnormal": true
          },
          {
            "value": "1:160",
            "isAbnormal": true
          },
          {
            "value": "1:320",
            "isAbnormal": true
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Result",
        "displayName": "Result",
        "unit": "",
        "referenceRange": "",
        "fieldType": "Text",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          },
          {
            "value": "Significant titre of TO and TH antibodies",
            "isAbnormal": true
          },
          {
            "value": "No significant titre of Salmonella antibodies detected",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Widal (Tube Method)",
    "title": "Widal (Tube Method)",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Serum",
    "turnaroundTime": "4 Hours",
    "department": "SEROLOGY & IMMUNOLOGY",
    "description": "Tube agglutination test for Salmonella group of organisms reveal following titers.",
    "notes": "Tube agglutination test for Salmonella group of organisms reveal following titers.",
    "interpretation": "Antibody titre of 1:120 or higher suggests infection. A marked rise in the titre to one serotype to (above 1:120) or paired sample collected at 5 to 7 days interval is regarded as diagnostically significant. However persons who have received TAB vaccine may show high titre of antibodies to each of the salmonellae.",
    "parameters": [
      {
        "name": "S TYPHI \"O\"",
        "displayName": "S TYPHI \"O\"",
        "unit": "",
        "referenceRange": "",
        "fieldType": "Text",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "1:120 (+)",
            "isAbnormal": true
          },
          {
            "value": "1:240 (+)",
            "isAbnormal": true
          },
          {
            "value": "1:480 (+)",
            "isAbnormal": true
          },
          {
            "value": "1:60 (+)",
            "isAbnormal": false
          },
          {
            "value": "1:30 (+)",
            "isAbnormal": false
          },
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "S TYPHI \"H\"",
        "displayName": "S TYPHI \"H\"",
        "unit": "",
        "referenceRange": "",
        "fieldType": "Text",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "1:120 (+)",
            "isAbnormal": false
          },
          {
            "value": "1:240 (+)",
            "isAbnormal": true
          },
          {
            "value": "1:480 (+)",
            "isAbnormal": true
          },
          {
            "value": "1:60 (+)",
            "isAbnormal": false
          },
          {
            "value": "1:30 (+)",
            "isAbnormal": false
          },
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "S PARATYPHI \"AH\"",
        "displayName": "S PARATYPHI \"AH\"",
        "unit": "",
        "referenceRange": "",
        "fieldType": "Text",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "1:120 (+)",
            "isAbnormal": true
          },
          {
            "value": "1:240 (+)",
            "isAbnormal": true
          },
          {
            "value": "1:480 (+)",
            "isAbnormal": true
          },
          {
            "value": "1:60 (+)",
            "isAbnormal": false
          },
          {
            "value": "1:30 (+)",
            "isAbnormal": false
          },
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "S PARATYPHI \"BH\"",
        "displayName": "S PARATYPHI \"BH\"",
        "unit": "",
        "referenceRange": "",
        "fieldType": "Text",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "1:120 (+)",
            "isAbnormal": true
          },
          {
            "value": "1:240 (+)",
            "isAbnormal": true
          },
          {
            "value": "1:480 (+)",
            "isAbnormal": true
          },
          {
            "value": "1:60 (+)",
            "isAbnormal": false
          },
          {
            "value": "1:30 (+)",
            "isAbnormal": false
          },
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "Result",
        "displayName": "Comment",
        "unit": "",
        "referenceRange": "",
        "fieldType": "Text",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "WIDAL TEST POSITIVE",
            "isAbnormal": true
          },
          {
            "value": "WIDAL TEST NEGATIVE",
            "isAbnormal": false
          },
          {
            "value": "WIDAL TEST <POSITIVE/NEGATIVE>",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "WEIL FELIX TEST, SERUM",
    "title": "WEIL FELIX TEST, SERUM",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "4 Hours",
    "description": "The Weil-Felix test is a tube agglutination serological test for the presumptive diagnosis of rickettsial infections using Proteus vulgaris (OX-19, OX-2) and Proteus mirabilis (OX-K) antigens.",
    "notes": "",
    "interpretation": "Test Principle & Clinical Significance:\nThe Weil-Felix test is an agglutination test based on the cross-reaction of antibodies produced against Rickettsial species with the somatic (O) antigens of certain non-motile Proteus strains (OX-19, OX-2, and OX-K).\n\nDifferential Agglutination Patterns:\n1. Epidemic & Endemic Typhus (Rickettsia prowazekii, R. typhi):\n   • Proteus Antigen OX 19: Strongly Positive (>= 1:160)\n   • Proteus Antigen OX 2: Weakly Positive / Negative\n   • Proteus Antigen OX K: Negative\n\n2. Spotted Fever Group (Rocky Mountain Spotted Fever / Indian Tick Typhus - R. rickettsii, R. conorii):\n   • Proteus Antigen OX 19: Strongly Positive (>= 1:160)\n   • Proteus Antigen OX 2: Strongly Positive (>= 1:160)\n   • Proteus Antigen OX K: Negative\n\n3. Scrub Typhus (Orientia tsutsugamushi):\n   • Proteus Antigen OX 19: Negative\n   • Proteus Antigen OX 2: Negative\n   • Proteus Antigen OX K: Strongly Positive (>= 1:160)\n\n4. Q Fever (Coxiella burnetii):\n   • Proteus Antigen OX 19: Negative\n   • Proteus Antigen OX 2: Negative\n   • Proteus Antigen OX K: Negative\n\nDiagnostic Titres:\n• Baseline Titres: Titres < 1:80 are considered non-significant / negative and may be present in healthy individuals or due to past infections.\n• Significant Titre: A single titre of >= 1:160 (or >= 1:80 in non-endemic areas) in a patient with compatible clinical findings (acute febrile illness, headache, maculopapular rash, eschar) is suggestive of active Rickettsial infection.\n• Convalescent Testing: A four-fold or greater rise in antibody titre between paired acute and convalescent phase sera (collected 10-14 days apart) is diagnostically conclusive.\n• Cross-Reactivity: False-positive results may be seen in urinary tract infections caused by Proteus species, Leptospirosis, Relapsing fever, and severe chronic liver disease.\n• Correlation: Results should always be clinically correlated and confirmed with IFA, ELISA, or PCR where available.",
    "parameters": [
      {
        "name": "Proteus Antigen OX 19",
        "referenceRange": "< 1:80",
        "unit": "Titre",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative (< 1:20)",
            "isAbnormal": false
          },
          {
            "value": "1:20",
            "isAbnormal": false
          },
          {
            "value": "1:40",
            "isAbnormal": false
          },
          {
            "value": "1:80",
            "isAbnormal": false
          },
          {
            "value": "1:160",
            "isAbnormal": true
          },
          {
            "value": "1:320",
            "isAbnormal": true
          },
          {
            "value": "1:640",
            "isAbnormal": true
          },
          {
            "value": "1:1280",
            "isAbnormal": true
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "Proteus Antigen OX 2",
        "referenceRange": "< 1:80",
        "unit": "Titre",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative (< 1:20)",
            "isAbnormal": false
          },
          {
            "value": "1:20",
            "isAbnormal": false
          },
          {
            "value": "1:40",
            "isAbnormal": false
          },
          {
            "value": "1:80",
            "isAbnormal": false
          },
          {
            "value": "1:160",
            "isAbnormal": true
          },
          {
            "value": "1:320",
            "isAbnormal": true
          },
          {
            "value": "1:640",
            "isAbnormal": true
          },
          {
            "value": "1:1280",
            "isAbnormal": true
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      },
      {
        "name": "Proteus Antigen OX K",
        "referenceRange": "< 1:80",
        "unit": "Titre",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative (< 1:20)",
            "isAbnormal": false
          },
          {
            "value": "1:20",
            "isAbnormal": false
          },
          {
            "value": "1:40",
            "isAbnormal": false
          },
          {
            "value": "1:80",
            "isAbnormal": false
          },
          {
            "value": "1:160",
            "isAbnormal": true
          },
          {
            "value": "1:320",
            "isAbnormal": true
          },
          {
            "value": "1:640",
            "isAbnormal": true
          },
          {
            "value": "1:1280",
            "isAbnormal": true
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "WBC Count",
    "title": "WBC Count",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Total White Blood Cell (WBC) / Leukocyte count measurement in blood to evaluate immune status, infections, inflammation, and hematologic disorders.",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nWhite Blood Cells (WBCs) / Leukocytes are vital cellular components of the immune system responsible for defending the body against infectious organisms and foreign substances.\n\nReference Range:\n• Adults (Male & Female): 3,500 - 10,500 mcL (or cells/mcL)\n\nClinical Significance:\n1. Elevated WBC Count (Leukocytosis - > 10,500 mcL):\n   • Acute bacterial, viral, fungal, or parasitic infections\n   • Systemic inflammatory conditions (e.g., Rheumatoid arthritis, Vasculitis, IBD)\n   • Tissue necrosis / injury (e.g., Trauma, Burns, Myocardial infarction)\n   • Physical or emotional stress, strenuous exercise, pregnancy\n   • Corticosteroid therapy or medication-induced\n   • Myeloproliferative disorders and Leukemias (e.g., CML, AML, CLL)\n\n2. Decreased WBC Count (Leukopenia - < 3,500 mcL):\n   • Viral infections (e.g., Dengue, HIV, Viral Hepatitis, Influenza)\n   • Bone marrow suppression or failure (e.g., Aplastic anemia, myelodysplastic syndrome)\n   • Chemotherapy, radiotherapy, or immunosuppressive drugs\n   • Autoimmune destruction (e.g., Systemic Lupus Erythematosus)\n   • Severe overwhelming bacterial infections (Septic shock)\n   • Nutritional deficiencies (Vitamin B12 or Folate deficiency)\n\nNote:\nTotal WBC count should be evaluated in conjunction with the Differential Leukocyte Count (DLC: Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils) and clinical presentation for accurate diagnosis.",
    "parameters": [
      {
        "name": "WBC Count",
        "referenceRange": "3,500 - 10,500",
        "unit": "mcL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "VLDL Cholesterol",
    "title": "VLDL Cholesterol",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Fasting)",
    "turnaroundTime": "4 Hours",
    "description": "Quantitative measurement or estimation of Very Low-Density Lipoprotein (VLDL) cholesterol in serum to evaluate lipid metabolism and cardiovascular risk.",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nVery Low-Density Lipoprotein (VLDL) cholesterol is synthesized by the liver and serves as the primary transport vehicle for endogenously produced triglycerides in circulation. Elevated VLDL is an atherogenic risk factor linked to coronary artery disease, metabolic syndrome, and pancreatitis.\n\nReference Range:\n• Desirable: 5 - 40 mg/dl (or < 30 mg/dl fasting)\n\nClinical Significance:\n1. Elevated VLDL Cholesterol (> 40 mg/dl):\n   • Familial hypertriglyceridemia / Type IV and Type IIb hyperlipoproteinemia\n   • Metabolic Syndrome and Type 2 Diabetes Mellitus (due to insulin resistance)\n   • Obesity, sedentary lifestyle, and high-glycemic/high-fat diet\n   • Chronic alcohol excess\n   • Chronic kidney disease / Nephrotic syndrome\n   • Hypothyroidism\n   • Increased risk for atherosclerotic cardiovascular disease (ASCVD) and acute pancreatitis (when triglycerides > 500 mg/dl)\n\n2. Decreased VLDL Cholesterol (< 5 mg/dl):\n   • Severe malnutrition or malabsorption states\n   • Abetalipoproteinemia / Hypobetalipoproteinemia\n   • Severe chronic liver parenchymal damage\n   • Hyperthyroidism\n\nEstimation & Notes:\n• In standard lipid panels, VLDL is commonly estimated using the Friedewald formula (VLDL = Triglycerides / 5), valid when fasting triglycerides are < 400 mg/dl.\n• A 10–12 hour overnight fast is recommended for accurate testing.",
    "parameters": [
      {
        "name": "VLDL Cholesterol",
        "referenceRange": "5 - 40",
        "unit": "mg/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Vitamin D3",
    "title": "Vitamin D3",
    "basePrice": 1200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "24 Hours",
    "description": "Quantitative measurement of 25-Hydroxy Vitamin D / Vitamin D3 in serum to evaluate vitamin D status, bone mineralization, and calcium homeostasis.",
    "notes": "",
    "interpretation": "Physiological Basis:\nThe vitamin D system functions to maintain serum calcium levels. Vitamin D is a fat-soluble steroid hormone. Two molecular forms exist: D3 (cholecalciferol), synthesized in the epidermis, and D2 (ergocalciferol), derived from plant sources. To become active, both need to be further metabolized. Two sequential hydroxylations occur: in the liver to 25(OH)D and then, in the kidney, to 1,25[OH] 2 D. Besides consequences for bone health, vitamin D deficiency reportedly is associated with a number of conditions such as cardiovascular disease, autoimmunity and cancer; however, evidence-based cause-and-effect relationships have not been established. \n\nInterpretation\nIncreased in:  Heavy milk drinkers (up to 64 ng/mL), vitamin D intoxication, sun exposure.\nDecreased in:  Dietary deficiency, malabsorption, rickets, osteomalacia, biliary and portal cirrhosis, nephrotic syndrome, renal failure, inadequate sun exposure, advanced age (> 70), primary hyperparathyroidism.\nDrugs: Phenytoin, phenobarbital. \n\nComments:\nSerum or plasma total 25(OH)D is an integrated marker of vitamin D status, incorporating endogenous synthesis from solar exposure, dietary intake, fortified products and/or supplements. There is no universal or strong evidence-based consensus on the appropriate level of 25(OH)D level. However, according to a 2011 US Institute of Medicine Report, a 25(OH)D level of 20–30 ng/mL is all that is needed for bone and general health, and nearly everyone (97.5%) in the general population is in that range. A 25(OH)D level above 30 ng/mL has not been consistently associated with increased health benefits, and, in fact, risks have been identified for outcomes at levels above 50 ng/mL. Routine screening for vitamin D deficiency is not necessary. Patients with the following conditions should be considered for testing: osteoporosis, osteomalacia, malabsorption, liver disease, pancreatic insufficiency, chronic kidney disease, COPD, bariatric surgery, cancer, bedridden or home-bound, obesity, taking anticonvulsants or long-term glucocorticoids, atraumatic fractures, elderly (> 70 years old), and chronic inflammatory conditions.",
    "parameters": [
      {
        "name": "25 Hydroxy (OH) Vitamin D",
        "referenceRange": "30 - 100",
        "unit": "ng/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Vitamin B12",
    "title": "Vitamin B12",
    "basePrice": 850,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "24 Hours",
    "description": "Quantitative measurement of Vitamin B12 (Cobalamin) in serum to diagnose megaloblastic anemia, neuropathy, and malabsorption syndromes.",
    "notes": "",
    "interpretation": "Physiologic Basis\nVitamin B12 is a necessary cofactor for three important biochemical processes: conversion of methylmalonyl-CoA to succinyl-CoA and methylation of homocysteine to methionine and demethylation of methyltetrahydrofolate to tetra-hydrofolate (THF). All vitamin B12 comes from ingestion of foods of animal origin. Vitamin B12 in serum is protein bound, 70% to transcobalamin I (TC I) and 30% to transcobalamin II (TC II). The B12 bound to TC II is physiologically active; that bound to TC I is not.\n\nInterpretation \nIncreased in: Leukemia (acute myelocytic, chronic myelocytic, chronic lymphocytic, monocytic), marked leukocytosis, polycythemia vera.\nDecreased in: Pernicious anemia, gastrectomy, gastric carcinoma, malabsorption, pregnancy, dietary deficiency, HIV infection, chronic high-flux hemodialysis, Alzheimer disease, drugs (eg, omeprazole, metformin, carbamazepine).\n\nComments\nLow serum B12 levels warrant treatment; intermediate levels should be followed by repeated serum tests or by urine methylmalonic acid tests, as well as by serum homocysteine levels. Neurologic disorders caused by low serum B12 level can occur in the absence of macrocytic anemia or pancytopenia.",
    "parameters": [
      {
        "name": "Vitamin B12",
        "referenceRange": "211 - 911",
        "unit": "pg/ml",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "VDRL",
    "title": "VDRL",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "4 Hours",
    "description": "Venereal Disease Research Laboratory (VDRL) non-treponemal serological test for the screening and treatment monitoring of Syphilis (Treponema pallidum).",
    "notes": "",
    "interpretation": "Result | Remarks\nReactive | Indicates the presence of IgM & IgG antibodies against non-treponemal antigens\nNon-Reactive | Indicates absence of IgM & IgG antibodies against non-treponemal antigens\n\nNote:\n1. Titers of ≥1: 8 and rising titres are significant.\n2. Positive result indicates ongoing or recent infection and the diagnosis should be confirmed by specific Treponemal tests such as TPHA & FTA- Abs.\n3. The reactivity will vary with the Primary (60-86%), Secondary (99%) and Tertiary (98%) stage of Syphilis.\n4. False positive results may be observed in patients of Malaria, Hepatitis, Mumps, Leprosy, Infectious Mononucleosis, Rheumatoid Arthritis and Collagen disease.\n5. False negative reaction may be due to processing of sample collected early in the course of disease, immunosuppression and due to prozone effect.\n\nUses :\n- To screen for presence and monitor the progression of Syphilis infection.\n- To assess the response to therapy (decreasing titres) in patients being treated for Syphilis.",
    "parameters": [
      {
        "name": "VDRL",
        "referenceRange": "Non-Reactive",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          },
          {
            "value": "Weakly Reactive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine Sugar Random",
    "title": "Urine Sugar Random",
    "basePrice": 60,
    "taxPercentage": 0,
    "sampleType": "Urine (Random)",
    "turnaroundTime": "1 Hour",
    "description": "Semi-quantitative detection of glucose/sugar in random urine sample to screen for glycosuria, diabetes mellitus, and renal tubular disorders.",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nUnder normal physiological conditions, glucose is completely filtered by the glomeruli and reabsorbed by the proximal convoluted tubules of the kidneys, resulting in undetectable levels of glucose (Nil/Negative) in the urine.\n\nReference Value:\n• Normal / Healthy: Nil (Negative)\n\nClinical Significance:\n1. Glycosuria with Hyperglycemia (Exceeding Renal Threshold ~180 mg/dL):\n   • Diabetes Mellitus (Type 1 and Type 2)\n   • Gestational Diabetes\n   • Endocrine disorders (e.g., Cushing syndrome, Acromegaly, Hyperthyroidism, Pheochromocytoma)\n   • Acute severe stress, intracranial trauma, pancreatitis\n\n2. Renal Glycosuria (Normal Blood Glucose with Lowered Renal Threshold):\n   • Hereditary renal glycosuria (benign defect in proximal tubular glucose transport)\n   • Pregnancy (physiologically lowered renal glucose threshold)\n   • Fanconi syndrome and renal tubular acidosis\n   • Drug-induced tubular dysfunction (e.g., SGLT2 inhibitors like Dapagliflozin, Empagliflozin)\n\nNote:\nA positive urine sugar test should always be correlated with simultaneous blood glucose testing (FBS, PPBS, RBS, or HbA1c) to distinguish between diabetes mellitus and renal glycosuria.",
    "parameters": [
      {
        "name": "Urine Sugar Random",
        "referenceRange": "Nil",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Nil",
            "isAbnormal": false
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Trace",
            "isAbnormal": true
          },
          {
            "value": "+ (0.25 g/dL)",
            "isAbnormal": true
          },
          {
            "value": "++ (0.5 g/dL)",
            "isAbnormal": true
          },
          {
            "value": "+++ (1.0 g/dL)",
            "isAbnormal": true
          },
          {
            "value": "++++ (2.0 g/dL or more)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine Sugar PP",
    "title": "Urine Sugar PP",
    "basePrice": 60,
    "taxPercentage": 0,
    "sampleType": "Urine (Postprandial - 2 hrs after meal)",
    "turnaroundTime": "1 Hour",
    "description": "Semi-quantitative estimation of postprandial glucose excretion in urine collected 2 hours after a meal for diabetic evaluation and glucose tolerance assessment.",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nUrine Sugar Postprandial (PP) evaluates the excretion of glucose in urine collected 2 hours after a meal. Under normal physiological conditions in non-diabetic individuals, postprandial blood glucose does not exceed the renal threshold (~180 mg/dL), resulting in absence of glucose (Nil/Negative) in the urine.\n\nReference Value:\n• Normal / Healthy: Nil (Negative)\n\nClinical Significance:\n1. Postprandial Glycosuria with Hyperglycemia:\n   • Uncontrolled or poorly managed Diabetes Mellitus (Type 1 and Type 2)\n   • Impaired Glucose Tolerance (IGT)\n   • Gestational Diabetes Mellitus\n   • High-carbohydrate meal ingestion exceeding temporary renal threshold in susceptible individuals\n\n2. Postprandial Glycosuria without Significant Hyperglycemia (Renal Glycosuria):\n   • Reduced renal threshold for glucose\n   • Pregnancy\n   • Proximal renal tubular disorders (e.g., Fanconi syndrome)\n   • SGLT2 inhibitor therapy (Dapagliflozin, Empagliflozin, Canagliflozin)\n\nNote:\nUrine Sugar PP should be evaluated alongside simultaneous Blood Glucose Postprandial (PPBS) and HbA1c for optimal diabetic assessment and treatment monitoring.",
    "parameters": [
      {
        "name": "Urine Sugar PP",
        "referenceRange": "Nil",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Nil",
            "isAbnormal": false
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Trace",
            "isAbnormal": true
          },
          {
            "value": "+ (0.25 g/dL)",
            "isAbnormal": true
          },
          {
            "value": "++ (0.5 g/dL)",
            "isAbnormal": true
          },
          {
            "value": "+++ (1.0 g/dL)",
            "isAbnormal": true
          },
          {
            "value": "++++ (2.0 g/dL or more)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine Sugar Fasting",
    "title": "Urine Sugar Fasting",
    "basePrice": 60,
    "taxPercentage": 0,
    "sampleType": "Urine (Fasting - Early morning / overnight fast)",
    "turnaroundTime": "1 Hour",
    "description": "Semi-quantitative estimation of fasting glucose excretion in urine collected after an overnight fast (8-12 hours) for diabetic screening and evaluation.",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nUrine Sugar Fasting evaluates the presence of glucose in urine collected after an overnight fast (8-12 hours). Under normal physiological conditions in healthy individuals, fasting blood glucose is well below the renal threshold (~180 mg/dL), resulting in complete tubular reabsorption and no glucose (Nil/Negative) in the urine.\n\nReference Value:\n• Normal / Healthy: Nil (Negative)\n\nClinical Significance:\n1. Fasting Glycosuria with Hyperglycemia:\n   • Severe or uncontrolled Diabetes Mellitus (Type 1 and Type 2)\n   • Severe nocturnal or early morning hyperglycemia (Somogyi effect / Dawn phenomenon)\n   • Endocrine disorders causing secondary diabetes (e.g., Cushing syndrome, Pheochromocytoma)\n\n2. Fasting Glycosuria with Normal Blood Glucose (Renal Glycosuria):\n   • Hereditary renal glycosuria (impaired tubular reabsorption of glucose)\n   • Pregnancy-associated lowering of renal glucose threshold\n   • Renal tubular dysfunction (e.g., Fanconi syndrome, heavy metal toxicity)\n   • Use of SGLT2 inhibitor medications (e.g., Dapagliflozin, Empagliflozin)\n\nNote:\nFasting urine glucose is a screening test and should always be evaluated alongside Fasting Blood Sugar (FBS), Postprandial Blood Sugar (PPBS), and HbA1c for clinical confirmation.",
    "parameters": [
      {
        "name": "Urine Sugar Fasting",
        "referenceRange": "Nil",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Nil",
            "isAbnormal": false
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Trace",
            "isAbnormal": true
          },
          {
            "value": "+ (0.25 g/dL)",
            "isAbnormal": true
          },
          {
            "value": "++ (0.5 g/dL)",
            "isAbnormal": true
          },
          {
            "value": "+++ (1.0 g/dL)",
            "isAbnormal": true
          },
          {
            "value": "++++ (2.0 g/dL or more)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine Protein/Creatinine",
    "title": "Urine Protein/Creatinine",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Random - First morning preferred)",
    "turnaroundTime": "4 Hours",
    "description": "URINE PROTEIN/CREATININE RATIO (UPCR) quantitative estimation in spot urine to evaluate proteinuria and renal disease progression.",
    "notes": "",
    "interpretation": "Reference Interpretation (Adults)\n\n• < 0.2 → Normal\n• 0.2 – 0.5 → Mild proteinuria\n• 0.5 – 3.0 → Moderate proteinuria\n• > 3.0 → Nephrotic range proteinuria\n\nClinical Significance:\nThe Urine Protein/Creatinine Ratio (UPCR) on a spot/random urine sample correlates strongly with 24-hour urinary protein excretion (mg/24 hours) and avoids the collection errors of a 24-hour urine collection.\n\nClinical Applications:\n1. Diagnosis and quantitative grading of proteinuria in chronic kidney disease (CKD), diabetic nephropathy, glomerulonephritis, and hypertension.\n2. Screening and diagnosis of preeclampsia in pregnancy.\n3. Monitoring response to antiproteinuric and immunosuppressive therapy.",
    "parameters": [
      {
        "name": "Urine for creatinine",
        "referenceRange": "20 - 320",
        "unit": "mg/dL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Urine for Protein",
        "referenceRange": "< 15",
        "unit": "mg/dL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Urine Protein Creatinine Ratio",
        "referenceRange": "< 0.2",
        "unit": "mg/mg",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine for Protein",
    "title": "Urine for Protein",
    "basePrice": 60,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Random - Early morning preferred)",
    "turnaroundTime": "1 Hour",
    "description": "Semi-quantitative detection of protein in urine to screen for proteinuria, renal glomerular and tubular diseases, and preeclampsia.",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nNormal glomerular capillaries restrict the filtration of high-molecular-weight plasma proteins, and filtered low-molecular-weight proteins are largely reabsorbed and catabolized by proximal renal tubular cells. As a result, minimal protein (Nil / Negative) is excreted in the urine of healthy individuals.\n\nReference Value:\n• Normal / Healthy: Nil (Negative)\n\nClinical Significance:\n1. Glomerular Proteinuria (Increased Glomerular Permeability):\n   • Nephrotic syndrome (Membranous nephropathy, Minimal change disease, FSGS)\n   • Glomerulonephritis (IgA nephropathy, Post-streptococcal, Lupus nephritis)\n   • Diabetic nephropathy\n   • Hypertensive nephrosclerosis\n\n2. Tubular Proteinuria (Decreased Tubular Reabsorption):\n   • Acute tubular necrosis (ATN)\n   • Interstitial nephritis\n   • Fanconi syndrome\n   • Heavy metal poisoning / toxic nephropathy\n\n3. Overflow Proteinuria (Excess Low Molecular Weight Proteins in Plasma):\n   • Multiple myeloma (Bence Jones proteins / Free light chains)\n   • Rhabdomyolysis (Myoglobinuria)\n   • Intravascular hemolysis (Hemoglobinuria)\n\n4. Transient / Functional Proteinuria:\n   • High fever, strenuous exercise, severe emotional or physical stress\n   • Orthostatic (postural) proteinuria\n   • Urinary tract infection (UTI) or hematuria\n\nNote:\nPersistent proteinuria on dipstick testing warrants quantitative evaluation (such as Urine Protein/Creatinine Ratio [UPCR] or 24-hour urine protein) and renal function assessment.",
    "parameters": [
      {
        "name": "Urine for Protein",
        "referenceRange": "Nil",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Nil",
            "isAbnormal": false
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Trace",
            "isAbnormal": true
          },
          {
            "value": "+ (30 mg/dL)",
            "isAbnormal": true
          },
          {
            "value": "++ (100 mg/dL)",
            "isAbnormal": true
          },
          {
            "value": "+++ (300 mg/dL)",
            "isAbnormal": true
          },
          {
            "value": "++++ (1000 mg/dL or more)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine for Microalbumin",
    "title": "Urine for Microalbumin",
    "basePrice": 400,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Random - First morning preferred)",
    "turnaroundTime": "4 Hours",
    "description": "Quantitative / semi-quantitative estimation of microalbumin in urine to detect early diabetic nephropathy and renal microvascular disease.",
    "notes": "",
    "interpretation": "Physiological Basis:\nThe normal urinary albumin excretion is less than 30 mg/24 hr. On random spot urine collection, the albumin-to-creatinine ratio (ACR, mcg/mg) should be less than 30. The term microalbuminuria is defined as a subtle increase in the urinary excretion of albumin that cannot be detected by conventional urinalysis. Specifically, the excretion of 30–300 mg albumin per 24 hours or an ACR of 30–300 (mcg/mg) is considered microalbuminuria (urine albumin is high). 300 mg or more of albumin excretion per day or an ACR of 300 or higher indicates gross albuminuria (urine albumin very high or nephrotic) range. \n\nInterpretation:\nIncreased in: Diabetes mellitus, diabetic nephropathy. \n\nComments:\nMicroalbuminuria is a useful indicator of early nephropathy in diabetic patients. Urine albumin measurement requires a sensitive immunochemical assay. Urine dipstick analysis is often insensitive to microalbuminuria. Screening for microalbuminuria is often performed by measurement of the ACR in a random spot collection (preferred method). Twenty-four-hour or timed urine collections are more burdensome.",
    "parameters": [
      {
        "name": "Urine for Microalbumin",
        "referenceRange": "< 20 mg/L",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative (< 20 mg/L)",
            "isAbnormal": false
          },
          {
            "value": "Microalbuminuria (20 - 200 mg/L)",
            "isAbnormal": true
          },
          {
            "value": "Macroalbuminuria (> 200 mg/L)",
            "isAbnormal": true
          },
          {
            "value": "Normal (< 30 mg/24hr)",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine for Ketone",
    "title": "Urine for Ketone",
    "basePrice": 60,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Fresh Random)",
    "turnaroundTime": "1 Hour",
    "description": "Semi-quantitative detection of ketone bodies in urine to screen for diabetic ketoacidosis (DKA), starvation ketosis, and metabolic disturbances.",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nKetone bodies (acetoacetic acid, beta-hydroxybutyric acid, and acetone) are intermediate products of fatty acid metabolism. In healthy individuals on a standard diet, ketones are completely metabolized by peripheral tissues and are not detectable in urine (Nil / Negative).\n\nReference Value:\n• Normal / Healthy: Nil (Negative)\n\nClinical Significance:\n1. Diabetic Ketoacidosis (DKA):\n   • Severe, potentially life-threatening complication of uncontrolled Type 1 (and sometimes Type 2) Diabetes Mellitus, characterized by hyperglycemia, ketonuria, ketonemia, and metabolic acidosis.\n\n2. Non-Diabetic Ketonuria (Carbohydrate Deprivation / Increased Fat Catabolism):\n   • Prolonged fasting, starvation, or extreme ketogenic diets\n   • Hyperemesis gravidarum (severe pregnancy nausea and vomiting)\n   • Severe vomiting, diarrhea, or dehydration in children\n   • High fever, strenuous prolonged exercise, cachexia\n   • Alcoholic ketoacidosis\n   • Inborn errors of metabolism (e.g., glycogen storage diseases, organic acidemias)\n\nNote:\nUrine dipstick tests primarily detect acetoacetic acid (and to a lesser degree acetone), but do not measure beta-hydroxybutyrate. In critical situations (suspected DKA), quantitative serum beta-hydroxybutyrate, blood gases, and electrolytes should be measured.",
    "parameters": [
      {
        "name": "Urine for Ketone",
        "referenceRange": "Nil",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Nil",
            "isAbnormal": false
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Trace (5 mg/dL)",
            "isAbnormal": true
          },
          {
            "value": "+ (Small / 15 mg/dL)",
            "isAbnormal": true
          },
          {
            "value": "++ (Moderate / 40 mg/dL)",
            "isAbnormal": true
          },
          {
            "value": "+++ (Large / 80 mg/dL)",
            "isAbnormal": true
          },
          {
            "value": "++++ (Large / 160 mg/dL)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine for Fungal",
    "title": "Urine for Fungal",
    "basePrice": 100,
    "taxPercentage": 0,
    "sampleType": "Urine (Clean-catch Midstream / Catheterized)",
    "turnaroundTime": "2 Hours",
    "description": "Microscopic examination of urine sediment wet mount / Gram stain for yeast cells, budding cells, and pseudohyphae (funguria/candiduria).",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nNormal human urine is typically sterile and free from fungal elements (yeast cells or pseudohyphae). The presence of fungal elements in urine (Funguria / Candiduria) can indicate colonization, local urinary tract infection (cystitis, pyelonephritis), or disseminated candidiasis/fungal infection.\n\nReference Value:\n• Normal / Healthy: Absent (Nil / Negative)\n\nClinical Significance:\n1. Asymptomatic Candiduria:\n   • Frequently seen in catheterized patients, prolonged hospitalization, or elderly patients.\n   • Often represents benign colonization of the catheter or lower urinary tract.\n\n2. Symptomatic Fungal Urinary Tract Infection:\n   • Fungal cystitis, pyelonephritis, renal abscess, or fungal balls (bezoars) in the collecting system.\n   • Common risk factors include Diabetes Mellitus, broad-spectrum antibiotic therapy, immunosuppression (corticosteroids, chemotherapy, HIV), urinary tract obstruction, or indwelling Foley catheters.\n\n3. Disseminated / Invasive Fungal Infection:\n   • Candiduria in immunocompromised or neutropenic patients may be a manifestation of hematogenous renal seeding from systemic candidiasis.\n\nNote:\nMicroscopic examination of urine wet mount / Gram stain detects budding yeast cells and pseudohyphae. Urine fungal culture and speciation (e.g., Candida albicans, Candida tropicalis, Candida glabrata) is recommended for identifying the causative species and antifungal susceptibility testing.",
    "parameters": [
      {
        "name": "Urine for Fungal",
        "referenceRange": "Absent",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Absent",
            "isAbnormal": false
          },
          {
            "value": "Nil",
            "isAbnormal": false
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Present",
            "isAbnormal": true
          },
          {
            "value": "Few Yeast Cells Seen",
            "isAbnormal": true
          },
          {
            "value": "Moderate Yeast Cells with Pseudohyphae Seen",
            "isAbnormal": true
          },
          {
            "value": "Plenty Yeast Cells with Pseudohyphae Seen",
            "isAbnormal": true
          },
          {
            "value": "Candida species Seen",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine for ELISA (Pregnancy)",
    "title": "Urine for ELISA (Pregnancy)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Urine (Early morning first-void preferred)",
    "turnaroundTime": "1 Hour",
    "description": "Detection of Human Chorionic Gonadotropin (hCG) in urine by ELISA / Immunochromatographic method for confirmation of pregnancy.",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nHuman Chorionic Gonadotropin (hCG) is a glycoprotein hormone produced by the syncytiotrophoblast cells of the placenta following implantation of a fertilized ovum. Urine ELISA / immunochromatographic assays detect the presence of beta-hCG (typically at concentrations ≥ 20–25 mIU/mL) in urine.\n\nReference Value:\n• Non-Pregnant Females / Males: Negative (< 5 mIU/mL)\n\nClinical Significance:\n1. Positive Result:\n   • Confirms intrauterine pregnancy (detectable as early as 7–10 days post-conception or by the first missed menstrual period).\n   • Other conditions associated with elevated hCG:\n     - Ectopic pregnancy\n     - Gestational trophoblastic disease (Hydatidiform mole, Choriocarcinoma)\n     - Germ cell tumors producing hCG (e.g., ovarian teratoma, dysgerminoma, testicular choriocarcinoma)\n\n2. Negative Result:\n   • Absence of pregnancy or hCG level below the analytical sensitivity threshold of the assay (e.g., early gestation before expected menses).\n   • Very dilute urine sample (low specific gravity).\n\nNote:\nFor optimal sensitivity, an early morning first-void urine sample is recommended as it contains the highest concentration of hCG. If pregnancy is clinically suspected despite a negative or weakly positive urine result, retesting in 48–72 hours or a quantitative Serum Beta-hCG blood test is recommended.",
    "parameters": [
      {
        "name": "Urine for ELISA (Pregnancy)",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Weakly Positive",
            "isAbnormal": true
          },
          {
            "value": "Equivocal",
            "isAbnormal": true
          },
          {
            "value": "Borderline",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine for creatinine",
    "title": "Urine for creatinine",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Random or 24-Hour)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative estimation of creatinine excretion in urine to evaluate glomerular filtration, muscle catabolism, and ratio indices.",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nCreatinine is a non-protein nitrogenous end product of muscle creatine phosphate catabolism. It is produced at a relatively constant rate proportional to muscle mass and excreted by the kidneys primarily through glomerular filtration with negligible tubular secretion and reabsorption. Urinary creatinine measurement is used to assess renal clearance, evaluate muscle wasting disorders, and standardize concentrations of other excreted urinary analytes (such as albumin and total protein) in spot urine samples.\n\nReference Ranges:\n• Spot / Random Urine: 20 – 320 mg/dL\n• 24-Hour Urine Collection:\n  - Adult Males: 1,000 – 2,000 mg/24 hours (1.0 – 2.0 g/day)\n  - Adult Females: 800 – 1,800 mg/24 hours (0.8 – 1.8 g/day)\n\nClinical Significance:\n1. Decreased Urinary Creatinine:\n   • Impaired Glomerular Filtration / Renal Failure (Acute Kidney Injury, Chronic Kidney Disease)\n   • Reduced muscle mass (Muscular dystrophy, Amyotrophic lateral sclerosis, severe cachexia)\n   • Incomplete 24-hour urine collection\n   • Severe hyperthyroidism, advanced liver disease\n\n2. Increased Urinary Creatinine:\n   • High dietary meat intake / creatine supplementation\n   • Strenuous physical exercise / Rhabdomyolysis\n   • Early diabetic nephropathy (hyperfiltration stage)\n   • Gigantism, acromegaly, hypopituitarism\n   • Catabolic states / severe tissue breakdown\n\nNote:\nMeasurement of urinary creatinine in a spot urine sample is essential for calculating the Albumin-to-Creatinine Ratio (ACR) and Protein-to-Creatinine Ratio (UPCR) to adjust for variations in urinary concentration.",
    "parameters": [
      {
        "name": "Urine for creatinine",
        "referenceRange": "20 - 320",
        "unit": "mg/dL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine for Chyle",
    "title": "Urine for Chyle",
    "basePrice": 100,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Random - Postprandial / post-fat meal preferred)",
    "turnaroundTime": "2 Hours",
    "description": "Detection of chyle (lymph and fat/chylomicrons) in urine to evaluate chyluria, filarial lymphatic obstruction, and lymphatic-urinary fistulae.",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nChyluria is the presence of chyle (a milky bodily fluid consisting of lymph and emulsified fats / chylomicrons) in the urine. It occurs due to the formation of an abnormal fistulous communication between the retroperitoneal lymphatic system and the urinary collecting system (pelvicalyceal system, ureter, or bladder).\n\nReference Value:\n• Normal / Healthy: Negative (Absent)\n\nClinical Significance:\n1. Parasitic Causes (Most Common in Endemic Regions):\n   • Lymphatic Filariasis caused by Wuchereria bancrofti (leading to lymphatic obstruction, lymphangiectasia, and rupture into urinary tract).\n\n2. Non-Parasitic Causes:\n   • Trauma or retroperitoneal / pelvic surgery\n   • Retroperitoneal tumors, lymphoma, or granulomatous lymphadenitis (e.g., Tuberculosis)\n   • Congenital lymphatic malformations / lymphangiomatosis\n   • Thoracic duct obstruction or thrombosis\n   • Pregnancy or severe abdominal straining in patients with preexisting lymphatic weakness\n\nDiagnostic Features:\n• Appearance: Milky white, opalescent urine, often clearing upon ether / chloroform extraction (Ether Test Positive).\n• Staining: Sudan III or Oil Red O positive for fat globules / chylomicrons.\n• Urinalysis: High levels of triglycerides and cholesterol, accompanied by proteinuria and lymphocyturia.\n\nNote:\nConfirmation is typically performed by the Urine Ether extraction test and measurement of urinary triglycerides (> 15 mg/dL suggests chyluria). High-fat meals prior to testing may accentuate the milky appearance.",
    "parameters": [
      {
        "name": "Urine for Chyle",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Absent",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Present",
            "isAbnormal": true
          },
          {
            "value": "Milky / Turbid (Ether test Positive)",
            "isAbnormal": true
          },
          {
            "value": "Trace",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine for AFB 24 hours",
    "title": "Urine for AFB 24 hours",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Urine (24-Hour Pooled Collection / Concentrated Morning Urine)",
    "turnaroundTime": "24 Hours",
    "description": "Microscopic examination of concentrated urine sediment using Ziehl-Neelsen / Acid-Fast stain for detection of Mycobacterium tuberculosis (Genitourinary TB).",
    "notes": "",
    "interpretation": "Clinical Interpretation & Physiological Significance:\nAcid-Fast Bacilli (AFB) stain (Ziehl-Neelsen / Kinyoun or Auramine-O fluorescence) on concentrated urine sediment is performed for the detection of Mycobacterium tuberculosis in suspected cases of Genitourinary Tuberculosis (GUTB) or disseminated tuberculosis.\n\nReference Value:\n• Normal / Healthy: Negative (No Acid Fast Bacilli Seen)\n\nClinical Significance:\n1. Positive Result (Acid Fast Bacilli Seen):\n   • Strongly suggestive of active Genitourinary Tuberculosis (affecting kidneys, ureters, bladder, prostate, seminal vesicles, or epididymis).\n   • Can occasionally be seen in disseminated / miliary tuberculosis or renal tuberculosis in immunocompromised patients (e.g., HIV co-infection).\n\n2. Negative Result:\n   • Does not completely rule out Genitourinary Tuberculosis due to intermittent shedding of mycobacteria in urine.\n   • Serial morning urine samples (3 to 5 consecutive first-morning clean-catch specimens) or 24-hour pooled collection significantly increase diagnostic yield.\n\nImportant Differential & Caution:\n• Commensal non-pathogenic mycobacteria (such as Mycobacterium smegmatis, normally present on external genitalia) are acid-fast and can cause false-positive microscopic smear results if the genital area is not thoroughly cleansed prior to collection.\n• Confirmation by CBNAAT / GeneXpert MTB/RIF and Mycobacterial Culture (LJ medium / MGIT liquid culture) is recommended for definitive speciation and drug susceptibility testing (DST).",
    "parameters": [
      {
        "name": "Urine for AFB 24 hours",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative (No Acid Fast Bacilli Seen)",
            "isAbnormal": false
          },
          {
            "value": "Not Seen",
            "isAbnormal": false
          },
          {
            "value": "Positive (Acid Fast Bacilli Seen)",
            "isAbnormal": true
          },
          {
            "value": "1+ (1-10 AFB / 100 Oil Immersion Fields)",
            "isAbnormal": true
          },
          {
            "value": "2+ (1-10 AFB / 10 Oil Immersion Fields)",
            "isAbnormal": true
          },
          {
            "value": "3+ (> 10 AFB / Oil Immersion Field)",
            "isAbnormal": true
          },
          {
            "value": "Doubtful / Repeat Sample Advised",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine Cortisol",
    "title": "Urine Cortisol",
    "basePrice": 850,
    "taxPercentage": 0,
    "sampleType": "24-hour Urine",
    "turnaroundTime": "24 Hours",
    "description": "Urinary free cortisol measurement for evaluation of adrenal function and suspected Cushing syndrome.",
    "notes": "",
    "interpretation": "Physiological Basis:\nUrinary free cortisol measurement is useful in the initial evaluation of suspected Cushing syndrome. \n\nInterpretation \n\nIncreased in: \nCushing syndrome, acute illness, stress. \nNot increased in: Obesity. \n\nComments \nUrinary free cortisol is the initial diagnostic test of choice for Cushing syndrome. Not useful for the diagnosis of adrenal insuffi ciency. A shorter (12-hour) overnight collection and measurement of the ratio of urine-free cortisol to urine creatinine appears to perform nearly as well as a 24-hour collection for urine-free cortisol.",
    "parameters": [
      {
        "name": "Urine Cortisol",
        "referenceRange": "",
        "unit": "µg/24 hrs",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine Bile Pigment",
    "title": "Urine Bile Pigment",
    "basePrice": 60,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Fresh Random)",
    "turnaroundTime": "1 Hour",
    "description": "Detection of bile pigment (bilirubin) in urine to evaluate liver function, jaundice, and biliary disorders.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Urine Bile Pigment",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Absent",
            "isAbnormal": false
          },
          {
            "value": "Nil",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Present",
            "isAbnormal": true
          },
          {
            "value": "Trace",
            "isAbnormal": true
          },
          {
            "value": "+ (1+)",
            "isAbnormal": true
          },
          {
            "value": "++ (2+)",
            "isAbnormal": true
          },
          {
            "value": "+++ (3+)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine Bile Salt",
    "title": "Urine Bile Salt",
    "basePrice": 60,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Fresh Random)",
    "turnaroundTime": "1 Hour",
    "description": "Detection of bile salts in urine to evaluate obstructive jaundice and hepatobiliary disorders.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Urine Bile Salt",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Absent",
            "isAbnormal": false
          },
          {
            "value": "Nil",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Present",
            "isAbnormal": true
          },
          {
            "value": "Trace",
            "isAbnormal": true
          },
          {
            "value": "+ (1+)",
            "isAbnormal": true
          },
          {
            "value": "++ (2+)",
            "isAbnormal": true
          },
          {
            "value": "+++ (3+)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Uric Acid",
    "title": "Uric Acid",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative measurement of uric acid concentration in serum for evaluation of gout, renal disorders, and metabolic conditions.",
    "notes": "",
    "interpretation": "Physiological basis \nUric acid is an end product of nucleoprotein metabolism and is excreted by the kidney. An increase in serum uric acid concentration occurs with increased nucleoprotein synthesis or catabolism (blood dyscrasias, therapy of leukemia) or decreased renal uric acid excretion (eg, thiazide diuretic therapy or renal failure).\n\nInterpretation \nIncreased in: Renal failure, gout, myeloproliferative disorders (leukemia, lymphoma, myeloma, polycythemia vera), psoriasis, glycogen storage disease (type I), Lesch-Nyhan syndrome, lead nephropathy, hypertensive diseases of pregnancy (preeclampsia and eclampsia), menopause, syndrome X (obesity, insulin resistance, hypertension, hyperuricemia, dyslipidemia).\nDrugs: Antime- tabolite and chemotherapeutic agents, diuretics, ethanol, nicotinic acid, salicylates (low-dose), theophylline.\n\nDecreased in: SIADH, Xanthine oxidase deficiency, Low-purine diet, Fanconi syndrome, Neoplastic disease (various, causing Increased renal excretion), Liver disease.\nDrugs: Salicylates (high- dose), allopurinol or febuxostat (xanthine oxidase inhibitors) or uricase.",
    "parameters": [
      {
        "name": "Serum Uric Acid",
        "referenceRange": "3.5 - 7.2",
        "unit": "mg/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Uric Acid",
    "title": "Serum Uric Acid",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative measurement of uric acid concentration in serum for evaluation of gout, renal disorders, and metabolic conditions.",
    "notes": "",
    "interpretation": "Physiological basis \nUric acid is an end product of nucleoprotein metabolism and is excreted by the kidney. An increase in serum uric acid concentration occurs with increased nucleoprotein synthesis or catabolism (blood dyscrasias, therapy of leukemia) or decreased renal uric acid excretion (eg, thiazide diuretic therapy or renal failure).\n\nInterpretation \nIncreased in: Renal failure, gout, myeloproliferative disorders (leukemia, lymphoma, myeloma, polycythemia vera), psoriasis, glycogen storage disease (type I), Lesch-Nyhan syndrome, lead nephropathy, hypertensive diseases of pregnancy (preeclampsia and eclampsia), menopause, syndrome X (obesity, insulin resistance, hypertension, hyperuricemia, dyslipidemia).\nDrugs: Antime- tabolite and chemotherapeutic agents, diuretics, ethanol, nicotinic acid, salicylates (low-dose), theophylline.\n\nDecreased in: SIADH, Xanthine oxidase deficiency, Low-purine diet, Fanconi syndrome, Neoplastic disease (various, causing Increased renal excretion), Liver disease.\nDrugs: Salicylates (high- dose), allopurinol or febuxostat (xanthine oxidase inhibitors) or uricase.",
    "parameters": [
      {
        "name": "Serum Uric Acid",
        "referenceRange": "3.5 - 7.2",
        "unit": "mg/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urea / Creatinine Ratio",
    "title": "Urea / Creatinine Ratio",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Calculated ratio of serum urea to serum creatinine to evaluate renal function and pre-renal vs renal azotemia.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Urea / Creatinine Ratio",
        "referenceRange": "",
        "unit": "",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "UPT",
    "title": "UPT",
    "basePrice": 100,
    "taxPercentage": 0,
    "sampleType": "Urine (Early morning first-void preferred)",
    "turnaroundTime": "30 Minutes",
    "description": "Rapid card test / immunochromatographic assay for detection of human chorionic gonadotropin (hCG) in urine for pregnancy evaluation.",
    "notes": "",
    "interpretation": "Interpretation\n1. If the pregnancy test is taken too early one may get a false negative result very dilute urine specimen may not contain a representative level of HCG, resulting in a negative test too.\n2. If pregnancy is still suspected, first morning specimen should be collected 48 hours later and tested.\n3. A test result that is weakly positive should be confirmed by retesting with a first-morning urine specimen collected 48 hours later.\n4. A number of conditions other than pregnancy, including trophoblastic disease and non-trophoblastic neoplasm cause elevated levels of HCG resulting in a false positive test.\n5. The result should be correlated with clinical and ultrasound findings.",
    "parameters": [
      {
        "name": "Urine Pregnancy Test",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Weakly Positive",
            "isAbnormal": true
          },
          {
            "value": "Inconclusive / Repeat Advised",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine Pregnancy Test",
    "title": "Urine Pregnancy Test",
    "basePrice": 100,
    "taxPercentage": 0,
    "sampleType": "Urine (Early morning first-void preferred)",
    "turnaroundTime": "30 Minutes",
    "description": "Rapid card test / immunochromatographic assay for detection of human chorionic gonadotropin (hCG) in urine for pregnancy evaluation.",
    "notes": "",
    "interpretation": "Interpretation\n1. If the pregnancy test is taken too early one may get a false negative result very dilute urine specimen may not contain a representative level of HCG, resulting in a negative test too.\n2. If pregnancy is still suspected, first morning specimen should be collected 48 hours later and tested.\n3. A test result that is weakly positive should be confirmed by retesting with a first-morning urine specimen collected 48 hours later.\n4. A number of conditions other than pregnancy, including trophoblastic disease and non-trophoblastic neoplasm cause elevated levels of HCG resulting in a false positive test.\n5. The result should be correlated with clinical and ultrasound findings.",
    "parameters": [
      {
        "name": "Urine Pregnancy Test",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Weakly Positive",
            "isAbnormal": true
          },
          {
            "value": "Inconclusive / Repeat Advised",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "UPCR",
    "title": "UPCR",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Random - First morning preferred)",
    "turnaroundTime": "2 Hours",
    "description": "Semi-quantitative / qualitative or ratio estimation of Urine Protein to Creatinine Ratio (UPCR) to evaluate proteinuria.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Urine Protein Creatinine Ratio",
        "referenceRange": "< 0.2",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Normal (< 0.2)",
            "isAbnormal": false
          },
          {
            "value": "Mild Proteinuria (0.2 - 0.5)",
            "isAbnormal": true
          },
          {
            "value": "Moderate Proteinuria (0.5 - 3.0)",
            "isAbnormal": true
          },
          {
            "value": "Nephrotic Range (> 3.0)",
            "isAbnormal": true
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine Protein Creatinine Ratio",
    "title": "Urine Protein Creatinine Ratio",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Random - First morning preferred)",
    "turnaroundTime": "2 Hours",
    "description": "Semi-quantitative / qualitative or ratio estimation of Urine Protein to Creatinine Ratio (UPCR) to evaluate proteinuria.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Urine Protein Creatinine Ratio",
        "referenceRange": "< 0.2",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Normal (< 0.2)",
            "isAbnormal": false
          },
          {
            "value": "Mild Proteinuria (0.2 - 0.5)",
            "isAbnormal": true
          },
          {
            "value": "Moderate Proteinuria (0.5 - 3.0)",
            "isAbnormal": true
          },
          {
            "value": "Nephrotic Range (> 3.0)",
            "isAbnormal": true
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "UCT",
    "title": "UCT",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Random)",
    "turnaroundTime": "4 Hours",
    "description": "Detection of cotinine in urine to evaluate nicotine exposure and smoking status.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Urine Cotinine",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Absent",
            "isAbnormal": false
          },
          {
            "value": "Non-Smoker (< 200 ng/mL)",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Present",
            "isAbnormal": true
          },
          {
            "value": "Active Smoker (> 200 ng/mL)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Urine Cotinine",
    "title": "Urine Cotinine",
    "basePrice": 650,
    "taxPercentage": 0,
    "sampleType": "Urine (Spot / Random)",
    "turnaroundTime": "4 Hours",
    "description": "Detection of cotinine in urine to evaluate nicotine exposure and smoking status.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Urine Cotinine",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Absent",
            "isAbnormal": false
          },
          {
            "value": "Non-Smoker (< 200 ng/mL)",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Present",
            "isAbnormal": true
          },
          {
            "value": "Active Smoker (> 200 ng/mL)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Typhidot Antibodies",
    "title": "Typhidot Antibodies",
    "basePrice": 400,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Qualitative detection of specific IgM and IgG antibodies against Salmonella typhi in serum for the diagnosis of typhoid fever.",
    "notes": "",
    "interpretation": "TYPHIDOT is a Dot EIA assay designed for the qualitative detection of specific IgM and IgG antibodies against a specific outer membrane antigen of Salmonella typhi in human serum. It is intended to be used as an in vitro diagnostic of typhoid fever. The results obtained should not be the sole determinant for clinical decisions.\n\nRESULTS | CLINICAL INTERPRETATION\n-------------------------------------------------------------\nIgM positive; IgG negative | Acute Typhoid Fever\nIgM and IgG positive | Acute Typhoid Fever (in the middle stage of infection)\nIgM negative; IgG positive | Implications for the presence of IgG antibodies may be due to:\n1. Current Infection\n2. Previous Infection\n3. Relapse or reinfection\nIgM and IgG negative | Probably not typhoid",
    "parameters": [
      {
        "name": "IgG",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          },
          {
            "value": "Borderline",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "IgM",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          },
          {
            "value": "Borderline",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "TSH",
    "title": "TSH",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative measurement of Thyroid-Stimulating Hormone (TSH) in serum to evaluate thyroid function.",
    "notes": "",
    "interpretation": "Physiologic Basis\nTSH is an anterior pituitary hormone that stimulates the thyroid gland to produce thyroid hormones.\nSecretion is stimulated by thyrotropin releasing hormone from the hypothalamus. There is negative feedback on TSH secretion by circulating thyroid hormone.\n\nInterpretation \nIncreased in: Hypothyroidism, mild increases in recovery phase of acute illness, subclinical hypothyroidism.\nDecreased in: Hyperthyroidism, subclinical hyperthyroidism, acute medical or surgical illness (euthyroid sick syndrome), pituitary hypothyroidism.\nDrugs: dopamine, high-dose corticosteroids.\n\nComments\nTSH assays are used for screening thyroid function, aiding the diagnosis of hyperthyroidism and hypothyroidism, and monitoring thyroid replacement therapy.\nThe currently used TSH immunoassays are very sensitive, typically with functional sensitivity of ≤0.02 mIU/L.\nMeasurement of serum TSH is the best initial laboratory test of thyroid function. It should be followed by measurement of free thyroxine (FT4) if the TSH value is low and by measurement of anti-thyroperoxidase antibody (TPO Ab) if the TSH value is high.\nMost experts recommend against routine screening of asymptomatic patients, but screening is recommended for high-risk populations.",
    "parameters": [
      {
        "name": "Thyroid-Stimulating Hormone, TSH",
        "referenceRange": "0.3 - 4.5",
        "unit": "µIU/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Thyroid-Stimulating Hormone, TSH",
    "title": "Thyroid-Stimulating Hormone, TSH",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative measurement of Thyroid-Stimulating Hormone (TSH) in serum to evaluate thyroid function.",
    "notes": "",
    "interpretation": "Physiologic Basis\nTSH is an anterior pituitary hormone that stimulates the thyroid gland to produce thyroid hormones.\nSecretion is stimulated by thyrotropin releasing hormone from the hypothalamus. There is negative feedback on TSH secretion by circulating thyroid hormone.\n\nInterpretation \nIncreased in: Hypothyroidism, mild increases in recovery phase of acute illness, subclinical hypothyroidism.\nDecreased in: Hyperthyroidism, subclinical hyperthyroidism, acute medical or surgical illness (euthyroid sick syndrome), pituitary hypothyroidism.\nDrugs: dopamine, high-dose corticosteroids.\n\nComments\nTSH assays are used for screening thyroid function, aiding the diagnosis of hyperthyroidism and hypothyroidism, and monitoring thyroid replacement therapy.\nThe currently used TSH immunoassays are very sensitive, typically with functional sensitivity of ≤0.02 mIU/L.\nMeasurement of serum TSH is the best initial laboratory test of thyroid function. It should be followed by measurement of free thyroxine (FT4) if the TSH value is low and by measurement of anti-thyroperoxidase antibody (TPO Ab) if the TSH value is high.\nMost experts recommend against routine screening of asymptomatic patients, but screening is recommended for high-risk populations.",
    "parameters": [
      {
        "name": "Thyroid-Stimulating Hormone, TSH",
        "referenceRange": "0.3 - 4.5",
        "unit": "µIU/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Troponin T",
    "title": "Troponin T",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Whole Blood / Serum",
    "turnaroundTime": "30 Minutes",
    "description": "Qualitative rapid card test for the detection of Cardiac Troponin T for evaluation of acute myocardial injury.",
    "notes": "Method: Card",
    "interpretation": "Clinical Significance & Interpretation:\nCardiac Troponin T (cTnT) is a sensitive and specific marker of myocardial cell necrosis.\n\n1. Negative:\n   • Cardiac Troponin T is not detected (below analytical cutoff).\n   • If drawn within 3-6 hours of chest pain onset, a single negative test does not completely rule out acute myocardial infarction. Serial repeat testing at 3–6 hour intervals is recommended if acute coronary syndrome is suspected.\n\n2. Positive:\n   • Indicates myocardial injury / necrosis consistent with Acute Myocardial Infarction (AMI) or significant myocardial damage.\n   • Correlate immediately with 12-lead ECG and clinical presentation.",
    "parameters": [
      {
        "name": "Troponin T",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Weakly Positive",
            "isAbnormal": true
          },
          {
            "value": "Invalid / Repeat Advised",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Troponin I Rapid",
    "title": "Troponin I Rapid",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Whole Blood / Serum / Plasma",
    "turnaroundTime": "30 Minutes",
    "description": "Qualitative rapid card test for the detection of Cardiac Troponin I for evaluation of acute myocardial infarction.",
    "notes": "Method: Rapid Card",
    "interpretation": "",
    "parameters": [
      {
        "name": "Troponin I Rapid",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Weakly Positive",
            "isAbnormal": true
          },
          {
            "value": "Invalid / Repeat Advised",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Troponin I",
    "title": "Troponin I",
    "basePrice": 600,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of Cardiac Troponin I (cTnI) concentration in serum or plasma for evaluation of acute coronary syndrome.",
    "notes": "",
    "interpretation": "Initial Result In pg/ml | Remarks\n-------------------------------------------------------------\n<26.2 | The upper reference limit (99th percentile) for high sensitive Troponin I (hsTnI)\n< 26.2 & pain < 6 hours | Repeat Sampling after 3 hrs, a 50% change from initial value is diagnostic of Myocardial Infarction (MI)\n>26.2-262 | Repeat Sampling after 3 hrs, 50% change from initial value is diagnostic of Myocardial Infarction (MI)\n>262 | MI may be ruled in as appropriate with 98% specificity\n\nNote:\nAfter MI, troponin rises within 4-8 hours, peaks at 12-24 hours, and remains elevated for upto 14 days.\n\nIncreased levels:\ncTnI is highly cardio specific , though it may be elevated in nonischemic forms of cardiac injury including cardiac contusion, myocarditis, CHF, cardiomyopathy, Interventional therapy like cardiac surgery, and drug-induced cardiotoxicity.\nNormal troponin is defined as values upto the 99th percentile of healthy adults. “False positive” troponin may be seen in pulmonary embolism, myocarditis, pericarditis, heart failure, intracranial insults, rhabdomyolysis, sepsis, shock, and renal insufficiency.",
    "parameters": [
      {
        "name": "Troponin I",
        "referenceRange": "< 0.1 ng/mL",
        "unit": "ng/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Triglycerides",
    "title": "Triglycerides",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Fasting)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of serum triglycerides concentration to evaluate lipid metabolism and cardiovascular risk.",
    "notes": "",
    "interpretation": "Physiological basis\nDietary fat is hydrolyzed in the small intestine, absorbed and resynthesized by mucosal cells, and secreted into lacteals as chylomicrons.\nTriglycerides in the chylomicrons are cleared from the blood by tissue lipoprotein lipase. Endogenous triglyceride production occurs in the liver. These triglycerides are transported in association with β-lipoproteins in very low-density lipoproteins (VLDL).\n\nInterpretation\nIncreased in: Hypothyroidism, diabetes mellitus, nephrotic syndrome, chronic alcoholism (fatty liver), biliary tract obstruction, stress, familial lipoprotein lipase deficiency, familial dysbetalipoproteinemia, familial combined hyperlipidemia, obesity, metabolic syndrome, viral hepatitis, cirrhosis, pancreatitis, chronic renal failure, gout, pregnancy, glycogen storage diseases types I, III, and VI, anorexia nervosa, dietary excess.\nDrugs: β-blockers, cholestyramine, corticosteroids, diazepam, diuretics, estrogens, oral contraceptives.\nDecreased in: Tangier disease (α-lipoprotein deficiency), hypo- and abetalipoproteinemia, malnutrition, malabsorption, parenchymal liver disease, hyperthyroidism, intestinal lymphangiectasia.\nDrugs: ascorbic acid, clofibrate, nicotinic acid, gemfibrozil.\n\nComments\nIf the serum is clear, the serum triglyceride level is generally <350 mg/dL.\nElevated triglycerides are now considered an independent risk factor for coronary artery disease and a major risk factor for acute pancreatitis, particularly when serum triglyceride levels are > 1000 mg/dL and can be seen when a primary lipid disorder that is exacerbated by alcohol or fat intake or by corticosteroid or estrogen therapy.",
    "parameters": [
      {
        "name": "Triglycerides",
        "referenceRange": "25 - 200",
        "unit": "mg/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Transferrin Saturation",
    "title": "Transferrin Saturation",
    "basePrice": 300,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Calculated percentage of transferrin iron-binding sites occupied by iron (Serum Iron / TIBC x 100) to evaluate iron deficiency and overload.",
    "notes": "Method: Calculated",
    "interpretation": "",
    "parameters": [
      {
        "name": "Transferrin Saturation",
        "referenceRange": "20 - 55",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "TPHA",
    "title": "TPHA",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Specific treponemal serological test (TPHA) for the detection of antibodies to Treponema pallidum for syphilis diagnosis.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Treponema Pallidum Hemagglutination Assay",
        "referenceRange": "Non-Reactive",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Weakly Reactive",
            "isAbnormal": true
          },
          {
            "value": "Borderline / Equivocal",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Treponema Pallidum Hemagglutination Assay",
    "title": "Treponema Pallidum Hemagglutination Assay",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Specific treponemal serological test (TPHA) for the detection of antibodies to Treponema pallidum for syphilis diagnosis.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Treponema Pallidum Hemagglutination Assay",
        "referenceRange": "Non-Reactive",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Weakly Reactive",
            "isAbnormal": true
          },
          {
            "value": "Borderline / Equivocal",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Toxo IgM",
    "title": "Toxo IgM",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "4 Hours",
    "description": "Quantitative / semi-quantitative determination of IgM antibodies to Toxoplasma gondii in human serum for diagnosis of acute toxoplasmosis.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Toxo IgM",
        "referenceRange": "Neg. < 2 AU/mL\nGrey Zone 2 - 2.6 AU/mL\nPos. > 2.6 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Toxoplasma IgM",
    "title": "Toxoplasma IgM",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "4 Hours",
    "description": "Quantitative / semi-quantitative determination of IgM antibodies to Toxoplasma gondii in human serum for diagnosis of acute toxoplasmosis.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Toxo IgM",
        "referenceRange": "Neg. < 2 AU/mL\nGrey Zone 2 - 2.6 AU/mL\nPos. > 2.6 AU/mL",
        "unit": "AU/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Toxo IgG",
    "title": "Toxo IgG",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "4 Hours",
    "description": "Quantitative determination of IgG antibodies to Toxoplasma gondii in human serum for immune status evaluation.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Toxo IgG",
        "referenceRange": "< 2 IU/mL",
        "unit": "IU/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Toxoplasma IgG",
    "title": "Toxoplasma IgG",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "4 Hours",
    "description": "Quantitative determination of IgG antibodies to Toxoplasma gondii in human serum for immune status evaluation.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Toxo IgG",
        "referenceRange": "< 2 IU/mL",
        "unit": "IU/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Total RBC Count",
    "title": "Total RBC Count",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative estimation of the total number of red blood cells per volume of blood to evaluate anemia and erythropoiesis.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Total RBC Count",
        "referenceRange": "4.5 - 5.5",
        "unit": "million/cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "RBC Count",
    "title": "RBC Count",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative estimation of the total number of red blood cells per volume of blood to evaluate anemia and erythropoiesis.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Total RBC Count",
        "referenceRange": "4.5 - 5.5",
        "unit": "million/cumm",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Total PSA",
    "title": "Total PSA",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of total Prostate-Specific Antigen (PSA) in serum for prostate cancer screening and monitoring.",
    "notes": "",
    "interpretation": "Physiological basis\nPSA is a glycoprotein produced by cells of the prostatic ductal epithelium and is present in the serum of all men. It is absent from the serum of women.\n\nInterpretation\nIncreased in: Prostate carcinoma (sensitivity ~20%; specificity ~60–70% at a 4.0 ng/mL cutoff), biochemical recurrence after localized treatment, benign prostatic hypertrophy (BPH), prostatitis.\nDecreased in: Metastatic prostate carcinoma treated with antiandrogen therapy, postprostatectomy, 5α-reductase inhibitor therapy.\n\nComments\nPSA is used both for the early detection of prostate cancer and as a tumor marker to assess response and monitor recurrence of treated prostate cancer.\nThere is still no consensus on whether PSA measurement should be used as a screening test for early detection of prostate cancer.\nA decrease in mortality rates resulting from use for cancer screening is unproven, and the risks of early therapy are significant. As a result, the United States Preventive Services Task Force discourages use of the test for healthy men in all age groups.\nThe PSA nadir (the lowest PSA level achieved after therapeutic intervention) appears to correlate with the likelihood of remaining disease free. Three consecutive PSA rises are interpreted as an indicator of treatment (biochemical) failure.\nPSA is often increased in BPH, and the positive predictive value in healthy older men is low. Use of the free/total PSA ratio or the complex PSA test and prostate volume can improve the diagnostic accuracy for prostate cancer.",
    "parameters": [
      {
        "name": "Total PSA",
        "referenceRange": "< 4 ng/mL",
        "unit": "ng/mL",
        "gender": "Male",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "PSA (Prostate Specific Antigen)",
    "title": "PSA (Prostate Specific Antigen)",
    "basePrice": 500,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of total Prostate-Specific Antigen (PSA) in serum for prostate cancer screening and monitoring.",
    "notes": "",
    "interpretation": "Physiological basis\nPSA is a glycoprotein produced by cells of the prostatic ductal epithelium and is present in the serum of all men. It is absent from the serum of women.\n\nInterpretation\nIncreased in: Prostate carcinoma (sensitivity ~20%; specificity ~60–70% at a 4.0 ng/mL cutoff), biochemical recurrence after localized treatment, benign prostatic hypertrophy (BPH), prostatitis.\nDecreased in: Metastatic prostate carcinoma treated with antiandrogen therapy, postprostatectomy, 5α-reductase inhibitor therapy.\n\nComments\nPSA is used both for the early detection of prostate cancer and as a tumor marker to assess response and monitor recurrence of treated prostate cancer.\nThere is still no consensus on whether PSA measurement should be used as a screening test for early detection of prostate cancer.\nA decrease in mortality rates resulting from use for cancer screening is unproven, and the risks of early therapy are significant. As a result, the United States Preventive Services Task Force discourages use of the test for healthy men in all age groups.\nThe PSA nadir (the lowest PSA level achieved after therapeutic intervention) appears to correlate with the likelihood of remaining disease free. Three consecutive PSA rises are interpreted as an indicator of treatment (biochemical) failure.\nPSA is often increased in BPH, and the positive predictive value in healthy older men is low. Use of the free/total PSA ratio or the complex PSA test and prostate volume can improve the diagnostic accuracy for prostate cancer.",
    "parameters": [
      {
        "name": "Total PSA",
        "referenceRange": "< 4 ng/mL",
        "unit": "ng/mL",
        "gender": "Male",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Total Lipid",
    "title": "Total Lipid",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Fasting)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of total lipids in serum to evaluate lipid metabolism.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Total Lipid (Optional)",
        "referenceRange": "< 600 mg%",
        "unit": "mg%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Total Lipid (Optional)",
    "title": "Total Lipid (Optional)",
    "basePrice": 250,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Fasting)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of total lipids in serum to evaluate lipid metabolism.",
    "notes": "",
    "interpretation": "",
    "parameters": [
      {
        "name": "Total Lipid (Optional)",
        "referenceRange": "< 600 mg%",
        "unit": "mg%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Total Iron Binding Capacity",
    "title": "Total Iron Binding Capacity",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Fasting preferred)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of Total Iron Binding Capacity (TIBC) in serum for evaluation of iron metabolism disorders.",
    "notes": "",
    "interpretation": "Physiologic Basis\nIron is transported in plasma complexed to transferrin, which is synthesized in the liver. Total iron-binding capacity is calculated from transferrin levels measured immunologically. Each molecule of transferrin has two iron-binding sites; so its iron- binding capacity is 1.47 mg/g. Normally, transferrin carries an amount of iron representing about 16–60% of its capacity to bind iron (eg, % saturation of iron-binding capacity is 16–60%).\n\nInterpretation\nIncreased in: | Decreased in:\n-------------------------------------------------------------\nIron deficiency anemia, late pregnancy, infancy, acute hepatitis. Drugs: oral contraceptives | Hypoproteinemic states (eg, nephrotic syndrome, starvation, malnutrition, cancer), hemochromatosis, thalassemia, hyperthyroidism, chronic infections, chronic inflammatory disorders, chronic liver disease, other chronic diseases.\n\nComments\nTIBC correlates with serum transferrin, but the relationship is not linear over a wide range of transferrin values and is disrupted in diseases affecting transferrin-binding capacity or other iron-binding proteins. Increased % transferrin saturation with iron is seen in iron overload (iron poisoning, hemolytic anemia, sideroblastic anemia, thalassemia, hemochromatosis, pyridoxine deficiency, aplastic anemia, RBC transfusions). Decreased % transferrin saturation with iron is seen in iron deficiency (usually saturation <16%). Transferrin levels can also be used to assess nutritional status.",
    "parameters": [
      {
        "name": "Total Iron Binding Capacity (TIBC)",
        "referenceRange": "240 - 450",
        "unit": "µg/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Total Iron Binding Capacity (TIBC)",
    "title": "Total Iron Binding Capacity (TIBC)",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Fasting preferred)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of Total Iron Binding Capacity (TIBC) in serum for evaluation of iron metabolism disorders.",
    "notes": "",
    "interpretation": "Physiologic Basis\nIron is transported in plasma complexed to transferrin, which is synthesized in the liver. Total iron-binding capacity is calculated from transferrin levels measured immunologically. Each molecule of transferrin has two iron-binding sites; so its iron- binding capacity is 1.47 mg/g. Normally, transferrin carries an amount of iron representing about 16–60% of its capacity to bind iron (eg, % saturation of iron-binding capacity is 16–60%).\n\nInterpretation\nIncreased in: | Decreased in:\n-------------------------------------------------------------\nIron deficiency anemia, late pregnancy, infancy, acute hepatitis. Drugs: oral contraceptives | Hypoproteinemic states (eg, nephrotic syndrome, starvation, malnutrition, cancer), hemochromatosis, thalassemia, hyperthyroidism, chronic infections, chronic inflammatory disorders, chronic liver disease, other chronic diseases.\n\nComments\nTIBC correlates with serum transferrin, but the relationship is not linear over a wide range of transferrin values and is disrupted in diseases affecting transferrin-binding capacity or other iron-binding proteins. Increased % transferrin saturation with iron is seen in iron overload (iron poisoning, hemolytic anemia, sideroblastic anemia, thalassemia, hemochromatosis, pyridoxine deficiency, aplastic anemia, RBC transfusions). Decreased % transferrin saturation with iron is seen in iron deficiency (usually saturation <16%). Transferrin levels can also be used to assess nutritional status.",
    "parameters": [
      {
        "name": "Total Iron Binding Capacity (TIBC)",
        "referenceRange": "240 - 450",
        "unit": "µg/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Total Cholesterol",
    "title": "Total Cholesterol",
    "basePrice": 180,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Fasting preferred)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of total cholesterol in serum for cardiovascular risk and lipid disorder evaluation.",
    "notes": "",
    "interpretation": "Desirable: <200 mg/dL [<5.2 mmol/L]\nBorderline: 200–239 mg/ dL [5.2–6.1 mmol/L]\nHigh risk: >240 mg/dL [>6.2 mmol/L]\n\nPhysiological basis \nCholesterol level is determined by lipid metabolism, which is in turn influenced by heredity, diet, and liver, kidney, thyroid, and other endocrine organ functions.\n\nInterpretation \nIncreased in: Primary disorders: polygenic hypercholesterolemia, familial hypercholesterolemia (deficiency of LDL receptors), familial combined hyperlipidemia, familial dysbetalipoproteinemia. Secondary disorders: hypothyroidism, uncontrolled diabetes mellitus, nephrotic syndrome, biliary obstruction, anorexia nervosa, hepatocellular carcinoma, Cushing syndrome, acute intermittent porphyria.\nDrugs: corticosteroids.\nDecreased in: Severe liver disease (acute hepatitis, cirrhosis, malignancy), hyperthyroidism, severe acute or chronic illness, malnutrition, malabsorption (eg, HIV), extensive burns, familial (Gaucher disease, Tangier disease), abetalipoproteinemia, intestinal lymphangiectasia.\n\nComments \nCoronary heart disease (CHD) risk depends on the ratio of total cholesterol to HDL cholesterol. The ratio of LDL to HDL cholesterol has similar predictive ability. Treatment decisions should be based on absolute CHD risk. The risk reduction is proportional to the reduction in LDL cholesterol achieved with treatment.",
    "parameters": [
      {
        "name": "Total Cholesterol",
        "referenceRange": "125 - 200",
        "unit": "mg/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Cholesterol",
    "title": "Serum Cholesterol",
    "basePrice": 180,
    "taxPercentage": 0,
    "sampleType": "Blood Serum (Fasting preferred)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of total cholesterol in serum for cardiovascular risk and lipid disorder evaluation.",
    "notes": "",
    "interpretation": "Desirable: <200 mg/dL [<5.2 mmol/L]\nBorderline: 200–239 mg/ dL [5.2–6.1 mmol/L]\nHigh risk: >240 mg/dL [>6.2 mmol/L]\n\nPhysiological basis \nCholesterol level is determined by lipid metabolism, which is in turn influenced by heredity, diet, and liver, kidney, thyroid, and other endocrine organ functions.\n\nInterpretation \nIncreased in: Primary disorders: polygenic hypercholesterolemia, familial hypercholesterolemia (deficiency of LDL receptors), familial combined hyperlipidemia, familial dysbetalipoproteinemia. Secondary disorders: hypothyroidism, uncontrolled diabetes mellitus, nephrotic syndrome, biliary obstruction, anorexia nervosa, hepatocellular carcinoma, Cushing syndrome, acute intermittent porphyria.\nDrugs: corticosteroids.\nDecreased in: Severe liver disease (acute hepatitis, cirrhosis, malignancy), hyperthyroidism, severe acute or chronic illness, malnutrition, malabsorption (eg, HIV), extensive burns, familial (Gaucher disease, Tangier disease), abetalipoproteinemia, intestinal lymphangiectasia.\n\nComments \nCoronary heart disease (CHD) risk depends on the ratio of total cholesterol to HDL cholesterol. The ratio of LDL to HDL cholesterol has similar predictive ability. Treatment decisions should be based on absolute CHD risk. The risk reduction is proportional to the reduction in LDL cholesterol achieved with treatment.",
    "parameters": [
      {
        "name": "Total Cholesterol",
        "referenceRange": "125 - 200",
        "unit": "mg/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Total Calcium",
    "title": "Total Calcium",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of total calcium concentration in serum to evaluate parathyroid, bone, and mineral metabolism.",
    "notes": "",
    "interpretation": "Physiological basis\nSerum calcium is the sum of ionized calcium plus complex calcium and calcium bound to proteins (mostly albumin). Level of ionized calcium is regulated by parathyroid hormone and vitamin D.\n\nInterpretation\n\nCommon causes of Hypocalcemia | Causes of Hypercalcemia\n-------------------------------------------------------------\n1. Chronic renal failure | 1. Increased intestinal absorption (vitamin d intoxication)\n2. Hypomagnesemia | 2. Increased skeletal resorption\n3. Hypoalbuminemia | 3. Primary hyperparathyroidism\nPrimary hyperparathyroidism and malignancy account for 90-95% of cases of hypercalcemia.\n\nComments\nNeed to know serum albumin to interpret calcium level. For every decrease in albumin by 1mg/dL, calcium should be corrected upward by 0.8 mg/dL. In 10% of patients with malignancies, hypercalcemia is attributable to coexistent hyperparathyroidism, suggesting that serum PTH levels should be measured at the initial presentation of all hypercalcemic patients.",
    "parameters": [
      {
        "name": "Total Calcium",
        "referenceRange": "9 - 10.5",
        "unit": "mg/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Serum Calcium",
    "title": "Serum Calcium",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of total calcium concentration in serum to evaluate parathyroid, bone, and mineral metabolism.",
    "notes": "",
    "interpretation": "Physiological basis\nSerum calcium is the sum of ionized calcium plus complex calcium and calcium bound to proteins (mostly albumin). Level of ionized calcium is regulated by parathyroid hormone and vitamin D.\n\nInterpretation\n\nCommon causes of Hypocalcemia | Causes of Hypercalcemia\n-------------------------------------------------------------\n1. Chronic renal failure | 1. Increased intestinal absorption (vitamin d intoxication)\n2. Hypomagnesemia | 2. Increased skeletal resorption\n3. Hypoalbuminemia | 3. Primary hyperparathyroidism\nPrimary hyperparathyroidism and malignancy account for 90-95% of cases of hypercalcemia.\n\nComments\nNeed to know serum albumin to interpret calcium level. For every decrease in albumin by 1mg/dL, calcium should be corrected upward by 0.8 mg/dL. In 10% of patients with malignancies, hypercalcemia is attributable to coexistent hyperparathyroidism, suggesting that serum PTH levels should be measured at the initial presentation of all hypercalcemic patients.",
    "parameters": [
      {
        "name": "Total Calcium",
        "referenceRange": "9 - 10.5",
        "unit": "mg/dl",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Magnesium",
    "title": "Magnesium",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Blood Serum",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of Magnesium level in serum/plasma to assess electrolyte balance, renal function, neuromuscular excitability, and metabolic disorders.",
    "notes": "",
    "interpretation": "Clinical Significance & Physiological Basis:\nMagnesium (Mg²⁺) is the fourth most abundant cation in the human body and the second most prevalent intracellular cation after potassium. It acts as an essential cofactor in over 300 metabolic and enzymatic reactions, including adenosine triphosphate (ATP) synthesis, oxidative phosphorylation, glycolysis, DNA and protein synthesis, neuromuscular transmission, and cardiac rhythm regulation. It is also critical in regulating calcium and potassium transport across cell membranes.\n\nReference Range:\n• Normal: 1.8 - 2.6 mg/dL (0.74 - 1.07 mmol/L)\n\nClinical Interpretation:\n\n1. Hypomagnesemia (< 1.8 mg/dL):\n   • Gastrointestinal Causes: Chronic diarrhea, malabsorption syndromes (celiac disease, Crohn's disease), acute pancreatitis, prolonged nasogastric suction, intestinal fistulae.\n   • Renal Losses: Diuretic therapy (loop and thiazide diuretics), osmotic diuresis (uncontrolled diabetes mellitus), chronic renal tubular acidosis, hypercalcemia, nephrotoxic drugs (e.g., Aminoglycosides, Amphotericin B, Cisplatin, Cyclosporine, Proton Pump Inhibitors - PPIs).\n   • Decreased Intake / Endocrine: Chronic alcoholism, severe malnutrition, total parenteral nutrition (TPN) lacking magnesium, primary/secondary aldosteronism, hyperthyroidism, diabetic ketoacidosis (recovery phase).\n   • Clinical Features: Neuromuscular hyperexcitability, tremors, tetany, muscle spasms, positive Chvostek and Trousseau signs, paresthesias, seizures, refractory hypokalemia, hypocalcemia, cardiac arrhythmias (prolonged PR and QT intervals, widening of QRS, ST depression, T wave inversion, Torsades de Pointes).\n\n2. Hypermagnesemia (> 2.6 mg/dL):\n   • Renal Failure: Acute Kidney Injury (AKI) or Chronic Kidney Disease (CKD) with reduced glomerular filtration rate (GFR < 30 mL/min).\n   • Iatrogenic / Exogenous Overload: Excessive administration of magnesium-containing antacids, laxatives, enemas, or intravenous magnesium sulfate therapy (e.g., for pre-eclampsia/eclampsia, status asthmaticus).\n   • Endocrine & Other Causes: Adrenal insufficiency (Addison's disease), hypothyroidism, severe dehydration, diabetic ketoacidosis, tumor lysis syndrome, lithium therapy.\n   • Clinical Features: Flushing, warmth, nausea, vomiting, lethargy, loss of deep tendon reflexes (DTRs at 4-6 mg/dL), hypotension, bradycardia, respiratory depression (> 10 mg/dL), cardiac conduction blocks, and cardiac arrest (> 15 mg/dL).\n\nNotes & Clinical Correlations:\n• Extracellular magnesium accounts for only ~1% of total body stores; serum levels may not always reflect total intracellular depletion.\n• Hypomagnesemia should be suspected in any patient with unexplained refractory hypokalemia or hypocalcemia, as magnesium is essential for sodium-potassium ATPase pump activity and parathyroid hormone (PTH) release.",
    "parameters": [
      {
        "name": "Magnesium",
        "referenceRange": "1.8 - 2.6",
        "unit": "mg/dL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Malaria Antigen",
    "title": "Malaria Antigen",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Qualitative detection of Malaria parasites and antibodies/antigens in whole blood samples for early diagnosis and differentiation.",
    "notes": "",
    "interpretation": "Malaria antigen detection-whole blood\nFour species of the plasmodium parasites are responsible for human malaria infections: P. falciparum, P. vivax, P. ovale and P. malariae. Early detection and differentiation of malaria is of paramount importance due to incidence of cerebral malaria and drug resistance associated with P. falciparum malaria causing most of the morbidity and mortality worldwide.\n\nTest Utility\nThe current test is a qualitative test for detection of the P. falciparum specific histidine rich protein-2 (Pf. HRP-2) and P. vivax specific lactate dehydrogenase (pLDH) in whole blood samples. The assay is able to detect and distinguish P. vivax and P. falciparum infections and also identify mixed infections.\n\nNotes & Limitations\nThe test detects P. falciparum specific HRP-2 and P. vivax specific LDH, a negative test result does not rule out infection with P. ovale and P. malariae. Constant exposure to the malarial parasites, as seen in areas of high endemicity, may result in positive results with doubtful clinical significance. Hence, the results must always be correlated with clinical history and relevant epidemiological and therapeutic context.",
    "parameters": [
      {
        "name": "IgG",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "IgM",
        "referenceRange": "Negative",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Non-Reactive",
            "isAbnormal": false
          },
          {
            "value": "Reactive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Mean Cell Haemoglobin, MCH",
    "title": "Mean Cell Haemoglobin, MCH",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of Mean Cell Haemoglobin (MCH) in blood to evaluate the average amount of haemoglobin inside a single red blood cell.",
    "notes": "",
    "interpretation": "Clinical Significance & Physiological Basis:\nMean Cell Haemoglobin (MCH) is a standard red blood cell (RBC) index that measures the average mass / amount of haemoglobin contained inside an individual erythrocyte (red blood cell). It is calculated by dividing total haemoglobin concentration by the total red blood cell count:\nMCH (pg) = [Haemoglobin (g/dL) × 10] / RBC count (million/µL).\n\nReference Range:\n• Normal / Desirable: 27 - 32 pg (picograms)\n\nClinical Interpretation:\n\n1. Low MCH (< 27 pg) - Hypochromic Anemia:\n   Indicates that red blood cells contain less haemoglobin than normal (hypochromia), usually appearing pale under microscopic peripheral smear examination.\n   Common Etiologies:\n   • Iron Deficiency Anemia (most common cause due to impaired heme synthesis)\n   • Thalassemia Minor / Major (impaired globin chain synthesis)\n   • Sideroblastic Anemia (defective iron utilization)\n   • Anemia of Chronic Disease / Chronic Inflammation (hepcidin-mediated iron sequestration)\n   • Lead Poisoning\n\n2. High MCH (> 32 pg) - Hyperchromic / Macrocytic Anemia:\n   Indicates that red blood cells are larger than normal and carry a greater mass of haemoglobin per cell.\n   Common Etiologies:\n   • Megaloblastic Anemias (Vitamin B12 deficiency, Folate / Folic Acid deficiency, Pernicious anemia)\n   • Chronic Liver Disease / Cirrhosis\n   • Chronic Alcoholism\n   • Hypothyroidism\n   • Myelodysplastic Syndromes (MDS)\n   • Reticulocytosis (immature red blood cells are larger in volume and carry more haemoglobin)\n   • False elevations due to cold agglutinins, hyperlipidemia, or extreme leukocytosis\n\nClinical Note:\nMCH should always be evaluated in conjunction with other red cell indices, including Mean Corpuscular Volume (MCV), Mean Corpuscular Haemoglobin Concentration (MCHC), and Red Cell Distribution Width (RDW), alongside a Complete Blood Count (CBC) and peripheral blood smear review.",
    "parameters": [
      {
        "name": "Mean Cell Haemoglobin, MCH",
        "referenceRange": "27 - 32",
        "unit": "Pg",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Mean Cell Haemoglobin CON, MCHC",
    "title": "Mean Cell Haemoglobin CON, MCHC",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of Mean Corpuscular Haemoglobin Concentration (MCHC) in blood to evaluate the average concentration of haemoglobin within a given volume of packed red blood cells.",
    "notes": "",
    "interpretation": "Clinical Significance & Physiological Basis:\nMean Cell Haemoglobin Concentration (MCHC) is an essential red blood cell (RBC) index that measures the average concentration of haemoglobin in a given volume of packed erythrocytes (red blood cells). Unlike MCH (which measures the absolute weight of haemoglobin per individual cell), MCHC relates haemoglobin content to total red cell volume.\nCalculation formula:\nMCHC (%) = [Haemoglobin (g/dL) / Hematocrit / PCV (%)] × 100\nor MCHC = [MCH (pg) / MCV (fL)] × 100.\n\nReference Range:\n• Normal: 31.5 - 34.5 % (or 31.5 - 34.5 g/dL)\n\nClinical Interpretation:\n\n1. Low MCHC (< 31.5 %) - Hypochromia:\n   Indicates diminished haemoglobin synthesis relative to erythrocyte cell volume.\n   Common Etiologies:\n   • Severe Iron Deficiency Anemia (impaired heme synthesis)\n   • Thalassemia Syndromes (α-thalassemia, β-thalassemia minor/major)\n   • Sideroblastic Anemia\n   • Chronic Lead Poisoning\n   • Chronic Disease Anemia with severe microcytosis\n\n2. High MCHC (> 34.5 %) - Hyperchromia:\n   True physiological hyperchromia is rare because intracellular haemoglobin reaches physical solubility limits (~37 g/dL). An elevated MCHC is a hallmark diagnostic clue for specific conditions.\n   Common Etiologies:\n   • Hereditary Spherocytosis (erythrocyte membrane defect causing cell dehydration and cellular spherical compaction)\n   • Autoimmune Hemolytic Anemia (AIHA - due to spherocyte formation)\n   • Sickle Cell Disease and Hemoglobin C Disease\n   • Severe Cellular Dehydration / Hypertonic States\n   • Laboratory / Pre-analytical Artifacts: Cold agglutinins (RBC clumping), severe hyperlipidemia, lipemia, hemolysis, high bilirubin, or extreme paraproteinemia.\n\nClinical Note:\nMCHC provides an internal laboratory quality control check. An unusually elevated MCHC (> 36 %) often prompts investigation for cold agglutinins, lipemia, or hereditary spherocytosis. MCHC should always be interpreted in conjunction with MCV, MCH, RDW, and peripheral blood smear examination.",
    "parameters": [
      {
        "name": "Mean Cell Haemoglobin CON, MCHC",
        "referenceRange": "31.5 - 34.5",
        "unit": "%",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Mean Corpuscular Volume, MCV",
    "title": "Mean Corpuscular Volume, MCV",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of Mean Corpuscular Volume (MCV) in blood to evaluate the average physical volume / size of a single red blood cell (erythrocyte).",
    "notes": "",
    "interpretation": "Clinical Significance & Physiological Basis:\nMean Corpuscular Volume (MCV) is the cornerstone red blood cell (RBC) index used in the morphological classification of anemias. It measures the average physical volume/size of individual erythrocytes in femtoliters (fL, 10⁻¹⁵ L).\nCalculation formula:\nMCV (fL) = [Hematocrit / Packed Cell Volume (%) × 10] / Red Blood Cell Count (million/µL).\n\nReference Range:\n• Normal / Normocytic: 83 - 101 fL\n\nClinical Interpretation & Differential Diagnosis:\n\n1. Microcytic Anemia (Low MCV < 83 fL):\n   Indicates abnormally small red blood cells.\n   Common Etiologies:\n   • Iron Deficiency Anemia (most frequent cause worldwide)\n   • Thalassemia Minor / Major / Traits (defective alpha or beta globin chain synthesis; characteristically high RBC count with very low MCV and Mentzer Index < 13)\n   • Sideroblastic Anemia (impaired heme synthesis)\n   • Anemia of Chronic Disease / Chronic Inflammation (late or severe stages)\n   • Chronic Lead Toxicity\n\n2. Macrocytic Anemia (High MCV > 101 fL):\n   Indicates abnormally large red blood cells.\n   Common Etiologies:\n   • Megaloblastic Anemias: Vitamin B12 deficiency (pernicious anemia, malabsorption) or Folate deficiency (impaired DNA synthesis with nuclear-cytoplasmic dyssynchrony and hypersegmented neutrophils)\n   • Non-Megaloblastic Macrocytosis:\n     - Chronic Liver Disease / Cirrhosis\n     - Chronic Alcoholism (direct bone marrow toxicity)\n     - Hypothyroidism / Myxedema\n     - Myelodysplastic Syndromes (MDS) / Aplastic Anemia\n     - Reticulocytosis (marked hemolytic anemia or acute post-hemorrhage response)\n     - Drugs: Chemotherapeutic agents (Hydroxyurea, Methotrexate, Azathioprine), antiretrovirals (Zidovudine)\n     - Cold agglutinins (clumped RBCs falsely read as single large cells by automated analyzers)\n\n3. Normocytic Anemia (Normal MCV 83 - 101 fL):\n   Indicates normal cell size in the setting of decreased total hemoglobin.\n   Common Etiologies:\n   • Acute Blood Loss / Hemorrhage\n   • Early Iron Deficiency or Mixed Nutritional Anemia (combined B12 and Iron deficiency with wide RDW)\n   • Anemia of Chronic Renal Failure (decreased erythropoietin production)\n   • Bone Marrow Infiltration / Aplasia\n   • Hemolytic Anemias without marked reticulocytosis\n\nClinical Note:\nMCV must be interpreted alongside Red Cell Distribution Width (RDW), MCH, MCHC, Serum Ferritin, Vitamin B12/Folate levels, Reticulocyte count, and peripheral blood smear cytology.",
    "parameters": [
      {
        "name": "Mean Corpuscular Volume, MCV",
        "referenceRange": "83 - 101",
        "unit": "fL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Filarial Parasite (Card Test)",
    "title": "Filarial Parasite (Card Test)",
    "basePrice": 350,
    "taxPercentage": 0,
    "sampleType": "Whole Blood / Serum",
    "turnaroundTime": "2 Hours",
    "description": "Rapid immunochromatographic card test for the qualitative detection of circulating Wuchereria bancrofti filarial antigens in human blood/serum.",
    "notes": "",
    "interpretation": "Result | Remarks\nDetected | Indicates the presence of circulating Wuchereria bancrofti antigen.\nNot Detected | Indicates absence of circulating Wuchereria bancrofti antigen\n\nNote:\n- Positive results are seen in parasitic disease of the human lymph system caused by Wuchereria bancrofti (W. bancrofti) leading to conditions like lymphedema, hydrocele and disfiguring disease of elephantiasis.\n- Results should be correlated with clinical conditions and tests like thick smear microscopy and membrane filtration test.\n- False positive results may be due to cross-reactivity with Loa loa spp or other nematode infection.\n- False negative reactions may be due to the processing of samples collected early in the course of disease or low threshold of antigen. The test should be repeated on a new specimen obtained after two weeks.\n\nUses\n- To diagnose lymphatic and non-lymphatic filariasis.\n- For mapping the endemicity of lymphatic filariasis.\n- For monitoring and transmission assessment surveys (TAS) of Wuchereria bancrofti.",
    "parameters": [
      {
        "name": "Filarial Parasite (Card Test)",
        "referenceRange": "Not Detected",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Not Detected",
            "isAbnormal": false
          },
          {
            "value": "Detected",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          },
          {
            "value": "Equivocal",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Microalbumin Creatinine Ratio, Urine Random",
    "title": "Microalbumin Creatinine Ratio, Urine Random",
    "basePrice": 450,
    "taxPercentage": 0,
    "sampleType": "Urine (Random / First Morning)",
    "turnaroundTime": "4 Hours",
    "description": "Quantitative determination of urine microalbumin and urinary creatinine to calculate the Urine Albumin-to-Creatinine Ratio (UACR) for early detection of diabetic nephropathy and renal microvascular disease.",
    "notes": "",
    "interpretation": "Physiological Basis\nThe normal urinary albumin excretion is less than 30 mg/24 hr. On random spot urine collection, the albumin-to-creatinine ratio (ACR, mcg/mg) should be less than 30.\n\nCategory | Spot collection ACR (mg/g)\nNormal | < 30\nMicroalbuminuria | 30-300\nClinical albuminuria | > 300\n\nInterpretation\nIncreased in: Diabetes mellitus, diabetic nephropathy.\n\nComments\nMicroalbuminuria is a useful indicator of early nephropathy in diabetic patients. Urine albumin measurement requires a sensitive immunochemical assay. Urine dipstick analysis is often insensitive to microalbuminuria. Screening for microalbuminuria is often performed by measurement of the ACR in a random spot collection (preferred method).",
    "parameters": [
      {
        "name": "Microalbuminuria",
        "referenceRange": "0 - 25",
        "unit": "mg/L",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Urinary creatinine",
        "referenceRange": "28 - 217",
        "unit": "mg/dL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Urinary Albumin Creatinine Ratio (UACR)",
        "referenceRange": "<30",
        "unit": "mg/g",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Microalbumin, Urine 24 hours",
    "title": "Microalbumin, Urine 24 hours",
    "basePrice": 400,
    "taxPercentage": 0,
    "sampleType": "Urine (24-Hour Collection)",
    "turnaroundTime": "24 Hours",
    "description": "Quantitative determination of microalbumin excretion in a 24-hour urine collection using immunoturbidimetry to assess early diabetic nephropathy and renal microvascular disease.",
    "notes": "",
    "interpretation": "Physiological Basis & Clinical Significance:\nMicroalbuminuria refers to urinary albumin excretion that is above normal physiological levels but below the detection threshold of conventional urine dipstick tests. In healthy individuals, the glomerular filtration barrier restricts albumin excretion, resulting in less than 30 mg of albumin in a 24-hour urine collection.\n\nReference Interpretation (24-Hour Urine Collection):\n• Normal: < 30 mg/24hrs\n• Microalbuminuria (Incipient Nephropathy): 30 - 299 mg/24hrs\n• Clinical / Macroalbuminuria (Overt Nephropathy): > 300 mg/24hrs\n\nClinical Significance:\n1. Early Marker of Diabetic Nephropathy:\n   Microalbuminuria is the earliest clinically detectable sign of diabetic kidney disease in patients with Type 1 and Type 2 Diabetes Mellitus. Early detection allows timely intervention with glycemic control and ACE inhibitors/ARBs to slow or reverse disease progression.\n2. Cardiovascular Risk Marker:\n   Persistent microalbuminuria is an independent risk factor for cardiovascular morbidity and generalized vascular endothelial dysfunction in hypertensive and non-diabetic patients.\n3. Other Causes:\n   Transient albuminuria may occur in high fever, strenuous physical exercise, severe urinary tract infections, acute heart failure, and acute hyperglycemia.\n\nNote & Collection Guidelines:\n• A complete 24-hour timed urine collection with accurate total volume measurement is essential for accurate quantitative calculation (mg/24 hours = Urine Albumin [mg/L] × Total Urine Volume [L]).\n• Repeat testing (2 out of 3 specimens positive over a 3 to 6-month period) is recommended to confirm persistent microalbuminuria.",
    "parameters": [
      {
        "name": "Albumin/Microalbumin in Urine",
        "referenceRange": "<= 30",
        "unit": "mg/L",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Urine volume, Total",
        "referenceRange": "",
        "unit": "ml",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      },
      {
        "name": "Albumin/Microalbumin by Immunoturbidimetry",
        "referenceRange": "Normal: <30 / Microalbuminuria: 30-299 / Clinical albuminuria: >300",
        "unit": "mg/24hrs",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Morphology",
    "title": "Morphology",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "4 Hours",
    "description": "Microscopic examination of peripheral blood smear (PBS) morphology evaluating the structural characteristics, size, shape, and maturity of erythrocytes, leukocytes, and thrombocytes.",
    "notes": "",
    "interpretation": "Clinical Significance & Physiological Basis:\nPeripheral Blood Smear (PBS) Morphology examination provides a qualitative and quantitative microscopic evaluation of cellular components of blood (erythrocytes, leukocytes, and thrombocytes). It serves as an invaluable diagnostic tool that complements automated hematology analyzer parameters.\n\n1. RBC Morphology (Erythrocytes):\n• Normocytic Normochromic: Normal size (MCV 80-100 fL) and normal central pallor (1/3 of cell diameter).\n• Microcytic Hypochromic: Seen in Iron Deficiency Anemia, Thalassemia, Anemia of Chronic Disease, Sideroblastic Anemia.\n• Macrocytic / Megaloblastic: Oval macrocytes seen in Vitamin B12 / Folate deficiency; round macrocytes in liver disease, alcoholism, reticulocytosis.\n• Anisopoikilocytosis: Variation in size (anisocytosis) and shape (poikilocytosis).\n• Specific Poikilocytes:\n  - Target Cells (Codocytes): Thalassemia, hemoglobinopathies (HbC, HbS), liver disease, post-splenectomy.\n  - Spherocytes: Hereditary Spherocytosis, Autoimmune Hemolytic Anemia (AIHA).\n  - Schistocytes (Fragmented RBCs / Helmet cells): Microangiopathic Hemolytic Anemia (TTP, HUS, DIC), mechanical heart valves.\n  - Sickle Cells (Drepanocytes): Sickle Cell Anemia (HbSS).\n  - Tear-drop cells (Dacryocytes): Primary Myelofibrosis, marrow infiltrative disorders.\n  - Acanthocytes / Echinocytes: Liver disease, abetalipoproteinemia / renal disease, uremia.\n• RBC Inclusions: Howell-Jolly bodies (hyposplenism), Basophilic stippling (lead poisoning, thalassemia), Cabot rings.\n\n2. WBC Morphology (Leukocytes):\n• Normal: Mature segmented neutrophils (2-5 lobes), lymphocytes, monocytes, eosinophils, and basophils.\n• Left Shift / Toxic Changes: Band forms, toxic granulation, Döhle bodies, and cytoplasmic vacuolation (seen in acute bacterial infections, sepsis, burns).\n• Hypersegmented Neutrophils (≥ 6 lobes): Hallmark of Megaloblastic Anemia (B12/Folate deficiency).\n• Reactive / Atypical Lymphocytes: Infectious Mononucleosis (EBV, CMV), viral hepatitis, acute viral infections.\n• Blast Cells / Immature Myeloid/Lymphoid Precursors: Acute Leukemias (AML, ALL), Myelodysplastic Syndromes, Chronic Leukemias (CML, CLL).\n• Auer Rods: Pathognomonic for Acute Myeloid Leukemia (AML).\n\n3. Platelet Morphology (Thrombocytes):\n• Normal: Adequate numbers (approx. 7-15 platelets per 100x oil-immersion field), normal granularity.\n• Giant / Large Platelets: Immune Thrombocytopenia (ITP), Bernard-Soulier syndrome, myeloproliferative neoplasms.\n• Platelet Clumping: EDTA-induced pseudothrombocytopenia (requires recollection with sodium citrate/heparin).\n\nClinical Correlation:\nMorphological findings must be correlated with clinical history, CBC indices (Hb, TLC, DLC, Platelet Count, MCV, RDW), and relevant biochemical investigations.",
    "parameters": [
      {
        "name": "RBC Morphology",
        "referenceRange": "Normocytic, Normochromic",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Normocytic, normochromic RBCs. No abnormal cells or parasites seen.",
            "isAbnormal": false
          },
          {
            "value": "Microcytic, hypochromic RBCs with mild to moderate anisopoikilocytosis.",
            "isAbnormal": true
          },
          {
            "value": "Macrocytic RBCs with oval macrocytes.",
            "isAbnormal": true
          },
          {
            "value": "Dimorphic red cell picture.",
            "isAbnormal": true
          },
          {
            "value": "Target cells and pencil cells seen.",
            "isAbnormal": true
          },
          {
            "value": "Polychromatophilic red cells and nucleated RBCs seen.",
            "isAbnormal": true
          },
          {
            "value": "Schistocytes and helmet cells seen.",
            "isAbnormal": true
          },
          {
            "value": "Spherocytes seen.",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "WBC Morphology",
        "referenceRange": "Normal morphology",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Normal in number, distribution, and mature morphology.",
            "isAbnormal": false
          },
          {
            "value": "Neutrophilic leukocytosis with toxic granulation and left shift.",
            "isAbnormal": true
          },
          {
            "value": "Hypersegmented neutrophils seen (megaloblastic changes).",
            "isAbnormal": true
          },
          {
            "value": "Relative/Absolute lymphocytosis with reactive/atypical lymphocytes.",
            "isAbnormal": true
          },
          {
            "value": "Eosinophilia present with normal morphology.",
            "isAbnormal": true
          },
          {
            "value": "Immature precursors / blast cells seen (advised flow cytometry / bone marrow biopsy).",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Platelet Morphology",
        "referenceRange": "Adequate, normal morphology",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Adequate in number, normal size and distribution.",
            "isAbnormal": false
          },
          {
            "value": "Reduced in number on smear (Thrombocytopenia).",
            "isAbnormal": true
          },
          {
            "value": "Increased in number on smear (Thrombocytosis).",
            "isAbnormal": true
          },
          {
            "value": "Giant platelets and large forms noted.",
            "isAbnormal": true
          },
          {
            "value": "Platelet clumping seen (suggest recollection in Citrate).",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Malaria Parasite (Card Test)",
    "title": "Malaria Parasite (Card Test)",
    "basePrice": 300,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "1 Hour",
    "description": "Rapid immunochromatographic card assay for the qualitative detection and differential diagnosis of Plasmodium falciparum (Pf HRP-2) and Plasmodium vivax (Pv pLDH) in whole blood.",
    "notes": "",
    "interpretation": "Malaria antigen detection-whole blood\nFour species of the plasmodium parasites are responsible for human malaria infection: P. falciparum, P. vivax, P. malariae and P. ovale. Early detection and differentiation of malaria is of paramount importance due to incidence of cerebral malaria and drug resistance associated with P. falciparum infection and to prevent serious morbidity and mortality worldwide.\n\nTest Utility\nThe current test is a qualitative test for detection of the P. falciparum specific histidine rich protein-2 (HRP-2) and P. vivax specific parasite lactate dehydrogenase (pLDH) in whole blood samples. The assay is able to detect and distinguish P. vivax and P. falciparum infections and also identify mixed infections.\n\nNotes & Limitations\nThe test detects P. falciparum specific HRP-2 and P. vivax specific LDH, a negative test result does not rule out infection with P. ovale and P. malariae. Constant exposure to the malarial parasites, as seen in areas of high endemicity, may result in positive results with doubtful clinical significance. Hence, the results must always be correlated with clinical history and relevant epidemiological and therapeutic context.",
    "parameters": [
      {
        "name": "Plasmodium falciparum \"Pf\"",
        "referenceRange": "NEGATIVE",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "NEGATIVE",
            "isAbnormal": false
          },
          {
            "value": "POSITIVE",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      },
      {
        "name": "Plasmodium vivax \"Pv\"",
        "referenceRange": "NEGATIVE",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "NEGATIVE",
            "isAbnormal": false
          },
          {
            "value": "POSITIVE",
            "isAbnormal": true
          },
          {
            "value": "Negative",
            "isAbnormal": false
          },
          {
            "value": "Positive",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Malaria Parasite (Microscopic)",
    "title": "Malaria Parasite (Microscopic)",
    "basePrice": 200,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA) / Fingerprick Smear",
    "turnaroundTime": "2 Hours",
    "description": "Microscopic examination of stained thick and thin peripheral blood films (Giemsa/Leishman stain) for the detection, identification, and speciation of malarial parasites (Plasmodium species).",
    "notes": "",
    "interpretation": "Clinical Significance & Physiological Basis:\nMicroscopic examination of Giemsa / Leishman stained peripheral blood smears (thick and thin blood films) remains the established gold standard for the laboratory diagnosis of malaria. Thick smears provide high sensitivity for detecting low parasitemia levels, while thin smears allow accurate species identification and quantitation of parasitemia.\n\nResult Interpretation:\n1. Not Seen / Negative:\n   • Indicates that no malarial parasites (trophozoites, schizonts, or gametocytes) were detected after examining a minimum of 200–300 oil immersion fields (1000x magnification) on the thick smear.\n   • Note: A single negative blood smear does not exclude malaria, especially in early infection or low parasite density. Serial blood smears collected every 8 to 12 hours over a 24 to 48-hour period are recommended if clinical suspicion persists.\n\n2. Positive / Seen:\n   Identifies intraerythrocytic malarial parasites with species differentiation:\n   • Plasmodium vivax (Pv): Enlarged infected erythrocytes, Schüffner's dots, amoeboid trophozoites, mature schizonts (12-24 merozoites), and round gametocytes.\n   • Plasmodium falciparum (Pf): Normal-sized RBCs, delicate ring forms (often multiple per cell or appliqué/marginal forms), Maurer's clefts, and characteristic crescent/banana-shaped gametocytes. High risk of severe/cerebral malaria and high parasitemia.\n   • Plasmodium malariae (Pm): Normal or slightly smaller RBCs, compact band forms, 'daisy head' schizonts (6-12 merozoites), Ziemann's dots.\n   • Plasmodium ovale (Po): Enlarged oval erythrocytes with fimbriated edges and James's dots.\n\nClinical Recommendation:\nIf positive for P. falciparum, quantitation of parasitemia (% infected RBCs or parasites/µL) should be calculated and monitored to assess therapeutic response and detect treatment failure or drug resistance.",
    "parameters": [
      {
        "name": "Malaria Parasite (Microscopic)",
        "referenceRange": "Not Seen",
        "unit": "",
        "gender": "Both",
        "valueOptions": [
          {
            "value": "Not Seen",
            "isAbnormal": false
          },
          {
            "value": "Seen - Plasmodium vivax (Pv) trophozoites / gametocytes seen",
            "isAbnormal": true
          },
          {
            "value": "Seen - Plasmodium falciparum (Pf) ring forms / gametocytes seen",
            "isAbnormal": true
          },
          {
            "value": "Seen - Mixed infection (P. vivax + P. falciparum)",
            "isAbnormal": true
          },
          {
            "value": "Negative for Malarial Parasite (MP)",
            "isAbnormal": false
          },
          {
            "value": "Positive for Malarial Parasite (MP)",
            "isAbnormal": true
          }
        ],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Mean Platelet Volume, MPV (Optional)",
    "title": "Mean Platelet Volume, MPV (Optional)",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Whole Blood (EDTA)",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of Mean Platelet Volume (MPV) in blood to evaluate the average size of circulating platelets and bone marrow megakaryocyte activity.",
    "notes": "",
    "interpretation": "Clinical Significance & Physiological Basis:\nMean Platelet Volume (MPV) is a calculated platelet index that measures the average physical size/volume of circulating thrombocytes (platelets) in femtoliters (fL). MPV reflects platelet production rate, bone marrow megakaryopoiesis activity, and platelet turnover.\n\nReference Range:\n• Normal: 6.5 - 12.0 fL\n\nClinical Interpretation & Differential Diagnosis:\n\n1. High MPV (> 12.0 fL) - Hyperdestructive / Regenerative States:\n   Larger platelets are younger, metabolically active platelets recently released from the bone marrow.\n   Common Etiologies:\n   • Accelerated Platelet Destruction / Turnover with compensatory bone marrow response:\n     - Immune / Idiopathic Thrombocytopenic Purpura (ITP)\n     - Disseminated Intravascular Coagulation (DIC)\n     - Thrombotic Thrombocytopenic Purpura (TTP) / Hemolytic Uremic Syndrome (HUS)\n     - Sepsis and severe acute infections\n     - Post-splenectomy\n   • Myeloproliferative Neoplasms (MPN): Essential Thrombocythemia, Primary Myelofibrosis, Polycythemia Vera\n   • Congenital Giant Platelet Syndromes: Bernard-Soulier syndrome, May-Hegglin anomaly\n   • Increased Cardiovascular Risk: High MPV is associated with heightened prothrombotic risk, acute myocardial infarction, ischemic stroke, and metabolic syndrome.\n\n2. Low MPV (< 6.5 fL) - Hypoproductive / Marrow Failure States:\n   Small platelets indicate impaired bone marrow megakaryocytopoiesis or production failure.\n   Common Etiologies:\n   • Aplastic Anemia and Bone Marrow Suppression (chemotherapy, radiation)\n   • Megaloblastic Anemia (due to Vitamin B12 or Folate deficiency)\n   • Hypersplenism (splenic sequestration of larger platelets)\n   • Chronic Renal Failure\n   • Wiskott-Aldrich Syndrome (classic microthrombocytopenia)\n\nClinical Note:\nMPV must always be evaluated in direct context with the Total Platelet Count, Platelet Distribution Width (PDW), and peripheral blood smear review. EDTA anticoagulant induces time-dependent platelet swelling; optimal measurement is obtained within 1 to 2 hours of venipuncture.",
    "parameters": [
      {
        "name": "Mean Platelet Volume, MPV (Optional)",
        "referenceRange": "6.5 - 12",
        "unit": "fL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Myoglobin",
    "title": "Myoglobin",
    "basePrice": 600,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of serum myoglobin concentration to assist in the early assessment of myocardial infarction, cardiac re-infarction, and skeletal muscle injury / rhabdomyolysis.",
    "notes": "",
    "interpretation": "Comments\nMyoglobin is a protein found in heart and skeletal muscle. It leaks into the blood when muscle cells are damaged. It's useful for detecting heart attacks, early re-infarctions, and successful treatment. Myoglobin levels rise about 2 hours after a heart attack, peak in 4-12 hours, and return to normal within 24 hours. Since myoglobin is cleared by the kidneys, any changes in kidney function can affect its levels.\n\nClinical Use\nTo rule out a heart attack, if myoglobin levels don't change in several samples taken 2-6 hours after chest pain starts, it almost certainly means there's no heart muscle damage.",
    "parameters": [
      {
        "name": "Myoglobin",
        "referenceRange": "< 70",
        "unit": "ng/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "Non-HDL cholesterol",
    "title": "Non-HDL cholesterol",
    "basePrice": 150,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination and calculation of Non-HDL Cholesterol (Total Cholesterol minus HDL) to evaluate total atherogenic lipoprotein burden and cardiovascular disease risk.",
    "notes": "",
    "interpretation": "Clinical Significance & Physiological Basis:\nNon-HDL Cholesterol represents the total amount of cholesterol carried in all atherogenic (artery-clogging) apolipoprotein B-containing lipoproteins, which includes LDL (Low-Density Lipoprotein), VLDL (Very Low-Density Lipoprotein), IDL (Intermediate-Density Lipoprotein), and Lipoprotein(a).\nCalculation Formula:\nNon-HDL Cholesterol (mg/dL) = Total Cholesterol - HDL Cholesterol.\n\nReference Classification (NCEP ATP III / ACC/AHA Guidelines):\n• Desirable / Optimal: < 130 mg/dL (Goal for low to moderate cardiovascular risk)\n• Borderline High: 130 - 159 mg/dL\n• High: 160 - 189 mg/dL\n• Very High: ≥ 190 mg/dL\n\nTherapeutic Targets Based on Atherosclerotic Cardiovascular Disease (ASCVD) Risk:\n• Extreme Risk / Established ASCVD with DM: < 80 mg/dL (or < 70 mg/dL)\n• Very High Risk (Known ASCVD or Diabetes with Target Organ Damage): < 100 mg/dL\n• Moderate to High Risk: < 130 mg/dL\n\nClinical Advantages of Non-HDL Cholesterol:\n1. Better Cardiovascular Predictor than LDL alone:\n   Non-HDL cholesterol accounts for all atherogenic particles (including triglyceride-rich remnant lipoproteins like VLDL and IDL), making it a superior predictor of cardiovascular risk, myocardial infarction, and ischemic stroke.\n2. Highly Reliable in Hypertriglyceridemia & Diabetes:\n   In patients with hypertriglyceridemia (triglycerides > 200 mg/dL), diabetes mellitus, metabolic syndrome, or obesity, calculated LDL-C (Friedewald formula) often underestimates atherogenic particle burden. Non-HDL-C remains robust and accurate even when triglycerides are elevated.\n3. Fasting vs Non-Fasting Utility:\n   Non-HDL cholesterol is less affected by postprandial lipemia and can be evaluated on non-fasting blood samples.\n\nClinical Note:\nElevated Non-HDL cholesterol should be managed with lifestyle modifications (dietary changes, aerobic exercise, weight reduction) and guideline-directed lipid-lowering therapies (statins, ezetimibe, PCSK9 inhibitors) based on global ASCVD risk assessment.",
    "parameters": [
      {
        "name": "Non-HDL cholesterol",
        "referenceRange": "< 130",
        "unit": "mg/dL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  },
  {
    "category": "LAB",
    "test": "NT- ProBNP (N-TERMINAL PRO B TYPE NATRIURETIC PEPTIDE)",
    "title": "NT- ProBNP (N-TERMINAL PRO B TYPE NATRIURETIC PEPTIDE)",
    "basePrice": 1500,
    "taxPercentage": 0,
    "sampleType": "Blood Serum / Plasma",
    "turnaroundTime": "2 Hours",
    "description": "Quantitative determination of N-Terminal Pro-B-Type Natriuretic Peptide (NT-proBNP) in blood to aid in the diagnosis, risk stratification, and monitoring of congestive heart failure and cardiac dysfunction.",
    "notes": "",
    "interpretation": "Chronic Heart failure\nAGE OF PATIENTS | TITER | Result\n<75 Year | <125 Pg/ml | Chronic heart failure unlikely\n≥75 Year | <450 Pg/ml | Chronic heart failure unlikely\n\nACUTE HEART FAILURE\nAGE OF PATIENTS | TITER | Result\n<50 YEAR | <450 Pg/ml | Acute heart failure unlikely (Positive if >450 pg/mL)\n50-75 YEAR | <900 Pg/ml | Acute heart failure unlikely (Positive if >900 pg/mL)\n>75 YEARS | <1800 Pg/ml | Acute heart failure unlikely (Positive if >1800 pg/mL)\n\nClinical Significance & Physiological Basis:\nN-Terminal pro-B-type Natriuretic Peptide (NT-proBNP) is an inactive 76-amino acid N-terminal fragment cleaved from proBNP during the release of the active hormone BNP by ventricular cardiomyocytes in response to increased myocardial wall stress, ventricular stretch, volume overload, and pressure overload. NT-proBNP has a longer biological half-life (~70–120 minutes) than BNP, offering higher diagnostic stability and sensitivity for heart failure.\n\nReference Range (General Normal Baseline):\n• Normal / Low Risk: 0 - 115 pg/mL (or < 125 pg/mL for age < 75 yrs)\n\nDiagnostic Cut-Offs & Clinical Interpretation:\n\n1. Rule-Out Criteria for Chronic Heart Failure (Non-Acute Outpatient Setting):\n• Age < 75 Years: < 125 pg/mL → Chronic heart failure unlikely\n• Age ≥ 75 Years: < 450 pg/mL → Chronic heart failure unlikely\n\n2. Age-Stratified Decision Cut-Offs for Acute Heart Failure (Emergency / Inpatient Setting):\n• Age < 50 Years:\n  - < 450 pg/mL: Acute heart failure unlikely (Rule-out)\n  - > 450 pg/mL: Highly suggestive of Acute Heart Failure\n• Age 50 - 75 Years:\n  - < 900 pg/mL: Acute heart failure unlikely (Rule-out)\n  - > 900 pg/mL: Highly suggestive of Acute Heart Failure\n• Age > 75 Years:\n  - < 1800 pg/mL: Acute heart failure unlikely (Rule-out)\n  - > 1800 pg/mL: Highly suggestive of Acute Heart Failure\n\n3. Clinical Confounders & Other Causes of Elevation:\n• Renal Insufficiency / CKD (NT-proBNP is primarily cleared via renal filtration; eGFR < 60 mL/min leads to reduced clearance)\n• Atrial Fibrillation / Tachyarrhythmias\n• Pulmonary Embolism / Pulmonary Arterial Hypertension (Right ventricular strain)\n• Severe Sepsis / Critical Illness / Advanced Age\n• Acute Coronary Syndromes (ACS) / Myocardial Infarction\n• Note: Lower NT-proBNP levels may be observed in patients with obesity (high BMI).\n\nClinical Application:\nNT-proBNP is recommended for:\n- Differentiating cardiac dyspnea from non-cardiac causes of shortness of breath.\n- Risk stratification, prognostic assessment, and monitoring therapeutic response in acute and chronic heart failure.",
    "parameters": [
      {
        "name": "NT- ProBNP (N-TERMINAL PRO B TYPE NATRIURETIC PEPTIDE)",
        "referenceRange": "0 - 115",
        "unit": "pg/mL",
        "gender": "Both",
        "valueOptions": [],
        "status": "Active"
      }
    ]
  }
];

async function seedStandardLabTemplates() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding standard lab templates...');

    let seededCount = 0;
    let updatedCount = 0;

    for (const testData of standardTests) {
      const key = normalizeKey(testData.title || testData.test);
      const existing = await LabTest.findOne({
        $or: [
          { testKey: key },
          { title: testData.title },
          { test: testData.test }
        ]
      });

      if (!existing) {
        await LabTest.create({
          ...testData,
          testKey: key
        });
        seededCount++;
      } else {
        existing.category = testData.category || existing.category;
        existing.sampleType = testData.sampleType || existing.sampleType;
        existing.turnaroundTime = testData.turnaroundTime || existing.turnaroundTime;
        existing.basePrice = testData.basePrice || existing.basePrice;
        existing.description = testData.description || existing.description;
        existing.interpretation = testData.interpretation || existing.interpretation;
        existing.notes = testData.notes || existing.notes;
        existing.parameters = testData.parameters || existing.parameters;
        await existing.save();
        updatedCount++;
      }
    }

    console.log(`Seeding finished! Seeded: ${seededCount}, Updated: ${updatedCount} templates.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding standard lab templates:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedStandardLabTemplates();
}

module.exports = { standardTests, seedStandardLabTemplates };
