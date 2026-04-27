import type { CockpitState, MatchStep, Recommendation } from "./types";

export const DEMO_QUERIES = ["做 PPT 用什么 AI", "生成测试用例用什么 AI", "写论文降重用什么 AI"];

export const STEP_DEFS: Array<Pick<MatchStep, "id" | "label">> = [
  { id: "intent", label: "需求识别" },
  { id: "scene", label: "场景匹配" },
  { id: "filter", label: "工具筛选" },
  { id: "recommend", label: "推荐生成" },
];

export const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
  { id: "gamma", name: "Gamma", score: 92, reason: "适合快速生成 PPT", risk: "中文模板需复核" },
  { id: "wps-ai", name: "WPS AI", score: 87, reason: "适合中文办公场景", risk: "部分能力需会员" },
  { id: "canva-ai", name: "Canva AI", score: 81, reason: "适合设计型演示", risk: "高级素材收费" },
];

const CODING_RECOMMENDATIONS: Recommendation[] = [
  { id: "github-copilot", name: "GitHub Copilot", score: 91, reason: "适合代码补全和测试", risk: "复杂架构需人工判断" },
  { id: "cursor", name: "Cursor", score: 88, reason: "适合项目级编码", risk: "大仓库上下文成本高" },
  { id: "chatgpt", name: "ChatGPT", score: 84, reason: "适合解释和调试", risk: "结果需本地验证" },
];

const WRITING_RECOMMENDATIONS: Recommendation[] = [
  { id: "kimi", name: "Kimi", score: 90, reason: "适合长文阅读总结", risk: "改写风格需人工把关" },
  { id: "chatgpt", name: "ChatGPT", score: 86, reason: "适合论文润色与提纲", risk: "引用需自行核验" },
  { id: "wps-ai", name: "WPS AI", score: 82, reason: "适合文档内改写", risk: "高级功能需会员" },
];

export function buildSteps(activeStep: string, phase: CockpitState["phase"]): MatchStep[] {
  const activeIndex = STEP_DEFS.findIndex((step) => step.id === activeStep);
  return STEP_DEFS.map((step, index) => ({
    ...step,
    status: phase === "matched" || index < activeIndex ? "done" : index === activeIndex ? "active" : "pending",
  }));
}

export function mockAnalyzeQuery(query: string): Recommendation[] {
  const normalized = query.toLowerCase();
  if (/代码|开发|测试|debug|接口|前端|后端|code|test/.test(normalized)) return CODING_RECOMMENDATIONS;
  if (/论文|写作|润色|降重|文档|总结|paper|write/.test(normalized)) return WRITING_RECOMMENDATIONS;
  return DEFAULT_RECOMMENDATIONS;
}

export function createInitialState(query = ""): CockpitState {
  const recommendations = mockAnalyzeQuery(query || DEMO_QUERIES[0]);
  return {
    phase: query ? "matched" : "idle",
    progress: query ? 100 : 0,
    activeStep: query ? "recommend" : "intent",
    steps: buildSteps(query ? "recommend" : "intent", query ? "matched" : "idle"),
    recommendations,
    query,
  };
}
