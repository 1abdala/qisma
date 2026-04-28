import React from 'react';

// Richer icon set — covers receive, split, send, success, error, info
const ICONS = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    split: 'account_tree',
    receive: 'call_received',   // 💸 receive
    send: 'send',            // outgoing
};

const COLORS = {
    success: 'border-primary/40 bg-primary/10 text-primary',
    error: 'border-red-500/40 bg-red-500/10 text-red-400',
    info: 'border-secondary/40 bg-secondary/10 text-secondary',
    split: 'border-tertiary/40 bg-tertiary/10 text-tertiary',
    receive: 'border-primary/40 bg-primary/10 text-primary',
    send: 'border-white/20 bg-white/5 text-on-surface',
};

const EMOJI_PREFIX = {
    receive: '💸 ',
    split: '🔀 ',
    success: '✅ ',
    send: '📤 ',
    error: '❌ ',
    info: 'ℹ️ ',
};

const ToastContainer = ({ toasts, onRemove }) => {
    if (!toasts.length) return null;

    return (
        <div className="fixed top-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    onClick={() => onRemove(toast.id)}
                    className={`
                        w-full max-w-sm flex items-center gap-3
                        px-4 py-3 rounded-2xl border backdrop-blur-xl
                        shadow-lg pointer-events-auto cursor-pointer
                        ${COLORS[toast.type] || COLORS.success}
                    `}
                    style={{ animation: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
                >
                    <span
                        className="material-symbols-outlined text-xl shrink-0"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        {ICONS[toast.type] || ICONS.success}
                    </span>
                    <p className="font-manrope text-sm font-semibold flex-1 text-right">
                        {(EMOJI_PREFIX[toast.type] || '') + toast.message}
                    </p>
                </div>
            ))}
            <style>{`
                @keyframes toastIn {
                    from { opacity: 0; transform: translateY(-16px) scale(0.95); }
                    to   { opacity: 1; transform: translateY(0)    scale(1);    }
                }
            `}</style>
        </div>
    );
};

export default ToastContainer;