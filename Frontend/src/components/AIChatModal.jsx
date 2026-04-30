import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { DisplayCurrencyContext } from '../contexts/DisplayCurrencyContext';

const API = `${import.meta.env.VITE_API_URL}/api`;

const AIChatModal = ({ isOpen, onClose }) => {
    const { currentUserId } = useContext(UserContext);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'مرحباً بك! أنا Qisma AI. يمكنني مساعدتك في الإجابة على أسئلة حول مدخراتك، نفقاتك، أو أهدافك المالية. كيف يمكنني مساعدتك اليوم؟' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    if (!isOpen) return null;

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            // we only send recent history (e.g. last 10 messages) to save tokens
            const historyToSend = newMessages.slice(-10);

            const res = await fetch(`${API}/ai/chat/${currentUserId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: historyToSend })
            });

            if (!res.ok) throw new Error('فشل الاتصال بالذكاء الاصطناعي');

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً، حدث خطأ أثناء الاتصال بالخادم.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" dir="rtl" lang="ar">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[28px] overflow-hidden flex flex-col h-[80vh] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-primary-container to-surface-dim">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-[2px]">
                            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">auto_awesome</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-headline-md text-white font-bold text-sm">Qisma AI</h3>
                            <p className="text-[10px] text-emerald-400 font-label-caps">متصل • المساعد المالي</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-primary text-on-primary rounded-tr-sm' 
                                : 'bg-white/5 text-on-surface border border-white/5 rounded-tl-sm'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 border border-white/5 rounded-[20px] rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/5">
                    <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-primary/50 focus-within:bg-white/10 transition-colors">
                        <textarea 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="اسألني عن ميزانيتك..."
                            className="flex-1 bg-transparent border-none text-white text-sm outline-none resize-none max-h-32 min-h-[40px] px-2 py-2 no-scrollbar"
                            rows={1}
                        />
                        <button 
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 disabled:opacity-40 disabled:bg-white/10 disabled:text-white/40 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px] -rotate-45 ml-1">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatModal;
