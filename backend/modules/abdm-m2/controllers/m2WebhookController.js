const m2BridgeService = require('../services/m2BridgeService');
const m2DiscoveryService = require('../services/m2DiscoveryService');
const m2LinkService = require('../services/m2LinkService');
const m2HipLinkingService = require('../services/m2HipLinkingService');
const m2DataFlowService = require('../services/m2DataFlowService');

/**
 * Helper to log inbound webhook callback details
 */
const logIncomingWebhook = (endpointName, req) => {
    console.log(`\n📥 ================= ABDM M2 INBOUND WEBHOOK [${endpointName}] =================`);
    console.log('Timestamp :', new Date().toISOString());
    console.log('Path      :', req.originalUrl || req.url);
    console.log('Method    :', req.method);
    console.log('Headers   :', JSON.stringify(req.headers, null, 2));
    console.log('Body      :', JSON.stringify(req.body, null, 2));
    console.log('===========================================================================\n');
};

/**
 * Webhook: Patient Care-Context Discovery Callback
 * ABDM Endpoint: POST /v3/patient/care-context/discover
 */
const discoverCareContext = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('PATIENT CARE-CONTEXT DISCOVER', req);

    const transactionId = req.body?.transactionId;
    const requestId = req.headers['request-id'] || req.body?.requestId;
    const patientCriteria = req.body?.patient;

    setImmediate(async () => {
        try {
            console.log(`🚀 [ABDM-M2] Processing async discovery for transaction: ${transactionId}`);
            await m2DiscoveryService.processPatientDiscovery({
                patient: patientCriteria,
                transactionId,
                requestId
            });
        } catch (err) {
            console.error('❌ [ABDM-M2] Unhandled error during async discovery processing:', err.message);
        }
    });
};

/**
 * Webhook: Care-Context Link OTP Initiation Callback
 * ABDM Endpoint: POST /v3/link/care-context/init (or /v3/link/care-context/on-init)
 */
const initCareContextLink = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('CARE-CONTEXT LINK INIT', req);

    const transactionId = req.body?.transactionId;
    const requestId = req.headers['request-id'] || req.body?.requestId;
    const patient = req.body?.patient;

    setImmediate(async () => {
        try {
            console.log(`🚀 [ABDM-M2] Processing async link-init for transaction: ${transactionId}`);
            await m2LinkService.processLinkInit({
                transactionId,
                requestId,
                patient
            });
        } catch (err) {
            console.error('❌ [ABDM-M2] Unhandled error during async link-init processing:', err.message);
        }
    });
};

/**
 * Webhook: Care-Context Link OTP Confirmation Callback
 * ABDM Endpoint: POST /v3/link/care-context/confirm (or /v3/link/care-context/on-confirm)
 */
const confirmCareContextLink = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('CARE-CONTEXT LINK CONFIRM', req);

    const requestId = req.headers['request-id'] || req.body?.requestId;
    const confirmation = req.body?.confirmation;

    setImmediate(async () => {
        try {
            console.log(`🚀 [ABDM-M2] Processing async link-confirm for requestId: ${requestId}`);
            await m2LinkService.processLinkConfirm({
                confirmation,
                requestId
            });
        } catch (err) {
            console.error('❌ [ABDM-M2] Unhandled error during async link-confirm processing:', err.message);
        }
    });
};

/**
 * Webhook: Token Generation Callback for HIP-Initiated Linking
 * ABDM Endpoint: POST /api/v3/hip/token/on-generate-token (or /v3/hip/token/on-generate-token)
 */
const handleOnGenerateToken = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('HIP TOKEN ON-GENERATE-TOKEN', req);

    const linkToken = req.body?.linkToken;
    const abhaAddress = req.body?.abhaAddress;
    const response = req.body?.response;
    const error = req.body?.error;

    setImmediate(async () => {
        try {
            console.log(`🚀 [ABDM-M2] Processing async link token callback for req: ${response?.requestId || 'N/A'}`);
            await m2HipLinkingService.processLinkTokenCallback({
                linkToken,
                abhaAddress,
                response,
                error
            });
        } catch (err) {
            console.error('❌ [ABDM-M2] Unhandled error during async token callback processing:', err.message);
        }
    });
};

/**
 * Internal Medora360 API: Trigger HIP-Initiated Link for a patient visit
 * POST /api/abdm/m2/webhooks/hip/link-token/request
 */
