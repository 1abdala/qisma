const db = require('../data/db');

/**
 * GET /api/pockets/:userId
 * Get user's current split percentages
 */
function getUserPercentages(req, res) {
  const userId = parseInt(req.params.userId);

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userPockets = db.pockets.filter(p => p.userId === userId);

  const percentages = {
    expenses: userPockets.find(p => p.name === 'expenses')?.percentage || 0.5,
    savings: userPockets.find(p => p.name === 'savings')?.percentage || 0.3,
    commitments: userPockets.find(p => p.name === 'commitments')?.percentage || 0.2,
  };

  return res.status(200).json(percentages);
}
function getUserPockets(req, res) {
  const userId = parseInt(req.params.userId);

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userPockets = db.pockets.filter(p => p.userId === userId);

  // 🔥 نحسب الرصيد لكل صندوق
  const pocketsWithBalance = userPockets.map(p => ({
    ...p,
    balance: user.balance * p.percentage
  }));

  return res.status(200).json(pocketsWithBalance);
}
/**
 * POST /api/pockets/update-percentages
 * Body: { userId, expenses, savings, commitments }
 * 
 * Updates the split percentages for a user's pockets.
 * Validates that total is approximately 1 (within 0.01 tolerance).
 */
function updatePercentages(req, res) {
  const { userId, expenses, savings, commitments } = req.body;

  // 1. Validation
  if (!userId || expenses === undefined || savings === undefined || commitments === undefined) {
    return res.status(400).json({
      error: 'userId, expenses, savings, and commitments are required'
    });
  }

  // 2. Check user exists
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // 3. Ensure all values are numbers and >= 0
  const exp = parseFloat(expenses);
  const sav = parseFloat(savings);
  const com = parseFloat(commitments);

  if (isNaN(exp) || isNaN(sav) || isNaN(com)) {
    return res.status(400).json({ error: 'All percentages must be valid numbers' });
  }

  if (exp < 0 || sav < 0 || com < 0) {
    return res.status(400).json({ error: 'Percentages cannot be negative' });
  }

  // 4. Check total is approximately 1 (tolerance: 0.01)
  const total = exp + sav + com;
  if (Math.abs(total - 1) > 0.01) {
    return res.status(400).json({
      error: `Percentages must sum to 1 (100%). Current total: ${total.toFixed(2)}`
    });
  }

  // 5. Update pockets with new percentages
  const expensesPocket = db.pockets.find(p => p.userId === userId && p.name === 'expenses');
  const savingsPocket = db.pockets.find(p => p.userId === userId && p.name === 'savings');
  const commitmentsPocket = db.pockets.find(p => p.userId === userId && p.name === 'commitments');

  if (expensesPocket) expensesPocket.percentage = exp;
  if (savingsPocket) savingsPocket.percentage = sav;
  if (commitmentsPocket) commitmentsPocket.percentage = com;

  // 6. Return updated percentages
  return res.status(200).json({
    message: 'Percentages updated successfully',
    percentages: {
      expenses: exp,
      savings: sav,
      commitments: com,
    },
  });
}

module.exports = { updatePercentages, getUserPercentages, getUserPockets };
