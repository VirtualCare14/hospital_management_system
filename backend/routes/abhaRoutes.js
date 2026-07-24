const express = require("express");

const router = express.Router();

const abhaController = require("../controllers/abhaController");

// =======================
// Health Check
// =======================
router.get("/health", abhaController.health);

// =======================
// Gateway Token
// =======================
router.get("/token", abhaController.generateToken);

// =======================
// Public Certificate
// =======================
router.get("/certificate", abhaController.getCertificate);

// =======================
// Encrypt Aadhaar (Development Only)
// =======================
router.post("/encrypt", abhaController.encryptAadhaar);

// =======================
// Request Aadhaar OTP (Enrollment)
// =======================
router.post("/request-otp", abhaController.requestOtp);

// =======================
// Verify OTP & Create ABHA
// =======================
router.post("/verify-otp", abhaController.verifyOtp);

// =======================
// Request Login OTP
// =======================
router.post("/login/request-otp", abhaController.requestLoginOtp);

// =======================
// Verify Login OTP
// =======================
router.post("/login/verify",abhaController.verifyLoginOtp);

// =======================
// Search ABHA By Mobile
// =======================
router.post("/search", abhaController.searchAbha);

// =======================
// Get Profile
// =======================
router.get("/profile", abhaController.getProfile);

// =======================
// Get QR Code
// =======================
router.get("/qr-code", abhaController.getQrCode);

// =======================
// Get ABHA Card
// =======================
router.get("/card", abhaController.getAbhaCard);

// =======================
// Request Mobile OTP
// =======================
router.post("/mobile/request-otp",abhaController.requestMobileOtp);

// =======================
// Verify Mobile OTP
// =======================
router.post("/mobile/verify",abhaController.verifyMobileOtp);

// =======================
// Request Email Verification
// =======================
router.post("/email/request-verification",abhaController.requestEmailVerification);

// =======================
// Verify Email
// =======================
router.post("/email/verify",abhaController.verifyEmail);

// =======================
// Request Deactivate OTP
// =======================
router.post("/deactivate/request-otp",abhaController.requestDeactivateOtp);

// =======================
// Verify & Deactivate ABHA
// =======================
router.post("/deactivate/verify",abhaController.verifyDeactivateOtp);

// =======================
// Request Reactivate OTP
// =======================
router.post("/reactivate/request-otp",abhaController.requestReactivateOtp);

// =======================
// Verify & Reactivate ABHA
// =======================
router.post("/reactivate/verify",abhaController.verifyReactivateOtp);

// =======================
// Request Delete OTP
// =======================
router.post("/delete/request-otp",abhaController.requestDeleteOtp);

// =======================
// Verify & Delete ABHA
// =======================
router.post("/delete/verify",abhaController.verifyDeleteOtp);

// =======================
// Get ABHA Address Suggestions
// =======================
router.get("/address/suggestions", abhaController.getAbhaAddressSuggestions);

// =======================
// Create ABHA Address
// =======================
router.post("/address", abhaController.createAbhaAddress);

module.exports = router;
