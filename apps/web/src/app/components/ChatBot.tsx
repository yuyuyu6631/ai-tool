"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { buildApiUrl } from "../lib/api-base";

// ─── 类型定义 ──────────────────────────────────────────────────────────

type Message = {
  role: "user" | "assistant";
  content: string;
};

// ─── 常量 ──────────────────────────────────────────────────────────────

/** 初始欢迎消息 */
const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "您好！我是**星点评 AI 导购助手** 🤖\n\n我可以帮您：\n- 🔍 **搜索和推荐** AI 工具\n- ⚖️ **对比** 不同工具的优劣\n- 💡 **解答** AI 工具相关问题\n\n请告诉我您的需求，或点击下方快捷提问开始！",
};

/** 快捷提问选项 */
const QUICK_QUESTIONS = [
  "帮我找一款 AI 写作工具",
  "推荐适合做 PPT 的 AI 工具",
  "有哪些免费的 AI 工具？",
  "AI 绘画工具哪家强？",
];

// ─── 工具函数 ──────────────────────────────────────────────────────────

async function buildChatRequestError(response: Response): Promise<Error> {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? JSON.stringify(await response.json()) : await response.text();
  const detail = payload.trim().slice(0, 300);
  const message = detail
    ? `Chat request failed with status ${response.status}: ${detail}`
    : `Chat request failed with status ${response.status}`;
  return new Error(message);
}

// ─── Markdown 渲染组件 ─────────────────────────────────────────────────

/** 辅助组件：渲染思维过程 */
const ThoughtBlock = ({ content }: { content: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!content.trim()) return null;

  return (
    <div className="mb-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/50 shadow-sm transition-all animate-in fade-in slide-in-from-top-1 duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 hover:text-indigo-500 transition-colors w-full"
        aria-expanded={isExpanded}
      >
        <div className={`p-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </div>
        <span>{isExpanded ? "收起思考过程" : "已深度思考"}</span>
      </button>
      {isExpanded && (
        <div className="mt-2.5 text-[12px] text-slate-500 dark:text-slate-400 italic whitespace-pre-wrap leading-relaxed border-t border-slate-200/40 dark:border-slate-700/30 pt-2.5 px-1 font-serif">
          {content}
        </div>
      )}
    </div>
  );
};

/** 解析思维过程与主体内容的工具函数 */
const parseThinkContent = (text: string) => {
  // 匹配 <think> 标签，支持非闭合状态
  const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/;
  const match = text.match(thinkRegex);
  if (match) {
    const thought = match[1];
    const answer = text.replace(thinkRegex, "").trim();
    return { thought, answer };
  }
  return { thought: null, answer: text };
};

/** 助手消息的 Markdown 渲染器 */
function AssistantMessage({ content }: { content: string }) {
  const { thought, answer } = parseThinkContent(content);

  return (
    <div className="flex flex-col gap-1">
      {thought && <ThoughtBlock content={thought} />}
      {answer && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // 链接在新窗口打开
            a: ({ ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-600 underline underline-offset-2 transition-colors"
              />
            ),
            // 表格样式
            table: ({ ...props }) => (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full text-xs border-collapse" {...props} />
              </div>
            ),
            th: ({ ...props }) => (
              <th className="px-2 py-1 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-medium text-left" {...props} />
            ),
            td: ({ ...props }) => (
              <td className="px-2 py-1 border border-gray-200 dark:border-gray-700" {...props} />
            ),
            // 代码块样式
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              return isInline ? (
                <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-pink-600 dark:text-pink-400" {...props}>{children}</code>
              ) : (
                <code className={`block p-2 my-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto ${className || ""}`} {...props}>{children}</code>
              );
            },
            // 列表样式
            ul: ({ ...props }) => <ul className="list-disc pl-4 my-1 space-y-0.5" {...props} />,
            ol: ({ ...props }) => <ol className="list-decimal pl-4 my-1 space-y-0.5" {...props} />,
            // 标题样式
            h1: ({ ...props }) => <h1 className="text-base font-bold mt-2 mb-1" {...props} />,
            h2: ({ ...props }) => <h2 className="text-sm font-bold mt-2 mb-1" {...props} />,
            h3: ({ ...props }) => <h3 className="text-sm font-semibold mt-1.5 mb-0.5" {...props} />,
            // 段落样式
            p: ({ ...props }) => <p className="my-1 leading-relaxed" {...props} />,
            // 加粗
            strong: ({ ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
            // 分割线
            hr: () => <hr className="my-2 border-gray-200 dark:border-gray-700" />,
            // blockquote
            blockquote: ({ ...props }) => (
              <blockquote className="border-l-2 border-indigo-400 pl-2 my-1 text-gray-600 dark:text-gray-400 italic" {...props} />
            ),
          }}
        >
          {answer}
        </ReactMarkdown>
      )}
    </div>
  );
}

// ─── 主组件 ────────────────────────────────────────────────────────────

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /** 滚动到最新消息 */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  /** 是否仅有初始欢迎消息 */
  const showQuickQuestions = messages.length === 1 && messages[0].role === "assistant" && !isLoading;

  /** 清空对话，恢复初始状态 */
  const handleReset = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setIsLoading(false);
  }, []);

  /** 发送消息（SSE 流式处理） */
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!response.ok) {
        throw await buildChatRequestError(response);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      // 插入空的 assistant 消息占位
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      // SSE 行缓冲区与累计文本
      let buffer = "";
      let fullAssistantText = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data: ")) continue;

            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") {
              done = true;
              break;
            }

            try {
              const payload = JSON.parse(dataStr);

              // 错误事件
              if (payload.error) {
                const errorMessage = `> ⚠️ **系统提示**：${payload.error}`;
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = { ...updated[lastIdx], content: errorMessage };
                  }
                  return updated;
                });
                done = true;
                break;
              }

              // 正常 content chunk
              if (payload.content) {
                fullAssistantText += payload.content;
                const nextText = fullAssistantText; // 捕获闭包变量
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    // 关键：创建新对象，不使用 += 变异
                    updated[lastIdx] = { ...updated[lastIdx], content: nextText };
                  }
                  return updated;
                });
              }
            } catch {
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "> ⚠️ **系统提示**：网络请求异常，请稍后重试" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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
              {/* 新对话按钮 */}
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                title="新对话"
                aria-label="新对话"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {/* 关闭按钮 */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                aria-label="关闭 AI 助手"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* 头像 */}
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium mt-0.5 ${msg.role === "user"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                    : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm"
                    }`}
                >
                  {msg.role === "user" ? "我" : "AI"}
                </div>
                {/* 消息气泡 */}
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

            {/* 正在思考的动画指示 */}
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

            {/* 快捷提问按钮 */}
            {showQuickQuestions && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_QUESTIONS.map((q, idx) => (
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

            <div ref={messagesEndRef} />
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
              AI 生成内容仅供参考 · 建议前往工具官网确认
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        id="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105 ${isOpen
          ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 rotate-0"
          : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-indigo-500/30 hover:shadow-xl"
          }`}
        aria-label={isOpen ? "关闭 AI 助手" : "打开 AI 助手"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        )}
      </button>
    </div>
  );
}
