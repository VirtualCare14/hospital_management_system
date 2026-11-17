const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
const Hospital = require('../models/Hospital');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const USG_CATEGORY_NAME = 'USG';
const USG_CATEGORY_KEY = 'usg';

const USG_TESTS = [
  { title: 'USG Whole Abdomen', price: 1000, description: 'Comprehensive ultrasound evaluation of liver, gallbladder, pancreas, spleen, kidneys, urinary bladder, and pelvic organs.' },
  { title: 'USG Upper Abdomen', price: 800, description: 'Sonographic imaging of hepato-biliary system, pancreas, spleen, and upper abdominal retroperitoneum.' },
  { title: 'USG Lower Abdomen', price: 800, description: 'Ultrasound examination of pelvic organs, bladder, prostate (males), or uterus and adnexa (females).' },
  { title: 'USG KUB', price: 900, description: 'Targeted sonography of Kidneys, Ureters, and Bladder to assess stones, hydronephrosis, or cystitis.' },
  { title: 'USG Pelvis', price: 850, description: 'Pelvic ultrasonography evaluating urinary bladder, reproductive organs, and pouch of Douglas.' },
  { title: 'USG Abdomen & Pelvis', price: 1200, description: 'Complete transabdominal ultrasound examination covering upper and lower abdomen and pelvis.' },
  { title: 'USG Pregnancy (Obstetric)', price: 1000, description: 'Obstetric sonography to evaluate gestational sac, fetal cardiac activity, biometry, amniotic fluid, and placenta.' },
  { title: 'USG Early Pregnancy', price: 900, description: 'First-trimester ultrasound confirming intrauterine pregnancy, cardiac flicker, and gestational age.' },
  { title: 'USG NT Scan', price: 1800, description: 'Nuchal Translucency and nasal bone assessment scan at 11-13+6 weeks for chromosomal aneuploidy risk.' },
  { title: 'USG Anomaly Scan', price: 2200, description: 'Detailed second-trimester target scan (18-20 weeks) evaluating fetal anatomical integrity.' },
  { title: 'USG Growth Scan', price: 1200, description: 'Third-trimester fetal growth, estimated fetal weight (EFW), liquor volume (AFI), and placental maturity.' },
  { title: 'USG Level 2 Scan', price: 2500, description: 'Advanced high-resolution targeted fetal anomaly ultrasound scan with detailed structural survey.' },
  { title: 'USG Follicular Study', price: 1200, description: 'Serial transabdominal or transvaginal monitoring of ovarian follicular growth and ovulation.' },
  { title: 'USG TVS (Transvaginal Sonography)', price: 1100, description: 'High-frequency endocavitary scan providing high-resolution pelvic and early pregnancy visualization.' },
  { title: 'USG TAS (Transabdominal Sonography)', price: 900, description: 'Transabdominal sonographic scan with full urinary bladder for pelvic organ assessment.' },
  { title: 'USG Breast', price: 1200, description: 'High-resolution bilateral breast ultrasound for palpable lumps, cysts, fibroadenomas, or ductal lesions.' },
  { title: 'USG Thyroid', price: 1000, description: 'High-resolution sonography of thyroid lobes and isthmus evaluating nodules, goiter, and vascularity.' },
  { title: 'USG Neck', price: 1100, description: 'Comprehensive ultrasound of anterior and lateral neck including lymph nodes, salivary glands, and soft tissues.' },
  { title: 'USG Scrotum', price: 1000, description: 'High-frequency ultrasound of scrotal sac, testes, epididymides, and testicular vascularity.' },
  { title: 'USG Testis', price: 1000, description: 'Focused testicular sonogram for hydrocele, varicocele, orchitis, trauma, or testicular masses.' },
  { title: 'USG Prostate', price: 900, description: 'Sonographic measurement of prostate volume, median lobe enlargement, and parenchymal echotexture.' },
  { title: 'USG Prostate with PVR', price: 1000, description: 'Prostatic assessment with pre-void and post-void residual (PVR) bladder urine measurement.' },
  { title: 'USG Renal', price: 900, description: 'Targeted ultrasound of both kidneys assessing size, corticomedullary differentiation, and calculus.' },
  { title: 'USG Liver', price: 800, description: 'Focused hepatic sonography for fatty infiltration, cirrhosis, hepatomegaly, or focal liver lesions.' },
  { title: 'USG Gallbladder', price: 800, description: 'Ultrasound evaluation for cholelithiasis (gallstones), wall thickening, sludge, or acute cholecystitis.' },
  { title: 'USG Pancreas', price: 800, description: 'Sonographic assessment of pancreatic head, body, and tail for pancreatitis, calcifications, or masses.' },
  { title: 'USG Spleen', price: 800, description: 'Ultrasound measurement of splenic size, splenomegaly, splenic index, or focal infarcts.' },
  { title: 'USG Appendix', price: 850, description: 'Targeted graded-compression sonogram of right iliac fossa for appendicitis, appendicolith, or fluid collection.' },
  { title: 'USG Soft Tissue', price: 900, description: 'High-frequency superficial scan of soft tissue swellings, lipomas, cysts, haematomas, or foreign bodies.' },
  { title: 'USG Inguinal Region', price: 950, description: 'Sonographic examination of inguinal canal for lymphadenopathy, hernia, or vascular abnormalities.' },
  { title: 'USG Hernia', price: 950, description: 'Dynamic ultrasound with Valsalva maneuver to identify hernia defect, sac contents, and reducibility.' },
  { title: 'USG Shoulder', price: 1200, description: 'Musculoskeletal ultrasound evaluating rotator cuff tendons, biceps tendon, and subacromial bursa.' },
  { title: 'USG Elbow', price: 1100, description: 'Musculoskeletal scan for tennis elbow, golfer elbow, joint effusion, or triceps tendon pathology.' },
  { title: 'USG Wrist', price: 1100, description: 'Targeted musculoskeletal sonogram for carpal tunnel syndrome, flexor tenosynovitis, or ganglion cyst.' },
  { title: 'USG Knee', price: 1200, description: 'Musculoskeletal scan assessing quadriceps/patellar tendons, collateral ligaments, Baker cyst, and effusion.' },
  { title: 'USG Ankle', price: 1100, description: 'Sonography of Achilles tendon, plantar fascia, peroneal tendons, and ankle ligaments.' },
  { title: 'USG Hip', price: 1200, description: 'Ultrasound of hip joint assessing joint effusion, synovitis, developmental dysplasia (DDH), or bursitis.' },
  { title: 'USG Doppler Lower Limb Arterial', price: 2200, description: 'Colour and spectral Doppler study of lower extremity arterial tree for stenosis, occlusions, or PVD.' },
  { title: 'USG Doppler Lower Limb Venous', price: 2200, description: 'Venous colour Doppler examination of lower limb deep and superficial veins for DVT and venous incompetence.' },
  { title: 'USG Doppler Upper Limb Arterial', price: 2000, description: 'Colour Doppler mapping of upper limb arteries evaluating patency, waveforms, and arterial stenosis.' },
  { title: 'USG Doppler Upper Limb Venous', price: 2000, description: 'Venous Doppler assessment of upper extremity veins for thrombosis or thoracic outlet syndrome.' },
  { title: 'USG Carotid Doppler', price: 2500, description: 'Bilateral carotid and vertebral Doppler examining intimal-medial thickness (IMT), plaques, and velocities.' },
  { title: 'USG Colour Doppler', price: 2000, description: 'Specialized color and spectral Doppler investigation for vascular hemodynamics and flow analysis.' },
  { title: 'USG Fetal Doppler', price: 1800, description: 'Obstetric Doppler examining umbilical artery, middle cerebral artery (MCA), and ductus venosus.' },
  { title: 'USG Obstetric Doppler', price: 1800, description: 'Uterine and umbilical artery Doppler evaluation for high-risk pregnancies and IUGR monitoring.' },
  { title: 'USG Portal Vein Doppler', price: 2200, description: 'Doppler study of portal venous system, hepatic veins, and IVC for portal hypertension and thrombosis.' },
  { title: 'USG Renal Doppler', price: 2200, description: 'Renal artery colour Doppler assessing peak systolic velocities and resistive index for renal artery stenosis.' },
  { title: 'USG Scrotal Doppler', price: 1800, description: 'Colour and duplex Doppler assessment of testicular vascularity to rule out testicular torsion or varicocele.' },
  { title: 'USG Guided FNAC', price: 2500, description: 'Real-time ultrasound-guided fine needle aspiration cytology for suspicious thyroid, breast, or soft tissue lesions.' },
  { title: 'USG Guided Biopsy', price: 3000, description: 'Real-time ultrasound guidance for core needle biopsy of liver, breast, prostate, or abdominal masses.' }
];

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const defaultParameters = [
  {
    name: 'Findings',
    fieldType: 'Text',
    referenceRange: 'Normal sonographic appearance of the visualized structures.',
    unit: '',
    description: 'Ultrasound imaging findings and observations',
    status: 'Active'
  },
  {
    name: 'Impression',
    fieldType: 'Text',
    referenceRange: 'No significant sonographic abnormality detected.',
    unit: '',
    description: 'Sonological impression and clinical correlation',
    status: 'Active'
  }
];

