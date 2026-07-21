const express = require('express');
const router = express.Router();
const { createDemoRequest, getDemoRequests } = require('../controllers/demoRequestController');

// Public route to submit demo request
router.post('/', createDemoRequest);

// Admin route to list demo requests
router.get('/', getDemoRequests);

module.exports = router;
