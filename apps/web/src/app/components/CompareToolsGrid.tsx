"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ToolSummary } from "../lib/catalog-types";
import { buildComparisonSlug } from "../lib/compare-utils";
import { TOOL_SUBMISSION_URL, buildDecisionBadges } from "../lib/catalog-utils";
import { rememberCatalogNavigation } from "../lib/catalog-navigation";
import { detectPriceLabel } from "../lib/tool-display";
import ToolCard from "./ToolCard";

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
      if (current.length >= 3) {
        return current;
      }
      return [...current, slug];
    });
  };

  return (
    <>
      <div className="space-y-6">
        {resolvedSections.map((section) => (
          <section key={section.id} className="space-y-4">
            {section.title ? <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2> : null}
            {section.items.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.items.map((tool) => {
                  const selected = selectedSlugs.includes(tool.slug);
                  const compareDisabled = selectedSlugs.length >= 3 && !selected;

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
                  <Link href="/?view=hot" className="btn-primary rounded-full px-5 py-3 text-sm">
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
        <div className="sticky bottom-4 mt-6">
          <div className="panel-base flex flex-col gap-3 rounded-[24px] px-5 py-4 shadow-[0_20px_40px_rgba(15,23,42,0.12)] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">工具对比</p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedSlugs.length === 0
                  ? "先勾选 2-3 个工具，再进入横向对比。"
                  : `已选 ${selectedSlugs.length} 个：${selectedSlugs.join("、")}`}
              </p>
            </div>
            {comparisonSlug ? (
              <Link
                href={`/compare/${comparisonSlug}`}
                className="btn-primary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                开始对比
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center justify-center rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500">
                选择至少 2 个
              </span>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
