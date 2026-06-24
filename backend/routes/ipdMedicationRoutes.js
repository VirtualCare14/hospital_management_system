const express = require('express');
const router = express.Router();
const {
  getMedicationOrders,
  createMedicationOrder,
  updateMedicationOrder,
  stopMedicationOrder,
  getAdministrationsByAdmission,
  createAdministrationRecord,
  updateAdministrationRecord
} = require('../controllers/ipdMedicationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/medication-orders/:admissionId', authMiddleware, getMedicationOrders);
router.post('/medication-orders', authMiddleware, createMedicationOrder);
router.put('/medication-orders/:orderId', authMiddleware, updateMedicationOrder);
router.post('/medication-orders/:orderId/stop', authMiddleware, stopMedicationOrder);
router.get('/medication-administrations/:admissionId', authMiddleware, getAdministrationsByAdmission);
router.post('/medication-orders/:orderId/administer', authMiddleware, createAdministrationRecord);
router.put('/medication-administrations/:adminId', authMiddleware, updateAdministrationRecord);

module.exports = router;
