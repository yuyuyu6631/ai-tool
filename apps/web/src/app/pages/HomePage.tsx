"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { BadgePercent, CheckCircle2, FileText, Flame, GitBranch, Image as ImageIcon, Radar, RotateCcw, Search, Sparkles, X } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CatalogScrollRestorer from "../components/CatalogScrollRestorer";
import ToolCard from "../components/ToolCard";
import type { AiPanel, AiSearchMeta, ScenarioSummary, ToolSummary, ToolsDirectoryResponse } from "../lib/catalog-types";
import {
  buildDecisionBadges,
  buildToolsHref,
  derivePriceFacets,
  filterDisplayableFacets,
  repairDisplayText,
} from "../lib/catalog-utils";
import { rememberCatalogNavigation } from "../lib/catalog-navigation";
import { detectPriceLabel } from "../lib/tool-display";
import { trackEvent } from "../lib/analytics";

const DEFAULT_TAB = "recommended";
const SEARCH_EXAMPLES = ["写论文排版", "做答辩 PPT", "分析 Excel 数据", "生成测试用例"];
const SEARCH_EXAMPLE_ICONS = ["✎", "▣", "▦", "</>"];
const HERO_FLOW_STEPS = ["需求识别", "意图解析", "工具筛选", "效果预估", "生成推荐"];
const SCENARIO_PROMOS = [
  {
    title: "做 PPT 用什么 AI",
    description: "先生成完整演示稿，再人工统一模板与表达节奏。",
    query: "做答辩 PPT",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=720&q=80",
  },
  {
    title: "写论文排版",
    description: "按学校格式检查标题、目录、页眉页脚和参考文献。",
    query: "写论文排版",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=720&q=80",
  },
  {
    title: "分析 Excel 数据",
    description: "先识别字段含义，再给公式、图表和核验路径。",
    query: "分析 Excel 数据",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=720&q=80",
  },
];

const OPERATED_RANKING = [
  { key: "chatgpt", name: "ChatGPT", category: "通用 AI 助手" },
  { key: "claude", name: "Claude", category: "长文本与写作" },
  { key: "deepseek", name: "DeepSeek", category: "中文推理与代码" },
  { key: "kimi", name: "Kimi", category: "长文档阅读" },
  { key: "gamma", name: "Gamma", category: "AI PPT 制作" },
];

interface HomePageProps {
  directory: ToolsDirectoryResponse;
  hotTools: ToolSummary[];
  latestTools: ToolSummary[];
  scenarios: ScenarioSummary[];
  state: {
    mode?: string;
    q?: string;
    category?: string;
    tag?: string;
    price?: string;
    access?: string;
    priceRange?: string;
    sort?: string;
    view?: string;
    tab?: string;
    page?: string;
    source?: string;
  };
  aiPanel?: AiPanel | null;
  aiMeta?: AiSearchMeta | null;
}

