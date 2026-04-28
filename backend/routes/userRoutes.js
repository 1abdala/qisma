const express = require('express');
const router = express.Router();
const { getUser, getPockets } = require('../controllers/userController');

// GET /api/user/:userId        → user info + balance
// GET /api/user/:userId/pockets → all pockets with balances
router.get('/:userId', getUser);
router.get('/:userId/pockets', getPockets);

module.exports = router;
