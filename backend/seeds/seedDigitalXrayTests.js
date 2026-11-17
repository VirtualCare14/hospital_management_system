const mongoose = require('mongoose');
const path = require('path');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
const Hospital = require('../models/Hospital');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DIGITAL_XRAY_CATEGORY_NAME = 'DIGITAL XRAY';
const DIGITAL_XRAY_CATEGORY_KEY = 'digital xray';

const DIGITAL_XRAY_TESTS = [
  { title: 'Digital X-ray Chest PA', price: 500, description: 'Posteroanterior view of chest to evaluate lungs, heart, and chest wall digitally.' },
  { title: 'Digital X-ray Chest AP', price: 500, description: 'Anteroposterior digital radiograph of chest for bedridden or supine patients.' },
  { title: 'Digital X-ray Chest Lateral', price: 550, description: 'Lateral digital chest radiograph for retrosternal and retrocardiac visualization.' },
  { title: 'Digital X-ray Abdomen AP', price: 600, description: 'Digital anteroposterior radiograph of abdomen in erect or supine position.' },
  { title: 'Digital X-ray KUB', price: 600, description: 'Kidneys, Ureters, and Bladder digital radiograph for calculus or pathology.' },
  { title: 'Digital X-ray Skull AP', price: 550, description: 'Anteroposterior digital radiograph of skull and cranial vault.' },
  { title: 'Digital X-ray Skull Lateral', price: 550, description: 'Lateral digital radiograph of cranium, sella turcica, and facial bones.' },
  { title: 'Digital X-ray PNS', price: 500, description: 'Digital Paranasal Sinuses view (Water\'s view) for sinusitis and nasal cavity.' },
  { title: 'Digital X-ray Cervical Spine AP & Lateral', price: 700, description: 'Digital evaluation of cervical vertebrae in AP and Lateral projections.' },
  { title: 'Digital X-ray Thoracic Spine AP & Lateral', price: 700, description: 'Digital radiograph of dorsal/thoracic spine (AP and Lateral views).' },
  { title: 'Digital X-ray Lumbar Spine AP & Lateral', price: 750, description: 'Digital evaluation of lumbar vertebrae and lumbosacral junction (AP/Lat).' },
  { title: 'Digital X-ray Whole Spine', price: 1500, description: 'Full-length high-resolution digital spine imaging for deformity / scoliosis.' },
  { title: 'Digital X-ray Pelvis AP', price: 600, description: 'Digital anteroposterior view of pelvic girdle, sacroiliac joints, and hips.' },
  { title: 'Digital X-ray Hip Joint', price: 600, description: 'Digital radiograph of hip joint, acetabulum, and proximal femur.' },
  { title: 'Digital X-ray Shoulder Joint', price: 550, description: 'Digital imaging of glenohumeral joint, acromion, and clavicle.' },
  { title: 'Digital X-ray Clavicle', price: 500, description: 'Digital radiographic examination of clavicle (collarbone) for fracture or injury.' },
  { title: 'Digital X-ray Arm', price: 500, description: 'Digital radiographic view of humerus bone and adjacent soft tissues.' },
  { title: 'Digital X-ray Elbow Joint', price: 500, description: 'Digital imaging of elbow joint in AP and Lateral projections.' },
  { title: 'Digital X-ray Forearm', price: 500, description: 'Digital radiographic evaluation of radius and ulna bones.' },
  { title: 'Digital X-ray Wrist Joint', price: 500, description: 'Digital imaging of radiocarpal joint and carpal bones.' },
  { title: 'Digital X-ray Hand', price: 500, description: 'Digital radiograph of metacarpals and phalanges of hand (PA/Oblique).' },
  { title: 'Digital X-ray Finger', price: 450, description: 'High-detail digital radiograph of individual digit / finger phalanges.' },
  { title: 'Digital X-ray Femur', price: 550, description: 'Digital radiographic examination of thigh bone (femur).' },
  { title: 'Digital X-ray Knee Joint', price: 550, description: 'Digital AP and Lateral imaging of knee joint and patella.' },
  { title: 'Digital X-ray Leg', price: 550, description: 'Digital radiographic evaluation of tibia and fibula bones of lower leg.' },
  { title: 'Digital X-ray Ankle Joint', price: 500, description: 'Digital examination of ankle joint and mortise (AP/Lat/Mortise views).' },
  { title: 'Digital X-ray Foot', price: 500, description: 'Digital radiograph of tarsals, metatarsals, and phalanges of foot.' },
  { title: 'Digital X-ray Calcaneum', price: 500, description: 'Digital radiograph of heel bone (calcaneus) for spur, fracture, or arthritis.' },
  { title: 'Digital X-ray Ribs', price: 600, description: 'Digital radiographic examination of rib cage for fractures or lesions.' },
  { title: 'Digital X-ray Sternum', price: 550, description: 'Digital radiograph of sternum (breastbone) in lateral and oblique views.' },
  { title: 'Digital X-ray Sacrum & Coccyx', price: 650, description: 'Digital AP and Lateral imaging of sacrum and coccygeal vertebrae.' },
  { title: 'Digital X-ray SI Joint', price: 650, description: 'Digital imaging of sacroiliac joints for sacroiliitis or spondyloarthropathy.' },
  { title: 'Digital X-ray Mandible', price: 550, description: 'Digital radiograph of lower jawbone (mandible) for trauma or dental pathology.' },
  { title: 'Digital X-ray Nasal Bone', price: 500, description: 'Digital radiographic view of nasal bones for fractures.' },
  { title: 'Digital X-ray Neck Soft Tissue', price: 550, description: 'Digital lateral soft tissue imaging of neck for airway, retropharyngeal space, or adenoids.' }
];

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const defaultParameters = [
  {
    name: 'Findings',
    fieldType: 'Text',
    referenceRange: 'Normal digital radiographic appearance of visualized anatomy.',
    unit: '',
    description: 'Digital radiological observation and findings',
    status: 'Active'
  },
  {
    name: 'Impression',
    fieldType: 'Text',
    referenceRange: 'No significant abnormality detected on digital radiograph.',
    unit: '',
    description: 'Digital radiological impression / conclusion',
    status: 'Active'
  }
];