function dedupeTools(items: ToolSummary[]) {
  const seen = new Set<string>();
  return items.filter((tool) => {
    const key = tool.slug.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortTools(items: ToolSummary[]) {
  return [...items].sort((left, right) => {
    if (Number(right.featured) !== Number(left.featured)) return Number(right.featured) - Number(left.featured);
    if ((right.reviewCount ?? 0) !== (left.reviewCount ?? 0)) return (right.reviewCount ?? 0) - (left.reviewCount ?? 0);
    if ((right.score ?? 0) !== (left.score ?? 0)) return (right.score ?? 0) - (left.score ?? 0);
    return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
  });
}

function getDealText(tool: ToolSummary) {
  return repairDisplayText(tool.dealSummary || tool.freeAllowanceText || "", "");
}

function findToolByRankingKey(items: ToolSummary[], key: string) {
  const normalizedKey = key.toLowerCase();
  return items.find((tool) => {
    const slug = tool.slug.toLowerCase();
    const name = repairDisplayText(tool.name, "").toLowerCase();
    return slug === normalizedKey || name === normalizedKey || slug.includes(normalizedKey) || name.includes(normalizedKey);
  });
}

function resolveActiveTab(state: HomePageProps["state"]) {
  if (state.tab) return state.tab;
  if (state.price === "free") return "free";
  if (state.view === "latest") return "latest";
  if (state.view === "hot") return "hot";
  return DEFAULT_TAB;
}

function buildWorkflowRecommendation(query: string) {
  const normalized = query.trim().toLowerCase();
  const displayQuery = query.trim() || "我要把 Word 文档调整成学校论文格式";
  const isDeckRequest = /ppt|答辩|演示|幻灯/.test(normalized);
  const isDataRequest = /excel|数据|表格|分析/.test(normalized);
  const isTestRequest = /测试|用例|代码|qa/.test(normalized);

  if (isDeckRequest) {
    return {
      title: "答辩 PPT 使用流程推荐",
      subtitle: "根据搜索结果推荐的工具组合，适合快速搭建答辩结构、补齐讲稿和统一视觉风格",
      flow: ["需求识别", "内容提炼", "工具组合", "风险核验", "成稿流程"],
      steps: [
        { title: "识别需求", body: `用户输入：${displayQuery}` },
        { title: "提炼内容", body: "先用 Kimi 或 ChatGPT 从论文中提炼摘要、研究方法、实验结果和结论页要点" },
        { title: "组合工具", body: "用 Gamma 生成页面初稿，再用 Canva AI 或学校模板统一视觉和版式" },
        { title: "核验风险", body: "自动生成的图表和结论可能过度概括，答辩数据必须回到原论文核对" },
        { title: "完成流程", body: "建议流程：提炼论文结构 -> 生成页面草稿 -> 套用学校模板 -> 人工校准讲稿和数据" },
      ],
    };
  }

  if (isDataRequest) {
    return {
      title: "Excel 数据分析使用流程推荐",
      subtitle: "根据搜索结果推荐的工具组合，适合清洗表格、定位异常、生成分析口径和图表建议",
      flow: ["需求识别", "字段理解", "工具组合", "口径核验", "分析输出"],
      steps: [
        { title: "识别需求", body: `用户输入：${displayQuery}` },
        { title: "理解字段", body: "先让 ChatGPT 或 Kimi 解释字段含义、缺失值、统计口径和可能的异常点" },
        { title: "组合工具", body: "用 WPS AI 辅助表格处理，用 Copilot 或 ChatGPT 生成公式和图表建议" },
        { title: "核验风险", body: "AI 可能误解字段口径，涉及财务或业务指标时必须保留原始表格" },
        { title: "完成流程", body: "建议流程：样例数据解释 -> 公式和图表建议 -> Excel 复算 -> 人工确认分析口径" },
      ],
    };
  }

  if (isTestRequest) {
    return {
      title: "测试用例生成使用流程推荐",
      subtitle: "根据搜索结果推荐的工具组合，适合从需求描述、接口文档或代码片段拆出覆盖点",
      flow: ["需求识别", "覆盖拆分", "工具组合", "断言复核", "用例落地"],
      steps: [
        { title: "识别需求", body: `用户输入：${displayQuery}` },
        { title: "拆分覆盖", body: "先让 ChatGPT 或 Claude 拆出正常路径、异常输入、边界值、权限状态和回归风险" },
        { title: "组合工具", body: "用 Cursor 辅助落地测试代码，用通义灵码补齐本地工程上下文" },
        { title: "复核风险", body: "AI 生成的断言可能不符合真实业务规则，需要产品或测试人员复审" },
        { title: "完成流程", body: "建议流程：测试点矩阵 -> 高风险路径筛选 -> 自动化脚本 -> 人工验收项补充" },
      ],
    };
  }

  return {
    title: "Docx 文档处理使用流程推荐",
    subtitle: "根据搜索结果推荐的工具组合，适合论文排版、格式检查、文档润色、批量修改等具体使用场景",
    flow: ["需求识别", "场景确认", "工具组合", "风险核验", "处理流程"],
    steps: [
      { title: "识别需求", body: `用户输入：${displayQuery}` },
      { title: "确认场景", body: "先确认学校模板、论文格式规范、目录要求、图表编号和参考文献样式" },
      { title: "组合工具", body: "用 Kimi 或 ChatGPT 梳理格式问题，再用 WPS AI 或 Word 样式执行排版处理" },
      { title: "核验风险", body: "AI 可能改动原文内容，格式修复前建议备份原文件，并保留修订记录" },
      { title: "完成流程", body: "建议流程：检查格式问题 -> 统一标题和正文样式 -> 生成目录 -> 人工核对目录与图表编号" },
    ],
  };
}

function HeroParticleScene({ query, active }: { query?: string; active?: boolean }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(active);
  const queryRef = useRef(query);

  useEffect(() => {
    activeRef.current = active;
    queryRef.current = query;
  }, [active, query]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || window.navigator.userAgent.includes("jsdom")) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
    camera.position.set(0, 0.8, 11);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const particleCount = 760;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const colorBlue = new THREE.Color("#38bdf8");
    const colorGold = new THREE.Color("#f6c768");
    const colorWhite = new THREE.Color("#dbeafe");

    for (let index = 0; index < particleCount; index += 1) {
      const radius = 2.5 + Math.random() * 8.5;
      const angle = Math.random() * Math.PI * 2;
      const band = (Math.random() - 0.5) * 3.2;
      particlePositions[index * 3] = Math.cos(angle) * radius;
      particlePositions[index * 3 + 1] = band + Math.sin(angle * 2.2) * 0.6;
      particlePositions[index * 3 + 2] = Math.sin(angle) * radius - Math.random() * 2;

      const mixed = Math.random() > 0.86 ? colorGold : Math.random() > 0.42 ? colorBlue : colorWhite;
      particleColors[index * 3] = mixed.r;
      particleColors[index * 3 + 1] = mixed.g;
      particleColors[index * 3 + 2] = mixed.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    const ringGroup = new THREE.Group();
    group.add(ringGroup);
    const nodeGeometry = new THREE.IcosahedronGeometry(0.08, 1);
    const blueNodeMaterial = new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.92 });
    const goldNodeMaterial = new THREE.MeshBasicMaterial({ color: "#f6c768", transparent: true, opacity: 0.88 });
    const nodePositions: THREE.Vector3[] = [];

    for (let index = 0; index < 16; index += 1) {
      const angle = (index / 16) * Math.PI * 2;
      const radius = 4.6 + (index % 4) * 0.38;
      const position = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(index * 1.7) * 0.8, Math.sin(angle) * radius * 0.42);
      nodePositions.push(position);
      const node = new THREE.Mesh(nodeGeometry, index % 5 === 0 ? goldNodeMaterial : blueNodeMaterial);
      node.position.copy(position);
      ringGroup.add(node);
    }

    const linePositions: number[] = [];
    for (let index = 0; index < nodePositions.length; index += 1) {
      const current = nodePositions[index];
      const next = nodePositions[(index + 1) % nodePositions.length];
      linePositions.push(current.x, current.y, current.z, next.x, next.y, next.z);
      if (index % 3 === 0) {
        const far = nodePositions[(index + 5) % nodePositions.length];
        linePositions.push(current.x, current.y, current.z, far.x, far.y, far.z);
      }
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending }),
    );
    ringGroup.add(lines);

    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(4.85, 0.006, 8, 160),
      new THREE.MeshBasicMaterial({ color: "#f6c768", transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending }),
    );
    orbit.rotation.x = Math.PI / 2.5;
    ringGroup.add(orbit);

    const beamGeometry = new THREE.BufferGeometry();
    beamGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-5.4, -1.2, 0.6, -2.8, -0.3, 0.2, -0.6, -0.2, 0, 1.8, 0.55, -0.3, 5.3, 1.1, -0.7], 3),
    );
    const beam = new THREE.Line(
      beamGeometry,
      new THREE.LineBasicMaterial({ color: "#f6c768", transparent: true, opacity: activeRef.current ? 0.78 : 0.38, blending: THREE.AdditiveBlending }),
    );
    scene.add(beam);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      camera.aspect = Math.max(rect.width, 1) / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height, false);
    };

    let frame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const isEngaged = activeRef.current || Boolean(queryRef.current);
      const energy = isEngaged ? 1.65 : 1;
      group.rotation.y = elapsed * 0.035 * energy;
      group.rotation.x = Math.sin(elapsed * 0.18) * 0.04;
      ringGroup.rotation.z = elapsed * 0.045 * energy;
      beam.material.opacity = isEngaged ? 0.58 + Math.sin(elapsed * 3) * 0.18 : 0.32 + Math.sin(elapsed * 1.6) * 0.08;
      renderer.render(scene, camera);
      if (!reducedMotion) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    resize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(host);
    if (!observer) window.addEventListener("resize", resize);
    animate();

    return () => {
      observer?.disconnect();
      if (!observer) window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frame);
      particleGeometry.dispose();
      particleMaterial.dispose();
      nodeGeometry.dispose();
      blueNodeMaterial.dispose();
      goldNodeMaterial.dispose();
      lineGeometry.dispose();
      beamGeometry.dispose();
      orbit.geometry.dispose();
      (orbit.material as THREE.Material).dispose();
      (lines.material as THREE.Material).dispose();
      (beam.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-testid="hero-particle-scene"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-95 [mask-image:linear-gradient(180deg,black_0%,black_78%,transparent_100%)]"
    />
  );
}

