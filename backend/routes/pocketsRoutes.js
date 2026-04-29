const express = require('express');
const router = express.Router();

const { updatePercentages, getUserPercentages, getUserPockets } = require('../controllers/pocketsController');

router.get('/percentages/:userId', getUserPercentages);

// ✅ هذا هو endpoint الرئيسي للعرض
router.get('/:userId', getUserPockets);

// POST
router.post('/update-percentages', updatePercentages);

module.exports = router;