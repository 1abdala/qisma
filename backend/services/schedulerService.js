const cron = require('node-cron');
const pool = require('../data/db');

// ─────────────────────────────────────────────────────────────────────────────
// PURE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function thisMonthPrefix() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getNextContributionDate(contributionDay, lastContribDate) {
    const now    = new Date();
    const today  = now.getDate();
    const prefix = thisMonthPrefix();
    const alreadyApplied = lastContribDate?.startsWith(prefix);

    let year  = now.getFullYear();
    let month = now.getMonth();

    if (alreadyApplied || today >= contributionDay) {
        month += 1;
        if (month > 11) { month = 0; year += 1; }
    }

    return `${year}-${String(month + 1).padStart(2, '0')}-${String(contributionDay).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

async function runAutoContributions(filterUserId = null) {
    const todayDay = new Date().getDate();
    const todayISO = todayString();
    const monthKey = thisMonthPrefix();

    const results = [];

    // Fetch all active scheduled custom pockets (optionally scoped to one user)
    const params = filterUserId ? [filterUserId] : [];
    const { rows: candidates } = await pool.query(
        `SELECT p.id, p.user_id, p.name, p.balance, p.last_contribution_date,
                g.title, g.target_amount, g.monthly_contribution,
                g.start_date, g.end_date, g.contribution_day, g.is_active, g.source_pocket
         FROM qisma_pockets p
         JOIN qisma_pocket_goals g ON g.pocket_id = p.id
         WHERE p.is_system = FALSE
           AND g.is_active = TRUE
           AND g.monthly_contribution > 0
           ${filterUserId ? 'AND p.user_id = $1' : ''}`,
        params
    );

    for (const row of candidates) {
        const pocketId  = row.id;
        const userId    = row.user_id;
        const goal      = {
            isActive:            row.is_active,
            startDate:           row.start_date,
            endDate:             row.end_date,
            contributionDay:     row.contribution_day,
            monthlyContribution: parseFloat(row.monthly_contribution),
            targetAmount:        parseFloat(row.target_amount),
        };
        const balance   = parseFloat(row.balance);
        const lastDate  = row.last_contribution_date
            ? new Date(row.last_contribution_date).toISOString().slice(0, 10)
            : null;

        // 1. Start date not yet reached
        if (goal.startDate && todayISO < goal.startDate) {
            results.push({ id: pocketId, name: row.name, status: 'pending', reason: `starts on ${goal.startDate}` });
            continue;
        }

        // 2. End date passed — auto-deactivate
        if (goal.endDate && todayISO > goal.endDate) {
            await pool.query('UPDATE qisma_pocket_goals SET is_active = FALSE WHERE pocket_id = $1', [pocketId]);
            results.push({ id: pocketId, name: row.name, status: 'expired', reason: `end date ${goal.endDate} passed` });
            continue;
        }

        // 3. Not the right day
        if (todayDay !== goal.contributionDay) {
            const next = getNextContributionDate(goal.contributionDay, lastDate);
            results.push({ id: pocketId, name: row.name, status: 'waiting', reason: `next contribution on ${next}` });
            continue;
        }

        // 4. Already applied this month (idempotency)
        if (lastDate?.startsWith(monthKey)) {
            results.push({ id: pocketId, name: row.name, status: 'skipped', reason: 'already applied this month' });
            continue;
        }

        // 5. Goal already reached — auto-deactivate
        if (balance >= goal.targetAmount) {
            await pool.query('UPDATE qisma_pocket_goals SET is_active = FALSE WHERE pocket_id = $1', [pocketId]);
            results.push({ id: pocketId, name: row.name, status: 'completed', reason: 'goal already reached' });
            continue;
        }

        // 6. Check source pocket balance
        const sourcePocketName = row.source_pocket ?? 'expenses';
        const { rows: [srcPocket] } = await pool.query(
            'SELECT id, balance FROM qisma_pockets WHERE user_id = $1 AND name = $2 AND is_system = TRUE',
            [userId, sourcePocketName]
        );
        if (!srcPocket) {
            results.push({ id: pocketId, name: row.name, status: 'error', reason: `source pocket '${sourcePocketName}' not found` });
            continue;
        }

        const remaining = goal.targetAmount - balance;
        const toApply   = Math.min(goal.monthlyContribution, remaining);

        if (parseFloat(srcPocket.balance) < toApply) {
            results.push({ id: pocketId, name: row.name, status: 'insufficient_balance',
                reason: `need ${toApply}, ${sourcePocketName} pocket balance is ${srcPocket.balance}` });
            continue;
        }

        // 7. Apply contribution in a transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE qisma_pockets SET balance = balance - $1 WHERE id = $2', [toApply, srcPocket.id]);
            await client.query('UPDATE qisma_pockets SET balance = balance + $1, last_contribution_date = NOW() WHERE id = $2', [toApply, pocketId]);

            const newBalance = balance + toApply;
            if (newBalance >= goal.targetAmount) {
                await client.query('UPDATE qisma_pocket_goals SET is_active = FALSE WHERE pocket_id = $1', [pocketId]);
            }

            await client.query(
                `INSERT INTO qisma_transactions (type, to_user_id, amount, from_currency, to_currency)
                 VALUES ('receive', $1, $2, 'SAR', 'SAR')`,
                [userId, toApply]
            );

            await client.query('COMMIT');
            results.push({ id: pocketId, name: row.name, status: 'applied', applied: toApply,
                newBalance, goalReached: newBalance >= goal.targetAmount });
        } catch (err) {
            await client.query('ROLLBACK');
            results.push({ id: pocketId, name: row.name, status: 'error', reason: err.message });
        } finally {
            client.release();
        }
    }

    return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// CRON — daily at 00:05
// ─────────────────────────────────────────────────────────────────────────────

function startScheduler() {
    cron.schedule('5 0 * * *', async () => {
        console.log(`[Scheduler] Running auto-contributions — ${new Date().toISOString()}`);
        try {
            const results = await runAutoContributions();
            const applied = results.filter(r => r.status === 'applied').length;
            const other   = results.length - applied;
            console.log(`[Scheduler] Done — applied: ${applied}, skipped/other: ${other}`);
        } catch (err) {
            console.error('[Scheduler] Error:', err.message);
        }
    });
    console.log('[Scheduler] Daily auto-contribution job registered (00:05 daily)');
}

module.exports = { runAutoContributions, getNextContributionDate, startScheduler };