function ParticleFlowLine() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.navigator.userAgent.includes("jsdom")) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let frameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const particles = Array.from({ length: 36 }, (_, index) => ({
      seed: index * 37,
      speed: 0.0015 + (index % 5) * 0.00035,
      y: 0.26 + ((index * 19) % 46) / 100,
      size: 0.7 + (index % 4) * 0.45,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const centerY = height * 0.5;

      const line = context.createLinearGradient(0, 0, width, 0);
      line.addColorStop(0, "rgba(52, 211, 153, 0)");
      line.addColorStop(0.18, "rgba(52, 211, 153, 0.28)");
      line.addColorStop(0.5, "rgba(191, 219, 254, 0.66)");
      line.addColorStop(0.82, "rgba(52, 211, 153, 0.28)");
      line.addColorStop(1, "rgba(52, 211, 153, 0)");
      context.strokeStyle = line;
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(width * 0.04, centerY);
      context.lineTo(width * 0.96, centerY);
      context.stroke();

      particles.forEach((particle) => {
        const progress = (time * particle.speed + particle.seed / 997) % 1;
        const x = width * (0.05 + progress * 0.9);
        const wave = Math.sin(progress * Math.PI * 2 + particle.seed) * height * 0.14;
        const y = height * particle.y + wave;
        const glow = context.createRadialGradient(x, y, 0, x, y, particle.size * 7);
        glow.addColorStop(0, "rgba(190, 242, 100, 0.78)");
        glow.addColorStop(0.45, "rgba(56, 189, 248, 0.22)");
        glow.addColorStop(1, "rgba(56, 189, 248, 0)");
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, particle.size * 7, 0, Math.PI * 2);
        context.fill();
      });

      frameId = window.requestAnimationFrame(draw);
    };

    resize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    if (!observer) window.addEventListener("resize", resize);
    frameId = window.requestAnimationFrame(draw);

    return () => {
      observer?.disconnect();
      if (!observer) window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}

function SearchRecommendationFlow({ workflow, hasSemanticResult }: { workflow: ReturnType<typeof buildWorkflowRecommendation>; hasSemanticResult: boolean }) {
  return (
    <section data-testid="search-recommendation-flow" className="relative mt-3 max-w-[720px] overflow-hidden rounded-lg border border-sky-300/20 bg-[#06131f]/58 px-4 py-3 shadow-[0_18px_60px_rgba(14,165,233,0.16)] backdrop-blur-xl">
      <ParticleFlowLine />
      <div className="relative mb-2 flex items-center gap-2 text-xs font-semibold text-sky-100">
        <span>AI 解析进度</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#f6c768] shadow-[0_0_18px_rgba(246,199,104,0.9)]" />
        <span className="text-[#f6c768]">{hasSemanticResult ? "已生成推荐路径" : "智能分析中"}</span>
      </div>
      <div className="relative flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {HERO_FLOW_STEPS.map((label, index) => (
          <div key={label} className="flex min-w-[96px] flex-1 flex-col items-center gap-1.5 text-center">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-sky-200/40 bg-[#06131f] text-sm font-semibold text-sky-50 shadow-[0_0_24px_rgba(56,189,248,0.28)]">
              {index + 1}
            </span>
            <span className="text-[11px] font-semibold text-slate-200">{label}</span>
          </div>
        ))}
      </div>
      <p className="relative mt-2 text-xs leading-5 text-slate-300">
        {hasSemanticResult ? `已根据“${workflow.steps[0].body.replace("用户输入：", "")}”生成一条可执行的工具使用路径。` : "输入需求后，这里会预览从需求到工具组合再到风险核验的推荐路径。"}
      </p>
    </section>
  );
}

