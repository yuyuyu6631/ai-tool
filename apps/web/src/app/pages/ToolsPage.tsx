"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import CatalogScrollRestorer from "../components/CatalogScrollRestorer";
import CompareToolsGrid from "../components/CompareToolsGrid";
import { Skeleton } from "../components/ui/skeleton";
import type { AiQuickAction, AiSearchResponse, ToolsDirectoryResponse } from "../lib/catalog-types";
import { buildToolsHref, derivePriceFacets } from "../lib/catalog-utils";
import { trackEvent } from "../lib/analytics";

const CATEGORY_LIMIT = 6;
const TAG_LIMIT = 8;

const DECISION_SHORTCUTS = [
  { id: "latest", label: "最新", hrefKey: "view", value: "latest" },
  { id: "hot", label: "最热", hrefKey: "view", value: "hot" },
  { id: "free", label: "免费优先", hrefKey: "price", value: "free" },
  { id: "subscription", label: "需要付费", hrefKey: "price", value: "subscription" },
] as const;

interface ToolsPageProps {
  directory: ToolsDirectoryResponse;
  aiSearch?: AiSearchResponse | null;
  state: {
    mode?: string;
    aiFocus?: string;
    q?: string;
    category?: string;
    tag?: string;
    price?: string;
    access?: string;
    priceRange?: string;
    sort?: string;
    view?: string;
    page?: string;
    source?: string;
  };
  loadState?: "idle" | "error" | "timeout";
}

function buildQuickActionHref(
  action: AiQuickAction["action"],
  state: Record<string, string | undefined>,
  cnLangSlug: string,
) {
  if (action.type === "set_filter" && action.key === "pricing" && action.value === "free") {
    return buildToolsHref(state, { mode: "ai", price: "free", page: 1 });
  }

  if (action.type === "set_filter" && action.key === "language" && action.value === "zh") {
    const values = new Set((state.access || "").split(",").filter(Boolean));
    values.add(cnLangSlug);
    return buildToolsHref(state, { mode: "ai", access: Array.from(values).sort().join(","), page: 1 });
  }

  if (action.type === "view_switch" && action.value === "filters") {
    return buildToolsHref(state, { mode: "ai", aiFocus: "list", page: 1 });
  }

  return null;
}

function buildPagination(currentPage: number, totalPages: number) {
  if (totalPages <= 1) return [];

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sorted = Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const tokens: Array<number | "ellipsis"> = [];

  for (const page of sorted) {
    const last = tokens[tokens.length - 1];
    if (typeof last === "number" && page - last > 1) {
      tokens.push("ellipsis");
    }
    tokens.push(page);
  }

  return tokens;
}

