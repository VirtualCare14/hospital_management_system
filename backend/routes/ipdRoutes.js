const express = require('express');
const router = express.Router();
const {
  admitPatient,
  getAdmissions,
  dischargePatient
} = require('../controllers/ipdController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/admit', authMiddleware, admitPatient);
router.get('/admissions', authMiddleware, getAdmissions);
router.post('/admissions/:id/discharge', authMiddleware, dischargePatient);

module.exports = router;
