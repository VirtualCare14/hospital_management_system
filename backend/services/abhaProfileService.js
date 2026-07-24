const axios = require("axios");
const crypto = require("crypto");

const abdmGatewayService = require("./abdmGatewayService");
const abdmCryptoService = require("./abdmCryptoService");

// ======================================
// Get Profile
// ======================================
const getProfile = async (userToken) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const response = await axios.get(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account`,

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
                "REQUEST-ID": crypto.randomUUID(),
                TIMESTAMP: new Date().toISOString(),
                Accept: "application/json"
            },
            timeout: Number(process.env.ABDM_TIMEOUT || 30000)
        }

    );

    return response.data;

};

// ======================================
// Request Mobile OTP
// ======================================
const requestMobileOtp = async (
    userToken,
    mobile
) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const encryptedMobile =
        await abdmCryptoService.encryptMobile(mobile);

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/request/otp`,

        {
            scope: [
                "abha-profile",
                "mobile-verify"
            ],
            loginHint: "mobile",
            loginId: encryptedMobile,
            otpSystem: "abdm"
        },

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
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
// Verify Mobile OTP
// ======================================
const verifyMobileOtp = async (
    userToken,
    { txnId, otp }
) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const encryptedOtp =
        await abdmCryptoService.encryptOtp(otp);

    const payload = {
        scope: [
            "abha-profile",
            "mobile-verify"
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

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/verify`,

        payload,

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
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
// Request Email Verification
// ======================================
const requestEmailVerification = async (
    userToken,
    email
) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const encryptedEmail =
        await abdmCryptoService.encryptValue(email);

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/request/otp`,

        {
            scope: [
                "abha-profile",
                "email-verify"
            ],
            loginHint: "email",
            loginId: encryptedEmail,
            otpSystem: "abdm"
        },

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
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
// Verify Email
// ======================================
const verifyEmail = async (
    userToken,
    { txnId, otp, email }
) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const encryptedOtp =
        await abdmCryptoService.encryptOtp(otp);

    const encryptedEmail =
        await abdmCryptoService.encryptValue(email);

    const payload = {
        scope: [
            "abha-profile",
            "email-verify"
        ],
        authData: {
            authMethods: ["otp"],
            otp: {
                txnId,
                otpValue: encryptedOtp
            }
        },
        loginHint: "email",
        loginId: encryptedEmail
    };

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/verify`,

        payload,

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
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
// Request Deactivate OTP
// ======================================
const requestDeactivateOtp = async (
    userToken,
    abhaNumber
) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const encryptedAbha =
        await abdmCryptoService.encryptValue(abhaNumber);

    const payload = {
        scope: [
            "abha-profile",
            "de-activate"
        ],
        loginHint: "abha-number",
        loginId: encryptedAbha,
        otpSystem: "aadhaar"
    };

    console.log(
        "DEACTIVATE REQUEST PAYLOAD:",
        JSON.stringify(payload, null, 2)
    );

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/request/otp`,

        payload,

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
                "REQUEST-ID": crypto.randomUUID(),
                TIMESTAMP: new Date().toISOString(),
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            timeout: Number(process.env.ABDM_TIMEOUT || 30000)
        }

    );

    console.log(
        "DEACTIVATE REQUEST RESPONSE:",
        JSON.stringify(response.data, null, 2)
    );

    return response.data;

};

// ======================================
// Verify Deactivate OTP
// ======================================
const verifyDeactivateOtp = async (
    userToken,
    { txnId, otp, reason }
) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const encryptedOtp =
        await abdmCryptoService.encryptOtp(otp);

    const payload = {

        scope: [
            "abha-profile",
            "de-activate"
        ],

        authData: {

            authMethods: [
                "otp"
            ],

            otp: {
                txnId,
                otpValue: encryptedOtp
            }

        },

        reasons: [
            reason || "User requested account deactivation"
        ]

    };

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/verify`,

        payload,

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
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
// Request Reactivate OTP
// ======================================
const requestReactivateOtp = async (
    userToken,
    abhaNumber
) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const encryptedAbha =
        await abdmCryptoService.encryptValue(abhaNumber);

    const payload = {
        scope: [
            "abha-profile",
            "re-activate"
        ],
        loginHint: "abha-number",
        loginId: encryptedAbha,
        otpSystem: "abdm"
    };

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/request/otp`,

        payload,

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
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
// Verify Reactivate OTP
// ======================================
const verifyReactivateOtp = async (
    userToken,
    { txnId, otp }
) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const encryptedOtp =
        await abdmCryptoService.encryptOtp(otp);

    const payload = {

        scope: [
            "abha-profile",
            "re-activate"
        ],

        authData: {

            authMethods: [
                "otp"
            ],

            otp: {
                txnId,
                otpValue: encryptedOtp
            }

        }

    };

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/verify`,

        payload,

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
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
// Request Delete OTP
// ======================================
const requestDeleteOtp = async (
    userToken,
    abhaNumber
) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const encryptedAbha =
        await abdmCryptoService.encryptValue(abhaNumber);

    const payload = {
        scope: [
            "abha-profile",
            "delete"
        ],
        loginHint: "abha-number",
        loginId: encryptedAbha,
        otpSystem: "abdm"
    };

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/request/otp`,

        payload,

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
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
// Verify Delete OTP
// ======================================
const verifyDeleteOtp = async (
    userToken,
    { txnId, otp, reason }
) => {

    const gatewayToken =
        await abdmGatewayService.getAccessToken();

    const encryptedOtp =
        await abdmCryptoService.encryptOtp(otp);

    const payload = {

        scope: [
            "abha-profile",
            "delete"
        ],

        authData: {

            authMethods: [
                "otp"
            ],

            otp: {
                txnId,
                otpValue: encryptedOtp
            }

        },

        reasons: [
            reason || "User requested account deletion"
        ]

    };

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/profile/account/verify`,

        payload,

        {
            headers: {
                Authorization: `Bearer ${gatewayToken}`,
                "X-token": `Bearer ${userToken}`,
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
    getProfile,
    requestMobileOtp,
    verifyMobileOtp,
    requestEmailVerification,
    verifyEmail,
    requestDeactivateOtp,
    verifyDeactivateOtp,
    requestReactivateOtp,
    verifyReactivateOtp,
    requestDeleteOtp,
    verifyDeleteOtp
};