export default function ToolsPage({ directory, aiSearch = null, state, loadState = "idle" }: ToolsPageProps) {
  const [aiPending, setAiPending] = useState(false);
  const activeMode = state.mode === "ai" ? "ai" : "search";
  const activeView = state.view || "hot";
  const activeSort = state.sort || "featured";
  const priceFacets = directory.priceFacets ?? derivePriceFacets(directory.items);
  const accessFacets = directory.accessFacets ?? [];
  const priceRangeFacets = directory.priceRangeFacets ?? [];
  const visibleCategories = directory.categories.slice(0, CATEGORY_LIMIT);
  const overflowCategories = directory.categories.slice(CATEGORY_LIMIT);
  const visibleTags = directory.tags.slice(0, TAG_LIMIT);
  const overflowTags = directory.tags.slice(TAG_LIMIT);
  const selectedCategory = directory.categories.find((item) => item.slug === state.category);
  const selectedTag = directory.tags.find((item) => item.slug === state.tag);
  const selectedPrice = priceFacets.find((item) => item.slug === state.price);
  const selectedPriceRange = priceRangeFacets.find((item) => item.slug === state.priceRange);
  const selectedAccess = (state.access || "")
    .split(",")
    .filter(Boolean)
    .map((slug) => accessFacets.find((item) => item.slug === slug)?.label)
    .filter((label): label is string => Boolean(label));
  const showEmpty = directory.items.length === 0;
  const cnLangSlug = accessFacets.find((item) => item.slug === "cn-lang")?.slug || "cn-lang";
  const current = {
    mode: activeMode,
    aiFocus: state.aiFocus,
    q: state.q,
    category: state.category,
    tag: state.tag,
    price: state.price,
    access: state.access,
    price_range: state.priceRange,
    sort: state.sort,
    view: state.view,
    page: state.page,
  };
  const sourceTitleMap: Record<string, string> = {
    home_hot: "首页热门工具",
    home_latest: "首页最新工具",
    home_category: "首页分类工具",
    home_search: "首页搜索结果",
  };
  const pageTitle = state.q ? "搜索结果" : sourceTitleMap[state.source || ""] || "工具目录";
  const currentPage = Number(state.page || directory.page || 1);
  const totalPages = Math.max(1, Math.ceil(directory.total / Math.max(1, directory.pageSize || 9)));
  const pagination = buildPagination(currentPage, totalPages);
  const currentRoute = buildToolsHref(current, {});
  const aiPanel = aiSearch?.ai_panel;
  const aiQuickActions = aiPanel?.quick_actions ?? [
    { label: "只看免费", action: { type: "set_filter", key: "pricing", value: "free" } },
    { label: "只看中文", action: { type: "set_filter", key: "language", value: "zh" } },
    { label: "进入筛选列表", action: { type: "view_switch", value: "filters" } },
  ];
  const aiActiveLogic = aiPanel?.active_logic ?? [];
  const isFiltered = Boolean(
    state.q || state.category || state.tag || state.price || state.access || state.priceRange || activeView !== "hot" || activeSort !== "featured" || activeMode !== "search",
  );
  const startAiPending = () => {
    if (activeMode === "ai") {
      setAiPending(true);
    }
  };

  useEffect(() => {
    setAiPending(false);
  }, [state.mode, state.aiFocus, state.q, state.category, state.tag, state.price, state.access, state.priceRange, state.sort, state.view, state.page]);

  return (
    <div className="page-shell">
      <CatalogScrollRestorer />
      <Header currentPath="/tools" currentRoute={currentRoute} />

      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "工具目录" }]} />

          <section className="panel-base rounded-[32px] p-5 md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">工具目录</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">{pageTitle}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                  这里不是把工具堆给你，而是帮你按需求、分类、标签和价格更快缩小范围，再进入详情页判断是否适合。
                </p>
              </div>

              <form
                action="/tools"
                method="get"
                className="w-full lg:max-w-xl"
                onSubmit={() => {
                  if (activeMode === "ai") {
                    setAiPending(true);
                  }
                }}
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  <Link
                    href={buildToolsHref(current, { mode: "search", page: 1 })}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      activeMode === "search"
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                        : "border border-white/45 bg-white/70 text-slate-700 hover:bg-white"
                    }`}
                    onClick={() => trackEvent("home_mode_switch", { mode: "search", source: "tools" })}
                  >
                    直接搜索
                  </Link>
                  <Link
                    href={buildToolsHref(current, { mode: "ai", page: 1 })}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      activeMode === "ai"
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                        : "border border-white/45 bg-white/70 text-slate-700 hover:bg-white"
                    }`}
                    onClick={() => {
                      setAiPending(true);
                      trackEvent("home_mode_switch", { mode: "ai", source: "tools" });
                    }}
                  >
                    AI 帮找
                  </Link>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="tools-search"
                      type="search"
                      name="q"
                      defaultValue={state.q || ""}
                      placeholder="想写文案、做海报、写代码？告诉我你的任务。"
                      data-global-search-target="tools"
                      className="w-full rounded-[18px] border border-white/50 bg-white/80 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                    />
                    <input type="hidden" name="mode" value={activeMode} />
                    {state.view ? <input type="hidden" name="view" value={state.view} /> : null}
                    {state.category ? <input type="hidden" name="category" value={state.category} /> : null}
                    {state.tag ? <input type="hidden" name="tag" value={state.tag} /> : null}
                    {state.price ? <input type="hidden" name="price" value={state.price} /> : null}
                    {state.access ? <input type="hidden" name="access" value={state.access} /> : null}
                    {state.priceRange ? <input type="hidden" name="price_range" value={state.priceRange} /> : null}
                    {state.sort ? <input type="hidden" name="sort" value={state.sort} /> : null}
                  </div>
                  <button type="submit" className="btn-primary rounded-[18px] px-5 py-3 text-sm font-semibold" disabled={activeMode === "ai" && aiPending}>
                    {activeMode === "ai" ? (aiPending ? "正在匹配..." : "开始推荐") : "开始筛选"}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {DECISION_SHORTCUTS.map((item) => (
                    <Link
                      key={item.id}
                      href={buildToolsHref(current, { [item.hrefKey]: item.value, page: 1 })}
                      className={`filter-chip rounded-full px-3 py-1.5 text-xs font-medium ${
                        (item.hrefKey === "view" ? activeView === item.value : state.price === item.value)
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                          : "border border-white/45 bg-white/70 text-slate-700 hover:bg-white"
                      }`}
                      onClick={startAiPending}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </form>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/40 bg-white/50 px-4 py-3 text-sm text-slate-600">
              先说需求，再看工具。你也可以按热门预设、分类、标签和价格继续缩小范围。
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {directory.presets.map((preset) => (
                <Link
                  key={preset.id}
                  href={buildToolsHref(current, {
                    view: preset.id,
                    page: 1,
                    category: null,
                    tag: null,
                  })}
                  className={`filter-chip rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeView === preset.id
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                      : "border border-white/45 bg-white/70 text-slate-700 hover:bg-white"
                  }`}
                >
                  {preset.label}
                </Link>
              ))}
            </div>
          </section>

          {activeMode === "ai" && aiPending ? (
            <section role="status" aria-live="polite" className="panel-base mt-6 rounded-[28px] border border-sky-200/80 bg-sky-50/70 p-5 md:p-6">
              <p className="text-sm font-semibold text-sky-900">AI 正在匹配工具，请稍候...</p>
              <p className="mt-1 text-xs text-sky-700">正在分析你的任务、价格偏好和访问条件，马上返回结果。</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Skeleton className="h-20 rounded-2xl bg-white/80" />
                <Skeleton className="h-20 rounded-2xl bg-white/80" />
                <Skeleton className="h-20 rounded-2xl bg-white/80" />
              </div>
            </section>
          ) : null}

          {activeMode === "ai" ? (
            <section className={`panel-base mt-6 rounded-[28px] p-5 md:p-6 ${state.aiFocus === "list" ? "opacity-90" : "ring-1 ring-slate-300/70"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{aiPanel?.title || "AI 理解面板"}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-xs font-semibold text-slate-500">你的需求</p>
                  <p className="mt-2 text-sm text-slate-800">{aiPanel?.user_need || state.q?.trim() || "未输入需求"}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-xs font-semibold text-slate-500">系统理解</p>
                  <p className="mt-2 text-sm text-slate-800">{aiPanel?.system_understanding || "根据你的输入先为你展示相关工具。"}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 md:col-span-2">
                  <p className="text-xs font-semibold text-slate-500">当前优先筛选逻辑</p>
                  <p className="mt-2 text-sm text-slate-800">
                    {aiActiveLogic.length > 0 ? aiActiveLogic.join(" / ") : "当前筛选逻辑：未附加筛选条件"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 md:col-span-2">
                  <p className="text-xs font-semibold text-slate-500">可执行快捷动作</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {aiQuickActions.map((quickAction, index) => {
                      const href = buildQuickActionHref(quickAction.action, state as Record<string, string | undefined>, cnLangSlug);
                      if (!href) return null;
                      const emphasized = index === 0;
                      return (
                        <Link
                          key={`${quickAction.label}-${index}`}
                          href={href}
                          className={
                            emphasized
                              ? "rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                              : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                          }
                          onClick={() => {
                            startAiPending();
                            trackEvent("tools_ai_quick_action_click", {
                              action: quickAction.action.type,
                              key: quickAction.action.key || "",
                              value: quickAction.action.value || "",
                              mode: "ai",
                            });
                          }}
                        >
                          {quickAction.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-6 grid items-start gap-6 xl:grid-cols-[288px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-24 xl:self-start">
              <div className="panel-base rounded-[28px] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <SlidersHorizontal className="h-4 w-4" />
                  决策筛选
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">快速入口</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DECISION_SHORTCUTS.map((item) => (
                      <Link
                        key={`sidebar-${item.id}`}
                        href={buildToolsHref(current, { [item.hrefKey]: item.value, page: 1 })}
                        className={`filter-chip rounded-full px-3 py-1.5 text-xs font-medium ${
                          (item.hrefKey === "view" ? activeView === item.value : state.price === item.value)
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                            : "bg-white/70 text-slate-700 hover:bg-white"
                        }`}
                        onClick={startAiPending}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">排序</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { id: "featured", label: "最热" },
                      { id: "latest", label: "最新" },
                      { id: "name", label: "名称" },
                    ].map((sortOption) => (
                      <Link
                        key={sortOption.id}
                        href={buildToolsHref(current, { sort: sortOption.id, page: 1 })}
                        className={`filter-chip rounded-full px-3 py-1.5 text-xs font-medium ${
                          activeSort === sortOption.id
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                            : "bg-white/70 text-slate-700 hover:bg-white"
                        }`}
                      >
                        {sortOption.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">分类</p>
                    {state.category ? (
                      <Link href={buildToolsHref(current, { category: null, page: 1 })} className="text-xs text-slate-500 hover:text-slate-900">
                        清除分类
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-2">
                    {visibleCategories.map((category) => (
                      <Link
                        key={category.slug}
                        href={buildToolsHref(current, { category: category.slug, page: 1 })}
                        className={`aside-item flex items-center justify-between rounded-2xl px-3 py-2 text-sm ${
                          state.category === category.slug ? "bg-slate-900 text-white" : "bg-white/70 text-slate-700 hover:bg-white"
                        }`}
                      >
                        <span>{category.label}</span>
                        <span className="text-xs opacity-70">{category.count}</span>
                      </Link>
                    ))}
                    {overflowCategories.length > 0 ? (
                      <details className="rounded-2xl bg-white/60 p-3">
                        <summary className="cursor-pointer text-sm font-medium text-slate-700">查看更多分类</summary>
                        <div className="mt-3 space-y-2">
                          {overflowCategories.map((category) => (
                            <Link
                              key={category.slug}
                              href={buildToolsHref(current, { category: category.slug, page: 1 })}
                              className="aside-item flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-white"
                            >
                              <span>{category.label}</span>
                              <span className="text-xs text-slate-500">{category.count}</span>
                            </Link>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                </div>

                {priceFacets.length > 0 ? (
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">价格</p>
                      {state.price ? (
                        <Link href={buildToolsHref(current, { price: null, page: 1 })} className="text-xs text-slate-500 hover:text-slate-900">
                          清除价格
                        </Link>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {priceFacets.map((price) => (
                        <Link
                          key={price.slug}
                          href={buildToolsHref(current, { price: price.slug, page: 1 })}
                          className={`filter-chip rounded-full px-3 py-1.5 text-xs font-medium ${
                            state.price === price.slug
                              ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                              : "bg-white/70 text-slate-700 hover:bg-white"
                          }`}
                        >
                          {price.label} ({price.count})
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                {priceRangeFacets.length > 0 ? (
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">价格区间</p>
                      {state.priceRange ? (
                        <Link href={buildToolsHref(current, { price_range: null, page: 1 })} className="text-xs text-slate-500 hover:text-slate-900">
                          清除区间
                        </Link>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {priceRangeFacets.map((priceRange) => (
                        <Link
                          key={priceRange.slug}
                          href={buildToolsHref(current, { price_range: priceRange.slug, page: 1 })}
                          className={`filter-chip rounded-full px-3 py-1.5 text-xs font-medium ${
                            state.priceRange === priceRange.slug
                              ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                              : "bg-white/70 text-slate-700 hover:bg-white"
                          }`}
                        >
                          {priceRange.label} ({priceRange.count})
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                {accessFacets.length > 0 ? (
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">访问条件</p>
                      {state.access ? (
                        <Link href={buildToolsHref(current, { access: null, page: 1 })} className="text-xs text-slate-500 hover:text-slate-900">
                          清除条件
                        </Link>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {accessFacets.map((accessFacet) => {
                        const active = (state.access || "").split(",").includes(accessFacet.slug);
                        const values = new Set((state.access || "").split(",").filter(Boolean));
                        if (active) values.delete(accessFacet.slug);
                        else values.add(accessFacet.slug);
                        return (
                          <Link
                            key={accessFacet.slug}
                            href={buildToolsHref(current, { access: Array.from(values).sort().join(",") || null, page: 1 })}
                            className={`filter-chip rounded-full px-3 py-1.5 text-xs font-medium ${
                              active ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "bg-white/70 text-slate-700 hover:bg-white"
                            }`}
                          >
                            {accessFacet.label} ({accessFacet.count})
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">标签</p>
                    {state.tag ? (
                      <Link href={buildToolsHref(current, { tag: null, page: 1 })} className="text-xs text-slate-500 hover:text-slate-900">
                        清除标签
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleTags.map((tag) => (
                      <Link
                        key={tag.slug}
                        href={buildToolsHref(current, { tag: tag.slug, page: 1 })}
                        className={`filter-chip rounded-full px-3 py-1.5 text-xs font-medium ${
                          state.tag === tag.slug
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                            : "bg-white/70 text-slate-700 hover:bg-white"
                        }`}
                      >
                        {tag.label}
                      </Link>
                    ))}
                  </div>
                  {overflowTags.length > 0 ? (
                    <details className="mt-3 rounded-2xl bg-white/60 p-3">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700">
                        更多标签 ({overflowTags.length})
                      </summary>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {overflowTags.map((tag) => (
                          <Link
                            key={tag.slug}
                            href={buildToolsHref(current, { tag: tag.slug, page: 1 })}
                            className={`filter-chip rounded-full px-3 py-1.5 text-xs font-medium ${
                              state.tag === tag.slug
                                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                                : "bg-white/70 text-slate-700 hover:bg-white"
                            }`}
                          >
                            {tag.label}
                          </Link>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>

                {isFiltered ? (
                  <div className="mt-6">
                    <Link href="/tools?mode=search" className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 hover:underline">
                      <RotateCcw className="h-4 w-4" />
                      重置筛选
                    </Link>
                  </div>
                ) : null}
              </div>
            </aside>

            <div>
              {loadState !== "idle" ? (
                <div className="panel-base rounded-[28px] p-6">
                  <h2 className="text-lg font-semibold text-slate-900">{loadState === "timeout" ? "目录加载超时" : "目录加载失败"}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">当前未能完整获取工具目录数据。你可以刷新重试，或稍后再访问。</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={buildToolsHref(current, {})} className="btn-primary rounded-full px-4 py-2 text-sm">
                      重新加载
                    </Link>
                    <Link href="/tools?mode=search" className="btn-secondary rounded-full px-4 py-2 text-sm">
                      返回目录
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="panel-base mb-4 rounded-[24px] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>{`结果数：${directory.total}`}</span>
                    <span>{`当前页：${currentPage} / ${totalPages}`}</span>
                    <span>{`模式：${activeMode === "ai" ? "AI 帮找" : "直接搜索"}`}</span>
                    {selectedCategory ? <span>{`分类：${selectedCategory.label}`}</span> : null}
                    {selectedTag ? <span>{`标签：${selectedTag.label}`}</span> : null}
                    {selectedPrice ? <span>{`价格：${selectedPrice.label}`}</span> : null}
                    {selectedPriceRange ? <span>{`价格区间：${selectedPriceRange.label}`}</span> : null}
                    {selectedAccess.length > 0 ? <span>{`访问条件：${selectedAccess.join(" / ")}`}</span> : null}
                    {state.q ? <span>{`搜索：${state.q}`}</span> : null}
                  </div>
                  {!showEmpty && totalPages > 1 ? <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">列表 / 详情 / 返回</div> : null}
                </div>
              </div>

              {showEmpty ? (
                <div className="panel-base rounded-[28px] p-8 text-center">
                  <h2 className="text-xl font-semibold text-slate-900">暂无匹配工具</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">当前筛选条件下没有找到结果。你可以换一个关键词，或清除分类、价格和标签后再试。</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link href="/tools?mode=search" className="btn-primary rounded-full px-5 py-3 text-sm">
                      重置筛选
                    </Link>
                    <Link href="/tools?view=hot&mode=search" className="btn-secondary rounded-full px-5 py-3 text-sm">
                      返回最热
                    </Link>
                  </div>
                </div>
              ) : (
                <CompareToolsGrid
                  items={directory.items}
                  rememberDetailNavigation
                  onToolDetailClick={(tool) => {
                    if (activeMode !== "ai") return;
                    trackEvent("tools_ai_to_detail_click", {
                      mode: activeMode,
                      slug: tool.slug,
                      query: state.q || "",
                    });
                  }}
                />
              )}

              {!showEmpty && totalPages > 1 ? (
                <nav aria-label="分页导航" className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href={buildToolsHref(current, { page: Math.max(1, currentPage - 1) })}
                    aria-disabled={currentPage <= 1}
                    className={`pagination-chip inline-flex min-w-10 items-center justify-center gap-1 rounded-full px-4 py-2 text-sm font-medium ${
                      currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Link>
                  {pagination.map((token, index) =>
                    token === "ellipsis" ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-400">
                        ...
                      </span>
                    ) : (
                      <Link
                        key={token}
                        href={buildToolsHref(current, { page: token })}
                        aria-current={token === currentPage ? "page" : undefined}
                        className={`pagination-chip inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold ${
                          token === currentPage ? "is-active bg-slate-900 text-white" : ""
                        }`}
                      >
                        {token}
                      </Link>
                    ),
                  )}
                  <Link
                    href={buildToolsHref(current, { page: Math.min(totalPages, currentPage + 1) })}
                    aria-disabled={currentPage >= totalPages}
                    className={`pagination-chip inline-flex min-w-10 items-center justify-center gap-1 rounded-full px-4 py-2 text-sm font-medium ${
                      currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </nav>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}



