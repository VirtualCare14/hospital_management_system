const abdmGatewayService = require("../services/abdmGatewayService");
const abdmCertificateService = require("../services/abdmCertificateService");
const abdmCryptoService = require("../services/abdmCryptoService");
const enrollmentService = require("../services/abhaEnrollmentService");
const loginService = require("../services/abhaLoginService");
const accountService = require("../services/abhaAccountService");
const profileService = require("../services/abhaProfileService");
const Patient = require("../models/Patient");
const Hospital = require("../models/Hospital");
const generateUhid = require("../utils/generateUhid");

// ======================================
// Helper: Save or Update Patient with ABHA details in MongoDB
// ======================================
const saveOrUpdatePatientWithAbha = async (abhaData, mobileHint = null, req = null) => {
    try {
        if (!abhaData) return null;

        const abhaNumber = abhaData.ABHANumber || abhaData.abhaNumber || abhaData.healthIdNumber || abhaData.id || '';
        const abhaAddress = abhaData.preferredAbhaAddress || abhaData.abhaAddress || abhaData.healthId || '';
        const patientName = abhaData.name || abhaData.fullName || (abhaData.firstName ? `${abhaData.firstName} ${abhaData.lastName || ''}`.trim() : 'ABHA Patient');
        const mobile = abhaData.mobile || mobileHint || '';
        const rawGender = String(abhaData.gender || 'M').toUpperCase();
        const gender = rawGender.startsWith('F') ? 'Female' : (rawGender.startsWith('O') ? 'Other' : 'Male');
        
        let dob = null;
        if (abhaData.dob) {
            dob = new Date(abhaData.dob);
        } else if (abhaData.yearOfBirth) {
            dob = new Date(`${abhaData.yearOfBirth}-01-01`);
        } else if (abhaData.dayOfBirth && abhaData.monthOfBirth && abhaData.yearOfBirth) {
            dob = new Date(`${abhaData.yearOfBirth}-${String(abhaData.monthOfBirth).padStart(2, '0')}-${String(abhaData.dayOfBirth).padStart(2, '0')}`);
        }
        if (!dob || isNaN(dob.getTime())) {
            dob = new Date('1990-01-01');
        }

        const address = abhaData.address || 'Not specified';
        const abdmPatientId = abhaAddress || abhaNumber;
        const authMethods = Array.isArray(abhaData.authMethods) ? abhaData.authMethods : [];

        // Match existing patient by abhaNumber, abhaAddress, or mobile
        let patient = null;
        const hospitalId = req?.user?.hospitalId || req?.hospital?._id || null;
        const matchCriteria = [];
        if (abhaNumber) matchCriteria.push({ abhaNumber });
        if (abhaAddress) matchCriteria.push({ abhaAddress });
        if (mobile && mobile.length >= 10) matchCriteria.push({ mobile: { $regex: `${mobile.slice(-10)}$` } });

        if (matchCriteria.length > 0) {
            const query = { $or: matchCriteria };
            if (hospitalId) query.hospitalId = hospitalId;
            patient = await Patient.findOne(query);
        }

        if (patient) {
            // Update existing patient with ABHA identity
            if (abhaNumber) patient.abhaNumber = abhaNumber;
            if (abhaAddress) patient.abhaAddress = abhaAddress;
            if (abdmPatientId) patient.abdmPatientId = abdmPatientId;
            if (patientName && (!patient.patientName || patient.patientName === 'Not specified')) patient.patientName = patientName;
            if (mobile && (!patient.mobile || patient.mobile.length < 10)) patient.mobile = mobile;
            patient.abhaStatus = 'ACTIVE';
            patient.abhaVerificationStatus = 'VERIFIED';
            patient.abhaEnrolledAt = new Date();
            if (authMethods.length > 0) patient.abhaAuthMethods = authMethods;
            await patient.save();
            console.log(`✅ Linked existing Medora Patient [${patient.uhid}] with ABHA [${abhaNumber || abhaAddress}]`);
            return patient;
        } else {
            // Create new patient record
            let resolvedHospitalId = hospitalId;
            if (!resolvedHospitalId) {
                const defaultHosp = await Hospital.findOne({ isActive: true }).select('_id');
                resolvedHospitalId = defaultHosp?._id || null;
            }

            const uhid = await generateUhid();
            patient = new Patient({
                hospitalId: resolvedHospitalId,
                uhid,
                patientName,
                mobile: mobile || '0000000000',
                address,
                dob,
                gender,
                abhaNumber: abhaNumber || undefined,
                abhaAddress: abhaAddress || undefined,
                abdmPatientId: abdmPatientId || undefined,
                abhaStatus: 'ACTIVE',
                abhaVerificationStatus: 'VERIFIED',
                abhaEnrolledAt: new Date(),
                abhaAuthMethods: authMethods
            });

            await patient.save();
            console.log(`✅ Created new Medora Patient [${patient.uhid}] with ABHA [${abhaNumber || abhaAddress}]`);
            return patient;
        }
    } catch (err) {
        console.error("❌ Error saving patient ABHA mapping:", err.message);
        return null;
    }
};

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

        // Persist/link ABHA details with Medora Patient in MongoDB
        const abhaData = response?.data || response?.ABHAProfile || response;
        const savedPatient = await saveOrUpdatePatientWithAbha(abhaData, mobile, req);

        res.status(200).json({
            success: true,
            data: response,
            patient: savedPatient ? {
                _id: savedPatient._id,
                uhid: savedPatient.uhid,
                patientName: savedPatient.patientName,
                mobile: savedPatient.mobile,
                gender: savedPatient.gender,
                abhaNumber: savedPatient.abhaNumber,
                abhaAddress: savedPatient.abhaAddress
            } : null
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

        const abhaData = response?.data || response;
        const savedPatient = await saveOrUpdatePatientWithAbha(abhaData, null, req);

        res.status(200).json({
            success: true,
            data: response.data || response,
            xtoken: xtoken || null,
            patient: savedPatient ? {
                _id: savedPatient._id,
                uhid: savedPatient.uhid,
                patientName: savedPatient.patientName,
                mobile: savedPatient.mobile,
                gender: savedPatient.gender,
                abhaNumber: savedPatient.abhaNumber,
                abhaAddress: savedPatient.abhaAddress
            } : null
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
        // Safe debug logging - no secrets
        console.log("========== SEARCH ABHA CONTROLLER DEBUG ==========");
        console.log("Received mobile:", mobile);
        console.log("Mobile length:", String(mobile).length);
        console.log("Calling accountService.searchAbha...");
        console.log("==================================================");
        const response = await accountService.searchAbha(mobile);
        
        // Normalize ABDM response structure
        // ABDM returns: [{ txnId, ABHA: [{ ABHANumber, name, ... }] }]
        // We extract the ABHA array and return it cleanly
        let normalizedResults = [];
        let txnId = null;
        
        if (Array.isArray(response) && response.length > 0) {
          txnId = response[0].txnId;
          const abhaData = response[0].ABHA;
          if (Array.isArray(abhaData)) {
            normalizedResults = abhaData;
          } else if (abhaData) {
            normalizedResults = [abhaData];
          }
        }
        
        console.log("========== SEARCH ABHA NORMALIZED RESPONSE ==========");
        console.log("txnId:", txnId);
        console.log("Results count:", normalizedResults.length);
        if (normalizedResults.length > 0) {
          console.log("First result:", JSON.stringify(normalizedResults[0], null, 2));
        }
        console.log("==================================================");
        
        res.status(200).json({
            success: true,
            txnId: txnId,
            results: normalizedResults
        });
    } catch (error) {
        console.error("========== SEARCH ABHA ERROR DEBUG ==========");
        console.error("Status:", error.response?.status);
        console.error("Error data:", JSON.stringify(error.response?.data));
        console.error("==============================================");
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
        console.error("========== REQUEST DEACTIVATE OTP ERROR ==========");
        console.error("HTTP Status:", error.response?.status);
        console.error("Request Payload:", JSON.stringify(req.body, null, 2));
        console.error("ABDM Response:", JSON.stringify(error.response?.data, null, 2));
        console.error("==================================================");
        
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

// ======================================
// Request Reactivate OTP
// ======================================
exports.requestReactivateOtp = async (req, res) => {
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

        const response = await profileService.requestReactivateOtp(userToken, abhaNumber);

        return res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error("Request Reactivate OTP error:", error.response?.status || error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
};

// ======================================
// Verify Reactivate OTP
// ======================================
exports.verifyReactivateOtp = async (req, res) => {
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

        const response = await profileService.verifyReactivateOtp(userToken, {
            txnId,
            otp
        });

        return res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error("Verify Reactivate OTP error:", error.response?.status || error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
};

// ======================================
// Request Delete OTP
// ======================================
exports.requestDeleteOtp = async (req, res) => {
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

        const response = await profileService.requestDeleteOtp(userToken, abhaNumber);

        return res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error("Request Delete OTP error:", error.response?.status || error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
};

// ======================================
// Verify Delete OTP
// ======================================
exports.verifyDeleteOtp = async (req, res) => {
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

        const response = await profileService.verifyDeleteOtp(userToken, {
            txnId,
            otp,
            reason
        });

        return res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error("Verify Delete OTP error:", error.response?.status || error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
};

// ======================================
// Get ABHA Address Suggestions
// ======================================
exports.getAbhaAddressSuggestions = async (req, res) => {
    try {
        const response = await accountService.getAbhaAddressSuggestions();

        return res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error("========== GET ABHA ADDRESS SUGGESTIONS ERROR ==========");
        console.error("HTTP Status:", error.response?.status);
        console.error("ABDM Response:", JSON.stringify(error.response?.data, null, 2));
        console.error("========================================================");
        
        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
};

// ======================================
// Create ABHA Address
// ======================================
exports.createAbhaAddress = async (req, res) => {
    try {
        const { txnId, abhaAddress, preferred } = req.body || {};

        if (!txnId) {
            return res.status(400).json({
                success: false,
                message: "Transaction ID is required."
            });
        }

        if (!abhaAddress) {
            return res.status(400).json({
                success: false,
                message: "ABHA Address is required."
            });
        }

        if (preferred === undefined || preferred === null) {
            return res.status(400).json({
                success: false,
                message: "Preferred flag is required."
            });
        }

        const response = await accountService.createAbhaAddress(txnId, abhaAddress, preferred);

        // Update Patient record with the newly configured ABHA address if matching by abhaNumber or mobile
        if (abhaAddress) {
            const abhaNumber = response?.ABHANumber || response?.abhaNumber || response?.healthIdNumber;
            if (abhaNumber) {
                await Patient.updateOne(
                    { abhaNumber },
                    { $set: { abhaAddress: String(abhaAddress).trim() } }
                );
            }
        }

        return res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error("========== CREATE ABHA ADDRESS ERROR ==========");
        console.error("HTTP Status:", error.response?.status);
        console.error("Request Body:", JSON.stringify(req.body, null, 2));
        console.error("ABDM Response:", JSON.stringify(error.response?.data, null, 2));
        console.error("================================================");
        
        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
};
