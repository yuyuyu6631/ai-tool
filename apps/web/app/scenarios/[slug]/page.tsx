import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import CatalogScrollRestorer from "@/src/app/components/CatalogScrollRestorer";
import CompareToolsGrid from "@/src/app/components/CompareToolsGrid";
import { fetchDirectory, fetchScenarioDetail } from "@/src/app/lib/catalog-api";
import { getFeaturedScenario } from "@/src/app/lib/featured-scenarios";
import { withPublicPath } from "@/src/app/lib/public-path";
import type { CompareToolsSection } from "@/src/app/components/CompareToolsGrid";
import type { ScenarioSummary, ToolSummary } from "@/src/app/lib/catalog-types";

interface ScenarioRouteProps {
  params: Promise<{ slug: string }>;
}

async function fetchFallbackTools(query: string): Promise<ToolSummary[]> {
  const search = new URLSearchParams({
    mode: "search",
    q: query,
    page: "1",
    page_size: "6",
  });

  const directory = await fetchDirectory(search.toString()).catch(() => null);
  return directory?.items ?? [];
}

export default async function Page({ params }: ScenarioRouteProps) {
  const { slug } = await params;
  const featured = getFeaturedScenario(slug);
  const scenario = await fetchScenarioDetail(slug).catch(() => null);

  if (!scenario && !featured) {
    notFound();
  }

  const fallbackTools = featured ? await fetchFallbackTools(featured.searchQuery) : [];
  const scenarioView: ScenarioSummary = scenario ?? {
    id: 0,
    slug,
    title: featured!.title,
    description: featured!.description,
    problem: featured!.problem,
    toolCount: fallbackTools.length,
    primaryTools: fallbackTools.slice(0, 3),
    alternativeTools: fallbackTools.slice(3, 6),
    targetAudience: featured!.targetAudience,
  };

  const primaryTools = scenarioView.primaryTools.length > 0 ? scenarioView.primaryTools : fallbackTools.slice(0, 3);
  const alternativeTools = scenarioView.alternativeTools.length > 0 ? scenarioView.alternativeTools : fallbackTools.slice(3, 6);
  const searchQuery = featured?.searchQuery ?? scenarioView.title;
  const toolSearchHref = withPublicPath(`/tools?mode=search&q=${encodeURIComponent(searchQuery)}&page=1&page_size=24`);

  const compareSections: CompareToolsSection[] = [
    {
      id: "primary-tools",
      title: "榜单主推工具",
      items: primaryTools,
      emptyTitle: "主推工具还在补充中",
      emptyDescription: "可以先打开全部工具库，用任务关键词继续筛选。",
    },
    {
      id: "alternative-tools",
      title: "可替代工具",
      items: alternativeTools,
      emptyTitle: "备选工具还没收齐",
      emptyDescription: "先看主推工具也没问题，后续会继续补充同类替代品。",
    },
  ];

  return (
    <div className="page-shell">
      <CatalogScrollRestorer />
      <Header currentPath={`/scenarios/${slug}`} currentRoute={`/scenarios/${slug}`} />

      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "首页", href: "/" },
              { label: "任务场景", href: "/scenarios" },
              { label: scenarioView.title },
            ]}
          />

          <section className="panel-base rounded-lg p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">任务场景</p>
            <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">{scenarioView.title}</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{scenarioView.description}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">适用人群</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {scenarioView.targetAudience.map((audience) => (
                    <span key={audience} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                      {audience}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="panel-base rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900">这个榜单解决什么问题</h2>
              <p className="mt-4 text-sm leading-8 text-slate-700">{featured?.problem ?? scenarioView.problem}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">快速入口</p>
              <div className="mt-4 space-y-2">
                <Link href={toolSearchHref} className="btn-primary flex justify-center rounded px-4 py-2.5 text-sm">
                  查看匹配工具
                </Link>
                <Link href={withPublicPath("/tools?page=2&page_size=24")} className="btn-secondary flex justify-center rounded px-4 py-2.5 text-sm">
                  工具库下一页
                </Link>
              </div>
            </div>
          </section>

          {featured ? (
            <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">操作流程</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {featured.workflow.map((step, index) => (
                  <div key={step.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">步骤 {index + 1}</p>
                    <h3 className="mt-2 text-base font-semibold text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-6">
            <CompareToolsGrid sections={compareSections} rememberDetailNavigation />
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">继续查找</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">从当前任务回到任务场景，或直接进入完整工具库继续筛选。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={withPublicPath("/scenarios")} className="btn-secondary rounded px-4 py-2.5 text-sm">
                  返回任务场景
                </Link>
                <Link href={withPublicPath("/tools?mode=search&page=1&page_size=24")} className="btn-primary rounded px-4 py-2.5 text-sm">
                  全部工具库
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
