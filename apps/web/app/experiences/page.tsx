import Link from "next/link";
import { ArrowRight, Bookmark, Eye, Heart, MessageCircle, MessageSquareText, Radio, Sparkles, Star, type LucideIcon } from "lucide-react";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import { fetchExperiences } from "@/src/app/lib/catalog-api";
import type { ExperiencePostItem } from "@/src/app/lib/catalog-types";
import { EXPERIENCE_CHANNELS } from "@/src/app/lib/experience-community";
import { withPublicPath } from "@/src/app/lib/public-path";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}

function buildCommunityHref(next: { channel?: string | null; board?: string | null }) {
  const params = new URLSearchParams();
  if (next.channel) params.set("channel", next.channel);
  if (next.board) params.set("board", next.board);
  const query = params.toString();
  return withPublicPath(`/experiences${query ? `?${query}` : ""}`);
}

function formatDate(value?: string | null) {
  if (!value) return "刚刚";
  return value.slice(0, 10);
}

function StatBadge({ icon: Icon, value }: { icon: LucideIcon; value: number }) {
  return <span className="inline-flex items-center gap-1"><Icon className="h-3 w-3" />{value}</span>;
}

function ExperienceCard({ post }: { post: ExperiencePostItem }) {
  return (
    <Link href={withPublicPath(`/experiences/${post.slug}`)} className="community-post-card group grid overflow-hidden rounded-[22px] transition md:grid-cols-[216px_minmax(0,1fr)]">
      <div className="community-post-cover relative min-h-44 overflow-hidden md:min-h-full">
        <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url("${withPublicPath(post.coverImageUrl || "/brand/logo.png")}")` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/88 px-2.5 py-1 text-xs font-semibold text-slate-950">{post.boardTitle}</span>
      </div>
      <div className="min-w-0 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent)]">{post.channel}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{post.scenario || "任务经验"}</span>
          {post.isOfficial ? <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[#1D1608]"><Star className="h-3 w-3" />官方精选</span> : null}
        </div>
        <h2 className="mt-3 text-xl font-semibold leading-snug text-slate-950">{post.title}</h2>
        <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-600">{post.summary}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tools.slice(0, 4).map((tool) => <span key={tool} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">{tool}</span>)}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>{post.author.username} · {formatDate(post.publishedAt)}</span>
          <span className="flex items-center gap-3">
            <StatBadge icon={Eye} value={post.viewCount} />
            <StatBadge icon={Heart} value={post.likeCount} />
            <StatBadge icon={Bookmark} value={post.favoriteCount} />
            <StatBadge icon={MessageCircle} value={post.commentCount} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeChannel = readValue(params.channel) || "";
  const activeBoard = readValue(params.board) || "";
  const query = new URLSearchParams();
  if (activeChannel) query.set("channel", activeChannel);
  if (activeBoard) query.set("board", activeBoard);

  const community = await fetchExperiences(query.toString());
  const hotPost = community.items[0];
  const imagePostCount = community.items.filter((item) => item.coverImageUrl || item.imageUrls.length > 0).length;

  return (
    <div className="page-shell">
      <Header currentPath="/experiences" currentRoute="/experiences" forceHomeHeader />
      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "经验社区" }]} />

          <section className="community-hero relative overflow-hidden rounded-[32px] p-6 md:p-8">
            <div className="community-broadcast-grid" aria-hidden="true" />
            <div className="community-broadcast-beam community-broadcast-beam--one" aria-hidden="true" />
            <div className="community-broadcast-beam community-broadcast-beam--two" aria-hidden="true" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p className="hero-kicker inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  经验社区
                </p>
                <h1 className="mt-8 max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">看别人怎么把 AI 工具用到任务里</h1>
                <div className="mt-6 grid max-w-3xl gap-3 text-sm md:grid-cols-3">
                  <div className="community-signal-pill"><Radio className="h-4 w-4" />今日讨论 {community.total}</div>
                  <div className="community-signal-pill"><Sparkles className="h-4 w-4" />图片帖 {imagePostCount}</div>
                  <div className="community-signal-pill"><MessageCircle className="h-4 w-4" />互动 {community.items.reduce((sum, post) => sum + post.commentCount, 0)}</div>
                </div>
              </div>
              <div className="community-live-panel rounded-2xl p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)]">
                  <Star className="h-4 w-4" />
                  社区广播
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {hotPost ? `热帖：${hotPost.title}` : "社区正在补充新的任务经验。"}
                </p>
                <Link href={withPublicPath("/auth?next=/experiences")} className="btn-token-accent mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold">
                  登录后发布经验
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {community.boards.map((board) => (
              <Link
                key={board.slug}
                href={buildCommunityHref({ channel: activeChannel, board: board.slug })}
                className={`community-board-card rounded-2xl p-5 ${activeBoard === board.slug ? "is-active" : ""}`}
              >
                <p className="text-xs font-semibold text-[var(--color-accent)]">{board.postCount} 条内容</p>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">{board.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{board.description}</p>
              </Link>
            ))}
          </section>

          <section className="mt-6 flex flex-wrap items-center gap-2" aria-label="经验社区筛选">
            <Link href={buildCommunityHref({ board: activeBoard })} className={`token-tag ${!activeChannel ? "token-tag--active" : ""}`}>全部</Link>
            {EXPERIENCE_CHANNELS.map((tab) => (
              <Link key={tab} href={buildCommunityHref({ channel: tab, board: activeBoard })} className={`token-tag ${activeChannel === tab ? "token-tag--active" : ""}`}>
                {tab}
              </Link>
            ))}
          </section>

          <section className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              {community.items.map((post) => <ExperienceCard key={post.slug} post={post} />)}
            </div>

            <aside className="surface-card h-fit rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Star className="h-4 w-4 text-[var(--color-accent)]" />
                像贴吧一样讨论任务
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                每篇经验都关联板块、任务和工具，支持图文展示与评论交流。先看别人怎么做，再决定自己该试哪个工具。
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
