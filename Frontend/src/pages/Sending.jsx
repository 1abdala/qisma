import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { DisplayCurrencyContext } from '../contexts/DisplayCurrencyContext';
import { convertAmount } from '../hooks/useCurrencyConverter';
import './Sending.css';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const API = 'http://localhost:5000/api';

const Sending = () => {
    const navigate = useNavigate();
    const { currentUserId, users } = useContext(UserContext);
    const { displayCurrency, setDisplayCurrency } = useContext(DisplayCurrencyContext);

    const [amount, setAmount] = useState('1000');
    const [fromCurrency, setFromCurrency] = useState('SAR');
    const [toUserId, setToUserId] = useState('');
    const [sending, setSending] = useState(false);
    const { toasts, showToast, removeToast } = useToast();
    const [error, setError] = useState('');

    const currentUser = users.find(u => u.id === currentUserId);
    const userCurrency = currentUser?.currency || 'SAR';
    const selectedReceiver = users.find(u => u.id === Number(toUserId));
    const toCurrency = selectedReceiver?.currency || fromCurrency;

    const numAmount = parseFloat(amount) || 0;
    const convertedAmount = convertAmount(numAmount, fromCurrency, toCurrency);
    const exchangeRate = numAmount > 0 ? (convertedAmount / numAmount).toFixed(4) : 0;

    async function handleSend() {
        if (!toUserId || !numAmount || numAmount <= 0) {
            setError('يرجى اختيار المستلم وإدخال مبلغ صالح');
            return;
        }

        setSending(true);
        setError('');

        try {
            const res = await fetch(`${API}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromUserId: currentUserId,
                    toUserId: Number(toUserId),
                    amount: numAmount,
                    fromCurrency,
                    toCurrency,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل التحويل');

            showToast(`تم تحويل ${data.amount.toLocaleString()} ${data.fromCurrency} بنجاح`, 'success');
            showToast('تم تقسيم المبلغ تلقائياً على صناديق المستلم', 'split', 3500);
            setTimeout(() => {
                navigate('/splitting', {
                    state: {
                        amount: data.amount,
                        convertedAmount: data.convertedAmount,
                        fromCurrency: data.fromCurrency,
                        toCurrency: data.toCurrency,
                        split: data.split,
                    },
                });
            }, 900);
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="bg-surface-dim font-body-md text-on-surface min-h-screen pb-40 dark" dir="rtl" lang="ar">
            <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-transparent border-b border-white/10 backdrop-blur-xl transition-all duration-300 ease-in-out">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="hover:bg-emerald-500/10 p-2 rounded-full transition-all duration-300">
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
                <section className="flex flex-col items-center justify-center space-y-stack-sm">
                    <div className="w-full space-y-4">
                        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex flex-col flex-1">
                                <span className="text-label-caps text-on-surface-variant mb-1">من ({fromCurrency})</span>
                                <input
                                    className="bg-transparent border-none focus:ring-0 p-0 font-financial-val text-2xl text-primary w-full placeholder-primary/20 outline-none"
                                    dir="ltr"
                                    placeholder="1,000"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <select
                                value={fromCurrency}
                                onChange={(e) => setFromCurrency(e.target.value)}
                                className="bg-surface-container-highest px-3 py-1.5 rounded-xl font-bold text-on-surface outline-none cursor-pointer"
                            >
                                <option value="SAR">SAR</option>
                                <option value="AED">AED</option>
                                <option value="EGP">EGP</option>
                                <option value="OMR">OMR</option>
                            </select>
                        </div>

                        <div className="flex justify-center -my-6 relative z-10">
                            <div className="bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-surface-dim">
                                <span className="material-symbols-outlined text-sm">swap_vert</span>
                            </div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                <span className="bg-surface-container-high text-[10px] px-2 py-0.5 rounded-full text-on-surface-variant border border-white/5">
                                    1 {fromCurrency} = {exchangeRate} {toCurrency}
                                </span>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-4 flex items-center justify-between opacity-90">
                            <div className="flex flex-col flex-1">
                                <span className="text-label-caps text-on-surface-variant mb-1">إلى ({toCurrency})</span>
                                <span className="font-financial-val text-2xl text-on-surface">
                                    {convertedAmount.toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-surface-container-highest px-3 py-1.5 rounded-xl font-bold text-on-surface">
                                {toCurrency}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-4">
                        {['SAR', 'AED', 'EGP', 'OMR'].map((curr) => (
                            <button
                                key={curr}
                                onClick={() => setFromCurrency(curr)}
                                className={`px-5 py-2 glass-card rounded-full font-label-caps transition-colors ${fromCurrency === curr
                                        ? 'text-on-surface border-primary bg-primary-container/20 border'
                                        : 'text-on-surface-variant hover:border-primary/50'
                                    }`}
                            >
                                {curr}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="space-y-stack-sm">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="font-headline-md text-body-lg font-semibold">إرسال إلى</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                        {users.filter(u => u.id !== currentUserId).map((user) => (
                            <button
                                key={user.id}
                                onClick={() => setToUserId(user.id.toString())}
                                className={`flex flex-col items-center space-y-2 shrink-0 ${toUserId === user.id.toString() ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <div className={`w-16 h-16 rounded-full p-[2px] ${toUserId === user.id.toString()
                                        ? 'bg-gradient-to-tr from-primary to-secondary'
                                        : 'bg-white/10'
                                    }`}>
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

            <div className="fixed bottom-0 left-0 right-0 p-container-padding bg-gradient-to-t from-surface-dim via-surface-dim/95 to-transparent pb-8">
                <button
                    onClick={handleSend}
                    disabled={sending || !toUserId || !numAmount}
                    className="w-full h-16 bg-primary text-on-primary font-manrope font-bold text-lg rounded-[24px] emerald-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40"
                >
                    <span>{sending ? 'جاري الإرسال...' : 'تأكيد وإرسال'}</span>
                    <span className="material-symbols-outlined">send</span>
                </button>
            </div>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};

export default Sending;