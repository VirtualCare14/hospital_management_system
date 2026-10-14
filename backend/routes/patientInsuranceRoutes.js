const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createPatientInsurance,
  getPatientInsurances,
  getPatientInsuranceById,
  updatePatientInsurance,
  togglePatientInsuranceStatus,
  deletePatientInsurance
} = require('../controllers/patientInsuranceController');

// Role guards for patient insurance management
const canManagePatientInsurance = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (['admin', 'tpa', 'reception', 'billing', 'ipd', 'superadmin'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Reception, TPA Desk, or Admin permission required.' });
  }
};

const adminOnly = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (['admin', 'superadmin'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin permission required.' });
  }
};

// ====================================================================
//                    PATIENT INSURANCE ROUTES
// ====================================================================

// 1. Create Patient Insurance
router.post('/', authMiddleware, canManagePatientInsurance, createPatientInsurance);

// 2. List Patient Insurances (with search, filter, pagination)
router.get('/', authMiddleware, getPatientInsurances);

// 3. Get Single Patient Insurance by ID
router.get('/:id', authMiddleware, getPatientInsuranceById);

// 4. Update Patient Insurance
router.put('/:id', authMiddleware, canManagePatientInsurance, updatePatientInsurance);

// 5. Activate / Deactivate Patient Insurance Policy
router.patch('/:id/status', authMiddleware, canManagePatientInsurance, togglePatientInsuranceStatus);

// 6. Delete Patient Insurance Policy (Admin only, safeguarded against pre-auth references)
router.delete('/:id', authMiddleware, adminOnly, deletePatientInsurance);

module.exports = router;
