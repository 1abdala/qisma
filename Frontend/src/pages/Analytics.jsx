import React, { useState, useEffect, useContext } from 'react';
import './Analytics.css';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import AIChatModal from '../components/AIChatModal';

const API = `${import.meta.env.VITE_API_URL}/api`;

const INSIGHT_CONFIG = {
    tip:         { borderClass: 'ai-card-tip',         badgeClass: 'ai-badge-tip',         defaultIcon: 'lightbulb'    },
    warning:     { borderClass: 'ai-card-warning',     badgeClass: 'ai-badge-warning',     defaultIcon: 'warning'      },
    achievement: { borderClass: 'ai-card-achievement', badgeClass: 'ai-badge-achievement', defaultIcon: 'emoji_events' },
    action:      { borderClass: 'ai-card-action',      badgeClass: 'ai-badge-action',      defaultIcon: 'arrow_forward'},
};

const Analytics = () => {
    const { currentUserId } = useContext(UserContext);
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiInsights, setAiInsights] = useState(null);
    const [aiLoading, setAiLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        async function fetchAnalytics() {
            try {
                const res = await fetch(`${API}/analytics/${currentUserId}`);
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, [currentUserId]);

    useEffect(() => {
        async function fetchAiInsights() {
            setAiLoading(true);
            setAiInsights(null);
            try {
                const res = await fetch(`${API}/ai/insights/${currentUserId}`);
                const json = await res.json();
                setAiInsights(json.insights ?? []);
            } catch (err) {
                console.error('Failed to fetch AI insights:', err);
                setAiInsights([]);
            } finally {
                setAiLoading(false);
            }
        }
        fetchAiInsights();
    }, [currentUserId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center dark bg-slate-950">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce mx-1"></div>
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce mx-1 [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary/30 animate-bounce mx-1 [animation-delay:0.4s]"></div>
            </div>
        );
    }

    const { totals, pieChart } = data;

    return (
        <div className="bg-background text-on-background font-body-md min-h-screen pb-32 dark" dir="rtl" lang="ar">

            {/* TopAppBar */}
            <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center w-full px-6 py-4 fixed top-0 z-50">
                <div className="flex items-center gap-4">
                    <button className="active:scale-95 transition-transform hover:opacity-80">
                        <span className="material-symbols-outlined text-slate-400">menu</span>
                    </button>
                    <h1 className="font-manrope tracking-tight text-teal-500 font-bold text-xl">تحليلات</h1>
                </div>
                <button className="active:scale-95 transition-transform hover:opacity-80">
                    <span className="material-symbols-outlined text-slate-400">notifications</span>
                </button>
            </header>

            <main className="pt-24 px-container-padding flex flex-col gap-stack-md max-w-2xl mx-auto">

                {/* Date Range Picker */}
                <section className="flex justify-between items-center bg-surface-container rounded-2xl px-4 py-3 border border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">calendar_today</span>
                        <span className="font-label-caps text-on-surface">الشهر الحالي</span>
                    </div>
                    <span className="material-symbols-outlined text-outline">expand_more</span>
                </section>

                {/* Summary Card — live overall total */}
                <section className="glass-card rounded-pocket p-stack-md emerald-glow relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full"></div>
                    <div className="relative z-10 flex flex-col gap-2">
                        <span className="font-label-caps text-on-surface-variant">إجمالي الرصيد الموزع</span>
                        <div className="flex items-baseline gap-2">
                            <span className="font-financial-val text-primary text-display-lg">
                                {totals.overall.toLocaleString()}
                            </span>
                            <span className="font-headline-md text-primary/80">ر.س</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 px-3 py-1 bg-primary/10 w-fit rounded-full">
                            <span className="material-symbols-outlined text-primary text-[16px]">savings</span>
                            <span className="font-label-caps text-primary">مُقسَّم تلقائياً على الصناديق</span>
                        </div>
                    </div>
                </section>

                {/* Donut Chart — driven by pieChart data from API */}
                <section className="flex flex-col gap-gutter">
                    <h2 className="font-headline-md text-on-surface px-1">توزيع الصناديق</h2>
                    <div className="glass-card rounded-3xl p-stack-md h-64 flex flex-col justify-end">
                        <div className="flex flex-row-reverse items-center justify-around gap-6 h-full p-2">

                            {/* SVG Donut Chart */}
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                                    {/* Background Circle */}
                                    <circle cx="18" cy="18" fill="transparent" r="15.915"
                                        stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                    {/* Dynamic slices from API */}
                                    {pieChart.map((slice) => (
                                        <circle
                                            key={slice.name}
                                            cx="18" cy="18"
                                            fill="transparent"
                                            r="15.915"
                                            stroke={slice.color}
                                            strokeDasharray={slice.dashArray}
                                            strokeDashoffset={slice.dashOffset}
                                            strokeWidth="4"
                                        />
                                    ))}
                                </svg>
                                {/* Center Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] text-on-surface-variant leading-none">الإجمالي</span>
                                    <span className="font-bold text-sm text-on-surface">
                                        {totals.overall > 0 ? '100%' : '0%'}
                                    </span>
                                </div>
                            </div>

                            {/* Legend — from API */}
                            <div className="flex flex-col gap-3 flex-1">
                                {pieChart.map((slice) => (
                                    <div key={slice.name} className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor: slice.color,
                                                boxShadow: `0 0 8px ${slice.color}66`
                                            }}></div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-on-surface-variant">{slice.label}</span>
                                            <span className="text-sm font-bold text-on-surface">{slice.percentage}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </section>

                {/* ── AI Insights ── */}
                <section className="flex flex-col gap-gutter">
                    <div className="flex items-center gap-2 px-1 ai-section-header w-fit">
                        <span className="material-symbols-outlined text-indigo-400 text-xl">auto_awesome</span>
                        <h2 className="font-headline-md text-on-surface">توصيات ذكية</h2>
                    </div>

                    {aiLoading ? (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="glass-card rounded-2xl p-4 flex items-start gap-3">
                                    <div className="ai-skeleton w-9 h-9 rounded-xl shrink-0" />
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="ai-skeleton h-3.5 w-2/5 rounded" />
                                        <div className="ai-skeleton h-3 w-full rounded" />
                                        <div className="ai-skeleton h-3 w-4/5 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {(aiInsights ?? []).map((insight, i) => {
                                const cfg = INSIGHT_CONFIG[insight.type] ?? INSIGHT_CONFIG.tip;
                                return (
                                    <div key={i} className={`ai-insight-card glass-card rounded-2xl p-4 flex items-start gap-3 ${cfg.borderClass}`}>
                                        <div className={`ai-badge ${cfg.badgeClass}`}>
                                            <span className="material-symbols-outlined text-[18px]">
                                                {insight.icon || cfg.defaultIcon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-on-surface mb-1">{insight.title}</p>
                                            <p className="text-xs text-on-surface-variant leading-relaxed">{insight.body}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Categories — live totals per pocket */}
                <section className="flex flex-col gap-gutter">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="font-headline-md text-on-surface">المصاريف حسب الصندوق</h2>
                    </div>
                    <div className="flex flex-col gap-stack-sm">
                        {pieChart.map((slice) => (
                            <div key={slice.name} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border"
                                        style={{ backgroundColor: `${slice.color}1a`, borderColor: `${slice.color}33` }}>
                                        <span className="material-symbols-outlined"
                                            style={{ color: slice.color }}>
                                            {slice.name === 'expenses' ? 'shopping_bag' :
                                                slice.name === 'savings' ? 'savings' : 'receipt_long'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className="font-body-md font-semibold text-on-surface">{slice.label}</span>
                                            <span className="font-body-md text-on-surface">{slice.amount.toLocaleString()} ر.س</span>
                                        </div>
                                        <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${slice.percentage}%`, backgroundColor: slice.color }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            {/* BottomNavBar */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-end pb-6 pt-3 px-6 rtl bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 rounded-t-[28px] shadow-[0_-10px_30px_-15px_rgba(0,105,92,0.3)]">
                <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all">
                    <span className="material-symbols-outlined text-2xl">home</span>
                    <span className="font-manrope text-[10px] font-medium mt-1.5">الرئيسية</span>
                </button>
                <button onClick={() => navigate('/analytics')} className="flex flex-col items-center justify-center text-teal-400 drop-shadow-[0_0_8px_rgba(0,169,110,0.5)] transition-all">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                    <span className="font-manrope text-[10px] font-medium mt-1.5">التحليلات</span>
                </button>
                
                <div className="relative -top-5 px-2">
                    <button onClick={() => navigate('/scan')} className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(132,213,197,0.4)] hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-on-primary text-3xl">qr_code_scanner</span>
                    </button>
                </div>
                
                <button onClick={() => navigate('/history')} className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all">
                    <span className="material-symbols-outlined text-2xl">history</span>
                    <span className="font-manrope text-[10px] font-medium mt-1.5">السجل</span>
                </button>
                
                <button onClick={() => setIsChatOpen(true)} className="flex flex-col items-center justify-center group transition-all">
                    <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-[2px] shadow-[0_0_10px_rgba(99,102,241,0.3)] group-hover:scale-110 active:scale-95 transition-transform mb-1">
                        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center relative overflow-hidden">
                            <span className="material-symbols-outlined text-[16px] text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse">smart_toy</span>
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-slate-950"></span>
                        </span>
                    </div>
                    <span className="font-manrope text-[10px] font-medium text-slate-500 group-hover:text-indigo-400">Qisma AI</span>
                </button>
            </nav>

            <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

        </div>
    );
};

export default Analytics;