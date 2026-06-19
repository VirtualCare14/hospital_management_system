const express = require('express');
const router = express.Router();
const {
  dispenseMedicine,
  getDispenseHistory
} = require('../controllers/pharmacyController');
const {
  getDashboardStats,
  getInventory,
  uploadInventory,
  getExpiryMedicines,
  getOutOfStockMedicines
} = require('../controllers/pharmacyInventoryController');
const {
  getRequests,
  getRequestDetails,
  createRequest,
  reviewRequest,
  issueRequest,
  recordConsumption,
  verifyReturn,
  issueRemainingPending,
  completeRequest
} = require('../controllers/pharmacyRequestController');
const {
  searchPrescriptions,
  createBill,
  getBills,
  getBillDetails,
  processReturn,
  getSettings,
  updateSettings,
  getDashboardStats: getBillingDashboardStats,
  getReports
} = require('../controllers/pharmacyBillingController');
const authMiddleware = require('../middleware/authMiddleware');

// Dispense history (kept for backward compatibility with Billing)
router.post('/dispense', authMiddleware, dispenseMedicine);
router.get('/dispense/:patientId', authMiddleware, getDispenseHistory);

// Phase 1 Inventory Management Routes
router.get('/inventory/stats', authMiddleware, getDashboardStats);
router.get('/inventory', authMiddleware, getInventory);
router.post('/inventory/upload', authMiddleware, uploadInventory);
router.get('/inventory/expiry', authMiddleware, getExpiryMedicines);
router.get('/inventory/out-of-stock', authMiddleware, getOutOfStockMedicines);

// Phase 2 Doctor-to-Pharmacy Request Routes
router.get('/requests', authMiddleware, getRequests);
router.get('/requests/:id', authMiddleware, getRequestDetails);
router.post('/requests', authMiddleware, createRequest);
router.put('/requests/:id/review', authMiddleware, reviewRequest);
router.post('/requests/:id/issue', authMiddleware, issueRequest);
router.post('/requests/:id/consume', authMiddleware, recordConsumption);
router.post('/requests/:id/verify-return', authMiddleware, verifyReturn);
router.post('/requests/:id/issue-remaining', authMiddleware, issueRemainingPending);
router.post('/requests/:id/complete', authMiddleware, completeRequest);

// Phase 3 Pharmacy Billing & Prescriptions Routes
router.get('/billing/prescriptions', authMiddleware, searchPrescriptions);
router.post('/billing/bills', authMiddleware, createBill);
router.get('/billing/bills', authMiddleware, getBills);
router.get('/billing/bills/:id', authMiddleware, getBillDetails);
router.post('/billing/bills/:id/returns', authMiddleware, processReturn);
router.get('/billing/settings', authMiddleware, getSettings);
router.put('/billing/settings', authMiddleware, updateSettings);
router.get('/billing/dashboard', authMiddleware, getBillingDashboardStats);
router.get('/billing/reports', authMiddleware, getReports);

module.exports = router;