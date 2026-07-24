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
// Helper: Extract ABHA user token from request
// Frontend sends it via x-abha-token header
// ======================================
const getAbhaToken = (req) => {
    const abhaToken = req.headers["x-abha-token"];
    if (abhaToken) return abhaToken;
    // Fallback: try Authorization header (for backward compat during transition)
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
        return auth.replace("Bearer ", "");
    }
    return null;
};

// ======================================
// Verify Mobile OTP
// ======================================
exports.verifyMobileOtp = async (req, res) => {
    try {
        const userToken = getAbhaToken(req);
        if (!userToken) {
            return res.status(400).json({
                success: false,
                message: "ABHA user token is required (x-abha-token header)."
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

        const response = await profileService.verifyMobileOtp(
            userToken,
            { txnId, otp }
        );

        return res.status(200).json({ success: true, data: response });

    } catch (error) {
        console.error("Verify Mobile OTP error:", error.response?.status || error.message);
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
        const userToken = getAbhaToken(req);
        if (!userToken) {
            return res.status(400).json({
                success: false,
                message: "ABHA user token is required (x-abha-token header)."
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

        const response = await profileService.requestEmailVerification(userToken, email);

        return res.status(200).json({ success: true, data: response });

    } catch (error) {
        console.error("Request Email Verification error:", error.response?.status || error.message);
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
        const userToken = getAbhaToken(req);
        if (!userToken) {
            return res.status(400).json({
                success: false,
                message: "ABHA user token is required (x-abha-token header)."
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

        const response = await profileService.verifyEmail(userToken, { txnId, otp, email });

        return res.status(200).json({ success: true, data: response });

    } catch (error) {
        console.error("Verify Email error:", error.response?.status || error.message);
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
        console.error("Gateway Token Error:", error.response?.status || error.message);
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
        const certificate = await abdmCertificateService.getCertificate();
        res.status(200).json({
            success: true,
            certificate
        });
    } catch (error) {
        console.error("Certificate Error:", error.response?.status || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
};

// ======================================
// Encrypt Aadhaar (Development Only)
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
        const encrypted = await abdmCryptoService.encryptAadhaar(aadhaar);
        res.status(200).json({
            success: true,
            encrypted
        });
    } catch (error) {
        console.error("Encryption Error:", error.response?.status || error.message);
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
        const response = await enrollmentService.requestOtp(aadhaar);
        res.status(200).json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error("Request OTP error:", error.response?.status || error.message);
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

        const response = await enrollmentService.verifyOtp({
            txnId,
            otp,
            mobile
        });

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error("Verify OTP error:", error.response?.status || error.message);
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
        const response = await loginService.requestLoginOtp(aadhaar);
        res.status(200).json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error("Login Request OTP error:", error.response?.status || error.message);
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

        const response = await loginService.verifyLoginOtp({
            txnId,
            otp
        });

        // ABDM returns the X-token in the response headers
        // Extract it and include in the JSON response for the frontend
        const xtoken = response?.headers?.['x-token'] || 
                       response?.data?.token || 
                       response?.token;

        res.status(200).json({
            success: true,
            data: response.data || response,
            xtoken: xtoken || null
        });

    } catch (error) {
        console.error("Login Verify OTP error:", error.response?.status || error.message);
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
        const response = await accountService.searchAbha(mobile);
        res.status(200).json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error("Search ABHA error:", error.response?.status || error.message);
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
        const userToken = getAbhaToken(req);
        if (!userToken) {
            return res.status(400).json({
                success: false,
                message: "ABHA user token is required (x-abha-token header)."
            });
        }

        const profile = await profileService.getProfile(userToken);

        res.status(200).json({
            success: true,
            data: profile
        });

    } catch (error) {
        console.error("Get Profile error:", error.response?.status || error.message);
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
        const userToken = getAbhaToken(req);
        if (!userToken) {
            return res.status(400).json({
                success: false,
                message: "ABHA user token is required (x-abha-token header)."
            });
        }

        const qrImage = await accountService.getQrCode(userToken);

        res.setHeader("Content-Type", "image/png");
        return res.send(qrImage);

    } catch (error) {
        console.error("Get QR Code error:", error.response?.status || error.message);
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
        const userToken = getAbhaToken(req);
        if (!userToken) {
            return res.status(400).json({
                success: false,
                message: "ABHA user token is required (x-abha-token header)."
            });
        }

        const response = await accountService.getAbhaCard(userToken);

        res.setHeader("Content-Type", response.contentType);
        res.setHeader("Content-Disposition", "inline");
        return res.send(response.data);

    } catch (error) {
        console.error("Get ABHA Card error:", error.response?.status || error.message);
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
        const userToken = getAbhaToken(req);
        if (!userToken) {
            return res.status(400).json({
                success: false,
                message: "ABHA user token is required (x-abha-token header)."
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

        const response = await profileService.requestMobileOtp(userToken, mobile);

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error("Request Mobile OTP error:", error.response?.status || error.message);
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
        const userToken = getAbhaToken(req);
        if (!userToken) {
            return res.status(400).json({
                success: false,
                message: "ABHA user token is required (x-abha-token header)."
            });
        }

        const { abhaNumber } = req.body || {};
        if (!abhaNumber) {
            return res.status(400).json({
                success: false,
                message: "ABHA Number is required."
            });
        }

        const response = await profileService.requestDeactivateOtp(userToken, abhaNumber);

        return res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error("Request Deactivate OTP error:", error.response?.status || error.message);
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
        const userToken = getAbhaToken(req);
        if (!userToken) {
            return res.status(400).json({
                success: false,
                message: "ABHA user token is required (x-abha-token header)."
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

        const response = await profileService.verifyDeactivateOtp(userToken, {
            txnId,
            otp,
            reason
        });

        return res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error("Verify Deactivate OTP error:", error.response?.status || error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
};