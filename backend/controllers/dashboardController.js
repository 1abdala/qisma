const pool = require('../data/db');

async function getDashboard(req, res) {
    const userId = parseInt(req.params.userId);
    try {
        const { rows: [user] } = await pool.query(
            'SELECT id, name, balance, currency, account_number FROM qisma_users WHERE id = $1', [userId]
        );
        if (!user) return res.status(404).json({ error: `User ${userId} not found` });

        const { rows: pockets } = await pool.query(
            'SELECT id, name, percentage, balance FROM qisma_pockets WHERE user_id = $1 AND is_system = TRUE',
            [userId]
        );

        const { rows: transactions } = await pool.query(
            `SELECT id, type, amount, converted_amount, from_currency, to_currency, from_user_id, to_user_id, created_at
             FROM qisma_transactions
             WHERE from_user_id = $1 OR to_user_id = $1
             ORDER BY created_at DESC LIMIT 3`,
            [userId]
        );

        return res.status(200).json({
            user: {
                id:            user.id,
                name:          user.name,
                balance:       parseFloat(user.balance),
                currency:      user.currency,
                accountNumber: user.account_number,
            },
            pockets: pockets.map(p => ({
                ...p,
                userId,
                balance:    parseFloat(p.balance),
                percentage: parseFloat(p.percentage),
            })),
            recentTransactions: transactions.map(t => ({
                id:              t.id,
                type:            t.from_user_id === userId ? 'send' : 'receive',
                amount:          parseFloat(t.amount),
                convertedAmount: t.converted_amount ? parseFloat(t.converted_amount) : null,
                fromCurrency:    t.from_currency,
                toCurrency:      t.to_currency,
                fromUserId:      t.from_user_id,
                toUserId:        t.to_user_id,
                createdAt:       t.created_at,
            })),
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getDashboard };
