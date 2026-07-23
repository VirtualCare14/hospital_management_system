const axios = require("axios");
const crypto = require("crypto");

const abdmGatewayService = require("./abdmGatewayService");
const abdmCryptoService = require("./abdmCryptoService");

// ======================================
// Search ABHA By Mobile
// ======================================
const searchAbha = async (mobile) => {

    const token =
        await abdmGatewayService.getAccessToken();

    const encryptedMobile =
        await abdmCryptoService.encryptMobile(mobile);

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
                Accept: "application/json",
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

module.exports = {
    searchAbha,
    getQrCode,
    getAbhaCard
};