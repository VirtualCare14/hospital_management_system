const express = require('express');
const router = express.Router();
const {
  createPatient,
  getPatients,
  getPatientById,
  getPatientByAadhaar,
  getPatientVisits,
  deletePatient,
  getBookedSlots,
  getPatientWithPrescription,
  updatePatientDiscount
} = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, createPatient);
router.get('/', authMiddleware, getPatients);
router.get('/booked-slots', authMiddleware, getBookedSlots);
router.get('/aadhaar/:aadhaar', authMiddleware, getPatientByAadhaar);
router.get('/registrations/list', authMiddleware, require('../controllers/patientController').getRegistrations);
router.get('/registrations/history/:uhid', authMiddleware, require('../controllers/patientController').getVisitHistory);
router.get('/:id/visits', authMiddleware, getPatientVisits);
router.get('/:id/with-prescription', authMiddleware, getPatientWithPrescription);
router.put('/:id/discount', authMiddleware, updatePatientDiscount);
router.get('/:id', authMiddleware, getPatientById);
router.delete('/:id', authMiddleware, deletePatient);

module.exports = router;
