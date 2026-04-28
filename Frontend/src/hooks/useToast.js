import { useState, useCallback } from 'react';

/**
 * useToast — Lightweight toast notification hook
 * No backend, no dependencies, just state.
 * 
 * Usage:
 *   const { toasts, showToast } = useToast();
 *   showToast('تم الاستلام بنجاح', 'success');
 */
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = crypto.randomUUID(); // ✅ fix
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, showToast, removeToast };
}