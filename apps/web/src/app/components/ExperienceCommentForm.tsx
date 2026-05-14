"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { useAuth } from "./auth/AuthProvider";
import { saveExperienceComment } from "../lib/catalog-api";
import type { ExperienceCommentItem } from "../lib/catalog-types";
import { withPublicPath } from "../lib/public-path";

interface ExperienceCommentFormProps {
  postSlug: string;
}

export default function ExperienceCommentForm({ postSlug }: ExperienceCommentFormProps) {
  const { currentUser, status } = useAuth();
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [comments, setComments] = useState<ExperienceCommentItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const comment = await saveExperienceComment(postSlug, { body: trimmed, imageUrl: imageUrl.trim() });
      setComments((current) => [...current, comment]);
      setBody("");
      setImageUrl("");
      setMessage("评论已发布");
    } catch {
      setMessage("发布失败，请确认已登录且图片 URL 可访问。");
    } finally {
      setSubmitting(false);
    }
  }

  if (status !== "authenticated" || !currentUser) {
    return (
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-5">
        <p className="text-sm font-semibold text-slate-950">登录后参与讨论</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">社区评论会沉淀在经验帖下，方便其他用户继续补充图片、过程和避坑点。</p>
        <a href={withPublicPath(`/auth?next=/experiences/${postSlug}`)} className="btn-token-accent mt-4 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold">
          去登录
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-strong)] p-4">
        <label className="text-sm font-semibold text-slate-950" htmlFor="experience-comment-body">参与讨论</label>
        <textarea
          id="experience-comment-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="补充你的使用过程、截图说明或避坑建议"
          className="mt-3 min-h-28 w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-accent-border)]"
        />
        <input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="可选：粘贴一张图片 URL"
          className="mt-3 h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-accent-border)]"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">{message || `以 ${currentUser.username} 身份发布`}</p>
          <button type="submit" disabled={!body.trim() || submitting} className="btn-token-accent inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
            <Send className="h-4 w-4" />
            {submitting ? "发布中" : "发布评论"}
          </button>
        </div>
      </form>

      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <p className="text-sm font-semibold text-slate-950">{comment.author.username}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{comment.body}</p>
              {comment.imageUrl ? (
                <div className="community-comment-image mt-3">
                  <img src={withPublicPath(comment.imageUrl)} alt="" className="community-media-image" loading="lazy" />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
