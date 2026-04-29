import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import './Receive.css';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import QRCode from "react-qr-code";
const API = `${import.meta.env.VITE_API_URL}/api`;

const Receive = () => {
    const navigate = useNavigate();
    const { currentUserId, users } = useContext(UserContext);

    const [amount, setAmount] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [receiving, setReceiving] = useState(false);
    const [error, setError] = useState('');
    const { toasts, showToast, removeToast } = useToast();

    const currentUser = users.find(u => u.id === currentUserId);
    const userCurrency = currentUser?.currency || 'SAR';

    // Generate QR data payload
    function getQRData() {
        return JSON.stringify({
            userId: currentUserId,
            amount: amount ? parseFloat(amount) : null,
            currency: userCurrency,
            name: currentUser?.name,
        });
    }

    // Simulate receiving money (in real app, this would be triggered by QR scan)
    async function handleReceive() {
        const numAmount = parseFloat(amount);

        if (!numAmount || numAmount <= 0) {
            setError('يرجى إدخال مبلغ صالح');
            return;
        }

        setReceiving(true);
        setError('');

        try {
            const res = await fetch(`${API}/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUserId,
                    amount: numAmount,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل الاستلام');
            showToast(`تم استلام ${data.amount.toLocaleString()} ${userCurrency}`, 'receive');
            setTimeout(() => {
                navigate('/splitting', {
                    state: {
                        amount: data.amount,
                        split: data.split,
                        type: 'receive',
                    },
                });
            }, 1000);

        } catch (err) {
            setError(err.message);
        } finally {
            setReceiving(false);
        }
    } // ✅ CLOSING handleReceive() HERE!

    // ✅ Main component return starts here
    return (
        <div className="bg-surface-dim font-body-md text-on-surface min-h-screen pb-32 dark" dir="rtl" lang="ar">
            {/* Header */}
            <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-16 bg-transparent border-b border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-4 w-full">
                    <button
                        onClick={() => navigate('/')}
                        className="hover:bg-emerald-500/10 p-2 rounded-full transition-all duration-300"
                    >
                        <span className="material-symbols-outlined text-emerald-500">arrow_forward</span>
                    </button>
                    <h1 className="font-manrope font-bold text-lg text-emerald-500">استلام أموال</h1>
                </div>
            </header>

            <main className="pt-24 px-container-padding max-w-md mx-auto space-y-stack-lg">

                {/* User Info Card */}
                <div className="glass-card rounded-[24px] p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-3xl">account_circle</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-on-surface-variant font-label-caps">استلام باسم</p>
                        <p className="text-lg font-headline-md text-on-surface">{currentUser?.name}</p>
                        <p className="text-xs text-on-surface-variant">{currentUser?.email}</p>
                    </div>
                </div>

                {/* Amount Input Section */}
                <section className="space-y-stack-sm">
                    <div className="glass-card rounded-2xl p-6">
                        <label className="text-label-caps text-on-surface-variant mb-3 block">
                            المبلغ المطلوب ({userCurrency})
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => { setAmount(e.target.value); setShowQR(false); }}
                                placeholder="0.00"
                                className="bg-transparent border-none focus:ring-0 p-0 font-financial-val text-4xl text-primary w-full placeholder-primary/20 outline-none"
                                dir="ltr"
                            />
                            <div className="bg-surface-container-highest px-4 py-2 rounded-xl">
                                <span className="font-bold text-on-surface">{userCurrency}</span>
                            </div>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-3">
                            يمكنك ترك المبلغ فارغاً للسماح للدافع بإدخاله
                        </p>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {[100, 500, 1000, 5000].map((val) => (
                            <button
                                key={val}
                                onClick={() => { setAmount(val.toString()); setShowQR(false); }}
                                className="px-5 py-2 glass-card rounded-full font-label-caps text-on-surface hover:border-primary/50 transition-colors whitespace-nowrap"
                            >
                                {val} {userCurrency}
                            </button>
                        ))}
                    </div>
                </section>

                {/* QR Code Section */}
                {showQR ? (
                    <section className="glass-card rounded-[24px] p-8 space-y-stack-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-headline-md text-on-surface font-semibold">رمز الاستجابة السريع</h3>
                            <button
                                onClick={() => setShowQR(false)}
                                className="text-on-surface-variant hover:text-on-surface"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* QR Code Placeholder */}
                        <div className="bg-white rounded-2xl p-6 flex items-center justify-center aspect-square">
                            <QRCode
                                value={getQRData()}
                                size={180}
                                bgColor="#ffffff"
                                fgColor="#0f172a"
                            />
                        </div>

                        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 text-center">
                            <p className="text-xs text-primary">
                                <span className="material-symbols-outlined text-sm align-middle">info</span>
                                {' '}اطلب من الدافع مسح هذا الرمز
                            </p>
                        </div>

                        {/* QR Data (for development/testing) */}
                        <details className="text-xs text-on-surface-variant">
                            <summary className="cursor-pointer hover:text-on-surface">
                                معلومات الرمز (للمطورين)
                            </summary>
                            <pre className="bg-white/5 p-3 rounded-lg mt-2 overflow-x-auto text-[10px] font-mono">
                                {getQRData()}
                            </pre>
                        </details>
                    </section>
                ) : (
                    <button
                        onClick={() => setShowQR(true)}
                        className="w-full glass-card rounded-[24px] p-6 flex items-center justify-between hover:bg-white/5 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">qr_code_2</span>
                            </div>
                            <div className="text-right">
                                <p className="font-headline-md text-on-surface">إنشاء رمز QR</p>
                                <p className="text-xs text-on-surface-variant">اطلب من شخص مسح الرمز</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                            chevron_left
                        </span>
                    </button>
                )}

                {/* Direct Receive Section (for testing) */}
                <section className="space-y-stack-sm">
                    <div className="flex items-center gap-2 px-1">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-xs text-on-surface-variant">أو</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    <div className="glass-card rounded-[24px] p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-secondary">check_circle</span>
                            <div>
                                <p className="font-headline-md text-on-surface">محاكاة الاستلام</p>
                                <p className="text-xs text-on-surface-variant">للاختبار فقط - يحاكي استلام الأموال</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleReceive}
                            disabled={receiving || !amount}
                            className="w-full py-4 rounded-2xl bg-secondary text-on-secondary font-manrope font-semibold transition-all active:scale-95 disabled:opacity-40"
                        >
                            {receiving ? 'جاري المعالجة...' : 'تأكيد الاستلام'}
                        </button>
                    </div>
                </section>

                {/* Info Cards */}
                <section className="space-y-3">
                    <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-1">bolt</span>
                        <div>
                            <p className="font-headline-md text-sm text-on-surface mb-1">تقسيم تلقائي</p>
                            <p className="text-xs text-on-surface-variant">
                                سيتم تقسيم المبلغ المستلم تلقائياً حسب نسبك المخصصة
                            </p>
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
                        <span className="material-symbols-outlined text-tertiary mt-1">security</span>
                        <div>
                            <p className="font-headline-md text-sm text-on-surface mb-1">آمن ومشفر</p>
                            <p className="text-xs text-on-surface-variant">
                                جميع المعاملات محمية بأعلى معايير الأمان
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Receive;