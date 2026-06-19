const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_hms_jwt_key_2026');
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found, authentication failed' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled. Please contact the administrator.' });
    }

    if (user.hospitalId) {
      const hospital = await Hospital.findById(user.hospitalId).select('name isActive');
      if (!hospital || !hospital.isActive) {
        user.currentSessionId = null;
        await user.save();
        return res.status(403).json({ message: 'Hospital account is disabled. Please contact super admin.' });
      }
      req.hospital = hospital;
    }

    // Single-device login session validation
    if (user.currentSessionId !== decoded.sessionId) {
      return res.status(401).json({ message: 'Session expired. Logged in from another device.' });
    }

    req.user = user;
    req.user.role = req.user.role?.toLowerCase?.();
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = authMiddleware;
