const pool = require('../data/db');
const { autoSplit } = require('../services/splitService');
const { convert } = require('../services/currencyService');

async function send(req, res) {
    const { fromUserId, toUserId, amount, fromCurrency, toCurrency, recipientRef, paymentDetails } = req.body;

    if (!fromUserId || !toUserId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'fromUserId, toUserId, and a positive amount are required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows: [sender] }   = await client.query('SELECT id, balance, currency FROM qisma_users WHERE id = $1', [fromUserId]);
        const { rows: [receiver] } = await client.query('SELECT id, balance, currency FROM qisma_users WHERE id = $1', [toUserId]);

        if (!sender)   { await client.query('ROLLBACK'); return res.status(404).json({ error: `Sender not found` }); }
        if (!receiver) { await client.query('ROLLBACK'); return res.status(404).json({ error: `Receiver not found` }); }

        const senderCurrency   = fromCurrency || sender.currency;
        const receiverCurrency = toCurrency   || receiver.currency;

        if (parseFloat(sender.balance) < amount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const convertedAmount = convert(amount, senderCurrency, receiverCurrency);

        await client.query('UPDATE qisma_users SET balance = balance - $1 WHERE id = $2', [amount, fromUserId]);
        await client.query('UPDATE qisma_users SET balance = balance + $1 WHERE id = $2', [convertedAmount, toUserId]);

        const split = await autoSplit(client, toUserId, convertedAmount);

        await client.query(
            `INSERT INTO qisma_transactions
                (type, from_user_id, to_user_id, amount, converted_amount, from_currency, to_currency, recipient_ref, payment_details)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            ['send', fromUserId, toUserId, amount, convertedAmount, senderCurrency, receiverCurrency,
             recipientRef || null, paymentDetails || null]
        );

        await client.query('COMMIT');

        const { rows: [s] } = await pool.query('SELECT balance FROM qisma_users WHERE id = $1', [fromUserId]);
        const { rows: [r] } = await pool.query('SELECT balance FROM qisma_users WHERE id = $1', [toUserId]);

        return res.status(200).json({
            amount,
            convertedAmount,
            fromCurrency: senderCurrency,
            toCurrency: receiverCurrency,
            senderBalance:   parseFloat(s.balance),
            receiverBalance: parseFloat(r.balance),
            split: { expenses: split.expenses, savings: split.savings, commitments: split.commitments },
        });
    } catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
}

module.exports = { send };
