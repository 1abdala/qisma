const pool = require('../data/db');

async function getUsers(req, res) {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, currency, balance FROM qisma_users ORDER BY id'
        );
        return res.status(200).json({ users: rows.map(u => ({ ...u, balance: parseFloat(u.balance) })) });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getUsers };
