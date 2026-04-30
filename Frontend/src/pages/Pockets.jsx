import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import './Pockets.css';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';

const API = `${import.meta.env.VITE_API_URL}/api`;

// ═══════════════════════════════════════════════════════════════════════════════
// PURE HELPERS — mirrors of backend/services/goalCalculations.js
// These run instantly in the browser for live form feedback.
// Backend re-derives everything authoritatively on save.
// ═══════════════════════════════════════════════════════════════════════════════

function calcProgress(balance, targetAmount) {
    if (!targetAmount || targetAmount <= 0) return 0;
    return Math.min(100, Math.round((balance / targetAmount) * 100));
}

function calcMonthsRemaining(balance, targetAmount, monthlyContribution) {
    if (!monthlyContribution || monthlyContribution <= 0) return null;
    const remaining = targetAmount - balance;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / monthlyContribution);
}

function calcMonthsBetween(targetDateISO) {
    if (!targetDateISO) return 0;
    const now = new Date();
    const target = new Date(targetDateISO + 'T00:00:00');
    const months =
        (target.getFullYear() - now.getFullYear()) * 12 +
        (target.getMonth() - now.getMonth());
    return Math.max(0, months);
}

function calcDeadlineContribution(balance, targetAmount, targetDateISO) {
    const months = calcMonthsBetween(targetDateISO);
    if (months <= 0) return null;
    const remaining = targetAmount - balance;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / months);
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function minTargetDate() {
    // At least 1 full month in the future
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
}

