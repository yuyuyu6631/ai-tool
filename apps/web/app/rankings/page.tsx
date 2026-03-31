import Link from "next/link";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import ToolCard from "@/src/app/components/ToolCard";
import { fetchRankings } from "@/src/app/lib/catalog-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  const rankings = await fetchRankings().catch(() => []);

  return (
    <div className="page-shell">
      <Header />

      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "榜单" }]} />

          <section className="panel-base rounded-[32px] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Rankings</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">工具榜单</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              榜单内容直接来自数据库和 API，页面不再依赖本地演示数据。
            </p>
          </section>

          {rankings.length === 0 ? (
            <section className="panel-base mt-6 rounded-[28px] p-8 text-center">
              <h2 className="text-xl font-semibold text-slate-900">暂无可展示榜单</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">当前没有已发布的榜单内容，稍后再试。</p>
              <Link href="/tools" className="btn-primary mt-5 inline-flex rounded-full px-5 py-3 text-sm font-medium">
                返回工具目录
              </Link>
            </section>
          ) : (
            <div className="mt-6 space-y-6">
              {rankings.map((ranking) => (
                <section key={ranking.slug} className="panel-base rounded-[28px] p-5 md:p-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-950">{ranking.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{ranking.description}</p>
                    </div>
                    <p className="text-sm text-slate-500">{ranking.items.length} 个工具</p>
                  </div>

                  {ranking.items.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">该榜单下当前没有可展示工具。</p>
                  ) : (
                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {ranking.items.map((item) => (
                        <div key={`${ranking.slug}-${item.rank}-${item.tool.slug}`}>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            TOP {item.rank}
                          </p>
                          <ToolCard
                            slug={item.tool.slug}
                            name={item.tool.name}
                            summary={item.tool.summary}
                            tags={item.tool.tags}
                            url={item.tool.officialUrl}
                            logoPath={item.tool.logoPath}
                            status={item.tool.status}
                          />
                          <p className="mt-3 text-sm leading-6 text-slate-600">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
