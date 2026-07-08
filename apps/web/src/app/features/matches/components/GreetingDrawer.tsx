"use client";

import { useEffect } from "react";
import { Heart, X } from "lucide-react";
import type { ResolvedMatchProfile } from "../types";

interface GreetingDrawerProps {
  open: boolean;
  profile: ResolvedMatchProfile | null;
  hasProfileDraft: boolean;
  isFavorite: boolean;
  onClose: () => void;
  onFavorite: () => void;
}

export default function GreetingDrawer({
  open,
  profile,
  hasProfileDraft,
  isFavorite,
  onClose,
  onFavorite,
}: GreetingDrawerProps) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open || !profile) {
    return null;
  }

  const drawerTitle = hasProfileDraft ? "找到一个和你工具节奏接近的人" : "先从这个聊点开始，看看是否同频";
  const chipTitle = hasProfileDraft ? "共同工具" : "推荐聊点";
  const chips = hasProfileDraft && profile.sharedTools.length > 0 ? profile.sharedTools : profile.recommendationTools;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:p-6" aria-hidden={false}>
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
        onClick={onClose}
        aria-label="关闭同频弹层"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="matches-drawer-title"
        className="panel-base relative z-10 w-full max-w-3xl rounded-[32px] p-6 md:p-8"
        data-testid="greeting-drawer"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Match Signal</p>
            <h2 id="matches-drawer-title" className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
              {drawerTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {profile.name} 这张卡片不会直接跳到聊天页，你可以先收藏到本地，等聊天功能开放后再回来继续。
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-white/70 text-slate-700 transition hover:bg-white"
            aria-label="关闭"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-[24px] border border-white/45 bg-white/65 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{chipTitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((item) => (
                <span key={item} className="tag-muted rounded-full px-3 py-1 text-xs font-medium">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] bg-slate-950 px-4 py-4 text-sm leading-7 text-slate-50">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">系统推荐开场白</p>
              <p className="mt-3">{profile.introPrompt}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/45 bg-white/55 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">下一步</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">先把这个搭子放进本地收藏夹，后续聊天、约讨论串和共同任务入口会在这里补上。</p>
            <button
              type="button"
              onClick={onFavorite}
              className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <Heart className="h-4 w-4" />
              {isFavorite ? "已收藏到本地" : "收藏这个搭子"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary mt-3 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-medium">
              继续看下一个
            </button>
            <p className="mt-4 text-xs leading-6 text-slate-500">聊天功能即将开放。当前版本不会发送消息，也不会上传你的本地名片数据。</p>
          </div>
        </div>
      </section>
    </div>
  );
}
