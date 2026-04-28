const db = require('../data/db');

/**
 * GET /api/users
 *
 * Returns a simplified list of all users for dropdown selection.
 * Only returns id, name, and currency (not balance or email).
 */
function getUsers(req, res) {
  const users = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    currency: u.currency,
  }));

  return res.status(200).json({ users });
}

module.exports = { getUsers };