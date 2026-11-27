const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings
} = require('../controllers/ipdSettingsController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to restrict route to administrators, IPD admins, and Billing users
const adminIpdOrBillingOnly = (req, res, next) => {
  const hasBillingAccess = req.user?.role === 'billing' || (Array.isArray(req.user?.moduleAccess) && req.user.moduleAccess.includes(8));
  if (req.user && (req.user.role === 'admin' || req.user.role === 'ipd' || hasBillingAccess)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: admin, IPD, or billing permission required' });
  }
};

router.get('/', authMiddleware, getSettings);
router.put('/', authMiddleware, adminIpdOrBillingOnly, updateSettings);

module.exports = router;
