import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { DisplayCurrencyContext } from '../contexts/DisplayCurrencyContext';
import useCurrencyConverter from '../hooks/useCurrencyConverter';
import './Dashboard.css';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const API = `${import.meta.env.VITE_API_URL}/api`;

const SmartInsight = ({ expenses, savings }) => {
    if (expenses === 0 && savings === 0) return null;

    const isWarning = expenses > savings;

    const message = isWarning
        ? '⚠️ تصرف أكثر مما تدخر — حاول تقلل المصاريف'
        : '✅ رائع! ادخارك يتفوق على مصاريفك — استمر!';

    return (
        <div className="glass-card rounded-2xl px-4 py-3 flex gap-3 border border-white/10 mt-4">
            <span>{isWarning ? '💡' : '🌱'}</span>
            <p className={`text-sm font-semibold ${isWarning ? 'text-amber-400' : 'text-primary'}`}>
                {message}
            </p>
        </div>
    );
};

function useAnimatedNumber(target, duration = 600) {
    const [value, setValue] = useState(target);

    useEffect(() => {
        let start = null;
        const initial = value;

        const step = (timestamp) => {
            if (!start) start = timestamp;

            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setValue(initial + (target - initial) * eased);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }, [target]);

    return value;
}

const Dashboard = () => {

    const navigate = useNavigate();
    const { currentUserId, setCurrentUserId, users } = useContext(UserContext);
    const { displayCurrency, setDisplayCurrency } = useContext(DisplayCurrencyContext);
    const { convert } = useCurrencyConverter();
    const { toasts, showToast, removeToast } = useToast();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    const currencySymbols = {
        SAR: 'ر.س',
        AED: 'د.إ',
        EGP: 'ج.م',
        OMR: 'ر.ع',
    };
    // Split percentages modal state
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
    const [sheetDragOffset, setSheetDragOffset] = useState(0);
    const sheetDragStartY = useRef(0);

    function handleSheetTouchStart(e) {
        sheetDragStartY.current = e.touches[0].clientY;
    }
    function handleSheetTouchMove(e) {
        const delta = e.touches[0].clientY - sheetDragStartY.current;
        if (delta > 0) setSheetDragOffset(delta);
    }
    function handleSheetTouchEnd() {
        if (sheetDragOffset > 72) setShowCurrencyMenu(false);
        setSheetDragOffset(0);
    }
    const [percentages, setPercentages] = useState({ expenses: 50, savings: 30, commitments: 20 });
    const [percentError, setPercentError] = useState('');
    const [percentLoading, setPercentLoading] = useState(false);

    async function fetchDashboard() {
        setLoading(true);
        try {
            const res = await fetch(`${API}/dashboard/${currentUserId}`);
            const data = await res.json();
            setDashboard(data);

            // Fetch current percentages
            const percentRes = await fetch(`${API}/pockets/${currentUserId}`);
            const percentData = await percentRes.json();

            const getPercent = (name) =>
                percentData.find(p => p.name === name)?.percentage || 0;

            setPercentages({
                expenses: Math.round(getPercent('expenses') * 100),
                savings: Math.round(getPercent('savings') * 100),
                commitments: Math.round(getPercent('commitments') * 100),
            });
        } catch (err) {
            console.error('Failed to fetch dashboard:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (currentUserId) fetchDashboard();
    }, [currentUserId]);
    useEffect(() => {
        if (dashboard?.user?.currency) {
            setDisplayCurrency(dashboard.user.currency);
        }
    }, [dashboard?.user?.id]);
    const userCurrency = dashboard?.user?.currency || 'SAR';
    const activeCurrency = displayCurrency || userCurrency;
    const displayBalance =
        userCurrency === activeCurrency
            ? dashboard?.user?.balance
            : convert(
                dashboard?.user?.balance,
                userCurrency,
                activeCurrency
            );
    const smoothBalance = useAnimatedNumber(displayBalance || 0);
    const pocketBalance = (name) => {
        const p = dashboard?.pockets?.find(p => p.name === name);
        if (!p) return 0;

        if (userCurrency === activeCurrency) {
            return p.balance;
        }

        return convert(p.balance, userCurrency, activeCurrency);
    };

    function txLabel(tx) {
        if (tx.type === 'send') {
            const recipient = users.find(u => u.id === tx.toUserId);
            const name = recipient?.name ?? `مستخدم ${tx.toUserId}`;
            return `تحويل إلى ${name}`;
        }
        if (tx.type === 'receive') {
            const sender = users.find(u => u.id === tx.fromUserId);
            const name = sender?.name ?? 'مستخدم';
            return `استلام من ${name}`;
        }
        return 'معاملة';

    }

    function txAmount(tx) {
        const converted = convert(tx.amount, userCurrency, activeCurrency);

        return tx.type === 'send'
            ? `-${converted.toLocaleString()} ${currencySymbols[activeCurrency]}`
            : `+${converted.toLocaleString()} ${currencySymbols[activeCurrency]}`;
    }

    function txDate(isoString) {
        return new Date(isoString).toLocaleTimeString('ar-SA', {
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    }

    const currentUser = users.find(u => u.id === currentUserId);



    async function handleUpdatePercentages() {
        setPercentError('');
        const total = percentages.expenses + percentages.savings + percentages.commitments;

        if (Math.abs(total - 100) > 1) {
            setPercentError(`المجموع يجب أن يكون 100٪ (الحالي: ${total}٪)`);
            return;
        }

        setPercentLoading(true);
        try {
            const res = await fetch(`${API}/pockets/update-percentages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUserId,
                    expenses: percentages.expenses / 100,
                    savings: percentages.savings / 100,
                    commitments: percentages.commitments / 100,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل التحديث');

            setShowSplitModal(false);
            showToast('تم التقسيم تلقائيًا', 'split');
            await fetchDashboard();
        } catch (err) {
            setPercentError(err.message);
        } finally {
            setPercentLoading(false);
        }
    }

    const totalPercent = percentages.expenses + percentages.savings + percentages.commitments;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center dark bg-slate-950">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce mx-1"></div>
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce mx-1 [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary/30 animate-bounce mx-1 [animation-delay:0.4s]"></div>
            </div>
        );
    }
    function handlePercentChange(type, value) {
        const newValue = Number(value);
        const current = { ...percentages };

        const otherKeys = Object.keys(current).filter(k => k !== type);

        const totalWithoutCurrent = otherKeys.reduce((sum, k) => sum + current[k], 0);
        const newTotal = newValue + totalWithoutCurrent;

        if (newTotal <= 100) {
            setPercentages({
                ...current,
                [type]: newValue
            });
            return;
        }

        const overflow = newTotal - 100;

        let updated = { ...current, [type]: newValue };

        let remainingOverflow = overflow;

        for (let key of otherKeys) {
            if (remainingOverflow <= 0) break;

            const deduction = Math.min(updated[key], remainingOverflow);
            updated[key] -= deduction;
            remainingOverflow -= deduction;
        }

        setPercentages(updated);
    }
    return (
        <div className="font-body-md text-on-surface dark" dir="rtl" lang="ar">
            <nav className="bg-slate-950/80 backdrop-blur-xl fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 rtl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden">
                        <img alt="User" className="w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBv3_tjdSmOruHigzE5Q_ndgiWEdvRJP3priOhx-FULziMShIRDES6PCI802Q6O9aB46APGUBFlqaLnX2Wc_vrvWyf8UMr8eX8dR-DTfYm5UxBn395_pZetzSouislKRsyGaNObazmRfnb-b-ncznchVbSdVkW4S4U2aIm-VXdRJ4ajoVvgfk6phVfFg5N8rcktvJPnr3mpLXU4G_pdYuJ07YwaKiycjJNKs-C0LtmK_kycckHd-Ezjn6--EFxIbqYRy07f8VkBEJhv" />
                    </div>
                    <span className="font-headline-md text-primary text-sm font-semibold tracking-tight">
                        صباح الخير، {dashboard?.user?.name}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={currentUserId}
                        onChange={(e) => setCurrentUserId(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50 cursor-pointer"
                    >
                        {users.map((u) => (
                            <option key={u.id} value={u.id} className="bg-slate-900">
                                {u.name} ({u.currency})
                            </option>
                        ))}
                    </select>



                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-teal-500">notifications</span>
                    </button>
                </div>
            </nav>

            <main className="pt-24 pb-32 px-container-padding flex flex-col gap-stack-md">
                <section className="relative overflow-hidden rounded-[24px] p-6 bg-gradient-to-br from-primary-container to-surface-dim emerald-glow border border-white/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-on-primary-container">{displayCurrency}</span>
                            {userCurrency !== displayCurrency && (
                                <span className="text-[10px] text-primary/60">({userCurrency})</span>
                            )}
                            <button
                                onClick={() => setShowCurrencyMenu(true)}
                                className="flex items-center justify-center text-secondary hover:opacity-75 transition-opacity"
                            >
                                <span className="material-symbols-outlined text-sm">expand_more</span>
                            </button>
                        </div>
                        <button className="text-white/60 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">visibility</span>
                        </button>
                    </div>
                    <div className="flex flex-col gap-1 mb-6">
                        <h1 className="font-financial-val text-white text-financial-val">
                            {Math.round(smoothBalance).toLocaleString()} {currencySymbols[activeCurrency]}                        </h1>
                        {userCurrency !== displayCurrency && (
                            <p className="text-xs text-white/60">
                                ({dashboard?.user?.balance?.toLocaleString()} {userCurrency} فعلياً)
                            </p>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>

                            <span className="text-xs font-label-caps text-primary/80 tracking-wider">
                                التقسيم التلقائي مفعّل
                            </span>

                            <button
                                onClick={() => setShowSplitModal(true)}
                                className="text-xs text-white/60 hover:text-primary underline transition-colors"
                            >
                                تعديل
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-gutter">
                        <button
                            onClick={() => navigate('/sending')}
                            className="flex flex-col items-center gap-2 group active:scale-90 transition-transform duration-150"
                        >
                            <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center
        group-hover:bg-primary/20 group-hover:scale-110
        group-active:scale-95
        transition-all duration-200
        shadow-[0_0_0_0_rgba(132,213,197,0)]
        group-hover:shadow-[0_0_16px_2px_rgba(132,213,197,0.25)]"
                            >
                                <span className="material-symbols-outlined text-primary">send</span>
                            </div>

                            <span className="text-xs font-label-caps text-on-surface group-hover:text-primary transition-colors">
                                إرسال
                            </span>
                        </button>
                        <button onClick={() => navigate('/receive')} className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                <span className="material-symbols-outlined text-primary">call_received</span>
                            </div>
                            <span className="text-xs font-label-caps text-on-surface">استلام</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                            </div>
                            <span className="text-xs font-label-caps text-on-surface">شحن</span>
                        </button>
                    </div>
                </section>

                <section className="flex flex-col gap-gutter">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="font-headline-md text-lg text-on-surface">صناديقي</h2>
                        <button onClick={() => navigate('/pockets')} className="text-primary text-sm font-semibold">رؤية الكل</button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-gutter">
                        <div className="glass-card p-5 rounded-[28px] border-l-4 border-l-primary/50 flex flex-col gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">shopping_bag</span>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant mb-1 font-label-caps">مصاريف ({percentages.expenses}٪)</p>
                                <p className="font-headline-md text-md text-on-surface">{pocketBalance('expenses')} {currencySymbols[activeCurrency]}</p>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${percentages.expenses}%` }}></div>
                            </div>
                        </div>
                        <div className="glass-card p-5 rounded-[28px] border-l-4 border-l-secondary/50 flex flex-col gap-4">
                            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-secondary">savings</span>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant mb-1 font-label-caps">ادخار ({percentages.savings}٪)</p>
                                <p className="font-headline-md text-md text-on-surface">{pocketBalance('savings')} {currencySymbols[activeCurrency]}</p>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-secondary rounded-full" style={{ width: `${percentages.savings}%` }}></div>
                            </div>
                        </div>
                        <div className="glass-card p-5 rounded-[28px] border-l-4 border-l-tertiary/50 flex flex-col gap-4 col-span-2 lg:col-span-1">
                            <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-tertiary">event_repeat</span>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant mb-1 font-label-caps">التزامات ({percentages.commitments}٪)</p>
                                <p className="font-headline-md text-md text-on-surface">{pocketBalance('commitments')} {currencySymbols[activeCurrency]}</p>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-tertiary rounded-full" style={{ width: `${percentages.commitments}%` }}></div>
                            </div>
                        </div>
                    </div>
                </section>
                <SmartInsight
                    expenses={pocketBalance('expenses')}
                    savings={pocketBalance('savings')}
                />
                <section className="flex flex-col gap-gutter">
                    <h2 className="font-headline-md text-lg text-on-surface px-1">المعاملات الأخيرة</h2>
                    <div className="flex flex-col gap-3">
                        {dashboard?.recentTransactions?.length === 0 && (
                            <p className="text-center text-on-surface-variant text-sm py-4">لا توجد معاملات بعد</p>
                        )}
                        {dashboard?.recentTransactions?.map((tx) => (
                            <div key={tx.id} className="glass-card p-4 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.type === 'receive' ? 'bg-primary/10' : 'bg-white/5'}`}>
                                        <span className={`material-symbols-outlined ${tx.type === 'receive' ? 'text-primary' : 'text-on-surface-variant'}`}>
                                            {tx.type === 'receive' ? 'call_received' : 'send'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-headline-md text-sm text-on-surface">{txLabel(tx)}</span>
                                        <span className="text-xs text-on-surface-variant font-label-caps">{txDate(tx.createdAt)}</span>
                                    </div>
                                </div>
                                <span className={`font-headline-md text-sm ${tx.type === 'receive' ? 'text-primary' : 'text-white'}`}>
                                    {txAmount(tx)}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Send Modal */}


            {/* Split Percentages Modal */}
            {showSplitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
                    <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[28px] p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-headline-md text-on-surface font-bold">تعديل نسب التقسيم</h3>
                            <button onClick={() => { setShowSplitModal(false); setPercentError(''); }} className="text-slate-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
                            <p className="text-xs text-on-surface-variant mb-1">المجموع الحالي</p>
                            <p className={`text-2xl font-bold ${Math.abs(totalPercent - 100) <= 1 ? 'text-primary' : 'text-red-400'}`}>
                                {totalPercent}٪
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Expenses */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">shopping_bag</span>
                                    مصاريف ({percentages.expenses}٪)
                                </label>
                                <input

                                    type="range"
                                    min="0"
                                    max="100"
                                    value={percentages.expenses}
                                    onChange={(e) => handlePercentChange('expenses', e.target.value)}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" />
                            </div>

                            {/* Savings */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-secondary">savings</span>
                                    ادخار ({percentages.savings}٪)
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={percentages.savings}
                                    onChange={(e) => handlePercentChange('savings', e.target.value)}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                                />
                            </div>

                            {/* Commitments */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-tertiary">event_repeat</span>
                                    التزامات ({percentages.commitments}٪)
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={percentages.commitments}
                                    onChange={(e) => handlePercentChange('commitments', e.target.value)}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-tertiary"
                                />
                            </div>

                            {percentError && <p className="text-red-400 text-xs text-center">{percentError}</p>}
                        </div>

                        <button
                            onClick={handleUpdatePercentages}
                            disabled={percentLoading || Math.abs(totalPercent - 100) > 1}
                            className="w-full py-4 rounded-2xl bg-primary text-on-primary font-manrope font-semibold text-sm tracking-wide transition-all active:scale-95 disabled:opacity-40"
                        >
                            {percentLoading ? 'جاري التحديث...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </div>
            )}

            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* ── Currency bottom sheet ── */}
            {showCurrencyMenu && (
                <div
                    className="fixed inset-0 z-[200] flex items-end backdrop-fade-in"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
                    onClick={() => setShowCurrencyMenu(false)}
                    dir="rtl"
                    lang="ar"
                >
                    <div
                        className="sheet-slide-up w-full rounded-t-[28px] overflow-hidden"
                        style={{
                            background: 'linear-gradient(160deg, #0f2420 0%, #0a1a16 100%)',
                            border: '1px solid rgba(52,211,153,0.14)',
                            borderBottom: 'none',
                            boxShadow: '0 -8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
                            transform: `translateY(${sheetDragOffset}px)`,
                            transition: sheetDragOffset === 0 ? 'transform 0.3s ease' : 'none',
                        }}
                        onClick={e => e.stopPropagation()}
                        onTouchStart={handleSheetTouchStart}
                        onTouchMove={handleSheetTouchMove}
                        onTouchEnd={handleSheetTouchEnd}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                            <h3 className="font-manrope font-bold text-base text-white">اختر العملة</h3>
                            <button
                                onClick={() => setShowCurrencyMenu(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px] text-slate-400">close</span>
                            </button>
                        </div>

                        {/* Currency list */}
                        <div className="px-4 py-3 space-y-1 pb-10">
                            {[
                                { code: 'SAR', flag: '🇸🇦', name: 'ريال سعودي' },
                                { code: 'AED', flag: '🇦🇪', name: 'درهم إماراتي' },
                                { code: 'EGP', flag: '🇪🇬', name: 'جنيه مصري' },
                                { code: 'OMR', flag: '🇴🇲', name: 'ريال عُماني' },
                            ].map(({ code, flag, name }) => {
                                const isActive = displayCurrency === code;
                                return (
                                    <button
                                        key={code}
                                        onClick={() => { setDisplayCurrency(code); setShowCurrencyMenu(false); }}
                                        className="flex w-full items-center gap-4 px-4 py-4 rounded-2xl transition-all active:scale-[0.98]"
                                        style={{
                                            background: isActive
                                                ? 'rgba(52,211,153,0.12)'
                                                : 'transparent',
                                            border: isActive
                                                ? '1px solid rgba(52,211,153,0.25)'
                                                : '1px solid transparent',
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {/* Flag circle */}
                                        <span className="w-10 h-10 rounded-full flex items-center justify-center text-2xl shrink-0"
                                            style={{ background: 'rgba(255,255,255,0.06)' }}>
                                            {flag}
                                        </span>

                                        {/* Text */}
                                        <div className="flex-1 text-right">
                                            <p className={`text-sm font-bold leading-tight ${isActive ? 'text-emerald-400' : 'text-white'}`}>
                                                {code}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">{name}</p>
                                        </div>

                                        {/* Check */}
                                        {isActive && (
                                            <span
                                                className="material-symbols-outlined text-[22px] text-emerald-400 shrink-0"
                                                style={{ fontVariationSettings: "'FILL' 1" }}
                                            >
                                                check_circle
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-end pb-8 pt-4 px-4 rtl bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 rounded-t-[28px] shadow-[0_-10px_30px_-15px_rgba(0,105,92,0.3)]">
                <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-teal-400 drop-shadow-[0_0_8px_rgba(0,169,110,0.5)] transition-all">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">الرئيسية</span>
                </button>
                <div className="relative -top-6">
                    <button onClick={() => navigate('/scan')} className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(132,213,197,0.4)] hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-on-primary text-3xl">qr_code_scanner</span>
                    </button>
                </div>
                <button onClick={() => navigate('/analytics')} className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all">
                    <span className="material-symbols-outlined text-2xl">receipt_long</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">التحليلات</span>
                </button>
            </nav>
        </div>
    );
};

export default Dashboard;