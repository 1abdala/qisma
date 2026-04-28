const express = require('express');
const router = express.Router();

const { updatePercentages, getUserPercentages, getUserPockets } = require('../controllers/pocketsController');

// ✅ هذا هو endpoint الرئيسي للعرض
router.get('/:userId', getUserPockets);

router.get('/percentages/:userId', getUserPercentages);

// POST
router.post('/update-percentages', updatePercentages);

module.exports = router;