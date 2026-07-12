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
  getOutOfStockMedicines,
  updateInventoryItem,
  deleteInventoryItem,
  createInventoryItem,
  getUploadHistory
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
  completeRequest,
  dismissNotification,
  receiveRequest,
  returnSentRequest,
  returnReceivedRequest
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
  getReports,
  getGstReports
} = require('../controllers/pharmacyBillingController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchases,
  getPurchaseDetails,
  createPurchase,
  updatePurchase,
  createPurchaseReturn,
  createStockAdjustment,
  getAdjustments,
  getAuditLogs
} = require('../controllers/supplierPurchaseController');
const {
  addSupplierPayment,
  getSupplierPayments
} = require('../controllers/supplierPaymentController');
const {
  getAnalyticsDashboard,
  getComprehensiveReports
} = require('../controllers/pharmacyReportsController');

// Dispense history (kept for backward compatibility with Billing)
router.post('/dispense', authMiddleware, dispenseMedicine);
router.get('/dispense/:patientId', authMiddleware, getDispenseHistory);

// Phase 1 Inventory Management Routes
router.get('/inventory/stats', authMiddleware, getDashboardStats);
router.get('/inventory', authMiddleware, getInventory);
router.post('/inventory/upload', authMiddleware, uploadInventory);
router.get('/inventory/upload-history', authMiddleware, getUploadHistory);
router.get('/inventory/expiry', authMiddleware, getExpiryMedicines);
router.get('/inventory/out-of-stock', authMiddleware, getOutOfStockMedicines);
router.post('/inventory', authMiddleware, createInventoryItem);
router.put('/inventory/:id', authMiddleware, updateInventoryItem);
router.delete('/inventory/:id', authMiddleware, deleteInventoryItem);

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
router.post('/requests/:id/dismiss-notification', authMiddleware, dismissNotification);
router.post('/requests/:id/receive', authMiddleware, receiveRequest);
router.post('/requests/:id/return-sent', authMiddleware, returnSentRequest);
router.post('/requests/:id/return-received', authMiddleware, returnReceivedRequest);

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

// Phase 4 Supplier & Purchase Management Routes
router.get('/suppliers', authMiddleware, getSuppliers);
router.post('/suppliers', authMiddleware, createSupplier);
router.put('/suppliers/:id', authMiddleware, updateSupplier);
router.delete('/suppliers/:id', authMiddleware, deleteSupplier);

router.get('/purchases', authMiddleware, getPurchases);
router.get('/purchases/:id', authMiddleware, getPurchaseDetails);
router.post('/purchases', authMiddleware, createPurchase);
router.put('/purchases/:id', authMiddleware, updatePurchase);
router.post('/purchases/:id/returns', authMiddleware, createPurchaseReturn);

// Phase 5 Final complete HIS Routes
router.get('/analytics/dashboard', authMiddleware, getAnalyticsDashboard);
router.get('/reports', authMiddleware, getComprehensiveReports);
router.post('/purchases/:id/payments', authMiddleware, addSupplierPayment);
router.get('/purchases/:id/payments', authMiddleware, getSupplierPayments);
router.post('/adjustments', authMiddleware, createStockAdjustment);
router.get('/adjustments', authMiddleware, getAdjustments);
router.get('/audit-logs', authMiddleware, getAuditLogs);

module.exports = router;