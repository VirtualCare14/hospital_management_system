const m3WebhookRoutes = require('./routes/m3WebhookRoutes');
const m3WebhookController = require('./controllers/m3WebhookController');
const m3ConsentService = require('./services/m3ConsentService');
const m3DataFlowService = require('./services/m3DataFlowService');
const m3CryptoService = require('./services/m3CryptoService');

module.exports = {
    m3WebhookRoutes,
    m3WebhookController,
    m3ConsentService,
    m3DataFlowService,
    m3CryptoService,
    initiateConsentRequest: m3ConsentService.initiateConsentRequest,
    getConsentRequestStatus: m3ConsentService.getConsentRequestStatus,
    fetchConsentArtefact: m3ConsentService.fetchConsentArtefact,
    initiateDataRequest: m3DataFlowService.initiateDataRequest,
    processDataPush: m3DataFlowService.processDataPush,
    decryptData: m3CryptoService.decryptData
};
