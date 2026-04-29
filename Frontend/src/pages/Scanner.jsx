import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

const Scanner = () => {
    const navigate = useNavigate();
    const scannerRef = useRef(null);
    const isRunningRef = useRef(false);
    const hasStoppedRef = useRef(false);

    const [status, setStatus] = useState("loading"); // loading | running | error
    const [errorMsg, setErrorMsg] = useState("");
    const [errorType, setErrorType] = useState(""); // permission | https | nocam | generic

    const stopScanner = useCallback(async () => {
        if (scannerRef.current && isRunningRef.current && !hasStoppedRef.current) {
            hasStoppedRef.current = true;
            isRunningRef.current = false;
            try { await scannerRef.current.stop(); } catch { }
            try { scannerRef.current.clear(); } catch { }
        }
    }, []);

    const startScanner = useCallback(async () => {
        setStatus("loading");
        setErrorMsg("");
        setErrorType("");
        hasStoppedRef.current = false;
        isRunningRef.current = false;

        // ── 1. Secure context check ───────────────────────────────────────────
        if (!window.isSecureContext) {
            setStatus("error");
            setErrorType("https");
            setErrorMsg(
                location.hostname !== "localhost"
                    ? `الكاميرا تتطلب HTTPS.\nافتح التطبيق عبر localhost على نفس الجهاز أو فعّل HTTPS على الخادم.`
                    : "الكاميرا غير متاحة في هذا السياق."
            );
            return;
        }

        // ── 2. API availability ───────────────────────────────────────────────
        if (!navigator.mediaDevices?.getUserMedia) {
            setStatus("error");
            setErrorType("generic");
            setErrorMsg("متصفحك لا يدعم الوصول للكاميرا.");
            return;
        }

        // ── 3. Enumerate real camera devices (more reliable than facingMode) ──
        let cameras = [];
        try {
            cameras = await Html5Qrcode.getCameras();
        } catch (err) {
            // getCameras throws on permission denial
            const msg = (err?.message || "").toLowerCase();
            if (msg.includes("permission") || msg.includes("denied") || msg.includes("notallowed")) {
                setStatus("error");
                setErrorType("permission");
                setErrorMsg("تم رفض إذن الكاميرا.\nافتح إعدادات المتصفح وامنح الإذن لهذا الموقع.");
            } else {
                setStatus("error");
                setErrorType("generic");
                setErrorMsg("حدث خطأ أثناء الوصول للكاميرا.\n" + (err?.message || ""));
            }
            return;
        }

        if (!cameras.length) {
            setStatus("error");
            setErrorType("nocam");
            setErrorMsg("لم يتم العثور على كاميرا متصلة بالجهاز.");
            return;
        }

        // ── 4. Pick best camera (prefer rear/environment) ────────────────────
        const rearCam =
            cameras.find(c => /back|rear|environment/i.test(c.label)) ??
            cameras[cameras.length - 1];

        const onScan = (decodedText) => {
            if (!isRunningRef.current || hasStoppedRef.current) return;
            hasStoppedRef.current = true;
            isRunningRef.current = false;
            scannerRef.current?.stop()
                .catch(() => { })
                .finally(() => {
                    try { navigate("/sending", { state: { ...JSON.parse(decodedText), fromQR: true } }); }
                    catch { navigate("/sending"); }
                });
        };

        // ── 5. Start with device ID (more reliable than facingMode) ──────────
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        const candidates = [rearCam, ...cameras.filter(c => c.id !== rearCam.id)];

        for (const cam of candidates) {
            try {
                await scanner.start(
                    cam.id,
                    { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
                    onScan
                );
                isRunningRef.current = true;
                setStatus("running");
                return;
            } catch (err) {
                const msg = (err?.message || "").toLowerCase();
                if (msg.includes("permission") || msg.includes("denied") || msg.includes("notallowed")) {
                    setStatus("error");
                    setErrorType("permission");
                    setErrorMsg("تم رفض إذن الكاميرا.\nافتح إعدادات المتصفح وامنح الإذن لهذا الموقع.");
                    return;
                }
                console.warn("Camera failed:", cam.label, err.message);
            }
        }

        setStatus("error");
        setErrorType("generic");
        setErrorMsg("تعذّر فتح الكاميرا. تأكد أنها غير مستخدمة في تطبيق آخر وأعد المحاولة.");
    }, [navigate]);

    useEffect(() => {
        startScanner();
        return () => { stopScanner(); };
    }, []);

    // ── Icon per error type ───────────────────────────────────────────────────
    const errorIcon = {
        permission: "lock",
        https: "http",
        nocam: "no_photography",
        generic: "videocam_off",
    }[errorType] || "videocam_off";

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col" dir="rtl" lang="ar">

            {/* Header */}
            <header className="flex items-center gap-4 px-5 pt-6 pb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-white">arrow_forward</span>
                </button>
                <h1 className="font-manrope font-bold text-lg text-white">مسح رمز QR</h1>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 pb-16">

                {/* ── Viewfinder ── */}
                <div className="relative w-72 h-72">

                    {/* Corner brackets (only when running) */}
                    {status === "running" && (
                        <>
                            <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal-400 rounded-tr-xl z-10 pointer-events-none" />
                            <span className="absolute top-0 left-0  w-8 h-8 border-t-2 border-l-2 border-teal-400 rounded-tl-xl z-10 pointer-events-none" />
                            <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal-400 rounded-br-xl z-10 pointer-events-none" />
                            <span className="absolute bottom-0 left-0  w-8 h-8 border-b-2 border-l-2 border-teal-400 rounded-bl-xl z-10 pointer-events-none" />
                            <div className="scan-line absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent rounded-full z-10 pointer-events-none" />
                        </>
                    )}

                    {/* html5-qrcode mounts its <video> here */}
                    <div
                        id="reader"
                        className="w-full h-full rounded-2xl overflow-hidden bg-black"
                        style={{ display: status === "running" ? "block" : "none" }}
                    />

                    {/* Loading */}
                    {status === "loading" && (
                        <div className="w-full h-full rounded-2xl bg-slate-900 border border-white/10 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 rounded-full border-2 border-teal-400/20 border-t-teal-400 spinner" />
                            <p className="text-sm text-slate-400">جاري تشغيل الكاميرا...</p>
                        </div>
                    )}

                    {/* Error */}
                    {status === "error" && (
                        <div className="w-full h-full rounded-2xl bg-slate-900 border border-red-500/20 flex flex-col items-center justify-center gap-3 p-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-red-400">{errorIcon}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{errorMsg}</p>
                        </div>
                    )}
                </div>

                {/* Hint */}
                {status === "running" && (
                    <p className="text-sm text-slate-400 text-center">
                        وجّه الكاميرا نحو رمز QR الخاص بالمستلم
                    </p>
                )}

                {/* Retry */}
                {status === "error" && errorType !== "https" && (
                    <button
                        onClick={startScanner}
                        className="flex items-center gap-2 px-6 py-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-400 font-semibold hover:bg-teal-500/20 transition-colors active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        <span>إعادة المحاولة</span>
                    </button>
                )}

                {/* HTTPS-specific guidance */}
                {status === "error" && errorType === "https" && (
                    <div className="glass-card rounded-2xl px-5 py-4 max-w-xs text-center space-y-1 border border-amber-500/20">
                        <p className="text-xs text-amber-400 font-semibold">الحل السريع</p>
                        <p className="text-xs text-slate-400 leading-relaxed" dir="ltr">
                            Open <strong className="text-white">localhost:{location.port || 5173}</strong> on this device instead of the IP address.
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                .scan-line { animation: scan 2s ease-in-out infinite; top: 12px; }
                @keyframes scan {
                    0%   { top: 12px;               opacity: 1;   }
                    50%  { top: calc(100% - 14px);  opacity: 0.5; }
                    100% { top: 12px;               opacity: 1;   }
                }
                .spinner { animation: spin 0.85s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Strip html5-qrcode's own UI chrome */
                #reader video          { width: 100% !important; height: 100% !important; object-fit: cover !important; }
                #reader > div:not(video) { display: none !important; }
                #reader img            { display: none !important; }
            `}</style>
        </div>
    );
};

export default Scanner;
