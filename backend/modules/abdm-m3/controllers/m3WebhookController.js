const mongoose = require('mongoose');
const m3ConsentService = require('../services/m3ConsentService');
const m3DataFlowService = require('../services/m3DataFlowService');
const AbdmConsent = require('../../../models/AbdmConsent');
const AbdmTransaction = require('../../../models/AbdmTransaction');

/**
 * Helper to log inbound webhook callback details for ABDM Milestone 3 (HIU)
 */
const logIncomingWebhook = (endpointName, req) => {
    console.log(`\n📥 ================= ABDM M3 HIU INBOUND WEBHOOK [${endpointName}] =================`);
    console.log('Timestamp :', new Date().toISOString());
    console.log('Path      :', req.originalUrl || req.url);
    console.log('Method    :', req.method);
    console.log('Headers   :', JSON.stringify(req.headers, null, 2));
    console.log('Body      :', JSON.stringify(req.body, null, 2));
    console.log('================================================================================\n');
};

/**
 * 1. Webhook: Consent Request On-Init Callback
 * ABDM Gateway notifies HIU of the created consentRequestId
 * Endpoint: POST /v3/hiu/consent/request/on-init
 */
const handleConsentOnInit = async (req, res) => {
    // ABDM v3 APIs are asynchronous. Respond with HTTP 202 Accepted immediately.
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('CONSENT REQUEST ON-INIT', req);

    const consentRequestId = req.body?.consentRequest?.id;
    const clientRequestId = req.body?.response?.requestId || req.headers['request-id'];
    const error = req.body?.error;

    setImmediate(async () => {
        try {
            console.log(`ℹ️ [ABDM-M3] Consent On-Init received. ConsentRequestId: ${consentRequestId}, ClientRequestId: ${clientRequestId}`);
            if (error) {
                console.error(`❌ [ABDM-M3] Consent On-Init error:`, error);
            }
            if (clientRequestId && m3ConsentService.hiuConsentState.has(clientRequestId)) {
                const existing = m3ConsentService.hiuConsentState.get(clientRequestId);
                m3ConsentService.hiuConsentState.set(clientRequestId, {
                    ...existing,
                    consentRequestId,
                    status: error ? 'INIT_FAILED' : 'REQUESTED',
                    error: error || null,
                    updatedAt: new Date().toISOString()
                });
            }

            // Persist in MongoDB if connected
            if (clientRequestId && mongoose.connection && mongoose.connection.readyState === 1) {
                try {
                    await AbdmConsent.findOneAndUpdate(
                        { requestId: clientRequestId },
                        {
                            consentRequestId,
                            status: error ? 'INIT_FAILED' : 'REQUESTED'
                        }
                    );
                    await AbdmTransaction.findOneAndUpdate(
                        { requestId: clientRequestId },
                        {
                            consentRequestId,
                            status: error ? 'FAILED' : 'PENDING'
                        }
                    );
                } catch (dbErr) {
                    console.warn('⚠️ [ABDM-M3] DB update warning on consent on-init:', dbErr.message);
                }
            }
        } catch (err) {
            console.error('❌ [ABDM-M3] Unhandled error in handleConsentOnInit async processing:', err.message);
        }
    });
};

/**
 * 2. Webhook: Consent Request On-Status Callback
 * ABDM Gateway returns the status of a consent request
 * Endpoint: POST /v3/hiu/consent/request/on-status
 */
const handleConsentOnStatus = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('CONSENT REQUEST ON-STATUS', req);

    const consentRequest = req.body?.consentRequest;
    const incomingRequestId = req.body?.response?.requestId || req.headers['request-id'];
    const error = req.body?.error;

    setImmediate(async () => {
        try {
            console.log(`ℹ️ [ABDM-M3] Consent On-Status received:`, consentRequest);
            if (consentRequest?.id) {
                const consentRequestId = consentRequest.id;
                const status = consentRequest.status;

                // 1. Update in-memory state
                for (const [k, v] of m3ConsentService.hiuConsentState.entries()) {
                    if (v.consentRequestId === consentRequestId || k === incomingRequestId) {
                        m3ConsentService.updateConsentState(k, {
                            status: status || v.status,
                            error: error || null,
                            statusCheckedAt: new Date().toISOString()
                        });
                    }
                }

                // 2. Update MongoDB if connected
                if (mongoose.connection && mongoose.connection.readyState === 1) {
                    try {
                        await AbdmConsent.findOneAndUpdate(
                            { consentRequestId },
                            { status: status || 'REQUESTED' }
                        );
                        if (incomingRequestId) {
                            await AbdmTransaction.findOneAndUpdate(
                                { requestId: incomingRequestId },
                                { status: error ? 'FAILED' : 'COMPLETED', metadata: { status, error } }
                            );
                        }
                    } catch (dbErr) {
                        console.warn('⚠️ [ABDM-M3] DB update warning on consent on-status callback:', dbErr.message);
                    }
                }
            }
        } catch (err) {
            console.error('❌ [ABDM-M3] Unhandled error in handleConsentOnStatus async processing:', err.message);
        }
    });
};

