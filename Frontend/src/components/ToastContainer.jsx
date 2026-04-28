import React from 'react';

/**
 * ToastContainer — Renders all active toasts
 * Place once at the top level of your page component.
 * 
 * Usage:
 *   <ToastContainer toasts={toasts} onRemove={removeToast} />
 */
const ICONS = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    split: 'account_tree',
};

const COLORS = {
    success: 'border-primary/40 bg-primary/10 text-primary',
    error: 'border-red-500/40 bg-red-500/10 text-red-400',
    info: 'border-secondary/40 bg-secondary/10 text-secondary',
    split: 'border-tertiary/40 bg-tertiary/10 text-tertiary',
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
            animate-[slideDown_0.3s_ease-out]
            ${COLORS[toast.type] || COLORS.success}
          `}
                    style={{ animation: 'slideDown 0.3s ease-out' }}
                >
                    <span className="material-symbols-outlined text-xl shrink-0">
                        {ICONS[toast.type] || ICONS.success}
                    </span>
                    <p className="font-manrope text-sm font-semibold flex-1 text-right">
                        {toast.message}
                    </p>
                </div>
            ))}
            <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default ToastContainer;