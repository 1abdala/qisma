const pool = require('../data/db');

/**
 * autoSplit(client, userId, amount)
 *
 * Distributes `amount` across a user's system pockets proportionally.
 * Accepts a pg client so it can participate in the caller's transaction.
 * Falls back to pool (auto-transaction) when no client is provided.
 */
async function autoSplit(clientOrPool, userId, amount) {
    const db = clientOrPool ?? pool;

    if (!userId || !amount || amount <= 0) throw new Error('Invalid userId or amount');

    const { rows: pockets } = await db.query(
        'SELECT id, name, percentage FROM qisma_pockets WHERE user_id = $1 AND is_system = TRUE',
        [userId]
    );
    if (!pockets.length) throw new Error(`No system pockets found for userId: ${userId}`);

    const splitResult = {};
    for (const pocket of pockets) {
        const share = parseFloat((pocket.percentage * amount).toFixed(2));
        await db.query('UPDATE qisma_pockets SET balance = balance + $1 WHERE id = $2', [share, pocket.id]);
        splitResult[pocket.name] = share;
    }

    return { ...splitResult, total: amount };
}

module.exports = { autoSplit };
