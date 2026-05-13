import Link from "next/link";
import { ArrowRight, Mic, Search, Sparkles } from "lucide-react";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import { inferTaskScenes, TASK_SCENES } from "@/src/app/lib/task-scenes";
import { withPublicPath } from "@/src/app/lib/public-path";

interface SearchRouteProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : "";
}

export default async function Page({ searchParams }: SearchRouteProps) {
  const params = await searchParams;
  const task = readValue(params.task).trim();
  const scenes = task ? inferTaskScenes(task) : TASK_SCENES.slice(0, 6);

  return (
    <div className="page-shell">
      <Header currentPath="/search" currentRoute={`/search${task ? `?task=${encodeURIComponent(task)}` : ""}`} />
      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "任务场景" }]} />

          <section className="hero-brand-panel overflow-hidden rounded-[32px] p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div>
                <p className="hero-kicker inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  语义搜索
                </p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
                  {task ? `我理解你要做：${task}` : "把任务说清楚，再看工具"}
                </h1>
                <p className="hero-subtitle mt-4 max-w-3xl text-sm leading-7 md:text-base">
                  这里不直接丢工具详情。先判断任务类型、拆步骤，再进入对应场景页和推荐列表。
                </p>
              </div>

              <form action={withPublicPath("/tools")} className="hero-search-panel rounded-2xl p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    type="search"
                    defaultValue={task}
                    data-global-search-target="search"
                    placeholder="比如：小红书封面图 / 课程汇报 PPT / Python 报错"
                    className="hero-search-input h-12 w-full rounded-xl pl-10 pr-3 text-sm outline-none"
                  />
                  <input type="hidden" name="mode" value="ai" />
                  <input type="hidden" name="page" value="1" />
                  <input type="hidden" name="page_size" value="24" />
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="submit" className="hero-search-button inline-flex h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold">
                    重新拆一下
                  </button>
                  <button type="button" className="hero-ghost-button inline-flex h-11 w-11 items-center justify-center rounded-xl" aria-label="语音输入占位">
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              {scenes.map((scene) => (
                <Link key={scene.slug} href={withPublicPath(`/scene/${scene.slug}`)} className="surface-card group block rounded-2xl p-5 transition hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">推荐场景</p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-950">{scene.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{scene.warning}</p>
                    </div>
                    <ArrowRight className="mt-2 h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {scene.next.map((item) => (
                      <span key={item} className="token-tag rounded-full px-3 py-1.5 text-xs font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>

            <aside className="surface-card rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-slate-950">搜索页只做一件事</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>01 先理解你要完成什么任务。</p>
                <p>02 拆成几个真实步骤，避免一上来乱选工具。</p>
                <p>03 再进入场景页，看工具推荐和避坑。</p>
              </div>
              <Link href={withPublicPath(task ? `/tools?mode=ai&q=${encodeURIComponent(task)}&page=1&page_size=24` : "/tools?mode=ai&page=1&page_size=24")} className="btn-token-neutral mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition">
                进入统一搜索结果
              </Link>
            </aside>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
