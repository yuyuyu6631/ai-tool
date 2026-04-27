import { CockpitBackground } from "./CockpitBackground";
import { InsightStatusCard } from "./InsightStatusCard";
import { MatchProgress } from "./MatchProgress";
import { RadarCore } from "./RadarCore";
import { RadarStepNodes } from "./RadarStepNodes";
import { RecommendationMiniList } from "./RecommendationMiniList";
import type { CockpitState } from "./types";

type AiMatchCockpitProps = {
  state: CockpitState;
  zoom?: number;
};

export function AiMatchCockpit({ state, zoom = 1 }: AiMatchCockpitProps) {
  const activeRecommendationId = state.phase === "matched" ? state.recommendations[0]?.id : undefined;

  return (
    <>
      <CockpitBackground />
      <div className="relative z-10 grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-3 p-3 pt-14 md:p-4 md:pt-16">
        <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(170px,0.7fr)]">
          <InsightStatusCard state={state} />
          <RecommendationMiniList recommendations={state.recommendations} activeId={activeRecommendationId} />
        </div>

        <div className="relative min-h-[210px] overflow-hidden rounded-lg border border-white/8 bg-black/12">
          <RadarCore state={state} zoom={zoom} />
        </div>

        <div className="space-y-3">
          <RadarStepNodes steps={state.steps} />
          <MatchProgress state={state} />
        </div>
      </div>
    </>
  );
}
