const express = require('express');
const router = express.Router();
const {
  getRoomUtilization,
  getAdmissionStats,
  getRevenueReport
} = require('../controllers/ipdReportsController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to restrict route to administrators and IPD admins
const adminOrIpdOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'ipd')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: admin or IPD permission required' });
  }
};

router.get('/utilization', authMiddleware, adminOrIpdOnly, getRoomUtilization);
router.get('/admission-stats', authMiddleware, adminOrIpdOnly, getAdmissionStats);
router.get('/revenue', authMiddleware, adminOrIpdOnly, getRevenueReport);

module.exports = router;
