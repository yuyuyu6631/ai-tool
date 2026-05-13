import Link from "next/link";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import { TASK_SCENARIOS } from "@/src/app/lib/task-scenarios";
import { withPublicPath } from "@/src/app/lib/public-path";

export default function Page() {
  return (
    <div className="page-shell">
      <Header currentPath="/tasks" currentRoute="/tasks" forceHomeHeader />

      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "任务场景" }]} />

          <section className="hero-brand-panel rounded-lg p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">任务场景</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">按任务找 AI 经验和工具</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              围绕具体任务场景，聚合经验帖、适用工具和免费福利
            </p>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {TASK_SCENARIOS.map((scenario) => (
              <Link
                key={scenario.slug}
                href={withPublicPath(`/scenarios/${scenario.slug}`)}
                className="group surface-card rounded-lg p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-lg font-bold text-[var(--color-accent)]">
                    {scenario.icon}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-950">{scenario.name}</h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{scenario.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {scenario.subtasks.slice(0, 3).map((sub) => (
                    <span key={sub} className="task-chip">{sub}</span>
                  ))}
                </div>
                <p className="mt-3 text-xs font-medium text-slate-500">{scenario.relatedToolSlugs.length} 个关联工具</p>
              </Link>
            ))}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
