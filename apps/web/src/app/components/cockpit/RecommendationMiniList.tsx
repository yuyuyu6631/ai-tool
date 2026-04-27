import type { Recommendation } from "./types";

export function RecommendationMiniList({ recommendations, activeId }: { recommendations: Recommendation[]; activeId?: string }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#07111f]/78 p-3 text-white shadow-[0_0_26px_rgba(37,99,235,0.12)] backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Top 3 推荐</h3>
        <span className="rounded bg-lime-300/12 px-2 py-1 text-[11px] font-semibold text-lime-200">实时命中</span>
      </div>
      <div className="mt-3 space-y-2">
        {recommendations.slice(0, 3).map((item, index) => {
          const active = item.id === activeId || index === 0;
          return (
            <div key={item.id} className={`rounded-lg border p-2 transition ${active ? "border-lime-300/50 bg-lime-300/12 shadow-[0_0_20px_rgba(163,230,53,0.16)]" : "border-white/10 bg-white/6"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{index + 1}. {item.name}</p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-slate-300">{item.reason}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-lime-200">{item.score}%</span>
              </div>
              {item.risk ? <p className="mt-1 line-clamp-1 text-[11px] text-amber-200/80">风险：{item.risk}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
