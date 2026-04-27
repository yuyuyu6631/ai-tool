"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AiMatchCockpit } from "./cockpit/AiMatchCockpit";
import { CockpitControls } from "./cockpit/CockpitControls";
import { DEMO_QUERIES, buildSteps, createInitialState, mockAnalyzeQuery } from "./cockpit/data";
import type { CockpitState, MatchPhase } from "./cockpit/types";

type HeroToolRadarProps = {
  query?: string;
  phase?: MatchPhase;
  progress?: number;
};

const ANALYSIS_SEQUENCE = [
  { step: "intent", progress: 18, delay: 520 },
  { step: "scene", progress: 46, delay: 620 },
  { step: "filter", progress: 74, delay: 680 },
  { step: "recommend", progress: 100, delay: 620 },
];

function buildAnalyzingState(query: string, activeStep: string, progress: number): CockpitState {
  return {
    phase: "analyzing",
    progress,
    activeStep,
    steps: buildSteps(activeStep, "analyzing"),
    recommendations: mockAnalyzeQuery(query),
    query,
  };
}

function buildMatchedState(query: string): CockpitState {
  return {
    phase: "matched",
    progress: 100,
    activeStep: "recommend",
    steps: buildSteps("recommend", "matched"),
    recommendations: mockAnalyzeQuery(query),
    query,
  };
}

export default function HeroToolRadar({ query = "", phase = "idle", progress }: HeroToolRadarProps) {
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [state, setState] = useState<CockpitState>(() => createInitialState(query));
  const previousQueryRef = useRef(query);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [expanded]);

  useEffect(() => {
    const targetQuery = query.trim();
    if (!targetQuery) return;
    if (previousQueryRef.current === targetQuery && state.query === targetQuery && state.phase === "matched") return;
    previousQueryRef.current = targetQuery;

    const timers: number[] = [];
    let elapsed = 0;
    setState(buildAnalyzingState(targetQuery, "intent", progress ?? 8));
    ANALYSIS_SEQUENCE.forEach((item) => {
      elapsed += item.delay;
      timers.push(
        window.setTimeout(() => {
          setState(buildAnalyzingState(targetQuery, item.step, item.progress));
        }, elapsed),
      );
    });
    timers.push(window.setTimeout(() => setState(buildMatchedState(targetQuery)), elapsed + 360));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [progress, query, state.phase, state.query]);

  useEffect(() => {
    if (query.trim()) return;
    const timers: number[] = [];
    const demoQuery = DEMO_QUERIES[demoIndex % DEMO_QUERIES.length];
    let elapsed = 0;

    setState(buildAnalyzingState(demoQuery, "intent", 12));
    ANALYSIS_SEQUENCE.forEach((item) => {
      elapsed += item.delay;
      timers.push(window.setTimeout(() => setState(buildAnalyzingState(demoQuery, item.step, item.progress)), elapsed));
    });
    timers.push(window.setTimeout(() => setState(buildMatchedState(demoQuery)), elapsed + 480));
    timers.push(window.setTimeout(() => setDemoIndex((value) => value + 1), 7600));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [demoIndex, query]);

  const displayedState = useMemo(() => {
    if (phase === "matched" && query.trim() && state.phase !== "analyzing") return buildMatchedState(query.trim());
    return state;
  }, [phase, query, state]);

  return (
    <div
      data-testid="hero-tool-radar"
      data-expanded={expanded ? "true" : "false"}
      className={`overflow-hidden rounded-lg border border-white/10 bg-[#05070f] transition-all ${
        expanded
          ? "fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] top-[max(0.75rem,env(safe-area-inset-top))] z-50 h-[calc(100dvh-1.5rem)] overscroll-contain shadow-[0_40px_120px_rgba(0,0,0,0.5)] md:inset-x-6 md:bottom-[max(1.5rem,env(safe-area-inset-bottom))] md:top-[max(1.5rem,env(safe-area-inset-top))] md:h-[calc(100dvh-3rem)]"
          : "relative h-full min-h-[440px] lg:min-h-[460px]"
      }`}
    >
      <AiMatchCockpit state={displayedState} zoom={zoom} />
      <CockpitControls
        expanded={expanded}
        onZoomIn={() => setZoom((value) => Math.min(1.25, value + 0.06))}
        onZoomOut={() => setZoom((value) => Math.max(0.92, value - 0.06))}
        onExpand={() => setExpanded(true)}
        onClose={() => setExpanded(false)}
      />
    </div>
  );
}
