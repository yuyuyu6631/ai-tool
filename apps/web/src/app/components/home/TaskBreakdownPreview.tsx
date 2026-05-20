"use client";

import { ArrowRight } from "lucide-react";
import type { QuickTask } from "./home-data";

const DEFAULT_TASK_PREVIEW = {
  id: "default",
  title: "把任务说清楚，再选真正能用的 AI",
  body: "首页先帮你把需求拆开：要交付什么、卡在哪一步、是否要免费或国内可用，再进入推荐和实测结论。",
  next: "",
};

interface TaskBreakdownPreviewProps {
  activeTask: (QuickTask & { title?: string; body?: string; next?: string }) | null;
  onStart: () => void;
}

export default function TaskBreakdownPreview({ activeTask, onStart }: TaskBreakdownPreviewProps) {
  const preview = activeTask ?? DEFAULT_TASK_PREVIEW;
  const steps = activeTask
    ? ["先确认这件事最后要交付什么", "拆出最容易卡住的环节", "再看适合进入哪些场景"]
    : ["说清楚要做什么", "拆成几个关键步骤", "推荐适合的工具", "查看实测结果和避坑建议"];

  return (
    <section
      data-testid="home-signal-radar"
      className="home-preview relative overflow-hidden rounded-[28px] p-5 backdrop-blur-2xl motion-safe:animate-[agentReveal_560ms_ease-out_180ms_both] lg:p-7"
    >
      <div className="home-preview-ring home-preview-ring--outer pointer-events-none absolute right-8 top-7 h-40 w-40 rounded-full" />
      <div className="home-preview-ring home-preview-ring--inner pointer-events-none absolute right-16 top-[60px] h-24 w-24 rounded-full" />
      <div className="home-preview-core pointer-events-none absolute right-24 top-[92px] h-10 w-10 rounded-full" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="home-preview-badge inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
            任务路线预览
          </p>
          <span className="home-preview-live rounded-full px-3 py-1 text-[11px] font-semibold">
            LIVE
          </span>
        </div>

        <div key={preview.id} className="motion-safe:animate-[agentReveal_360ms_ease-out_both]">
          <h2 className="home-preview-title max-w-[440px] text-2xl font-semibold leading-tight md:text-3xl">{preview.title}</h2>
          <p className="home-preview-body mt-4 max-w-[470px] text-sm leading-7">{preview.body}</p>
          {activeTask ? (
            <div className="home-preview-next mt-4 rounded-[18px] p-3">
              <p className="home-preview-next-label text-xs font-semibold">下一步可以看</p>
              <p className="home-preview-next-value mt-1 text-sm leading-6">{activeTask.next}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 space-y-2.5">
          {steps.map((step, index) => (
            <div
              key={`${preview.id}-${step}`}
              className="home-preview-step flex items-start gap-3 rounded-[18px] px-4 py-3 motion-safe:animate-[agentReveal_420ms_ease-out_both]"
              style={{ animationDelay: `${120 + index * 80}ms` }}
            >
              <span className="home-preview-step-index mt-0.5 min-w-8 text-xs font-semibold">{String(index + 1).padStart(2, "0")}</span>
              <span className="home-preview-step-text text-sm leading-6">{step}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            ["今日可薅", "免费额度"],
            ["热门场景", "论文 / PPT"],
            ["新测评", "避坑结论"],
            ["国内可用", "优先标注"],
          ].map(([label, value]) => (
            <div key={label} className="home-preview-stat rounded-[18px] px-3 py-3">
              <p className="home-preview-stat-label text-[11px] font-semibold">{label}</p>
              <p className="home-preview-stat-value mt-1 text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onStart}
          className="home-cta mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          找工具
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