/**
 * 3. Webhook: Consent Request Notification Callback (Notify)
 * ABDM Gateway informs HIU when a patient grants, denies, or revokes consent.
 * 1. Returns 202 Accepted immediately.
 * 2. Calls processConsentNotification to update state, send on-notify ack, and auto-fetch artefacts if GRANTED.
 * Endpoint: POST /v3/hiu/consent/request/notify
 */
const handleConsentNotify = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('CONSENT REQUEST NOTIFY', req);

    const notification = req.body?.notification;
    const incomingRequestId = req.headers['request-id'] || req.body?.response?.requestId || req.body?.requestId;

    setImmediate(async () => {
        try {
            console.log(`ℹ️ [ABDM-M3] Processing async consent notification for consentRequestId: ${notification?.consentRequestId}, Status: ${notification?.status}`);
            await m3ConsentService.processConsentNotification({
                notification,
                requestId: incomingRequestId
            });
        } catch (err) {
            console.error('❌ [ABDM-M3] Unhandled error in handleConsentNotify async processing:', err.message);
        }
    });
};

/**
 * 4. Webhook: Consent Artefact On-Fetch Callback
 * ABDM Gateway delivers the signed consent artefact to HIU.
 * 1. Returns 202 Accepted immediately.
 * 2. Calls processConsentFetchCallback to save the artefact into memory and DB.
 * Endpoint: POST /v3/hiu/consent/on-fetch
 */
const handleConsentOnFetch = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('CONSENT ON-FETCH', req);

    const consent = req.body?.consent;
    const incomingRequestId = req.headers['request-id'] || req.body?.response?.requestId || req.body?.requestId;
    const error = req.body?.error;

    setImmediate(async () => {
        try {
            if (error) {
                console.error(`❌ [ABDM-M3] Consent On-Fetch Gateway reported error:`, error);
                return;
            }
            console.log(`ℹ️ [ABDM-M3] Processing async consent on-fetch callback. Status: ${consent?.status}`);
            await m3ConsentService.processConsentFetchCallback({
                consent,
                requestId: incomingRequestId
            });
        } catch (err) {
            console.error('❌ [ABDM-M3] Unhandled error in handleConsentOnFetch async processing:', err.message);
        }
    });
};

/**
 * 5. Webhook: Health Information On-Request Callback
 * ABDM Gateway confirms receipt of health data request and returns transactionId.
 * 1. Returns 202 Accepted immediately.
 * 2. Correlates transactionId with stored ECDH key material via processDataRequestCallback.
 * Endpoint: POST /v3/hiu/health-information/on-request
 */
const handleHealthInformationOnRequest = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('HEALTH INFORMATION ON-REQUEST', req);

    setImmediate(async () => {
        try {
            console.log('ℹ️ [ABDM-M3] Processing async health information on-request callback');
            await m3DataFlowService.processDataRequestCallback(req.body || {});
        } catch (err) {
            console.error('❌ [ABDM-M3] Unhandled error in handleHealthInformationOnRequest async processing:', err.message);
        }
    });
};

/**
 * 6. Webhook: Data Push Receiver (Encrypted FHIR Bundles)
 * The Data Push URL where remote HIPs directly push encrypted health data to HIU.
 * 1. Returns 202 Accepted immediately.
 * 2. Calls processDataPush to decrypt FHIR bundles with ECDH private key and notify Gateway.
 * Endpoint: POST /v3/data/push
 */
const handleDataPush = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('DATA PUSH RECEIVER (ENCRYPTED FHIR)', req);

    setImmediate(async () => {
        try {
            console.log(`ℹ️ [ABDM-M3] Processing async data push payload for Transaction: ${req.body?.transactionId}`);
            await m3DataFlowService.processDataPush(req.body || {});
        } catch (err) {
            console.error('❌ [ABDM-M3] Unhandled error in handleDataPush async processing:', err.message);
        }
    });
};

/**
 * Trigger outbound consent initiation from internal API / Medora360 Doctor Portal
 * Endpoint: POST /consent/request/init
 */
const triggerInitiateConsentRequest = async (req, res) => {
    try {
        const {
            patientId,
            purposeCode,
            purposeText,
            hiTypes,
            dateRangeFrom,
            dateRangeTo,
            dataEraseAt,
            requesterName,
            requesterId
        } = req.body;

        if (!patientId) {
            return res.status(400).json({
                success: false,
                message: 'patientId (ABHA address e.g. user@sbx) is required'
            });
        }

        const result = await m3ConsentService.initiateConsentRequest({
            patientId,
            purposeCode,
            purposeText,
            hiTypes,
            dateRangeFrom,
            dateRangeTo,
            dataEraseAt,
            requesterName,
            requesterId
        });

        return res.status(200).json({
            success: true,
            message: 'Consent initiation request sent to ABDM Gateway successfully',
            data: result
        });
    } catch (error) {
        console.error('❌ [ABDM-M3] Error initiating consent request:', error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.message,
            error: error.response?.data || error.toString()
        });
    }
};

