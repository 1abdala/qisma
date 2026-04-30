const pool = require('../data/db');

async function getAnalytics(req, res) {
    const userId = parseInt(req.params.userId);
    try {
        const { rows: [user] } = await pool.query('SELECT id FROM qisma_users WHERE id = $1', [userId]);
        if (!user) return res.status(404).json({ error: `User ${userId} not found` });

        const { rows: pockets } = await pool.query(
            'SELECT name, balance FROM qisma_pockets WHERE user_id = $1 AND is_system = TRUE',
            [userId]
        );

        const expenses    = parseFloat(pockets.find(p => p.name === 'expenses')?.balance    ?? 0);
        const savings     = parseFloat(pockets.find(p => p.name === 'savings')?.balance     ?? 0);
        const commitments = parseFloat(pockets.find(p => p.name === 'commitments')?.balance ?? 0);
        const total       = expenses + savings + commitments;

        function toPercent(v) {
            return total === 0 ? 0 : parseFloat(((v / total) * 100).toFixed(1));
        }

        const ep = toPercent(expenses);
        const sp = toPercent(savings);
        const cp = toPercent(commitments);

        return res.status(200).json({
            totals: { expenses, savings, commitments, overall: total },
            pieChart: [
                { name: 'expenses',    label: 'مصاريف',   color: '#ebc23e', amount: expenses,    percentage: ep, dashArray: `${ep} ${100 - ep}`, dashOffset: 0 },
                { name: 'savings',     label: 'ادخار',    color: '#84d5c5', amount: savings,     percentage: sp, dashArray: `${sp} ${100 - sp}`, dashOffset: -ep },
                { name: 'commitments', label: 'التزامات', color: '#75d1ff', amount: commitments, percentage: cp, dashArray: `${cp} ${100 - cp}`, dashOffset: -(ep + sp) },
            ],
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getAnalytics };
