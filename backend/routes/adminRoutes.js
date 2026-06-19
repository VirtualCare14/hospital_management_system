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
  getPatientSummary,
  getUserLimit
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to restrict route to administrators only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
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
router.get('/patient-summary/:id', authMiddleware, adminOnly, getPatientSummary);

module.exports = router;
