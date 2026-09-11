/**
 * Test Suite: ABDM Step 3 — Structured FHIR R4 Mapping & Clinical Resource Verification
 * 
 * Verifies that real Medora records are accurately transformed into structured FHIR R4 resources:
 * 1. OPD Consultation: Composition + Patient + Practitioner + Organization + Encounter + Condition + MedicationRequest
 * 2. Standalone Prescription: Composition + Patient + Practitioner + Organization + Encounter + MedicationRequest(s)
 * 3. Diagnostic Lab Report: Composition + Patient + Practitioner + Organization + Encounter + DiagnosticReport + Observation(s)
 * 4. IPD Discharge Summary: Composition + Patient + Practitioner + Organization + Encounter (IMP) + Condition + MedicationRequest(s)
 * 5. Full UUID cross-referencing validation across all resources.
 * 6. Fidelius ECDH encryption & decryption verification with real bundles.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const IpdAdmission = require('../models/IpdAdmission');
const IpdDischarge = require('../models/IpdDischarge');
const LabRequest = require('../models/LabRequest');
const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');
const { generateFhirBundle } = require('../modules/abdm-m2/services/m2FhirService');
const { encryptData, decryptData, generateKeyMaterial } = require('../modules/abdm-m2/services/m2CryptoService');

let passedTests = 0;
let failedTests = 0;

const assert = (condition, description) => {
    if (condition) {
        console.log(`  ✅ [PASS] ${description}`);
        passedTests++;
    } else {
        console.error(`  ❌ [FAIL] ${description}`);
        failedTests++;
    }
};

const runStep3TestSuite = async () => {
    console.log('========================================================================');
    console.log('       MEDORA360 ABDM M2 STEP 3: STRUCTURED FHIR R4 MAPPING TESTS      ');
    console.log('========================================================================\n');

    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hospital_management';
        await mongoose.connect(mongoUri);
        console.log('📦 Connected to MongoDB.\n');

        const testSuffix = Date.now().toString().slice(-6);

        // 1. Setup Test Hospital & Doctor
        console.log('▶ TEST 1: Setting up Hospital & Doctor Metadata');
        const testHospital = await Hospital.create({
            name: `Medora City Hospital ${testSuffix}`,
            loginId: `hospital_${testSuffix}`,
            password: 'HospitalPassword123!',
            code: `HOSP-${testSuffix}`
        });

        const testDoctor = await User.create({
            hospitalId: testHospital._id,
            username: `dr_smith_${testSuffix}`,
            password: 'DoctorPassword123!',
            role: 'doctor',
            doctorName: `Dr. Sarah Smith ${testSuffix}`,
            department: 'Cardiology',
            specialization: 'Interventional Cardiology, MD, DM',
            mobile: `987654${testSuffix}`
        });
        assert(testHospital && testDoctor, 'Created test Hospital and Doctor records');

        // 2. Setup Test Patient
        console.log('\n▶ TEST 2: Setting up Patient Record');
        const testPatient = await Patient.create({
            hospitalId: testHospital._id,
            uhid: `UHID-${testSuffix}`,
            patientName: `Aarav Sharma ${testSuffix}`,
            mobile: `9812${testSuffix}`,
            gender: 'Male',
            dob: new Date('1988-04-12'),
            address: '123 Health Ave, Bangalore, KA, India',
            abhaAddress: `aarav${testSuffix}@sbx`,
            abhaNumber: `91-1234-${testSuffix}-9999`,
            abhaStatus: 'ACTIVE',
            abhaVerificationStatus: 'VERIFIED'
        });
        assert(testPatient && testPatient.uhid, `Created test Patient [${testPatient.patientName}]`);

        // 3. Test OPD Consultation FHIR Bundle Generation
        console.log('\n▶ TEST 3: Structured OPD Consultation FHIR Mapping');
        const testVisit = await Visit.create({
            hospitalId: testHospital._id,
            patientId: testPatient._id,
            uhid: testPatient.uhid,
            registrationNumber: `OPD-REG-${testSuffix}`,
            registrationDate: new Date(),
            visitType: 'OPD',
            department: 'Cardiology',
            doctorId: testDoctor._id,
            appointmentDate: '2026-09-11',
            slot: '10:30 AM'
        });

        const testConsultation = await Consultation.create({
            hospitalId: testHospital._id,
            patientId: testPatient._id,
            doctorId: testDoctor._id,
            visitId: testVisit._id,
            symptoms: [
                { symptom: 'Chest Pain on Exertion', durationDays: 7, durationUnit: 'Days' },
                { symptom: 'Shortness of Breath', durationDays: 3, durationUnit: 'Days' }
            ],
            diagnosisRemark: 'Stable Angina Pectoris',
            patientAdvice: 'Avoid strenuous exertion. Follow low-sodium diet.',
            consultationStatus: 'completed',
            consultationDateTime: new Date()
        });

        const testOpdPrescription = await Prescription.create({
            hospitalId: testHospital._id,
            patientId: testPatient._id,
            doctorId: testDoctor._id,
            visitId: testVisit._id,
            consultationId: testConsultation._id,
            medicines: [
                { medicine: 'Nitroglycerin 2.6mg', dosageForm: 'Tablet', dose: '1 tab', morning: true, night: true, duration: '14 days' },
                { medicine: 'Metoprolol 50mg', dosageForm: 'Tablet', dose: '1 tab', morning: true, duration: '30 days' }
            ],
            diagnosisRemark: 'Stable Angina Pectoris',
            prescriptionDateTime: new Date()
        });

        const opdBundleJson = generateFhirBundle(testPatient, testVisit, 'OPD', {
            doctor: testDoctor,
            hospital: testHospital,
            consultation: testConsultation,
            prescription: testOpdPrescription
        });
        const opdBundle = JSON.parse(opdBundleJson);

        assert(opdBundle.resourceType === 'Bundle', 'OPD resourceType is Bundle');
        assert(opdBundle.entry[0].resource.resourceType === 'Composition', 'First entry is Composition');
        assert(opdBundle.entry[0].resource.meta.profile.includes('https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPConsultationRecord'), 'Composition profile is OPConsultationRecord');

        const opdPatient = opdBundle.entry.find(e => e.resource.resourceType === 'Patient')?.resource;
        const opdPractitioner = opdBundle.entry.find(e => e.resource.resourceType === 'Practitioner')?.resource;
        const opdOrg = opdBundle.entry.find(e => e.resource.resourceType === 'Organization')?.resource;
        const opdEncounter = opdBundle.entry.find(e => e.resource.resourceType === 'Encounter')?.resource;
        const opdConditions = opdBundle.entry.filter(e => e.resource.resourceType === 'Condition').map(e => e.resource);
        const opdMedReqs = opdBundle.entry.filter(e => e.resource.resourceType === 'MedicationRequest').map(e => e.resource);

        assert(opdPatient && opdPatient.identifier.some(id => id.value === testPatient.abhaAddress), 'Patient resource contains ABHA address');
        assert(opdPractitioner && opdPractitioner.name[0].text === testDoctor.doctorName, `Practitioner resource contains doctor name [${testDoctor.doctorName}]`);
        assert(opdOrg && opdOrg.name === testHospital.name, `Organization resource contains hospital name [${testHospital.name}]`);
        assert(opdEncounter && opdEncounter.class.code === 'AMB', 'Encounter class is ambulatory (AMB)');
        assert(opdConditions.length >= 2, `Conditions generated for diagnosis and symptoms (Count: ${opdConditions.length})`);
        assert(opdConditions.some(c => c.code.text === 'Stable Angina Pectoris'), 'Condition includes "Stable Angina Pectoris"');
        assert(opdMedReqs.length === 2, `MedicationRequests generated for prescribed drugs (Count: ${opdMedReqs.length})`);
        assert(opdMedReqs.some(m => m.medicationCodeableConcept.text.includes('Metoprolol')), 'MedicationRequest includes Metoprolol');

        // 4. Test Laboratory DiagnosticReport & Observation FHIR Mapping
        console.log('\n▶ TEST 4: Structured Laboratory FHIR Mapping (DiagnosticReport + Observation)');
        const testLab = await LabRequest.create({
            hospitalId: testHospital._id,
            patientId: testPatient._id,
            doctorId: testDoctor._id,
            tests: ['Complete Lipid Profile', 'Cardiac Enzymes (Troponin-I)'],
            bookingDate: new Date(),
            sampleStatus: 'Closed',
            reportStatus: 'Ready',
            report: {
                interpretation: 'Elevated LDL Cholesterol and borderline elevated Troponin-I.',
                remarks: 'Correlate clinically with ECG.',
                completionDate: new Date(),
                parameters: [
                    { name: 'Total Cholesterol', displayName: 'Serum Total Cholesterol', value: '240', unit: 'mg/dL', referenceRange: '< 200 mg/dL', isAbnormal: true },
                    { name: 'LDL Cholesterol', displayName: 'Serum LDL Direct', value: '160', unit: 'mg/dL', referenceRange: '< 100 mg/dL', isAbnormal: true },
                    { name: 'HDL Cholesterol', displayName: 'Serum HDL', value: '45', unit: 'mg/dL', referenceRange: '> 40 mg/dL', isAbnormal: false },
                    { name: 'Triglycerides', displayName: 'Serum Triglycerides', value: '180', unit: 'mg/dL', referenceRange: '< 150 mg/dL', isAbnormal: true },
                    { name: 'Troponin-I', displayName: 'High-Sensitivity Troponin-I', value: '0.04', unit: 'ng/mL', referenceRange: '< 0.03 ng/mL', isAbnormal: true }
                ]
            }
        });

        const labBundleJson = generateFhirBundle(testPatient, testLab, 'Lab', {
            doctor: testDoctor,
            hospital: testHospital,
            labRequest: testLab
        });
        const labBundle = JSON.parse(labBundleJson);

        assert(labBundle.entry[0].resource.meta.profile.includes('https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord'), 'Composition profile is DiagnosticReportRecord');

        const diagReport = labBundle.entry.find(e => e.resource.resourceType === 'DiagnosticReport')?.resource;
        const observations = labBundle.entry.filter(e => e.resource.resourceType === 'Observation').map(e => e.resource);

        assert(diagReport && diagReport.status === 'final', 'DiagnosticReport status is final');
        assert(diagReport.conclusion.includes('Elevated LDL'), 'DiagnosticReport contains clinical conclusion');
        assert(observations.length === 5, `Discrete Observation resources generated for all 5 test parameters (Count: ${observations.length})`);

        const ldlObs = observations.find(o => o.code.text.includes('LDL Direct'));
        assert(ldlObs && ldlObs.valueQuantity.value === 160 && ldlObs.valueQuantity.unit === 'mg/dL', 'LDL Observation has numeric value 160 mg/dL');
        assert(ldlObs.referenceRange[0].text === '< 100 mg/dL', 'LDL Observation preserves reference range');
        assert(ldlObs.interpretation && ldlObs.interpretation[0].coding[0].code === 'A', 'Abnormal parameter has interpretation code "A"');

        // 5. Test IPD Discharge Summary FHIR Mapping
        console.log('\n▶ TEST 5: Structured Inpatient Discharge Summary FHIR Mapping');
        const testAdmission = await IpdAdmission.create({
            hospitalId: testHospital._id,
            patientId: testPatient._id,
            ipdNumber: `IPD-${testSuffix}`,
            pidNumber: testPatient.uhid,
            admissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            status: 'Admitted',
            doctorInCharge: testDoctor._id,
            provisionalDiagnosis: 'Non-ST Elevation Myocardial Infarction (NSTEMI)'
        });

        const testDischarge = await IpdDischarge.create({
            hospitalId: testHospital._id,
            admissionId: testAdmission._id,
            patientId: testPatient._id,
            uhid: testPatient.uhid,
            pidNumber: testPatient.uhid,
            ipdNumber: testAdmission.ipdNumber,
            patientName: testPatient.patientName,
            admissionDate: testAdmission.admissionDate,
            dischargeDate: new Date(),
            diagnosisAtInternment: 'Coronary Artery Disease - Single Vessel Disease s/p PTCA',
            treatmentSummary: 'Coronary Angiography and Angioplasty with DES to LAD. Uneventful recovery.',
            physicianApproval: 'Yes',
            dischargeReason: 'Patient Treated',
            futureTreatmentRequired: 'Yes',
            medicationPrescribed: 'Yes',
            dischargingPhysicianTitle: 'Dr',
            dischargingPhysicianFirstName: 'Sarah',
            dischargingPhysicianLastName: `Smith ${testSuffix}`,
            dischargePrescription: [
                { medicineName: 'Ticagrelor 90mg', dosage: '1 tab', frequency: 'Twice daily', duration: '1 year', remarks: 'Antiplatelet' },
                { medicineName: 'Rosuvastatin 40mg', dosage: '1 tab', frequency: 'Night', duration: 'Ongoing', remarks: 'Statin' }
            ],
            status: 'Approved'
        });

        const dischargeBundleJson = generateFhirBundle(testPatient, testDischarge, 'DischargeSummary', {
            doctor: testDoctor,
            hospital: testHospital,
            admission: testAdmission,
            discharge: testDischarge
        });
        const dischargeBundle = JSON.parse(dischargeBundleJson);

        assert(dischargeBundle.entry[0].resource.meta.profile.includes('https://nrces.in/ndhm/fhir/r4/StructureDefinition/DischargeSummaryRecord'), 'Composition profile is DischargeSummaryRecord');

        const disEncounter = dischargeBundle.entry.find(e => e.resource.resourceType === 'Encounter')?.resource;
        const disCondition = dischargeBundle.entry.find(e => e.resource.resourceType === 'Condition')?.resource;
        const disMedReqs = dischargeBundle.entry.filter(e => e.resource.resourceType === 'MedicationRequest').map(e => e.resource);

        assert(disEncounter && disEncounter.class.code === 'IMP', 'Encounter class is inpatient (IMP)');
        assert(disCondition && disCondition.code.text.includes('Coronary Artery Disease'), 'Condition contains internment diagnosis');
        assert(disMedReqs.length === 2, `MedicationRequests generated for discharge medications (Count: ${disMedReqs.length})`);
        assert(disMedReqs.some(m => m.medicationCodeableConcept.text.includes('Ticagrelor')), 'Discharge medication includes Ticagrelor');

        // 6. Test Cross-Resource UUID Referencing Integrity
        console.log('\n▶ TEST 6: Verifying UUID Cross-Referencing & Narrative Integrity');
        const validateBundleReferences = (bundle, label) => {
            const definedUuids = new Set(bundle.entry.map(e => e.fullUrl));
            let refCount = 0;
            let brokenCount = 0;

            const checkRef = (refStr) => {
                if (!refStr || !refStr.startsWith('urn:uuid:')) return;
                refCount++;
                if (!definedUuids.has(refStr)) {
                    console.error(`Broken ref in ${label}: ${refStr}`);
                    brokenCount++;
                }
            };

            for (const entry of bundle.entry) {
                const res = entry.resource;
                if (res.subject?.reference) checkRef(res.subject.reference);
                if (res.encounter?.reference) checkRef(res.encounter.reference);
                if (res.requester?.reference) checkRef(res.requester.reference);
                if (res.serviceProvider?.reference) checkRef(res.serviceProvider.reference);
                if (res.custodian?.reference) checkRef(res.custodian.reference);
                if (Array.isArray(res.author)) res.author.forEach(a => checkRef(a.reference));
                if (Array.isArray(res.participant)) res.participant.forEach(p => checkRef(p.individual?.reference));
                if (Array.isArray(res.result)) res.result.forEach(r => checkRef(r.reference));
                if (Array.isArray(res.section)) {
                    res.section.forEach(sec => {
                        if (Array.isArray(sec.entry)) sec.entry.forEach(e => checkRef(e.reference));
                    });
                }
            }

            return { refCount, brokenCount };
        };

        const opdRefs = validateBundleReferences(opdBundle, 'OPD Bundle');
        const labRefs = validateBundleReferences(labBundle, 'Lab Bundle');
        const disRefs = validateBundleReferences(dischargeBundle, 'Discharge Bundle');

        assert(opdRefs.brokenCount === 0 && opdRefs.refCount > 5, `OPD bundle has 0 broken UUID references (Checked ${opdRefs.refCount} references)`);
        assert(labRefs.brokenCount === 0 && labRefs.refCount > 5, `Lab bundle has 0 broken UUID references (Checked ${labRefs.refCount} references)`);
        assert(disRefs.brokenCount === 0 && disRefs.refCount > 5, `Discharge bundle has 0 broken UUID references (Checked ${disRefs.refCount} references)`);

        // 7. Test Fidelius Cryptography on Real Generated Bundles
        console.log('\n▶ TEST 7: Fidelius Encryption & Decryption on Structured Bundles');
        const crypto = require('crypto');
        const { publicKey: recPub, privateKey: recPriv } = crypto.generateKeyPairSync('x25519');
        const recRawPub = recPub.export({ type: 'spki', format: 'der' }).subarray(12);
        const recNonce = crypto.randomBytes(32);

        const recKeyMaterial = {
            cryptoAlg: 'ECDH',
            curve: 'Curve25519',
            dhPublicKey: { keyValue: recRawPub.toString('base64') },
            nonce: recNonce.toString('base64')
        };

        const encryptedOpd = encryptData(opdBundleJson, recKeyMaterial);

        assert(encryptedOpd.encryptedData && encryptedOpd.checksum && encryptedOpd.keyMaterial, 'Encrypted bundle payload, checksum, and sender keyMaterial generated');

        // Decrypt on Receiver side to verify accuracy
        const { importX25519PublicKey } = require('../modules/abdm-m2/services/m2CryptoService');
        const senderPub = importX25519PublicKey(encryptedOpd.keyMaterial.dhPublicKey.keyValue);
        const senderNonce = Buffer.from(encryptedOpd.keyMaterial.nonce, 'base64');
        const receiverSharedSecret = crypto.diffieHellman({ privateKey: recPriv, publicKey: senderPub });

        const xorSalt = Buffer.alloc(32);
        for (let i = 0; i < 32; i++) {
            xorSalt[i] = (senderNonce[i] || 0) ^ (recNonce[i] || 0);
        }

        const derived = Buffer.from(crypto.hkdfSync('sha256', receiverSharedSecret, xorSalt, Buffer.alloc(0), 44));
        const aesKey = derived.subarray(0, 32);
        const iv = derived.subarray(32, 44);

        const encryptedBuf = Buffer.from(encryptedOpd.encryptedData, 'base64');
        const tag = encryptedBuf.subarray(encryptedBuf.length - 16);
        const cipherText = encryptedBuf.subarray(0, encryptedBuf.length - 16);

        const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
        decipher.setAuthTag(tag);
        let decryptedOpdJson = decipher.update(cipherText, null, 'utf8');
        decryptedOpdJson += decipher.final('utf8');

        const decryptedOpdBundle = JSON.parse(decryptedOpdJson);

        assert(decryptedOpdBundle.resourceType === 'Bundle', 'Decrypted payload parsed as valid FHIR Bundle');
        assert(decryptedOpdBundle.id === opdBundle.id, 'Decrypted Bundle ID matches original');
        assert(decryptedOpdBundle.entry.length === opdBundle.entry.length, `Decrypted Bundle contains all ${opdBundle.entry.length} entries`);

        // Cleanup test fixtures
        console.log('\n▶ Cleaning up Step 3 Test Data...');
        await Hospital.findByIdAndDelete(testHospital._id);
        await User.findByIdAndDelete(testDoctor._id);
        await Patient.findByIdAndDelete(testPatient._id);
        await Visit.findByIdAndDelete(testVisit._id);
        await Consultation.findByIdAndDelete(testConsultation._id);
        await Prescription.findByIdAndDelete(testOpdPrescription._id);
        await LabRequest.findByIdAndDelete(testLab._id);
        await IpdAdmission.findByIdAndDelete(testAdmission._id);
        await IpdDischarge.findByIdAndDelete(testDischarge._id);
        console.log('🧹 Cleaned up test fixtures.');

        console.log('\n========================================================================');
        console.log(`STEP 3 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
        console.log('========================================================================\n');

        await mongoose.disconnect();
        process.exit(failedTests > 0 ? 1 : 0);

    } catch (err) {
        console.error('❌ Step 3 Test Suite execution error:', err);
        process.exit(1);
    }
};

runStep3TestSuite();
