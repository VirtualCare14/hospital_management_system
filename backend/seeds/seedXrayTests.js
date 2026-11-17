const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
const Hospital = require('../models/Hospital');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const XRAY_CATEGORY_NAME = 'XRAY';
const XRAY_CATEGORY_KEY = 'xray';

const XRAY_TESTS = [
  { title: 'Chest X-ray (PA)', price: 400, description: 'Posteroanterior view of chest to evaluate lungs, heart, and chest wall.' },
  { title: 'Chest X-ray (AP)', price: 400, description: 'Anteroposterior view of chest for supine or bedridden patients.' },
  { title: 'Chest X-ray (Lateral)', price: 450, description: 'Lateral view of chest to evaluate retrosternal and retrocardiac spaces.' },
  { title: 'Cervical Spine X-ray', price: 550, description: 'Radiographic examination of the cervical vertebrae (neck spine).' },
  { title: 'Thoracic Spine X-ray', price: 550, description: 'Radiographic evaluation of thoracic/dorsal vertebrae.' },
  { title: 'Lumbar Spine X-ray', price: 600, description: 'Radiographic evaluation of lumbar and lumbosacral spine.' },
  { title: 'Whole Spine X-ray', price: 1200, description: 'Full-length spine radiograph for scoliosis, kyphosis, or alignment.' },
  { title: 'Skull X-ray', price: 500, description: 'Radiographic examination of cranial bones, vault, and facial bones.' },
  { title: 'PNS X-ray', price: 450, description: 'Paranasal Sinuses view (Water\'s view) for sinusitis and sinus pathology.' },
  { title: 'Nasal Bone X-ray', price: 400, description: 'Radiographic examination for nasal bone fracture or trauma.' },
  { title: 'Shoulder X-ray', price: 450, description: 'Radiographic view of shoulder joint, humerus head, and glenoid.' },
  { title: 'Clavicle X-ray', price: 400, description: 'Radiograph of collarbone (clavicle) for fracture or dislocation.' },
  { title: 'Arm X-ray', price: 400, description: 'Radiographic evaluation of humerus bone and surrounding soft tissue.' },
  { title: 'Elbow X-ray', price: 400, description: 'Radiographic examination of elbow joint (AP and Lateral views).' },
  { title: 'Forearm X-ray', price: 400, description: 'Radiographic evaluation of radius and ulna bones.' },
  { title: 'Wrist X-ray', price: 400, description: 'Radiograph of wrist joint and carpal bones for injury or arthritis.' },
  { title: 'Hand X-ray', price: 400, description: 'Radiographic evaluation of metacarpals and phalanges of hand.' },
  { title: 'Finger X-ray', price: 350, description: 'Detailed radiograph of individual digit/finger phalanges and joints.' },
  { title: 'Pelvis X-ray', price: 500, description: 'Anteroposterior radiograph of pelvic girdle, sacroiliac joints, and hips.' },
  { title: 'Hip X-ray', price: 500, description: 'Radiographic evaluation of hip joint, femoral head, and acetabulum.' },
  { title: 'Femur X-ray', price: 450, description: 'Radiograph of thigh bone (femur) including hip or knee joint.' },
  { title: 'Knee X-ray', price: 450, description: 'Radiographic view of knee joint, patella, and femorotibial joint space.' },
  { title: 'Leg X-ray', price: 450, description: 'Radiographic evaluation of tibia and fibula bones of lower leg.' },
  { title: 'Ankle X-ray', price: 400, description: 'Radiographic examination of ankle mortise, talus, and malleoli.' },
  { title: 'Foot X-ray', price: 400, description: 'Radiograph of tarsals, metatarsals, and phalanges of foot.' },
  { title: 'Heel X-ray (Calcaneum)', price: 400, description: 'Radiographic evaluation of heel bone (calcaneus) for spur or fracture.' },
  { title: 'Abdomen X-ray (KUB)', price: 500, description: 'Kidneys, Ureters, and Bladder plain abdominal radiograph for stones or obstruction.' },
  { title: 'Dental X-ray', price: 250, description: 'Intraoral periapical or bitewing dental radiograph for tooth and bone root.' },
  { title: 'OPG (Orthopantomogram)', price: 600, description: 'Panoramic dental radiograph showing upper and lower jaws and all teeth.' },
  { title: 'Ribs X-ray', price: 500, description: 'Radiographic evaluation of rib cage for fractures, lesions, or trauma.' },
  { title: 'Sternum X-ray', price: 450, description: 'Lateral and oblique views of breastbone (sternum).' },
  { title: 'Sacrum X-ray', price: 500, description: 'Radiograph of sacral vertebrae for trauma, fracture, or coccydynia.' },
  { title: 'Coccyx X-ray', price: 500, description: 'Radiographic evaluation of tailbone (coccyx) for fracture or subluxation.' },
  { title: 'SI Joint X-ray', price: 550, description: 'Radiograph of sacroiliac joints for sacroiliitis or ankylosing spondylitis.' },
  { title: 'Mandible X-ray', price: 450, description: 'Radiographic examination of lower jawbone (mandible).' },
  { title: 'Neck Soft Tissue X-ray', price: 450, description: 'Lateral soft tissue view of neck to evaluate airway, adenoids, or foreign body.' },
  { title: 'Barium Swallow', price: 1200, description: 'Fluoroscopic / radiographic study of esophagus using barium contrast.' },
  { title: 'HSG (Hysterosalpingography)', price: 1800, description: 'Fluoroscopic examination of uterus and fallopian tubes using contrast.' },
  { title: 'IVU (Intravenous Urography)', price: 2000, description: 'Intravenous contrast study evaluating renal excretion, ureters, and bladder.' }
];

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const defaultParameters = [
  {
    name: 'Findings',
    fieldType: 'Text',
    referenceRange: 'Normal radiological appearance of the visualized structures.',
    unit: '',
    description: 'Radiological observation and findings',
    status: 'Active'
  },
  {
    name: 'Impression',
    fieldType: 'Text',
    referenceRange: 'No significant abnormality detected.',
    unit: '',
    description: 'Radiological impression / conclusion',
    status: 'Active'
  }
];

