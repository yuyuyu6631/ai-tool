"use client";

import { Link } from "next-view-transitions";
import { ArrowRight, ExternalLink, Plus, Star } from "lucide-react";
import { memo } from "react";
import type { AccessFlags, AgentToolPlanItem, ToolMediaItem } from "../lib/catalog-types";
import { repairDisplayList, repairDisplayText } from "../lib/catalog-utils";
import { withPublicPath } from "../lib/public-path";
import { buildAccessBadgeMeta } from "../lib/tool-display";
import ToolLogo from "./ToolLogo";

export interface ToolCardProps {
  slug: string;
  name: string;
  summary: string;
  category?: string;
  tags?: string[];
  url: string;
  logoPath?: string | null;
  score?: number | null;
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
  agentPlan?: AgentToolPlanItem;
}

const PRICE_HINTS: Record<string, string> = {
  free: "免费",
  freemium: "免费增值",
  subscription: "订阅制",
  "one-time": "买断",
  contact: "联系销售",
};

function getPriceText(priceLabel?: string | null, dealSummary?: string, agentPlan?: AgentToolPlanItem) {
  const explicit = repairDisplayText(agentPlan?.free_signal || dealSummary || "", "");
  if (explicit) return explicit;
  if (priceLabel && PRICE_HINTS[priceLabel]) return PRICE_HINTS[priceLabel];
  return "价格待核验";
}

function getScoreText(score?: number | null) {
  return Number.isFinite(score) && typeof score === "number" && score > 0 ? score.toFixed(1) : "待评";
}

function getUseCaseText(summary: string, bestFor: string[], features: string[], agentPlan?: AgentToolPlanItem) {
  const fitReason = repairDisplayText(agentPlan?.fit_reason || "", "");
  if (fitReason) return fitReason;

  const audience = repairDisplayList(bestFor, 1)[0];
  const feature = repairDisplayList(features, 1)[0];
  if (audience && feature) return `适合${audience}，用于${feature}`;
  if (audience) return `适合${audience}：${summary}`;
  if (feature) return `适合处理：${feature}`;
  return summary;
}

function ToolCard({
  slug,
  name,
  summary,
  tags = [],
  url,
  logoPath = null,
  score = null,
  reviewCount = 0,
  accessFlags = null,
  priceLabel = null,
  compareSelected = false,
  compareDisabled = false,
  onCompareToggle,
  onDetailClick,
  features = [],
  bestFor = [],
  dealSummary = "",
  agentPlan,
}: ToolCardProps) {
  const displayName = repairDisplayText(name, slug);
  const displaySummary = getUseCaseText(repairDisplayText(summary, "一句话介绍待补充"), bestFor, features, agentPlan);
  const displayTags = repairDisplayList(tags, 3);
  const accessBadges = buildAccessBadgeMeta(accessFlags).slice(0, 1);
  const priceText = getPriceText(priceLabel, dealSummary, agentPlan);
  const scoreText = getScoreText(score);

  return (
    <article
      className="tool-card group flex h-full min-h-[196px] flex-col rounded-lg p-4 transition hover:-translate-y-0.5"
      data-testid="tool-card"
    >
      <div className="flex items-start gap-3">
        <div style={{ viewTransitionName: `tool-logo-${slug}` }}>
          <ToolLogo slug={slug} name={displayName} logoPath={logoPath} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <Link href={withPublicPath(`/tools/${slug}`)} onClick={onDetailClick} className="block min-w-0 flex-1">
              <h3
                style={{ viewTransitionName: `tool-title-${slug}` }}
                className="tool-card-title truncate text-base font-semibold"
              >
                {displayName}
              </h3>
            </Link>
            <span className="badge-score inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold">
              <Star className="h-3 w-3 fill-current" />
              {scoreText}
            </span>
          </div>
          <p className="tool-card-summary mt-2 line-clamp-2 text-sm leading-6">
            {displaySummary}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          data-testid="price-tag"
          className="badge-warning inline-flex max-w-full items-center rounded px-2.5 py-1 text-xs font-semibold"
        >
          <span className="truncate">{priceText}</span>
        </span>
        {accessBadges.map((badge) => (
          <span key={badge.label} className="token-tag inline-flex rounded border border-slate-200 px-2.5 py-1 text-xs font-medium">
            {badge.label}
          </span>
        ))}
      </div>

      {displayTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="token-tag rounded px-2.5 py-1 text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-slate-500">{reviewCount > 0 ? `${reviewCount} 条评价` : "评价待补充"}</span>
        <div className="flex min-w-0 items-center gap-2 sm:shrink-0">
          {onCompareToggle ? (
            <button
              type="button"
              onClick={onCompareToggle}
              disabled={!compareSelected && compareDisabled}
              aria-pressed={compareSelected}
              title={compareDisabled ? "最多可选 4 个工具" : undefined}
              className={`inline-flex h-8 flex-1 items-center justify-center gap-1 rounded px-3 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 sm:flex-none ${
                compareSelected
                  ? "btn-token-selected"
                  : compareDisabled
                    ? "cursor-not-allowed border border-slate-100 bg-slate-100 text-slate-400"
                    : "btn-token-neutral"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              {compareSelected ? "已加入" : "对比"}
            </button>
          ) : null}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="btn-token-neutral inline-flex h-8 flex-1 items-center justify-center gap-1 rounded px-3 text-xs font-semibold transition sm:flex-none"
            aria-label="官网"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            官网
          </a>
          <Link
            href={withPublicPath(`/tools/${slug}`)}
            onClick={onDetailClick}
            className="btn-token-accent inline-flex h-8 flex-1 items-center justify-center gap-1 rounded px-3 text-xs font-semibold transition sm:flex-none"
          >
            详情
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default memo(ToolCard);
