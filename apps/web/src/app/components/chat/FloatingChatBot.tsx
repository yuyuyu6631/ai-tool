"use client";

import React, { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from "react";
import { FileText, Gift, GripHorizontal, Minus, PenLine, Presentation, Scale, Search, Send, Sparkles, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useChat, QUICK_QUESTIONS, Message } from "../../hooks/useChat";
import { shouldHideFloatingChatBot } from "../../lib/floating-chat-visibility";
import { AssistantMessage } from "./AssistantMessage";

const FEATURES = [
    { icon: Search, title: "找工具组合", body: "匹配最佳工具组合", color: "from-[var(--color-primary)] to-[var(--color-primary-active)]" },
    { icon: Scale, title: "做同类对比", body: "多维度对比优劣", color: "from-[var(--color-primary)] to-[var(--color-accent)]" },
];

const QUICK_ICONS = [FileText, Presentation, Gift, PenLine];
const POSITION_STORAGE_KEY = "xingdianping-floating-chat-position";
const PANEL_MARGIN = 18;

type Position = { left: number; top: number };
type DragState = { offsetX: number; offsetY: number } | null;

function clampPosition(position: Position, width: number, height: number): Position {
    if (typeof window === "undefined") return position;

    return {
        left: Math.min(Math.max(PANEL_MARGIN, position.left), Math.max(PANEL_MARGIN, window.innerWidth - width - PANEL_MARGIN)),
        top: Math.min(Math.max(PANEL_MARGIN, position.top), Math.max(PANEL_MARGIN, window.innerHeight - height - PANEL_MARGIN)),
    };
}

export default function FloatingChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<Position | null>(null);
    const [dragState, setDragState] = useState<DragState>(null);
    const panelRef = useRef<HTMLElement>(null);
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
        handleSend,
    } = useChat();

    const hasConversation = !showQuickQuestions || messages.length > 1;

    useEffect(() => {
        if (shouldHide) {
            setIsOpen(false);
        }
    }, [shouldHide]);

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen, scrollToBottom]);

    useEffect(() => {
        const saved = window.localStorage.getItem(POSITION_STORAGE_KEY);
        if (!saved) return;

        try {
            const parsed = JSON.parse(saved) as Position;
            if (typeof parsed.left === "number" && typeof parsed.top === "number") {
                setPosition(parsed);
            }
        } catch {
            window.localStorage.removeItem(POSITION_STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        const keepInsideViewport = () => {
            const panel = panelRef.current;
            if (!panel || !position) return;

            const rect = panel.getBoundingClientRect();
            const nextPosition = clampPosition(position, rect.width, rect.height);
            setPosition(nextPosition);
            window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(nextPosition));
        };

        window.addEventListener("resize", keepInsideViewport);
        return () => window.removeEventListener("resize", keepInsideViewport);
    }, [position]);

    if (shouldHide) {
        return null;
    }

    const panelStyle: CSSProperties = position
        ? { left: position.left, top: position.top }
        : { right: "clamp(16px, 4vw, 24px)", bottom: "clamp(16px, 4vw, 24px)" };

    const startDrag = (event: PointerEvent<HTMLElement>) => {
        const panel = panelRef.current;
        if (!panel || window.innerWidth < 640) return;

        const rect = panel.getBoundingClientRect();
        setPosition({ left: rect.left, top: rect.top });
        setDragState({ offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top });
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const moveDrag = (event: PointerEvent<HTMLElement>) => {
        const panel = panelRef.current;
        if (!panel || !dragState) return;

        const rect = panel.getBoundingClientRect();
        const nextPosition = clampPosition(
            { left: event.clientX - dragState.offsetX, top: event.clientY - dragState.offsetY },
            rect.width,
            rect.height,
        );
        setPosition(nextPosition);
        window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(nextPosition));
    };

    const stopDrag = (event: PointerEvent<HTMLElement>) => {
        if (!dragState) return;

        setDragState(null);
        event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const resetPosition = () => {
        setPosition(null);
        window.localStorage.removeItem(POSITION_STORAGE_KEY);
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleSend();
    };

    return (
        <>
            {isOpen && (
                <section
                    ref={panelRef}
                    style={panelStyle}
                    className="fixed z-50 flex h-[min(620px,calc(100vh-40px))] w-[min(430px,calc(100vw-32px))] flex-col overflow-hidden rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-glass)] backdrop-blur-xl sm:h-[min(660px,calc(100vh-48px))] sm:w-[430px]"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(143,178,255,0.12),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(232,184,109,0.08),transparent_30%)]" />

                    <header
                        onPointerDown={startDrag}
                        onPointerMove={moveDrag}
                        onPointerUp={stopDrag}
                        onPointerCancel={stopDrag}
                        className="relative cursor-grab select-none border-b border-[var(--border-default)] bg-[rgba(255,255,255,0.045)] px-4 py-4 active:cursor-grabbing sm:px-5"
                        title="拖动调整位置"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--color-primary-border)] bg-gradient-to-br from-[var(--color-primary-hover)] to-[var(--color-primary)]">
                                    <Sparkles className="h-6 w-6 fill-white text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="truncate text-xl font-semibold leading-tight tracking-normal text-white">星点评 AI 导购助手</h2>
                                    <p className="mt-1 truncate text-sm text-[var(--text-tertiary)]">
                                        <span className="font-semibold text-[var(--color-primary)]">3 秒</span> 帮你找到能用的 AI 工具
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <button
                                    type="button"
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={resetPosition}
                                    className="hidden h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white sm:grid"
                                    title="恢复右下角"
                                    aria-label="恢复右下角"
                                >
                                    <GripHorizontal className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={handleReset}
                                    className="grid h-8 w-8 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
                                    title="新对话"
                                    aria-label="新对话"
                                >
                                    <Minus className="h-5 w-5" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={() => setIsOpen(false)}
                                    className="grid h-8 w-8 place-items-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white"
                                    aria-label="关闭 AI 助手"
                                >
                                    <X className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </header>

                    <div
                        className={`relative min-h-0 flex-1 px-4 py-4 ${hasConversation ? "overflow-y-auto" : "overflow-hidden"}`}
                        ref={containerRef}
                        style={{ overscrollBehavior: "contain" }}
                    >
                        {!hasConversation ? (
                            <div className="space-y-3">
                                <div className="rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3.5">
                                    <h3 className="text-lg font-semibold text-white">你好，我是星点评 AI 导购助手。</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">告诉我你的任务，我会给你推荐工具组合、适合原因、风险提醒和使用流程。</p>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        {FEATURES.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <div className="min-w-0 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-strong)] p-3" key={item.title}>
                                                    <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${item.color} p-px`}>
                                                        <div className="grid h-full w-full place-items-center rounded-[11px] bg-[var(--bg-elevated)]">
                                                            <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                                                        </div>
                                                    </div>
                                                    <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                                                    <p className="mt-1 text-xs leading-5 text-slate-400">{item.body}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-2">
                                {messages.map((msg: Message, idx: number) => (
                                    <div key={`${msg.role}-${idx}`} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-2xl text-xs font-semibold ${msg.role === "user" ? "bg-white/12 text-white" : "bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)]"}`}>
                                            {msg.role === "user" ? "我" : "AI"}
                                        </div>
                                        <div className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 ${msg.role === "user" ? "rounded-tr-md bg-[var(--color-primary)] text-[#0B1020]" : "rounded-tl-md border border-[var(--border-default)] bg-[var(--bg-surface-strong)] text-[var(--text-secondary)]"}`}>
                                            {msg.role === "assistant" ? <AssistantMessage content={msg.content || "正在整理推荐..."} /> : <span className="whitespace-pre-wrap">{msg.content}</span>}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                                    <div className="flex gap-3">
                                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-xs font-semibold text-[var(--color-primary-hover)]">AI</div>
                                        <div className="flex items-center gap-2 rounded-3xl rounded-tl-md border border-[var(--border-default)] bg-[var(--bg-surface-strong)] px-4 py-3">
                                            <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]" />
                                            <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)] [animation-delay:0.15s]" />
                                            <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)] [animation-delay:0.3s]" />
                                            <span className="ml-1 text-xs text-slate-300">正在思考...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <footer className="relative border-t border-white/10 px-4 pb-4 pt-3">
                        {showQuickQuestions && hasConversation && (
                            <div className="mb-3 grid gap-2">
                                {QUICK_QUESTIONS.map((question, index) => {
                                    const Icon = QUICK_ICONS[index] || Search;
                                    return (
                                        <button
                                            key={question}
                                            type="button"
                                            onClick={() => handleSend(question)}
                                            className="group flex min-h-11 items-center justify-between rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-left text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--color-primary-border)] hover:bg-[var(--bg-surface-hover)]"
                                        >
                                            <span className="flex min-w-0 items-center gap-2">
                                                <Icon className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                                                <span className="truncate">{question}</span>
                                            </span>
                                            <span className="ml-2 text-xl text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-cyan-200">›</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <form onSubmit={onSubmit} className="flex items-center gap-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-strong)] p-1.5 focus-within:border-[var(--border-focus)]">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                placeholder="描述你的需求，例如：我想做答辩 PPT"
                                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--color-primary-hover)] to-[var(--color-primary)] text-[#0B1020] transition hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-45"
                                aria-label="发送消息"
                            >
                                <Send className="h-5 w-5 fill-white" aria-hidden="true" />
                            </button>
                        </form>
                        <p className="mt-2 text-center text-[11px] text-slate-500">结果仅供参考，建议结合实际场景试用</p>
                    </footer>
                </section>
            )}

            {!isOpen && (
                <button
                    id="chat-toggle"
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-3 text-[var(--text-primary)] shadow-[var(--shadow-glass)] backdrop-blur transition hover:-translate-y-1 hover:border-[var(--color-primary-border)] hover:bg-[var(--bg-surface-hover)]"
                    aria-label="打开 AI 助手"
                >
                    <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
                    <span className="text-sm font-semibold tracking-normal">星点评 AI 助手</span>
                </button>
            )}
        </>
    );
}
