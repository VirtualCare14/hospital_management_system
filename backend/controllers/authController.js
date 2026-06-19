const User = require('../models/User');
const Hospital = require('../models/Hospital');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// @desc    Login user & generate token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password, hospitalId } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide both username and password' });
    }

    const normalizedUsername = username.toLowerCase().trim();
    const userQuery = { username: normalizedUsername };
    if (hospitalId) userQuery.hospitalId = hospitalId;
    let user = await User.findOne(userQuery).populate('hospitalId', 'name isActive');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.hospitalId && !user.hospitalId.isActive) {
      return res.status(403).json({ message: 'Hospital account is disabled. Please contact super admin.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled. Please contact the administrator.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Single-device login: generate a new unique session ID
    const sessionId = crypto.randomUUID();
    user.currentSessionId = sessionId;
    await user.save();

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
        hospitalId: user.hospitalId?._id,
        hospitalName: user.hospitalId?.name
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
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
      req.user.currentSessionId = null;
      await req.user.save();
    }
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const hospitalLookup = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: 'Hospital name is required' });
    }

    const escapedName = name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const hospital = await Hospital.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') }
    });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
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

module.exports = {
  login,
  logout,
  getPublicHospital,
  hospitalLookup
};
