import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import { fetchScenarioDetail } from "@/src/app/lib/catalog-api";

export const dynamic = "force-dynamic";

interface ScenarioRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: ScenarioRouteProps) {
  const { slug } = await params;
  const scenario = await fetchScenarioDetail(slug);

  if (!scenario) {
    notFound();
  }

  return (
    <div className="page-shell">
      <Header />

      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "首页", href: "/" },
              { label: "场景", href: "/scenarios" },
              { label: scenario.title },
            ]}
          />

          <section className="panel-base rounded-[32px] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Scenario</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">{scenario.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">{scenario.description}</p>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="panel-base rounded-[28px] p-6">
              <h2 className="text-xl font-semibold text-slate-900">核心问题</h2>
              <p className="mt-4 text-sm leading-8 text-slate-700">{scenario.problem}</p>
            </div>

            <aside className="space-y-6">
              <div className="panel-base rounded-[28px] p-5">
                <h2 className="text-lg font-semibold text-slate-900">优先工具</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {scenario.primaryTools.length > 0 ? (
                    scenario.primaryTools.map((toolSlug) => (
                      <Link
                        key={toolSlug}
                        href={`/tools/${toolSlug}`}
                        className="rounded-full bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700"
                      >
                        {toolSlug}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">暂无已发布工具。</p>
                  )}
                </div>
              </div>

              <div className="panel-base rounded-[28px] p-5">
                <h2 className="text-lg font-semibold text-slate-900">备选工具</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {scenario.alternativeTools.length > 0 ? (
                    scenario.alternativeTools.map((toolSlug) => (
                      <Link
                        key={toolSlug}
                        href={`/tools/${toolSlug}`}
                        className="rounded-full bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700"
                      >
                        {toolSlug}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">暂无备选工具。</p>
                  )}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
