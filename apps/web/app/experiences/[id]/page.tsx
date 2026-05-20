/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bookmark, Eye, Heart, MessageCircle, Star, User } from "lucide-react";
import Header from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import ExperienceCommentForm from "@/src/app/components/ExperienceCommentForm";
import { fetchExperienceComments, fetchExperiencePost } from "@/src/app/lib/catalog-api";
import { withPublicPath } from "@/src/app/lib/public-path";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(value?: string | null) {
  if (!value) return "刚刚";
  return value.slice(0, 10);
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const post = await fetchExperiencePost(id);
  if (!post) notFound();
  const comments = await fetchExperienceComments(id);

  return (
    <div className="page-shell">
      <Header currentPath="/experiences" currentRoute={`/experiences/${id}`} forceHomeHeader />
      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "经验社区", href: "/experiences" }, { label: post.title }]} />

          <section className="community-detail-hero grid overflow-hidden rounded-[32px] lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent)]">{post.channel}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{post.boardTitle}</span>
                {post.isOfficial ? <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[#1D1608]">官方精选</span> : null}
              </div>
              <h1 className="mt-5 max-w-4xl text-2xl font-semibold tracking-tight text-slate-950 md:text-5xl">{post.title}</h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">{post.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {post.tools.map((tool) => (
                  <span key={tool} className="token-tag rounded-full px-3 py-1 text-xs font-medium">{tool}</span>
                ))}
              </div>
            </div>
            <div className="relative min-h-72 overflow-hidden">
              <img
                src={withPublicPath(post.coverImageUrl || "/brand/logo.png")}
                alt=""
                className="community-media-image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <article className="surface-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-slate-950">正文</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-600">{post.body || post.summary}</p>
              </article>

              {post.imageUrls.length > 0 ? (
                <article className="surface-card rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-slate-950">图片参考</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {post.imageUrls.map((url) => (
                      <div key={url} className="community-gallery-frame">
                        <img src={withPublicPath(url)} alt="" className="community-media-image" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              <article className="surface-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-slate-950">讨论</h2>
                <div className="mt-4 space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-strong)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-950">{comment.author.username}</p>
                        <span className="text-xs text-slate-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{comment.body}</p>
                      {comment.imageUrl ? (
                        <div className="community-comment-image">
                          <img src={withPublicPath(comment.imageUrl)} alt="" className="community-media-image" loading="lazy" />
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {comments.length === 0 ? <p className="text-sm text-slate-500">还没有讨论，登录后补充你的经验。</p> : null}
                </div>
                <div className="mt-5">
                  <ExperienceCommentForm postSlug={post.slug} />
                </div>
              </article>
            </div>

            <aside className="space-y-6">
              <div className="surface-card rounded-2xl p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Star className="h-4 w-4 text-[var(--color-accent)]" />
                  发布信息
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" />{post.author.username}</div>
                  <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-slate-400" />{post.viewCount} 次浏览</div>
                  <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-slate-400" />{post.likeCount} 点赞</div>
                  <div className="flex items-center gap-2"><Bookmark className="h-4 w-4 text-slate-400" />{post.favoriteCount} 收藏</div>
                  <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-slate-400" />{post.commentCount} 条讨论</div>
                </div>
              </div>
              <div className="surface-card rounded-2xl p-5">
                <Link href="/experiences" className="btn-token-accent flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
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
