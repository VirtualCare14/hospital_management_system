const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createPreAuthorization,
  getPreAuthorizations,
  getPreAuthorizationById,
  updateDraftPreAuthorization,
  submitPreAuthorization,
  addTpaQuery,
  respondToTpaQuery,
  approveInitialPreAuthorization,
  requestEnhancement,
  approveEnhancement,
  rejectPreAuthorization,
  finalAuthorizePreAuthorization,
  settlePreAuthorization,
  cancelPreAuthorization
} = require('../controllers/preAuthorizationController');

// Role guards following Medora360 permissions structure
const canCreatePreAuth = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (['admin', 'tpa', 'billing', 'ipd', 'superadmin'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: TPA Desk, Billing, IPD, or Admin permission required.' });
  }
};

const adminOrTpaOnly = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (['admin', 'tpa', 'superadmin'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: TPA Desk or Admin permission required.' });
  }
};

const canSettlePreAuth = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (['admin', 'tpa', 'billing', 'superadmin'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: TPA Desk, Billing, or Admin permission required.' });
  }
};

// ====================================================================
//                    PRE-AUTHORIZATION ROUTES
// ====================================================================

// 1. Create Pre-Authorization (Draft status)
router.post('/', authMiddleware, canCreatePreAuth, createPreAuthorization);

// 2. List Pre-Authorizations (with filters, search, pagination)
router.get('/', authMiddleware, getPreAuthorizations);

// 3. Get Single Pre-Authorization by ID
router.get('/:id', authMiddleware, getPreAuthorizationById);

// 4. Update Draft Pre-Authorization
router.put('/:id', authMiddleware, adminOrTpaOnly, updateDraftPreAuthorization);

// 5. Submit Pre-Authorization to TPA
router.patch('/:id/submit', authMiddleware, adminOrTpaOnly, submitPreAuthorization);

// 6. Add TPA Query
router.post('/:id/query', authMiddleware, adminOrTpaOnly, addTpaQuery);

// 7. Respond to TPA Query
router.patch('/:id/query/:queryId/respond', authMiddleware, adminOrTpaOnly, respondToTpaQuery);

// 8. Approve Initial Pre-Authorization
router.patch('/:id/approve', authMiddleware, adminOrTpaOnly, approveInitialPreAuthorization);

// 9. Request Enhancement
router.post('/:id/enhancement', authMiddleware, adminOrTpaOnly, requestEnhancement);

// 10. Approve Enhancement
router.patch('/:id/enhancement/:enhancementId/approve', authMiddleware, adminOrTpaOnly, approveEnhancement);

// 11. Reject Pre-Authorization
router.patch('/:id/reject', authMiddleware, adminOrTpaOnly, rejectPreAuthorization);

// 12. Final Authorization at Discharge
router.patch('/:id/final-authorize', authMiddleware, adminOrTpaOnly, finalAuthorizePreAuthorization);

// 13. Mark Claim Settled
router.patch('/:id/settle', authMiddleware, canSettlePreAuth, settlePreAuthorization);

// 14. Cancel Pre-Authorization
router.patch('/:id/cancel', authMiddleware, adminOrTpaOnly, cancelPreAuthorization);

module.exports = router;
