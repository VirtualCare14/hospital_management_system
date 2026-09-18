const axios = require("axios");
const crypto = require("crypto");

const abdmGatewayService = require("./abdmGatewayService");
const abdmCryptoService = require("./abdmCryptoService");

// ======================================
// Request Login OTP
// ======================================
const requestLoginOtp = async (params) => {

    const { loginId, loginHint, otpSystem, scope, aadhaar } =
        typeof params === "string" ? { loginId: params, loginHint: "aadhaar" } : (params || {});

    const resolvedLoginId = loginId || aadhaar;

    const token =
        await abdmGatewayService.getAccessToken();

    let encryptedLoginId;
    if (loginHint === "aadhaar" || !loginHint) {
        encryptedLoginId = await abdmCryptoService.encryptAadhaar(resolvedLoginId);
    } else if (loginHint === "abha-number" || loginHint === "abha-address") {
        encryptedLoginId = await abdmCryptoService.encryptValue(resolvedLoginId);
    } else {
        encryptedLoginId = await abdmCryptoService.encryptValue(resolvedLoginId);
    }

    const payload = {
        scope: scope || [
            "abha-login",
            "aadhaar-verify"
        ],
        loginHint: loginHint || "aadhaar",
        loginId: encryptedLoginId,
        otpSystem: otpSystem || "aadhaar"
    };

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/login/request/otp`,

        payload,

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
// Verify Login OTP
// ======================================
const verifyLoginOtp = async ({ txnId, otp, scope }) => {

    const token =
        await abdmGatewayService.getAccessToken();

    const encryptedOtp =
        await abdmCryptoService.encryptOtp(otp);

    const payload = {
        scope: scope || [
            "abha-login",
            "aadhaar-verify"
        ],
        authData: {
            authMethods: ["otp"],
            otp: {
                txnId,
                otpValue: encryptedOtp
            }
        }
    };

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/login/verify`,

        payload,

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

    // Return both data and headers so controller can extract X-token
    return {
        data: response.data,
        headers: response.headers
    };
};

module.exports = {
    requestLoginOtp,
    verifyLoginOtp
};