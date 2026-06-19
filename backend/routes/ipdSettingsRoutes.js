const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings
} = require('../controllers/ipdSettingsController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to restrict route to administrators and IPD admins
const adminOrIpdOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'ipd')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: admin or IPD permission required' });
  }
};

router.get('/', authMiddleware, getSettings);
router.put('/', authMiddleware, adminOrIpdOnly, updateSettings);

module.exports = router;
