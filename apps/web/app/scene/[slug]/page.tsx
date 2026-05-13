import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ListChecks, TriangleAlert } from "lucide-react";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import CompareToolsGrid from "@/src/app/components/CompareToolsGrid";
import { fetchDirectory } from "@/src/app/lib/catalog-api";
import { getTaskScene } from "@/src/app/lib/task-scenes";
import { withPublicPath } from "@/src/app/lib/public-path";
import type { CompareToolsSection } from "@/src/app/components/CompareToolsGrid";

interface SceneRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: SceneRouteProps) {
  const { slug } = await params;
  const scene = getTaskScene(slug);
  if (!scene) notFound();

  const search = new URLSearchParams({
    mode: "search",
    q: scene.searchQuery,
    page: "1",
    page_size: "6",
  });
  const directory = await fetchDirectory(search.toString()).catch(() => null);
  const tools = directory?.items ?? [];
  const toolSearchHref = withPublicPath(`/tools?mode=search&q=${encodeURIComponent(scene.searchQuery)}&page=1&page_size=24`);

  const compareSections: CompareToolsSection[] = [
    {
      id: "scene-tools",
      title: "这个场景可以先看这些工具",
      items: tools.slice(0, 3),
      emptyTitle: "工具推荐还在补充",
      emptyDescription: "可以先进入完整工具库，用当前场景关键词继续筛选。",
    },
    {
      id: "scene-alternatives",
      title: "备选工具",
      items: tools.slice(3, 6),
      emptyTitle: "备选工具暂缺",
      emptyDescription: "后续会补充更多同类替代工具。",
    },
  ];

  return (
    <div className="page-shell">
      <Header currentPath={`/scene/${slug}`} currentRoute={`/scene/${slug}`} />
      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "任务场景", href: "/search" }, { label: scene.title }]} />

          <section className="overflow-hidden rounded-[32px] border border-slate-900 bg-[#05070f] p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] md:p-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-100">
              <ListChecks className="h-3.5 w-3.5" />
              场景拆解
            </p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{scene.title}</h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">{scene.description}</p>
              </div>
              <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                  <TriangleAlert className="h-4 w-4" />
                  常见误区
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-100">{scene.warning}</p>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {scene.steps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">步骤 {index + 1}</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{step.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.body}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">下一步看二级任务</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">先选具体分支，再进入工具推荐列表，最后才看工具详情。</p>
              </div>
              <Link href={toolSearchHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                查看推荐工具
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {scene.next.map((item) => (
                <Link key={item} href={withPublicPath(`/tools?mode=search&q=${encodeURIComponent(item)}&page=1&page_size=24`)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white">
                  {item}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <CompareToolsGrid sections={compareSections} rememberDetailNavigation />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
