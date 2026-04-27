import Link from "next/link";
import {
  BadgePercent,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Play,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import ToolCard from "../components/ToolCard";
import ToolLogo from "../components/ToolLogo";
import ToolReviewsPanel from "../components/ToolReviewsPanel";
import BackToResultsLink from "../components/BackToResultsLink";
import type { ToolDetail, ToolMediaItem, ToolReviewsResponse, ToolSummary } from "../lib/catalog-types";
import { buildDecisionBadges, buildToolsHref, hasValidOfficialUrl, slugifyLabel } from "../lib/catalog-utils";
import {
  buildAccessBadgeMeta,
  detectPriceLabel,
  formatPriceRange,
  formatPricingType,
  getAccessBadgeClassName,
  getScoreBadge,
} from "../lib/tool-display";

interface ToolDetailPageProps {
  tool: ToolDetail | null;
  relatedTools: ToolSummary[];
  reviews: ToolReviewsResponse | null;
}

function fallbackText(value?: string | null, defaultValue = "待补充") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : defaultValue;
}

function cleanList(values?: string[] | null) {
  return (values ?? []).map((item) => item.trim()).filter(Boolean);
}

function fallbackList(values: string[], defaultValue: string) {
  return values.length > 0 ? values : [defaultValue];
}

function deriveAbilitiesFromTags(tags: string[]): string[] {
  if (!tags || tags.length === 0) return [];
  return tags.slice(0, 4).map((tag) => `支持 ${tag} 相关能力`);
}

function deriveAudienceFromTags(tags: string[]): string[] {
  if (!tags || tags.length === 0) return [];
  return tags.slice(0, 3).map((tag) => `${tag} 场景用户`);
}

function resolveFeatures(tool: ToolDetail) {
  const features = cleanList(tool.features);
  if (features.length > 0) return features;
  const abilities = cleanList(tool.abilities);
  if (abilities.length > 0) return abilities;
  const pros = cleanList(tool.pros);
  if (pros.length > 0) return pros;
  return deriveAbilitiesFromTags(tool.tags);
}

function resolveLimitations(tool: ToolDetail) {
  const limitations = cleanList(tool.limitations);
  if (limitations.length > 0) return limitations;
  const pitfalls = cleanList(tool.pitfalls);
  if (pitfalls.length > 0) return pitfalls;
  return cleanList(tool.cons);
}

function resolveBestFor(tool: ToolDetail) {
  const bestFor = cleanList(tool.bestFor);
  if (bestFor.length > 0) return bestFor;
  const targetAudience = cleanList(tool.targetAudience);
  if (targetAudience.length > 0) return targetAudience;
  return deriveAudienceFromTags(tool.tags);
}

function resolveDeal(tool: ToolDetail) {
  return (
    tool.dealSummary?.trim() ||
    tool.freeAllowanceText?.trim() ||
    fallbackText(formatPricingType(tool), "") ||
    fallbackText(tool.price, "")
  );
}

