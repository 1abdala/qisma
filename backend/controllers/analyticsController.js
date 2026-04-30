const pool = require('../data/db');
const { generateInsights, getFallbackInsights } = require('../services/aiService');

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

async function getAiInsights(req, res) {
    const userId = parseInt(req.params.userId);
    try {
        const { rows: [user] } = await pool.query(
            'SELECT id, balance, currency FROM qisma_users WHERE id = $1', [userId]
        );
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { rows: pockets } = await pool.query(
            'SELECT name, balance, percentage FROM qisma_pockets WHERE user_id = $1 AND is_system = TRUE',
            [userId]
        );

        const { rows: customPockets } = await pool.query(
            `SELECT p.name, p.balance,
                    g.title, g.target_amount, g.monthly_contribution, g.is_active
             FROM qisma_pockets p
             LEFT JOIN qisma_pocket_goals g ON g.pocket_id = p.id
             WHERE p.user_id = $1 AND p.is_system = FALSE AND g.title IS NOT NULL`,
            [userId]
        );

        const { rows: [txRow] } = await pool.query(
            `SELECT COUNT(*) AS cnt FROM qisma_transactions
             WHERE to_user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
            [userId]
        );

        const getPocket = (name) => pockets.find(p => p.name === name) ?? { balance: 0, percentage: 0 };
        const exp = getPocket('expenses');
        const sav = getPocket('savings');
        const com = getPocket('commitments');

        const snapshot = {
            totalBalance: parseFloat(user.balance),
            currency: user.currency,
            pockets: {
                expenses:    { balance: parseFloat(exp.balance),    percentage: Math.round(parseFloat(exp.percentage)    * 100) },
                savings:     { balance: parseFloat(sav.balance),    percentage: Math.round(parseFloat(sav.percentage)    * 100) },
                commitments: { balance: parseFloat(com.balance),    percentage: Math.round(parseFloat(com.percentage)    * 100) },
            },
            customGoals: customPockets.map(p => {
                const balance = parseFloat(p.balance);
                const target  = parseFloat(p.target_amount);
                const monthly = parseFloat(p.monthly_contribution ?? 0);
                return {
                    goalTitle:          p.title,
                    balance,
                    targetAmount:       target,
                    monthlyContribution: monthly,
                    progress:           target > 0 ? Math.round((balance / target) * 100) : 0,
                    monthsRemaining:    monthly > 0 && balance < target
                        ? Math.ceil((target - balance) / monthly)
                        : null,
                };
            }),
            recentIncomeCount: parseInt(txRow?.cnt ?? 0),
        };

        const insights = await generateInsights(snapshot);
        return res.status(200).json({ insights });
    } catch (err) {
        console.error('[AI] getAiInsights error:', err.message);
        return res.status(200).json({ insights: getFallbackInsights(), _fallback: true });
    }
}

module.exports = { getAnalytics, getAiInsights };