const ensureDigitalXrayCategoryForHospital = async (hospitalId) => {
  const resolvedHospitalId = hospitalId || null;
  const filter = { hospitalId: resolvedHospitalId, nameKey: DIGITAL_XRAY_CATEGORY_KEY };
  const update = {
    $set: {
      name: DIGITAL_XRAY_CATEGORY_NAME,
      nameKey: DIGITAL_XRAY_CATEGORY_KEY,
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
    if (err.code !== 11000) console.warn('Digital X-ray category ensure notice:', err.message);
  });
};

const ensureDigitalXrayTest = async (testItem, hospitalId = null) => {
  const key = normalizeKey(testItem.title);
  const filter = {
    hospitalId: hospitalId || null,
    categoryKey: DIGITAL_XRAY_CATEGORY_KEY,
    testKey: key
  };

  const update = {
    $set: {
      category: DIGITAL_XRAY_CATEGORY_NAME,
      categoryKey: DIGITAL_XRAY_CATEGORY_KEY,
      test: testItem.title,
      testKey: key,
      title: testItem.title,
      description: testItem.description || `${testItem.title} – digital X-ray investigation.`,
      status: 'Active'
    },
    $setOnInsert: {
      hospitalId: hospitalId || null,
      basePrice: Number(testItem.price) || 500,
      taxPercentage: 0,
      totalAmount: Number(testItem.price) || 500,
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

const seedDigitalXrayTests = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    console.log(`Ensuring global Digital X-ray category and ${DIGITAL_XRAY_TESTS.length} tests...`);
    await ensureDigitalXrayCategoryForHospital(null);

    let createdCount = 0;
    for (const testItem of DIGITAL_XRAY_TESTS) {
      await ensureDigitalXrayTest(testItem, null);
      createdCount++;
    }

    // Also ensure category is available for all active hospitals
    const hospitals = await Hospital.find({ isActive: true }).select('_id');
    for (const hospital of hospitals) {
      await ensureDigitalXrayCategoryForHospital(hospital._id);
    }

    console.log(`✓ Successfully seeded ${createdCount} Digital X-ray tests globally and ensured category for ${hospitals.length} hospital(s)!`);
    return { success: true, count: createdCount };
  } catch (error) {
    console.error('Error seeding Digital X-ray tests:', error);
    throw error;
  }
};

if (require.main === module) {
  seedDigitalXrayTests()
    .then(() => mongoose.connection.close())
    .catch((err) => {
      console.error(err);
      mongoose.connection.close();
      process.exit(1);
    });
}

module.exports = {
  DIGITAL_XRAY_CATEGORY_NAME,
  DIGITAL_XRAY_CATEGORY_KEY,
  DIGITAL_XRAY_TESTS,
  ensureDigitalXrayCategoryForHospital,
  ensureDigitalXrayTest,
  seedDigitalXrayTests
};

