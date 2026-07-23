const abdmGatewayService = require("../services/abdmGatewayService");
const abdmCertificateService = require("../services/abdmCertificateService");
const abdmCryptoService = require("../services/abdmCryptoService");
const enrollmentService = require("../services/abhaEnrollmentService");
const loginService = require("../services/abhaLoginService");
const accountService = require("../services/abhaAccountService");
const profileService = require("../services/abhaProfileService");

// ======================================
// Health Check
// ======================================
exports.health = (req, res) => {
    res.status(200).json({
        success: true,
        message: "ABDM Module Working"
    });
};

// ======================================
// Verify Mobile OTP
// ======================================
exports.verifyMobileOtp = async (req, res) => {

    try {

        const authorization = req.headers.authorization;

        if (!authorization) {

            return res.status(400).json({
                success: false,
                message: "Authorization header is required."
            });

        }

        const { txnId, otp } = req.body || {};

        if (!txnId) {
            return res.status(400).json({
                success: false,
                message: "txnId is required."
            });
        }

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required."
            });
        }

        if (!/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Must be 6 digits."
            });
        }

        const token = authorization.replace("Bearer ", "");

        const response = await profileService.verifyMobileOtp(
            token,
            { txnId, otp }
        );

        return res.status(200).json({ success: true, data: response });

    } catch (error) {

        console.error("========== VERIFY MOBILE OTP ERROR ==========");

        if (error.response) {
            console.error(error.response.status);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });

    }

};

// ======================================
// Request Email Verification
// ======================================
exports.requestEmailVerification = async (req, res) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) {
            return res.status(400).json({
                success: false,
                message: "Authorization header is required."
            });
        }

        const { email } = req.body || {};

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(String(email))) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address."
            });
        }

        const token = authorization.replace("Bearer ", "");
        const response = await profileService.requestEmailVerification(token, email);

        return res.status(200).json({ success: true, data: response });

    } catch (error) {
        console.error("========== REQUEST EMAIL VERIFICATION ERROR ==========");
        if (error.response) {
            console.error(error.response.status);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
};

// ======================================
// Verify Email
// ======================================
exports.verifyEmail = async (req, res) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) {
            return res.status(400).json({
                success: false,
                message: "Authorization header is required."
            });
        }

        const { txnId, otp, email } = req.body || {};

        if (!txnId) {
            return res.status(400).json({
                success: false,
                message: "txnId is required."
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(String(email))) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address."
            });
        }

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required."
            });
        }

        if (!/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Must be 6 digits."
            });
        }

        const token = authorization.replace("Bearer ", "");
        const response = await profileService.verifyEmail(token, { txnId, otp, email });

        return res.status(200).json({ success: true, data: response });

    } catch (error) {
        console.error("========== VERIFY EMAIL ERROR ==========");
        if (error.response) {
            console.error(error.response.status);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
};

// ======================================
// Generate Gateway Token
// ======================================
exports.generateToken = async (req, res) => {

    try {

        const token = await abdmGatewayService.getAccessToken();

        res.status(200).json({
            success: true,
            token
        });

    } catch (error) {

        console.error("Gateway Token Error:");
        console.error(error.response?.data || error.message);

        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });

    }

};

// ======================================
// Get Public Certificate
// ======================================
exports.getCertificate = async (req, res) => {

    try {

        const certificate =
            await abdmCertificateService.getCertificate();

        res.status(200).json({
            success: true,
            certificate
        });

    } catch (error) {

        console.error("Certificate Error:");
        console.error(error.response?.data || error.message);

        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });

    }

};

// ======================================
// Encrypt Aadhaar
// ======================================
exports.encryptAadhaar = async (req, res) => {

    try {

        const { aadhaar } = req.body;

        if (!aadhaar) {
            return res.status(400).json({
                success: false,
                message: "Aadhaar number is required."
            });
        }

        if (!/^\d{12}$/.test(aadhaar)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Aadhaar number."
            });
        }

        const encrypted =
            await abdmCryptoService.encryptAadhaar(aadhaar);

        res.status(200).json({
            success: true,
            encrypted
        });

    } catch (error) {

        console.error("Encryption Error:");
        console.error(error.response?.data || error.message);

        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });

    }

};

// ======================================
// Request Aadhaar OTP
// ======================================
exports.requestOtp = async (req, res) => {

    try {

        const { aadhaar } = req.body;

        if (!aadhaar) {
            return res.status(400).json({
                success: false,
                message: "Aadhaar number is required."
            });
        }

        if (!/^\d{12}$/.test(aadhaar)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Aadhaar number."
            });
        }

        const response =
            await enrollmentService.requestOtp(aadhaar);

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {

        console.error("========== REQUEST OTP ERROR ==========");

        if (error.response) {
            console.error(error.response.status);
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });

    }

};

