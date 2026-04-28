const express = require('express');
const router = express.Router();
const { getUsers } = require('../controllers/usersController');

// GET /api/users - returns list of all users (id + name only)
router.get('/', getUsers);

module.exports = router;