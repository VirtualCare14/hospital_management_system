const axios = require("axios");
const crypto = require("crypto");

const abdmGatewayService = require("./abdmGatewayService");
const abdmCryptoService = require("./abdmCryptoService");

// ======================================
// Request Login OTP
// ======================================
const requestLoginOtp = async (aadhaar) => {

    const token =
        await abdmGatewayService.getAccessToken();

    const encryptedAadhaar =
        await abdmCryptoService.encryptAadhaar(aadhaar);

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/login/request/otp`,

        {
            scope: [
                "abha-login",
                "aadhaar-verify"
            ],
            loginHint: "aadhaar",
            loginId: encryptedAadhaar,
            otpSystem: "aadhaar"
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
// Verify Login OTP
// ======================================
const verifyLoginOtp = async ({ txnId, otp }) => {

    const token =
        await abdmGatewayService.getAccessToken();

    const encryptedOtp =
        await abdmCryptoService.encryptOtp(otp);

    const payload = {
        scope: [
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

    console.log("========== LOGIN VERIFY PAYLOAD ==========");
    console.log(JSON.stringify(payload, null, 2));

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

    return response.data;
};

module.exports = {
    requestLoginOtp,
    verifyLoginOtp
};