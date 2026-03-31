import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ToolCard from "../components/ToolCard";
import type { PresetView, ToolSummary } from "../lib/catalog-types";
import { buildToolsHref } from "../lib/catalog-utils";

interface HomePageProps {
  featuredTools: ToolSummary[];
  categories: Array<{ slug: string; label: string; count: number }>;
  presets: PresetView[];
}

export default function HomePage({
  featuredTools,
  categories,
  presets,
}: HomePageProps) {
  return (
    <div className="page-shell">
      <Header />

      <main>
        <section className="hero-shell border-b border-white/25 py-16 md:py-20">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_440px] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">精选工具</p>
                <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">
                  帮你更快找到合适的 AI 工具
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                  收录常见 AI 工具，支持按关键词、分类和用途快速查找。先浏览推荐内容，再决定是否深入查看。
                </p>

                <form action="/tools" method="get" className="mt-8">
                  <div className="search-panel rounded-[32px] p-4 md:p-5">
                    <div className="relative z-10 flex flex-col gap-3 md:flex-row">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          name="q"
                          placeholder="搜索工具名称、用途或标签，例如：AI PPT、代码编辑器、会议总结"
                          className="w-full rounded-[22px] border border-white/45 bg-white/80 py-4 pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300"
                        />
                      </div>
                      <button type="submit" className="btn-primary rounded-[22px] px-6 py-4 text-sm font-semibold">
                        开始搜索
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="panel-base rounded-[32px] p-6 md:p-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  {presets.slice(0, 4).map((preset) => (
                    <Link
                      key={preset.id}
                      href={buildToolsHref({}, { view: preset.id })}
                      className="rounded-[24px] border border-white/40 bg-white/60 p-4 transition hover:bg-white/85"
                    >
                      <p className="text-sm font-semibold text-slate-900">{preset.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{preset.description}</p>
                      <p className="mt-3 text-xs font-medium text-slate-500">{preset.count} 个结果</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950 md:text-3xl">常用分类</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  这里展示当前目录中的高频分类，方便你按场景和能力快速缩小查找范围。
                </p>
              </div>
              <Link href="/tools" className="hidden text-sm font-medium text-slate-900 hover:underline md:inline-flex">
                查看全部
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {categories.slice(0, 4).map((category) => (
                <Link
                  key={category.slug}
                  href={buildToolsHref({}, { category: category.slug, page: 1 })}
                  className="card-base rounded-[28px] p-5"
                >
                  <div className="relative z-10">
                    <p className="text-sm font-semibold text-slate-950">{category.label}</p>
                    <p className="mt-3 text-sm text-slate-500">{category.count} 个工具</p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                      进入分类
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section-band py-12">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950 md:text-3xl">精选工具</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  首页按推荐排序展示目录中的重点工具，保留真实状态标记，方便先看全局再深入详情页。
                </p>
              </div>
              <Link href="/tools?view=hot" className="text-sm font-medium text-slate-900 hover:underline">
                查看全部
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featuredTools.map((tool) => (
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
