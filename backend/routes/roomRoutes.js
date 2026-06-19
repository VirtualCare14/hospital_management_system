const express = require('express');
const router = express.Router();
const {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getBedsForAdmission,
  getAllBeds,
  updateBedStatus
} = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to restrict route to administrators and IPD admins
const adminOrIpdOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'ipd')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: admin or IPD permission required' });
  }
};

router.get('/', authMiddleware, getRooms);
router.post('/', authMiddleware, adminOrIpdOnly, createRoom);
router.put('/:id', authMiddleware, adminOrIpdOnly, updateRoom);
router.delete('/:id', authMiddleware, adminOrIpdOnly, deleteRoom);
router.get('/beds', authMiddleware, getBedsForAdmission);
router.get('/all-beds', authMiddleware, getAllBeds);
router.put('/beds/:bedId/status', authMiddleware, adminOrIpdOnly, updateBedStatus);

module.exports = router;
