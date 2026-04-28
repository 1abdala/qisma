import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Receive.css';

const Receive = () => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function handleReceive() {
        const parsed = parseFloat(amount);
        if (!parsed || parsed <= 0) {
            setError('يرجى إدخال مبلغ صحيح');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 1, amount: parsed }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'حدث خطأ ما');
            }

            // Navigate to Splitting page with the result
            navigate('/splitting', {
                state: {
                    amount: data.amount,
                    split: data.split,
                    updatedBalance: data.updatedBalance,
                },
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="font-body-md text-body-md antialiased min-h-screen overflow-hidden flex flex-col dark" dir="rtl" lang="ar">

            {/* Top Navigation */}
            <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 py-4 w-full rtl fixed top-0 z-50">
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-95">
                        <span className="material-symbols-outlined text-teal-500" data-icon="arrow_forward">arrow_forward</span>
                    </button>
                    <h1 className="font-manrope text-sm font-semibold tracking-tight text-teal-500">QR استلام</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-slate-400" data-icon="share">share</span>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container">
                        <img
                            alt="User Profile"
                            className="w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnhqmFAFvmY6xAXYegV7WeSc9IXSIISLUlHefpCbckeCfyG8_0qsOcSV7g62xJDP--ldrzKickH38dOFOvaVickKTks3aXJoqj-30s-VGmEe8fzUfEwUAl4NqVw-3X-EgBuApOlZNMjEVmbNQoy9Z2TL1UE3WHMUbWLPIGjTp8BqrlJhqK7G5HMsFNl4FQ0xYP2oCdbc5ENMcMY4KcxFpyYEJJP5LMsUvtIUUS9ujR9IfJ4sGJY3Tuq37m1AOb4uiT36oiIT2Qdedk"
                        />
                    </div>
                </div>
            </header>

            {/* Main Canvas */}
            <main className="flex-1 flex flex-col items-center justify-center relative px-container-padding pt-20 pb-32 radial-bg">
                <div className="w-full max-w-sm flex flex-col items-center">

                    {/* Amount Input */}
                    <div className="w-full mb-stack-lg animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="bg-surface-container/40 backdrop-blur-md border border-white/10 rounded-[24px] p-gutter text-center">
                            <span className="font-label-caps text-label-caps text-on-surface-variant block mb-2">المبلغ المطلوب (اختياري)</span>
                            <div className="flex justify-center items-baseline gap-2">
                                <input
                                    className="bg-transparent border-none text-center font-financial-val text-financial-val text-primary focus:ring-0 w-40 placeholder:text-surface-variant outline-none"
                                    placeholder="0.00"
                                    type="number"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <span className="font-headline-md text-headline-md text-on-surface">SAR</span>
                            </div>
                            {/* Error message */}
                            {error && (
                                <p className="text-red-400 text-xs mt-2">{error}</p>
                            )}
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full opacity-50"></div>
                        <div className="relative bg-white p-6 rounded-[32px] qr-glow transition-transform duration-500 hover:scale-[1.02]">
                            <div className="w-64 h-64 relative bg-white flex items-center justify-center overflow-hidden">
                                <img
                                    alt="QR Code"
                                    className="w-full h-full"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaCkMGJgC6Z37PDPfAgeDX-noPnU2FScuu8zCwjvw4hsMV12AgGaasYtGJ5Uaf1k6kZEzSqUow0U71VeYkxpK4MnlJ-2Cq3Nt9FdLFn4ccw4hGXdsg5sHCkyKoCvGTbC2W4sx7Z1tyAAhWUlVPStwk9cMJo5z_yXPC4aK41ARr6ySUTghtWUb_fygM_9U0WkwELFoT2SNv8VHeXsftkJLF7pSBtZGNwC0d-IBg5rPBG4iOw2xjEW1mm5X4addVM3s0z27e-pa1iCXn"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl">
                                        <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="mt-stack-lg text-center space-y-unit">
                        <h2 className="font-headline-md text-headline-md text-on-surface">استلم فلوسك</h2>
                        <p className="font-body-md text-body-md text-on-surface-variant max-w-[280px] mx-auto">خلي العميل يسوي Scan وادفع مباشرة بكل أمان وسهولة</p>
                    </div>

                    {/* Confirm Button — triggers the API call */}
                    <button
                        onClick={handleReceive}
                        disabled={loading || !amount}
                        className="w-full mt-6 py-4 rounded-2xl bg-primary text-on-primary font-manrope font-semibold text-sm tracking-wide transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? 'جاري المعالجة...' : 'تأكيد الاستلام وتقسيم المبلغ'}
                    </button>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-2 gap-gutter w-full mt-4">
                        <button className="flex flex-col items-center justify-center gap-2 p-stack-sm bg-surface-container-low border border-white/5 rounded-xl hover:bg-white/5 transition-all group">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">content_copy</span>
                            </div>
                            <span className="font-label-caps text-label-caps text-on-surface">نسخ الرابط</span>
                        </button>
                        <button className="flex flex-col items-center justify-center gap-2 p-stack-sm bg-surface-container-low border border-white/5 rounded-xl hover:bg-white/5 transition-all group">
                            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">save_alt</span>
                            </div>
                            <span className="font-label-caps text-label-caps text-on-surface">حفظ الصورة</span>
                        </button>
                    </div>

                </div>
            </main>

            <footer className="fixed bottom-0 left-0 w-full p-container-padding pointer-events-none">
                <div className="h-1 w-32 bg-white/10 rounded-full mx-auto"></div>
            </footer>

        </div>
    );
};

export default Receive;