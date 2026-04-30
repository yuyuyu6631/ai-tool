"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth/AuthProvider";
import {
  fetchMyToolReview,
  fetchToolReviews,
  saveMyToolReview,
} from "../lib/catalog-api";
import type {
  ToolRatingSummary,
  ToolReviewItem,
  ToolReviewsResponse,
} from "../lib/catalog-types";

interface ToolReviewsPanelProps {
  toolSlug: string;
  reviews: ToolReviewsResponse | null;
  summary: ToolRatingSummary | null;
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function StarRating({
  rating,
  className = "",
}: {
  rating: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`h-4 w-4 ${star <= rating ? "text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

export default function ToolReviewsPanel({
  toolSlug,
  reviews,
  summary,
}: ToolReviewsPanelProps) {
  const { currentUser, status } = useAuth();
  const [myReview, setMyReview] = useState<ToolReviewItem | null>(null);
  const [rating, setRating] = useState("5");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentReviews, setCurrentReviews] =
    useState<ToolReviewsResponse | null>(reviews);

  useEffect(() => {
    setCurrentReviews(reviews);
  }, [reviews]);

  useEffect(() => {
    if (reviews) {
      return;
    }

    let active = true;
    void fetchToolReviews(toolSlug)
      .then((nextReviews) => {
        if (active) {
          setCurrentReviews(nextReviews);
        }
      })
      .catch(() => {
        if (active) {
          setCurrentReviews(null);
        }
      });

    return () => {
      active = false;
    };
  }, [reviews, toolSlug]);

  useEffect(() => {
    if (!currentUser) {
      setMyReview(null);
      return;
    }

    void fetchMyToolReview(toolSlug).then((review) => {
      if (!review) return;
      setMyReview(review);
      setRating(String(review.rating || 5));
      setTitle(review.title);
      setBody(review.body);
    });
  }, [currentUser, toolSlug]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const saved = await saveMyToolReview(toolSlug, {
        rating: Number(rating),
        title,
        body,
      });
      setMyReview(saved);
      const nextReviews = await fetchToolReviews(toolSlug);
      setCurrentReviews(nextReviews);
      setMessage("评论已发布");

      // Auto clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage("提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  const editorReviews = currentReviews?.editorReviews ?? [];
  const userReviews = currentReviews?.userReviews ?? [];
  const displaySummary = currentReviews?.summary ?? summary ?? reviews?.summary;
  const reviewCount = displaySummary?.reviewCount ?? 0;
  const averageRating = displaySummary?.average ?? 0;

  return (
    <div className="panel-base relative overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-sm sm:p-8">
      {/* 顶部总体评分卡片 */}
      <div className="flex flex-col gap-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 md:flex-row md:items-center">
        <div className="flex flex-col items-center justify-center md:w-1/3 md:border-r md:border-slate-200/60">
          <div className="text-5xl font-bold tracking-tight text-slate-900">
            {averageRating ? averageRating.toFixed(1) : "0.0"}
          </div>
          <StarRating
            rating={Math.round(averageRating)}
            className="mt-3 mb-1 [&>svg]:h-5 [&>svg]:w-5"
          />
          <p className="text-sm text-slate-500">基于 {reviewCount} 条评价</p>
        </div>

        {displaySummary ? (
          <div className="flex-1 space-y-2.5">
            {[5, 4, 3, 2, 1].map((score) => {
              const count = displaySummary.ratingDistribution[score] || 0;
              const percentage =
                reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
              return (
                <div key={score} className="flex items-center text-sm">
                  <div className="flex w-12 items-center justify-end gap-1.5 text-slate-600">
                    <span className="font-medium">{score}</span>
                    <StarIcon className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="mx-4 flex h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="rounded-full bg-amber-400 transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 tabular-nums text-slate-500">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {editorReviews.length > 0 ? (
        <div className="mt-10">
          <div className="mb-6 flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">编辑评测</h3>
            <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {editorReviews.length}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {editorReviews.map((review) => (
              <article
                key={review.id}
                className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:bg-slate-50/50"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                        Ed
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        专业编辑
                      </span>
                    </div>
                    <StarRating rating={review.rating ?? 5} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    {review.title}
                  </h4>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600 line-clamp-3">
                    {review.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-10">
        <div className="mb-6 flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-900">用户评论</h3>
          <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {userReviews.length}
          </span>
        </div>

        <div className="space-y-4">
          {userReviews.length > 0 ? (
            userReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-slate-200/60 bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 uppercase">
                      {(review.author?.username || "U").charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {review.author?.username || "匿名用户"}
                      </div>
                      <div className="mt-0.5">
                        <StarRating
                          rating={review.rating ?? 5}
                          className="[&>svg]:h-3.5 [&>svg]:w-3.5"
                        />
                      </div>
                    </div>
                  </div>
                  {/* 可选：添加时间显示 */}
                  <span className="text-xs text-slate-400">最近评价</span>
                </div>
                <h4 className="mt-2 text-base font-semibold text-slate-900">
                  {review.title}
                </h4>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                  {review.body}
                </p>
              </article>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12">
              <div className="mb-3 rounded-full bg-slate-100 p-3">
                <svg
                  className="h-6 w-6 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-900">
                期待你的真实评价
              </p>
              <p className="mt-1 text-xs text-slate-500">
                暂时还没有用户发布评论，来做第一个吧。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 评论发布表单区 */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">
            {myReview ? "更新你的评价" : "写下你的评价"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            分享你的使用体验，帮助更多人选择合适的工具。
          </p>
        </div>

        <div className="p-6">
          {status !== "authenticated" || !currentUser ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8">
              <p className="text-sm text-slate-600">需要登录后才能分享评价</p>
              <Link
                href={`/auth?next=${encodeURIComponent(`/tools/${toolSlug}`)}`}
                className="mt-4 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                立即登录
              </Link>
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="mb-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    推荐指数
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(String(value))}
                        aria-label={`推荐指数 ${value} 星`}
                        className={`group p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full`}
                      >
                        <StarIcon
                          className={`h-8 w-8 ${value <= Number(rating) ? "text-amber-400" : "text-slate-200 group-hover:text-amber-200"} transition-colors`}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-sm font-medium text-amber-500">
                      {rating === "5"
                        ? "极力推荐"
                        : rating === "4"
                          ? "值得一试"
                          : rating === "3"
                            ? "一般般"
                            : rating === "2"
                              ? "不太推荐"
                              : rating === "1"
                                ? "不推荐"
                                : ""}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="review-title"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    一句话概括
                  </label>
                  <input
                    id="review-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="例如：提升效率的神器，但价格略高"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="review-body"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    详细体验
                  </label>
                  <textarea
                    id="review-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="分享一下你的使用场景、这个工具解决了什么问题、有哪些优点或坑..."
                    rows={4}
                    required
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <div className="flex items-center">
                  {message ? (
                    <span
                      className={`text-sm font-medium ${message.includes("失败") ? "text-red-500" : "text-emerald-500"}`}
                    >
                      {message}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      请保持客观、真实、友善
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      提交中...
                    </span>
                  ) : myReview ? (
                    "更新评价"
                  ) : (
                    "发布评价"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
