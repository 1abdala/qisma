const express = require('express');
const router = express.Router();
const { getUsers, lookupByAccountNumber, getUserTransactions } = require('../controllers/usersController');

router.get('/', getUsers);
router.get('/lookup/:accountNumber', lookupByAccountNumber);
router.get('/:userId/transactions', getUserTransactions);

module.exports = router;