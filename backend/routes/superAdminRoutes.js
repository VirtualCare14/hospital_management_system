const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
  superAdminLogin,
  listHospitals,
  createHospital,
  updateHospital,
  deleteHospital
} = require('../controllers/superAdminController');

const superAdminOnly = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET || 'super_secret_hms_jwt_key_2026');
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied: super admin permission required' });
    }
    req.superAdmin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

router.post('/login', superAdminLogin);
router.get('/hospitals', superAdminOnly, listHospitals);
router.post('/hospitals', superAdminOnly, createHospital);
router.put('/hospitals/:id', superAdminOnly, updateHospital);
router.delete('/hospitals/:id', superAdminOnly, deleteHospital);

module.exports = router;
