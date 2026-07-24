const abdmCertificateService = require("./abdmCertificateService");
const { encrypt } = require("../utils/rsaEncrypt");

const encryptValue = async (value) => {
    const certificate = await abdmCertificateService.getCertificate();

    return encrypt(
        String(value),
        certificate.publicKey
    );
};

const encryptAadhaar = async (aadhaarNumber) => {
    return encryptValue(aadhaarNumber);
};

const encryptOtp = async (otp) => {
    return encryptValue(otp);
};

const encryptMobile = async (mobile) => {
    return encryptValue(mobile);
};

module.exports = {
    encryptValue,
    encryptAadhaar,
    encryptOtp,
    encryptMobile
};