function ScoreBar({ score, reviewCount }: { score: number; reviewCount: number }) {
  const percentage = Math.min(100, Math.max(0, (score / 10) * 100));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-semibold text-white">{score.toFixed(1)}</span>
        <span className="text-xs text-slate-300">{reviewCount} 条评价</span>
      </div>
      <div className="h-2 w-full rounded bg-white/10">
        <div className="h-full rounded bg-lime-300 transition-all duration-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function MediaPreview({ item, toolName }: { item: ToolMediaItem; toolName: string }) {
  const title = item.title?.trim() || `${toolName} 演示`;
  const isVideo = item.type === "video";

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="relative aspect-video bg-slate-950">
        {item.type === "image" || item.thumbnailUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- Reviewed media may be an arbitrary external URL. */}
            <img src={item.thumbnailUrl || item.url} alt={title} className="h-full w-full object-cover" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#05070f] text-slate-300">
            <Play className="h-10 w-10" />
          </div>
        )}
        {isVideo ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-semibold text-slate-950">
            <Play className="h-3.5 w-3.5" />
            视频
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{title}</p>
            {item.sourceName ? <p className="mt-1 truncate text-xs text-slate-500">{item.sourceName}</p> : null}
          </div>
          <a
            href={item.sourceUrl || item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            打开
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ToolDetailPage({ tool, relatedTools, reviews }: ToolDetailPageProps) {
  if (!tool) {
    return (
      <div className="page-shell">
        <Header currentPath="/" currentRoute="/" />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold text-slate-950">暂时找不到这个工具</h1>
          <p className="mt-3 text-sm text-slate-600">当前工具信息可能已下架或尚未收录，你可以先回到目录继续浏览其他结果。</p>
          <BackToResultsLink className="mt-6 inline-flex items-center gap-2 rounded bg-slate-950 px-5 py-3 text-sm font-medium text-white" />
        </main>
        <Footer />
      </div>
    );
  }

  const categoryHref = buildToolsHref({}, { category: tool.categorySlug || slugifyLabel(tool.category), page: 1 });
  const scoreBadge = getScoreBadge(tool.reviewCount, tool.score);
  const accessBadges = buildAccessBadgeMeta(tool.accessFlags);
  const officialUrlAvailable = hasValidOfficialUrl(tool.officialUrl);
  const features = resolveFeatures(tool);
  const limitations = resolveLimitations(tool);
  const bestFor = resolveBestFor(tool);
  const dealSummary = resolveDeal(tool);
  const mediaItems = ((tool.mediaItems ?? []).length > 0 ? tool.mediaItems ?? [] : tool.primaryMedia ? [tool.primaryMedia] : []).filter(
    (item) => item.url,
  );
  const scenarioRecommendations = tool.scenarioRecommendations ?? [];
  const reviewPreview = tool.reviewPreview ?? [];
  const pros = cleanList(tool.pros);
  const cons = cleanList(tool.cons);
  const conclusion = limitations[0]
    ? `先确认限制：${limitations[0]}`
    : bestFor[0]
      ? `适合 ${bestFor[0]}，上线前建议先做一次小范围试用。`
      : "暂未收录明确缺陷，建议结合免费额度先试用。";

  const decisionFields = [
    { label: "价格", value: fallbackText(formatPricingType(tool), "价格待确认") },
    { label: "价格区间", value: fallbackText(formatPriceRange(tool), "价格区间待确认") },
    { label: "适用平台", value: fallbackText(tool.platforms) },
    { label: "访问条件", value: accessBadges.length > 0 ? accessBadges.map((item) => item.label).join(" / ") : "待确认" },
  ];
  const infoFields = [
    { label: "信息来源", value: mediaItems[0]?.sourceName || tool.logoSource || "后台录入 / 官方公开信息" },
    { label: "数据状态", value: tool.lastVerifiedAt ? "已核验" : "暂未核验" },
    { label: "分类", value: fallbackText(tool.category) },
    { label: "开发者", value: fallbackText(tool.developer) },
    { label: "最近校验", value: fallbackText(tool.lastVerifiedAt?.slice(0, 10), "暂无记录") },
    { label: "地区", value: fallbackText([tool.country, tool.city].filter(Boolean).join(" / "), "待补充") },
  ];

  return (
    <div className="page-shell">
      <Header currentPath={`/tools/${tool.slug}`} currentRoute={`/tools/${tool.slug}`} />

      <main>
        <section className="bg-[#05070f] text-white">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
            <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: tool.name }]} />

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="rounded-lg border border-white/10 bg-white/5 p-5 md:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-start">
                  <div style={{ viewTransitionName: `tool-logo-${tool.slug}` }}>
                    <ToolLogo slug={tool.slug} name={tool.name} logoPath={tool.logoPath} size="lg" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl font-semibold text-white md:text-5xl" style={{ viewTransitionName: `tool-title-${tool.slug}` }}>
                        {tool.name}
                      </h1>
                      {scoreBadge ? <span className="rounded bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-800">{scoreBadge.label}</span> : null}
                      <Link href={categoryHref} className="rounded border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-slate-200">
                        {fallbackText(tool.category)}
                      </Link>
                    </div>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{fallbackText(tool.summary, "这款工具的简介还在补充中。")}</p>
                    <div className="mt-5 rounded-lg border border-rose-300/25 bg-rose-300/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-rose-100">
                        <ShieldAlert className="h-4 w-4" />
                        评测结论
                      </div>
                      <p className="mt-2 text-base leading-8 text-white">{conclusion}</p>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {accessBadges.map((badge) => (
                        <span key={badge.label} className={`rounded px-3 py-1 text-xs font-medium ${getAccessBadgeClassName(badge.tone)}`}>
                          {badge.label}
                        </span>
                      ))}
                      {buildDecisionBadges({
                        price: tool.price,
                        summary: tool.summary,
                        tags: tool.tags,
                        platforms: tool.platforms,
                      }).map((badge) => (
                        <span key={badge} className="rounded border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="space-y-3">
                {(tool.reviewCount ?? 0) >= 1 ? (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <ScoreBar score={tool.score} reviewCount={tool.reviewCount ?? 0} />
                  </div>
                ) : null}
                <div className="rounded-lg border border-lime-300/25 bg-lime-300/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-lime-100">
                    <BadgePercent className="h-4 w-4" />
                    优惠 / 免费额度
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-100">{fallbackText(dealSummary, "暂无明确优惠信息，建议先查看官网免费额度。")}</p>
                </div>
                {officialUrlAvailable ? (
                  <a
                    href={tool.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded bg-lime-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-lime-200"
                  >
                    访问官网
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="inline-flex w-full items-center justify-center rounded border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300">
                    官网待补充
                  </span>
                )}
                <BackToResultsLink className="inline-flex w-full items-center justify-center gap-2 rounded border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white" />
              </aside>
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8fb] py-8">
          <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 sm:px-6 xl:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
            <div className="space-y-6">
              <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
                <h2 className="text-xl font-semibold text-slate-950">先看缺陷 / 限制</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {fallbackList(limitations, "暂未收录明确缺陷，建议先用免费额度或测试账号小范围试用。").map((item) => (
                    <div key={item} className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-slate-800">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-700">
                        <TriangleAlert className="h-4 w-4" />
                        需要注意
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
                  <h2 className="text-xl font-semibold text-slate-950">核心特点</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                    {fallbackList(features, "核心特点待补充。").map((item) => (
                      <li key={item} className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-700" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
                  <h2 className="text-xl font-semibold text-slate-950">适合人群</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                    {fallbackList(bestFor, "适合人群待补充。").map((item) => (
                      <li key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <UsersRound className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
                <h2 className="text-xl font-semibold text-slate-950">工具简介</h2>
                <p className="mt-4 text-sm leading-8 text-slate-700">{fallbackText(tool.description, fallbackText(tool.summary, "详细介绍待补充。"))}</p>
              </section>

              {mediaItems.length > 0 ? (
                <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-slate-500" />
                    <h2 className="text-xl font-semibold text-slate-950">媒体演示</h2>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {mediaItems.map((item) => (
                      <MediaPreview key={`${item.type}-${item.url}`} item={item} toolName={tool.name} />
                    ))}
                  </div>
                </section>
              ) : null}

              {(pros.length > 0 || cons.length > 0) ? (
                <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
                  <h2 className="text-xl font-semibold text-slate-950">优势与旧版点评回退</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-700">优势</p>
                      <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                        {fallbackList(pros, "优势待补充。").map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-700">限制</p>
                      <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                        {fallbackList(cons, "限制待补充。").map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
                  <h2 className="text-xl font-semibold text-slate-950">适用场景</h2>
                  {scenarioRecommendations.length > 0 ? (
                    <div className="mt-4 grid gap-4">
                      {scenarioRecommendations.map((item) => (
                        <div key={`${item.audience}-${item.task}`} className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold text-slate-400">{item.audience}</p>
                          <h3 className="mt-2 text-base font-semibold text-slate-950">{item.task}</h3>
                          <p className="mt-3 text-sm leading-7 text-slate-700">{item.summary}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      适用场景正在补充中，可先参考特点和适合人群判断是否匹配。
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
                  <h2 className="text-xl font-semibold text-slate-950">基础信息</h2>
                  <div className="mt-4 grid gap-3">
                    {decisionFields.concat(infoFields).map((field) => (
                      <div key={`${field.label}-${field.value}`} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold text-slate-500">{field.label}</p>
                        <p className="text-right text-sm font-medium leading-6 text-slate-800">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {reviewPreview.length > 0 ? (
                <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-slate-950">用户/编辑反馈</h2>
                  </div>
                  <div className="mt-4 space-y-4">
                    {reviewPreview.map((item, index) => (
                      <article key={`${item.sourceType}-${item.title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                            {item.sourceType === "editor" ? "编辑点评" : "用户反馈"}
                          </span>
                          {typeof item.rating === "number" ? <span className="text-sm font-semibold text-amber-600">{item.rating.toFixed(1)} 分</span> : null}
                        </div>
                        {item.title ? <h3 className="mt-3 text-base font-semibold text-slate-950">{item.title}</h3> : null}
                        <p className="mt-2 text-sm leading-7 text-slate-700">{fallbackText(item.body, "点评内容待补充。")}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <ToolReviewsPanel toolSlug={tool.slug} reviews={reviews} summary={tool.ratingSummary ?? reviews?.summary ?? null} />
            </div>

            <aside className="space-y-6">
              {relatedTools.length > 0 ? (
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-slate-950">相似工具</h2>
                  <div className="mt-4 space-y-4">
                    {relatedTools.map((item) => (
                      <ToolCard
                        key={item.slug}
                        slug={item.slug}
                        name={item.name}
                        summary={item.summary}
                        category={item.category}
                        tags={item.tags}
                        url={item.officialUrl}
                        logoPath={item.logoPath}
                        score={item.score}
                        reviewCount={item.reviewCount}
                        accessFlags={item.accessFlags}
                        priceLabel={detectPriceLabel(item)}
                        decisionBadges={buildDecisionBadges({
                          price: item.price,
                          summary: item.summary,
                          tags: item.tags,
                        })}
                        features={item.features}
                        limitations={item.limitations}
                        bestFor={item.bestFor}
                        dealSummary={item.dealSummary || item.freeAllowanceText || ""}
                        primaryMedia={item.primaryMedia}
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <section className="rounded-lg border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
                  暂时没有可展示的相似工具。
                </section>
              )}
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
