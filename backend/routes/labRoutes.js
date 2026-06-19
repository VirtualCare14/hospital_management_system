const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getDashboard,
  getLabRequests,
  updateLabRequest,
  listTests,
  listTestCategories,
  saveTestCategory,
  saveTest,
  deleteTest,
  listProfiles,
  saveProfile,
  deleteProfile,
  listSignatories,
  saveSignatory,
  deleteSignatory,
  listAssistants,
  saveAssistant,
  deleteAssistant,
  saveReportDraft,
  generateReport,
  deliverReport,
  unlockReport,
  getPatientHistory,
  collectReport,
  createDirectLabRequest,
  getRecommendedTests,
  getBills,
  receivePayment,
  uploadCloudinaryImage,
  deleteCloudinaryImage,
  getDiagnosisTemplateForTest,
  saveDiagnosisTemplateForTest
} = require('../controllers/labController');

router.get('/dashboard', authMiddleware, getDashboard);

router.get('/requests', authMiddleware, getLabRequests);
router.post('/requests/direct', authMiddleware, createDirectLabRequest);
router.get('/patients/:patientId/recommended-tests', authMiddleware, getRecommendedTests);
router.put('/requests/:id', authMiddleware, updateLabRequest);

router.get('/bills', authMiddleware, getBills);
router.post('/bills/:id/payments', authMiddleware, receivePayment);

router.post('/requests/:id/report-draft', authMiddleware, saveReportDraft);
router.post('/requests/:id/report-generate', authMiddleware, generateReport);
router.post('/requests/:id/report-deliver', authMiddleware, deliverReport);
router.post('/requests/:id/report-unlock', authMiddleware, unlockReport);
router.post('/requests/:id/report-collect', authMiddleware, collectReport);
router.get('/history', authMiddleware, getPatientHistory);

router.post('/upload-image', authMiddleware, uploadCloudinaryImage);
router.post('/delete-image', authMiddleware, deleteCloudinaryImage);

router.get('/diagnosis-templates/test/:testId', authMiddleware, getDiagnosisTemplateForTest);
router.post('/diagnosis-templates/test/:testId', authMiddleware, saveDiagnosisTemplateForTest);

router.get('/tests', authMiddleware, listTests);
router.get('/test-categories', authMiddleware, listTestCategories);
router.post('/test-categories', authMiddleware, saveTestCategory);
router.post('/tests', authMiddleware, saveTest);
router.put('/tests/:id', authMiddleware, saveTest);
router.delete('/tests/:id', authMiddleware, deleteTest);

router.get('/profiles', authMiddleware, listProfiles);
router.post('/profiles', authMiddleware, saveProfile);
router.put('/profiles/:id', authMiddleware, saveProfile);
router.delete('/profiles/:id', authMiddleware, deleteProfile);

router.get('/signatories', authMiddleware, listSignatories);
router.post('/signatories', authMiddleware, saveSignatory);
router.put('/signatories/:id', authMiddleware, saveSignatory);
router.delete('/signatories/:id', authMiddleware, deleteSignatory);

router.get('/assistants', authMiddleware, listAssistants);
router.post('/assistants', authMiddleware, saveAssistant);
router.put('/assistants/:id', authMiddleware, saveAssistant);
router.delete('/assistants/:id', authMiddleware, deleteAssistant);

module.exports = router;
