"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { ToolSummary } from "../lib/catalog-types";
import { buildComparisonSlug } from "../lib/compare-utils";
import { TOOL_SUBMISSION_URL, buildDecisionBadges } from "../lib/catalog-utils";
import { rememberCatalogNavigation } from "../lib/catalog-navigation";
import { detectPriceLabel } from "../lib/tool-display";
import { withPublicPath } from "../lib/public-path";
import ToolCard from "./ToolCard";

const COMPARE_LIMIT = 4;

export interface CompareToolsSection {
  id: string;
  title?: string;
  items: ToolSummary[];
  emptyTitle?: string;
  emptyDescription?: string;
}

interface CompareToolsGridProps {
  items?: ToolSummary[];
  sections?: CompareToolsSection[];
  onToolDetailClick?: ((tool: ToolSummary) => void) | undefined;
  rememberDetailNavigation?: boolean;
}

export default function CompareToolsGrid({
  items = [],
  sections,
  onToolDetailClick,
  rememberDetailNavigation = false,
}: CompareToolsGridProps) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const resolvedSections = useMemo<CompareToolsSection[]>(
    () => (sections && sections.length > 0 ? sections : [{ id: "default", items }]),
    [items, sections],
  );

  const comparisonSlug = useMemo(() => buildComparisonSlug(selectedSlugs), [selectedSlugs]);
  const hasAnyItems = resolvedSections.some((section) => section.items.length > 0);

  const toggleTool = (slug: string) => {
    setSelectedSlugs((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug);
      }
      if (current.length >= COMPARE_LIMIT) {
        return current;
      }
      return [...current, slug];
    });
  };

  const selectedTools = useMemo(() => {
    const toolsBySlug = new Map(resolvedSections.flatMap((section) => section.items).map((tool) => [tool.slug, tool.name]));
    return selectedSlugs.map((slug) => ({ slug, name: toolsBySlug.get(slug) || slug }));
  }, [resolvedSections, selectedSlugs]);

  return (
    <>
      <div className="space-y-6">
        {resolvedSections.map((section) => (
          <section key={section.id} className="space-y-4">
            {section.title ? <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2> : null}
            {section.items.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {section.items.map((tool) => {
                  const selected = selectedSlugs.includes(tool.slug);
                  const compareDisabled = selectedSlugs.length >= COMPARE_LIMIT && !selected;

                  return (
                    <ToolCard
                      key={tool.slug}
                      slug={tool.slug}
                      name={tool.name}
                      summary={tool.summary}
                      tags={tool.tags}
                      url={tool.officialUrl}
                      logoPath={tool.logoPath}
                      score={tool.score}
                      reviewCount={tool.reviewCount}
                      accessFlags={tool.accessFlags}
                      priceLabel={detectPriceLabel(tool)}
                      decisionBadges={buildDecisionBadges({ price: tool.price, summary: tool.summary, tags: tool.tags })}
                      compareSelected={selected}
                      compareDisabled={compareDisabled}
                      onCompareToggle={() => toggleTool(tool.slug)}
                      onDetailClick={() => {
                        if (rememberDetailNavigation) {
                          rememberCatalogNavigation();
                        }
                        onToolDetailClick?.(tool);
                      }}
                      reason={tool.reason}
                      features={tool.features}
                      limitations={tool.limitations}
                      bestFor={tool.bestFor}
                      dealSummary={tool.dealSummary || tool.freeAllowanceText}
                      primaryMedia={tool.primaryMedia}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="panel-base rounded-[24px] p-6 text-center">
                <h3 className="text-lg font-semibold text-slate-900">{section.emptyTitle || "该分组正在补充中"}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {section.emptyDescription || "你可以先去看热门工具，或者把你常用的工具提交给我们补录。"}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href={withPublicPath("/?view=hot")} className="btn-primary rounded-full px-5 py-3 text-sm">
                    去看热门工具
                  </Link>
                  <Link
                    href={TOOL_SUBMISSION_URL}
                    className="btn-secondary rounded-full px-5 py-3 text-sm"
                  >
                    提交你常用的工具
                  </Link>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {hasAnyItems ? (
        <div className="sticky bottom-4 z-20 mt-6 hidden sm:block">
          <div className="surface-glass-panel mx-auto flex max-w-5xl flex-col gap-3 rounded-lg px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <p className="shrink-0 text-sm font-semibold text-slate-900">工具对比 ({selectedSlugs.length}/{COMPARE_LIMIT})</p>
              {selectedTools.length > 0 ? (
                <div className="flex min-w-0 flex-wrap gap-2">
                  {selectedTools.map((tool) => (
                    <button
                      key={tool.slug}
                      type="button"
                      onClick={() => toggleTool(tool.slug)}
                      className="btn-token-neutral inline-flex h-9 max-w-[150px] items-center gap-2 rounded px-3 text-xs font-medium transition"
                      title={`取消选择 ${tool.name}`}
                      aria-label={`取消选择 ${tool.name}`}
                    >
                      <span aria-hidden="true" className="truncate">{tool.name}</span>
                      <X aria-hidden="true" className="h-3 w-3 shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">先勾选 2-4 个工具，再进入横向对比。</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSlugs([])}
                disabled={selectedSlugs.length === 0}
                className="btn-token-neutral inline-flex h-9 items-center justify-center rounded px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                清空
              </button>
              {comparisonSlug ? (
                <Link
                  href={withPublicPath(`/compare/${comparisonSlug}`)}
                  className="btn-primary inline-flex h-9 items-center justify-center rounded px-5 text-sm font-semibold"
                >
                  查看对比
                </Link>
              ) : (
                <span className="token-tag inline-flex h-9 cursor-not-allowed items-center justify-center rounded px-5 text-sm font-semibold">
                  选择至少 2 个
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
