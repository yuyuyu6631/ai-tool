import type { CockpitState } from "./types";

export function RadarCore({ state, zoom = 1 }: { state: CockpitState; zoom?: number }) {
  const topTool = state.recommendations[0];
  const isMatched = state.phase === "matched";

  return (
    <div className="relative flex h-full min-h-[230px] w-full items-center justify-center" style={{ transform: `scale(${zoom})` }}>
      <svg viewBox="0 0 520 360" className="h-[260px] w-full max-w-[520px] md:h-[300px]" aria-hidden="true">
        <defs>
          <radialGradient id="engineCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8feff" stopOpacity="1" />
            <stop offset="38%" stopColor="#7dd3fc" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
          </radialGradient>
          <filter id="engineGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="engineLine" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#a3e635" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        <g className="origin-center animate-spin [animation-duration:30s]">
          <circle cx="260" cy="178" r="84" fill="none" stroke="rgba(125,211,252,0.28)" strokeWidth="1" />
          <circle cx="260" cy="178" r="122" fill="none" stroke="rgba(125,211,252,0.16)" strokeWidth="1" />
          <ellipse cx="260" cy="178" rx="158" ry="70" fill="none" stroke="rgba(163,230,53,0.22)" strokeWidth="1" />
          <circle cx="388" cy="138" r="4" fill="#a3e635" filter="url(#engineGlow)" />
          <circle cx="130" cy="207" r="3" fill="#60a5fa" filter="url(#engineGlow)" />
        </g>

        <g className="origin-center animate-spin [animation-direction:reverse] [animation-duration:18s]">
          <ellipse cx="260" cy="178" rx="116" ry="48" fill="none" stroke="rgba(125,211,252,0.26)" strokeWidth="1" />
          <ellipse cx="260" cy="178" rx="68" ry="126" fill="none" stroke="rgba(163,230,53,0.14)" strokeWidth="1" />
          <circle cx="260" cy="52" r="3" fill="#f59e0b" filter="url(#engineGlow)" />
        </g>

        <path d="M260 178 C334 112 374 112 420 132" fill="none" stroke="url(#engineLine)" strokeWidth="1.6" strokeDasharray="5 8" />
        <path d="M260 178 C190 122 156 126 104 154" fill="none" stroke="rgba(96,165,250,0.45)" strokeWidth="1.2" strokeDasharray="4 8" />
        <path d="M260 178 C318 232 356 254 410 244" fill="none" stroke="rgba(163,230,53,0.45)" strokeWidth="1.2" strokeDasharray="4 8" />

        <line x1="260" y1="178" x2="424" y2="178" stroke="rgba(163,230,53,0.78)" strokeWidth="1.4" className="origin-center animate-spin [animation-duration:9s]" />
        <circle cx="260" cy="178" r="62" fill="url(#engineCoreGlow)" className="animate-pulse" />
        <circle cx="260" cy="178" r="34" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.42)" strokeWidth="1" />
        <circle cx="260" cy="178" r="7" fill="#f8fafc" filter="url(#engineGlow)" />
      </svg>

      <div className="pointer-events-none absolute grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-slate-950/50 text-center shadow-[0_0_44px_rgba(125,211,252,0.42)] backdrop-blur">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Match</span>
        <span className="text-xl font-semibold text-lime-200">{topTool?.score ?? 0}%</span>
      </div>

      {topTool ? (
        <div className={`absolute right-[8%] top-[25%] rounded-lg border px-3 py-2 text-xs shadow-[0_0_22px_rgba(163,230,53,0.18)] ${isMatched ? "border-lime-300/60 bg-lime-300/12 text-lime-100" : "border-white/10 bg-white/8 text-slate-200"}`}>
          命中：{topTool.name}
        </div>
      ) : null}
    </div>
  );
}
