/**
 * services/schedulerService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * LEVEL 5 — Smart Auto-Contribution Scheduler
 *
 * Responsibilities:
 *  1. runAutoContributions()  — the core engine; safe to call any time
 *  2. startScheduler()        — wires up a daily cron job (called once at boot)
 *  3. getNextContributionDate() — pure helper consumed by enrichPocket()
 *
 * Design principles:
 *  - Idempotent: running twice in the same calendar month is a no-op
 *  - Non-destructive: never deducts more than the user's available balance
 *  - Decoupled: no Express dependency — pure data logic against db
 *  - Observable: returns a structured result object for logging / API response
 * ─────────────────────────────────────────────────────────────────────────────
 */

const cron = require('node-cron');
const db   = require('../data/db');

// ─────────────────────────────────────────────────────────────────────────────
// PURE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return today's date-only string in YYYY-MM-DD format (local time).
 * Using local time intentionally — contribution days are user-facing calendar days.
 */
function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Return the YYYY-MM prefix for the current month, used for idempotency checks.
 */
function thisMonthPrefix() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calculate the next date (ISO string) on which a contribution will be applied.
 *
 * Rules:
 *  - If today's day < contributionDay  → next contribution is this month on contributionDay
 *  - If today's day >= contributionDay → next contribution is next month on contributionDay
 *  - If the pocket was already contributed to this month → same next-month logic
 *
 * @param {number}      contributionDay  1–28
 * @param {string|null} lastContribDate  ISO string of last contribution, or null
 * @returns {string}  ISO date string YYYY-MM-DD
 */
