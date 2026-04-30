const pool = require('../data/db');
const { autoSplit } = require('../services/splitService');

async function receive(req, res) {
    const { userId, amount } = req.body;

    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'userId and a positive amount are required' });
    }

    const { rows: [user] } = await pool.query(
        'SELECT id, currency FROM qisma_users WHERE id = $1', [userId]
    );
    if (!user) return res.status(404).json({ error: `User not found` });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query('UPDATE qisma_users SET balance = balance + $1 WHERE id = $2', [amount, userId]);

        const split = await autoSplit(client, userId, amount);

        await client.query(
            `INSERT INTO qisma_transactions
                (type, to_user_id, amount, from_currency, to_currency)
             VALUES ($1,$2,$3,$4,$5)`,
            ['receive', userId, amount, user.currency, user.currency]
        );

        await client.query('COMMIT');

        const { rows: [updated] } = await pool.query('SELECT balance FROM qisma_users WHERE id = $1', [userId]);

        return res.status(200).json({
            amount,
            split: { expenses: split.expenses, savings: split.savings, commitments: split.commitments },
            updatedBalance: parseFloat(updated.balance),
        });
    } catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
}

module.exports = { receive };
