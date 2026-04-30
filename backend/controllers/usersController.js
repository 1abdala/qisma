const pool = require('../data/db');

async function getUsers(req, res) {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, currency, balance, account_number FROM qisma_users ORDER BY id'
        );
        return res.status(200).json({
            users: rows.map(u => ({
                ...u,
                balance:       parseFloat(u.balance),
                accountNumber: u.account_number,
            }))
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function lookupByAccountNumber(req, res) {
    const { accountNumber } = req.params;
    if (!/^\d{10}$/.test(accountNumber))
        return res.status(400).json({ error: 'رقم الحساب يجب أن يتكون من 10 أرقام' });

    try {
        const { rows: [user] } = await pool.query(
            'SELECT id, name, currency FROM qisma_users WHERE account_number = $1',
            [accountNumber]
        );
        if (!user) return res.status(404).json({ error: 'رقم الحساب غير موجود' });
        return res.status(200).json({ id: user.id, name: user.name, currency: user.currency });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function getUserTransactions(req, res) {
    const userId = parseInt(req.params.userId);
    try {
        const { rows } = await pool.query(
            `SELECT id, type, amount, converted_amount, from_currency, to_currency, from_user_id, to_user_id, created_at, recipient_ref, payment_details
             FROM qisma_transactions
             WHERE from_user_id = $1 OR to_user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );
        return res.status(200).json(
            rows.map(t => ({
                id: t.id,
                type: t.from_user_id === userId ? 'send' : 'receive',
                amount: parseFloat(t.amount),
                convertedAmount: t.converted_amount ? parseFloat(t.converted_amount) : null,
                fromCurrency: t.from_currency,
                toCurrency: t.to_currency,
                fromUserId: t.from_user_id,
                toUserId: t.to_user_id,
                createdAt: t.created_at,
                recipientRef: t.recipient_ref,
                paymentDetails: t.payment_details
            }))
        );
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getUsers, lookupByAccountNumber, getUserTransactions };
