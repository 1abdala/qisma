const router = require('express').Router();
const { getAiInsights } = require('../controllers/analyticsController');

router.get('/insights/:userId', getAiInsights);

module.exports = router;
