const pool = require('../data/db');
const { generateInsights, getFallbackInsights, chatWithAI } = require('../services/aiService');

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

async function buildUserSnapshot(userId, pool) {
    const { rows: [user] } = await pool.query(
        'SELECT id, balance, currency FROM qisma_users WHERE id = $1', [userId]
    );
    if (!user) throw new Error('User not found');

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

    const { rows: [txStatsRow] } = await pool.query(
        `SELECT 
            COUNT(*) AS cnt,
            SUM(CASE WHEN from_user_id = $1 THEN amount ELSE 0 END) as total_sent,
            SUM(CASE WHEN to_user_id = $1 THEN COALESCE(converted_amount, amount) ELSE 0 END) as total_received
         FROM qisma_transactions
         WHERE (from_user_id = $1 OR to_user_id = $1) AND created_at > NOW() - INTERVAL '30 days'`,
        [userId]
    );

    const { rows: recentTxs } = await pool.query(
        `SELECT t.amount, t.from_user_id, t.to_user_id, t.created_at, t.from_currency, t.to_currency, t.converted_amount,
                u1.name AS from_name, u2.name AS to_name
         FROM qisma_transactions t
         LEFT JOIN qisma_users u1 ON t.from_user_id = u1.id
         LEFT JOIN qisma_users u2 ON t.to_user_id = u2.id
         WHERE (t.from_user_id = $1 OR t.to_user_id = $1)
         ORDER BY t.created_at DESC
         LIMIT 15`,
        [userId]
    );

    const { rows: monthlyHistoryRows } = await pool.query(
        `SELECT 
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            SUM(CASE WHEN from_user_id = $1 THEN amount ELSE 0 END) as total_sent,
            SUM(CASE WHEN to_user_id = $1 THEN COALESCE(converted_amount, amount) ELSE 0 END) as total_received
         FROM qisma_transactions
         WHERE from_user_id = $1 OR to_user_id = $1
         GROUP BY month
         ORDER BY month DESC
         LIMIT 24`,
        [userId]
    );

    const getPocket = (name) => pockets.find(p => p.name === name) ?? { balance: 0, percentage: 0 };
    const exp = getPocket('expenses');
    const sav = getPocket('savings');
    const com = getPocket('commitments');

    return {
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
        transactions30Days: {
            totalSent: parseFloat(txStatsRow?.total_sent ?? 0),
            totalReceived: parseFloat(txStatsRow?.total_received ?? 0),
            count: parseInt(txStatsRow?.cnt ?? 0),
        },
        recentTransactions: recentTxs.map(t => {
            const isSender = Number(t.from_user_id) === Number(userId);
            const otherParty = isSender ? t.to_name : t.from_name;
            const actualAmount = isSender ? parseFloat(t.amount) : parseFloat(t.converted_amount || t.amount);
            const actualCurrency = isSender ? t.from_currency : t.to_currency;
            return {
                type: isSender ? 'إرسال' : 'استلام',
                amount: actualAmount,
                currency: actualCurrency,
                otherParty: otherParty || 'مجهول',
                date: t.created_at
            };
        }),
        monthlyHistory: monthlyHistoryRows.map(r => ({
            month: r.month,
            totalSent: parseFloat(r.total_sent),
            totalReceived: parseFloat(r.total_received)
        }))
    };
}

async function getAiInsights(req, res) {
    const userId = parseInt(req.params.userId);
    try {
        const snapshot = await buildUserSnapshot(userId, pool);
        const insights = await generateInsights(snapshot);
        return res.status(200).json({ insights });
    } catch (err) {
        console.error('[AI] getAiInsights error:', err.message);
        if (err.message === 'User not found') return res.status(404).json({ error: err.message });
        return res.status(200).json({ insights: getFallbackInsights(), _fallback: true });
    }
}

async function postChat(req, res) {
    const userId = parseInt(req.params.userId);
    const { messages } = req.body;
    try {
        const snapshot = await buildUserSnapshot(userId, pool);
        const reply = await chatWithAI(snapshot, messages);
        return res.status(200).json({ reply });
    } catch (err) {
        console.error('[AI] postChat error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = { getAnalytics, getAiInsights, postChat };
