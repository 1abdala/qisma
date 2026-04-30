/**
 * controllers/pocketsController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Smart Goal-Based Pocket System — Levels 1–6
 *
 * L1  Basic create / fetch
 * L2  Optional goal
 * L3  Progress tracking
 * L4  Monthly auto-contributions (manual trigger)
 * L5  Scheduled auto-contributions (cron + start/end dates + pause/resume)
 * L6  Dual goal modes (monthly vs deadline) + full edit capability
 *
 * Original percentage-based system: completely untouched.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const db = require('../data/db');
const { runAutoContributions, getNextContributionDate } = require('../services/schedulerService');
const {
  calcProgress,
  calcMonthsRemaining,
  calcDeadlineContribution,
  isTargetDateValid,
} = require('../services/goalCalculations');

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function findUser(res, userId) {
  const user = db.users.find(u => u.id === userId);
  if (!user) { res.status(404).json({ error: 'User not found' }); return null; }
  return user;
}

function findPocket(res, pocketId) {
  const pocket = db.customPockets.find(p => p.id === pocketId);
  if (!pocket) { res.status(404).json({ error: 'Pocket not found' }); return null; }
  return pocket;
}

// ─── L5: Schedule status ──────────────────────────────────────────────────────
function getScheduleStatus(pocket) {
  const goal = pocket.goal;
  if (!goal?.enabled || goal?.contributionDay == null) return 'no_schedule';

  const todayISO = new Date().toISOString().slice(0, 10);

  if (pocket.balance >= goal.targetAmount) return 'completed';
  if (goal.endDate && todayISO > goal.endDate) return 'expired';
  if (!goal.isActive) return 'paused';
  if (goal.startDate && todayISO < goal.startDate) return 'pending';
  return 'active';
}

/**
 * enrichPocket — attaches all computed/derived fields before sending to client.
 * Frontend never recalculates — it only renders what the API returns.
 */
