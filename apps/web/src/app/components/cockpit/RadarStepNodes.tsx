import type { MatchStep } from "./types";

export function RadarStepNodes({ steps }: { steps: MatchStep[] }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/24 p-2 backdrop-blur">
      {steps.map((step, index) => (
        <div key={step.id} className="flex min-w-0 flex-1 items-center gap-1.5">
          <div
            className={`flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1.5 text-[11px] font-medium ${
              step.status === "done"
                ? "border border-lime-300/30 bg-lime-300/12 text-lime-100"
                : step.status === "active"
                  ? "border border-blue-300/40 bg-blue-400/14 text-blue-100 shadow-[0_0_18px_rgba(96,165,250,0.16)]"
                  : "border border-white/10 bg-white/5 text-slate-400"
            }`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${step.status === "pending" ? "bg-slate-500" : step.status === "active" ? "bg-blue-300" : "bg-lime-300"}`} />
            <span className="truncate">{step.label}</span>
          </div>
          {index < steps.length - 1 ? <span className="hidden h-px w-4 bg-white/12 md:block" /> : null}
        </div>
      ))}
    </div>
  );
}
