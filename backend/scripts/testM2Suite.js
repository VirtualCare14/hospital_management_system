/**
 * ABDM Milestone 2 (HIP) Automated Test Suite
 * Tests all Inbound Webhooks, Outbound Service Handlers, FHIR Generation, and Fidelius Encryption.
 *
 * Usage: node scripts/testM2Suite.js
 */

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('../config/db');

const {
    m2WebhookRoutes,
    m2BridgeService,
    m2DiscoveryService,
    m2LinkService,
    m2HipLinkingService,
    m2DataFlowService,
    m2FhirService,
    m2CryptoService
} = require('../modules/abdm-m2');

const TEST_PORT = 5095;
const BASE_URL = `http://localhost:${TEST_PORT}/api/abdm/m2/webhooks`;

async function runTests() {
    console.log('\n===============================================================');
    console.log('       MEDORA360 - ABDM MILESTONE 2 (HIP) TEST SUITE           ');
    console.log('===============================================================\n');

    // Connect to Database
    try {
        await connectDB();
    } catch (dbErr) {
        console.warn('⚠️ Could not connect to MongoDB:', dbErr.message);
    }

    // 1. Start test express server
    const app = express();
    app.use(express.json());
    app.use('/api/abdm/m2/webhooks', m2WebhookRoutes);

    const server = app.listen(TEST_PORT);
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
        // -------------------------------------------------------------
        // Test 1: Health Check Endpoint
        // -------------------------------------------------------------
        console.log('\n--- 1. Testing Webhook Infrastructure & Health Check ---');
        const healthRes = await axios.get(`${BASE_URL}/health`);
        assertTest('GET /health', healthRes.status === 200 && healthRes.data.module === 'ABDM-M2-HIP', `(Status: ${healthRes.status})`);

        // -------------------------------------------------------------
        // Test 2: Inbound Patient Discovery Webhook
        // -------------------------------------------------------------
        console.log('\n--- 2. Testing Patient Discovery Webhook (User-Initiated) ---');
        const discoverPayload = {
            transactionId: crypto.randomUUID(),
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            patient: {
                id: 'testuser@sbx',
                name: 'Test Patient',
                gender: 'M',
                yearOfBirth: 1990,
                verifiedIdentifiers: [
                    { type: 'MOBILE', value: '+919876543210' }
                ],
                unverifiedIdentifiers: []
            }
        };
        const discoverRes = await axios.post(`${BASE_URL}/v3/patient/care-context/discover`, discoverPayload, {
            headers: { 'request-id': discoverPayload.requestId }
        });
        assertTest('POST /v3/patient/care-context/discover', discoverRes.status === 202 && discoverRes.data.status === 'Accepted', `(Status: ${discoverRes.status})`);

        // -------------------------------------------------------------
        // Test 3: User-Initiated Link Init Webhook
        // -------------------------------------------------------------
        console.log('\n--- 3. Testing User-Initiated Link OTP Init Webhook ---');
        const linkInitPayload = {
            transactionId: crypto.randomUUID(),
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            patient: {
                referenceNumber: 'UHID-DEMO-001',
                careContexts: [
                    { referenceNumber: 'VISIT-REG-001', display: 'OPD Visit - Cardiology' }
                ]
            }
        };
        const linkInitRes = await axios.post(`${BASE_URL}/v3/link/care-context/init`, linkInitPayload, {
            headers: { 'request-id': linkInitPayload.requestId }
        });
        assertTest('POST /v3/link/care-context/init', linkInitRes.status === 202 && linkInitRes.data.status === 'Accepted', `(Status: ${linkInitRes.status})`);

        // -------------------------------------------------------------
        // Test 4: User-Initiated Link Confirm Webhook
        // -------------------------------------------------------------
        console.log('\n--- 4. Testing User-Initiated Link OTP Confirm Webhook ---');
        const linkConfirmPayload = {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            confirmation: {
                linkRefNumber: crypto.randomUUID(),
                token: '123456'
            }
        };
        const linkConfirmRes = await axios.post(`${BASE_URL}/v3/link/care-context/confirm`, linkConfirmPayload, {
            headers: { 'request-id': linkConfirmPayload.requestId }
        });
        assertTest('POST /v3/link/care-context/confirm', linkConfirmRes.status === 202 && linkConfirmRes.data.status === 'Accepted', `(Status: ${linkConfirmRes.status})`);

        // -------------------------------------------------------------
        // Test 5: HIP-Initiated Token On-Generate Callback
        // -------------------------------------------------------------
        console.log('\n--- 5. Testing HIP-Initiated Token Callback Webhook ---');
        const tokenCallbackPayload = {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            linkToken: 'demo-link-token-xyz-123',
            abhaAddress: 'doctor.test@sbx',
            response: {
                requestId: crypto.randomUUID()
            }
        };
        const tokenRes = await axios.post(`${BASE_URL}/api/v3/hip/token/on-generate-token`, tokenCallbackPayload, {
            headers: { 'request-id': tokenCallbackPayload.requestId }
        });
        assertTest('POST /api/v3/hip/token/on-generate-token', tokenRes.status === 202 && tokenRes.data.status === 'Accepted', `(Status: ${tokenRes.status})`);

        // -------------------------------------------------------------
        // Test 6: Consent Grant/Revocation Notification Webhook
        // -------------------------------------------------------------
        console.log('\n--- 6. Testing Consent Notification Webhook ---');
        const consentPayload = {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            notification: {
                consentId: crypto.randomUUID(),
                status: 'GRANTED',
                consentDetail: {
                    patient: { id: 'patient1@sbx' },
                    careContexts: [{ careContextReference: 'VISIT-REG-001' }],
                    hiTypes: ['Prescription']
                }
            }
        };
        const consentRes = await axios.post(`${BASE_URL}/v3/consent/request/hip/notify`, consentPayload, {
            headers: { 'request-id': consentPayload.requestId }
        });
        assertTest('POST /v3/consent/request/hip/notify', consentRes.status === 202 && consentRes.data.status === 'Accepted', `(Status: ${consentRes.status})`);

        // -------------------------------------------------------------
        // Test 7: Health Information Data Request Webhook
        // -------------------------------------------------------------
        console.log('\n--- 7. Testing Health Information Data Request Webhook ---');
        const { publicKey: mockReceiverPub } = crypto.generateKeyPairSync('x25519');
        const mockReceiverRawPub = mockReceiverPub.export({ type: 'spki', format: 'der' }).subarray(12);
        const mockReceiverNonce = crypto.randomBytes(32);

        const dataRequestPayload = {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            transactionId: crypto.randomUUID(),
            hiRequest: {
                transactionId: crypto.randomUUID(),
                consent: { id: consentPayload.notification.consentId },
                dataPushUrl: 'https://dev.abdm.gov.in/api-hiu/data/notification',
                keyMaterial: {
                    cryptoAlg: 'ECDH',
                    curve: 'Curve25519',
                    dhPublicKey: {
                        expiry: new Date(Date.now() + 86400000).toISOString(),
                        parameters: 'Curve25519/32byte random key',
                        keyValue: mockReceiverRawPub.toString('base64')
                    },
                    nonce: mockReceiverNonce.toString('base64')
                }
            }
        };
        const dataRes = await axios.post(`${BASE_URL}/v3/health-information/hip/request`, dataRequestPayload, {
            headers: { 'request-id': dataRequestPayload.requestId }
        });
        assertTest('POST /v3/health-information/hip/request', dataRes.status === 202 && dataRes.data.status === 'Accepted', `(Status: ${dataRes.status})`);

        // -------------------------------------------------------------
        // Test 8: FHIR R4 Document Bundle Generation
        // -------------------------------------------------------------
        console.log('\n--- 8. Testing FHIR R4 Bundle Generation ---');
        const samplePatient = {
            patientName: 'Ravi Kumar',
            uhid: 'UHID-2026-001',
            mobile: '9876543210',
            gender: 'Male',
            dob: '1992-05-14'
        };
        const sampleVisit = {
            registrationNumber: 'OPD-CARDIO-101',
            visitType: 'OPD',
            department: 'Cardiology',
            appointmentDate: '2026-09-10'
        };
        const fhirBundleStr = m2FhirService.generateFhirBundle(samplePatient, sampleVisit);
        const parsedBundle = JSON.parse(fhirBundleStr);

        assertTest('FHIR Bundle resourceType is "Bundle"', parsedBundle.resourceType === 'Bundle');
        assertTest('FHIR Bundle type is "document"', parsedBundle.type === 'document');
        assertTest('FHIR Bundle has structured entries (Composition, Patient, Practitioner, Organization, Encounter)', Array.isArray(parsedBundle.entry) && parsedBundle.entry.length >= 5);

        // -------------------------------------------------------------
        // Test 9: Fidelius ECDH Encryption & Roundtrip Decryption
        // -------------------------------------------------------------
        console.log('\n--- 9. Testing Fidelius ECDH (Curve25519 + AES-256-GCM) Cryptography ---');
        const { publicKey: recPub, privateKey: recPriv } = crypto.generateKeyPairSync('x25519');
        const recRawPub = recPub.export({ type: 'spki', format: 'der' }).subarray(12);
        const recNonce = crypto.randomBytes(32);

        const recKeyMaterial = {
            cryptoAlg: 'ECDH',
            curve: 'Curve25519',
            dhPublicKey: { keyValue: recRawPub.toString('base64') },
            nonce: recNonce.toString('base64')
        };

        // Encrypt
        const encryptedResult = m2CryptoService.encryptData(fhirBundleStr, recKeyMaterial);
        assertTest('Fidelius Encryption returns Base64 encryptedData', typeof encryptedResult.encryptedData === 'string' && encryptedResult.encryptedData.length > 0);
        assertTest('Fidelius Encryption returns MD5 checksum', typeof encryptedResult.checksum === 'string' && encryptedResult.checksum.length === 32);
        assertTest('Fidelius Encryption returns sender keyMaterial', !!encryptedResult.keyMaterial?.dhPublicKey?.keyValue);

        // Decrypt on Receiver side to verify accuracy
        const senderPub = m2CryptoService.importX25519PublicKey(encryptedResult.keyMaterial.dhPublicKey.keyValue);
        const senderNonce = Buffer.from(encryptedResult.keyMaterial.nonce, 'base64');
        const receiverSharedSecret = crypto.diffieHellman({ privateKey: recPriv, publicKey: senderPub });

        const xorSalt = Buffer.alloc(32);
        for (let i = 0; i < 32; i++) {
            xorSalt[i] = (senderNonce[i] || 0) ^ (recNonce[i] || 0);
        }

        const derived = Buffer.from(crypto.hkdfSync('sha256', receiverSharedSecret, xorSalt, Buffer.alloc(0), 44));
        const aesKey = derived.subarray(0, 32);
        const iv = derived.subarray(32, 44);

        const encryptedBuf = Buffer.from(encryptedResult.encryptedData, 'base64');
        const tag = encryptedBuf.subarray(encryptedBuf.length - 16);
        const cipherText = encryptedBuf.subarray(0, encryptedBuf.length - 16);

        const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(cipherText, null, 'utf8');
        decrypted += decipher.final('utf8');

        assertTest('Receiver successfully decrypted payload', decrypted === fhirBundleStr);
        assertTest('Decrypted FHIR matches original patient name', JSON.parse(decrypted).entry[1].resource.name[0].text === 'Ravi Kumar');

        // -------------------------------------------------------------
        // Summary
        // -------------------------------------------------------------
        console.log('\n===============================================================');
        console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log('===============================================================\n');

    } catch (err) {
        console.error('❌ Test suite encountered an error:', err.message);
        failed++;
    } finally {
        server.close(() => {
            process.exit(failed > 0 ? 1 : 0);
        });
        // Safety timeout to exit if async operations are still logging
        setTimeout(() => {
            process.exit(failed > 0 ? 1 : 0);
        }, 1500);
    }
}

runTests();
