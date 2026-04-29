const db = require('../data/db');
const { autoSplit } = require('../services/splitService');

/**
 * POST /api/receive
 * Body: { userId, amount }
 *
 * 1. Validates the request
 * 2. Finds the user
 * 3. Increases user balance
 * 4. Calls autoSplit to distribute amount across pockets
 * 5. Returns the split result + updated balance
 */
function receive(req, res) {
    const { userId, amount, fromUserId } = req.body;

    // 1. Basic validation
    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({
            error: 'userId and a positive amount are required',
        });
    }

    // 2. Find the user
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
        return res.status(404).json({
            error: `User with id ${userId} not found`,
        });
    }

    // 3. Increase user balance
    user.balance += amount;

    // 4. Split the amount across pockets (also logs the transaction)
    const split = autoSplit(userId, amount);
    // 5. Return clean response
    return res.status(200).json({
        amount,
        split: {
            expenses: split.expenses,
            savings: split.savings,
            commitments: split.commitments,
        },
        updatedBalance: user.balance,
    });

}

module.exports = { receive };