const pool = require('../data/db');
const { runAutoContributions, getNextContributionDate } = require('../services/schedulerService');
const {
    calcProgress,
    calcMonthsRemaining,
    calcDeadlineContribution,
    calcMonthsBetween,
    isTargetDateValid,
} = require('../services/goalCalculations');

// ═══════════════════════════════════════════════════════════════════════════════
// ROW → CLIENT FORMAT
// ═══════════════════════════════════════════════════════════════════════════════

function rowToPocket(row) {
    const pocket = {
        id:                    row.id,
        userId:                row.user_id,
        name:                  row.name,
        isSystem:              row.is_system,
        percentage:            row.percentage != null ? parseFloat(row.percentage) : undefined,
        balance:               parseFloat(row.balance),
        lastContributionDate:  row.last_contribution_date ?? null,
        goal: row.goal_id ? {
            enabled:              true,
            title:                row.title,
            targetAmount:         parseFloat(row.target_amount),
            monthlyContribution:  parseFloat(row.monthly_contribution),
            mode:                 row.mode,
            targetDate:           row.target_date ?? null,
            startDate:            row.start_date  ?? null,
            endDate:              row.end_date     ?? null,
            contributionDay:      row.contribution_day,
            isActive:             row.is_active,
            sourcePocket:         row.source_pocket ?? 'expenses',
        } : null,
    };
    return pocket;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE STATUS + ENRICH (pure — no DB)
// ═══════════════════════════════════════════════════════════════════════════════

function getScheduleStatus(pocket) {
    const goal = pocket.goal;
    if (!goal?.enabled || goal?.contributionDay == null) return 'no_schedule';
    const today = new Date().toISOString().slice(0, 10);
    if (pocket.balance >= goal.targetAmount) return 'completed';
    if (goal.endDate && today > goal.endDate)  return 'expired';
    if (!goal.isActive)                        return 'paused';
    if (goal.startDate && today < goal.startDate) return 'pending';
    return 'active';
}

function enrichPocket(pocket) {
    if (!pocket.goal?.enabled) return { ...pocket };
    const g = pocket.goal;
    return {
        ...pocket,
        goal: {
            ...g,
            progress:          calcProgress(pocket.balance, g.targetAmount),
            monthsRemaining:   calcMonthsRemaining(pocket.balance, g.targetAmount, g.monthlyContribution ?? 0),
            scheduleStatus:    getScheduleStatus(pocket),
            nextContributionDate: g.contributionDay
                ? getNextContributionDate(g.contributionDay, pocket.lastContributionDate)
                : null,
            monthsBetweenNowAndTarget: g.targetDate ? calcMonthsBetween(g.targetDate) : null,
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOAL PARSING (pure — no DB)
// ═══════════════════════════════════════════════════════════════════════════════

function parseGoal(goalInput, currentBalance = 0) {
    if (!goalInput?.enabled) return { parsedGoal: null };

    if (!goalInput.title?.trim()) return { error: 'Goal title is required' };

    const targetAmount = parseFloat(goalInput.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) return { error: 'targetAmount must be a positive number' };

    const mode = goalInput.mode === 'deadline' ? 'deadline' : 'monthly';
    let monthlyContribution = 0;
    let targetDate = null;

    if (mode === 'monthly') {
        monthlyContribution = parseFloat(goalInput.monthlyContribution ?? 0);
        if (isNaN(monthlyContribution) || monthlyContribution < 0)
            return { error: 'monthlyContribution must be a non-negative number' };
    } else {
        if (!goalInput.targetDate) return { error: 'targetDate is required in deadline mode' };
        if (!isTargetDateValid(goalInput.targetDate)) return { error: 'targetDate must be at least one full month in the future' };
        targetDate = goalInput.targetDate;
        const derived = calcDeadlineContribution(currentBalance, targetAmount, targetDate);
        if (derived === null) return { error: 'Could not calculate monthly contribution' };
        monthlyContribution = derived;
    }

    let contributionDay = null, startDate = null, endDate = null, isActive = false;

    if (monthlyContribution > 0) {
        contributionDay = parseInt(goalInput.contributionDay ?? 1);
        if (isNaN(contributionDay) || contributionDay < 1 || contributionDay > 31)
            return { error: 'contributionDay must be between 1 and 31' };

        startDate = goalInput.startDate ?? new Date().toISOString().slice(0, 10);

        if (goalInput.endDate) {
            if (goalInput.endDate <= startDate) return { error: 'endDate must be after startDate' };
            endDate = goalInput.endDate;
        }
        if (mode === 'deadline' && !endDate) endDate = targetDate;

        isActive = goalInput.isActive !== false;
    }

    const VALID_SOURCES = ['expenses', 'savings', 'commitments'];
    const sourcePocket = monthlyContribution > 0
        ? (VALID_SOURCES.includes(goalInput.sourcePocket) ? goalInput.sourcePocket : 'expenses')
        : 'expenses';

    return {
        parsedGoal: {
            enabled: true,
            title: goalInput.title.trim(),
            targetAmount,
            mode,
            monthlyContribution,
            targetDate,
            startDate,
            endDate,
            contributionDay,
            isActive,
            sourcePocket,
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED QUERY — fetch one pocket with its goal
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchPocketById(pocketId) {
    const { rows } = await pool.query(
        `SELECT p.id, p.user_id, p.name, p.is_system, p.percentage, p.balance, p.last_contribution_date,
                g.id AS goal_id, g.title, g.target_amount, g.monthly_contribution, g.mode,
                g.target_date, g.start_date, g.end_date, g.contribution_day, g.is_active, g.source_pocket
         FROM qisma_pockets p
         LEFT JOIN qisma_pocket_goals g ON g.pocket_id = p.id
         WHERE p.id = $1`,
        [pocketId]
    );
    return rows[0] ? rowToPocket(rows[0]) : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERCENTAGES
// ═══════════════════════════════════════════════════════════════════════════════

async function getUserPercentages(req, res) {
    const userId = parseInt(req.params.userId);
    try {
        const { rows } = await pool.query(
            'SELECT name, percentage FROM qisma_pockets WHERE user_id = $1 AND is_system = TRUE',
            [userId]
        );
        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        const find = name => parseFloat(rows.find(p => p.name === name)?.percentage ?? 0);
        return res.status(200).json({ expenses: find('expenses'), savings: find('savings'), commitments: find('commitments') });
    } catch (err) { return res.status(500).json({ error: err.message }); }
}

async function updatePercentages(req, res) {
    const { userId, expenses, savings, commitments } = req.body;
    if (!userId || expenses === undefined || savings === undefined || commitments === undefined)
        return res.status(400).json({ error: 'userId, expenses, savings, and commitments are required' });

    const [exp, sav, com] = [parseFloat(expenses), parseFloat(savings), parseFloat(commitments)];
    if ([exp, sav, com].some(isNaN))      return res.status(400).json({ error: 'All percentages must be valid numbers' });
    if ([exp, sav, com].some(v => v < 0)) return res.status(400).json({ error: 'Percentages cannot be negative' });
    if (Math.abs(exp + sav + com - 1) > 0.01)
        return res.status(400).json({ error: `Percentages must sum to 1. Got: ${(exp + sav + com).toFixed(2)}` });

    try {
        await pool.query('UPDATE qisma_pockets SET percentage = $1 WHERE user_id = $2 AND name = $3', [exp, userId, 'expenses']);
        await pool.query('UPDATE qisma_pockets SET percentage = $1 WHERE user_id = $2 AND name = $3', [sav, userId, 'savings']);
        await pool.query('UPDATE qisma_pockets SET percentage = $1 WHERE user_id = $2 AND name = $3', [com, userId, 'commitments']);
        return res.status(200).json({ message: 'Percentages updated', percentages: { expenses: exp, savings: sav, commitments: com } });
    } catch (err) { return res.status(500).json({ error: err.message }); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET ALL POCKETS FOR USER
// ═══════════════════════════════════════════════════════════════════════════════

async function getUserPockets(req, res) {
    const userId = parseInt(req.params.userId);
    try {
        const { rows: [user] } = await pool.query('SELECT id, balance FROM qisma_users WHERE id = $1', [userId]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { rows } = await pool.query(
            `SELECT p.id, p.user_id, p.name, p.is_system, p.percentage, p.balance, p.last_contribution_date,
                    g.id AS goal_id, g.title, g.target_amount, g.monthly_contribution, g.mode,
                    g.target_date, g.start_date, g.end_date, g.contribution_day, g.is_active, g.source_pocket
             FROM qisma_pockets p
             LEFT JOIN qisma_pocket_goals g ON g.pocket_id = p.id
             WHERE p.user_id = $1
             ORDER BY p.is_system DESC, p.id ASC`,
            [userId]
        );

        const result = rows.map(row => {
            const pocket = rowToPocket(row);
            return pocket.isSystem ? pocket : enrichPocket(pocket);
        });

        return res.status(200).json(result);
    } catch (err) { return res.status(500).json({ error: err.message }); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE CUSTOM POCKET
// ═══════════════════════════════════════════════════════════════════════════════

async function createPocket(req, res) {
    const { userId, name, goal } = req.body;
    if (!userId || !name?.trim()) return res.status(400).json({ error: 'userId and name are required' });

    const { rows: [user] } = await pool.query('SELECT id FROM qisma_users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { rows: [dup] } = await pool.query(
        'SELECT id FROM qisma_pockets WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND is_system = FALSE',
        [userId, name.trim()]
    );
    if (dup) return res.status(409).json({ error: 'A pocket with this name already exists' });

    const { error, parsedGoal } = parseGoal(goal, 0);
    if (error) return res.status(400).json({ error });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows: [newPocket] } = await client.query(
            'INSERT INTO qisma_pockets (user_id, name, is_system, balance) VALUES ($1, $2, FALSE, 0) RETURNING id',
            [userId, name.trim()]
        );

        if (parsedGoal) {
            await client.query(
                `INSERT INTO qisma_pocket_goals
                    (pocket_id, title, target_amount, monthly_contribution, mode, target_date, start_date, end_date, contribution_day, is_active, source_pocket)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                [newPocket.id, parsedGoal.title, parsedGoal.targetAmount, parsedGoal.monthlyContribution,
                 parsedGoal.mode, parsedGoal.targetDate, parsedGoal.startDate, parsedGoal.endDate,
                 parsedGoal.contributionDay, parsedGoal.isActive, parsedGoal.sourcePocket]
            );
        }

        await client.query('COMMIT');

        const pocket = await fetchPocketById(newPocket.id);
        return res.status(201).json(enrichPocket(pocket));
    } catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE POCKET (edit name + goal)
// ═══════════════════════════════════════════════════════════════════════════════

async function updatePocket(req, res) {
    const pocketId = parseInt(req.params.pocketId);
    const pocket = await fetchPocketById(pocketId);
    if (!pocket) return res.status(404).json({ error: 'Pocket not found' });

    const { name, goal } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (name !== undefined) {
            if (!name?.trim()) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'name cannot be empty' }); }
            const { rows: [dup] } = await client.query(
                'SELECT id FROM qisma_pockets WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND is_system = FALSE AND id <> $3',
                [pocket.userId, name.trim(), pocketId]
            );
            if (dup) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'A pocket with this name already exists' }); }
            await client.query('UPDATE qisma_pockets SET name = $1 WHERE id = $2', [name.trim(), pocketId]);
        }

        if (goal !== undefined) {
            if (goal === null || goal.enabled === false) {
                await client.query('DELETE FROM qisma_pocket_goals WHERE pocket_id = $1', [pocketId]);
            } else {
                const { error, parsedGoal } = parseGoal(goal, pocket.balance);
                if (error) { await client.query('ROLLBACK'); return res.status(400).json({ error }); }

                await client.query(
                    `INSERT INTO qisma_pocket_goals
                        (pocket_id, title, target_amount, monthly_contribution, mode, target_date, start_date, end_date, contribution_day, is_active, source_pocket)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                     ON CONFLICT (pocket_id) DO UPDATE SET
                        title = EXCLUDED.title,
                        target_amount = EXCLUDED.target_amount,
                        monthly_contribution = EXCLUDED.monthly_contribution,
                        mode = EXCLUDED.mode,
                        target_date = EXCLUDED.target_date,
                        start_date = EXCLUDED.start_date,
                        end_date = EXCLUDED.end_date,
                        contribution_day = EXCLUDED.contribution_day,
                        is_active = EXCLUDED.is_active,
                        source_pocket = EXCLUDED.source_pocket`,
                    [pocketId, parsedGoal.title, parsedGoal.targetAmount, parsedGoal.monthlyContribution,
                     parsedGoal.mode, parsedGoal.targetDate, parsedGoal.startDate, parsedGoal.endDate,
                     parsedGoal.contributionDay, parsedGoal.isActive, parsedGoal.sourcePocket]
                );
            }
        }

        await client.query('COMMIT');

        const updated = await fetchPocketById(pocketId);
        return res.status(200).json(enrichPocket(updated));
    } catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// APPLY CONTRIBUTIONS (manual trigger)
// ═══════════════════════════════════════════════════════════════════════════════

async function applyMonthlyContributions(req, res) {
    const userId = parseInt(req.body.userId);
    const { rows: [user] } = await pool.query('SELECT id FROM qisma_users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    try {
        const results = await runAutoContributions(userId);
        return res.status(200).json({ message: 'Contributions processed', results });
    } catch (err) { return res.status(500).json({ error: err.message }); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAUSE / RESUME SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════════

async function updateSchedule(req, res) {
    const pocketId = parseInt(req.params.pocketId);
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive must be a boolean' });

    const pocket = await fetchPocketById(pocketId);
    if (!pocket) return res.status(404).json({ error: 'Pocket not found' });
    if (!pocket.goal?.enabled) return res.status(400).json({ error: 'Pocket has no goal/schedule' });

    try {
        await pool.query('UPDATE qisma_pocket_goals SET is_active = $1 WHERE pocket_id = $2', [isActive, pocketId]);
        const updated = await fetchPocketById(pocketId);
        return res.status(200).json({ message: `Schedule ${isActive ? 'resumed' : 'paused'}`, pocket: enrichPocket(updated) });
    } catch (err) { return res.status(500).json({ error: err.message }); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATE (pure preview, no DB write)
// ═══════════════════════════════════════════════════════════════════════════════

async function calculateGoal(req, res) {
    const { mode, targetAmount, monthlyContribution, targetDate, currentBalance = 0 } = req.body;
    const target = parseFloat(targetAmount);
    const balance = parseFloat(currentBalance);
    if (isNaN(target) || target <= 0) return res.status(400).json({ error: 'targetAmount must be a positive number' });

    if (mode === 'deadline') {
        if (!targetDate) return res.status(400).json({ error: 'targetDate required for deadline mode' });
        if (!isTargetDateValid(targetDate)) return res.status(400).json({ error: 'targetDate must be at least 1 month in the future' });
        const months  = calcMonthsBetween(targetDate);
        const derived = calcDeadlineContribution(balance, target, targetDate);
        return res.status(200).json({ mode: 'deadline', monthlyContribution: derived, monthsBetween: months, monthsRemaining: months });
    } else {
        const contrib = parseFloat(monthlyContribution ?? 0);
        if (isNaN(contrib) || contrib < 0) return res.status(400).json({ error: 'monthlyContribution must be a non-negative number' });
        return res.status(200).json({ mode: 'monthly', monthlyContribution: contrib, monthsRemaining: calcMonthsRemaining(balance, target, contrib) });
    }
}

module.exports = {
    getUserPercentages,
    getUserPockets,
    updatePercentages,
    createPocket,
    applyMonthlyContributions,
    updateSchedule,
    updatePocket,
    calculateGoal,
};
