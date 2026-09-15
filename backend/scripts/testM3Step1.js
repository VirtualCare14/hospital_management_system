const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const express = require('express');
const { m3WebhookRoutes, m3ConsentService, m3DataFlowService, m3CryptoService, getConsentRequestStatus } = require('../modules/abdm-m3');
const m2CryptoService = require('../modules/abdm-m2/services/m2CryptoService');
const AbdmConsent = require('../models/AbdmConsent');
const AbdmTransaction = require('../models/AbdmTransaction');
const AbdmHealthRecord = require('../models/AbdmHealthRecord');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use('/api/abdm/m3/webhooks', m3WebhookRoutes);

const runTests = async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (mongoUri) {
        try {
            await mongoose.connect(mongoUri);
            console.log('📦 Connected to MongoDB for M3 verification.');
        } catch (dbErr) {
            console.warn('⚠️ Could not connect to MongoDB, proceeding in in-memory mode:', dbErr.message);
        }
    }

    const server = app.listen(0, async () => {
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}/api/abdm/m3/webhooks`;

        console.log(`\n🧪 Testing ABDM M3 Webhook Endpoints & Flow at: ${baseUrl}\n`);

        // 1. Setup HIU ECDH Key Material for transaction 'test-txn-12345'
        const { publicKey: hiuPub, privateKey: hiuPriv, nonce: hiuNonce } = m3DataFlowService.generateEcdhKeyMaterial();
        const testTxnId = 'test-txn-12345';
        const testConsentId = 'artefact-uuid-999';
        const testConsentReqId = 'test-consent-req-1';

        m3DataFlowService.hiuKeyMaterials.set(testTxnId, {
            requestId: 'test-req-ecdh-1',
            transactionId: testTxnId,
            consentId: testConsentId,
            privateKey: hiuPriv,
            publicKey: hiuPub,
            nonce: hiuNonce,
            createdAt: new Date().toISOString()
        });

        // 2. Simulate Remote HIP encrypting a FHIR bundle for HIU
        const sampleFhirBundle = JSON.stringify({
            resourceType: 'Bundle',
            id: 'patient-health-record-001',
            type: 'document',
            timestamp: new Date().toISOString(),
            entry: [
                {
                    resource: {
                        resourceType: 'Patient',
                        id: 'patient-001',
                        name: [{ text: 'Ravi Kumar' }]
                    }
                },
                {
                    resource: {
                        resourceType: 'MedicationRequest',
                        id: 'med-001',
                        status: 'active',
                        medicationCodeableConcept: { text: 'Paracetamol 500mg' }
                    }
                }
            ]
        });

        const encryptedHIPResult = m2CryptoService.encryptData(sampleFhirBundle, {
            dhPublicKey: { keyValue: hiuPub },
            nonce: hiuNonce
        });

        console.log(`🔒 Simulated HIP encrypted FHIR bundle (Length: ${encryptedHIPResult.encryptedData.length} chars)`);

        const dataPushPayload = {
            pageNumber: 1,
            pageCount: 1,
            transactionId: testTxnId,
            entries: [
                {
                    content: encryptedHIPResult.encryptedData,
                    media: 'application/fhir+json',
                    checksum: encryptedHIPResult.checksum,
                    careContextReference: 'CARE_CONTEXT_REF_001'
                }
            ],
            keyMaterial: encryptedHIPResult.keyMaterial
        };

        const endpoints = [
            { path: '/health', method: 'GET', body: null, expectedStatus: 200 },
            { path: '/v3/hiu/consent/request/on-init', method: 'POST', body: { consentRequest: { id: testConsentReqId } }, expectedStatus: 202 },
            { path: '/v3/hiu/consent/request/on-status', method: 'POST', body: { consentRequest: { id: testConsentReqId, status: 'REQUESTED' } }, expectedStatus: 202 },
            { 
                path: '/v3/hiu/consent/on-fetch', 
                method: 'POST', 
                body: { 
                    consent: { 
                        status: 'GRANTED',
                        consentDetail: {
                            consentId: testConsentId,
                            patient: { id: 'patient@sbx' },
                            hip: { id: 'HIP_001' },
                            hiu: { id: 'HIU_001' },
                            hiTypes: ['Prescription', 'DiagnosticReport'],
                            permission: {
                                accessMode: 'VIEW',
                                dateRange: { from: '2023-01-01T00:00:00.000Z', to: '2024-01-01T00:00:00.000Z' },
                                dataEraseAt: '2024-12-31T00:00:00.000Z'
                            }
                        },
                        signature: 'dummy-signature-string'
                    } 
                }, 
                expectedStatus: 202 
            },
            { 
                path: '/v3/hiu/health-information/on-request', 
                method: 'POST', 
                body: { 
                    hiRequest: { transactionId: testTxnId, sessionStatus: 'ACKNOWLEDGED' },
                    response: { requestId: 'test-req-ecdh-1' }
                }, 
                expectedStatus: 202 
            },
            { 
                path: '/v3/data/push', 
                method: 'POST', 
                body: dataPushPayload, 
                expectedStatus: 202 
            }
        ];

        let allPassed = true;

        for (const ep of endpoints) {
            try {
                const res = await fetch(`${baseUrl}${ep.path}`, {
                    method: ep.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: ep.body ? JSON.stringify(ep.body) : undefined
                });

                const pass = res.status === ep.expectedStatus;
                console.log(`[${pass ? 'PASS' : 'FAIL'}] ${ep.method} ${ep.path} -> Status: ${res.status} (Expected: ${ep.expectedStatus})`);
                if (!pass) allPassed = false;
            } catch (err) {
                console.error(`[FAIL] ${ep.method} ${ep.path} -> Error:`, err.message);
                allPassed = false;
            }
        }

        console.log('\n🧪 Testing Step 4 Decrypted FHIR Bundle Retrieval...');
        let decryptedRecords = null;
        for (let i = 0; i < 15; i++) {
            decryptedRecords = await m3DataFlowService.getDecryptedRecords(testTxnId);
            if (decryptedRecords && decryptedRecords.entries && decryptedRecords.entries.length > 0 && decryptedRecords.entries[0].decryptedFhir) {
                break;
            }
            await new Promise(r => setTimeout(r, 200));
        }
        console.log(`Decrypted Records for Transaction '${testTxnId}':`, JSON.stringify(decryptedRecords, null, 2));

        if (
            decryptedRecords &&
            decryptedRecords.entries &&
            decryptedRecords.entries.length > 0 &&
            decryptedRecords.entries[0].decryptedFhir &&
            decryptedRecords.entries[0].decryptedFhir.resourceType === 'Bundle'
        ) {
            console.log('[PASS] Decrypted FHIR bundle parsed and validated successfully!');
            console.log(`Decrypted Patient Name: ${decryptedRecords.entries[0].decryptedFhir.entry[0].resource.name[0].text}`);
        } else {
            console.error('[FAIL] Decrypted FHIR bundle retrieval failed!');
            allPassed = false;
        }

        // Test consent artefact retrieval
        const artefact = await m3ConsentService.getConsentArtefact(testConsentId);
        if (artefact && artefact.consentId === testConsentId) {
            console.log(`[PASS] Consent artefact retrieved successfully: ${artefact.consentId}`);
        } else {
            console.error('[FAIL] Consent artefact retrieval failed');
            allPassed = false;
        }

        // Verify function export for Consent Status Polling
        if (typeof m3ConsentService.getConsentRequestStatus === 'function') {
            console.log('[PASS] Outbound Consent Status API (getConsentRequestStatus) is implemented and exported.');
        } else {
            console.error('[FAIL] getConsentRequestStatus is not exported!');
            allPassed = false;
        }

        // Cleanup test data if MongoDB is connected
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
                await AbdmConsent.deleteMany({ consentId: testConsentId });
                await AbdmTransaction.deleteMany({ $or: [{ transactionId: testTxnId }, { requestId: 'test-req-ecdh-1' }] });
                await AbdmHealthRecord.deleteMany({ transactionId: testTxnId });
                console.log('🧹 Cleaned up temporary test documents from MongoDB.');
            } catch (err) {
                console.warn('⚠️ Test cleanup warning:', err.message);
            }
            await mongoose.disconnect();
        }

        server.close(() => {
            if (allPassed) {
                console.log('\n🎉 ALL M3 TESTS PASSED SUCCESSFULLY!\n');
                process.exit(0);
            } else {
                console.error('\n❌ SOME TESTS FAILED!\n');
                process.exit(1);
            }
        });
    });
};

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
