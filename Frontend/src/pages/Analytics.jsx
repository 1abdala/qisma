import React, { useState, useEffect } from 'react';
import './Analytics.css';

const API = 'http://localhost:5000/api';
const USER_ID = 1;

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const res = await fetch(`${API}/analytics/${USER_ID}`);
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

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
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-8 pb-8 pt-4 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 rounded-t-[32px] shadow-[0_-10px_40px_-15px_rgba(0,105,92,0.3)]">
                <a className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all" href="#">
                    <span className="material-symbols-outlined mb-1">home</span>
                    <span className="font-manrope text-[10px] font-medium">الرئيسية</span>
                </a>
                <a className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all" href="#">
                    <span className="material-symbols-outlined mb-1">qr_code_scanner</span>
                    <span className="font-manrope text-[10px] font-medium">المسح</span>
                </a>
                <a className="flex flex-col items-center justify-center text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] transition-all" href="#">
                    <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                    <span className="font-manrope text-[10px] font-bold">تحليلات</span>
                </a>
            </nav>

        </div>
    );
};

export default Analytics;