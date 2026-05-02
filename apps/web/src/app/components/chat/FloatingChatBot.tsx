"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useChat, QUICK_QUESTIONS, Message } from "../../hooks/useChat";
import { AssistantMessage } from "./AssistantMessage";
import { shouldHideFloatingChatBot } from "../../lib/floating-chat-visibility";

export default function FloatingChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const shouldHide = shouldHideFloatingChatBot(pathname, searchParams.get("mode"));

    const {
        messages,
        input,
        setInput,
        isLoading,
        containerRef,
        showQuickQuestions,
        scrollToBottom,
        handleReset,
        handleSend
    } = useChat();

    useEffect(() => {
        if (shouldHide) {
            setIsOpen(false);
        }
    }, [shouldHide]);

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen, scrollToBottom]);

    if (shouldHide) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="w-[360px] md:w-[420px] h-[560px] max-h-[80vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in">
                    {/* ── Header ── */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-sm font-bold">
                                AI
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm leading-tight">AI 导购助手</h3>
                                <p className="text-[10px] text-white/70">帮你找到最合适的 AI 工具</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleReset}
                                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
                                title="新对话"
                                aria-label="开启新对话"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all focus-visible:ring-2 focus-visible:ring-white/50 focus:outline-none"
                                aria-label="关闭 AI 助手"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* ── Messages ── */}
                    <div
                        ref={containerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50 overscroll-behavior-contain"
                        style={{ overscrollBehavior: 'contain' }}
                    >
                        {messages.map((msg: Message, idx: number) => (
                            <div
                                key={idx}
                                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <div
                                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium mt-0.5 ${msg.role === "user"
                                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                                        : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm"
                                        }`}
                                >
                                    {msg.role === "user" ? "我" : "AI"}
                                </div>
                                <div
                                    className={`message-bubble max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed break-words ${msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-tr-sm shadow-sm"
                                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm shadow-sm"
                                        }`}
                                >
                                    {msg.role === "assistant" ? (
                                        <AssistantMessage content={msg.content || "…"} />
                                    ) : (
                                        <span className="whitespace-pre-wrap">{msg.content}</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                            <div className="flex gap-2.5 flex-row">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[11px] font-medium shadow-sm">
                                    AI
                                </div>
                                <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-tl-sm shadow-sm flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                                    <span className="ml-1.5 text-xs text-gray-400">正在思考…</span>
                                </div>
                            </div>
                        )}

                        {showQuickQuestions && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {QUICK_QUESTIONS.map((q: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(q)}
                                        className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-400 transition-all duration-200 shadow-sm"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Input Area ── */}
                    <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                disabled={isLoading}
                                placeholder="描述你的需求，例如: 帮我找写作辅助..."
                                className="flex-1 bg-transparent border-none outline-none text-sm px-3 py-2 text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 rounded-lg transition-colors"
                                aria-label="发送消息"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                            </button>
                        </div>
                        <div className="text-center mt-1.5 text-[10px] text-gray-400">
                            AI 生成内容仅供参考
                        </div>
                    </div>
                </div>
            )}

            {/* ── 轻量级 Floating Button ── */}
            {!isOpen && (
                <button
                    id="chat-toggle"
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    aria-label="打开 AI 助手"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    <span className="text-sm font-medium tracking-wide">✨ 智能选型</span>
                </button>
            )}
        </div>
    );
}
