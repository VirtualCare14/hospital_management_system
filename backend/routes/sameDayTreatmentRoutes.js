const express = require('express');
const router = express.Router();
const {
  createTreatment, updateTreatment,
  getTreatmentsByPatient, getTreatmentById, getAllTreatments,
  getTreatmentPricing,
  addItemToTreatment, removeItemFromTreatment, getItemsForTreatment
} = require('../controllers/sameDayTreatmentController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/treatment', authMiddleware, getAllTreatments);
router.post('/treatment', authMiddleware, createTreatment);
router.put('/treatment/:id', authMiddleware, updateTreatment);
router.get('/treatment/pricing', authMiddleware, getTreatmentPricing);
router.get('/treatment/patient/:patientId', authMiddleware, getTreatmentsByPatient);
router.get('/treatment/:id', authMiddleware, getTreatmentById);
router.post('/treatment/:id/items', authMiddleware, addItemToTreatment);
router.get('/treatment/:id/items', authMiddleware, getItemsForTreatment);
router.delete('/treatment/:id/items/:itemId', authMiddleware, removeItemFromTreatment);

module.exports = router;