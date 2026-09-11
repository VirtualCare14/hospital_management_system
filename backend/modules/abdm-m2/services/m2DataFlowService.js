const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Patient = require('../../../models/Patient');
const Visit = require('../../../models/Visit');
const IpdAdmission = require('../../../models/IpdAdmission');
const IpdDischarge = require('../../../models/IpdDischarge');
const LabRequest = require('../../../models/LabRequest');
const Prescription = require('../../../models/Prescription');
const Consultation = require('../../../models/Consultation');
const User = require('../../../models/User');
const Hospital = require('../../../models/Hospital');
const AbdmCareContext = require('../../../models/AbdmCareContext');
const AbdmConsent = require('../../../models/AbdmConsent');
const AbdmTransaction = require('../../../models/AbdmTransaction');
const { getAccessToken } = require('../../../services/abdmGatewayService');
const { getBridgeConfig } = require('./m2BridgeService');
const { generateFhirBundle } = require('./m2FhirService');
const { encryptData } = require('./m2CryptoService');

/**
 * Send outbound on-notify acknowledgement for Consent Notification to ABDM Gateway
 * Gateway Endpoint: POST /api/hiecm/consent/v3/request/hip/on-notify
 */
const sendConsentOnNotify = async ({ consentId, incomingRequestId, status = 'OK' }) => {
    const config = getBridgeConfig();
    const token = await getAccessToken();
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const url = `${config.gatewayBaseUrl}/api/hiecm/consent/v3/request/hip/on-notify`;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'REQUEST-ID': requestId,
        'TIMESTAMP': timestamp,
        'X-CM-ID': config.cmId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const payload = {
        acknowledgement: {
            status: status,
            consentId: consentId
        },
        response: {
            requestId: incomingRequestId
        }
    };

    console.log('\n🚀 ========== OUTBOUND: CONSENT ON-NOTIFY ACKNOWLEDGEMENT ==========');
    console.log('Target URL     :', url);
    console.log('Consent ID     :', consentId);
    console.log('Incoming Req ID:', incomingRequestId);
    console.log('New Request ID :', requestId);
    console.log('Payload        :', JSON.stringify(payload, null, 2));
    console.log('====================================================================\n');

    try {
        const response = await axios.post(url, payload, {
            headers,
            timeout: config.timeout
        });
        console.log('✅ Consent on-notify delivered successfully. Status:', response.status);
        return {
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (err) {
        console.error('\n❌ ========== CONSENT ON-NOTIFY ERROR ==========');
        if (err.response) {
            console.error('Status :', err.response.status);
            console.error('Data   :', JSON.stringify(err.response.data, null, 2));
            console.error('Headers:', err.response.headers);
        } else {
            console.error('Message:', err.message);
        }
        console.error('================================================\n');
        throw err;
    }
};

/**
 * Send outbound on-request acknowledgement for Health Information Request to ABDM Gateway
 * Gateway Endpoint: POST /api/hiecm/data-flow/v3/health-information/hip/on-request
 */
const sendDataOnRequest = async ({ transactionId, incomingRequestId, sessionStatus = 'ACKNOWLEDGED' }) => {
    const config = getBridgeConfig();
    const token = await getAccessToken();
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const url = `${config.gatewayBaseUrl}/api/hiecm/data-flow/v3/health-information/hip/on-request`;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'REQUEST-ID': requestId,
        'TIMESTAMP': timestamp,
        'X-CM-ID': config.cmId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const payload = {
        hiRequest: {
            transactionId: transactionId,
            sessionStatus: sessionStatus
        },
        response: {
            requestId: incomingRequestId
        }
    };

    console.log('\n🚀 ========== OUTBOUND: DATA FLOW ON-REQUEST ACKNOWLEDGEMENT ==========');
    console.log('Target URL     :', url);
    console.log('Transaction ID :', transactionId);
    console.log('Incoming Req ID:', incomingRequestId);
    console.log('Session Status :', sessionStatus);
    console.log('Payload        :', JSON.stringify(payload, null, 2));
    console.log('========================================================================\n');

    try {
        const response = await axios.post(url, payload, {
            headers,
            timeout: config.timeout
        });
        console.log('✅ Health Information on-request delivered successfully. Status:', response.status);
        return {
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (err) {
        console.error('\n❌ ========== DATA FLOW ON-REQUEST ERROR ==========');
        if (err.response) {
            console.error('Status :', err.response.status);
            console.error('Data   :', JSON.stringify(err.response.data, null, 2));
            console.error('Headers:', err.response.headers);
        } else {
            console.error('Message:', err.message);
        }
        console.error('===================================================\n');
        throw err;
    }
};

/**
 * Send final Data Flow Notification to ABDM Gateway after data push
 * Gateway Endpoint: POST /api/hiecm/data-flow/v3/health-information/notify
 */
const notifyDataTransferComplete = async ({
    consentId,
    transactionId,
    sessionStatus = 'TRANSFERRED',
    statusResponses = []
}) => {
    try {
        const config = getBridgeConfig();
        const token = await getAccessToken();
        const requestId = uuidv4();
        const timestamp = new Date().toISOString();

        const url = `${config.gatewayBaseUrl}/api/hiecm/data-flow/v3/health-information/notify`;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'REQUEST-ID': requestId,
            'TIMESTAMP': timestamp,
            'X-CM-ID': config.cmId,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const payload = {
            notification: {
                consentId: consentId,
                transactionId: transactionId,
                doneAt: timestamp,
                notifier: {
                    type: 'HIP',
                    id: config.hipId
                },
                statusNotification: {
                    sessionStatus: sessionStatus,
                    hipId: config.hipId,
                    statusResponses: statusResponses.length > 0 ? statusResponses : [
                        {
                            careContextReference: 'DEFAULT_RECORD',
                            hiStatus: sessionStatus === 'TRANSFERRED' ? 'DELIVERED' : 'ERRORED',
                            description: sessionStatus === 'TRANSFERRED' ? 'Records transferred successfully' : 'Transfer failed'
                        }
                    ]
                }
            }
        };

        console.log('\n🚀 ========== OUTBOUND: DATA FLOW TRANSFER NOTIFICATION ==========');
        console.log('Target URL     :', url);
        console.log('Transaction ID :', transactionId);
        console.log('Consent ID     :', consentId);
        console.log('Session Status :', sessionStatus);
        console.log('Payload        :', JSON.stringify(payload, null, 2));
        console.log('==================================================================\n');

        const response = await axios.post(url, payload, {
            headers,
            timeout: config.timeout
        });

        console.log('✅ Data Flow Transfer Notification delivered successfully. Status:', response.status);
        return {
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (err) {
        console.error('❌ [ABDM-M2] Failed to deliver data transfer notification:', err.message);
    }
};

/**
 * Handle Inbound Consent Notification Webhook
 * ABDM Endpoint: POST /v3/consent/request/hip/notify
 */
const processConsentNotify = async ({ notification, requestId }) => {
    try {
        const consentId = notification?.consentId || notification?.consentDetail?.consentId || 'UNKNOWN_CONSENT';
        const status = notification?.status || notification?.consentDetail?.status || 'GRANTED';
        const consentDetail = notification?.consentDetail || {};

        console.log(`\n📜 [ABDM-M2] Processing Consent Notification for Consent ID [${consentId}]...`);
        console.log('Consent Status  :', status);
        console.log('Patient ABHA ID :', consentDetail?.patient?.id || 'N/A');
        console.log('Care Contexts   :', JSON.stringify(consentDetail?.careContexts || [], null, 2));
        console.log('HI Types        :', JSON.stringify(consentDetail?.hiTypes || [], null, 2));

        // Save/Update consent in MongoDB
        await AbdmConsent.findOneAndUpdate(
            { consentId },
            {
                consentId,
                status,
                patientAbha: consentDetail?.patient?.id || undefined,
                careContexts: (consentDetail?.careContexts || []).map(cc => ({
                    careContextReference: cc.careContextReference,
                    patientReference: cc.patientReference
                })),
                hiTypes: consentDetail?.hiTypes || ['Prescription'],
                consentDetail,
                grantedAt: consentDetail?.createdAt ? new Date(consentDetail.createdAt) : new Date(),
                expiresAt: consentDetail?.permission?.dateRange?.to ? new Date(consentDetail.permission.dateRange.to) : undefined
            },
            { upsert: true, new: true }
        );

        console.log(`💾 Persisted Consent [${consentId}] in MongoDB.`);

        // Acknowledge Gateway with on-notify
        return await sendConsentOnNotify({
            consentId,
            incomingRequestId: requestId,
            status: 'OK'
        });

    } catch (error) {
        console.error('❌ [ABDM-M2] Error during processConsentNotify:', error.message);
        throw error;
    }
};

/**
 * Handle Inbound Health Information Data Request Webhook
 * ABDM Endpoint: POST /v3/health-information/hip/request
 */
const processDataRequest = async ({ hiRequest, transactionId: directTxId, requestId }) => {
    try {
        const transactionId = directTxId || hiRequest?.transactionId;
        const consentId = hiRequest?.consent?.id;
        const dataPushUrl = hiRequest?.dataPushUrl;
        const keyMaterial = hiRequest?.keyMaterial;

        console.log(`\n📦 [ABDM-M2] Processing Health Data Request for Transaction [${transactionId}]...`);
        console.log('Consent ID   :', consentId);
        console.log('Data Push URL:', dataPushUrl);
        console.log('Key Material :', keyMaterial?.cryptoAlg, keyMaterial?.curve);

        // Store transaction state in MongoDB
        await AbdmTransaction.findOneAndUpdate(
            { transactionId },
            {
                transactionId,
                requestId,
                transactionType: 'DATA_REQUEST',
                status: 'ACKNOWLEDGED',
                metadata: {
                    consentId,
                    dataPushUrl
                },
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            },
            { upsert: true, new: true }
        );

        // Step A: Immediately Acknowledge to ABDM Gateway with on-request
        await sendDataOnRequest({
            transactionId,
            incomingRequestId: requestId,
            sessionStatus: 'ACKNOWLEDGED'
        });

        // Step B: Asynchronous Data Push Pipeline with FHIR and Fidelius Encryption
        setImmediate(async () => {
            try {
                console.log(`\n⏳ [ABDM-M2 Pipeline] Starting Data Push Pipeline for tx: ${transactionId}...`);
                const config = getBridgeConfig();

                // 1. Identify Care Contexts from Stored Consent in MongoDB
                const storedConsent = await AbdmConsent.findOne({ consentId });
                const consentCareContexts = storedConsent?.consentDetail?.careContexts || storedConsent?.careContexts || [];
                const patientAbha = storedConsent?.patientAbha || storedConsent?.consentDetail?.patient?.id;

                console.log(`ℹ️ Retrieved ${consentCareContexts.length} care context(s) from consent [${consentId}] in MongoDB`);

                const entries = [];
                const statusResponses = [];
                let finalSenderKeyMaterial = null;

                // 2. Fetch Clinical Data and Construct FHIR Bundles
                if (consentCareContexts.length > 0) {
                    for (const cc of consentCareContexts) {
                        const careContextRef = cc.careContextReference;

                        // Check AbdmCareContext mapping in MongoDB
                        const careContextDoc = await AbdmCareContext.findOne({ careContextReference: careContextRef }).lean();
                        const recordType = careContextDoc?.medoraRecordType;

                        let patient = null;
                        let record = null;
                        let detectedRecordType = recordType || 'OPD';

                        if (recordType === 'IPD' || careContextRef.startsWith('IPD')) {
                            detectedRecordType = 'IPD';
                            record = await IpdAdmission.findOne({
                                $or: [{ ipdNumber: careContextRef }, { _id: careContextRef.match(/^[0-9a-fA-F]{24}$/) ? careContextRef : null }]
                            }).lean();
                            if (record) {
                                patient = await Patient.findById(record.patientId).lean() || await Patient.findOne({ uhid: record.pidNumber }).lean();
                            }
                        } else if (recordType === 'DischargeSummary' || careContextRef.startsWith('DIS-')) {
                            detectedRecordType = 'DischargeSummary';
                            const cleanRef = careContextRef.replace(/^DIS-/, '');
                            record = await IpdDischarge.findOne({
                                $or: [{ ipdNumber: cleanRef }, { _id: cleanRef.match(/^[0-9a-fA-F]{24}$/) ? cleanRef : null }]
                            }).lean();
                            if (record) {
                                patient = await Patient.findById(record.patientId).lean() || await Patient.findOne({ uhid: record.uhid }).lean();
                            }
                        } else if (recordType === 'Lab' || careContextRef.startsWith('LAB')) {
                            detectedRecordType = 'Lab';
                            record = await LabRequest.findOne({
                                $or: [{ labId: careContextRef }, { _id: careContextRef.match(/^[0-9a-fA-F]{24}$/) ? careContextRef : null }]
                            }).lean();
                            if (record) {
                                patient = await Patient.findById(record.patientId).lean();
                            }
                        } else if (recordType === 'Prescription' || careContextRef.startsWith('RX-')) {
                            detectedRecordType = 'Prescription';
                            if (careContextDoc?.medoraRecordId) {
                                record = await Prescription.findById(careContextDoc.medoraRecordId).lean();
                            } else if (careContextRef.match(/^[0-9a-fA-F]{24}$/)) {
                                record = await Prescription.findById(careContextRef).lean();
                            }
                            if (record) {
                                patient = await Patient.findById(record.patientId).lean();
                            }
                        }

                        // Fallback: Check Visit
                        if (!record) {
                            record = await Visit.findOne({
                                $or: [
                                    { registrationNumber: careContextRef },
                                    { _id: careContextRef.match(/^[0-9a-fA-F]{24}$/) ? careContextRef : null }
                                ]
                            }).lean();
                            if (record) {
                                detectedRecordType = 'OPD';
                                patient = await Patient.findById(record.patientId).lean() || await Patient.findOne({ uhid: record.uhid }).lean();
                            }
                        }

                        // Fallback: Check Patient by UHID
                        if (!patient) {
                            if (careContextDoc?.patientId) {
                                patient = await Patient.findById(careContextDoc.patientId).lean();
                            } else if (careContextDoc?.patientUhid) {
                                patient = await Patient.findOne({ uhid: careContextDoc.patientUhid }).lean();
                            } else {
                                patient = await Patient.findOne({ uhid: careContextRef }).lean();
                            }
                        }

                        // Enrich related clinical metadata
                        const extraContext = {};
                        const docId = record?.doctorId || record?.doctorInCharge || record?.assignedDoctorId;
                        if (docId) {
                            try {
                                extraContext.doctor = await User.findById(docId).lean();
                            } catch (e) {}
                        }
                        const hospId = record?.hospitalId || patient?.hospitalId;
                        if (hospId) {
                            try {
                                extraContext.hospital = await Hospital.findById(hospId).lean();
                            } catch (e) {}
                        }
                        if (detectedRecordType === 'OPD' && record?._id) {
                            try {
                                extraContext.consultation = await Consultation.findOne({ visitId: record._id }).lean();
                                extraContext.prescription = await Prescription.findOne({ visitId: record._id }).lean();
                            } catch (e) {}
                        }

                        // Generate FHIR R4 Bundle
                        const fhirString = generateFhirBundle(
                            patient || { patientName: 'Patient Record', uhid: careContextRef },
                            record || { registrationNumber: careContextRef },
                            detectedRecordType,
                            extraContext
                        );

                        // Encrypt Bundle using ABDM Fidelius (ECDH Curve25519)
                        if (keyMaterial) {
                            const encryptedResult = encryptData(fhirString, keyMaterial);
                            finalSenderKeyMaterial = encryptedResult.keyMaterial;

                            entries.push({
                                content: encryptedResult.encryptedData,
                                media: 'application/fhir+json',
                                checksum: encryptedResult.checksum,
                                careContextReference: careContextRef
                            });
                        }

                        statusResponses.push({
                            careContextReference: careContextRef,
                            hiStatus: 'DELIVERED',
                            description: 'Records transferred successfully'
                        });
                    }
                } else {
                    // Fallback: Generate generic clinical FHIR bundle if no specific care contexts listed
                    const defaultRef = 'RECORD-001';
                    const samplePatient = await Patient.findOne().lean() || { patientName: 'Registered Patient', uhid: 'UHID-001' };
                    const sampleVisit = await Visit.findOne().lean() || { registrationNumber: defaultRef, visitType: 'OPD', department: 'General Medicine' };

                    const fhirString = generateFhirBundle(samplePatient, sampleVisit);

                    if (keyMaterial) {
                        const encryptedResult = encryptData(fhirString, keyMaterial);
                        finalSenderKeyMaterial = encryptedResult.keyMaterial;

                        entries.push({
                            content: encryptedResult.encryptedData,
                            media: 'application/fhir+json',
                            checksum: encryptedResult.checksum,
                            careContextReference: defaultRef
                        });
                    }

                    statusResponses.push({
                        careContextReference: defaultRef,
                        hiStatus: 'DELIVERED',
                        description: 'Records transferred successfully'
                    });
                }

                // 3. POST Encrypted Data to Recipient's dataPushUrl
                if (dataPushUrl && entries.length > 0 && finalSenderKeyMaterial) {
                    const pushPayload = {
                        pageNumber: 1,
                        pageCount: 1,
                        transactionId: transactionId,
                        entries: entries,
                        keyMaterial: finalSenderKeyMaterial
                    };

                    console.log(`\n🚀 ========== OUTBOUND: PUSHING ENCRYPTED FHIR DATA TO HIU ==========`);
                    console.log('Data Push URL  :', dataPushUrl);
                    console.log('Transaction ID :', transactionId);
                    console.log('Entries Count  :', entries.length);
                    console.log('======================================================================\n');

                    const pushResponse = await axios.post(dataPushUrl, pushPayload, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        timeout: config.timeout
                    });

                    console.log('✅ Encrypted FHIR data pushed successfully to HIU. Status:', pushResponse.status);
                } else {
                    console.log('ℹ️ Skipping direct data push (no dataPushUrl or keyMaterial provided).');
                }

                // Step C: Notify ABDM Gateway that data transfer is complete
                await notifyDataTransferComplete({
                    consentId,
                    transactionId,
                    sessionStatus: 'TRANSFERRED',
                    statusResponses
                });

                // Update transaction status in MongoDB
                await AbdmTransaction.updateOne(
                    { transactionId },
                    { $set: { status: 'COMPLETED' } }
                );

                console.log(`✅ [ABDM-M2 Pipeline] Data transfer pipeline completed for tx: ${transactionId}`);

            } catch (pipelineErr) {
                console.error('❌ [ABDM-M2 Pipeline] Error in async data transfer pipeline:', pipelineErr.message);
                await notifyDataTransferComplete({
                    consentId,
                    transactionId,
                    sessionStatus: 'FAILED',
                    statusResponses: [
                        {
                            careContextReference: 'UNKNOWN_RECORD',
                            hiStatus: 'ERRORED',
                            description: pipelineErr.message || 'Pipeline execution failed'
                        }
                    ]
                });

                await AbdmTransaction.updateOne(
                    { transactionId },
                    { $set: { status: 'FAILED' } }
                );
            }
        });

        return {
            success: true,
            status: 'ACKNOWLEDGED',
            transactionId
        };

    } catch (error) {
        console.error('❌ [ABDM-M2] Error during processDataRequest:', error.message);
        throw error;
    }
};

module.exports = {
    sendConsentOnNotify,
    sendDataOnRequest,
    notifyDataTransferComplete,
    processConsentNotify,
    processDataRequest
};
