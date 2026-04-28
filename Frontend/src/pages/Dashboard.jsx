import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { DisplayCurrencyContext } from '../contexts/DisplayCurrencyContext';
import useCurrencyConverter from '../hooks/useCurrencyConverter';
import './Dashboard.css';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const API = 'http://localhost:5000/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const { currentUserId, setCurrentUserId, users } = useContext(UserContext);
    const { displayCurrency, setDisplayCurrency } = useContext(DisplayCurrencyContext);
    const { convert } = useCurrencyConverter(displayCurrency);
    const { toasts, showToast, removeToast } = useToast();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    // Split percentages modal state
    const [showSplitModal, setShowSplitModal] = useState(false);
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
            setPercentages({
                expenses: Math.round(percentData.expenses * 100),
                savings: Math.round(percentData.savings * 100),
                commitments: Math.round(percentData.commitments * 100),
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

    const userCurrency = dashboard?.user?.currency || 'SAR';
    const displayBalance = convert(dashboard?.user?.balance || 0, userCurrency);

    function pocketBalance(name) {
        const p = dashboard?.pockets?.find((p) => p.name === name);
        if (!p) return '0';
        const converted = convert(p.balance, userCurrency);
        return converted.toLocaleString();
    }

    function txLabel(tx) {
        if (tx.type === 'send') return `تحويل إلى مستخدم ${tx.toUserId}`;
        return 'استلام مبلغ';
    }

    function txAmount(tx) {
        const converted = convert(tx.amount, userCurrency);
        return tx.type === 'send'
            ? `-${converted.toLocaleString()} ${displayCurrency}`
            : `+${converted.toLocaleString()} ${displayCurrency}`;
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
            showToast('تم تحديث نسب التقسيم بنجاح', 'split');
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

                    <select
                        value={displayCurrency}
                        onChange={(e) => setDisplayCurrency(e.target.value)}
                        className="bg-white/5 border border-primary/30 rounded-lg px-3 py-2 text-sm text-primary outline-none focus:border-primary/50 cursor-pointer"
                        title="عرض الأرصدة بعملة مختلفة (للعرض فقط)"
                    >
                        <option value="SAR" className="bg-slate-900">عرض بـ SAR</option>
                        <option value="AED" className="bg-slate-900">عرض بـ AED</option>
                        <option value="EGP" className="bg-slate-900">عرض بـ EGP</option>
                        <option value="OMR" className="bg-slate-900">عرض بـ OMR</option>
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
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <span className="text-xs font-label-caps text-on-primary-container">{displayCurrency}</span>
                            {userCurrency !== displayCurrency && (
                                <span className="text-[10px] text-primary/60">({userCurrency})</span>
                            )}
                            <span className="material-symbols-outlined text-sm text-secondary">expand_more</span>
                        </div>
                        <button className="text-white/60 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">visibility</span>
                        </button>
                    </div>
                    <div className="flex flex-col gap-1 mb-6">
                        <h1 className="font-financial-val text-white text-financial-val">
                            {displayBalance.toLocaleString()} ر.س
                        </h1>
                        {userCurrency !== displayCurrency && (
                            <p className="text-xs text-white/60">
                                ({dashboard?.user?.balance?.toLocaleString()} {userCurrency} فعلياً)
                            </p>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(132,213,197,0.8)]"></div>
                            <span className="text-xs font-label-caps text-primary/80">التقسيم التلقائي مفعل</span>
                            <button
                                onClick={() => setShowSplitModal(true)}
                                className="text-xs text-white/60 hover:text-primary underline"
                            >
                                تعديل النسب
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-gutter">
                        <button onClick={() => navigate('/sending')} className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                <span className="material-symbols-outlined text-primary">send</span>
                            </div>
                            <span className="text-xs font-label-caps text-on-surface">إرسال</span>
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
                                <p className="font-headline-md text-md text-on-surface">{pocketBalance('expenses')} {displayCurrency}</p>
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
                                <p className="font-headline-md text-md text-on-surface">{pocketBalance('savings')} {displayCurrency}</p>
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
                                <p className="font-headline-md text-md text-on-surface">{pocketBalance('commitments')} {displayCurrency}</p>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-tertiary rounded-full" style={{ width: `${percentages.commitments}%` }}></div>
                            </div>
                        </div>
                    </div>
                </section>

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
                                    onChange={(e) => setPercentages({ ...percentages, expenses: Number(e.target.value) })}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
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
                                    onChange={(e) => setPercentages({ ...percentages, savings: Number(e.target.value) })}
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
                                    onChange={(e) => setPercentages({ ...percentages, commitments: Number(e.target.value) })}
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
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-end pb-8 pt-4 px-4 rtl bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 rounded-t-[28px] shadow-[0_-10px_30px_-15px_rgba(0,105,92,0.3)]">
                <a className="flex flex-col items-center justify-center text-teal-400 drop-shadow-[0_0_8px_rgba(0,169,110,0.5)] transition-all" href="#">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">الرئيسية</span>
                </a>
                <div className="relative -top-6">
                    <button className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(132,213,197,0.4)] hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-on-primary text-3xl">qr_code_scanner</span>
                    </button>
                </div>
                <a className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all" href="#">
                    <span className="material-symbols-outlined text-2xl">receipt_long</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">المعاملات</span>
                </a>
            </nav>
        </div>
    );
};

export default Dashboard;