/**
 * Trigger outbound check of Consent Request Status
 * Endpoint: POST /consent/request/status
 */
const triggerGetConsentStatus = async (req, res) => {
    try {
        const consentRequestId = req.body?.consentRequestId || req.params?.consentRequestId || req.query?.consentRequestId;
        if (!consentRequestId) {
            return res.status(400).json({
                success: false,
                message: 'consentRequestId is required to check status'
            });
        }

        const result = await m3ConsentService.getConsentRequestStatus(consentRequestId);
        return res.status(200).json({
            success: true,
            message: 'Consent request status check sent to ABDM Gateway successfully',
            data: result
        });
    } catch (error) {
        console.error('❌ [ABDM-M3] Error getting consent request status:', error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.message,
            error: error.response?.data || error.toString()
        });
    }
};

/**
 * Trigger manual fetch of a Consent Artefact
 * Endpoint: POST /consent/artefact/fetch
 */
const triggerFetchConsentArtefact = async (req, res) => {
    try {
        const { consentId } = req.body;
        if (!consentId) {
            return res.status(400).json({
                success: false,
                message: 'consentId is required to fetch artefact'
            });
        }

        const result = await m3ConsentService.fetchConsentArtefact(consentId);
        return res.status(200).json({
            success: true,
            message: 'Consent artefact fetch request sent to Gateway successfully',
            data: result
        });
    } catch (error) {
        console.error('❌ [ABDM-M3] Error fetching consent artefact:', error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.message,
            error: error.response?.data || error.toString()
        });
    }
};

/**
 * Trigger outbound Health Data Request to Gateway (Step 3)
 * Generates ECDH Curve25519 keys, stores them, and requests data from HIP.
 * Endpoint: POST /data/request/init
 */
const triggerInitiateDataRequest = async (req, res) => {
    try {
        const { consentId, dateRangeFrom, dateRangeTo, dataPushUrl } = req.body;
        if (!consentId) {
            return res.status(400).json({
                success: false,
                message: 'consentId is required to initiate health data request'
            });
        }

        const result = await m3DataFlowService.initiateDataRequest({
            consentId,
            dateRangeFrom,
            dateRangeTo,
            dataPushUrl
        });

        return res.status(200).json({
            success: true,
            message: 'Health data request sent to ABDM Gateway successfully',
            data: result
        });
    } catch (error) {
        console.error('❌ [ABDM-M3] Error initiating health data request:', error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.message,
            error: error.response?.data || error.toString()
        });
    }
};

/**
 * Get consent states (persisted in DB and in-memory)
 */
const getConsentStatesHandler = async (req, res) => {
    const states = await m3ConsentService.getAllConsentStates();
    res.status(200).json({
        success: true,
        count: states.length,
        data: states
    });
};

/**
 * Get stored consent artefacts (persisted in DB and in-memory)
 */
const getConsentArtefactsHandler = async (req, res) => {
    const artefacts = await m3ConsentService.getAllConsentArtefacts();
    res.status(200).json({
        success: true,
        count: artefacts.length,
        data: artefacts
    });
};

/**
 * Get in-memory stored encryption key materials
 */
const getKeyMaterialsHandler = (req, res) => {
    const keys = m3DataFlowService.getAllKeyMaterials();
    res.status(200).json({
        success: true,
        count: keys.length,
        data: keys
    });
};

/**
 * Get decrypted FHIR health records received from HIPs (persisted in DB and in-memory)
 */
const getDecryptedRecordsHandler = async (req, res) => {
    const { transactionId } = req.query;
    if (transactionId) {
        const record = await m3DataFlowService.getDecryptedRecords(transactionId);
        return res.status(200).json({
            success: true,
            data: record
        });
    }
    const records = await m3DataFlowService.getAllDecryptedRecords();
    return res.status(200).json({
        success: true,
        count: records.length,
        data: records
    });
};

module.exports = {
    handleConsentOnInit,
    handleConsentOnStatus,
    handleConsentNotify,
    handleConsentOnFetch,
    handleHealthInformationOnRequest,
    handleDataPush,
    triggerInitiateConsentRequest,
    triggerGetConsentStatus,
    triggerFetchConsentArtefact,
    triggerInitiateDataRequest,
    getConsentStatesHandler,
    getConsentArtefactsHandler,
    getKeyMaterialsHandler,
    getDecryptedRecordsHandler
};
