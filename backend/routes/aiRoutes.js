const router = require('express').Router();
const { getAiInsights, postChat } = require('../controllers/analyticsController');

router.get('/insights/:userId', getAiInsights);
router.post('/chat/:userId', postChat);

module.exports = router;
