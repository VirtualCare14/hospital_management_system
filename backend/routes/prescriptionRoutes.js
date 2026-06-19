const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getPrescriptionsByPatientId
} = require('../controllers/prescriptionController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, createPrescription);
router.get('/:patientId', authMiddleware, getPrescriptionsByPatientId);

module.exports = router;
