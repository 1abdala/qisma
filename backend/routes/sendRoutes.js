const express = require('express');
const router = express.Router();
const { send } = require('../controllers/sendController');

// POST /api/send
router.post('/', send);

module.exports = router;