function WorkflowRecommendationCard({ query, hasSemanticResult }: { query: string; hasSemanticResult: boolean }) {
  const workflow = buildWorkflowRecommendation(query);

  return (
    <section className="relative overflow-hidden rounded-lg border border-sky-200/22 bg-[#071320]/66 p-4 shadow-[0_24px_90px_rgba(2,132,199,0.22)] backdrop-blur-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f6c768]/80 to-transparent" />
      <div className="absolute -right-20 -top-24 h-48 w-48 rounded-full bg-sky-400/16 blur-3xl" />
      <div className="absolute -bottom-28 left-8 h-44 w-44 rounded-full bg-[#f6c768]/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-xs font-semibold text-sky-100">
              <GitBranch className="h-3.5 w-3.5" />
              {hasSemanticResult ? "搜索结果推荐的使用流程" : "搜索后生成使用流程推荐"}
            </p>
            <h2 className="mt-3 text-xl font-semibold leading-tight text-white">{workflow.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{workflow.subtitle}</p>
          </div>
          <div className="hidden rounded-lg border border-white/10 bg-white/6 p-3 text-[#f6c768] sm:block">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {workflow.steps.map((step, index) => (
            <div key={step.title} className="grid grid-cols-[30px_minmax(0,1fr)] gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded border border-sky-300/25 bg-sky-300/10 text-sm font-semibold text-sky-100">{index + 1}</span>
              <div>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-300">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 flex items-center gap-2 text-xs text-slate-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-sky-200" />
          搜索结果会同时给出适合原因、使用风险和替代工具。
        </p>
      </div>
    </section>
  );
}

export default function HomePage({ directory, hotTools, latestTools, state }: HomePageProps) {
  const router = useRouter();
  const [query, setQuery] = useState(state.q || "");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  const cleanedCategories = useMemo(() => filterDisplayableFacets(directory.categories), [directory.categories]);
  const priceFacets = useMemo(() => directory.priceFacets ?? derivePriceFacets(directory.items), [directory.items, directory.priceFacets]);
  const activeTab = resolveActiveTab(state);
  const current = { ...state };
  const currentRoute = buildToolsHref(current, {});

  useEffect(() => setQuery(state.q || ""), [state.q]);
  useEffect(() => setPendingLabel(null), [currentRoute]);

  const freePriceSlug = priceFacets.find((item) => item.slug === "free")?.slug || "free";
  const recommendedTools = useMemo(() => sortTools(dedupeTools([...directory.items, ...hotTools, ...latestTools])), [directory.items, hotTools, latestTools]);
  const displayedTools = directory.items.length > 0 ? directory.items : recommendedTools;
  const rankingTools = useMemo(() => sortTools(dedupeTools([...hotTools, ...directory.items, ...latestTools])), [directory.items, hotTools, latestTools]);
  const dealTools = displayedTools.filter((tool) => getDealText(tool) || detectPriceLabel(tool) === "free").slice(0, 4);
  const operatedRankingTools = useMemo(
    () =>
      OPERATED_RANKING.map((item) => {
        const tool = findToolByRankingKey(rankingTools, item.key);
        return {
          key: item.key,
          name: tool ? repairDisplayText(tool.name) : item.name,
          category: tool ? repairDisplayText(tool.category) : item.category,
          href: tool ? `/tools/${tool.slug}` : buildToolsHref({}, { mode: "ai", q: item.name, page: 1 }),
          hasTool: Boolean(tool),
        };
      }),
    [rankingTools],
  );

  const viewTabs = [
    { id: "recommended", label: "推荐", href: buildToolsHref(current, { mode: null, tab: "recommended", view: null, price: null, page: 1 }) },
    { id: "hot", label: "热门", href: buildToolsHref(current, { mode: null, tab: "hot", view: "hot", price: null, page: 1 }) },
    { id: "latest", label: "最新", href: buildToolsHref(current, { mode: null, tab: "latest", view: "latest", price: null, page: 1 }) },
    { id: "free", label: "免费额度", href: buildToolsHref(current, { mode: null, tab: "free", view: null, price: freePriceSlug, page: 1 }) },
  ];

  const selectedCategory = cleanedCategories.find((item) => item.slug === state.category);
  const selectedPrice = priceFacets.find((item) => item.slug === state.price);
  const activeFilters = [
    state.q ? { label: `搜索：${state.q}`, href: buildToolsHref(current, { mode: null, q: null, page: 1 }) } : null,
    selectedCategory ? { label: `分类：${repairDisplayText(selectedCategory.label)}`, href: buildToolsHref(current, { category: null, page: 1 }) } : null,
    selectedPrice ? { label: `价格：${repairDisplayText(selectedPrice.label)}`, href: buildToolsHref(current, { price: null, page: 1 }) } : null,
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  const submitSearch = (value: string) => {
    const trimmed = value.trim();
    const href = buildToolsHref(current, { mode: trimmed ? "ai" : null, q: trimmed || null, page: 1, tab: null, view: null });
    trackEvent("home_semantic_search", { has_query: Boolean(trimmed), query_length: trimmed.length });
    setPendingLabel(trimmed ? `正在理解你的需求：${trimmed}` : "正在刷新工具结果");
    router.push(href);
  };

  const resultSummary =
    directory.items.length > 0
      ? state.mode === "ai" && state.q
        ? `语义搜索：${state.q} · ${directory.items.length} 个候选`
        : `当前展示 ${directory.items.length} 个工具`
      : displayedTools.length > 0
        ? "当前筛选暂无命中，先展示真实库中的推荐工具"
        : "当前没有可展示的工具";

  const hasSemanticResult = Boolean(state.mode === "ai" && state.q);
  const workflow = buildWorkflowRecommendation(state.q || query);

  return (
    <div className="page-shell">
      <CatalogScrollRestorer />
      <Header currentPath="/" currentRoute={currentRoute} />

      <main aria-busy={pendingLabel ? "true" : "false"} className="pb-16">
        <section className="relative -mt-[68px] overflow-hidden bg-[#030812] pt-[68px] text-white">
          <HeroParticleScene query={state.q || query} active={Boolean(pendingLabel || hasSemanticResult)} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(14,165,233,0.24),transparent_28%),radial-gradient(circle_at_76%_42%,rgba(246,199,104,0.14),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.36)_0%,rgba(3,8,18,0.82)_72%,#030812_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#f7f8fb]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#f6c768]/45 to-transparent" />
          <div className="relative mx-auto grid w-full min-w-0 max-w-[1440px] gap-6 px-4 py-6 sm:px-6 md:py-7 lg:min-h-[520px] lg:grid-cols-[minmax(0,64%)_minmax(330px,36%)] lg:px-8">
            <div className="flex min-h-[440px] min-w-0 flex-col justify-center py-2 lg:min-h-[468px]">
              <div className="inline-flex w-fit items-center gap-2 rounded border border-sky-300/25 bg-sky-300/10 px-3 py-1.5 text-xs font-semibold text-sky-100 shadow-[0_0_30px_rgba(14,165,233,0.18)]">
                <Radar className="h-3.5 w-3.5" />
                第三方 AI 工具测评入口
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-50 [text-shadow:0_0_32px_rgba(56,189,248,0.18)] md:text-5xl lg:text-6xl">3 秒找到能用的 AI 工具</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-sky-50/72">
                描述真实需求，星点评直接给出工具组合、适合原因、风险提醒和可执行使用流程。
              </p>

              <form
                data-testid="compact-hero-search"
                className="mt-5 w-full min-w-0 max-w-full rounded-lg border border-sky-200/35 bg-[#071320]/72 p-1.5 shadow-[0_0_0_1px_rgba(56,189,248,0.08),0_0_42px_rgba(14,165,233,0.28),24px_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:max-w-[460px] lg:max-w-[520px]"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch(query);
                }}
              >
                <div className="flex min-w-0 flex-col gap-2 md:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-100/70" />
                    <input
                      id="tools-search"
                      type="search"
                      name="q"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="例如：我要把 Word 文档自动排版成论文格式"
                      data-global-search-target="tools"
                      className="min-h-10 w-full rounded-md border border-white/10 bg-white/8 py-2 pl-10 pr-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-400 focus:border-[#f6c768]/70"
                    />
                  </div>
                  <button type="submit" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,#38bdf8_0%,#f6c768_100%)] px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_26px_rgba(246,199,104,0.32)] transition hover:brightness-110">
                    <Sparkles className="h-4 w-4" />
                    智能匹配
                  </button>
                </div>
              </form>

              <div aria-label="搜索示例" className="mt-3 flex flex-wrap gap-2">
                {SEARCH_EXAMPLES.map((example, index) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setQuery(example);
                      submitSearch(example);
                    }}
                    className="inline-flex items-center gap-2 rounded border border-sky-100/16 bg-[#071320]/62 px-3 py-2 text-sm font-medium text-slate-200 backdrop-blur transition hover:border-[#f6c768]/45 hover:bg-[#f6c768]/10 hover:text-[#ffe6a6]"
                  >
                    <span className="text-xs text-sky-200">{SEARCH_EXAMPLE_ICONS[index]}</span>
                    {example}
                  </button>
                ))}
              </div>

              <SearchRecommendationFlow workflow={workflow} hasSemanticResult={hasSemanticResult} />
            </div>

            <div className="min-w-0 self-center">
              <WorkflowRecommendationCard query={state.q || query} hasSemanticResult={hasSemanticResult} />
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-4">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {viewTabs.map((tab) => (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    onClick={() => setPendingLabel(`正在切换到 ${tab.label}`)}
                    aria-current={activeTab === tab.id ? "page" : undefined}
                    className={`rounded border px-3 py-2 text-sm font-medium transition ${
                      activeTab === tab.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
              <div className="text-sm text-slate-500" aria-live="polite">
                {pendingLabel || resultSummary}
              </div>
            </div>

            {activeFilters.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {activeFilters.map((item) => (
                  <Link key={item.label} href={item.href} className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200">
                    {item.label}
                  </Link>
                ))}
                <Link href="/" className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                  <RotateCcw className="h-3.5 w-3.5" />
                  重置
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-[#f7f8fb] py-8">
          <div className="mx-auto grid w-full max-w-[1440px] gap-5 px-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-500">快速筛选工具卡</p>
                <h2 className="text-2xl font-semibold text-slate-950">先判断是否值得点进详情</h2>
              </div>

              {displayedTools.length > 0 ? (
                <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {displayedTools.map((tool) => (
                    <ToolCard
                      key={tool.slug}
                      slug={tool.slug}
                      name={tool.name}
                      summary={tool.summary}
                      tags={tool.tags}
                      url={tool.officialUrl}
                      logoPath={tool.logoPath}
                      score={tool.score}
                      reviewCount={tool.reviewCount}
                      accessFlags={tool.accessFlags}
                      priceLabel={detectPriceLabel(tool)}
                      decisionBadges={buildDecisionBadges({ price: tool.price, summary: tool.summary, tags: tool.tags })}
                      features={tool.features}
                      bestFor={tool.bestFor}
                      dealSummary={getDealText(tool)}
                      primaryMedia={tool.primaryMedia}
                      reason={tool.reason}
                      onDetailClick={() => rememberCatalogNavigation(currentRoute)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                  当前没有拿到工具目录数据，请检查后端服务或筛选条件。
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">免费与优惠</p>
                  <BadgePercent className="h-4 w-4 text-lime-600" />
                </div>
                <div className="mt-3 space-y-2">
                  {(dealTools.length > 0 ? dealTools : rankingTools.slice(0, 4)).map((tool) => (
                    <Link key={tool.slug} href={`/tools/${tool.slug}`} onClick={() => rememberCatalogNavigation(currentRoute)} className="block rounded-lg border border-lime-200 bg-lime-50 px-3 py-3 transition hover:bg-lime-100">
                      <p className="truncate text-sm font-semibold text-slate-950">{repairDisplayText(tool.name)}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-700">{getDealText(tool) || "免费/优惠信息待核验，进入详情查看数据状态。"}</p>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">推荐场景</p>
                  <ImageIcon className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-3 space-y-3">
                  {SCENARIO_PROMOS.map((scenario) => (
                    <button
                      key={scenario.title}
                      type="button"
                      onClick={() => {
                        setQuery(scenario.query);
                        submitSearch(scenario.query);
                      }}
                      style={{
                        backgroundImage: `linear-gradient(90deg, rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.58), rgba(2, 6, 23, 0.1)), url(${scenario.image})`,
                      }}
                      className="group relative block h-28 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 bg-cover bg-center text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                      <span className="relative flex h-full flex-col justify-end p-3">
                        <span className="text-sm font-semibold text-white">{scenario.title}</span>
                        <span className="mt-1 line-clamp-2 text-xs leading-5 text-slate-200">{scenario.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">热门工具</p>
                  <Flame className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-3 space-y-2">
                  {operatedRankingTools.map((tool, index) => (
                    <Link key={tool.key} href={tool.href} onClick={() => (tool.hasTool ? rememberCatalogNavigation(currentRoute) : undefined)} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition hover:border-slate-300 hover:bg-slate-50">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-slate-950 text-xs font-semibold text-white">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-950">{tool.name}</p>
                        <p className="truncate text-xs text-slate-500">{tool.category}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section id="submit-tool" className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">提交工具</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">补充目录里还没有的工具，后台核验后会进入首页、搜索和详情页。</p>
                <button type="button" onClick={() => setSubmitModalOpen(true)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                  去提交
                  <Sparkles className="h-4 w-4" />
                </button>
              </section>
            </aside>
          </div>
        </section>
      </main>

      {submitModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="submit-tool-title">
          <div className="w-full max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Tool Submission</p>
                <h2 id="submit-tool-title" className="mt-1 text-xl font-semibold text-slate-950">提交 AI 工具到待审核队列</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">运营会在后台核验工具名称、官网、适用场景和价格信息后再发布。</p>
              </div>
              <button type="button" onClick={() => setSubmitModalOpen(false)} className="rounded border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950" aria-label="关闭提交弹窗">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              className="space-y-4 px-5 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitStatus("已记录到待审核队列，运营核验后会进入后台工具维护流程。");
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  工具名称
                  <input required name="name" className="mt-1 h-11 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" placeholder="例如：ChatGPT" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  官网地址
                  <input required name="url" type="url" className="mt-1 h-11 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" placeholder="https://..." />
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                适合场景
                <input name="scenario" className="mt-1 h-11 w-full rounded border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" placeholder="例如：长文档总结、论文润色、PPT 生成" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                补充说明
                <textarea name="note" rows={4} className="mt-1 w-full resize-none rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" placeholder="补充价格、中文支持、使用风险或你推荐它的原因" />
              </label>
              {submitStatus ? <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{submitStatus}</p> : null}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSubmitModalOpen(false)} className="rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  取消
                </button>
                <button type="submit" className="rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  提交审核
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}
