const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[AuthMiddleware Warning] Missing or invalid Authorization header on ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_hms_jwt_key_2026');
    } catch (jwtErr) {
      console.warn(`[AuthMiddleware Warning] JWT verification failed on ${req.method} ${req.originalUrl}:`, jwtErr.message);
      return res.status(401).json({ message: 'Token is invalid or expired' });
    }
    
    const user = await User.findById(decoded.id);
    if (!user) {
      console.warn(`[AuthMiddleware Warning] User ${decoded.id} not found on ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'User not found, authentication failed' });
    }

    if (!user.isActive) {
      console.warn(`[AuthMiddleware Warning] User account is disabled for ${user.username}`);
      return res.status(403).json({ message: 'Account is disabled. Please contact the administrator.' });
    }

    if (user.hospitalId) {
      const hospital = await Hospital.findById(user.hospitalId).select('name isActive');
      if (!hospital || !hospital.isActive) {
        user.currentSessionId = null;
        await user.save();
        console.warn(`[AuthMiddleware Warning] Hospital disabled or not found for user ${user.username}`);
        return res.status(403).json({ message: 'Hospital account is disabled. Please contact super admin.' });
      }
      req.hospital = hospital;
    }

    // Single-device login session validation
    if (user.currentSessionId !== decoded.sessionId) {
      console.warn(`[AuthMiddleware Warning] Session mismatch on ${req.method} ${req.originalUrl} for user ${user.username}. DB: ${user.currentSessionId}, Token: ${decoded.sessionId}`);
      return res.status(401).json({ message: 'Session expired. Logged in from another device.' });
    }

    req.user = user;
    req.user.role = req.user.role?.toLowerCase?.();
    req.token = token;
    next();
  } catch (error) {
    console.error('[AuthMiddleware Error] Unexpected error:', error);
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = authMiddleware;