const ensureXrayCategoryForHospital = async (hospitalId) => {
  const resolvedHospitalId = hospitalId || null;
  // Ensure 'XRAY' category exists cleanly
  const filter = { hospitalId: resolvedHospitalId, nameKey: XRAY_CATEGORY_KEY };
  const update = {
    $set: {
      name: XRAY_CATEGORY_NAME,
      nameKey: XRAY_CATEGORY_KEY,
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
    if (err.code !== 11000) console.warn('Xray category ensure notice:', err.message);
  });
};

const ensureXrayTest = async (testItem, hospitalId = null) => {
  const key = normalizeKey(testItem.title);
  const filter = {
    hospitalId: hospitalId || null,
    categoryKey: XRAY_CATEGORY_KEY,
    testKey: key
  };

  const update = {
    $set: {
      category: XRAY_CATEGORY_NAME,
      categoryKey: XRAY_CATEGORY_KEY,
      test: testItem.title,
      testKey: key,
      title: testItem.title,
      description: testItem.description || `${testItem.title} – diagnostic X-ray investigation.`,
      status: 'Active'
    },
    $setOnInsert: {
      hospitalId: hospitalId || null,
      basePrice: Number(testItem.price) || 400,
      taxPercentage: 0,
      totalAmount: Number(testItem.price) || 400,
      isManualTotal: false,
      notes: '',
      interpretation: '',
      parameters: defaultParameters,
      revenueShare: 0,
      forGender: 'Both'
    }
  };

  return LabTest.findOneAndUpdate(filter, update, {
    upsert: true,
    returnDocument: 'after',
    setDefaultsOnInsert: true
  });
};

const seedXrayTests = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    console.log(`Ensuring global X-ray category and ${XRAY_TESTS.length} tests...`);
    await ensureXrayCategoryForHospital(null);

    let createdCount = 0;
    for (const testItem of XRAY_TESTS) {
      await ensureXrayTest(testItem, null);
      createdCount++;
    }

    // Also ensure category is available for all active hospitals
    const hospitals = await Hospital.find({ isActive: true }).select('_id');
    for (const hospital of hospitals) {
      await ensureXrayCategoryForHospital(hospital._id);
    }

    console.log(`✓ Successfully seeded ${createdCount} X-ray tests globally and ensured category for ${hospitals.length} hospital(s)!`);
    return { success: true, count: createdCount };
  } catch (error) {
    console.error('Error seeding X-ray tests:', error);
    throw error;
  }
};

if (require.main === module) {
  seedXrayTests()
    .then(() => mongoose.connection.close())
    .catch((err) => {
      console.error(err);
      mongoose.connection.close();
      process.exit(1);
    });
}

module.exports = {
  XRAY_CATEGORY_NAME,
  XRAY_CATEGORY_KEY,
  XRAY_TESTS,
  ensureXrayCategoryForHospital,
  ensureXrayTest,
  seedXrayTests
};

