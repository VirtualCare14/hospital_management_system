const express = require('express');
const router = express.Router();
const {
  getHospitalSettings,
  createOrUpdateHospitalSettings,
  uploadLogo,
  deleteLogo,
  uploadLetterhead,
  deleteLetterhead
} = require('../controllers/hospitalSettingsController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to restrict route to administrators only
const adminOnly = (req, res, next) => {
  const role = req.user?.role?.toLowerCase?.().trim?.();
  if (role === 'admin') {
    next();
  } else {
    console.log('[DEBUG] Admin access denied. req.user:', req.user);
    res.status(403).json({ message: 'Access denied: admin permission required' });
  }
};

// GET /api/admin/hospital-settings - Get hospital settings
router.get('/', authMiddleware, getHospitalSettings);

// POST /api/admin/hospital-settings - Create or update hospital settings
router.post('/', authMiddleware, adminOnly, createOrUpdateHospitalSettings);

// POST /api/admin/hospital-settings/upload-logo - Upload logo to Cloudinary
router.post('/upload-logo', authMiddleware, adminOnly, uploadLogo);

// DELETE /api/admin/hospital-settings/delete-logo - Delete logo from Cloudinary
router.delete('/delete-logo', authMiddleware, adminOnly, deleteLogo);

// POST /api/admin/hospital-settings/upload-letterhead - Upload letterhead image
router.post('/upload-letterhead', authMiddleware, adminOnly, uploadLetterhead);

// DELETE /api/admin/hospital-settings/delete-letterhead - Delete letterhead image
router.delete('/delete-letterhead', authMiddleware, adminOnly, deleteLetterhead);

module.exports = router;
