const express = require('express');
const router = express.Router();
const {
  createDischarge,
  completeDischarge,
  updateDischarge,
  getDischargesByAdmission,
  getDischargesByPatient,
  getDischargeById,
  checkDischargeStatus
} = require('../controllers/dischargeController');
const authMiddleware = require('../middleware/authMiddleware');

// Check discharge status
router.get('/discharge/check/:admissionId', authMiddleware, checkDischargeStatus);

// CRUD
router.post('/discharge', authMiddleware, createDischarge);
router.post('/discharge/complete', authMiddleware, completeDischarge);
router.put('/discharge/:id', authMiddleware, updateDischarge);
router.get('/discharge/:id', authMiddleware, getDischargeById);

// List by admission or patient
router.get('/discharge/admission/:admissionId', authMiddleware, getDischargesByAdmission);
router.get('/discharge/patient/:patientId', authMiddleware, getDischargesByPatient);

module.exports = router;