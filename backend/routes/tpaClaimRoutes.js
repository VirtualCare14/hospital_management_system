const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createClaim,
  getClaims,
  getClaimById,
  updateDraftClaim,
  markDocumentsPending,
  markReadyForSubmission,
  submitClaim,
  addClaimQuery,
  respondToClaimQuery,
  approveClaim,
  rejectClaim,
  cancelClaim,
  partiallySettleClaim,
  settleClaim,
  uploadClaimDocument,
  addClaimDocument,
  deleteClaimDocument
} = require('../controllers/tpaClaimController');

// Role guards following Medora360 permission matrices
const canViewClaims = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (['admin', 'superadmin', 'tpa', 'billing', 'reception', 'ipd', 'doctor', 'nursing'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Insufficient permissions to view claims.' });
  }
};

const canCreateOrUpdateDraft = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (['admin', 'superadmin', 'tpa', 'billing'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin, TPA Desk, or Billing permission required.' });
  }
};

const adminOrTpaOnly = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (['admin', 'superadmin', 'tpa'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin or TPA Desk permission required.' });
  }
};

const canSettleClaims = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (['admin', 'superadmin', 'tpa', 'billing'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin, TPA Desk, or Billing permission required for settlements.' });
  }
};

const canManageDocuments = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (['admin', 'superadmin', 'tpa', 'billing'].includes(role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin, TPA Desk, or Billing permission required to manage claim documents.' });
  }
};

// ====================================================================
//                    TPA CLAIM ROUTES
// ====================================================================

// --- CRUD ---
// 1. Create a new TPA Claim (Draft status)
router.post('/', authMiddleware, canCreateOrUpdateDraft, createClaim);

// 2. List TPA Claims (with filters, search, pagination)
router.get('/', authMiddleware, canViewClaims, getClaims);

// 3. Get single TPA Claim by ID
router.get('/:id', authMiddleware, canViewClaims, getClaimById);

// 4. Update editable Claim fields (Draft / Documents Pending only)
router.put('/:id', authMiddleware, canCreateOrUpdateDraft, updateDraftClaim);

// --- WORKFLOW ---
// 5. Mark claim as Documents Pending (from Draft)
router.patch('/:id/documents-pending', authMiddleware, canCreateOrUpdateDraft, markDocumentsPending);

// 6. Mark claim as Ready for Submission (from Draft or Documents Pending)
router.patch('/:id/ready-for-submission', authMiddleware, adminOrTpaOnly, markReadyForSubmission);

// 7. Submit claim to TPA (from Ready for Submission)
router.patch('/:id/submit', authMiddleware, adminOrTpaOnly, submitClaim);

// 8. Log a TPA Query (from Submitted or Approved -> Under Query)
router.post('/:id/query', authMiddleware, adminOrTpaOnly, addClaimQuery);

// 9. Respond to an open TPA Query (Under Query -> Query Responded)
router.patch('/:id/query/:queryId/respond', authMiddleware, adminOrTpaOnly, respondToClaimQuery);

// 10. Approve / Sanction TPA Claim (Submitted / Query Responded -> Approved)
router.patch('/:id/approve', authMiddleware, adminOrTpaOnly, approveClaim);

// 11. Reject TPA Claim (Terminal state)
router.patch('/:id/reject', authMiddleware, adminOrTpaOnly, rejectClaim);

// 12. Cancel TPA Claim (Non-terminal states -> Cancelled)
router.patch('/:id/cancel', authMiddleware, adminOrTpaOnly, cancelClaim);

// --- SETTLEMENT ---
// 13. Partial Settlement (Approved / Partially Settled -> Partially Settled)
router.patch('/:id/partially-settle', authMiddleware, canSettleClaims, partiallySettleClaim);

// 14. Final Settlement (Approved / Partially Settled -> Settled)
router.patch('/:id/settle', authMiddleware, canSettleClaims, settleClaim);

// --- DOCUMENT ATTACHMENTS & METADATA ---
// 15. Upload Document file to Cloudinary & attach metadata
router.post('/:id/documents/upload', authMiddleware, canManageDocuments, uploadClaimDocument);

// 16. Add Document Metadata only
router.post('/:id/documents', authMiddleware, canManageDocuments, addClaimDocument);

// 17. Remove Document from claim & delete Cloudinary asset
router.delete('/:id/documents/:documentId', authMiddleware, canManageDocuments, deleteClaimDocument);

module.exports = router;
