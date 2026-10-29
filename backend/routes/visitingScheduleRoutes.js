const express = require('express');
const router = express.Router();
const {
  createSchedule,
  getSchedules,
  getActiveSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getScheduleBookedSlots,
  getAvailableSlots
} = require('../controllers/visitingScheduleController');
const authMiddleware = require('../middleware/authMiddleware');

// Role guard: Only reception, admin, or superadmin can manage schedules
const authorizeReceptionOrAdmin = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.() || '';
  if (['admin', 'reception', 'superadmin'].includes(role)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Requires reception or admin privileges' });
};

router.use(authMiddleware);

// Read-only routes (accessible to authenticated users including reception, doctors, admin)
router.get('/active', getActiveSchedules);
router.get('/', getSchedules);
router.get('/:id/booked-slots', getScheduleBookedSlots);
router.get('/:id/available-slots', getAvailableSlots);
router.get('/:id', getScheduleById);

// Write routes (reception, admin, superadmin only)
router.post('/', authorizeReceptionOrAdmin, createSchedule);
router.put('/:id', authorizeReceptionOrAdmin, updateSchedule);
router.delete('/:id', authorizeReceptionOrAdmin, deleteSchedule);

module.exports = router;
