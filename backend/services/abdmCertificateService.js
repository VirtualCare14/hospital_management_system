const axios = require("axios");
const crypto = require("crypto");
const { getAccessToken } = require("./abdmGatewayService");

let cachedCertificate = null;
let certificateFetchedAt = 0;

// 24 Hours Cache
const CACHE_TIME = 24 * 60 * 60 * 1000;

const getCertificate = async () => {
    try {

        const now = Date.now();

        // Return Cached Certificate
        if (
            cachedCertificate &&
            (now - certificateFetchedAt) < CACHE_TIME
        ) {
            console.log("✅ Using Cached ABDM Certificate");
            return cachedCertificate;
        }

        const token = await getAccessToken();

        const url =
            `${process.env.ABDM_ABHA_BASE_URL.replace(/\/$/, "")}/abha/api/v3/profile/public/certificate`;

        console.log("📥 Fetching ABDM Public Certificate...");

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "REQUEST-ID": crypto.randomUUID(),
                TIMESTAMP: new Date().toISOString()
            },
            timeout: Number(process.env.ABDM_TIMEOUT || 30000)
        });

        cachedCertificate = response.data;
        certificateFetchedAt = now;

        console.log("✅ ABDM Certificate Cached Successfully");

        return cachedCertificate;

    } catch (error) {

        console.error("\n========== CERTIFICATE ERROR ==========");

        if (error.response) {
            console.error("Status :", error.response.status);
            console.error("Data :", error.response.data);
        } else {
            console.error("Message :", error.message);
        }

        console.error("=======================================\n");

        throw error;
    }
};

const clearCertificateCache = () => {
    cachedCertificate = null;
    certificateFetchedAt = 0;
};

module.exports = {
    getCertificate,
    clearCertificateCache
};