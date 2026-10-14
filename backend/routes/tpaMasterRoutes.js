const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  // Insurance Company Controllers
  getInsuranceCompanies,
  getActiveInsuranceCompanies,
  getInsuranceCompanyById,
  createInsuranceCompany,
  updateInsuranceCompany,
  toggleInsuranceCompanyStatus,
  deleteInsuranceCompany,

  // TPA Master Controllers
  getTpas,
  getActiveTpas,
  getTpaById,
  createTpa,
  updateTpa,
  toggleTpaStatus,
  deleteTpa
} = require('../controllers/tpaMasterController');

// Role guards following Medora360 permissions structure
const adminOrTpaOnly = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (role === 'admin' || role === 'tpa' || role === 'billing') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin or TPA desk permission required' });
  }
};

const adminOnly = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin permission required' });
  }
};

// ====================================================================
//                    INSURANCE COMPANY MASTER ROUTES
// ====================================================================

// List with search, filter, pagination (Accessible to all authenticated staff for viewing)
router.get('/insurance-companies', authMiddleware, getInsuranceCompanies);

// Lightweight active list for dropdown selectors (Patient registration, IPD, Billing)
router.get('/insurance-companies/active', authMiddleware, getActiveInsuranceCompanies);

// Get single company by ID
router.get('/insurance-companies/:id', authMiddleware, getInsuranceCompanyById);

// Create new insurance company (Admin / TPA / Billing desk)
router.post('/insurance-companies', authMiddleware, adminOrTpaOnly, createInsuranceCompany);

// Update insurance company (Admin / TPA / Billing desk)
router.put('/insurance-companies/:id', authMiddleware, adminOrTpaOnly, updateInsuranceCompany);

// Toggle active/inactive status
router.patch('/insurance-companies/:id/status', authMiddleware, adminOrTpaOnly, toggleInsuranceCompanyStatus);

// Delete insurance company (Admin only, verifies no linked TPAs)
router.delete('/insurance-companies/:id', authMiddleware, adminOnly, deleteInsuranceCompany);

// ====================================================================
//                       TPA PROVIDER MASTER ROUTES
// ====================================================================

// List TPAs with populated associated insurers (Accessible to all authenticated staff)
router.get('/providers', authMiddleware, getTpas);

// Lightweight active list for dropdown selectors
router.get('/providers/active', authMiddleware, getActiveTpas);

// Get single TPA by ID
router.get('/providers/:id', authMiddleware, getTpaById);

// Create new TPA provider (Admin / TPA / Billing desk)
router.post('/providers', authMiddleware, adminOrTpaOnly, createTpa);

// Update TPA provider (Admin / TPA / Billing desk)
router.put('/providers/:id', authMiddleware, adminOrTpaOnly, updateTpa);

// Toggle active/inactive status
router.patch('/providers/:id/status', authMiddleware, adminOrTpaOnly, toggleTpaStatus);

// Delete TPA provider (Admin only)
router.delete('/providers/:id', authMiddleware, adminOnly, deleteTpa);

module.exports = router;
