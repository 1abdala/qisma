const express = require('express');
const router = express.Router();
const { receive } = require('../controllers/receiveController');

// POST /api/receive
router.post('/', receive);

module.exports = router;