// ======================================
// Verify OTP & Create ABHA
// ======================================
exports.verifyOtp = async (req, res) => {

    console.log("==================================");
    console.log("VERIFY OTP API HIT");
    console.log("Headers:");
    console.log(req.headers);
    console.log("Body:");
    console.log(req.body);
    console.log("==================================");

    try {

        const { txnId, otp, mobile } = req.body || {};

        if (!txnId) {
            return res.status(400).json({
                success: false,
                message: "txnId is required."
            });
        }

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required."
            });
        }

        if (!mobile) {
            return res.status(400).json({
                success: false,
                message: "Mobile number is required."
            });
        }

        if (!/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP."
            });
        }

        if (!/^\d{10}$/.test(String(mobile))) {
            return res.status(400).json({
                success: false,
                message: "Invalid mobile number."
            });
        }

        const response =
            await enrollmentService.verifyOtp({
                txnId,
                otp,
                mobile
            });

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {

        console.error("========== VERIFY OTP ERROR ==========");

        if (error.response) {
            console.error(error.response.status);
            console.error(
                JSON.stringify(error.response.data, null, 2)
            );
        } else {
            console.error(error.message);
        }

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });

    }

};

// ======================================
// Request Login OTP
// ======================================
exports.requestLoginOtp = async (req, res) => {

    try {

        const { aadhaar } = req.body;

        if (!aadhaar) {
            return res.status(400).json({
                success: false,
                message: "Aadhaar number is required."
            });
        }

        if (!/^\d{12}$/.test(aadhaar)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Aadhaar number."
            });
        }

        const response =
            await loginService.requestLoginOtp(aadhaar);

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {

        console.error("========== LOGIN REQUEST OTP ERROR ==========");

        if (error.response) {
            console.error(error.response.status);
            console.error(
                JSON.stringify(error.response.data, null, 2)
            );
        } else {
            console.error(error.message);
        }

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });

    }

};

// ======================================
// Verify Login OTP
// ======================================
exports.verifyLoginOtp = async (req, res) => {

    try {

        const { txnId, otp } = req.body;

        if (!txnId) {
            return res.status(400).json({
                success: false,
                message: "txnId is required."
            });
        }

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required."
            });
        }

        if (!/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP."
            });
        }

        const response =
            await loginService.verifyLoginOtp({
                txnId,
                otp
            });

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {

        console.error("========== LOGIN VERIFY OTP ERROR ==========");

        if (error.response) {
            console.error(error.response.status);
            console.error(
                JSON.stringify(error.response.data, null, 2)
            );
        } else {
            console.error(error.message);
        }

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });

    }

};

// ======================================
// Search ABHA By Mobile
// ======================================
exports.searchAbha = async (req, res) => {

    try {

        const { mobile } = req.body;

        if (!mobile) {
            return res.status(400).json({
                success: false,
                message: "Mobile number is required."
            });
        }

        if (!/^\d{10}$/.test(String(mobile))) {
            return res.status(400).json({
                success: false,
                message: "Invalid mobile number."
            });
        }

        const response =
            await accountService.searchAbha(mobile);

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {

        console.error("========== SEARCH ABHA ERROR ==========");

        if (error.response) {
            console.error(error.response.status);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });

    }

};

// ======================================
// Get ABHA Profile
// ======================================
exports.getProfile = async (req, res) => {

    try {

        const authorization =
            req.headers.authorization;

        if (!authorization) {

            return res.status(400).json({
                success: false,
                message: "Authorization header is required."
            });

        }

        const token =
            authorization.replace("Bearer ", "");

        const profile =
            await profileService.getProfile(token);

        res.status(200).json({

            success: true,

            data: profile

        });

    } catch (error) {

        console.error("========== GET PROFILE ERROR ==========");

        if (error.response) {

            console.error(error.response.status);

            console.error(
                JSON.stringify(error.response.data, null, 2)
            );

        } else {

            console.error(error.message);

        }

        res.status(error.response?.status || 500).json({

            success: false,

            error: error.response?.data || error.message

        });

    }

};

