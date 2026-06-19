const express = require('express');
const router = express.Router();
const {
  generateBillItems, createBill, updateBill,
  getPatientBills, getBillById, getAllBills,
  searchPatient, getEligiblePatients,
  createAdvance, getPatientAdvances, cancelBill, getDashboardStats,
  getDiscountRequests, approveDiscountRequest, rejectDiscountRequest
} = require('../controllers/billingController');
const authMiddleware = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.();
  if (role === 'admin') {
    return next();
  }
  console.log('[DEBUG-BILLING] Admin access denied. req.user:', req.user);
  return res.status(403).json({ message: 'Access denied: admin permission required' });
};

router.get('/billing/dashboard-stats', authMiddleware, getDashboardStats);
router.get('/billing/eligible-patients', authMiddleware, getEligiblePatients);
router.get('/billing/search/:query', authMiddleware, searchPatient);
router.get('/billing/generate/:uhid', authMiddleware, generateBillItems);
router.get('/billing/patient/:uhid', authMiddleware, getPatientBills);
router.get('/billing/advance/:uhid', authMiddleware, getPatientAdvances);
router.post('/billing/advance', authMiddleware, createAdvance);
router.get('/billing/discount-requests', authMiddleware, adminOnly, getDiscountRequests);
router.put('/billing/discount-requests/:id/approve', authMiddleware, adminOnly, approveDiscountRequest);
router.put('/billing/discount-requests/:id/reject', authMiddleware, adminOnly, rejectDiscountRequest);
router.get('/billing', authMiddleware, getAllBills);
router.post('/billing', authMiddleware, createBill);
router.put('/billing/cancel/:id', authMiddleware, adminOnly, cancelBill);
router.put('/billing/:id', authMiddleware, adminOnly, updateBill);
router.get('/billing/:id', authMiddleware, getBillById);

module.exports = router;
