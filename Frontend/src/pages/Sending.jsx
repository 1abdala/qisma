import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { DisplayCurrencyContext } from '../contexts/DisplayCurrencyContext';
import { convertAmount } from '../hooks/useCurrencyConverter';
import './Sending.css';

const API = `${import.meta.env.VITE_API_URL}/api`;

const CURRENCIES = {
    SAR: { flag: '🇸🇦', name: 'ريال سعودي' },
    AED: { flag: '🇦🇪', name: 'درهم إماراتي' },
    EGP: { flag: '🇪🇬', name: 'جنيه مصري' },
    OMR: { flag: '🇴🇲', name: 'ريال عُماني' },
};

function formatDateTime(date) {
    return date.toLocaleString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ── Loading / Success overlay ──────────────────────────────────────────────────
function TransactionOverlay({ screen, data, onDone, onSendAgain }) {
    const rows = data ? [
        { icon: 'schedule', label: 'التاريخ والوقت', value: formatDateTime(data.timestamp) },
        { icon: 'person', label: 'من', value: data.fromName },
        { icon: 'person_add', label: 'إلى', value: data.toName },
        { icon: 'payments', label: 'المبلغ المُرسَل', value: `${data.amount.toLocaleString()} ${data.fromCurrency}` },
        { icon: 'currency_exchange', label: 'المبلغ المُستلَم', value: data.convertedAmount != null ? `${Number(data.convertedAmount).toLocaleString()} ${data.toCurrency}` : `- ${data.toCurrency}` },
    ] : [];

    return (
        <div
            className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center overflow-y-auto py-12"
            dir="rtl" lang="ar"
        >
            {/* Ring + icon */}
            <div className="relative w-44 h-44 mb-8 shrink-0">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                    <circle
                        cx="50" cy="50" r="44" fill="none" strokeWidth="5" strokeLinecap="round"
                        className={screen === 'loading' ? 'ring-spinner' : 'ring-success-fill'}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    {screen === 'loading' ? (
                        <span className="material-symbols-outlined text-5xl text-teal-400 icon-pulse">
                            payments
                        </span>
                    ) : (
                        <span
                            className="material-symbols-outlined text-[52px] text-emerald-400 check-pop"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            check_circle
                        </span>
                    )}
                </div>
            </div>

            {screen === 'loading' ? (
                <div className="text-center">
                    <h2 className="font-manrope font-bold text-2xl text-white mb-2">جاري الإرسال...</h2>
                    <p className="text-slate-400 text-sm mb-5">يُرجى الانتظار لحظة</p>
                    <div className="flex gap-2 justify-center">
                        <span className="w-2 h-2 rounded-full bg-teal-400 dot-bounce" />
                        <span className="w-2 h-2 rounded-full bg-teal-400/70 dot-bounce-2" />
                        <span className="w-2 h-2 rounded-full bg-teal-400/40 dot-bounce-3" />
                    </div>
                </div>
            ) : (
                <div className="success-content w-full max-w-sm px-6 space-y-4">
                    <div className="text-center">
                        <h2 className="font-manrope font-bold text-2xl text-emerald-400 mb-1">تم الإرسال بنجاح!</h2>
                        <p className="text-slate-400 text-sm">تمت عملية التحويل بنجاح</p>
                    </div>

                    <div className="glass-card rounded-3xl p-5 border border-emerald-500/20 space-y-1">
                        {rows.map(({ icon, label, value }) => (
                            <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <span className="material-symbols-outlined text-[17px] text-teal-400">{icon}</span>
                                    <span className="text-xs">{label}</span>
                                </div>
                                <span className="text-sm font-semibold text-white text-left" dir="ltr">{value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onSendAgain}
                            className="flex-1 py-4 glass-card rounded-2xl text-teal-400 font-manrope font-semibold border border-teal-500/30 hover:bg-teal-500/10 transition-all active:scale-95"
                        >
                            إرسال مجدداً
                        </button>
                        <button
                            onClick={onDone}
                            className="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-manrope font-bold emerald-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            تم
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Confirmation modal ─────────────────────────────────────────────────────────
function ConfirmModal({ amount, fromCurrency, convertedAmount, toCurrency, exchangeRate, fromName, toName, recipientRef, onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" dir="rtl" lang="ar">
            <div className="glass-card modal-slide-up w-full max-w-md rounded-t-3xl p-6 space-y-5 border-t border-white/10">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />

                <h3 className="font-manrope font-bold text-xl text-white text-center">تأكيد التحويل</h3>

                <div className="space-y-3">
                    {/* From */}
                    <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="material-symbols-outlined text-[18px] text-teal-400">person</span>
                            <span className="text-xs">من</span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-white">{fromName}</p>
                            <p className="text-xs text-teal-400 font-bold" dir="ltr">{Number(amount).toLocaleString()} {fromCurrency}</p>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                        <span className="material-symbols-outlined text-teal-400">arrow_downward</span>
                    </div>

                    {/* To */}
                    <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="material-symbols-outlined text-[18px] text-emerald-400">person_add</span>
                            <span className="text-xs">إلى</span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-white">{toName}</p>
                            <p className="text-xs text-emerald-400 font-bold" dir="ltr">{Number(convertedAmount).toLocaleString()} {toCurrency}</p>
                        </div>
                    </div>

                    {/* Reference (QR / optional) */}
                    {recipientRef && (
                        <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="material-symbols-outlined text-[18px] text-amber-400">tag</span>
                                <span className="text-xs">المرجع</span>
                            </div>
                            <span className="text-sm font-semibold text-white" dir="ltr">{recipientRef}</span>
                        </div>
                    )}

                    {/* Rate */}
                    <p className="text-center text-[11px] text-slate-500" dir="ltr">
                        1 {fromCurrency} = {exchangeRate} {toCurrency}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 glass-card rounded-2xl text-slate-300 font-manrope font-semibold border border-white/10 hover:bg-white/5 transition-all active:scale-95"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-manrope font-bold emerald-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        تأكيد الإرسال
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── To-currency bottom sheet ───────────────────────────────────────────────────
function CurrencySheet({ current, onSelect, onClose }) {
    const dragStartY = useRef(0);
    const [dragOffset, setDragOffset] = useState(0);

    function onTouchStart(e) { dragStartY.current = e.touches[0].clientY; }
    function onTouchMove(e) {
        const d = e.touches[0].clientY - dragStartY.current;
        if (d > 0) setDragOffset(d);
    }
    function onTouchEnd() {
        if (dragOffset > 72) onClose();
        setDragOffset(0);
    }

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
            dir="rtl" lang="ar"
        >
            <div
                className="sheet-slide-up w-full rounded-t-[28px] overflow-hidden"
                style={{
                    background: 'linear-gradient(160deg, #0f2420 0%, #0a1a16 100%)',
                    border: '1px solid rgba(52,211,153,0.14)',
                    borderBottom: 'none',
                    boxShadow: '0 -8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
                    transform: `translateY(${dragOffset}px)`,
                    transition: dragOffset === 0 ? 'transform 0.3s ease' : 'none',
                }}
                onClick={e => e.stopPropagation()}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                    <h3 className="font-manrope font-bold text-base text-white">عملة الاستلام</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">close</span>
                    </button>
                </div>
                <div className="px-4 py-3 space-y-1 pb-10">
                    {Object.entries(CURRENCIES).map(([code, { flag, name }]) => {
                        const isActive = current === code;
                        return (
                            <button
                                key={code}
                                onClick={() => { onSelect(code); onClose(); }}
                                className="flex w-full items-center gap-4 px-4 py-4 rounded-2xl transition-all active:scale-[0.98]"
                                style={{
                                    background: isActive ? 'rgba(52,211,153,0.12)' : 'transparent',
                                    border: isActive ? '1px solid rgba(52,211,153,0.25)' : '1px solid transparent',
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span className="w-10 h-10 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    {flag}
                                </span>
                                <div className="flex-1 text-right">
                                    <p className={`text-sm font-bold leading-tight ${isActive ? 'text-emerald-400' : 'text-white'}`}>{code}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{name}</p>
                                </div>
                                {isActive && (
                                    <span className="material-symbols-outlined text-[22px] text-emerald-400 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
const Sending = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { currentUserId, users } = useContext(UserContext);
    const { displayCurrency, setDisplayCurrency } = useContext(DisplayCurrencyContext);

    const [amount, setAmount] = useState('0');
    const [toUserId, setToUserId] = useState('');
    const [toCurrency, setToCurrency] = useState('SAR');
    const [recipientRef, setRecipientRef] = useState('');
    const [paymentDetails, setPaymentDetails] = useState('');
    const [error, setError] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [showToCurrencySheet, setShowToCurrencySheet] = useState(false);
    const [screen, setScreen] = useState('form'); // 'form' | 'loading' | 'success'
    const [successData, setSuccessData] = useState(null);

    const selectedReceiver = users.find(u => u.id === Number(toUserId));
    const currentUser = users.find(u => u.id === currentUserId);
    const numAmount = parseFloat(amount) || 0;
    const convertedAmount = convertAmount(numAmount, displayCurrency, toCurrency);
    const exchangeRate = numAmount > 0 ? (convertedAmount / numAmount).toFixed(4) : 0;

    const qrApplied = useRef(false);

    useEffect(() => {
        if (!state?.userId || !state?.amount) return;
        // If coming from QR, wait until users list is loaded so receiver is resolvable
        if (state.fromQR && users.length === 0) return;
        if (qrApplied.current) return;
        qrApplied.current = true;

        setToUserId(state.userId.toString());
        setAmount(state.amount.toString());
        if (state.recipientRef) setRecipientRef(state.recipientRef);
        if (state.paymentDetails) setPaymentDetails(state.paymentDetails);

        // Auto-select receiver's currency
        const receiver = users.find(u => u.id === Number(state.userId));
        if (receiver?.currency) setToCurrency(receiver.currency);

        // Skip form — open confirmation immediately
        if (state.fromQR) setShowConfirm(true);
    }, [state, users]);

    function handleConfirmClick() {
        if (!toUserId || !numAmount || numAmount <= 0) {
            setError('يرجى اختيار المستلم وإدخال مبلغ صالح');
            return;
        }
        setError('');
        setShowConfirm(true);
    }

    async function handleSend() {
        setShowConfirm(false);
        setScreen('loading');
        try {
            const res = await fetch(`${API}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromUserId: currentUserId,
                    toUserId: Number(toUserId),
                    amount: numAmount,
                    fromCurrency: displayCurrency,
                    toCurrency,
                    ...(recipientRef && { recipientRef }),
                    ...(paymentDetails && { paymentDetails }),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل التحويل');

            setSuccessData({
                amount: data.amount,
                convertedAmount: data.convertedAmount,
                fromCurrency: data.fromCurrency,
                toCurrency: data.toCurrency,
                fromName: currentUser?.name || 'أنت',
                toName: selectedReceiver?.name || '',
                timestamp: new Date(),
            });
            setTimeout(() => setScreen('success'), 1400);
        } catch (err) {
            setScreen('form');
            setError(err.message);
        }
    }

    function handleSendAgain() {
        setScreen('form');
        setSuccessData(null);
        setAmount('0');
        setToUserId('');
        setToCurrency('SAR');
        setRecipientRef('');
        setPaymentDetails('');
        setError('');
    }

    // ── Overlay screens ────────────────────────────────────────────────────────
    if (screen === 'loading' || screen === 'success') {
        return (
            <TransactionOverlay
                screen={screen}
                data={successData}
                onDone={() => navigate('/')}
                onSendAgain={handleSendAgain}
            />
        );
    }

    // ── Form ───────────────────────────────────────────────────────────────────
    return (
        <div className="bg-surface-dim font-body-md text-on-surface min-h-screen pb-40 dark" dir="rtl" lang="ar">

            <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-transparent border-b border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="hover:bg-emerald-500/10 p-2 rounded-full transition-all">
                        <span className="material-symbols-outlined text-emerald-500">arrow_forward</span>
                    </button>
                    <h1 className="font-manrope font-bold text-lg text-emerald-500">إرسال أموال</h1>
                </div>
                <select
                    value={displayCurrency}
                    onChange={(e) => setDisplayCurrency(e.target.value)}
                    className="bg-white/5 border border-primary/30 rounded-lg px-3 py-2 text-xs text-primary outline-none focus:border-primary/50 cursor-pointer"
                >
                    <option value="SAR" className="bg-slate-900">عرض SAR</option>
                    <option value="AED" className="bg-slate-900">عرض AED</option>
                    <option value="EGP" className="bg-slate-900">عرض EGP</option>
                    <option value="OMR" className="bg-slate-900">عرض OMR</option>
                </select>
            </header>

            <main className="pt-24 px-container-padding max-w-md mx-auto space-y-stack-lg">

                {/* ── Amount conversion ── */}
                <section className="w-full space-y-2">

                    {/* From card — read-only currency (locked to displayCurrency) */}
                    <div className="rounded-[20px] p-5" style={{
                        background: 'linear-gradient(135deg, #091a16 0%, #0d2218 100%)',
                        border: '1px solid rgba(52,211,153,0.10)',
                        boxShadow: 'inset 0 0 30px rgba(52,211,153,0.03), 0 4px 24px rgba(0,0,0,0.45)',
                    }}>
                        {/* Flag + code header (non-interactive) */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0"
                                style={{ background: 'rgba(255,255,255,0.06)' }}>
                                {CURRENCIES[displayCurrency]?.flag ?? '🏳️'}
                            </span>
                            <span className="text-sm font-bold text-white">{displayCurrency}</span>
                            <span className="text-[10px] text-slate-600 mr-auto flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[13px]">lock</span>
                            </span>
                        </div>

                        {/* Amount input */}
                        <input
                            className="bg-transparent outline-none w-full text-3xl font-bold text-white placeholder-white/20 text-left"
                            dir="ltr"
                            placeholder="0"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            onWheel={(e) => e.currentTarget.blur()}
                        />

                        {/* Balance hint */}
                        {currentUser?.balance != null && (
                            <div className="flex items-center gap-1.5 mt-3">
                                <span className="material-symbols-outlined text-[13px] text-amber-400/90 shrink-0"
                                    style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                                <span className="text-[11px] text-slate-500">
                                    يمكنك تحويل حتى{' '}
                                    <span className="text-slate-400 font-semibold">
                                        {convertAmount(currentUser.balance, currentUser.currency, displayCurrency).toLocaleString()} {displayCurrency}
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Exchange rate pill — between cards */}
                    <div className="flex items-center justify-center py-1 relative z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[15px] text-emerald-400">swap_vert</span>
                            </div>
                            <span
                                className="text-[11px] text-slate-400 px-3 py-1 rounded-full border border-white/8"
                                style={{ background: 'rgba(255,255,255,0.03)' }}
                                dir="ltr"
                            >
                                1 {displayCurrency} = {exchangeRate} {toCurrency}
                            </span>
                        </div>
                    </div>

                    {/* To card — clickable flag/code header opens currency sheet */}
                    <div className="rounded-[20px] p-5" style={{
                        background: 'linear-gradient(135deg, #091a16 0%, #0d2218 100%)',
                        border: '1px solid rgba(52,211,153,0.10)',
                        boxShadow: 'inset 0 0 30px rgba(52,211,153,0.03), 0 4px 24px rgba(0,0,0,0.45)',
                    }}>
                        {/* Flag + code header (clickable) */}
                        <button
                            onClick={() => setShowToCurrencySheet(true)}
                            className="flex items-center gap-2 mb-4 hover:opacity-80 active:scale-95 transition-all"
                        >
                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0"
                                style={{ background: 'rgba(255,255,255,0.06)' }}>
                                {CURRENCIES[toCurrency]?.flag ?? '🏳️'}
                            </span>
                            <span className="text-sm font-bold text-white">{toCurrency}</span>
                            <span className="material-symbols-outlined text-[18px] text-emerald-400 mr-1">expand_more</span>
                        </button>

                        {/* Converted amount (read-only) */}
                        <p className="text-3xl font-bold text-white/90 text-left" dir="ltr">
                            {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>

                </section>

                {/* ── Optional fields ── */}
                <section className="space-y-3">
                    <h2 className="font-headline-md text-body-lg font-semibold px-1">تفاصيل إضافية</h2>

                    <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px] text-teal-400 shrink-0">tag</span>
                        <input
                            value={recipientRef}
                            onChange={(e) => setRecipientRef(e.target.value)}
                            placeholder="مرجع المستلم (اختياري)"
                            className="bg-transparent outline-none w-full text-sm text-on-surface placeholder-on-surface-variant/40"
                        />
                    </div>

                    <div className="glass-card rounded-2xl px-4 py-3 flex items-start gap-3">
                        <span className="material-symbols-outlined text-[20px] text-teal-400 shrink-0 mt-0.5">edit_note</span>
                        <textarea
                            value={paymentDetails}
                            onChange={(e) => setPaymentDetails(e.target.value)}
                            placeholder="تفاصيل الدفع (اختياري)"
                            rows={2}
                            className="bg-transparent outline-none w-full text-sm text-on-surface placeholder-on-surface-variant/40 resize-none"
                        />
                    </div>
                </section>

                {/* ── Recipient picker ── */}
                <section className="space-y-stack-sm">
                    <h2 className="font-headline-md text-body-lg font-semibold px-1">إرسال إلى</h2>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                        {users.filter(u => u.id !== currentUserId).map((user) => (
                            <button
                                key={user.id}
                                onClick={() => { setToUserId(user.id.toString()); setToCurrency(user.currency); }}
                                className={`flex flex-col items-center space-y-2 shrink-0 ${toUserId === user.id.toString() ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <div className={`w-16 h-16 rounded-full p-[2px] ${toUserId === user.id.toString() ? 'bg-gradient-to-tr from-primary to-secondary' : 'bg-white/10'}`}>
                                    <div className="w-full h-full rounded-full bg-surface-container-highest flex items-center justify-center border-2 border-surface-dim font-headline-md text-primary">
                                        {user.name[0]}
                                    </div>
                                </div>
                                <span className="font-label-caps text-label-caps text-on-surface">{user.name}</span>
                                <span className="text-[10px] text-on-surface-variant">{user.currency}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-center">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

            </main>

            {/* ── Confirm button ── */}
            <div className="fixed bottom-0 left-0 right-0 p-container-padding bg-gradient-to-t from-surface-dim via-surface-dim/95 to-transparent pb-8">
                <button
                    onClick={handleConfirmClick}
                    disabled={!toUserId || !numAmount}
                    className="w-full h-16 bg-primary text-on-primary font-manrope font-bold text-lg rounded-[24px] emerald-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40"
                >
                    <span>تأكيد وإرسال</span>
                    <span className="material-symbols-outlined">send</span>
                </button>
            </div>

            {/* ── To-currency sheet ── */}
            {showToCurrencySheet && (
                <CurrencySheet
                    current={toCurrency}
                    onSelect={setToCurrency}
                    onClose={() => setShowToCurrencySheet(false)}
                />
            )}

            {/* ── Confirmation modal ── */}
            {showConfirm && (
                <ConfirmModal
                    amount={numAmount}
                    fromCurrency={displayCurrency}
                    convertedAmount={convertedAmount}
                    toCurrency={toCurrency}
                    exchangeRate={exchangeRate}
                    fromName={currentUser?.name || 'أنت'}
                    toName={selectedReceiver?.name || ''}
                    recipientRef={recipientRef}
                    onCancel={() => setShowConfirm(false)}
                    onConfirm={handleSend}
                />
            )}
        </div>
    );
};

export default Sending;