const triggerHipInitiatedLink = async (req, res) => {
    try {
        const { abhaNumber, abhaAddress, name, gender, yearOfBirth, patientUhid, visitRegNumber } = req.body;

        if (!abhaAddress && !abhaNumber) {
            return res.status(400).json({
                success: false,
                message: 'Either abhaAddress or abhaNumber is required'
            });
        }

        if (!patientUhid || !visitRegNumber) {
            return res.status(400).json({
                success: false,
                message: 'patientUhid and visitRegNumber are required'
            });
        }

        const result = await m2HipLinkingService.requestLinkToken({
            abhaNumber,
            abhaAddress,
            name,
            gender,
            yearOfBirth,
            patientUhid,
            visitRegNumber
        });

        return res.status(200).json({
            success: true,
            message: 'Link token request initiated with ABDM Gateway',
            result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to request link token',
            error: error.details || error
        });
    }
};

/**
 * Webhook: Consent Grant / Revocation Notification Callback
 * ABDM Endpoint: POST /v3/consent/request/hip/notify
 */
const notifyConsent = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('CONSENT HIP NOTIFY', req);

    const notification = req.body?.notification || req.body;
    const requestId = req.headers['request-id'] || req.body?.requestId;

    setImmediate(async () => {
        try {
            console.log(`🚀 [ABDM-M2] Processing async consent notification for req: ${requestId || 'N/A'}`);
            await m2DataFlowService.processConsentNotify({
                notification,
                requestId
            });
        } catch (err) {
            console.error('❌ [ABDM-M2] Unhandled error during async consent notify processing:', err.message);
        }
    });
};

/**
 * Webhook: Health Information Data Request Callback
 * ABDM Endpoint: POST /v3/health-information/hip/request
 */
const requestHealthInformation = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('HEALTH INFORMATION HIP REQUEST', req);

    const hiRequest = req.body?.hiRequest;
    const transactionId = req.body?.transactionId || hiRequest?.transactionId;
    const requestId = req.headers['request-id'] || req.body?.requestId;

    setImmediate(async () => {
        try {
            console.log(`🚀 [ABDM-M2] Processing async health information data request for tx: ${transactionId || 'N/A'}`);
            await m2DataFlowService.processDataRequest({
                hiRequest,
                transactionId,
                requestId
            });
        } catch (err) {
            console.error('❌ [ABDM-M2] Unhandled error during async health information processing:', err.message);
        }
    });
};

/**
 * Webhook: Deep Linking SMS Notification on-notify Callback
 * ABDM Endpoint: POST /v3/patients/sms/on-notify (or /api/v3/patients/sms/on-notify)
 */
const handleSmsOnNotify = async (req, res) => {
    res.status(202).json({ status: 'Accepted' });
    logIncomingWebhook('SMS DEEP-LINK ON-NOTIFY', req);

    const origRequestId = req.body?.resp?.requestId;
    const status = req.body?.acknowledgement?.status || 'SUCCESS';
    const error = req.body?.error;

    setImmediate(async () => {
        try {
            console.log(`🚀 [ABDM-M2] Processing async SMS on-notify for original request: ${origRequestId || 'N/A'}`);
            if (origRequestId) {
                const AbdmTransaction = require('../../../models/AbdmTransaction');
                await AbdmTransaction.updateOne(
                    { requestId: origRequestId },
                    { $set: { status: error ? 'FAILED' : 'COMPLETED', metadata: { error, status } } }
                );
            }
        } catch (err) {
            console.error('❌ [ABDM-M2] Unhandled error during SMS on-notify processing:', err.message);
        }
    });
};

/**
 * Internal Medora360 API: Trigger Deep Linking SMS
 * POST /api/abdm/m2/webhooks/hip/deep-link/sms
 */
const triggerDeepLinkSms = async (req, res) => {
    try {
        const { phoneNo, hipName } = req.body;
        if (!phoneNo) {
            return res.status(400).json({
                success: false,
                message: 'phoneNo is required'
            });
        }

        const result = await m2HipLinkingService.sendDeepLinkSmsNotify({ phoneNo, hipName });
        return res.status(200).json({
            success: true,
            message: 'Deep linking SMS notification sent to ABDM Gateway',
            result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to send deep link SMS',
            error: error.details || error
        });
    }
};

/**
 * Admin API: Update Bridge URL endpoint
 * POST /api/abdm/m2/webhooks/bridge/update-url
 */
const updateBridgeUrlHandler = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'Webhook base url is required in body ({ url: "https://your-domain.com/api/abdm/m2/webhooks" })'
            });
        }

        const result = await m2BridgeService.updateBridgeUrl(url);
        return res.status(200).json({
            success: true,
            message: 'ABDM Bridge URL updated successfully',
            result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Failed to update bridge URL',
            error: error.details || error
        });
    }
};

module.exports = {
    discoverCareContext,
    initCareContextLink,
    confirmCareContextLink,
    handleOnGenerateToken,
    triggerHipInitiatedLink,
    notifyConsent,
    requestHealthInformation,
    handleSmsOnNotify,
    triggerDeepLinkSms,
    updateBridgeUrlHandler
};
