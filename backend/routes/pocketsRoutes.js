const express = require('express');
const router = express.Router();

const {
    // Original
    updatePercentages,
    getUserPercentages,
    getUserPockets,
    // L1
    createPocket,
    // L4
    applyMonthlyContributions,
    // L5
    updateSchedule,
    // L6
    updatePocket,
    calculateGoal,
} = require('../controllers/pocketsController');

// ─── Static prefix routes — MUST come before /:param routes ───────────────────

router.get('/percentages/:userId', getUserPercentages);       // original
router.post('/update-percentages', updatePercentages);        // original
router.post('/apply-contributions', applyMonthlyContributions);// L4
router.post('/calculate', calculateGoal);            // L6: instant feedback

// ─── Resource routes ───────────────────────────────────────────────────────────

router.post('/', createPocket);                          // L1
router.get('/:userId', getUserPockets);                        // L1 + all levels

// ─── Per-pocket operations ─────────────────────────────────────────────────────

router.put('/:pocketId', updatePocket);               // L6: full edit
router.patch('/:pocketId/schedule', updateSchedule);            // L5: pause/resume

module.exports = router;