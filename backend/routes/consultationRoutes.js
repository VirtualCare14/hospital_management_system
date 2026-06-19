const express = require('express');
const router = express.Router();
const {
  createConsultation,
  updateConsultation,
  getConsultationsByPatientId,
  getSymptomsAutocomplete,
  getDoctorAppointments,
  getCompletedConsultations,
  getAllPatientConsultations,
  getCompletedConsultationDetails
} = require('../controllers/consultationController');
const { getDoctorStats } = require('../controllers/consultationController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, createConsultation);
router.put('/:id', authMiddleware, updateConsultation);
router.get('/appointments', authMiddleware, getDoctorAppointments);
router.get('/stats', authMiddleware, getDoctorStats);
router.get('/completed', authMiddleware, getCompletedConsultations);
router.get('/completed/:consultationId', authMiddleware, getCompletedConsultationDetails);
router.get('/patient/:patientId/all', authMiddleware, getAllPatientConsultations);
router.get('/symptoms/autocomplete', authMiddleware, getSymptomsAutocomplete);
router.get('/:patientId', authMiddleware, getConsultationsByPatientId);

module.exports = router;
