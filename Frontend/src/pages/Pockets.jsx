import React, { useState, useEffect, useContext } from 'react';
import './Pockets.css';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';

const API = `${import.meta.env.VITE_API_URL}/api`;

const Pockets = () => {
    const { currentUserId } = useContext(UserContext);
    const navigate = useNavigate();

    const [pockets, setPockets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPockets() {
            try {
                const res = await fetch(`${API}/pockets/${currentUserId}`);
                const data = await res.json();

                // ✅ دعم كل الحالات
                setPockets(Array.isArray(data) ? data : data.pockets || []);
            } catch (err) {
                console.error('Failed to fetch pockets:', err);
                setPockets([]); // حماية
            } finally {
                setLoading(false);
            }
        }

        if (currentUserId) {
            fetchPockets();
        }
    }, [currentUserId]);

    function pocketBalance(name) {
        if (!Array.isArray(pockets)) return '0'; // حماية

        const p = pockets.find((p) => p.name === name);
        return p ? p.balance.toLocaleString() : '0';
    }


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

            {/* TopAppBar */}
            <header className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 py-4 rtl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-primary/20 overflow-hidden">
                        <img
                            alt="Profile"
                            className="w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7jHJkB5PJw25glFlMvCS9UXyC9eQpin5m72Vxjo9P5LHyCDl_beFvW2lGFXLvRdVzqJePEqiIOUKTZ4Oo5ALVrB2MBgWfV5V7krmBHCtPxWr-KYjUCUPv7PPqkaYtz7ht3eMQJVresLf2pcsBo9QOQJ5SzSfw3vNWSBoVjUmN57FEi2ErUkTN9aF6JhiVveLKwq1hO8a-5ie3svFTHV4BRQNYQd4qBvlH9UQnsMtEqGD6Bz7M3z78CTdmWfq6frjpdNKef2f4BNjR"
                        />
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
                <div className="mb-stack-lg">
                    <h1 className="font-headline-md text-headline-md text-on-surface mb-unit">صناديقي</h1>
                    <p className="font-body-md text-on-surface-variant">تحكم في مدخراتك ومصاريفك بذكاء</p>
                </div>

                <div className="flex flex-col gap-stack-md">

                    {/* Expenses */}
                    <div className="glass-card rounded-[28px] p-6 active-glow relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <span className="material-symbols-outlined text-primary text-3xl">account_balance_wallet</span>
                                    </div>
                                    <div>
                                        <h3 className="font-headline-md text-body-lg font-bold text-on-surface">مصاريف</h3>
                                        <p className="font-label-caps text-on-surface-variant">الاستهلاك الشهري</p>
                                    </div>
                                </div>
                                {/* Live balance */}
                                <div className="text-left">
                                    <p className="font-financial-val text-primary">{pocketBalance('expenses')} ر.س</p>
                                </div>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-on-surface-variant font-medium">اكتمال الميزانية</span>
                                    <span className="text-primary font-bold">50%</span>
                                </div>
                                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: '50%' }}></div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                                    <span className="material-symbols-outlined text-[18px]">history</span>
                                    <span>50% من كل استلام</span>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_left</span>
                            </div>
                        </div>
                    </div>

                    {/* Savings */}
                    <div className="glass-card rounded-[28px] p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                                        <span className="material-symbols-outlined text-secondary text-3xl">savings</span>
                                    </div>
                                    <div>
                                        <h3 className="font-headline-md text-body-lg font-bold text-on-surface">ادخار</h3>
                                        <p className="font-label-caps text-on-surface-variant">الهدف: شراء منزل</p>
                                    </div>
                                </div>
                                {/* Live balance */}
                                <div className="text-left">
                                    <p className="font-financial-val text-on-surface">{pocketBalance('savings')} ر.س</p>
                                </div>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-on-surface-variant font-medium">الهدف المحقق</span>
                                    <span className="text-secondary font-bold">30%</span>
                                </div>
                                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                    <div className="h-full bg-secondary rounded-full transition-all duration-700" style={{ width: '30%' }}></div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                                    <span className="material-symbols-outlined text-[18px]">trending_up</span>
                                    <span>30% من كل استلام تلقائياً</span>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
                            </div>
                        </div>
                    </div>

                    {/* Commitments */}
                    <div className="glass-card rounded-[28px] p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-tertiary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-tertiary/10 flex items-center justify-center border border-tertiary/20">
                                        <span className="material-symbols-outlined text-tertiary text-3xl">receipt_long</span>
                                    </div>
                                    <div>
                                        <h3 className="font-headline-md text-body-lg font-bold text-on-surface">التزامات</h3>
                                        <p className="font-label-caps text-on-surface-variant">فواتير وقروض</p>
                                    </div>
                                </div>
                                {/* Live balance */}
                                <div className="text-left">
                                    <p className="font-financial-val text-on-surface">{pocketBalance('commitments')} ر.س</p>
                                </div>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-on-surface-variant font-medium">المدفوع هذا الشهر</span>
                                    <span className="text-tertiary font-bold">20%</span>
                                </div>
                                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                    <div className="h-full bg-tertiary rounded-full transition-all duration-700" style={{ width: '20%' }}></div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                                    <span>20% من كل استلام للالتزامات</span>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* BottomNavBar */}
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