const axios = require("axios");

let accessToken = null;
let tokenExpiry = 0;

const getAccessToken = async () => {
    try {
        const now = Date.now();

        // Existing token valid hai to reuse karo
        if (accessToken && now < tokenExpiry) {
            console.log("✅ Using Cached ABDM Access Token");
            return accessToken;
        }

        const gatewayBaseUrl = process.env.ABDM_GATEWAY_BASE_URL;
        const clientId = process.env.ABDM_CLIENT_ID;
        const clientSecret = process.env.ABDM_CLIENT_SECRET;

        // Debug Logs
        console.log("========== ABDM CONFIG ==========");
        console.log("Gateway Base URL :", gatewayBaseUrl);
        console.log("Client ID :", clientId);
        console.log("Client Secret :", clientSecret ? "Loaded ✅" : "Missing ❌");
        console.log("=================================");

        if (!gatewayBaseUrl) {
            throw new Error("ABDM_GATEWAY_BASE_URL is missing in .env");
        }

        if (!clientId) {
            throw new Error("ABDM_CLIENT_ID is missing in .env");
        }

        if (!clientSecret) {
            throw new Error("ABDM_CLIENT_SECRET is missing in .env");
        }

        const url = `${gatewayBaseUrl.replace(/\/$/, "")}/gateway/v0.5/sessions`;

        console.log("🚀 Calling :", url);

        const response = await axios.post(
            url,
            {
                clientId,
                clientSecret,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: Number(process.env.ABDM_TIMEOUT || 30000),
            }
        );

        accessToken = response.data.accessToken;

        tokenExpiry =
            Date.now() + ((response.data.expiresIn || 1200) - 60) * 1000;

        console.log("✅ New ABDM Access Token Generated");

        return accessToken;

    } catch (error) {

        console.log("\n========== ABDM TOKEN ERROR ==========");

        if (error.response) {
            console.log("Status :", error.response.status);
            console.log("Data :", error.response.data);
        } else {
            console.log("Message :", error.message);
        }

        console.log("======================================\n");

        throw error;
    }
};

module.exports = {
    getAccessToken,
};