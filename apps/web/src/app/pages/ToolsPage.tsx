"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CatalogScrollRestorer from "../components/CatalogScrollRestorer";
import CompareToolsGrid from "../components/CompareToolsGrid";
import { Skeleton } from "../components/ui/skeleton";
import type { AiSearchResponse, ToolsDirectoryResponse } from "../lib/catalog-types";
import { buildToolsHref, derivePriceFacets } from "../lib/catalog-utils";
import { withPublicPath } from "../lib/public-path";
import { trackEvent } from "../lib/analytics";

const CATEGORY_LIMIT = 7;
const TAG_LIMIT = 10;
const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  "ai-image": "ai-图像",
  image: "ai-图像",
  "image-video": "ai-图像",
};

const DECISION_SHORTCUTS = [
  { id: "latest", label: "最新", hrefKey: "view", value: "latest" },
  { id: "hot", label: "最热", hrefKey: "view", value: "hot" },
  { id: "free", label: "免费优先", hrefKey: "price", value: "free" },
  { id: "subscription", label: "需要付费", hrefKey: "price", value: "subscription" },
] as const;

const HERO_FILTERS = [
  { id: "all", label: "全部", updates: { view: "hot", price: null, tag: null } },
  { id: "latest", label: "最新", updates: { view: "latest" } },
  { id: "free", label: "免费优先", updates: { price: "free" } },
  { id: "team", label: "团队协作", updates: { tag: "团队协作" } },
] as const;

const HOT_SEARCHES = ["PPT生成", "思维导图", "文案写作", "代码生成", "AI配音"];

const SORT_OPTIONS = [
  { id: "featured", label: "综合排序" },
  { id: "latest", label: "最新收录" },
  { id: "name", label: "名称排序" },
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
    pageSize?: string;
    source?: string;
  };
  loadState?: "idle" | "error" | "timeout";
}

