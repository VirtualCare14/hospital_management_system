const express = require('express');
const router = express.Router();
const {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  getDoctors,
  updateDoctorAvailability,
  getDoctorAvailability,
  getHospitalTracking,
  getDeleteDataPermission,
  deletePatientData,
  searchDeleteItems,
  deletePharmacyInvoice,
  deleteGeneralInvoice,
  deletePrescription,
  getPatientSummary,
  getUserLimit,
  getPatientTrackingTimeline,
  getPatientBills,
  searchBills,
  updateBillDate
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to restrict route to administrators only
const adminOnly = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || (typeof req.user?.role === 'string' ? req.user.role.toLowerCase().trim() : '');
  if (role === 'admin') {
    next();
  } else {
    console.log('[DEBUG] Admin access denied in adminRoutes. User role:', req.user?.role, 'Username:', req.user?.username);
    res.status(403).json({ message: 'Access denied: admin permission required' });
  }
};

router.post('/create-user', authMiddleware, adminOnly, createUser);
router.get('/users', authMiddleware, adminOnly, getUsers);
router.get('/users/limit', authMiddleware, adminOnly, getUserLimit);
router.put('/users/:id', authMiddleware, adminOnly, updateUser);
router.delete('/users/:id', authMiddleware, adminOnly, deleteUser);

router.post('/departments', authMiddleware, adminOnly, createDepartment);
router.get('/departments', authMiddleware, getDepartments); // Open to all authenticated staff to populate dropdowns
router.put('/departments/:id', authMiddleware, adminOnly, updateDepartment);
router.delete('/departments/:id', authMiddleware, adminOnly, deleteDepartment);

router.get('/doctors', authMiddleware, getDoctors); // Open to receptionist to filter doctors by department
router.get('/doctors/:id/availability', authMiddleware, getDoctorAvailability);
router.put('/doctors/:id/availability', authMiddleware, adminOnly, updateDoctorAvailability);

// Tracking and patient summary routes for admin dashboard
router.get('/hospital-tracking', authMiddleware, adminOnly, getHospitalTracking);
router.get('/delete-data/permission', authMiddleware, adminOnly, getDeleteDataPermission);
router.post('/delete-data/patient', authMiddleware, adminOnly, deletePatientData);
router.get('/delete-data/search', authMiddleware, adminOnly, searchDeleteItems);
router.delete('/delete-data/pharmacy-bill/:id', authMiddleware, adminOnly, deletePharmacyInvoice);
router.delete('/delete-data/billing-invoice/:id', authMiddleware, adminOnly, deleteGeneralInvoice);
router.delete('/delete-data/prescription/:id', authMiddleware, adminOnly, deletePrescription);
router.get('/patient-summary/:id', authMiddleware, adminOnly, getPatientSummary);
router.get('/patient-tracking/:patientId', authMiddleware, adminOnly, getPatientTrackingTimeline);

router.get('/bills/patient/:patientId', authMiddleware, adminOnly, getPatientBills);
router.get('/bills/search', authMiddleware, adminOnly, searchBills);
router.put('/bills/:billType/:billId/date', authMiddleware, adminOnly, updateBillDate);

module.exports = router;
