const express = require('express');
const router = express.Router();
const {
  createPatient,
  getPatients,
  getPatientById,
  getPatientByAadhaar,
  lookupPatient,
  getPatientVisits,
  deletePatient,
  getBookedSlots,
  getPatientWithPrescription,
  updatePatientDiscount,
  updatePatient,
  updateFollowUpDate,
  getFollowUpPatients,
  getPatientAbdmCareContexts,
  triggerPatientAbdmLink
} = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, createPatient);
router.get('/', authMiddleware, getPatients);
router.get('/booked-slots', authMiddleware, getBookedSlots);
router.get('/lookup', authMiddleware, lookupPatient);
router.get('/aadhaar/:aadhaar', authMiddleware, getPatientByAadhaar);
router.get('/registrations/list', authMiddleware, require('../controllers/patientController').getRegistrations);
router.get('/registrations/history/:uhid', authMiddleware, require('../controllers/patientController').getVisitHistory);
router.get('/registrations/follow-ups', authMiddleware, getFollowUpPatients);
router.put('/registrations/:id/follow-up', authMiddleware, updateFollowUpDate);
router.get('/:id/visits', authMiddleware, getPatientVisits);
router.get('/:id/with-prescription', authMiddleware, getPatientWithPrescription);
router.get('/:id/abdm-care-contexts', authMiddleware, getPatientAbdmCareContexts);
router.post('/:id/abdm-link', authMiddleware, triggerPatientAbdmLink);
router.put('/:id/discount', authMiddleware, updatePatientDiscount);
router.put('/:id', authMiddleware, updatePatient);
router.get('/:id', authMiddleware, getPatientById);
router.delete('/:id', authMiddleware, deletePatient);

module.exports = router;
