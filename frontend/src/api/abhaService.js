import client from './client';

// ======================================
// Enrollment (Create ABHA via Aadhaar)
// ======================================
export const requestAadhaarOtp = (aadhaar) =>
  client.post('/abha/request-otp', { aadhaar });

export const verifyAadhaarOtp = (txnId, otp, mobile) =>
  client.post('/abha/verify-otp', { txnId, otp, mobile });

// ======================================
// Login
// ======================================
export const requestLoginOtp = (aadhaar) =>
  client.post('/abha/login/request-otp', { aadhaar });

export const verifyLoginOtp = (txnId, otp) =>
  client.post('/abha/login/verify', { txnId, otp });

// ======================================
// Search ABHA
// ======================================
export const searchAbha = (mobile) =>
  client.post('/abha/search', { mobile });

// ======================================
// Profile (sends ABHA X-token via x-abha-token header)
// ======================================
export const getAbhaProfile = (xtoken) =>
  client.get('/abha/profile', {
    headers: { 'x-abha-token': xtoken }
  });

// ======================================
// QR Code (returns binary/image)
// ======================================
export const getAbhaQrCode = (xtoken) =>
  client.get('/abha/qr-code', {
    headers: { 'x-abha-token': xtoken },
    responseType: 'arraybuffer'
  });

// ======================================
// ABHA Card (returns binary)
// ======================================
export const getAbhaCard = (xtoken) =>
  client.get('/abha/card', {
    headers: { 'x-abha-token': xtoken },
    responseType: 'arraybuffer'
  });

// ======================================
// Update Mobile
// ======================================
export const requestMobileOtp = (xtoken, mobile) =>
  client.post('/abha/mobile/request-otp', { mobile }, {
    headers: { 'x-abha-token': xtoken }
  });

export const verifyMobileOtp = (xtoken, txnId, otp) =>
  client.post('/abha/mobile/verify', { txnId, otp }, {
    headers: { 'x-abha-token': xtoken }
  });

// ======================================
// Update Email
// ======================================
export const requestEmailVerification = (xtoken, email) =>
  client.post('/abha/email/request-verification', { email }, {
    headers: { 'x-abha-token': xtoken }
  });

export const verifyEmail = (xtoken, txnId, otp, email) =>
  client.post('/abha/email/verify', { txnId, otp, email }, {
    headers: { 'x-abha-token': xtoken }
  });

// ======================================
// Deactivate ABHA
// ======================================
export const requestDeactivateOtp = (xtoken, abhaNumber) =>
  client.post('/abha/deactivate/request-otp', { abhaNumber }, {
    headers: { 'x-abha-token': xtoken }
  });

export const verifyDeactivateOtp = (xtoken, txnId, otp, reason) =>
  client.post('/abha/deactivate/verify', { txnId, otp, reason }, {
    headers: { 'x-abha-token': xtoken }
  });