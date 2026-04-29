import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Splitting.css';
// --- Animated counter hook ---
function useCountUp(target, duration = 1200) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!target) return;
        let start = null;
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration]);
    return value;
}

const POCKETS = [
    {
        key: 'expenses',
        label: 'مصاريف',
        icon: 'shopping_bag',
        color: 'secondary',
        delay: 600,   // appears first
    },
    {
        key: 'savings',
        label: 'ادخار',
        icon: 'savings',
        color: 'primary',
        delay: 900,   // appears second
        fill: true,
        activeRing: true,
    },
    {
        key: 'commitments',
        label: 'التزامات',
        icon: 'contract',
        color: 'tertiary',
        delay: 1200,  // appears last
    },
];

const Splitting = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    const fromCurrency = state?.fromCurrency || 'SAR';
    const toCurrency = state?.toCurrency || 'SAR';
    const amount = state?.amount ?? 0;
    const split = state?.split ?? { expenses: 0, savings: 0, commitments: 0 };

    // Animated main amount
    const animatedAmount = useCountUp(amount, 1000);

    // Track which pockets are visible + glowing
    const [visible, setVisible] = useState({ expenses: false, savings: false, commitments: false });
    const [glowing, setGlowing] = useState({ expenses: false, savings: false, commitments: false });

    useEffect(() => {
        POCKETS.forEach(({ key, delay }) => {
            // Fade-in
            setTimeout(() => {
                setVisible(prev => ({ ...prev, [key]: true }));
            }, delay);
            // Glow flash — 400ms after appearing
            setTimeout(() => {
                setGlowing(prev => ({ ...prev, [key]: true }));
            }, delay + 400);
            // Remove glow after 1.2s
            setTimeout(() => {
                setGlowing(prev => ({ ...prev, [key]: false }));
            }, delay + 1600);
        });
    }, []);

    return (
        <div className="font-body-md antialiased min-h-screen flex flex-col dark" dir="rtl" lang="ar">

            {/* Top Navigation */}
            <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 py-4 w-full rtl fixed top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
                        <img
                            alt="User"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUl7l-h6bDMzJg5aQ_toglZ3IW7grrjy_WbINg9TDQa7jZI_JcFu6FFB4KWepUKw0wmFEn0m6rWXjoICMJf4rWWmEMg2eLa-2iyXkYcd6s1z0W7lnhkAl5l7z4woEI5LAc2Mc7uG_CTH7TNq4JPo03X6VOOGcSQ0YteTWXu6e47KCiqiQh8Y_sGXw1SzEpKSJxRcMcqN7XW1tUMdcufzhGmsAY7RxhmUWe1Kjg_0RhqmJvjqjBfbZmgao93VYa37gbUSSAdiqY1vnV"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="font-manrope text-sm font-semibold tracking-tight text-teal-500">Tharaa</span>
                </div>
                <div className="text-xl font-bold text-teal-500">Tharaa</div>
                <div className="material-symbols-outlined text-slate-400">notifications</div>
            </header>

            <main className="flex-grow pt-24 pb-32 px-container-padding flex flex-col items-center justify-center relative overflow-hidden">

                {/* Floating Notification */}
                <div className="fixed top-24 left-6 right-6 z-40">
                    <div className="glass-card rounded-xl p-4 flex items-center justify-between border border-primary/20 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </div>
                            <span className="font-headline-md text-body-md text-on-surface">
                                تم استلامها ب {toCurrency}
                            </span>
                        </div>
                        <span className="font-label-caps text-surface-variant">الآن</span>
                    </div>
                </div>

                <div className="relative w-full flex flex-col items-center gap-12">

                    {/* Main Amount Sphere — counts up */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full"></div>
                        <div className="relative w-40 h-40 rounded-full glass-card border-primary/30 flex items-center justify-center emerald-glow border-2">
                            <div className="flex flex-col items-center">
                                <span className="font-display-lg text-primary text-[48px] tabular-nums">
                                    +{Math.round(animatedAmount).toLocaleString()}                                </span>
                                <span className="font-label-caps text-surface-variant uppercase tracking-widest mt-1">{fromCurrency}</span>
                            </div>
                        </div>
                    </div>

                    {/* Splitting Animation Label */}
                    <div className="w-full flex flex-col items-center text-center gap-4">
                        <p className="font-headline-md text-primary-fixed tracking-wide">جاري تقسيم المبلغ تلقائياً...</p>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 rounded-full bg-primary/30 animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>

                    {/* Pockets Grid — staggered */}
                    <div className="w-full grid grid-cols-3 gap-4 mt-8 relative">

                        {/* Connecting Lines */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-full h-16 pointer-events-none">
                            <div className="absolute left-1/2 top-0 -translate-x-[110px] w-[2px] h-full bg-gradient-to-b from-primary/80 to-transparent"></div>
                            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-full bg-gradient-to-b from-primary/80 to-transparent"></div>
                            <div className="absolute left-1/2 top-0 translate-x-[110px] w-[2px] h-full bg-gradient-to-b from-primary/80 to-transparent"></div>
                        </div>

                        {POCKETS.map(({ key, label, icon, color, fill, activeRing }) => (
                            <div
                                key={key}
                                className="flex flex-col items-center gap-4 transition-all duration-700"
                                style={{
                                    opacity: visible[key] ? 1 : 0,
                                    transform: visible[key] ? 'translateY(0)' : 'translateY(20px)',
                                }}
                            >
                                <div
                                    className={`
                                        w-20 h-20 rounded-[28px] glass-card flex items-center justify-center border-white/5 relative
                                        transition-all duration-500
                                        ${activeRing ? 'active-ring' : ''}
                                    `}
                                    style={{
                                        boxShadow: glowing[key]
                                            ? `0 0 0 3px var(--color-${color}), 0 0 24px 4px var(--color-${color})55`
                                            : activeRing ? '0 0 0 2px #84d5c5' : 'none',
                                        transition: 'box-shadow 0.4s ease',
                                    }}
                                >
                                    <div className={`absolute inset-0 bg-${color}/5 rounded-[28px]`}></div>
                                    <span
                                        className={`material-symbols-outlined text-${color} text-3xl`}
                                        style={fill ? { fontVariationSettings: "'FILL' 1" } : {}}
                                    >
                                        {icon}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="font-headline-md text-sm">{label}</span>
                                    <span className={`font-label-caps text-${color} text-[10px] mt-1`}>
                                        +{Math.round(split[key]).toLocaleString()} {toCurrency}                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Back to Home */}
                <button
                    onClick={() => navigate('/')}
                    className="mt-16 px-8 py-3 rounded-2xl border border-primary/30 text-primary font-manrope text-sm font-semibold hover:bg-primary/10 transition-all active:scale-95"
                >
                    العودة للرئيسية
                </button>

                <div className="absolute bottom-40 w-full px-container-padding opacity-20 pointer-events-none">
                    <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                </div>
            </main>

            {/* Bottom Navigation — unchanged */}
            <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-end pb-8 pt-4 px-4 rtl bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_30px_-15px_rgba(0,105,92,0.3)]">
                <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-teal-400 drop-shadow-[0_0_8px_rgba(0,169,110,0.5)]">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">الرئيسية</span>
                </button>
                <button onClick={() => navigate('/pockets')} className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">المحافظ</span>
                </button>
                <div className="relative -top-6">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-on-primary shadow-lg shadow-primary/40 active:scale-90 transition-all">
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
                    </div>
                </div>
                <button onClick={() => navigate('/analytics')} className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all">
                    <span className="material-symbols-outlined">receipt_long</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">المعاملات</span>
                </button>
                <button className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all">
                    <span className="material-symbols-outlined">person</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">الإعدادات</span>
                </button>
            </footer>

            <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary/5 blur-[120px] rounded-full"></div>
            </div>
        </div>
    );
};

export default Splitting;