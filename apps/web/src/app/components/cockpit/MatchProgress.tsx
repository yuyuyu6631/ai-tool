import type { CockpitState } from "./types";

export function MatchProgress({ state }: { state: CockpitState }) {
  const label = state.phase === "idle" ? "自动演示推荐链路" : state.phase === "analyzing" ? "正在运行匹配流程" : "推荐结果已生成";

  return (
    <div className="rounded-lg border border-white/10 bg-black/24 p-3 text-xs text-slate-300 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="font-semibold text-lime-200">{state.progress}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-400 via-lime-300 to-amber-300 transition-all duration-500" style={{ width: `${Math.max(4, Math.min(100, state.progress))}%` }} />
      </div>
    </div>
  );
}