function buildToolsPageHref(
  current: Record<string, string | undefined>,
  updates: Record<string, string | number | null | undefined>,
) {
  return withPublicPath(buildToolsHref(current, updates, "/tools"));
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

function normalizeCategorySlug(slug?: string) {
  if (!slug) return "";
  const normalized = slug.trim().toLowerCase();
  return CATEGORY_SLUG_ALIASES[normalized] || normalized;
}

export default function ToolsPage({ directory, state, loadState = "idle" }: ToolsPageProps) {
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
  const activeCategorySlug = normalizeCategorySlug(state.category);
  const selectedCategory = directory.categories.find((item) => normalizeCategorySlug(item.slug) === activeCategorySlug);
  const selectedTag = directory.tags.find((item) => item.slug === state.tag);
  const selectedPrice = priceFacets.find((item) => item.slug === state.price);
  const selectedPriceRange = priceRangeFacets.find((item) => item.slug === state.priceRange);
  const selectedAccess = (state.access || "")
    .split(",")
    .filter(Boolean)
    .map((slug) => accessFacets.find((item) => item.slug === slug)?.label)
    .filter((label): label is string => Boolean(label));
  const showEmpty = directory.items.length === 0;
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
    page_size: state.pageSize,
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
  const currentRoute = buildToolsPageHref(current, {});
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
  }, [state.mode, state.aiFocus, state.q, state.category, state.tag, state.price, state.access, state.priceRange, state.sort, state.view, state.page, state.pageSize]);

  return (
    <div className="page-shell">
      <CatalogScrollRestorer />
      <Header currentPath="/tools" currentRoute={currentRoute} forceHomeHeader />

      <main className="py-5 md:py-7">
        <div className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 sm:px-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:px-8">
          <aside className="hidden xl:sticky xl:top-24 xl:block xl:self-start">
            <div className="surface-panel rounded-lg p-4">
              <div className="space-y-1">
                <p className="px-2 text-sm font-semibold text-slate-900">快速入口</p>
                {DECISION_SHORTCUTS.map((item) => (
                  <Link
                    key={`desktop-quick-${item.id}`}
                    href={buildToolsPageHref(current, { [item.hrefKey]: item.value, page: 1 })}
                    className={`aside-item flex items-center justify-between rounded px-2.5 py-2 text-sm ${
                      (item.hrefKey === "view" ? activeView === item.value : state.price === item.value)
                        ? "bg-[var(--accent-soft)] text-[var(--color-accent)]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                    onClick={startAiPending}
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {visibleCategories.length > 0 ? (
                <div className="mt-6">
                  <p className="px-2 text-sm font-semibold text-slate-900">分类导航</p>
                  <div className="mt-2 space-y-1">
                    {visibleCategories.map((category) => (
                      <Link
                        key={category.slug}
                        href={buildToolsPageHref(current, { category: category.slug, page: 1 })}
                        className={`aside-item flex items-center justify-between rounded px-2.5 py-1.5 text-sm ${
                          activeCategorySlug === normalizeCategorySlug(category.slug) ? "bg-[var(--accent-soft)] text-[var(--color-accent)]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        <span>{category.label}</span>
                        <span className="text-xs opacity-70">{category.count}</span>
                      </Link>
                    ))}
                    {overflowCategories.length > 0 ? (
                      <details className="rounded px-2.5 py-1.5">
                        <summary className="cursor-pointer text-sm font-medium text-slate-600">展开更多分类</summary>
                        <div className="mt-2 space-y-1">
                          {overflowCategories.map((category) => (
                            <Link
                              key={category.slug}
                              href={buildToolsPageHref(current, { category: category.slug, page: 1 })}
                              className="aside-item flex items-center justify-between rounded px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            >
                              <span>{category.label}</span>
                              <span className="text-xs opacity-70">{category.count}</span>
                            </Link>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {priceFacets.length > 0 ? (
                <div className="mt-6">
                  <p className="px-2 text-sm font-semibold text-slate-900">价格</p>
                  <div className="mt-2 space-y-1">
                    {priceFacets.map((price) => (
                      <Link
                        key={price.slug}
                        href={buildToolsPageHref(current, { price: price.slug, page: 1 })}
                        className={`aside-item flex items-center justify-between rounded px-2.5 py-1.5 text-sm ${
                          state.price === price.slug ? "bg-[var(--accent-soft)] text-[var(--color-accent)]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        <span>{price.label}</span>
                        <span className="text-xs opacity-70">{price.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {priceRangeFacets.length > 0 ? (
                <div className="mt-6">
                  <p className="px-2 text-sm font-semibold text-slate-900">价格区间</p>
                  <div className="mt-2 space-y-1">
                    {priceRangeFacets.map((priceRange) => (
                      <Link
                        key={priceRange.slug}
                        href={buildToolsPageHref(current, { price_range: priceRange.slug, page: 1 })}
                        className={`aside-item flex items-center justify-between rounded px-2.5 py-1.5 text-sm ${
                          state.priceRange === priceRange.slug ? "bg-[var(--accent-soft)] text-[var(--color-accent)]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        <span>{priceRange.label}</span>
                        <span className="text-xs opacity-70">{priceRange.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {accessFacets.length > 0 ? (
                <div className="mt-6">
                  <p className="px-2 text-sm font-semibold text-slate-900">访问条件</p>
                  <div className="mt-2 space-y-1">
                    {accessFacets.map((accessFacet) => {
                      const active = (state.access || "").split(",").includes(accessFacet.slug);
                      const values = new Set((state.access || "").split(",").filter(Boolean));
                      if (active) values.delete(accessFacet.slug);
                      else values.add(accessFacet.slug);
                      return (
                        <Link
                          key={accessFacet.slug}
                          href={buildToolsPageHref(current, { access: Array.from(values).sort().join(",") || null, page: 1 })}
                          className={`aside-item flex items-center justify-between rounded px-2.5 py-1.5 text-sm ${
                            active ? "bg-[var(--accent-soft)] text-[var(--color-accent)]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                          }`}
                        >
                          <span>{accessFacet.label}</span>
                          <span className="text-xs opacity-70">{accessFacet.count}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {visibleTags.length > 0 ? (
                <div className="mt-6">
                  <p className="px-2 text-sm font-semibold text-slate-900">标签</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {visibleTags.map((tag) => (
                      <Link
                        key={tag.slug}
                        href={buildToolsPageHref(current, { tag: tag.slug, page: 1 })}
                        className={`filter-chip rounded px-2.5 py-1 text-xs font-medium ${
                          state.tag === tag.slug ? "btn-token-accent" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {tag.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {isFiltered ? (
                <Link href={withPublicPath("/tools?mode=search&page=1&page_size=24")} className="mt-6 inline-flex items-center gap-2 px-2 text-sm font-medium text-slate-700 hover:text-slate-950">
                  <RotateCcw className="h-4 w-4" />
                  重置筛选
                </Link>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0">
            <section className="surface-panel relative overflow-hidden rounded-lg p-5 md:p-8">
              <div className="tools-hero-accent absolute right-0 top-0 hidden h-full w-[32%] lg:block" />
              <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:items-center">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">{pageTitle}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                    这里不是工具堆砌台，而是帮你按需求、分类、标签和价格更快缩小范围，再进入详情页判断是否适合。
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {HERO_FILTERS.map((item) => (
                      <Link
                        key={item.id}
                        href={buildToolsPageHref(current, { ...item.updates, page: 1 })}
                        className={`filter-chip rounded-full px-4 py-2 text-sm font-semibold ${
                          (item.id === "all" && !state.price && !state.tag && activeView === "hot") ||
                          (item.id === "latest" && activeView === "latest") ||
                          (item.id === "free" && state.price === "free") ||
                          (item.id === "team" && state.tag === "团队协作")
                            ? "btn-token-accent"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <form
                  action={withPublicPath("/tools")}
                  method="get"
                  className="surface-glass-panel rounded-lg p-3"
                  onSubmit={() => {
                    if (activeMode === "ai") {
                      setAiPending(true);
                    }
                  }}
                >
                  <div className="mb-3 inline-flex rounded-full bg-slate-100 p-1">
                    <Link
                      href={buildToolsPageHref(current, { mode: "search", page: 1 })}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        activeMode === "search" ? "btn-token-accent" : "text-slate-600 hover:bg-white hover:text-slate-950"
                      }`}
                      onClick={() => trackEvent("home_mode_switch", { mode: "search", source: "tools" })}
                    >
                      全部搜索
                    </Link>
                    <Link
                      href={buildToolsPageHref(current, { mode: "ai", page: 1 })}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        activeMode === "ai" ? "btn-token-accent" : "text-slate-600 hover:bg-white hover:text-slate-950"
                      }`}
                      onClick={() => {
                        setAiPending(true);
                        trackEvent("home_mode_switch", { mode: "ai", source: "tools" });
                      }}
                    >
                      AI 搜索
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="tools-search"
                        type="search"
                        name="q"
                        defaultValue={state.q || ""}
                        placeholder="想写文案、做PPT、写代码？告诉我你的任务..."
                        data-global-search-target="tools"
                        className="input-token h-11 w-full rounded pl-10 pr-4 text-sm outline-none transition"
                      />
                      <input type="hidden" name="mode" value={activeMode} />
                      {state.view ? <input type="hidden" name="view" value={state.view} /> : null}
                      {state.category ? <input type="hidden" name="category" value={state.category} /> : null}
                      {state.tag ? <input type="hidden" name="tag" value={state.tag} /> : null}
                      {state.price ? <input type="hidden" name="price" value={state.price} /> : null}
                      {state.access ? <input type="hidden" name="access" value={state.access} /> : null}
                      {state.priceRange ? <input type="hidden" name="price_range" value={state.priceRange} /> : null}
                      {state.sort ? <input type="hidden" name="sort" value={state.sort} /> : null}
                      {state.pageSize ? <input type="hidden" name="page_size" value={state.pageSize} /> : null}
                    </div>
                    <button
                      type="submit"
                      className="btn-token-accent inline-flex h-11 w-full items-center justify-center rounded px-5 text-sm font-semibold transition sm:w-28"
                      disabled={activeMode === "ai" && aiPending}
                    >
                      {activeMode === "ai" ? (aiPending ? "匹配中" : "开始搜索") : "开始搜索"}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">热搜:</span>
                    {HOT_SEARCHES.map((item) => (
                      <Link
                        key={item}
                        href={buildToolsPageHref(current, { q: item, page: 1 })}
                        className="hot-keyword rounded px-3 py-1 text-xs font-medium transition"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </form>
              </div>
            </section>

          {activeMode === "ai" && aiPending ? (
            <section role="status" aria-live="polite" className="mt-5 rounded-lg border border-[var(--color-accent-border)] bg-[var(--accent-soft)] p-5 md:p-6">
              <p className="text-sm font-semibold text-sky-900">AI 正在匹配工具，请稍候...</p>
              <p className="mt-1 text-xs text-sky-700">正在分析你的任务、价格偏好和访问条件，马上返回结果。</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Skeleton className="h-20 rounded-2xl bg-white/80" />
                <Skeleton className="h-20 rounded-2xl bg-white/80" />
                <Skeleton className="h-20 rounded-2xl bg-white/80" />
              </div>
            </section>
          ) : null}

          <section className="mt-5">
            <details className="surface-panel rounded-lg p-4 xl:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900">
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  筛选与排序
                </span>
                <span className="text-xs text-slate-500">{isFiltered ? "已应用条件" : "展开筛选"}</span>
              </summary>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">快速入口</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DECISION_SHORTCUTS.map((item) => (
                      <Link
                        key={`mobile-${item.id}`}
                        href={buildToolsPageHref(current, { [item.hrefKey]: item.value, page: 1 })}
                        className={`filter-chip rounded-full px-3 py-1.5 text-xs font-medium ${
                          (item.hrefKey === "view" ? activeView === item.value : state.price === item.value)
                            ? "btn-token-accent"
                            : "border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
                {visibleCategories.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">分类</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {visibleCategories.map((category) => (
                        <Link
                          key={`mobile-category-${category.slug}`}
                          href={buildToolsPageHref(current, { category: category.slug, page: 1 })}
                          className={`filter-chip rounded-full px-3 py-1.5 text-xs font-medium ${
                          activeCategorySlug === normalizeCategorySlug(category.slug) ? "btn-token-accent" : "border border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {category.label} ({category.count})
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
                {priceFacets.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">价格</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {priceFacets.map((price) => (
                        <Link
                          key={`mobile-price-${price.slug}`}
                          href={buildToolsPageHref(current, { price: price.slug, page: 1 })}
                          className={`filter-chip rounded-full px-3 py-1.5 text-xs font-medium ${
                            state.price === price.slug ? "btn-token-accent" : "border border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {price.label} ({price.count})
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
                {isFiltered ? (
                  <Link href={withPublicPath("/tools?mode=search")} className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                    <RotateCcw className="h-4 w-4" />
                    重置筛选
                  </Link>
                ) : null}
              </div>
            </details>

            <div className="mt-4">
              {loadState !== "idle" ? (
                <div className="surface-panel rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-slate-900">{loadState === "timeout" ? "目录加载超时" : "目录加载失败"}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">当前未能完整获取工具目录数据。你可以刷新重试，或稍后再访问。</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={buildToolsPageHref(current, {})} className="btn-token-accent rounded px-4 py-2 text-sm">
                      重新加载
                    </Link>
                    <Link href={withPublicPath("/tools?mode=search")} className="btn-secondary rounded px-4 py-2 text-sm">
                      返回目录
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="surface-panel mb-3 rounded-lg px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>{`共 ${directory.total} 个工具，找到 ${directory.items.length} 个结果`}</span>
                    <span>{`模式：${activeMode === "ai" ? "AI 搜索" : "全部搜索"}`}</span>
                    {selectedCategory ? <span>{`分类：${selectedCategory.label}`}</span> : null}
                    {selectedTag ? <span>{`标签：${selectedTag.label}`}</span> : null}
                    {selectedPrice ? <span>{`价格：${selectedPrice.label}`}</span> : null}
                    {selectedPriceRange ? <span>{`价格区间：${selectedPriceRange.label}`}</span> : null}
                    {selectedAccess.length > 0 ? <span>{`访问条件：${selectedAccess.join(" / ")}`}</span> : null}
                    {state.q ? <span>{`搜索：${state.q}`}</span> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">排序:</span>
                    {SORT_OPTIONS.map((sortOption) => (
                      <Link
                        key={sortOption.id}
                        href={buildToolsPageHref(current, { sort: sortOption.id, page: 1 })}
                        className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                          activeSort === sortOption.id ? "btn-token-accent" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {sortOption.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {showEmpty ? (
                <div className="surface-panel rounded-lg p-8 text-center">
                  <h2 className="text-xl font-semibold text-slate-900">暂无匹配工具</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">当前筛选条件下没有找到结果。你可以放宽条件、切换到 AI 帮找，或先看热门工具继续缩小范围。</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link href={withPublicPath("/tools?mode=search&page=1&page_size=24")} className="btn-token-accent rounded px-5 py-3 text-sm">
                      放宽全部条件
                    </Link>
                    <Link href={buildToolsPageHref(current, { mode: "ai", page: 1, category: null, tag: null })} className="btn-secondary rounded px-5 py-3 text-sm">
                      用 AI 重新理解
                    </Link>
                    <Link href={withPublicPath("/tools?view=hot&mode=search")} className="btn-secondary rounded px-5 py-3 text-sm">
                      查看热门候选
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
                    href={buildToolsPageHref(current, { page: Math.max(1, currentPage - 1) })}
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
                        href={buildToolsPageHref(current, { page: token })}
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
                    href={buildToolsPageHref(current, { page: Math.min(totalPages, currentPage + 1) })}
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
