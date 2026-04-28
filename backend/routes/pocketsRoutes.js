const express = require('express');
const router = express.Router();
const { updatePercentages, getUserPercentages } = require('../controllers/pocketsController');

// GET /api/pockets/:userId - Get user's current split percentages
router.get('/:userId', getUserPercentages);

// POST /api/pockets/update-percentages - Update split percentages
router.post('/update-percentages', updatePercentages);

module.exports = router;
