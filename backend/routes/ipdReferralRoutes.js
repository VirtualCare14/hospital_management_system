const express = require('express');
const router = express.Router();
const {
  createReferral,
  getReferrals,
  getReferralById,
  updateReferral,
  cancelReferral
} = require('../controllers/ipdReferralController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/referrals', authMiddleware, createReferral);
router.get('/referrals', authMiddleware, getReferrals);
router.get('/referrals/:id', authMiddleware, getReferralById);
router.put('/referrals/:id', authMiddleware, updateReferral);
router.delete('/referrals/:id', authMiddleware, cancelReferral);

module.exports = router;