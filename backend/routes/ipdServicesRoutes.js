const express = require('express');
const router = express.Router();
const {
  getIpdPatientList,
  getIpdPatientDetails,
  addConsumable,
  getConsumables,
  deleteConsumable,
  addMedicine,
  getMedicines,
  deleteMedicine,
  addLabTest,
  getLabTests,
  deleteLabTest,
  getTimeline,
  getPatientDashboard,
  getBillingSummary
} = require('../controllers/ipdServicesController');
const authMiddleware = require('../middleware/authMiddleware');

// Patient list & details
router.get('/patients', authMiddleware, getIpdPatientList);
router.get('/patients/:id', authMiddleware, getIpdPatientDetails);

// Consumable services
router.post('/services/consumables', authMiddleware, addConsumable);
router.get('/services/consumables/:admissionId', authMiddleware, getConsumables);
router.delete('/services/consumables/:id', authMiddleware, deleteConsumable);

// Medicines
router.post('/services/medicines', authMiddleware, addMedicine);
router.get('/services/medicines/:admissionId', authMiddleware, getMedicines);
router.delete('/services/medicines/:id', authMiddleware, deleteMedicine);

// Lab Tests
router.post('/services/lab-tests', authMiddleware, addLabTest);
router.get('/services/lab-tests/:admissionId', authMiddleware, getLabTests);
router.delete('/services/lab-tests/:id', authMiddleware, deleteLabTest);

// Timeline
router.get('/services/timeline/:admissionId', authMiddleware, getTimeline);

// Dashboard
router.get('/services/dashboard/:admissionId', authMiddleware, getPatientDashboard);

// Billing
router.get('/services/billing/:admissionId', authMiddleware, getBillingSummary);

module.exports = router;