function formatDate(isoDate) {
    if (!isoDate) return null;
    const [y, m, d] = isoDate.split('-');
    return `${parseInt(d)}/${parseInt(m)}/${y}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
    active: { label: 'نشط', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    pending: { label: 'قادم', color: 'text-yellow-400  bg-yellow-400/10  border-yellow-400/20' },
    paused: { label: 'متوقف', color: 'text-slate-400   bg-slate-400/10   border-slate-400/20' },
    expired: { label: 'منتهي', color: 'text-red-400     bg-red-400/10     border-red-400/20' },
    completed: { label: 'مكتمل', color: 'text-teal-400    bg-teal-400/10    border-teal-400/20' },
    no_schedule: null,
};

function ScheduleBadge({ status }) {
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM POCKET CARD — original 3 pockets, untouched
// ═══════════════════════════════════════════════════════════════════════════════

const SYSTEM_POCKET_CONFIG = {
    expenses: { label: 'مصاريف', subtitle: 'الاستهلاك الشهري', icon: 'account_balance_wallet', colorClass: 'primary', progressLabel: 'اكتمال الميزانية', footerIcon: 'history', glowClass: 'active-glow' },
    savings: { label: 'ادخار', subtitle: 'الهدف: شراء منزل', icon: 'savings', colorClass: 'secondary', progressLabel: 'الهدف المحقق', footerIcon: 'trending_up', glowClass: '' },
    commitments: { label: 'التزامات', subtitle: 'فواتير وقروض', icon: 'receipt_long', colorClass: 'tertiary', progressLabel: 'المدفوع هذا الشهر', footerIcon: 'schedule', glowClass: '' },
};

function SystemPocketCard({ pocket }) {
    const cfg = SYSTEM_POCKET_CONFIG[pocket.name];
    if (!cfg) return null;
    const c = cfg.colorClass;
    const progress = Math.round(pocket.percentage * 100);

    return (
        <div className={`glass-card rounded-[28px] p-6 ${cfg.glowClass} relative overflow-hidden group`}>
            <div className={`absolute inset-0 bg-${c}/5 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-${c}/10 flex items-center justify-center border border-${c}/20`}>
                            <span className={`material-symbols-outlined text-${c} text-3xl`}>{cfg.icon}</span>
                        </div>
                        <div>
                            <h3 className="font-headline-md text-body-lg font-bold text-on-surface">{cfg.label}</h3>
                            <p className="font-label-caps text-on-surface-variant">{cfg.subtitle}</p>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className={`font-financial-val text-${c}`}>{pocket.balance.toLocaleString()} ر.س</p>
                    </div>
                </div>
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-on-surface-variant font-medium">{cfg.progressLabel}</span>
                        <span className={`text-${c} font-bold`}>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className={`h-full bg-${c} rounded-full transition-all duration-700`} style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                        <span className="material-symbols-outlined text-[18px]">{cfg.footerIcon}</span>
                        <span>{Math.round(pocket.percentage * 100)}% من كل استلام</span>
                    </div>
                    <span className={`material-symbols-outlined text-on-surface-variant group-hover:text-${c} transition-colors`}>chevron_left</span>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM POCKET CARD — Levels 1–6
// ═══════════════════════════════════════════════════════════════════════════════

function CustomPocketCard({ pocket, onToggleSchedule, onEdit }) {
    const hasGoal = pocket.goal?.enabled;
    const goal = pocket.goal;
    const progress = hasGoal ? calcProgress(pocket.balance, goal.targetAmount) : 0;
    const monthsLeft = hasGoal
        ? calcMonthsRemaining(pocket.balance, goal.targetAmount, goal.monthlyContribution)
        : null;
    const isComplete = hasGoal && pocket.balance >= goal.targetAmount;
    const hasSchedule = hasGoal && goal.contributionDay != null && goal.monthlyContribution > 0;
    const scheduleStatus = goal?.scheduleStatus ?? 'no_schedule';
    const nextDate = goal?.nextContributionDate;
    const isDeadline = goal?.mode === 'deadline';

    // L6: ahead/behind schedule calculation for deadline mode
    const scheduleInsight = useMemo(() => {
        if (!isDeadline || !goal?.targetDate || isComplete) return null;
        const totalMonths = calcMonthsBetween(goal.targetDate);
        const expectedSaved = (goal.monthlyContribution ?? 0) * (
            // months elapsed since startDate
            (() => {
                if (!goal.startDate) return 0;
                const start = new Date(goal.startDate + 'T00:00:00');
                const now = new Date();
                const m = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
                return Math.max(0, m);
            })()
        );
        if (expectedSaved <= 0) return null;
        if (pocket.balance > expectedSaved) return { type: 'ahead', diff: pocket.balance - expectedSaved };
        if (pocket.balance < expectedSaved) return { type: 'behind', diff: expectedSaved - pocket.balance };
        return { type: 'on_track' };
    }, [isDeadline, goal, pocket.balance, isComplete]);

    return (
        <div className="glass-card rounded-[28px] p-6 relative overflow-hidden group border border-primary/10">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">

                {/* ── Header ── */}
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="material-symbols-outlined text-primary text-3xl">
                                {isComplete ? 'check_circle' : hasGoal ? 'flag' : 'wallet'}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-headline-md text-body-lg font-bold text-on-surface">{pocket.name}</h3>
                                {hasSchedule && <ScheduleBadge status={scheduleStatus} />}
                                {/* L6: mode pill */}
                                {hasGoal && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${isDeadline
                                            ? 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                                            : 'text-blue-400  bg-blue-400/10  border-blue-400/20'
                                        }`}>
                                        {isDeadline ? 'موعد' : 'شهري'}
                                    </span>
                                )}
                            </div>
                            <p className="font-label-caps text-on-surface-variant">
                                {hasGoal ? goal.title : 'لا يوجد هدف'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <p className="font-financial-val text-primary">{pocket.balance.toLocaleString()} ر.س</p>
                        {hasGoal && (
                            <p className="text-xs text-on-surface-variant">
                                من {goal.targetAmount.toLocaleString()} ر.س
                            </p>
                        )}
                        {/* L6: edit button */}
                        <button
                            onClick={() => onEdit(pocket)}
                            className="mt-1 text-xs text-on-surface-variant border border-white/10 rounded-full px-2 py-0.5 hover:text-primary hover:border-primary/30 transition-colors flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[12px]">edit</span>
                            تعديل
                        </button>
                    </div>
                </div>

                {/* ── L3: Progress bar ── */}
                {hasGoal && (
                    <div className="space-y-3 mb-5">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-on-surface-variant font-medium">
                                {isComplete ? '🎉 تم تحقيق الهدف!' : 'نسبة الإنجاز'}
                            </span>
                            <span className={`font-bold ${isComplete ? 'text-emerald-400' : progress >= 75 ? 'text-yellow-400' : 'text-primary'}`}>
                                {progress}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isComplete ? 'bg-emerald-400' : progress >= 75 ? 'bg-yellow-400' : 'bg-primary'}`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* ── Footer info rows ── */}
                <div className="pt-4 border-t border-white/5 space-y-2">

                    {/* L6: deadline mode — show target date */}
                    {isDeadline && goal.targetDate && !isComplete && (
                        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                            <span className="material-symbols-outlined text-[18px] text-purple-400">event</span>
                            <span>
                                الهدف بحلول{' '}
                                <span className="text-purple-400 font-semibold">{formatDate(goal.targetDate)}</span>
                            </span>
                        </div>
                    )}

                    {/* L4/L6: Monthly contribution */}
                    {hasGoal && goal.monthlyContribution > 0 && (
                        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                            <span className="material-symbols-outlined text-[18px] text-primary">autorenew</span>
                            <span>
                                {isDeadline ? 'مطلوب توفير ' : 'توفير '}
                                <span className="text-primary font-semibold">{goal.monthlyContribution.toLocaleString()} ر.س</span>
                                {' '}شهرياً
                                {isDeadline && <span className="text-on-surface-variant/60"> (محسوب تلقائياً)</span>}
                            </span>
                        </div>
                    )}

                    {/* Source pocket */}
                    {hasSchedule && goal.sourcePocket && (
                        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                            <span className="material-symbols-outlined text-[18px] text-primary">account_balance_wallet</span>
                            <span>من <span className="text-on-surface font-semibold">{{ expenses: 'مصاريف', savings: 'ادخار', commitments: 'التزامات' }[goal.sourcePocket]}</span></span>
                        </div>
                    )}

                    {/* L5: Start date */}
                    {hasSchedule && goal.startDate && (
                        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                            <span>بدأ في: <span className="text-on-surface font-semibold">{formatDate(goal.startDate)}</span></span>
                        </div>
                    )}

                    {/* L5: End date */}
                    {hasSchedule && goal.endDate && (
                        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                            <span className="material-symbols-outlined text-[18px]">event_busy</span>
                            <span>ينتهي في: <span className="text-on-surface font-semibold">{formatDate(goal.endDate)}</span></span>
                        </div>
                    )}

                    {/* L5: Next contribution */}
                    {hasSchedule && !isComplete && scheduleStatus === 'active' && nextDate && (
                        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                            <span className="material-symbols-outlined text-[18px] text-primary">upcoming</span>
                            <span>المساهمة القادمة: <span className="text-primary font-semibold">{formatDate(nextDate)}</span></span>
                        </div>
                    )}

                    {/* L4: Months remaining (monthly mode) */}
                    {hasGoal && !isComplete && !isDeadline && monthsLeft !== null && (
                        <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            <span>
                                ستصل إلى هدفك خلال{' '}
                                <span className="text-on-surface font-semibold">{monthsLeft}</span>{' '}
                                {monthsLeft === 1 ? 'شهر' : 'أشهر'}
                            </span>
                        </div>
                    )}

                    {/* L6: Ahead/behind schedule insight (deadline mode) */}
                    {scheduleInsight && (
                        <div className={`flex items-center gap-2 text-xs ${scheduleInsight.type === 'ahead' ? 'text-emerald-400' :
                                scheduleInsight.type === 'behind' ? 'text-orange-400' :
                                    'text-blue-400'
                            }`}>
                            <span className="material-symbols-outlined text-[16px]">
                                {scheduleInsight.type === 'ahead' ? 'trending_up' : scheduleInsight.type === 'behind' ? 'trending_down' : 'check_circle'}
                            </span>
                            <span>
                                {scheduleInsight.type === 'ahead'
                                    ? `متقدم بـ ${scheduleInsight.diff.toLocaleString()} ر.س عن الجدول`
                                    : scheduleInsight.type === 'behind'
                                        ? `متأخر بـ ${scheduleInsight.diff.toLocaleString()} ر.س عن الجدول`
                                        : 'على المسار الصحيح ✓'
                                }
                            </span>
                        </div>
                    )}

                    {/* No goal */}
                    {!hasGoal && (
                        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                            <span className="material-symbols-outlined text-[18px]">info</span>
                            <span>صندوق مخصص بدون هدف</span>
                        </div>
                    )}

                    {/* L5: Pause / Resume */}
                    {hasSchedule && !isComplete && scheduleStatus !== 'expired' && (
                        <div className="flex justify-end pt-1">
                            <button
                                onClick={() => onToggleSchedule(pocket.id, goal.isActive)}
                                className={`text-xs border rounded-full px-3 py-1 flex items-center gap-1 transition-colors ${goal.isActive
                                        ? 'text-slate-400 border-slate-400/30 hover:bg-slate-400/10'
                                        : 'text-primary border-primary/30 hover:bg-primary/10'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[14px]">
                                    {goal.isActive ? 'pause' : 'play_arrow'}
                                </span>
                                {goal.isActive ? 'إيقاف مؤقت' : 'استئناف'}
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ToggleRow({ icon, label, value, onChange }) {
    return (
        <div
            className="flex items-center justify-between mb-4 cursor-pointer p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => onChange(v => !v)}
        >
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
                <span className="text-on-surface text-sm font-medium">{label}</span>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-primary' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-6' : 'left-1'}`}></div>
            </div>
        </div>
    );
}

function FormInput({ label, value, onChange, type = 'text', placeholder, min, disabled, hint, dir = 'rtl' }) {
    return (
        <div>
            {label && <label className="text-on-surface-variant text-sm mb-2 block">{label}</label>}
            <input
                type={type} value={value}
                onChange={onChange ? e => onChange(e.target.value) : undefined}
                onWheel={type === 'number' ? e => e.currentTarget.blur() : undefined}
                placeholder={placeholder} min={min}
                disabled={disabled} dir={dir}
                className={`w-full border rounded-2xl px-4 py-3 text-sm transition-colors focus:outline-none ${disabled
                        ? 'bg-slate-800/50 border-white/5 text-on-surface-variant cursor-not-allowed'
                        : 'bg-slate-800 border-white/10 text-on-surface focus:border-primary/50'
                    }`}
            />
            {hint && <p className="text-xs text-on-surface-variant/60 mt-1.5 text-right">{hint}</p>}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POCKET FORM MODAL — unified Create + Edit (L6)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PocketFormModal
 *
 * Props:
 *  onClose        ()       → void
 *  onSaved        (pocket) → void   — called with the created/updated pocket
 *  userId         number
 *  existingPocket object | null     — null = create mode, object = edit mode
 */
function PocketFormModal({ onClose, onSaved, userId, existingPocket }) {
    const isEdit = !!existingPocket;
    const ep = existingPocket;
    const eg = ep?.goal;

    // ── Form state initialised from existingPocket when editing ───────────────
    const [name, setName] = useState(ep?.name ?? '');
    const [addGoal, setAddGoal] = useState(!!eg?.enabled);
    const [goalTitle, setGoalTitle] = useState(eg?.title ?? '');
    const [targetAmt, setTargetAmt] = useState(eg?.targetAmount ? String(eg.targetAmount) : '');

    // L6: mode
    const [mode, setMode] = useState(eg?.mode ?? 'monthly'); // 'monthly' | 'deadline'

    // monthly mode fields
    const [monthly, setMonthly] = useState(
        eg?.mode === 'monthly' && eg?.monthlyContribution ? String(eg.monthlyContribution) : ''
    );

    // deadline mode fields
    const [targetDate, setTargetDate] = useState(eg?.targetDate ?? '');

    // schedule fields
    const [showSummary, setShowSummary] = useState(false);
    const [sourcePocket, setSourcePocket] = useState(eg?.goal?.sourcePocket ?? 'expenses');
    const [startNow, setStartNow] = useState(!eg?.startDate || eg.startDate === todayISO());
    const [startDate, setStartDate] = useState(eg?.startDate ?? '');
    const [hasEndDate, setHasEndDate] = useState(!!eg?.endDate && eg?.mode !== 'deadline');
    const [endDate, setEndDate] = useState(
        eg?.mode !== 'deadline' ? (eg?.endDate ?? '') : ''
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // ── Derived live values ────────────────────────────────────────────────────
    const currentBalance = ep?.balance ?? 0;
    const targetAmtNum = parseFloat(targetAmt) || 0;
    const monthlyNum = parseFloat(monthly) || 0;

    // monthly mode: live months remaining preview
    const previewMonthsMonthly = mode === 'monthly' && targetAmtNum > 0 && monthlyNum > 0
        ? calcMonthsRemaining(currentBalance, targetAmtNum, monthlyNum)
        : null;

    // deadline mode: live derived contribution
    const derivedContribution = mode === 'deadline' && targetAmtNum > 0 && targetDate
        ? calcDeadlineContribution(currentBalance, targetAmtNum, targetDate)
        : null;

    const previewMonthsDeadline = targetDate ? calcMonthsBetween(targetDate) : null;

    const showSchedule = addGoal && (
        mode === 'monthly' ? monthlyNum > 0 : derivedContribution !== null && derivedContribution > 0
    );

    // Derive contribution day automatically:
    // • deadline mode  → day of the target date
    // • start now      → today's day
    // • custom start   → day of the chosen start date
    // getDate() is always ≤ the days in that month, so no extra capping needed.
    const effectiveContribDay = mode === 'deadline' && targetDate
        ? new Date(targetDate + 'T00:00:00').getDate()
        : startNow
            ? new Date().getDate()
            : startDate
                ? new Date(startDate + 'T00:00:00').getDate()
                : new Date().getDate();

    // ── When mode switches, clear the other mode's unique field ───────────────
    function handleModeSwitch(newMode) {
        setMode(newMode);
        if (newMode === 'monthly') setTargetDate('');
        else setMonthly('');
        setError('');
    }

    // ── Validate — called when primary button is tapped ──────────────────────
    function handlePrimaryAction() {
        setError('');

        if (!name.trim()) { setError('اسم الصندوق مطلوب'); return; }

        if (addGoal) {
            if (!goalTitle.trim()) { setError('عنوان الهدف مطلوب'); return; }
            if (!targetAmt || parseFloat(targetAmt) <= 0) { setError('المبلغ المستهدف يجب أن يكون أكبر من صفر'); return; }

            if (mode === 'monthly') {
                if (monthly && parseFloat(monthly) < 0) { setError('المساهمة الشهرية لا يمكن أن تكون سالبة'); return; }
            } else {
                if (!targetDate) { setError('تاريخ الهدف مطلوب في وضع الموعد'); return; }
                if (calcMonthsBetween(targetDate) < 1) { setError('تاريخ الهدف يجب أن يكون بعد شهر كامل على الأقل'); return; }
            }

            if (showSchedule) {
                if (!startNow && !startDate) { setError('يرجى تحديد تاريخ البدء'); return; }
                if (hasEndDate && !endDate) { setError('يرجى تحديد تاريخ الانتهاء'); return; }
            }
        }

        // Create mode: show summary first; Edit mode: submit immediately
        if (!isEdit) {
            setShowSummary(true);
        } else {
            doSubmit();
        }
    }

    // ── API call — called from summary confirm button (or directly in edit mode) ─
    async function doSubmit() {
        setLoading(true);
        try {
            const goalPayload = addGoal ? {
                enabled: true,
                title: goalTitle.trim(),
                targetAmount: parseFloat(targetAmt),
                mode,
                monthlyContribution: mode === 'monthly' ? (monthly ? parseFloat(monthly) : 0) : undefined,
                targetDate: mode === 'deadline' ? targetDate : null,
                ...(showSchedule && {
                    contributionDay: effectiveContribDay,
                    startDate: startNow ? todayISO() : startDate,
                    endDate: (mode !== 'deadline' && hasEndDate) ? endDate : null,
                    isActive: true,
                    sourcePocket,
                }),
            } : null;

            const url = isEdit ? `${API}/pockets/${ep.id}` : `${API}/pockets`;
            const method = isEdit ? 'PUT' : 'POST';
            const body = isEdit
                ? { name: name.trim(), goal: goalPayload }
                : { userId, name: name.trim(), goal: goalPayload };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'حدث خطأ ما'); setShowSummary(false); return; }

            onSaved(data);
            onClose();
        } catch {
            setError('فشل الاتصال بالخادم');
            setShowSummary(false);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-md bg-slate-900 border border-white/10 rounded-t-[32px] p-6 pb-10 overflow-y-auto max-h-[92vh]"
                style={{ animation: 'slideUp 0.3s ease-out' }}
            >
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                <h2 className="text-on-surface font-bold text-lg text-center mb-1">
                    {isEdit ? 'تعديل الصندوق' : 'إنشاء صندوق جديد'}
                </h2>
                {isEdit && (
                    <p className="text-xs text-on-surface-variant text-center mb-6">
                        الرصيد الحالي: <span className="text-primary font-semibold">{currentBalance.toLocaleString()} ر.س</span>
                    </p>
                )}
                {!isEdit && <div className="mb-6"></div>}

                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* ── L1: Name ── */}
                <div className="mb-4">
                    <FormInput
                        label="اسم الصندوق"
                        value={name} onChange={setName}
                        placeholder="مثال: رحلة إلى أوروبا"
                    />
                </div>

                {/* ── L2: Goal toggle ── */}
                <ToggleRow icon="flag" label="إضافة هدف مالي" value={addGoal} onChange={setAddGoal} />

                {addGoal && (
                    <div className="space-y-4 mb-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">

                        {/* Goal title */}
                        <FormInput
                            label="عنوان الهدف"
                            value={goalTitle} onChange={setGoalTitle}
                            placeholder="مثال: شراء منزل"
                        />

                        {/* Target amount */}
                        <FormInput
                            label="المبلغ المستهدف (ر.س)"
                            type="number" value={targetAmt} onChange={setTargetAmt}
                            placeholder="مثال: 50000" min="1"
                        />

                        {/* ── L6: Mode selector ── */}
                        <div>
                            <label className="text-on-surface-variant text-sm mb-3 block">طريقة الادخار</label>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Monthly mode */}
                                <button
                                    onClick={() => handleModeSwitch('monthly')}
                                    className={`p-3 rounded-2xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${mode === 'monthly'
                                            ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                                            : 'bg-slate-800 border-white/10 text-on-surface-variant hover:bg-white/5'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-xl">calendar_month</span>
                                    <span>مبلغ شهري</span>
                                    <span className="text-[10px] opacity-70">أنت تحدد المبلغ</span>
                                </button>

                                {/* Deadline mode */}
                                <button
                                    onClick={() => handleModeSwitch('deadline')}
                                    className={`p-3 rounded-2xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${mode === 'deadline'
                                            ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                                            : 'bg-slate-800 border-white/10 text-on-surface-variant hover:bg-white/5'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-xl">event</span>
                                    <span>بحلول تاريخ</span>
                                    <span className="text-[10px] opacity-70">النظام يحسب المبلغ</span>
                                </button>
                            </div>
                        </div>

                        {/* ── MODE: monthly ── */}
                        {mode === 'monthly' && (
                            <div className="space-y-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <FormInput
                                    label="المساهمة الشهرية (ر.س)"
                                    type="number" value={monthly} onChange={setMonthly}
                                    placeholder="مثال: 500" min="0"
                                />
                                {previewMonthsMonthly !== null && (
                                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <span className="material-symbols-outlined text-blue-400 text-[18px]">insights</span>
                                        <p className="text-sm text-blue-400">
                                            ستصل إلى هدفك خلال{' '}
                                            <span className="font-bold">{previewMonthsMonthly}</span>{' '}
                                            {previewMonthsMonthly === 1 ? 'شهر' : 'أشهر'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── MODE: deadline ── */}
                        {mode === 'deadline' && (
                            <div className="space-y-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                                <FormInput
                                    label="تاريخ تحقيق الهدف"
                                    type="date" value={targetDate} onChange={setTargetDate}
                                    min={minTargetDate()}
                                    dir="ltr"
                                />
                                {/* Derived contribution — read only */}
                                <FormInput
                                    label="المساهمة الشهرية المطلوبة (ر.س)"
                                    value={derivedContribution !== null ? String(derivedContribution) : ''}
                                    placeholder="يُحسب تلقائياً عند اختيار التاريخ"
                                    disabled
                                    hint="هذه القيمة محسوبة تلقائياً ولا يمكن تعديلها"
                                />
                                {derivedContribution !== null && previewMonthsDeadline !== null && (
                                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                        <span className="material-symbols-outlined text-purple-400 text-[18px]">insights</span>
                                        <p className="text-sm text-purple-400">
                                            لتصل بحلول هذا التاريخ، ادخر{' '}
                                            <span className="font-bold">{derivedContribution.toLocaleString()} ر.س</span>
                                            {' '}شهرياً لمدة {previewMonthsDeadline} {previewMonthsDeadline === 1 ? 'شهر' : 'أشهر'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── L5: Schedule section ── */}
                        {showSchedule && (
                            <div className="pt-3 border-t border-white/10 space-y-4">
                                <p className="text-xs text-primary font-semibold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                                    جدولة المساهمة التلقائية
                                </p>

                                {/* Start option */}
                                <div>
                                    <label className="text-on-surface-variant text-sm mb-2 block">تاريخ البدء</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setStartNow(true)}
                                            className={`flex-1 py-2.5 rounded-2xl text-sm font-medium transition-colors ${startNow ? 'bg-primary text-on-primary' : 'bg-slate-800 border border-white/10 text-on-surface-variant hover:bg-white/5'}`}>
                                            ابدأ الآن
                                        </button>
                                        <button onClick={() => setStartNow(false)}
                                            className={`flex-1 py-2.5 rounded-2xl text-sm font-medium transition-colors ${!startNow ? 'bg-primary text-on-primary' : 'bg-slate-800 border border-white/10 text-on-surface-variant hover:bg-white/5'}`}>
                                            حدد تاريخاً
                                        </button>
                                    </div>
                                    {!startNow && (
                                        <input type="date" value={startDate} min={todayISO()}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="mt-2 w-full bg-slate-800 border border-white/10 rounded-2xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 text-sm" />
                                    )}
                                </div>

                                {/* Source pocket selector */}
                                <div>
                                    <label className="text-on-surface-variant text-sm mb-2 block">المصدر</label>
                                    <div className="flex gap-2">
                                        {[
                                            { key: 'expenses',    label: 'مصاريف' },
                                            { key: 'savings',     label: 'ادخار' },
                                            { key: 'commitments', label: 'التزامات' },
                                        ].map(({ key, label }) => (
                                            <button key={key}
                                                onClick={() => setSourcePocket(key)}
                                                className={`flex-1 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                                                    sourcePocket === key
                                                        ? 'bg-primary text-on-primary'
                                                        : 'bg-slate-800 border border-white/10 text-on-surface-variant hover:bg-white/5'
                                                }`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Deadline mode: end date is always targetDate */}
                                {mode === 'deadline' && targetDate && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                                        <span className="material-symbols-outlined text-purple-400 text-[18px]">event_busy</span>
                                        <p className="text-xs text-on-surface-variant">
                                            تاريخ الانتهاء يُضبط تلقائياً على{' '}
                                            <span className="text-purple-400 font-semibold">{formatDate(targetDate)}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex gap-3 mt-4">
                    <button onClick={onClose}
                        className="flex-1 py-3 rounded-2xl border border-white/10 text-on-surface-variant text-sm font-medium hover:bg-white/5 transition-colors">
                        إلغاء
                    </button>
                    <button onClick={handlePrimaryAction} disabled={loading}
                        className="flex-1 py-3 rounded-2xl bg-primary text-on-primary text-sm font-bold disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2">
                        {loading
                            ? <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>جاري الحفظ...</>
                            : <><span className="material-symbols-outlined text-[18px]">{isEdit ? 'save' : 'arrow_forward'}</span>{isEdit ? 'حفظ التعديلات' : 'إنشاء الصندوق'}</>
                        }
                    </button>
                </div>
            </div>

            {/* ── Summary confirmation overlay (create mode only) ── */}
            {showSummary && (
                <div
                    className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 backdrop-blur-sm"
                    dir="rtl" lang="ar"
                >
                    <div
                        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-t-[32px] p-6 pb-10"
                        style={{ animation: 'slideUp 0.3s ease-out' }}
                    >
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-primary text-xl">summarize</span>
                            <h2 className="text-on-surface font-bold text-lg">ملخص الصندوق</h2>
                        </div>
                        <p className="text-xs text-on-surface-variant text-center mb-6">راجع التفاصيل قبل الإنشاء</p>

                        {error && (
                            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2 mb-6">
                            {/* Pocket name */}
                            <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <span className="material-symbols-outlined text-[17px] text-primary">wallet</span>
                                    <span className="text-xs">اسم الصندوق</span>
                                </div>
                                <span className="text-sm font-semibold text-on-surface">{name}</span>
                            </div>

                            {addGoal && (
                                <>
                                    <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <span className="material-symbols-outlined text-[17px] text-primary">flag</span>
                                            <span className="text-xs">عنوان الهدف</span>
                                        </div>
                                        <span className="text-sm font-semibold text-on-surface">{goalTitle}</span>
                                    </div>

                                    <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <span className="material-symbols-outlined text-[17px] text-primary">payments</span>
                                            <span className="text-xs">المبلغ المستهدف</span>
                                        </div>
                                        <span className="text-sm font-semibold text-on-surface" dir="ltr">{Number(targetAmt).toLocaleString()} ر.س</span>
                                    </div>

                                    <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <span className="material-symbols-outlined text-[17px] text-primary">{mode === 'monthly' ? 'calendar_month' : 'event'}</span>
                                            <span className="text-xs">طريقة الادخار</span>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${mode === 'monthly' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-purple-400 bg-purple-400/10 border-purple-400/20'}`}>
                                            {mode === 'monthly' ? 'مبلغ شهري' : 'بحلول تاريخ'}
                                        </span>
                                    </div>

                                    {mode === 'monthly' && monthly && (
                                        <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span className="material-symbols-outlined text-[17px] text-primary">autorenew</span>
                                                <span className="text-xs">المساهمة الشهرية</span>
                                            </div>
                                            <span className="text-sm font-semibold text-on-surface" dir="ltr">{Number(monthly).toLocaleString()} ر.س</span>
                                        </div>
                                    )}

                                    {mode === 'deadline' && targetDate && (
                                        <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span className="material-symbols-outlined text-[17px] text-purple-400">event</span>
                                                <span className="text-xs">تاريخ الهدف</span>
                                            </div>
                                            <span className="text-sm font-semibold text-on-surface">{formatDate(targetDate)}</span>
                                        </div>
                                    )}

                                    {mode === 'deadline' && derivedContribution !== null && (
                                        <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span className="material-symbols-outlined text-[17px] text-purple-400">autorenew</span>
                                                <span className="text-xs">المساهمة الشهرية المطلوبة</span>
                                            </div>
                                            <span className="text-sm font-semibold text-purple-400" dir="ltr">{derivedContribution.toLocaleString()} ر.س</span>
                                        </div>
                                    )}

                                    {showSchedule && (
                                        <>
                                            <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <span className="material-symbols-outlined text-[17px] text-primary">play_arrow</span>
                                                    <span className="text-xs">تاريخ البدء</span>
                                                </div>
                                                <span className="text-sm font-semibold text-on-surface">{startNow ? 'اليوم' : formatDate(startDate)}</span>
                                            </div>

                                            <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <span className="material-symbols-outlined text-[17px] text-primary">event_repeat</span>
                                                    <span className="text-xs">يوم المساهمة</span>
                                                </div>
                                                <span className="text-sm font-semibold text-on-surface">اليوم {effectiveContribDay} من كل شهر</span>
                                            </div>

                                            <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <span className="material-symbols-outlined text-[17px] text-primary">account_balance_wallet</span>
                                                    <span className="text-xs">مصدر المساهمة</span>
                                                </div>
                                                <span className="text-sm font-semibold text-on-surface">
                                                    {{ expenses: 'مصاريف', savings: 'ادخار', commitments: 'التزامات' }[sourcePocket]}
                                                </span>
                                            </div>

                                            {mode !== 'deadline' && hasEndDate && endDate && (
                                                <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <span className="material-symbols-outlined text-[17px] text-primary">event_busy</span>
                                                        <span className="text-xs">تاريخ الانتهاء</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-on-surface">{formatDate(endDate)}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSummary(false)}
                                className="flex-1 py-3 rounded-2xl border border-white/10 text-on-surface-variant text-sm font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                تعديل
                            </button>
                            <button
                                onClick={doSubmit}
                                disabled={loading}
                                className="flex-1 py-3 rounded-2xl bg-primary text-on-primary text-sm font-bold disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {loading
                                    ? <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>جاري الإنشاء...</>
                                    : <><span className="material-symbols-outlined text-[18px]">check_circle</span>تأكيد الإنشاء</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const Pockets = () => {
    const { currentUserId } = useContext(UserContext);
    const navigate = useNavigate();

    const [pockets, setPockets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState(null);  // null | 'create' | pocket object (edit)
    const [applyingContrib, setApplyingContrib] = useState(false);

    const fetchPockets = useCallback(async () => {
        if (!currentUserId) return;
        try {
            const res = await fetch(`${API}/pockets/${currentUserId}`);
            const data = await res.json();
            setPockets(Array.isArray(data) ? data : data.pockets ?? []);
        } catch (err) {
            console.error('Failed to fetch pockets:', err);
            setPockets([]);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => { fetchPockets(); }, [fetchPockets]);

    // Called when a pocket is created or edited
    function handlePocketSaved(savedPocket) {
        setPockets(prev => {
            const idx = prev.findIndex(p => p.id === savedPocket.id);
            if (idx === -1) return [...prev, savedPocket];          // create
            const next = [...prev];
            next[idx] = { ...savedPocket, isSystem: false };       // edit
            return next;
        });
    }

    async function handleApplyContributions() {
        setApplyingContrib(true);
        try {
            await fetch(`${API}/pockets/apply-contributions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId }),
            });
            await fetchPockets();
        } catch (err) {
            console.error('Failed to apply contributions:', err);
        } finally {
            setApplyingContrib(false);
        }
    }

    async function handleToggleSchedule(pocketId, currentlyActive) {
        try {
            const res = await fetch(`${API}/pockets/${pocketId}/schedule`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentlyActive }),
            });
            const data = await res.json();
            if (res.ok) {
                setPockets(prev => prev.map(p =>
                    p.id === pocketId ? { ...data.pocket, isSystem: false } : p
                ));
            }
        } catch (err) {
            console.error('Failed to toggle schedule:', err);
        }
    }

    const systemPockets = pockets.filter(p => p.isSystem);
    const customPockets = pockets.filter(p => !p.isSystem);
    const hasAutoSavePockets = customPockets.some(p => p.goal?.enabled && p.goal.monthlyContribution > 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center dark bg-slate-950">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce mx-1"></div>
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce mx-1 [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary/30 animate-bounce mx-1 [animation-delay:0.4s]"></div>
            </div>
        );
    }

    return (
        <div className="bg-background text-on-background min-h-screen font-body-md overflow-x-hidden pockets-wrapper dark" dir="rtl" lang="ar">

            {/* TopAppBar — unchanged */}
            <header className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 py-4 rtl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-primary/20 overflow-hidden">
                        <img alt="Profile" className="w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7jHJkB5PJw25glFlMvCS9UXyC9eQpin5m72Vxjo9P5LHyCDl_beFvW2lGFXLvRdVzqJePEqiIOUKTZ4Oo5ALVrB2MBgWfV5V7krmBHCtPxWr-KYjUCUPv7PPqkaYtz7ht3eMQJVresLf2pcsBo9QOQJ5SzSfw3vNWSBoVjUmN57FEi2ErUkTN9aF6JhiVveLKwq1hO8a-5ie3svFTHV4BRQNYQd4qBvlH9UQnsMtEqGD6Bz7M3z78CTdmWfq6frjpdNKef2f4BNjR" />
                    </div>
                    <span className="text-xl font-bold text-teal-500 font-display-lg">Tharaa</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined text-slate-400">notifications</span>
                    </button>
                </div>
            </header>

            <main className="pt-24 pb-32 px-container-padding">

                <div className="mb-stack-lg flex items-end justify-between">
                    <div>
                        <h1 className="font-headline-md text-headline-md text-on-surface mb-unit">صناديقي</h1>
                        <p className="font-body-md text-on-surface-variant">تحكم في مدخراتك ومصاريفك بذكاء</p>
                    </div>
                    {hasAutoSavePockets && (
                        <button onClick={handleApplyContributions} disabled={applyingContrib}
                            className="flex items-center gap-2 text-xs text-primary border border-primary/30 rounded-full px-4 py-2 hover:bg-primary/10 transition-colors disabled:opacity-50">
                            {applyingContrib
                                ? <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                : <span className="material-symbols-outlined text-[16px]">autorenew</span>
                            }
                            تطبيق المساهمات
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-stack-md">

                    {systemPockets.map(pocket => (
                        <SystemPocketCard key={pocket.id} pocket={pocket} />
                    ))}

                    {customPockets.map(pocket => (
                        <CustomPocketCard
                            key={pocket.id}
                            pocket={pocket}
                            onToggleSchedule={handleToggleSchedule}
                            onEdit={p => setModalMode(p)}
                        />
                    ))}

                    <button onClick={() => setModalMode('create')}
                        className="glass-card rounded-[28px] p-6 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all group flex items-center justify-center gap-4 text-on-surface-variant hover:text-on-surface">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 group-hover:bg-primary/10 border border-primary/20 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-primary text-3xl">add</span>
                        </div>
                        <span className="font-semibold text-base">إنشاء صندوق جديد</span>
                    </button>

                </div>
            </main>

            {/* Unified Create / Edit Modal */}
            {modalMode !== null && (
                <PocketFormModal
                    userId={currentUserId}
                    existingPocket={modalMode === 'create' ? null : modalMode}
                    onClose={() => setModalMode(null)}
                    onSaved={handlePocketSaved}
                />
            )}

            {/* BottomNavBar — unchanged */}
            <nav className="fixed bottom-0 left-0 w-full z-50 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 flex justify-around items-end pb-8 pt-4 px-4 rtl rounded-t-[28px] shadow-[0_-10px_30px_-15px_rgba(0,105,92,0.3)]">
                <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all">
                    <span className="material-symbols-outlined">home</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">الرئيسية</span>
                </button>
                <button onClick={() => navigate('/pockets')} className="flex flex-col items-center justify-center text-teal-400 drop-shadow-[0_0_8px_rgba(0,169,110,0.5)]">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">المحافظ</span>
                </button>
                <div className="relative -top-6">
                    <button onClick={() => navigate('/scan')} className="w-16 h-16 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
                    </button>
                </div>
                <button onClick={() => navigate('/analytics')} className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all">
                    <span className="material-symbols-outlined">receipt_long</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">المعاملات</span>
                </button>
                <button className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all">
                    <span className="material-symbols-outlined">person</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">الإعدادات</span>
                </button>
            </nav>
        </div>
    );
};

export default Pockets;