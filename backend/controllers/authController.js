const User = require('../models/User');
const Hospital = require('../models/Hospital');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// @desc    Login user & generate token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const body = req.body || {};
    const { username, password, hospitalId } = body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide both username and password' });
    }

    const normalizedUsername = String(username).toLowerCase().trim();
    const userQuery = { username: normalizedUsername };
    if (hospitalId) userQuery.hospitalId = hospitalId;
    
    let user = await User.findOne(userQuery).populate('hospitalId', 'name isActive');

    // Auto-seed / create ravilab Lab Admin user if not present
    if (!user && normalizedUsername === 'ravilab' && String(password) === 'raviadmin') {
      try {
        const newLabAdmin = new User({
          username: 'ravilab',
          password: 'raviadmin',
          role: 'labadmin',
          doctorName: 'Ravi (Lab Admin)',
          moduleAccess: [1, 2, 3, 4, 5, 6, 7, 8],
          isActive: true
        });
        await newLabAdmin.save();
        user = await User.findOne({ username: 'ravilab' }).populate('hospitalId', 'name isActive');
      } catch (seedErr) {
        console.warn('Auto-create ravilab user error:', seedErr.message);
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.hospitalId && typeof user.hospitalId === 'object' && user.hospitalId.isActive === false) {
      return res.status(403).json({ message: 'Hospital account is disabled. Please contact super admin.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled. Please contact the administrator.' });
    }

    // Check password safely
    let isMatch = false;
    try {
      isMatch = await user.comparePassword(String(password));
    } catch (passErr) {
      console.error('Password comparison error:', passErr.message);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Single-device login: generate a new unique session ID
    const sessionId = (crypto && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    await User.updateOne({ _id: user._id }, { $set: { currentSessionId: sessionId } });

    // Sign token with sessionId
    const normalizedRole = user.role?.toLowerCase?.().trim?.();
    const token = jwt.sign(
      { id: user._id, username: user.username, role: normalizedRole, sessionId },
      process.env.JWT_SECRET || 'super_secret_hms_jwt_key_2026',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role?.toLowerCase?.(),
        moduleAccess: user.moduleAccess,
        doctorName: user.doctorName,
        department: user.department,
        mobile: user.mobile,
        hospitalId: user.hospitalId?._id || user.hospitalId,
        hospitalName: user.hospitalId?.name || 'Hospital'
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Public hospital info for generated hospital login links
// @route   GET /api/auth/hospital/:id
// @access  Public
const getPublicHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).select('name isActive');
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json({ id: hospital._id, name: hospital.name, isActive: hospital.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout user & clear session
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Invalidate the session ID in the database
    if (req.user) {
      await User.updateOne({ _id: req.user._id }, { $set: { currentSessionId: null } });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const getLevenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const hospitalLookup = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ message: 'Hospital unique access code is required' });
    }

    const hospital = await Hospital.findOne({
      code: code.trim().toLowerCase()
    });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital code not found in super admin records' });
    }

    res.status(200).json({
      id: hospital._id,
      name: hospital.name,
      isActive: hospital.isActive
    });
  } catch (error) {
    console.error('Hospital Lookup Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify current user session status
// @route   GET /api/auth/verify
// @access  Private
const verifySession = async (req, res) => {
  try {
    let hospitalName = 'Hospital';
    if (req.hospital && req.hospital.name) {
      hospitalName = req.hospital.name;
    } else if (req.user.hospitalId && typeof req.user.hospitalId === 'object' && req.user.hospitalId.name) {
      hospitalName = req.user.hospitalId.name;
    } else if (req.user.hospitalId) {
      const hospitalObj = await Hospital.findById(req.user.hospitalId).select('name');
      if (hospitalObj && hospitalObj.name) {
        hospitalName = hospitalObj.name;
      }
    }

    // If request gets past authMiddleware, the session is valid
    res.status(200).json({
      valid: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        role: req.user.role?.toLowerCase?.(),
        moduleAccess: req.user.moduleAccess,
        doctorName: req.user.doctorName,
        department: req.user.department,
        mobile: req.user.mobile,
        hospitalId: req.user.hospitalId?._id || req.user.hospitalId,
        hospitalName: hospitalName
      }
    });
  } catch (error) {
    console.error('Verify Session Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  logout,
  getPublicHospital,
  hospitalLookup,
  verifySession
};
