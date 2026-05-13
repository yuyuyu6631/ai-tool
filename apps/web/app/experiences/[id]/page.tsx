import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bookmark, CheckCircle2, Eye, Heart, Calendar, TriangleAlert, User } from "lucide-react";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import { getPostById, EXPERIENCE_CHANNELS } from "@/src/app/lib/experience-community";
import { withPublicPath } from "@/src/app/lib/public-path";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const post = getPostById(id);
  if (!post) notFound();

  const channel = EXPERIENCE_CHANNELS.find((c) => c.title === post.channel);

  return (
    <div className="page-shell">
      <Header currentPath="/experiences" currentRoute={`/experiences/${id}`} forceHomeHeader />
      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "经验社区", href: "/experiences" }, { label: post.title }]} />

          <section className="hero-brand-panel rounded-[32px] p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent)]">{post.channel}</span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{post.scenario}</span>
              {post.isOfficial && <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[#1D1608]">官方精选</span>}
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 md:text-4xl">{post.title}</h1>
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tools.map((tool) => (
                <span key={tool} className="token-tag rounded-full px-3 py-1 text-xs font-medium">{tool}</span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {post.roles.map((role) => (
                <span key={role} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{role}</span>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <article className="surface-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-slate-950">内容摘要</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{post.summary}</p>
              </article>

              <article className="surface-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-slate-950">可复用结论</h2>
                <ul className="mt-4 grid gap-3 md:grid-cols-3">
                  {post.takeaways.map((item) => (
                    <li key={item} className="rounded-xl border border-[var(--color-accent-border)] bg-[var(--accent-soft)] px-4 py-3 text-sm leading-6 text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="surface-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-slate-950">实操流程</h2>
                <ol className="mt-4 space-y-3">
                  {post.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-7 text-slate-600">
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-[#1D1608]">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </article>

              <article className="surface-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-slate-950">避坑提醒</h2>
                <ul className="mt-4 space-y-3">
                  {post.pitfalls.map((pitfall) => (
                    <li key={pitfall} className="flex gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-3 text-sm leading-6 text-slate-600">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                      <span>{pitfall}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="surface-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-slate-950">发布信息</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600"><User className="h-4 w-4 text-slate-400" />{post.author}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Calendar className="h-4 w-4 text-slate-400" />{post.publishedAt}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Eye className="h-4 w-4 text-slate-400" />{post.views} 次浏览</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Heart className="h-4 w-4 text-slate-400" />{post.likes} 点赞</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Bookmark className="h-4 w-4 text-slate-400" />{post.favorites} 收藏</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />已关联任务与工具</div>
                </div>
              </article>

              <article className="surface-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-slate-950">关联工具</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tools.map((tool) => (
                    <Link key={tool} href={withPublicPath(`/tools/${encodeURIComponent(tool)}`)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[var(--color-accent-border)] hover:text-[var(--color-accent)]">{tool}</Link>
                  ))}
                </div>
              </article>
            </div>

            <aside className="space-y-6">
              {channel && (
                <div className="surface-card rounded-2xl p-5">
                  <p className="text-xs font-semibold text-[var(--color-accent)]">{channel.count} 条内容</p>
                  <h3 className="mt-2 text-base font-semibold text-slate-950">{channel.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{channel.description}</p>
                </div>
              )}
              <div className="surface-card rounded-2xl p-5">
                <Link href={withPublicPath("/experiences")} className="btn-token-accent flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                  <ArrowLeft className="h-4 w-4" />
                  去经验社区
                </Link>
              </div>
            </aside>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
