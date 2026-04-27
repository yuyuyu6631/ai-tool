export type MatchPhase = "idle" | "analyzing" | "matched";

export type StepStatus = "pending" | "active" | "done";

export type MatchStep = {
  id: string;
  label: string;
  status: StepStatus;
};

export type Recommendation = {
  id: string;
  name: string;
  score: number;
  reason: string;
  risk?: string;
};

export type CockpitState = {
  phase: MatchPhase;
  progress: number;
  activeStep: string;
  steps: MatchStep[];
  recommendations: Recommendation[];
  query: string;
};

export type InsightState = {
  title: string;
  metric: string;
  description: string[];
  progress: number;
};
