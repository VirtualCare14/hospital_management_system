const express = require('express');
const router = express.Router();
const {
  admitPatient,
  getAdmissions,
  dischargePatient,
  allocateBed,
  changeBed
} = require('../controllers/ipdController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/admit', authMiddleware, admitPatient);
router.get('/admissions', authMiddleware, getAdmissions);
router.post('/admissions/:id/discharge', authMiddleware, dischargePatient);
router.put('/admissions/:id/allocate-bed', authMiddleware, allocateBed);
router.put('/admissions/:id/change-bed', authMiddleware, changeBed);

module.exports = router;
