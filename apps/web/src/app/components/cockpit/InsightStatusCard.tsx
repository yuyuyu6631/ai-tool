import type { CockpitState } from "./types";

const stepMessages: Record<string, string> = {
  intent: "正在识别需求",
  scene: "正在匹配场景",
  filter: "正在筛选工具",
  recommend: "正在生成推荐",
};

export function InsightStatusCard({ state }: { state: CockpitState }) {
  const headline = state.phase === "matched" ? "推荐已生成" : state.phase === "analyzing" ? stepMessages[state.activeStep] || "正在分析需求" : "AI 推荐引擎待命";
  const metric = state.phase === "matched" ? "Top 3 工具命中" : "实时分析链路";

  return (
    <section className="rounded-lg border border-lime-300/20 bg-[#07111f]/82 p-3 text-white shadow-[0_0_26px_rgba(163,230,53,0.10)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-200">AI Match Engine</p>
          <h3 className="mt-1 text-base font-semibold text-white">{headline}</h3>
        </div>
        <span className="rounded border border-lime-300/30 bg-lime-300/10 px-2 py-1 text-xs font-semibold text-lime-100">{state.progress}%</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-300">{metric}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{state.query ? `当前需求：${state.query}` : "自动演示：循环模拟常见 AI 工具选择需求"}</p>
    </section>
  );
}
