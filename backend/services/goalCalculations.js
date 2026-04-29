/**
 * services/goalCalculations.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure calculation functions for the dual-mode goal system.
 * No side effects. No DB access. No Express dependency.
 *
 * These are the single source of truth for all goal math.
 * Frontend mirrors these functions locally (no API round-trip for UI feedback).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * calcProgress
 * ─────────────────────────────────────────────────────────────────────────────
 * How far along is the pocket toward its target? Returns 0–100, capped at 100.
 * Safe against division by zero.
 *
 * @param {number} balance       current pocket balance
 * @param {number} targetAmount  goal target
 * @returns {number}             0–100
 */
function calcProgress(balance, targetAmount) {
    if (!targetAmount || targetAmount <= 0) return 0;
    return Math.min(100, Math.round((balance / targetAmount) * 100));
}

/**
 * calcMonthsRemaining  [MODE: monthly]
 * ─────────────────────────────────────────────────────────────────────────────
 * Given a fixed monthly contribution, how many months until the goal is reached?
 *
 * Formula: ceil((target - balance) / monthlyContribution)
 *
 * @param {number} balance              current pocket balance
 * @param {number} targetAmount         goal target
 * @param {number} monthlyContribution  SAR saved per month
 * @returns {number|null}               months remaining, or null when not applicable
 */
function calcMonthsRemaining(balance, targetAmount, monthlyContribution) {
    if (!monthlyContribution || monthlyContribution <= 0) return null;
    const remaining = targetAmount - balance;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / monthlyContribution);
}

/**
 * calcMonthsBetween
 * ─────────────────────────────────────────────────────────────────────────────
 * Number of whole calendar months between today and a future target date.
 * Returns 0 for dates in the past or same month.
 *
 * Uses year/month arithmetic (not milliseconds) so it's immune to DST and
 * varying month lengths.
 *
 * @param {string} targetDateISO  YYYY-MM-DD
 * @returns {number}              months between today and target (≥ 0)
 */
function calcMonthsBetween(targetDateISO) {
    const now    = new Date();
    const target = new Date(targetDateISO + 'T00:00:00');   // local midnight
    const months =
        (target.getFullYear() - now.getFullYear()) * 12 +
        (target.getMonth()    - now.getMonth());
    return Math.max(0, months);
}

/**
 * calcDeadlineContribution  [MODE: deadline]
 * ─────────────────────────────────────────────────────────────────────────────
 * Given a target date, how much must be saved per month to hit the goal?
 *
 * Formula: ceil((target - balance) / monthsBetween)
 *
 * Returns null when:
 *  - targetDate is in the past or same month (division by zero)
 *  - goal is already reached (remaining ≤ 0)
 *
 * @param {number} balance         current pocket balance
 * @param {number} targetAmount    goal target
 * @param {string} targetDateISO   YYYY-MM-DD
 * @returns {number|null}          required monthly contribution, or null
 */
function calcDeadlineContribution(balance, targetAmount, targetDateISO) {
    if (!targetDateISO) return null;
    const months = calcMonthsBetween(targetDateISO);
    if (months <= 0) return null;
    const remaining = targetAmount - balance;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / months);
}

/**
 * isTargetDateValid
 * ─────────────────────────────────────────────────────────────────────────────
 * A target date is valid only if it is at least one full month in the future.
 * Prevents division by zero in calcDeadlineContribution.
 *
 * @param {string} targetDateISO  YYYY-MM-DD
 * @returns {boolean}
 */
function isTargetDateValid(targetDateISO) {
    return calcMonthsBetween(targetDateISO) >= 1;
}

module.exports = {
    calcProgress,
    calcMonthsRemaining,
    calcMonthsBetween,
    calcDeadlineContribution,
    isTargetDateValid,
};