function enrichPocket(pocket) {
  if (!pocket.goal?.enabled) return { ...pocket };

  const g = pocket.goal;
  const balance = pocket.balance;

  return {
    ...pocket,
    goal: {
      ...g,
      // L3
      progress: calcProgress(balance, g.targetAmount),
      // L4/L6: months remaining is meaningful in both modes
      monthsRemaining: calcMonthsRemaining(balance, g.targetAmount, g.monthlyContribution ?? 0),
      // L5
      scheduleStatus: getScheduleStatus(pocket),
      nextContributionDate: g.contributionDay
        ? getNextContributionDate(g.contributionDay, pocket.lastContributionDate)
        : null,
      // L6: deadline mode — show months between today and target date
      monthsBetweenNowAndTarget: g.targetDate
        ? (() => { const { calcMonthsBetween } = require('../services/goalCalculations'); return calcMonthsBetween(g.targetDate); })()
        : null,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOAL PARSING — shared between createPocket and updatePocket
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * parseGoal(goalInput, currentBalance)
 *
 * Validates and normalises the goal object from a request body.
 * Handles both modes:
 *   - "monthly"  → user provides monthlyContribution; system derives monthsRemaining
 *   - "deadline" → user provides targetDate; system DERIVES monthlyContribution
 *
 * @param {object} goalInput      raw goal from req.body
 * @param {number} currentBalance current pocket balance (0 for new pockets)
 * @returns {{ error: string } | { parsedGoal: object }}
 */
function parseGoal(goalInput, currentBalance = 0) {
  if (!goalInput?.enabled) return { parsedGoal: null };

  // ── Required base fields ──────────────────────────────────────────────────
  if (!goalInput.title?.trim()) {
    return { error: 'Goal title is required' };
  }

  const targetAmount = parseFloat(goalInput.targetAmount);
  if (isNaN(targetAmount) || targetAmount <= 0) {
    return { error: 'targetAmount must be a positive number' };
  }

  // ── L6: Mode validation ───────────────────────────────────────────────────
  const mode = goalInput.mode === 'deadline' ? 'deadline' : 'monthly';

  let monthlyContribution = 0;
  let targetDate = null;

  if (mode === 'monthly') {
    monthlyContribution = parseFloat(goalInput.monthlyContribution ?? 0);
    if (isNaN(monthlyContribution) || monthlyContribution < 0) {
      return { error: 'monthlyContribution must be a non-negative number' };
    }
  } else {
    // deadline mode
    if (!goalInput.targetDate) {
      return { error: 'targetDate is required in deadline mode' };
    }
    if (!isTargetDateValid(goalInput.targetDate)) {
      return { error: 'targetDate must be at least one full month in the future' };
    }
    targetDate = goalInput.targetDate;

    // Derive monthlyContribution — NEVER accept from client in this mode
    const derived = calcDeadlineContribution(currentBalance, targetAmount, targetDate);
    if (derived === null) {
      return { error: 'Could not calculate monthly contribution — check targetDate and targetAmount' };
    }
    monthlyContribution = derived;
  }

  // ── Schedule fields (required when monthlyContribution > 0) ──────────────
  let contributionDay = null;
  let startDate = null;
  let endDate = null;
  let isActive = false;

  if (monthlyContribution > 0) {
    contributionDay = parseInt(goalInput.contributionDay ?? 1);
    if (isNaN(contributionDay) || contributionDay < 1 || contributionDay > 31) {
      return { error: 'contributionDay must be between 1 and 31' };
    }

    startDate = goalInput.startDate ?? new Date().toISOString().slice(0, 10);

    if (goalInput.endDate) {
      if (goalInput.endDate <= startDate) {
        return { error: 'endDate must be after startDate' };
      }
      endDate = goalInput.endDate;
    }

    // In deadline mode, endDate defaults to targetDate when not set explicitly
    if (mode === 'deadline' && !endDate) {
      endDate = targetDate;
    }

    isActive = goalInput.isActive !== false;
  }

  return {
    parsedGoal: {
      enabled: true,
      title: goalInput.title.trim(),
      targetAmount,
      currentAmount: currentBalance,   // updated on each contribution
      mode,                            // L6: "monthly" | "deadline"
      monthlyContribution,             // always populated; derived in deadline mode
      targetDate,                      // null in monthly mode
      // Schedule fields
      startDate,
      endDate,
      contributionDay,
      isActive,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORIGINAL CONTROLLERS (PERCENTAGE-BASED — UNCHANGED)
// ═══════════════════════════════════════════════════════════════════════════════

function getUserPercentages(req, res) {
  const userId = parseInt(req.params.userId);
  const user = findUser(res, userId);
  if (!user) return;

  const userPockets = db.pockets.filter(p => p.userId === userId);
  return res.status(200).json({
    expenses: userPockets.find(p => p.name === 'expenses')?.percentage ?? 0.5,
    savings: userPockets.find(p => p.name === 'savings')?.percentage ?? 0.3,
    commitments: userPockets.find(p => p.name === 'commitments')?.percentage ?? 0.2,
  });
}

function getUserPockets(req, res) {
  const userId = parseInt(req.params.userId);
  const user = findUser(res, userId);
  if (!user) return;

  const systemPockets = db.pockets
    .filter(p => p.userId === userId)
    .map(p => ({ ...p, balance: user.balance * p.percentage, isSystem: true }));

  const customPockets = db.customPockets
    .filter(p => p.userId === userId)
    .map(p => enrichPocket({ ...p, isSystem: false }));

  return res.status(200).json([...systemPockets, ...customPockets]);
}

function updatePercentages(req, res) {
  const { userId, expenses, savings, commitments } = req.body;
  if (!userId || expenses === undefined || savings === undefined || commitments === undefined) {
    return res.status(400).json({ error: 'userId, expenses, savings, and commitments are required' });
  }
  const user = findUser(res, parseInt(userId));
  if (!user) return;

  const [exp, sav, com] = [parseFloat(expenses), parseFloat(savings), parseFloat(commitments)];
  if ([exp, sav, com].some(isNaN)) return res.status(400).json({ error: 'All percentages must be valid numbers' });
  if ([exp, sav, com].some(v => v < 0)) return res.status(400).json({ error: 'Percentages cannot be negative' });
  if (Math.abs(exp + sav + com - 1) > 0.01) {
    return res.status(400).json({ error: `Percentages must sum to 1. Got: ${(exp + sav + com).toFixed(2)}` });
  }

  const iUId = parseInt(userId);
  const fp = name => db.pockets.find(p => p.userId === iUId && p.name === name);
  const ep = fp('expenses'); if (ep) ep.percentage = exp;
  const sp = fp('savings'); if (sp) sp.percentage = sav;
  const cp = fp('commitments'); if (cp) cp.percentage = com;

  return res.status(200).json({ message: 'Percentages updated successfully', percentages: { expenses: exp, savings: sav, commitments: com } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// L1: CREATE CUSTOM POCKET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/pockets
 * Body: { userId, name, goal? }
 * See parseGoal() for full goal schema.
 */
function createPocket(req, res) {
  const { userId, name, goal } = req.body;

  if (!userId || !name?.trim()) {
    return res.status(400).json({ error: 'userId and name are required' });
  }

  const user = findUser(res, parseInt(userId));
  if (!user) return;

  const duplicate = db.customPockets.find(
    p => p.userId === parseInt(userId) && p.name.toLowerCase() === name.trim().toLowerCase()
  );
  if (duplicate) return res.status(409).json({ error: 'A pocket with this name already exists' });

  const { error, parsedGoal } = parseGoal(goal, 0);
  if (error) return res.status(400).json({ error });

  const newPocket = {
    id: db._nextCustomPocketId++,
    userId: parseInt(userId),
    name: name.trim(),
    balance: 0,
    goal: parsedGoal,
    lastContributionDate: null,
  };

  db.customPockets.push(newPocket);
  return res.status(201).json(enrichPocket(newPocket));
}

// ═══════════════════════════════════════════════════════════════════════════════
// L6: EDIT POCKET
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PUT /api/pockets/:pocketId
 *
 * Full edit: name, goal fields, mode switch.
 *
 * Rules:
 *  - balance and lastContributionDate are NEVER modified by this endpoint
 *  - In deadline mode, monthlyContribution is always recalculated from current balance
 *  - Switching mode resets the other mode's unique fields cleanly
 *  - userId cannot be changed
 */
function updatePocket(req, res) {
  const pocketId = parseInt(req.params.pocketId);
  const pocket = findPocket(res, pocketId);
  if (!pocket) return;

  const { name, goal } = req.body;

  // ── Name update ───────────────────────────────────────────────────────────
  if (name !== undefined) {
    if (!name?.trim()) return res.status(400).json({ error: 'name cannot be empty' });

    // Check duplicate name — exclude this pocket itself
    const duplicate = db.customPockets.find(
      p => p.id !== pocketId &&
        p.userId === pocket.userId &&
        p.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) return res.status(409).json({ error: 'A pocket with this name already exists' });
    pocket.name = name.trim();
  }

  // ── Goal update ───────────────────────────────────────────────────────────
  if (goal !== undefined) {
    if (goal === null || goal.enabled === false) {
      // Removing the goal entirely
      pocket.goal = null;
    } else {
      // Re-parse using CURRENT balance — critical for deadline recalculation
      const { error, parsedGoal } = parseGoal(goal, pocket.balance);
      if (error) return res.status(400).json({ error });

      // Preserve the contribution history — never overwrite with 0
      if (parsedGoal) {
        parsedGoal.currentAmount = pocket.balance;
      }

      pocket.goal = parsedGoal;
    }
  }

  return res.status(200).json(enrichPocket(pocket));
}

// ═══════════════════════════════════════════════════════════════════════════════
// L4: MANUAL CONTRIBUTION TRIGGER
// ═══════════════════════════════════════════════════════════════════════════════

function applyMonthlyContributions(req, res) {
  const userId = parseInt(req.body.userId);
  const user = findUser(res, userId);
  if (!user) return;

  const results = runAutoContributions(userId);
  const monthKey = new Date().toISOString().slice(0, 7);

  return res.status(200).json({ message: 'Contributions processed', month: monthKey, results });
}

// ═══════════════════════════════════════════════════════════════════════════════
// L5: PAUSE / RESUME SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════════

function updateSchedule(req, res) {
  const pocketId = parseInt(req.params.pocketId);
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be a boolean' });
  }

  const pocket = findPocket(res, pocketId);
  if (!pocket) return;
  if (!pocket.goal?.enabled) return res.status(400).json({ error: 'Pocket has no goal/schedule' });

  pocket.goal.isActive = isActive;
  return res.status(200).json({ message: `Schedule ${isActive ? 'resumed' : 'paused'}`, pocket: enrichPocket(pocket) });
}

// ═══════════════════════════════════════════════════════════════════════════════
// L6: RECALCULATE — instant feedback for deadline mode without saving
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/pockets/calculate
 * Body: { mode, targetAmount, monthlyContribution?, targetDate?, currentBalance? }
 *
 * Pure calculation endpoint — no DB writes.
 * The frontend calls this to get real-time derived values as the user types,
 * without needing to mirror the backend math in JavaScript.
 *
 * Also used for the Edit form when the user changes values before saving.
 */
function calculateGoal(req, res) {
  const { mode, targetAmount, monthlyContribution, targetDate, currentBalance = 0 } = req.body;

  const target = parseFloat(targetAmount);
  const balance = parseFloat(currentBalance);

  if (isNaN(target) || target <= 0) {
    return res.status(400).json({ error: 'targetAmount must be a positive number' });
  }

  if (mode === 'deadline') {
    if (!targetDate) return res.status(400).json({ error: 'targetDate required for deadline mode' });
    if (!isTargetDateValid(targetDate)) {
      return res.status(400).json({ error: 'targetDate must be at least 1 month in the future' });
    }

    const { calcMonthsBetween } = require('../services/goalCalculations');
    const months = calcMonthsBetween(targetDate);
    const derived = calcDeadlineContribution(balance, target, targetDate);

    return res.status(200).json({
      mode: 'deadline',
      monthlyContribution: derived,
      monthsBetween: months,
      monthsRemaining: months,
    });
  } else {
    const contrib = parseFloat(monthlyContribution ?? 0);
    if (isNaN(contrib) || contrib < 0) {
      return res.status(400).json({ error: 'monthlyContribution must be a non-negative number' });
    }

    return res.status(200).json({
      mode: 'monthly',
      monthlyContribution: contrib,
      monthsRemaining: calcMonthsRemaining(balance, target, contrib),
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Original
  getUserPercentages,
  getUserPockets,
  updatePercentages,
  // L1
  createPocket,
  // L4
  applyMonthlyContributions,
  // L5
  updateSchedule,
  // L6
  updatePocket,
  calculateGoal,
};