const ensureUsgCategoryForHospital = async (hospitalId) => {
  const resolvedHospitalId = hospitalId || null;
  const filter = { hospitalId: resolvedHospitalId, nameKey: USG_CATEGORY_KEY };
  const update = {
    $set: {
      name: USG_CATEGORY_NAME,
      nameKey: USG_CATEGORY_KEY,
      status: 'Active'
    },
    $setOnInsert: {
      hospitalId: resolvedHospitalId
    }
  };

  await LabTestCategory.findOneAndUpdate(filter, update, {
    upsert: true,
    returnDocument: 'after',
    setDefaultsOnInsert: true
  }).catch(err => {
    if (err.code !== 11000) console.warn('USG category ensure notice:', err.message);
  });
};

const ensureUsgTest = async (testItem, hospitalId = null) => {
  const key = normalizeKey(testItem.title);
  const filter = {
    hospitalId: hospitalId || null,
    categoryKey: USG_CATEGORY_KEY,
    testKey: key
  };

  const update = {
    $set: {
      hospitalId: hospitalId || null,
      category: USG_CATEGORY_NAME,
      categoryKey: USG_CATEGORY_KEY,
      test: testItem.title,
      testKey: key,
      title: testItem.title,
      description: testItem.description,
      basePrice: testItem.price,
      taxPercentage: 0,
      totalAmount: testItem.price,
      isManualTotal: false,
      status: 'Active',
      parameters: defaultParameters
    }
  };

  await LabTest.findOneAndUpdate(filter, update, {
    upsert: true,
    returnDocument: 'after',
    setDefaultsOnInsert: true
  });
};

const seedUsgTests = async () => {
  console.log(`Ensuring global USG tests (${USG_TESTS.length} tests)...`);

  for (const testItem of USG_TESTS) {
    await ensureUsgTest(testItem, null);
  }

  // Ensure category exists for all active hospitals
  const hospitals = await Hospital.find({});
  for (const hosp of hospitals) {
    await ensureUsgCategoryForHospital(hosp._id);
  }
  await ensureUsgCategoryForHospital(null);

  console.log('Global USG tests & categories seeded successfully.');
};

module.exports = {
  USG_CATEGORY_NAME,
  USG_CATEGORY_KEY,
  USG_TESTS,
  ensureUsgCategoryForHospital,
  ensureUsgTest,
  seedUsgTests
};

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('MongoDB connected for seeding USG tests.');
      await seedUsgTests();
      await mongoose.disconnect();
      console.log('Seeding finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('USG seed error:', err);
      process.exit(1);
    });
}

