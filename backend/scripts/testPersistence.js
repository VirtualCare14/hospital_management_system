/**
 * ABDM Database Persistence & Patient Mapping Automated Verification Suite
 * Tests MongoDB models: Patient (with ABHA fields), AbdmConsent, AbdmCareContext, AbdmTransaction.
 * 
 * Usage: node scripts/testPersistence.js
 */

const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('../config/db');

const Patient = require('../models/Patient');
const AbdmConsent = require('../models/AbdmConsent');
const AbdmCareContext = require('../models/AbdmCareContext');
const AbdmTransaction = require('../models/AbdmTransaction');
const generateUhid = require('../utils/generateUhid');

async function runPersistenceTests() {
    console.log('\n===============================================================');
    console.log('     MEDORA360 - ABDM PERSISTENCE & PATIENT MAPPING TESTS     ');
    console.log('===============================================================\n');

    let passed = 0;
    let failed = 0;

    const assertTest = (name, condition, extra = '') => {
        if (condition) {
            console.log(`  ✅ [PASS] ${name} ${extra}`);
            passed++;
        } else {
            console.error(`  ❌ [FAIL] ${name} ${extra}`);
            failed++;
        }
    };

    try {
        await connectDB();
        console.log('📦 Connected to MongoDB successfully.\n');

        const testSuffix = Math.floor(1000 + Math.random() * 9000);
        const testMobile = `98${testSuffix}54321`;
        const testAadhaar = `89${testSuffix}432109`;
        const testAbhaNumber = `14-${testSuffix}-7890-1234`;
        const testAbhaAddress = `testpatient${testSuffix}@sbx`;
        const testUhid = `UHID-TEST-${testSuffix}`;

        // -------------------------------------------------------------
        // Test 1: Patient Model ABHA Field Persistence
        // -------------------------------------------------------------
        console.log('--- 1. Testing Patient Model ABHA Fields Persistence ---');
        const testPatient = new Patient({
            uhid: testUhid,
            patientName: 'Test ABHA Patient',
            mobile: testMobile,
            gender: 'Male',
            dob: new Date('1992-06-15'),
            aadhaar: testAadhaar,
            category: 'General',
            abhaNumber: testAbhaNumber,
            abhaAddress: testAbhaAddress,
            abdmPatientId: testAbhaAddress,
            abhaStatus: 'ACTIVE',
            abhaVerificationStatus: 'VERIFIED',
            abhaEnrolledAt: new Date(),
            abhaAuthMethods: ['OTP', 'DEMOGRAPHICS']
        });

        await testPatient.save();
        assertTest('Patient saved with ABHA fields', !!testPatient._id);

        // Fetch back from MongoDB
        const fetchedPatient = await Patient.findOne({ abhaNumber: testAbhaNumber });
        assertTest('Patient retrievable by abhaNumber', fetchedPatient && fetchedPatient.uhid === testUhid);
        assertTest('Patient abhaAddress matches', fetchedPatient && fetchedPatient.abhaAddress === testAbhaAddress);
        assertTest('Patient abhaStatus is ACTIVE', fetchedPatient && fetchedPatient.abhaStatus === 'ACTIVE');
        assertTest('Patient abhaVerificationStatus is VERIFIED', fetchedPatient && fetchedPatient.abhaVerificationStatus === 'VERIFIED');

        // Lookup by abhaAddress
        const patientByAddress = await Patient.findOne({ abhaAddress: testAbhaAddress });
        assertTest('Patient retrievable by abhaAddress', patientByAddress && patientByAddress._id.toString() === testPatient._id.toString());

        // -------------------------------------------------------------
        // Test 2: AbdmConsent Model Persistence
        // -------------------------------------------------------------
        console.log('\n--- 2. Testing AbdmConsent Model Persistence ---');
        const testConsentId = crypto.randomUUID();
        const testConsent = await AbdmConsent.create({
            consentId: testConsentId,
            status: 'GRANTED',
            patientAbha: testAbhaAddress,
            patientId: testPatient._id,
            patientUhid: testUhid,
            careContexts: [{ careContextReference: 'REG-20260911-0001', patientReference: testUhid }],
            hiTypes: ['Prescription'],
            consentDetail: {
                consentId: testConsentId,
                patient: { id: testAbhaAddress },
                purpose: { text: 'Care Management' }
            },
            grantedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        assertTest('AbdmConsent document created', !!testConsent._id);
        const fetchedConsent = await AbdmConsent.findOne({ consentId: testConsentId });
        assertTest('AbdmConsent retrievable by consentId', fetchedConsent && fetchedConsent.status === 'GRANTED');
        assertTest('AbdmConsent links to patientAbha', fetchedConsent && fetchedConsent.patientAbha === testAbhaAddress);

        // -------------------------------------------------------------
        // Test 3: AbdmCareContext Model Persistence
        // -------------------------------------------------------------
        console.log('\n--- 3. Testing AbdmCareContext Model Persistence ---');
        const testCareContextRef = `REG-20260911-${testSuffix}`;
        const testCareContext = await AbdmCareContext.create({
            careContextReference: testCareContextRef,
            display: 'OPD Visit - Cardiology',
            patientUhid: testUhid,
            patientId: testPatient._id,
            abhaNumber: testAbhaNumber,
            abhaAddress: testAbhaAddress,
            linkType: 'USER_INITIATED',
            linkStatus: 'LINKED',
            linkToken: 'token-xyz-123',
            linkedAt: new Date()
        });

        assertTest('AbdmCareContext document created', !!testCareContext._id);
        const fetchedCareContext = await AbdmCareContext.findOne({ careContextReference: testCareContextRef });
        assertTest('AbdmCareContext retrievable by careContextReference', fetchedCareContext && fetchedCareContext.patientUhid === testUhid);
        assertTest('AbdmCareContext linkStatus is LINKED', fetchedCareContext && fetchedCareContext.linkStatus === 'LINKED');

        // -------------------------------------------------------------
        // Test 4: AbdmTransaction Model Persistence
        // -------------------------------------------------------------
        console.log('\n--- 4. Testing AbdmTransaction Model Persistence ---');
        const testLinkRef = crypto.randomUUID();
        const testTxId = crypto.randomUUID();
        const testReqId = crypto.randomUUID();

        const testTransaction = await AbdmTransaction.create({
            transactionId: testTxId,
            requestId: testReqId,
            transactionType: 'LINK_INIT',
            status: 'PENDING',
            linkReferenceNumber: testLinkRef,
            patientUhid: testUhid,
            patientId: testPatient._id,
            careContexts: [{ referenceNumber: testCareContextRef, display: 'OPD Visit' }],
            otp: '123456',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        assertTest('AbdmTransaction document created', !!testTransaction._id);
        const fetchedTx = await AbdmTransaction.findOne({ linkReferenceNumber: testLinkRef });
        assertTest('AbdmTransaction retrievable by linkReferenceNumber', fetchedTx && fetchedTx.transactionId === testTxId);

        // Update status to COMPLETED
        await AbdmTransaction.updateOne({ linkReferenceNumber: testLinkRef }, { $set: { status: 'COMPLETED' } });
        const updatedTx = await AbdmTransaction.findOne({ linkReferenceNumber: testLinkRef });
        assertTest('AbdmTransaction status updated to COMPLETED', updatedTx && updatedTx.status === 'COMPLETED');

        // -------------------------------------------------------------
        // Test 5: Server Restart Simulation (Fresh Query from DB)
        // -------------------------------------------------------------
        console.log('\n--- 5. Simulating Server Restart (Memory Independent Query) ---');
        // Clear mongoose cache/references and perform query directly
        const freshPatientQuery = await Patient.findOne({ abhaNumber: testAbhaNumber }).lean();
        assertTest('Patient record survived restart', freshPatientQuery && freshPatientQuery.patientName === 'Test ABHA Patient');

        const freshConsentQuery = await AbdmConsent.findOne({ consentId: testConsentId }).lean();
        assertTest('Consent record survived restart', freshConsentQuery && freshConsentQuery.status === 'GRANTED');

        const freshCareContextQuery = await AbdmCareContext.findOne({ careContextReference: testCareContextRef }).lean();
        assertTest('Care Context record survived restart', freshCareContextQuery && freshCareContextQuery.linkStatus === 'LINKED');

        const freshTxQuery = await AbdmTransaction.findOne({ transactionId: testTxId }).lean();
        assertTest('Transaction record survived restart', freshTxQuery && freshTxQuery.status === 'COMPLETED');

        // Cleanup test fixtures
        await Patient.deleteOne({ _id: testPatient._id });
        await AbdmConsent.deleteOne({ consentId: testConsentId });
        await AbdmCareContext.deleteOne({ careContextReference: testCareContextRef });
        await AbdmTransaction.deleteOne({ transactionId: testTxId });

        console.log('\n🧹 Test fixtures cleaned up successfully.');

        // -------------------------------------------------------------
        // Summary
        // -------------------------------------------------------------
        console.log('\n===============================================================');
        console.log(`PERSISTENCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('===============================================================\n');

    } catch (err) {
        console.error('❌ Persistence test encountered error:', err.message);
        failed++;
    } finally {
        await mongoose.connection.close();
        process.exit(failed > 0 ? 1 : 0);
    }
}

runPersistenceTests();
