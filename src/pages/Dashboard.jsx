import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
    return (
        <div className="font-body-md text-on-surface dark" dir="rtl" lang="ar">
            {/* TopAppBar */}
            <nav className="bg-slate-950/80 backdrop-blur-xl fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 rtl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden">
                        <img
                            alt="User"
                            className="w-full h-full object-cover"
                            data-alt="high-quality studio portrait of a professional man in his 30s with a sharp appearance, clean background, soft lighting"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBv3_tjdSmOruHigzE5Q_ndgiWEdvRJP3priOhx-FULziMShIRDES6PCI802Q6O9aB46APGUBFlqaLnX2Wc_vrvWyf8UMr8eX8dR-DTfYm5UxBn395_pZetzSouislKRsyGaNObazmRfnb-b-ncznchVbSdVkW4S4U2aIm-VXdRJ4ajoVvgfk6phVfFg5N8rcktvJPnr3mpLXU4G_pdYuJ07YwaKiycjJNKs-C0LtmK_kycckHd-Ezjn6--EFxIbqYRy07f8VkBEJhv"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-headline-md text-primary text-sm font-semibold tracking-tight">صباح الخير، حسام</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-teal-500" data-icon="notifications">notifications</span>
                    </button>
                </div>
            </nav>

            <main className="pt-24 pb-32 px-container-padding flex flex-col gap-stack-md">
                {/* Balance Card */}
                <section className="relative overflow-hidden rounded-[24px] p-6 bg-gradient-to-br from-primary-container to-surface-dim emerald-glow border border-white/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <span className="text-xs font-label-caps text-on-primary-container">SAR</span>
                            <span className="material-symbols-outlined text-sm text-secondary" data-icon="expand_more">expand_more</span>
                        </div>
                        <button className="text-white/60 hover:text-white transition-colors">
                            <span className="material-symbols-outlined" data-icon="visibility">visibility</span>
                        </button>
                    </div>
                    <div className="flex flex-col gap-1 mb-6">
                        <h1 className="font-financial-val text-white text-financial-val">12,450 ر.س</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(132,213,197,0.8)]"></div>
                            <span className="text-xs font-label-caps text-primary/80">التقسيم التلقائي مفعل</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-gutter">
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                <span className="material-symbols-outlined text-primary" data-icon="send">send</span>
                            </div>
                            <span className="text-xs font-label-caps text-on-surface">إرسال</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                <span className="material-symbols-outlined text-primary" data-icon="call_received">call_received</span>
                            </div>
                            <span className="text-xs font-label-caps text-on-surface">استلام</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 group">
                            <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                <span className="material-symbols-outlined text-primary" data-icon="account_balance_wallet">account_balance_wallet</span>
                            </div>
                            <span className="text-xs font-label-caps text-on-surface">شحن</span>
                        </button>
                    </div>
                </section>

                {/* Pockets Section */}
                <section className="flex flex-col gap-gutter">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="font-headline-md text-lg text-on-surface">صناديقي</h2>
                        <button className="text-primary text-sm font-semibold">رؤية الكل</button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-gutter">
                        {/* Expenses */}
                        <div className="glass-card p-5 rounded-[28px] border-l-4 border-l-primary/50 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary" data-icon="shopping_bag">shopping_bag</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant mb-1 font-label-caps">مصاريف</p>
                                <p className="font-headline-md text-md text-on-surface">3,200 ر.س</p>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
                            </div>
                        </div>

                        {/* Savings */}
                        <div className="glass-card p-5 rounded-[28px] border-l-4 border-l-secondary/50 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-secondary" data-icon="savings">savings</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant mb-1 font-label-caps">ادخار</p>
                                <p className="font-headline-md text-md text-on-surface">7,000 ر.س</p>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-secondary rounded-full" style={{ width: '85%' }}></div>
                            </div>
                        </div>

                        {/* Commitments */}
                        <div className="glass-card p-5 rounded-[28px] border-l-4 border-l-tertiary/50 flex flex-col gap-4 col-span-2 lg:col-span-1">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-tertiary" data-icon="event_repeat">event_repeat</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-on-surface-variant mb-1 font-label-caps">التزامات</p>
                                <p className="font-headline-md text-md text-on-surface">2,250 ر.س</p>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-tertiary rounded-full" style={{ width: '40%' }}></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Recent Transactions */}
                <section className="flex flex-col gap-gutter">
                    <h2 className="font-headline-md text-lg text-on-surface px-1">المعاملات الأخيرة</h2>
                    <div className="flex flex-col gap-3">
                        {/* Item 1 */}
                        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary" data-icon="person">person</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-headline-md text-sm text-on-surface">تحويل من أحمد</span>
                                    <span className="text-xs text-on-surface-variant font-label-caps">اليوم، 10:30 ص</span>
                                </div>
                            </div>
                            <span className="font-headline-md text-primary text-sm">+500 ر.س</span>
                        </div>

                        {/* Item 2 */}
                        <div className="glass-card p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-on-surface-variant" data-icon="store">store</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-headline-md text-sm text-on-surface">ستاربكس كافيه</span>
                                    <span className="text-xs text-on-surface-variant font-label-caps">أمس، 08:45 م</span>
                                </div>
                            </div>
                            <span className="font-headline-md text-white text-sm">-24 ر.س</span>
                        </div>
                    </div>
                </section>
            </main>

            {/* BottomNavBar */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-end pb-8 pt-4 px-4 rtl bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 rounded-t-[28px] shadow-[0_-10px_30px_-15px_rgba(0,105,92,0.3)]">
                {/* Home Active */}
                <a className="flex flex-col items-center justify-center text-teal-400 drop-shadow-[0_0_8px_rgba(0,169,110,0.5)] transition-all" href="#">
                    <span className="material-symbols-outlined text-2xl" data-icon="home" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">الرئيسية</span>
                </a>

                {/* Center QR Button */}
                <div className="relative -top-6">
                    <button className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(132,213,197,0.4)] hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-on-primary text-3xl" data-icon="qr_code_scanner" style={{ fontVariationSettings: "'wght' 600" }}>qr_code_scanner</span>
                    </button>
                </div>

                {/* Analytics Inactive */}
                <a className="flex flex-col items-center justify-center text-slate-500 hover:text-teal-300 transition-all" href="#">
                    <span className="material-symbols-outlined text-2xl" data-icon="receipt_long">receipt_long</span>
                    <span className="font-manrope text-[10px] font-medium mt-1">المعاملات</span>
                </a>
            </nav>
        </div>
    );
};

export default Dashboard;