import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const parseThinkContent = (text: string) => {
    const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/;
    const match = text.match(thinkRegex);
    if (match) {
        const thought = match[1];
        const answer = text.replace(thinkRegex, "").trim();
        return { thought, answer };
    }
    return { thought: null, answer: text };
};

export const ThoughtBlock = ({ content }: { content: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!content.trim()) return null;

    return (
        <div className="mb-3 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3 shadow-sm">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Collapse thought process" : "Expand thought process"}
                className="flex w-full items-center gap-2 text-[11px] font-semibold text-cyan-100/70 transition-colors hover:text-cyan-100"
            >
                <span className={`grid h-4 w-4 place-items-center rounded border border-cyan-300/30 transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </span>
                <span>{isExpanded ? "收起思考过程" : "已深度思考"}</span>
            </button>
            {isExpanded && (
                <div className="mt-2.5 whitespace-pre-wrap border-t border-cyan-300/10 px-1 pt-2.5 text-[12px] leading-relaxed text-slate-300/80">
                    {content}
                </div>
            )}
        </div>
    );
};

interface AssistantMessageProps {
    content: string;
}

export function AssistantMessage({ content }: AssistantMessageProps) {
    const { thought, answer } = parseThinkContent(content);

    return (
        <div className="flex flex-col gap-1">
            {thought && <ThoughtBlock content={thought} />}
            {answer && (
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        a: ({ ...props }) => (
                            <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-200 underline underline-offset-2 transition-colors hover:text-white"
                            />
                        ),
                        table: ({ ...props }) => (
                            <div className="my-2 overflow-x-auto">
                                <table className="min-w-full border-collapse text-xs" {...props} />
                            </div>
                        ),
                        th: ({ ...props }) => <th className="border border-white/10 bg-white/10 px-2 py-1 text-left font-medium" {...props} />,
                        td: ({ ...props }) => <td className="border border-white/10 px-2 py-1" {...props} />,
                        code: ({ className, children, ...props }) => {
                            const isInline = !className;
                            return isInline ? (
                                <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs text-cyan-100" {...props}>
                                    {children}
                                </code>
                            ) : (
                                <code className={`my-1 block overflow-x-auto rounded bg-black/30 p-2 font-mono text-xs ${className || ""}`} {...props}>
                                    {children}
                                </code>
                            );
                        },
                        ul: ({ ...props }) => <ul className="my-1 list-disc space-y-0.5 pl-4" {...props} />,
                        ol: ({ ...props }) => <ol className="my-1 list-decimal space-y-0.5 pl-4" {...props} />,
                        h1: ({ ...props }) => <h1 className="mb-1 mt-2 text-base font-bold text-white" {...props} />,
                        h2: ({ ...props }) => <h2 className="mb-1 mt-2 text-sm font-bold text-white" {...props} />,
                        h3: ({ ...props }) => <h3 className="mb-0.5 mt-1.5 text-sm font-semibold text-white" {...props} />,
                        p: ({ ...props }) => <p className="my-1 leading-relaxed" {...props} />,
                        strong: ({ ...props }) => <strong className="font-semibold text-white" {...props} />,
                        hr: () => <hr className="my-2 border-white/10" />,
                        blockquote: ({ ...props }) => <blockquote className="my-1 border-l-2 border-cyan-300 pl-2 text-slate-300" {...props} />,
                    }}
                >
                    {answer}
                </ReactMarkdown>
            )}
        </div>
    );
}
