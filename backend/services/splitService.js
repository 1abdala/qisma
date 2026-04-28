const db = require('../data/db');

/**
 * autoSplit(userId, amount)
 *
 * Finds all pockets belonging to the user, calculates each pocket's
 * share based on its percentage, updates the pocket balances in memory,
 * and returns the split breakdown as a named object.
 *
 * @param {number} userId  - The ID of the user receiving the amount
 * @param {number} amount  - The total amount to split (e.g. 500)
 * @returns {object}       - { expenses, savings, commitments, total }
 */
function autoSplit(userId, amount) {
    // 1. Validate inputs
    if (!userId || !amount || amount <= 0) {
        throw new Error('Invalid userId or amount');
    }

    // 2. Find the user's pockets
    const userPockets = db.pockets.filter((pocket) => pocket.userId === userId);

    if (userPockets.length === 0) {
        throw new Error(`No pockets found for userId: ${userId}`);
    }

    // 3. Calculate each pocket's share and update its balance
    const splitResult = {};

    userPockets.forEach((pocket) => {
        const share = parseFloat(((pocket.percentage / 100) * amount).toFixed(2));
        pocket.balance += share;           // mutates the in-memory db
        splitResult[pocket.name] = share;  // e.g. { expenses: 250 }
    });

    // 4. Also record a transaction for history
    db.transactions.push({
        id: db.transactions.length + 1,
        userId,
        amount,
        split: { ...splitResult },
        createdAt: new Date().toISOString(),
    });

    // 5. Return the result
    return {
        ...splitResult,   // expenses, savings, commitments
        total: amount,
    };
}

module.exports = { autoSplit };