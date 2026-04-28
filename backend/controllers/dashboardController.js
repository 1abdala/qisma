const db = require('../data/db');

/**
 * GET /api/dashboard/:userId
 *
 * Returns everything the Dashboard page needs in one call:
 *   - user name + total balance
 *   - all 3 pockets with balances
 *   - last 3 transactions for this user (receive or send)
 */
function getDashboard(req, res) {
  const userId = parseInt(req.params.userId);

  // 1. Find user
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: `User ${userId} not found` });
  }

  // 2. Get pockets
  const pockets = db.pockets.filter((p) => p.userId === userId);

  // 3. Get last 3 transactions involving this user
  //    Covers both: receive (userId match) and send (fromUserId match)
  const recentTransactions = db.transactions
    .filter((t) => t.userId === userId || t.fromUserId === userId)
    .slice(-3)          // last 3
    .reverse()          // newest first
    .map((t) => ({
      id: t.id,
      type: t.type || 'receive',        // 'receive' or 'send'
      amount: t.amount,
      createdAt: t.createdAt,
      // For send: show who received it
      toUserId: t.toUserId || null,
    }));

  // 4. Return unified response
  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      balance: user.balance,
    },
    pockets,
    recentTransactions,
  });
}

module.exports = { getDashboard };
