"use client";

import type { RefObject } from "react";
import { ArrowRight } from "lucide-react";
import HeroParticleScene from "./HeroParticleScene";
import QuickTasks from "./QuickTasks";
import RecentToolsStrip from "./RecentToolsStrip";
import SearchSection from "./SearchSection";
import TaskEntryCards from "./TaskEntryCards";
import { type QuickTask } from "./home-data";

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  query: string;
  inputRef: RefObject<HTMLInputElement | null>;
  active?: boolean;
  activeQuickTaskId: QuickTask["id"] | null;
  onQueryChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  onQuickTaskActivate: (taskId: QuickTask["id"]) => void;
  onQuickTaskClick: (taskId: QuickTask["id"]) => void;
  onQuickTaskPress?: (task: QuickTask) => void;
  onRadarStart?: () => void;
}

export default function HeroSection({
  title = "按任务找到合适的 AI 工具",
  subtitle,
  query,
  inputRef,
  activeQuickTaskId,
  onQueryChange,
  onSearchSubmit,
  onQuickTaskActivate,
  onQuickTaskClick,
  onQuickTaskPress = () => undefined,
}: HeroSectionProps) {
  void activeQuickTaskId;

  return (
    <section className="home-light-shell relative -mt-[68px] min-h-[calc(100svh-24px)] overflow-hidden pt-[68px]">
      <HeroParticleScene />
      <div className="home-hero-spotlight pointer-events-none absolute inset-x-0 top-[180px] mx-auto h-56 max-w-4xl" aria-hidden="true" />
      <div className="home-hero-fade pointer-events-none absolute inset-x-0 bottom-0 h-28" aria-hidden="true" />

      <div className="relative mx-auto flex w-full max-w-[1180px] flex-col items-center px-4 pb-10 pt-10 text-center sm:px-6 md:pt-14 lg:min-h-[calc(100svh-92px)] lg:justify-center lg:px-8">
        <p className="home-kicker inline-flex rounded-full px-3 py-1 text-xs font-semibold motion-safe:animate-[agentReveal_380ms_ease-out_40ms_both]">
          给互联网团队的 AI 工具使用经验社区
        </p>
        <h1 className="home-title mt-5 max-w-4xl text-[clamp(2.35rem,5vw,4.8rem)] font-semibold leading-[1.08] tracking-normal text-balance motion-safe:animate-[agentReveal_420ms_ease-out_60ms_both]">
          {title}
        </h1>

        {subtitle ? (
          <p className="home-subtitle mt-4 max-w-3xl text-base leading-8 motion-safe:animate-[agentReveal_460ms_ease-out_120ms_both] md:text-lg">
            {subtitle}
          </p>
        ) : null}

        <SearchSection
          query={query}
          inputRef={inputRef}
          onQueryChange={onQueryChange}
          onSubmit={onSearchSubmit}
          placeholder="比如：做销售周报 PPT / 分析投放数据 / 修复前端报错"
        />

        <div className="home-gold-line mt-3 hidden dark:block" aria-hidden="true" />

        <div className="home-flow mx-auto mt-6 flex flex-wrap items-center justify-center gap-3 text-sm motion-safe:animate-[agentReveal_520ms_ease-out_240ms_both]">
          <span className="home-flow-step">
            <span>1</span>
            <b>描述任务</b>
          </span>
          <ArrowRight className="home-flow-arrow h-4 w-4" />
          <span className="home-flow-step">
            <span>2</span>
            <b>看经验与工具</b>
          </span>
          <ArrowRight className="home-flow-arrow h-4 w-4" />
          <span className="home-flow-step">
            <span>3</span>
            <b>领福利或收藏</b>
          </span>
        </div>

        <QuickTasks onTaskActivate={onQuickTaskActivate} onTaskClick={onQuickTaskClick} onTaskPress={onQuickTaskPress} />
        <TaskEntryCards />
        <RecentToolsStrip />
      </div>
    </section>
  );
}
