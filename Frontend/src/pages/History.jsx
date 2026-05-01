import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { DisplayCurrencyContext } from '../contexts/DisplayCurrencyContext';
import useCurrencyConverter from '../hooks/useCurrencyConverter';
import AIChatModal from '../components/AIChatModal';
import './Dashboard.css';

const API = `${import.meta.env.VITE_API_URL}/api`;

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function txDate(isoString) {
    return new Date(isoString).toLocaleTimeString('ar-SA', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

const History = () => {
    const navigate = useNavigate();
    const { currentUserId, users } = useContext(UserContext);
    const { displayCurrency } = useContext(DisplayCurrencyContext);
    const { convert } = useCurrencyConverter();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [filter, setFilter] = useState('all');

    const currentUser = users.find(u => u.id === currentUserId);
    const userCurrency = currentUser?.currency || 'SAR';
    const activeCurrency = displayCurrency || userCurrency;

    const currencySymbols = {
        SAR: 'ر.س',
        AED: 'د.إ',
        EGP: 'ج.م',
        OMR: 'ر.ع',
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!currentUserId) return;
        fetchTransactions();
    }, [currentUserId]);

    async function fetchTransactions() {
        setLoading(true);
        try {
            const res = await fetch(`${API}/users/${currentUserId}/transactions`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setLoading(false);
        }
    }

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
        const baseAmount = tx.type === 'receive' ? (tx.convertedAmount || tx.amount) : tx.amount;
        const converted = convert(baseAmount, userCurrency, activeCurrency);
        return tx.type === 'send'
            ? `-${Math.round(converted).toLocaleString()} ${currencySymbols[activeCurrency]}`
            : `+${Math.round(converted).toLocaleString()} ${currencySymbols[activeCurrency]}`;
    }

    function getModalData(tx) {
        let fromName = 'مستخدم';
        let toName = 'مستخدم';
        
        if (tx.type === 'send') {
            fromName = currentUser?.name || 'أنت';
            const recipient = users.find(u => u.id === tx.toUserId);
            toName = recipient?.name ?? `مستخدم ${tx.toUserId}`;
        } else {
            const sender = users.find(u => u.id === tx.fromUserId);
            fromName = sender?.name ?? 'مستخدم';
            toName = currentUser?.name || 'أنت';
        }

        const rows = [
            { icon: 'schedule', label: 'التاريخ والوقت', value: formatDateTime(tx.createdAt) },
            { icon: 'person', label: 'من', value: fromName },
            { icon: 'person_add', label: 'إلى', value: toName },
            { icon: 'payments', label: 'المبلغ الأساسي', value: `${Number(tx.amount).toLocaleString()} ${tx.fromCurrency}` },
        ];

        if (tx.convertedAmount && tx.fromCurrency !== tx.toCurrency) {
            rows.push({ icon: 'currency_exchange', label: 'بعد التحويل', value: `${Number(tx.convertedAmount).toLocaleString()} ${tx.toCurrency}` });
        }

        if (tx.recipientRef) {
            rows.push({ icon: 'tag', label: 'المرجع', value: tx.recipientRef });
        }
        if (tx.paymentDetails) {
            rows.push({ icon: 'edit_note', label: 'التفاصيل', value: tx.paymentDetails });
        }

        return rows;
    }

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;
        return tx.type === filter;
    });

    const groupedTransactions = filteredTransactions.reduce((acc, tx) => {
        const txDateObj = new Date(tx.createdAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let dateLabel = txDateObj.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
        
        if (txDateObj.toDateString() === today.toDateString()) {
            dateLabel = 'اليوم';
        } else if (txDateObj.toDateString() === yesterday.toDateString()) {
            dateLabel = 'الأمس';
        }

        if (!acc[dateLabel]) {
            acc[dateLabel] = [];
        }
        acc[dateLabel].push(tx);
        return acc;
    }, {});

    // Stats calculations (Last 30 days to prevent empty charts on the 1st of the month)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const currentMonthTxs = transactions.filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate >= thirtyDaysAgo;
    });

    const totalIncome = currentMonthTxs
        .filter(tx => tx.type === 'receive')
        .reduce((sum, tx) => sum + convert((tx.convertedAmount || tx.amount), userCurrency, activeCurrency), 0);
        
    const totalExpenses = currentMonthTxs
        .filter(tx => tx.type === 'send')
        .reduce((sum, tx) => sum + convert(tx.amount, userCurrency, activeCurrency), 0);

    const totalVolume = totalIncome + totalExpenses;
    const incomePercent = totalVolume > 0 ? (totalIncome / totalVolume) * 100 : 0;
    const expensePercent = totalVolume > 0 ? (totalExpenses / totalVolume) * 100 : 0;

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
        <div className="font-body-md text-on-surface dark min-h-screen bg-slate-950" dir="rtl" lang="ar">
            <header className="fixed top-0 left-0 w-full z-40 flex flex-col bg-slate-950/90 backdrop-blur-xl border-b border-white/10 pt-4 pb-4">
                <div className="flex items-center justify-between px-6 h-12 mb-2">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="hover:bg-emerald-500/10 p-2 rounded-full transition-all">
                            <span className="material-symbols-outlined text-emerald-500">arrow_forward</span>
                        </button>
                        <h1 className="font-manrope font-bold text-lg text-emerald-500">المعاملات</h1>
                    </div>
                    <button 
                        onClick={() => setIsChatOpen(true)}
                        className="relative w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-[2px] shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:scale-110 active:scale-95 transition-all group"
                    >
                        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center relative overflow-hidden">
                            <span className="material-symbols-outlined text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse">smart_toy</span>
                        </div>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
                        </span>
                    </button>
                </div>
                
                {/* Filter Tabs */}
                <div className="flex px-6 gap-2">
                    <button 
                        onClick={() => setFilter('all')} 
                        className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${filter === 'all' ? 'bg-primary text-on-primary' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                    >
                        الكل
                    </button>
                    <button 
                        onClick={() => setFilter('receive')} 
                        className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${filter === 'receive' ? 'bg-primary text-on-primary' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                    >
                        استلام
                    </button>
                    <button 
                        onClick={() => setFilter('send')} 
                        className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${filter === 'send' ? 'bg-primary text-on-primary' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                    >
                        إرسال
                    </button>
                </div>
            </header>

            <main className="pt-36 pb-32 flex flex-col gap-6 overflow-x-hidden">
                {/* Stats Row */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar px-6 mt-2 pb-2">
                    <div className="glass-card min-w-[150px] p-4 rounded-2xl flex flex-col gap-2 shrink-0 border border-white/5 shadow-lg">
                        <span className="text-xs text-slate-400 font-label-caps flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px]">account_balance_wallet</span> معاملات الشهر
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-headline-md text-xl text-white">{Math.round(totalVolume).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500">{activeCurrency}</span>
                        </div>
                    </div>
                    <div className="glass-card min-w-[150px] p-4 rounded-2xl flex flex-col gap-2 shrink-0 border border-white/5 shadow-lg">
                        <span className="text-xs text-slate-400 font-label-caps flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-emerald-400">call_received</span> إجمالي الدخل
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-headline-md text-xl text-emerald-400">+{Math.round(totalIncome).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500">{activeCurrency}</span>
                        </div>
                    </div>
                    <div className="glass-card min-w-[150px] p-4 rounded-2xl flex flex-col gap-2 shrink-0 border border-white/5 shadow-lg">
                        <span className="text-xs text-slate-400 font-label-caps flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-red-400">send</span> إجمالي المصاريف
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-headline-md text-xl text-red-400">-{Math.round(totalExpenses).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500">{activeCurrency}</span>
                        </div>
                    </div>
                </div>

                {/* Donut Chart */}
                <section className="glass-card mx-6 p-5 rounded-3xl flex items-center justify-between border border-white/5 shadow-lg">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-white">توزيع الفئات</h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-xs text-slate-300">الدخل ({Math.round(incomePercent)}%)</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                <span className="text-xs text-slate-300">المصاريف ({Math.round(expensePercent)}%)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative w-28 h-28 shrink-0">
                        <svg className="w-full h-full -rotate-90 transform drop-shadow-md" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                            {totalVolume > 0 && (
                                <>
                                    <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#10b981" strokeDasharray={`${incomePercent} ${100 - incomePercent}`} strokeDashoffset="0" strokeWidth="4" />
                                    <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#ef4444" strokeDasharray={`${expensePercent} ${100 - expensePercent}`} strokeDashoffset={`-${incomePercent}`} strokeWidth="4" />
                                </>
                            )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[9px] text-slate-400 mb-0.5">الإجمالي</span>
                            <span className="font-bold text-xs text-white" dir="ltr">{Math.round(totalVolume)}</span>
                        </div>
                    </div>
                </section>

                {/* Transaction List */}
                <div className="px-container-padding flex flex-col gap-6">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-headline-md text-md text-white">قائمة المعاملات</h3>
                    </div>

                    {Object.keys(groupedTransactions).length === 0 && (
                        <p className="text-center text-on-surface-variant text-sm py-8">لا توجد معاملات بعد</p>
                    )}
                    
                    {Object.entries(groupedTransactions).map(([date, txs]) => (
                        <div key={date} className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 px-1 mb-1">
                                <span className="text-xs font-bold text-slate-500 shrink-0">{date}</span>
                                <div className="flex-1 h-px bg-white/10"></div>
                            </div>
                            {txs.map(tx => (
                                <div 
                                    key={tx.id} 
                                    className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors shadow-sm"
                                    onClick={() => setSelectedTx(tx)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.type === 'receive' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                            <span className={`material-symbols-outlined ${tx.type === 'receive' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {tx.type === 'receive' ? 'call_received' : 'send'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-headline-md text-sm text-on-surface">{txLabel(tx)}</span>
                                            <span className="text-xs text-on-surface-variant font-label-caps">{txDate(tx.createdAt)}</span>
                                        </div>
                                    </div>
                                    <span className={`font-headline-md text-sm ${tx.type === 'receive' ? 'text-emerald-400' : 'text-red-400'}`} dir="ltr">
                                        {txAmount(tx)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </main>

            {/* Modal for Transaction Details */}
            {selectedTx && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center overflow-y-auto py-12"
                    dir="rtl" lang="ar"
                    onClick={() => setSelectedTx(null)}
                >
                    <div className="flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                        {/* Icon */}
                        <div className="relative w-44 h-44 mb-8 shrink-0">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                                <circle
                                    cx="50" cy="50" r="44" fill="none" strokeWidth="5" strokeLinecap="round"
                                    className={'ring-success-fill'}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span
                                    className={`material-symbols-outlined text-[52px] ${selectedTx.type === 'receive' ? 'text-emerald-400' : 'text-white'} check-pop`}
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    {selectedTx.type === 'receive' ? 'call_received' : 'send'}
                                </span>
                            </div>
                        </div>

                        <div className="success-content w-full max-w-sm px-6 space-y-4">
                            <div className="text-center">
                                <h2 className={`font-manrope font-bold text-2xl mb-1 ${selectedTx.type === 'receive' ? 'text-emerald-400' : 'text-white'}`}>
                                    تفاصيل المعاملة
                                </h2>
                            </div>

                            <div className="glass-card rounded-3xl p-5 border border-emerald-500/20 space-y-1">
                                {getModalData(selectedTx).map(({ icon, label, value }) => (
                                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-2 text-slate-400 shrink-0">
                                            <span className="material-symbols-outlined text-[17px] text-teal-400">{icon}</span>
                                            <span className="text-xs">{label}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-white text-left truncate max-w-[60%]" dir="auto" title={value}>{value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => setSelectedTx(null)}
                                    className="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-manrope font-bold emerald-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Chat Modal */}
            <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    );
};

export default History;
