"use client";

import { Link } from "next-view-transitions";
import { ArrowRight, ExternalLink, Sparkles, UsersRound, WalletCards } from "lucide-react";
import type { AccessFlags, ToolMediaItem } from "../lib/catalog-types";
import { repairDisplayList, repairDisplayText } from "../lib/catalog-utils";
import { buildAccessBadgeMeta, getAccessBadgeClassName, getScoreBadge } from "../lib/tool-display";
import ToolLogo from "./ToolLogo";

interface ToolCardProps {
  slug: string;
  name: string;
  summary: string;
  category?: string;
  tags: string[];
  url: string;
  logoPath?: string | null;
  score: number;
  reviewCount?: number;
  accessFlags?: AccessFlags | null;
  priceLabel?: string | null;
  decisionBadges?: string[];
  compareSelected?: boolean;
  compareDisabled?: boolean;
  onCompareToggle?: (() => void) | undefined;
  onDetailClick?: (() => void) | undefined;
  reason?: string | null;
  features?: string[];
  limitations?: string[];
  bestFor?: string[];
  dealSummary?: string;
  primaryMedia?: ToolMediaItem | null;
}

const PRICE_TYPE_LABELS: Record<string, string> = {
  free: "免费",
  freemium: "免费增值",
  subscription: "订阅制",
  "one-time": "一次性付费",
  contact: "联系销售",
};

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const repaired = repairDisplayText(value, "");
    if (repaired) return repaired;
  }
  return "待补充";
}

export default function ToolCard({
  slug,
  name,
  summary,
  tags,
  url,
  logoPath = null,
  score,
  reviewCount = 0,
  accessFlags = null,
  priceLabel = null,
  decisionBadges = [],
  compareSelected = false,
  compareDisabled = false,
  onCompareToggle,
  onDetailClick,
  reason = null,
  features = [],
  bestFor = [],
  dealSummary = "",
}: ToolCardProps) {
  const displayName = repairDisplayText(name, slug);
  const displaySummary = repairDisplayText(summary, "一句话介绍待补充");
  const displayTags = repairDisplayList(tags, 3);
  const displayFeatures = repairDisplayList(features, 2);
  const displayBestFor = repairDisplayList(bestFor, 2);
  const sceneItems = displayBestFor.length > 0 ? displayBestFor : displayTags.slice(0, 2);
  const featureItems = displayFeatures.length > 0 ? displayFeatures : decisionBadges.map((item) => repairDisplayText(item, "")).filter(Boolean).slice(0, 2);
  const priceDisplay = priceLabel && PRICE_TYPE_LABELS[priceLabel] ? PRICE_TYPE_LABELS[priceLabel] : repairDisplayText(priceLabel, "");
  const dealText = firstNonEmpty(dealSummary, priceDisplay ? `${priceDisplay}，具体额度待核验` : "价格信息待补充");
  const scoreBadge = getScoreBadge(reviewCount, Number.isFinite(score) ? score : 0);
  const accessBadges = buildAccessBadgeMeta(accessFlags);
  const reasonText = repairDisplayText(reason, "");

  return (
    <article className="card-base card-interactive flex h-full min-h-[360px] flex-col rounded-lg p-4" data-testid="tool-card">
      {onCompareToggle ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onCompareToggle}
            disabled={!compareSelected && compareDisabled}
            aria-pressed={compareSelected}
            title={compareDisabled ? "最多可选 3 个工具" : undefined}
            className={`rounded px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
              compareSelected
                ? "bg-slate-950 text-white"
                : compareDisabled
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {compareSelected ? "已加入对比" : "加入对比"}
          </button>
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <div style={{ viewTransitionName: `tool-logo-${slug}` }}>
          <ToolLogo slug={slug} name={displayName} logoPath={logoPath} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <Link href={`/tools/${slug}`} onClick={onDetailClick} className="block min-w-0 flex-1">
              <h3 style={{ viewTransitionName: `tool-title-${slug}` }} className="truncate text-base font-semibold text-slate-950">
                {displayName}
              </h3>
            </Link>
            {scoreBadge ? <span className="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{scoreBadge.label}</span> : null}
          </div>
          <p className="mt-2 line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-600">{displaySummary}</p>
          {reasonText ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-blue-700">推荐理由：{reasonText}</p> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <UsersRound className="h-3.5 w-3.5" />
            适合场景
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-slate-900">{sceneItems.length > 0 ? sceneItems.join(" / ") : "待补充"}</p>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            核心亮点
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-slate-900">{featureItems.length > 0 ? featureItems.join(" / ") : "待补充"}</p>
        </div>

        <div className="rounded-lg border border-lime-100 bg-lime-50 px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-lime-700">
            <WalletCards className="h-3.5 w-3.5" />
            免费情况
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-slate-900">{dealText}</p>
        </div>
      </div>

      {accessBadges.length > 0 ? (
        <div className="mt-4 flex min-h-[32px] flex-wrap gap-2">
          {accessBadges.slice(0, 2).map((badge) => (
            <span key={badge.label} className={`rounded px-2.5 py-1 text-xs font-medium ${getAccessBadgeClassName(badge.tone)}`}>
              {badge.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-200 pt-4">
        <Link
          href={`/tools/${slug}`}
          onClick={onDetailClick}
          className="inline-flex h-10 items-center justify-center gap-1 rounded bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          查看详情
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center gap-1 rounded border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
        >
          官网
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}
