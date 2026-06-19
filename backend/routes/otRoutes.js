const express = require('express');
const router = express.Router();
const {
  createOtRecord,
  updateOtRecord,
  getOtRecordsByAdmission,
  getOtRecordsByPatient,
  getOtRecordById,
  getOtRecordFull,
  getHospitalInfo,
  uploadOtDocument,
  deleteOtDocument,
  saveConsultationForm,
  saveConsentForm,
  updateOtCharges,
  addOtMedicines,
  addOtConsumables
} = require('../controllers/otController');
const authMiddleware = require('../middleware/authMiddleware');

// Hospital info
router.get('/ot/hospital-info', authMiddleware, getHospitalInfo);

// CRUD
router.post('/ot', authMiddleware, createOtRecord);
router.put('/ot/:id', authMiddleware, updateOtRecord);
router.put('/ot/:id/consultation', authMiddleware, saveConsultationForm);
router.put('/ot/:id/consent', authMiddleware, saveConsentForm);
router.put('/ot/:id/charges', authMiddleware, updateOtCharges);
router.post('/ot/:id/medicines', authMiddleware, addOtMedicines);
router.post('/ot/:id/consumables', authMiddleware, addOtConsumables);
router.get('/ot/:id', authMiddleware, getOtRecordById);
router.get('/ot/:id/full', authMiddleware, getOtRecordFull);

// Document management
router.post('/ot/:otRecordId/documents/upload', authMiddleware, uploadOtDocument);
router.delete('/ot/:otRecordId/documents/:docIndex', authMiddleware, deleteOtDocument);

// List by admission or patient
router.get('/ot/admission/:admissionId', authMiddleware, getOtRecordsByAdmission);
router.get('/ot/patient/:patientId', authMiddleware, getOtRecordsByPatient);

module.exports = router;