const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');

// GET /api/dashboard/:userId
router.get('/:userId', getDashboard);

module.exports = router;
