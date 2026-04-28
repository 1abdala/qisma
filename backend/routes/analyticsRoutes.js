const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');

// GET /api/analytics/:userId
router.get('/:userId', getAnalytics);

module.exports = router;