function getNextContributionDate(contributionDay, lastContribDate) {
    const now      = new Date();
    const today    = now.getDate();
    const month    = now.getMonth();   // 0-based
    const year     = now.getFullYear();
    const prefix   = thisMonthPrefix();

    // Already applied this month → next run is next month
    const alreadyApplied = lastContribDate?.startsWith(prefix);

    let targetYear  = year;
    let targetMonth = month;

    if (alreadyApplied || today >= contributionDay) {
        // Push to next month
        targetMonth += 1;
        if (targetMonth > 11) {
            targetMonth = 0;
            targetYear += 1;
        }
    }

    return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(contributionDay).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * runAutoContributions(filterUserId?)
 *
 * Iterates every active scheduled custom pocket and applies contributions
 * where all conditions are met.
 *
 * Can be scoped to a single user (pass userId) or run globally (omit userId).
 * Returns a detailed result array — useful for logging and API responses.
 *
 * @param {number|null} filterUserId  — optional; scope to a single user
 * @returns {Array<object>}           — result records per pocket
 */
function runAutoContributions(filterUserId = null) {
    const today      = new Date();
    const todayDay   = today.getDate();              // numeric day of month (1–31)
    const todayISO   = todayString();                // "YYYY-MM-DD"
    const monthKey   = thisMonthPrefix();            // "YYYY-MM"

    const results = [];

    // Scope: all pockets, or one user's pockets
    const candidates = db.customPockets.filter(p =>
        (filterUserId === null || p.userId === filterUserId) &&
        p.goal?.enabled &&
        p.goal?.isActive === true &&
        p.goal?.monthlyContribution > 0
    );

    for (const pocket of candidates) {
        const goal = pocket.goal;
        const user = db.users.find(u => u.id === pocket.userId);

        // ── Safety: user must exist ──────────────────────────────────────────
        if (!user) {
            results.push({ id: pocket.id, name: pocket.name, status: 'error', reason: 'user not found' });
            continue;
        }

        // ── 1. Check isActive ────────────────────────────────────────────────
        // (already filtered above, but be explicit for clarity)
        if (!goal.isActive) {
            results.push({ id: pocket.id, name: pocket.name, status: 'skipped', reason: 'schedule paused' });
            continue;
        }

        // ── 2. Check startDate ───────────────────────────────────────────────
        if (goal.startDate && todayISO < goal.startDate) {
            results.push({ id: pocket.id, name: pocket.name, status: 'pending', reason: `starts on ${goal.startDate}` });
            continue;
        }

        // ── 3. Check endDate ─────────────────────────────────────────────────
        if (goal.endDate && todayISO > goal.endDate) {
            // Auto-deactivate when schedule has expired
            goal.isActive = false;
            results.push({ id: pocket.id, name: pocket.name, status: 'expired', reason: `end date ${goal.endDate} passed` });
            continue;
        }

        // ── 4. Check contributionDay matches today ───────────────────────────
        if (todayDay !== goal.contributionDay) {
            const nextDate = getNextContributionDate(goal.contributionDay, pocket.lastContributionDate);
            results.push({ id: pocket.id, name: pocket.name, status: 'waiting', reason: `next contribution on ${nextDate}` });
            continue;
        }

        // ── 5. Idempotency: already applied this month? ──────────────────────
        if (pocket.lastContributionDate?.startsWith(monthKey)) {
            results.push({ id: pocket.id, name: pocket.name, status: 'skipped', reason: 'already applied this month' });
            continue;
        }

        // ── 6. Check goal not already reached ───────────────────────────────
        if (pocket.balance >= goal.targetAmount) {
            goal.isActive = false; // auto-deactivate completed goals
            results.push({ id: pocket.id, name: pocket.name, status: 'completed', reason: 'goal already reached' });
            continue;
        }

        // ── 7. Check user has sufficient balance ─────────────────────────────
        const contrib   = goal.monthlyContribution;
        const remaining = goal.targetAmount - pocket.balance;
        const toApply   = Math.min(contrib, remaining);   // never overshoot target

        if (user.balance < toApply) {
            results.push({
                id: pocket.id, name: pocket.name, status: 'insufficient_balance',
                reason: `need ${toApply}, user balance is ${user.balance}`,
            });
            continue;
        }

        // ── 8. Apply contribution ────────────────────────────────────────────
        user.balance          -= toApply;   // deduct from user's main wallet
        pocket.balance        += toApply;   // credit pocket
        goal.currentAmount     = pocket.balance;
        pocket.lastContributionDate = today.toISOString();

        // Auto-deactivate if goal now reached
        if (pocket.balance >= goal.targetAmount) {
            goal.isActive = false;
        }

        // Log as a transaction for analytics
        db.transactions.push({
            id:        db.transactions.length + 1,
            userId:    pocket.userId,
            type:      'auto_contribution',
            pocketId:  pocket.id,
            pocketName: pocket.name,
            amount:    toApply,
            createdAt: today.toISOString(),
        });

        results.push({
            id:         pocket.id,
            name:       pocket.name,
            status:     'applied',
            applied:    toApply,
            newBalance: pocket.balance,
            goalReached: pocket.balance >= goal.targetAmount,
        });
    }

    return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// CRON SCHEDULER — runs daily at 00:05
// ─────────────────────────────────────────────────────────────────────────────

/**
 * startScheduler()
 *
 * Call once at server boot (in server.js).
 * Schedules a daily cron job at 00:05 AM that runs runAutoContributions()
 * for all users globally.
 *
 * Using 00:05 (not midnight) to avoid exact-midnight race conditions.
 */
function startScheduler() {
    // Cron pattern: "minute hour day month weekday"
    // "5 0 * * *" = every day at 00:05
    cron.schedule('5 0 * * *', () => {
        console.log(`[Scheduler] Running auto-contributions — ${new Date().toISOString()}`);
        const results = runAutoContributions();
        const applied  = results.filter(r => r.status === 'applied').length;
        const skipped  = results.filter(r => r.status !== 'applied').length;
        console.log(`[Scheduler] Done — applied: ${applied}, skipped/other: ${skipped}`);
    });

    console.log('[Scheduler] Daily auto-contribution job registered (00:05 daily)');
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
    runAutoContributions,
    getNextContributionDate,
    startScheduler,
};
