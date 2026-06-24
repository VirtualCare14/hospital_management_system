const express = require('express');
const router = express.Router();
const {
  createOt, updateOt, deleteOt, getOts, getAvailableOts, updateOtAvailabilityStatus,
  createOtBooking, updateOtBooking, getOtBookings, getOtBookingsByAdmission,
  getOtDashboard,
  uploadOtDocument, getOtDocuments, deleteOtDocument,
  scheduleOtWithDocuments, uploadDocumentsToBooking,
  autoCompleteOverdueBookings
} = require('../controllers/otManagementController');
const {
  getTemplates, createTemplate, updateTemplate, deleteTemplate
} = require('../controllers/otTemplateController');
const authMiddleware = require('../middleware/authMiddleware');

// OT CRUD
router.get('/ot-management', authMiddleware, getOts);
router.post('/ot-management', authMiddleware, createOt);
router.put('/ot-management/:id', authMiddleware, updateOt);
router.delete('/ot-management/:id', authMiddleware, deleteOt);
router.get('/ot-management/available', authMiddleware, getAvailableOts);
router.put('/ot-management/:id/availability', authMiddleware, updateOtAvailabilityStatus);

// OT Bookings
router.get('/ot-management/bookings', authMiddleware, getOtBookings);
router.post('/ot-management/bookings', authMiddleware, createOtBooking);
router.put('/ot-management/bookings/:id', authMiddleware, updateOtBooking);
router.get('/ot-management/bookings/admission/:admissionId', authMiddleware, getOtBookingsByAdmission);

// OT Scheduling with Documents
router.post('/ot/:otRecordId/schedule', authMiddleware, scheduleOtWithDocuments);
router.post('/ot-management/bookings/:bookingId/documents/upload', authMiddleware, uploadDocumentsToBooking);

// OT Dashboard
router.get('/ot-management/dashboard', authMiddleware, getOtDashboard);

// OT Documents (Cloudinary)
router.post('/ot-management/documents', authMiddleware, uploadOtDocument);
router.get('/ot-management/documents/:otRecordId', authMiddleware, getOtDocuments);
router.delete('/ot-management/documents/:id', authMiddleware, deleteOtDocument);

// Auto complete
router.post('/ot-management/auto-complete', authMiddleware, autoCompleteOverdueBookings);

// OT Consultation Templates
router.get('/ot-templates', authMiddleware, getTemplates);
router.post('/ot-templates', authMiddleware, createTemplate);
router.put('/ot-templates/:id', authMiddleware, updateTemplate);
router.delete('/ot-templates/:id', authMiddleware, deleteTemplate);

module.exports = router;