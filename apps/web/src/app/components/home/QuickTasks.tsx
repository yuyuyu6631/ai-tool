"use client";

import Link from "next/link";
import { withPublicPath } from "../../lib/public-path";
import { QUICK_TASKS, type QuickTask } from "./home-data";

interface QuickTasksProps {
  onTaskActivate: (taskId: QuickTask["id"]) => void;
  onTaskClick: (taskId: QuickTask["id"]) => void;
  onTaskPress: (task: QuickTask) => void;
}

export default function QuickTasks({ onTaskActivate, onTaskClick, onTaskPress }: QuickTasksProps) {
  return (
    <div aria-label="快捷任务入口" className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-3 motion-safe:animate-[agentReveal_520ms_ease-out_300ms_both]">
      {QUICK_TASKS.map((task, index) => (
        <Link
          key={task.id}
          href={withPublicPath(task.href)}
          prefetch
          aria-label={task.label}
          onPointerDown={() => onTaskPress(task)}
          onMouseEnter={() => onTaskActivate(task.id)}
          onFocus={() => {
            onTaskActivate(task.id);
            onTaskPress(task);
          }}
          onClick={() => onTaskClick(task.id)}
          className="home-quick-chip inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium backdrop-blur transition duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          style={{ animationDelay: `${360 + index * 45}ms` }}
        >
          <span className="home-quick-dot h-1.5 w-1.5 rounded-full" />
          <span className="dark:hidden">{task.label}</span>
          <span className="hidden dark:inline">{"darkLabel" in task ? task.darkLabel : task.label}</span>
        </Link>
      ))}
    </div>
  );
}