// ======================================
// Get QR Code
// ======================================
exports.getQrCode = async (req, res) => {

    try {

        const authorization = req.headers.authorization;

        if (!authorization) {
            return res.status(400).json({
                success: false,
                message: "Authorization header is required."
            });
        }

        const token = authorization.replace("Bearer ", "");

        const qrImage =
            await accountService.getQrCode(token);

        res.setHeader("Content-Type", "image/png");

        return res.send(qrImage);

    } catch (error) {

        console.error(error.response?.data || error.message);

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });

    }

};

// ======================================
// Get ABHA Card
// ======================================
exports.getAbhaCard = async (req, res) => {

    try {

        const authorization = req.headers.authorization;

        if (!authorization) {

            return res.status(400).json({
                success: false,
                message: "Authorization header is required."
            });

        }

        const token = authorization.replace("Bearer ", "");

        const response =
            await accountService.getAbhaCard(token);

        res.setHeader(
            "Content-Type",
            response.contentType
        );

        res.setHeader(
            "Content-Disposition",
            "inline"
        );

        return res.send(response.data);

    } catch (error) {

        console.error("========== GET ABHA CARD ERROR ==========");

        if (error.response) {
            console.error(error.response.status);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });

    }

};

// ======================================
// Request Mobile OTP
// ======================================
exports.requestMobileOtp = async (req, res) => {

    try {

        const authorization =
            req.headers.authorization;

        if (!authorization) {

            return res.status(400).json({
                success: false,
                message: "Authorization header is required."
            });

        }

        const { mobile } = req.body;

        if (!mobile) {

            return res.status(400).json({
                success: false,
                message: "Mobile number is required."
            });

        }

        if (!/^\d{10}$/.test(String(mobile))) {

            return res.status(400).json({
                success: false,
                message: "Invalid mobile number. Must be 10 digits."
            });

        }

        const token =
            authorization.replace("Bearer ", "");

        const response =
            await profileService.requestMobileOtp(
                token,
                mobile
            );

        res.status(200).json({

            success: true,

            data: response

        });

    } catch (error) {

        console.error("========== REQUEST MOBILE OTP ERROR ==========");

        if (error.response) {

            console.error(error.response.status);

            console.error(
                JSON.stringify(error.response.data, null, 2)
            );

        } else {

            console.error(error.message);

        }

        res.status(error.response?.status || 500).json({

            success: false,

            error: error.response?.data || error.message

        });

    }

};

// ======================================
// Request Deactivate OTP
// ======================================
exports.requestDeactivateOtp = async (req, res) => {

    try {

        const authorization = req.headers.authorization;

        if (!authorization) {

            return res.status(400).json({
                success: false,
                message: "Authorization header is required."
            });

        }

        const { abhaNumber } = req.body || {};

        if (!abhaNumber) {

            return res.status(400).json({
                success: false,
                message: "ABHA Number is required."
            });

        }

        const token =
            authorization.replace("Bearer ", "");

        const response =
            await profileService.requestDeactivateOtp(
                token,
                abhaNumber
            );

        return res.status(200).json({

            success: true,

            data: response

        });

    } catch (error) {

        console.error("========== REQUEST DEACTIVATE OTP ERROR ==========");

        if (error.response) {

            console.error(error.response.status);

            console.error(
                JSON.stringify(error.response.data, null, 2)
            );

        } else {

            console.error(error.message);

        }

        return res.status(error.response?.status || 500).json({

            success: false,

            error: error.response?.data || error.message

        });

    }

};

// ======================================
// Verify Deactivate OTP
// ======================================
exports.verifyDeactivateOtp = async (req, res) => {

    try {

        const authorization = req.headers.authorization;

        if (!authorization) {

            return res.status(400).json({
                success: false,
                message: "Authorization header is required."
            });

        }

        const { txnId, otp, reason } = req.body || {};

        if (!txnId) {

            return res.status(400).json({
                success: false,
                message: "txnId is required."
            });

        }

        if (!otp) {

            return res.status(400).json({
                success: false,
                message: "OTP is required."
            });

        }

        if (!/^\d{6}$/.test(String(otp))) {

            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Must be 6 digits."
            });

        }

        const token =
            authorization.replace("Bearer ", "");

        const response =
            await profileService.verifyDeactivateOtp(
                token,
                {
                    txnId,
                    otp,
                    reason
                }
            );

        return res.status(200).json({

            success: true,

            data: response

        });

    } catch (error) {

        console.error("========== VERIFY DEACTIVATE OTP ERROR ==========");

        if (error.response) {

            console.error(error.response.status);

            console.error(
                JSON.stringify(error.response.data, null, 2)
            );

        } else {

            console.error(error.message);

        }

        return res.status(error.response?.status || 500).json({

            success: false,

            error: error.response?.data || error.message

        });

    }

};