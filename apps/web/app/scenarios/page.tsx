import Link from "next/link";
import { ArrowRight, BarChart3, Sparkles } from "lucide-react";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import { fetchScenarios } from "@/src/app/lib/catalog-api";
import { TOOL_SUBMISSION_URL } from "@/src/app/lib/catalog-utils";
import { FEATURED_SCENARIOS } from "@/src/app/lib/featured-scenarios";
import { withPublicPath } from "@/src/app/lib/public-path";

export const dynamic = "force-dynamic";

function compactKeyword(text: string) {
  return text.replace(/榜 TOP5|工具榜 TOP5|用什么AI/g, "").trim();
}

export default async function Page() {
  const scenarios = await fetchScenarios().catch(() => []);
  const scenarioCounts = new Map(scenarios.map((scenario) => [scenario.slug, scenario.toolCount]));
  const visibleFeaturedScenarios = FEATURED_SCENARIOS.slice(0, 3);
  const otherScenarios = scenarios.filter((scenario) => !visibleFeaturedScenarios.some((featured) => featured.slug === scenario.slug));

  return (
    <div className="page-shell">
      <Header currentPath="/scenarios" currentRoute="/scenarios" forceHomeHeader />

      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "任务场景" }]} />

          <section className="panel-base rounded-lg p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">任务场景</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">按真实任务看 AI 工具榜</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                  把榜单和场景合在一起看：先选工作任务，再看推荐工具、适用人群、限制风险和可对比候选。
                </p>
              </div>
              <Link href={withPublicPath("/tools?mode=search&page=1&page_size=24")} className="btn-secondary rounded px-4 py-2.5 text-sm">
                全部工具库
              </Link>
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {visibleFeaturedScenarios.map((scenario, index) => (
              <Link
                key={scenario.slug}
                href={withPublicPath(`/scenarios/${scenario.slug}`)}
                className="scenario-showcase-card group relative overflow-hidden rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="scenario-art-number">{String(index + 1).padStart(2, "0")}</div>
                  <ArrowRight className="mt-1 h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  {scenarioCounts.get(scenario.slug) || "推荐"} 个候选工具
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">{scenario.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {scenario.targetAudience.slice(0, 3).map((audience) => (
                    <span key={audience} className="scenario-data-tag">{audience}</span>
                  ))}
                </div>
                <div className="scenario-matrix mt-5">
                  {scenario.workflow.slice(0, 3).map((step, stepIndex) => (
                    <div key={step.title} className="scenario-matrix-row">
                      <span>{stepIndex + 1}</span>
                      <b>{step.title}</b>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <span className="scenario-signal-chip">收益：提速</span>
                  <span className="scenario-signal-chip">风险：可核验</span>
                </div>
              </Link>
            ))}
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">继续按条件筛工具</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">任务场景用于快速缩小范围，完整工具库保留分类、价格和访问条件筛选。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={withPublicPath("/tools?page=2&page_size=24")} className="btn-token-accent rounded px-4 py-2.5 text-sm">
                  下一页
                </Link>
                <Link href={withPublicPath("/tools?mode=search&page=1&page_size=24")} className="btn-secondary rounded px-4 py-2.5 text-sm">
                  全部数据快速入口
                </Link>
              </div>
            </div>
          </section>

          {otherScenarios.length > 0 ? (
            <section className="mt-6 grid gap-4 md:grid-cols-2">
              {otherScenarios.map((scenario) => (
                <Link key={scenario.slug} href={withPublicPath(`/scenarios/${scenario.slug}`)} className="scenario-compact-card rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <BarChart3 className="h-3.5 w-3.5" />
                      {scenario.toolCount} 个工具
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">{scenario.title}</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="scenario-data-tag">{compactKeyword(scenario.title)}</span>
                    <span className="scenario-data-tag">候选对比</span>
                    <span className="scenario-data-tag">避坑先看</span>
                  </div>
                  <div className="scenario-mini-table mt-4">
                    <span>任务关键词</span>
                    <b>{scenario.title}</b>
                    <span>查看路径</span>
                    <b>工具榜 + 经验</b>
                  </div>
                </Link>
              ))}
            </section>
          ) : null}

          {scenarios.length === 0 ? (
            <section className="panel-base mt-6 rounded-lg p-8 text-center">
              <h2 className="text-xl font-semibold text-slate-900">任务场景数据还在补充中</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                当前核心任务榜单已由前端兜底展示。你也可以提交常用工具，后续补进对应场景榜。
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link href={withPublicPath("/tools?mode=search&page=1&page_size=24")} className="btn-token-accent rounded px-5 py-3 text-sm">
                  去工具库
                </Link>
                <Link href={TOOL_SUBMISSION_URL} className="btn-secondary rounded px-5 py-3 text-sm">
                  提交工具
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
