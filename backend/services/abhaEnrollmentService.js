const axios = require("axios");
const crypto = require("crypto");

const abdmGatewayService = require("./abdmGatewayService");
const abdmCryptoService = require("./abdmCryptoService");

// ======================================
// Request Aadhaar OTP
// ======================================
const requestOtp = async (aadhaar) => {

    const token = await abdmGatewayService.getAccessToken();

    const encryptedAadhaar =
        await abdmCryptoService.encryptAadhaar(aadhaar);

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/enrollment/request/otp`,

        {
            scope: ["abha-enrol"],
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
            }
        }

    );

    return response.data;
};

// ======================================
// Verify OTP & Create ABHA
// ======================================
const verifyOtp = async ({ txnId, otp, mobile }) => {

    const token = await abdmGatewayService.getAccessToken();

    const encryptedOtp =
        await abdmCryptoService.encryptOtp(otp);

    const response = await axios.post(

        `${process.env.ABDM_ABHA_BASE_URL}/abha/api/v3/enrollment/enrol/byAadhaar`,

        {
            authData: {
                authMethods: ["otp"],
                otp: {
                    timeStamp: Math.floor(Date.now() / 1000).toString(),
                    txnId,
                    otpValue: encryptedOtp,
                    mobile
                }
            },
            consent: {
                code: "abha-enrollment",
                version: "1.4"
            }
        },

        {
            headers: {
                Authorization: `Bearer ${token}`,
                "REQUEST-ID": crypto.randomUUID(),
                TIMESTAMP: new Date().toISOString(),
                Accept: "application/json",
                "Content-Type": "application/json"
            }
        }

    );

    return response.data;
};

module.exports = {
    requestOtp,
    verifyOtp
};