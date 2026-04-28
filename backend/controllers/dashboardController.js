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

  const totalPocketBalance = pockets.reduce((sum, p) => sum + p.balance, 0);

  if (totalPocketBalance === 0 && user.balance > 0) {
    pockets.forEach((p) => {
      p.balance = user.balance * p.percentage;
    });
  }

  // 3. Get last 3 transactions
  const recentTransactions = db.transactions
    .filter((t) => t.userId === userId || t.fromUserId === userId)
    .slice(-3)
    .reverse()
    .map((t) => ({
      id: t.id,
      type: t.type || 'receive',
      amount: t.amount,
      createdAt: t.createdAt,
      toUserId: t.toUserId || null,
    }));

  // 4. Return response
  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      balance: user.balance,
      currency: user.currency,
    },
    pockets,
    recentTransactions,
  });
}
module.exports = { getDashboard };
