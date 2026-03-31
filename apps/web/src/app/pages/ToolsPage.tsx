import Link from "next/link";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import ToolCard from "../components/ToolCard";
import type { ToolsDirectoryResponse } from "../lib/catalog-types";
import { buildToolsHref } from "../lib/catalog-utils";

const CATEGORY_LIMIT = 8;
const TAG_LIMIT = 14;

interface ToolsPageProps {
  directory: ToolsDirectoryResponse;
  state: {
    q?: string;
    category?: string;
    tag?: string;
    status?: string;
    sort?: string;
    view?: string;
    page?: string;
  };
  loadState?: "idle" | "error" | "timeout";
}

export default function ToolsPage({ directory, state, loadState = "idle" }: ToolsPageProps) {
  const activeView = state.view || "hot";
  const activeSort = state.sort || "featured";
  const selectedCategory = directory.categories.find((item) => item.slug === state.category);
  const selectedTag = directory.tags.find((item) => item.slug === state.tag);
  const selectedStatus = directory.statuses.find((item) => item.slug === state.status);
  const showEmpty = directory.items.length === 0;
  const current = {
    q: state.q,
    category: state.category,
    tag: state.tag,
    status: state.status,
    sort: state.sort,
    view: state.view,
    page: state.page,
  };
  const pageTitle = state.q ? "搜索结果" : "工具分类";

  return (
    <div className="page-shell">
      <Header />

      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "工具目录" }]} />

          <section className="panel-base rounded-[32px] p-5 md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tools</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                  {pageTitle}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                  支持按关键词搜索工具名称、用途和标签，并结合分类、状态、标签继续筛选，帮助你更快找到合适的工具。
                </p>
              </div>

              <form action="/tools" method="get" className="w-full lg:max-w-xl">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      name="q"
                      defaultValue={state.q || ""}
                      placeholder="搜索工具名称、标签或用途"
                      className="w-full rounded-[18px] border border-white/50 bg-white/80 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none"
                    />
                    {state.view ? <input type="hidden" name="view" value={state.view} /> : null}
                    {state.category ? <input type="hidden" name="category" value={state.category} /> : null}
                    {state.tag ? <input type="hidden" name="tag" value={state.tag} /> : null}
                    {state.status ? <input type="hidden" name="status" value={state.status} /> : null}
                    {state.sort ? <input type="hidden" name="sort" value={state.sort} /> : null}
                  </div>
                  <button type="submit" className="btn-primary rounded-[18px] px-5 py-3 text-sm font-semibold">
                    开始搜索
                  </button>
                </div>
              </form>
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
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeView === preset.id
                      ? "bg-slate-900 text-white"
                      : "border border-white/45 bg-white/70 text-slate-700 hover:bg-white"
                  }`}
                >
                  {preset.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[288px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-24 xl:self-start">
              <div className="panel-base rounded-[28px] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <SlidersHorizontal className="h-4 w-4" />
                  筛选条件
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">排序</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { id: "featured", label: "推荐" },
                      { id: "latest", label: "最新" },
                      { id: "name", label: "名称" },
                    ].map((sortOption) => (
                      <Link
                        key={sortOption.id}
                        href={buildToolsHref(current, { sort: sortOption.id, page: 1 })}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                          activeSort === sortOption.id
                            ? "bg-slate-900 text-white"
                            : "bg-white/70 text-slate-700"
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
                    {directory.categories.slice(0, CATEGORY_LIMIT).map((category) => (
                      <Link
                        key={category.slug}
                        href={buildToolsHref(current, { category: category.slug, page: 1 })}
                        className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm ${
                          state.category === category.slug
                            ? "bg-slate-900 text-white"
                            : "bg-white/70 text-slate-700 hover:bg-white"
                        }`}
                      >
                        <span>{category.label}</span>
                        <span className="text-xs opacity-70">{category.count}</span>
                      </Link>
                    ))}
                    {directory.categories.length > CATEGORY_LIMIT ? (
                      <details className="rounded-2xl bg-white/60 p-3">
                        <summary className="cursor-pointer text-sm font-medium text-slate-700">查看更多分类</summary>
                        <div className="mt-3 space-y-2">
                          {directory.categories.slice(CATEGORY_LIMIT).map((category) => (
                            <Link
                              key={category.slug}
                              href={buildToolsHref(current, { category: category.slug, page: 1 })}
                              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-white"
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

                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">状态</p>
                    {state.status ? (
                      <Link href={buildToolsHref(current, { status: null, page: 1 })} className="text-xs text-slate-500 hover:text-slate-900">
                        清除状态
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {directory.statuses.map((status) => (
                      <Link
                        key={status.slug}
                        href={buildToolsHref(current, { status: status.slug, page: 1 })}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                          state.status === status.slug
                            ? "bg-slate-900 text-white"
                            : "bg-white/70 text-slate-700 hover:bg-white"
                        }`}
                      >
                        {status.label} ({status.count})
                      </Link>
                    ))}
                  </div>
                </div>

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
                    {directory.tags.slice(0, TAG_LIMIT).map((tag) => (
                      <Link
                        key={tag.slug}
                        href={buildToolsHref(current, { tag: tag.slug, page: 1 })}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                          state.tag === tag.slug
                            ? "bg-slate-900 text-white"
                            : "bg-white/70 text-slate-700 hover:bg-white"
                        }`}
                      >
                        {tag.label}
                      </Link>
                    ))}
                  </div>
                  {directory.tags.length > TAG_LIMIT ? (
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      标签较多时，优先展示高频标签。你也可以通过搜索直接定位具体工具。
                    </p>
                  ) : null}
                </div>

                {(state.q || state.category || state.tag || state.status || activeView !== "hot" || activeSort !== "featured") ? (
                  <div className="mt-6">
                    <Link
                      href="/tools"
                      className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 hover:underline"
                    >
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
                  <h2 className="text-lg font-semibold text-slate-900">
                    {loadState === "timeout" ? "目录加载超时" : "目录加载失败"}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    当前未能完整获取工具目录数据。你可以刷新重试，或先清空筛选条件后重新访问。
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href={buildToolsHref(current, {})} className="btn-primary rounded-full px-4 py-2 text-sm">
                      重新加载
                    </Link>
                    <Link href="/tools" className="btn-secondary rounded-full px-4 py-2 text-sm">
                      返回目录
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span>{`结果数：${directory.total}`}</span>
                {selectedCategory ? <span>{`分类：${selectedCategory.label}`}</span> : null}
                {selectedTag ? <span>{`标签：${selectedTag.label}`}</span> : null}
                {selectedStatus ? <span>{`状态：${selectedStatus.label}`}</span> : null}
                {state.q ? <span>{`搜索：${state.q}`}</span> : null}
              </div>

              {showEmpty ? (
                <div className="panel-base rounded-[28px] p-8 text-center">
                  <h2 className="text-xl font-semibold text-slate-900">暂无匹配的工具</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    当前筛选条件下没有找到结果。可以尝试更换关键词，或清除分类、状态和标签后重新查看。
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link href="/tools" className="btn-primary rounded-full px-5 py-3 text-sm">
                      重置筛选
                    </Link>
                    <Link href="/tools?view=hot" className="btn-secondary rounded-full px-5 py-3 text-sm">
                      返回推荐
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {directory.items.map((tool) => (
                    <ToolCard
                      key={tool.slug}
                      slug={tool.slug}
                      name={tool.name}
                      summary={tool.summary}
                      tags={tool.tags}
                      url={tool.officialUrl}
                      logoPath={tool.logoPath}
                      status={tool.status}
                    />
                  ))}
                </div>
              )}

              {!showEmpty && directory.hasMore ? (
                <div className="mt-8 flex justify-center">
                  <Link
                    href={buildToolsHref(current, { page: Number(state.page || "1") + 1 })}
                    className="btn-primary rounded-full px-6 py-3 text-sm font-semibold"
                  >
                    加载更多
                  </Link>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
