const axios = require("axios");
const crypto = require("crypto");

const abdmGatewayService = require("./abdmGatewayService");
const abdmCryptoService = require("./abdmCryptoService");

// ======================================
// Retry helper for transient ABDM failures
// ======================================
const withRetry = async (fn, retries = 2, delayMs = 1000) => {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (error) {
            const status = error.response?.status;
            const isTransient = status === 504 || status === 502 || status === 503 || status === 429;
            if (!isTransient || attempt >= retries) {
                throw error;
            }
            attempt += 1;
            const delay = delayMs * attempt;
            console.warn(`ABDM transient error ${status}, retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};

// ======================================
// Search ABHA By Mobile
// ======================================
const searchAbha = async (mobile) => {

    const token =
        await abdmGatewayService.getAccessToken();

    const encryptedMobile =
        await abdmCryptoService.encryptMobile(mobile);

    // Temporary debug logging - safe, no secrets
    console.log("========== SEARCH ABHA DEBUG ==========");
    console.log("Endpoint:", `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/abha/search`);
    console.log("Original mobile:", mobile);
    console.log("Encrypted mobile length:", encryptedMobile.length);
    console.log("Encryption method: RSA/ECB/OAEPWithSHA-1AndMGF1Padding");
    console.log("Scope: search-abha");
    console.log("Authorization: Bearer <Gateway Token>");
    console.log("========================================");

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/abha/search`,

        {
            scope: [
                "search-abha"
            ],
            mobile: encryptedMobile
        },

        {
            headers: {
                Authorization: `Bearer ${token}`,
                "REQUEST-ID": crypto.randomUUID(),
                TIMESTAMP: new Date().toISOString(),
                "BENEFIT_NAME": "healthid api",
                "Cache-Control": "no-cache",
                Accept: "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Content-Type": "application/json"
            },
            timeout: Number(process.env.ABDM_TIMEOUT || 30000)
        }

    );

    return response.data;

};

// ======================================
// Get QR Code
// ======================================
const getQrCode = async (userToken) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const response = await axios.get(
    `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/qrCode`,
    {
        headers: {
            Authorization: `Bearer ${gatewayToken}`,
            "X-token": `Bearer ${userToken}`,
            "REQUEST-ID": crypto.randomUUID(),
            TIMESTAMP: new Date().toISOString(),
            Accept: "*/*"
        },
        responseType: "arraybuffer",
        timeout: Number(process.env.ABDM_TIMEOUT || 30000)
    }
);

    return response.data;

};

// ======================================
// Get ABHA Card
// ======================================
const getAbhaCard = async (userToken) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const response = await axios.get(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/abha-card`,

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
                "REQUEST-ID": crypto.randomUUID(),
                TIMESTAMP: new Date().toISOString(),
                Accept: "*/*"
            },
            responseType: "arraybuffer",
            timeout: Number(process.env.ABDM_TIMEOUT || 30000)
        }

    );

    return {
        data: response.data,
        contentType: response.headers["content-type"]
    };

};

// ======================================
// Get ABHA Address Suggestions
// ======================================
const getAbhaAddressSuggestions = async () => {

    const token =
        await abdmGatewayService.getAccessToken();

    const transactionId = crypto.randomUUID();

    console.log("========== ABHA ADDRESS SUGGESTIONS ==========");
    console.log("Endpoint:", `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/enrollment/enrol/suggestion`);
    console.log("Transaction ID:", transactionId);
    console.log("================================================");

    const response = await withRetry(() =>
        axios.get(
            `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/enrollment/enrol/suggestion`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Transaction_Id": transactionId,
                    "REQUEST-ID": crypto.randomUUID(),
                    TIMESTAMP: new Date().toISOString(),
                    Accept: "application/json"
                },
                timeout: Number(process.env.ABDM_TIMEOUT || 60000)
            }
        )
    );

    console.log("Suggestions response:", JSON.stringify(response.data, null, 2));

    return response.data;

};

// ======================================
// Create ABHA Address
// ======================================
const createAbhaAddress = async (txnId, abhaAddress, preferred = 1) => {

    const token =
        await abdmGatewayService.getAccessToken();

    console.log("========== CREATE ABHA ADDRESS ==========");
    console.log("Endpoint:", `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/enrollment/enrol/abha-address`);
    console.log("Transaction ID:", txnId);
    console.log("ABHA Address:", abhaAddress);
    console.log("Preferred:", preferred);
    console.log("==========================================");

    const response = await withRetry(() =>
        axios.post(
            `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/enrollment/enrol/abha-address`,
            {
                txnId,
                abhaAddress,
                preferred: Number(preferred)
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "REQUEST-ID": crypto.randomUUID(),
                    TIMESTAMP: new Date().toISOString(),
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                timeout: Number(process.env.ABDM_TIMEOUT || 60000)
            }
        )
    );

    console.log("Create address response:", JSON.stringify(response.data, null, 2));

    return response.data;

};

module.exports = {
    searchAbha,
    getQrCode,
    getAbhaCard,
    getAbhaAddressSuggestions,
    createAbhaAddress
};
