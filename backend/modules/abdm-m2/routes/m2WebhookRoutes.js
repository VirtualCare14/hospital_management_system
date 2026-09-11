const express = require('express');
const router = express.Router();
const m2WebhookController = require('../controllers/m2WebhookController');

// ==========================================
// M2 Webhook Health Check
// ==========================================
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        module: 'ABDM-M2-HIP',
        timestamp: new Date().toISOString()
    });
});

// ==========================================
// 1. Patient Discovery Callback
// Gateway Endpoint: /v3/patient/care-context/discover
// ==========================================
router.post('/v3/patient/care-context/discover', m2WebhookController.discoverCareContext);

// ==========================================
// 2. User-Initiated Linking: OTP Init Callback
// Gateway Endpoints: /v3/link/care-context/init & /v3/link/care-context/on-init
// ==========================================
router.post('/v3/link/care-context/init', m2WebhookController.initCareContextLink);
router.post('/v3/link/care-context/on-init', m2WebhookController.initCareContextLink);

// ==========================================
// 3. User-Initiated Linking: Confirm OTP Callback
// Gateway Endpoints: /v3/link/care-context/confirm & /v3/link/care-context/on-confirm
// ==========================================
router.post('/v3/link/care-context/confirm', m2WebhookController.confirmCareContextLink);
router.post('/v3/link/care-context/on-confirm', m2WebhookController.confirmCareContextLink);

// ==========================================
// 4. HIP-Initiated Linking: Token On-Generate Callback
// Gateway Endpoints: /api/v3/hip/token/on-generate-token, /v3/hip/token/on-generate-token, /v3/token/on-generate-token
// ==========================================
router.post('/api/v3/hip/token/on-generate-token', m2WebhookController.handleOnGenerateToken);
router.post('/v3/hip/token/on-generate-token', m2WebhookController.handleOnGenerateToken);
router.post('/v3/token/on-generate-token', m2WebhookController.handleOnGenerateToken);

// ==========================================
// 5. Consent Grant / Revoke Notification Callback
// Gateway Endpoint: /v3/consent/request/hip/notify
// ==========================================
router.post('/v3/consent/request/hip/notify', m2WebhookController.notifyConsent);

// ==========================================
// 6. Health Information Data Flow Request Callback
// Gateway Endpoint: /v3/health-information/hip/request
// ==========================================
router.post('/v3/health-information/hip/request', m2WebhookController.requestHealthInformation);

// ==========================================
// 7. Deep Linking SMS On-Notify Callback
// Gateway Endpoints: /v3/patients/sms/on-notify & /api/v3/patients/sms/on-notify
// ==========================================
router.post('/v3/patients/sms/on-notify', m2WebhookController.handleSmsOnNotify);
router.post('/api/v3/patients/sms/on-notify', m2WebhookController.handleSmsOnNotify);

// ==========================================
// Internal / Admin Endpoints
// ==========================================
// Trigger HIP-Initiated Link from Medora360
router.post('/hip/link-token/request', m2WebhookController.triggerHipInitiatedLink);

// Trigger Deep Linking SMS from Medora360
router.post('/hip/deep-link/sms', m2WebhookController.triggerDeepLinkSms);

// Bridge Utility Endpoint (To update webhook URL on ABDM Gateway)
router.post('/bridge/update-url', m2WebhookController.updateBridgeUrlHandler);

module.exports = router;
