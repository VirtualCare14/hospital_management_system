const express = require('express');
const router = express.Router();
const { login, logout, getPublicHospital, hospitalLookup } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/hospital-lookup', hospitalLookup);
router.get('/hospital/:id', getPublicHospital);
router.post('/logout', authMiddleware, logout);

module.exports = router;
