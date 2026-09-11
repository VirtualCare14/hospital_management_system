const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { getAccessToken } = require('../../../services/abdmGatewayService');

/**
 * Get and validate ABDM M2 Environment Configuration
 */
const getBridgeConfig = () => {
    const gatewayBaseUrl = process.env.ABDM_GATEWAY_BASE_URL || 'https://dev.abdm.gov.in';
    const hipId = process.env.ABDM_HIP_ID || '';
    const cmId = process.env.ABDM_CM_ID || 'sbx';
    const timeout = Number(process.env.ABDM_TIMEOUT || 30000);

    if (!process.env.ABDM_HIP_ID) {
        console.warn('⚠️ [ABDM-M2] ABDM_HIP_ID is not configured in .env (recommended for HIP operations)');
    }

    return {
        gatewayBaseUrl: gatewayBaseUrl.replace(/\/$/, ''),
        hipId,
        cmId,
        timeout
    };
};

/**
 * Update Bridge Webhook URL on ABDM Gateway
 * Method: PATCH
 * Endpoint: /api/hiecm/gateway/v3/bridge/url
 * 
 * @param {string} webhookBaseUrl - The public base URL where ABDM Gateway will deliver webhook callbacks
 * @returns {Promise<Object>} Response data from ABDM Gateway
 */
const updateBridgeUrl = async (webhookBaseUrl) => {
    try {
        if (!webhookBaseUrl) {
            throw new Error('webhookBaseUrl is required to update ABDM Bridge URL');
        }

        const config = getBridgeConfig();
        const token = await getAccessToken();
        const requestId = uuidv4();
        const timestamp = new Date().toISOString();

        const url = `${config.gatewayBaseUrl}/api/hiecm/gateway/v3/bridge/url`;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'REQUEST-ID': requestId,
            'TIMESTAMP': timestamp,
            'X-CM-ID': config.cmId,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const payload = {
            url: webhookBaseUrl
        };

        console.log('\n========== ABDM M2: UPDATE BRIDGE URL ==========');
        console.log('Target URL  :', url);
        console.log('Bridge URL  :', webhookBaseUrl);
        console.log('Request ID  :', requestId);
        console.log('Timestamp   :', timestamp);
        console.log('X-CM-ID     :', config.cmId);
        console.log('================================================\n');

        const response = await axios.patch(url, payload, {
            headers,
            timeout: config.timeout
        });

        console.log('✅ ABDM Bridge URL updated successfully. Status:', response.status);
        return {
            success: true,
            status: response.status,
            data: response.data || { message: 'Bridge URL updated' }
        };

    } catch (error) {
        console.error('\n❌ ========== ABDM M2 BRIDGE UPDATE ERROR ==========');
        if (error.response) {
            console.error('Status :', error.response.status);
            console.error('Data   :', error.response.data);
            console.error('Headers:', error.response.headers);
        } else {
            console.error('Message:', error.message);
        }
        console.error('====================================================\n');

        throw {
            success: false,
            message: error.response?.data?.message || error.message,
            statusCode: error.response?.status || 500,
            details: error.response?.data || null
        };
    }
};

module.exports = {
    getBridgeConfig,
    updateBridgeUrl
};
