import Link from "next/link";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import { fetchScenarios } from "@/src/app/lib/catalog-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  const scenarios = await fetchScenarios().catch(() => []);

  return (
    <div className="page-shell">
      <Header />

      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "场景" }]} />

          <section className="panel-base rounded-[32px] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Scenarios</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">使用场景</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              场景页直接读取数据库中的场景定义和工具关联，方便从任务出发筛选工具。
            </p>
          </section>

          {scenarios.length === 0 ? (
            <section className="panel-base mt-6 rounded-[28px] p-8 text-center">
              <h2 className="text-xl font-semibold text-slate-900">暂无可展示场景</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">当前没有可用场景数据，稍后再试。</p>
            </section>
          ) : (
            <section className="mt-6 grid gap-4 md:grid-cols-2">
              {scenarios.map((scenario) => (
                <Link key={scenario.slug} href={`/scenarios/${scenario.slug}`} className="card-base rounded-[28px] p-5">
                  <div className="relative z-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {scenario.toolCount} 个工具
                    </p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950">{scenario.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{scenario.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {scenario.primaryTools.slice(0, 3).map((slug) => (
                        <span key={slug} className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700">
                          {slug}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
