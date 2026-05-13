import Link from "next/link";
import { ArrowRight, MessageSquareText, PenLine, Sparkles } from "lucide-react";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import { EXPERIENCE_CHANNELS, EXPERIENCE_POSTS } from "@/src/app/lib/experience-community";
import { withPublicPath } from "@/src/app/lib/public-path";

export default function Page() {
  return (
    <div className="page-shell">
      <Header currentPath="/experiences" currentRoute="/experiences" />
      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "经验社区" }]} />

          <section className="hero-brand-panel rounded-[32px] p-6 md:p-8">
            <p className="hero-kicker inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <MessageSquareText className="h-3.5 w-3.5" />
              经验社区
            </p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">看别人怎么把 AI 工具用到任务里</h1>
                <p className="hero-subtitle mt-4 max-w-3xl text-sm leading-7 md:text-base">
                  这里是星点评的论坛版块：围绕任务场景沉淀经验帖、教程、避坑反馈和工具组合，而不是只堆工具卡片。
                </p>
              </div>
              <div className="hero-search-panel rounded-2xl p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  发布经验
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  后续接入登录发布和审核流。当前先提供社区结构、内容样例和任务入口，避免页面空置。
                </p>
                <Link href={withPublicPath("/scenarios")} className="btn-token-primary mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold">
                  先从任务场景进入
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {EXPERIENCE_CHANNELS.map((channel) => (
              <article key={channel.title} className="surface-card rounded-2xl p-5">
                <p className="text-xs font-semibold text-blue-600">{channel.count} 条内容</p>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">{channel.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{channel.description}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              {EXPERIENCE_POSTS.map((post) => (
                <article key={post.title} className="surface-card rounded-2xl p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{post.channel}</span>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{post.scenario}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-950">{post.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{post.summary}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <p>{post.author} · {post.stats}</p>
                    <p>工具：{post.tools.join(" / ")}</p>
                  </div>
                </article>
              ))}
            </div>

            <aside className="surface-card h-fit rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <PenLine className="h-4 w-4 text-blue-600" />
                社区不是单独的论坛孤岛
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                每篇经验都要关联任务场景和工具，让用户能从“我要完成什么任务”一路走到“别人怎么做”和“我该试哪个工具”。
              </p>
              <Link href={withPublicPath("/tools?mode=search&page=1&page_size=24")} className="btn-token-neutral mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                去工具库交叉验证
                <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
