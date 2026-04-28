const db = require('../data/db');

/**
 * GET /api/user/:userId
 * Returns user info and current balance
 */
function getUser(req, res) {
  const userId = parseInt(req.params.userId);
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: `User ${userId} not found` });
  }

  return res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    balance: user.balance,
  });
}

/**
 * GET /api/user/:userId/pockets
 * Returns all pockets for the user with current balances
 */
function getPockets(req, res) {
  const userId = parseInt(req.params.userId);
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: `User ${userId} not found` });
  }

  const pockets = db.pockets.filter((p) => p.userId === userId);

  return res.status(200).json({ pockets });
}

module.exports = { getUser, getPockets };
