import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import ToolLogo from "../components/ToolLogo";
import { withPublicPath } from "../lib/public-path";
import type { ToolDetail } from "../lib/catalog-types";
import {
  buildCompareValue,
  buildAccessBadges,
  formatPriceRange,
  formatPricingType,
  getNetworkStatusValue,
  getScoreBadge,
} from "../lib/tool-display";

interface ComparePageProps {
  tools: ToolDetail[];
  comparisonSlug: string;
}

const ROWS = [
  { key: "score", label: "评分" },
  { key: "pricingType", label: "定价类型" },
  { key: "freeAllowance", label: "免费额度" },
  { key: "cnLang", label: "中文界面" },
  { key: "noVpn", label: "国内直连" },
  { key: "cnPayment", label: "支持国内支付" },
  { key: "priceRange", label: "价格区间" },
  { key: "summary", label: "主要用途" },
  { key: "targetAudience", label: "适合人群" },
  { key: "pitfalls", label: "不适合人群 / 避坑摘要" },
] as const;

function getRowValue(tool: ToolDetail, key: (typeof ROWS)[number]["key"]) {
  const compareValue = buildCompareValue(tool);
  const accessBadges = buildAccessBadges(tool.accessFlags);
  const scoreBadge = getScoreBadge(tool.reviewCount, tool.score);

  switch (key) {
    case "score":
      return scoreBadge?.label || "";
    case "pricingType":
      return formatPricingType(tool);
    case "freeAllowance":
      return tool.freeAllowanceText || "";
    case "cnLang":
      return tool.accessFlags?.cnLang === true ? "支持" : tool.accessFlags?.cnLang === false ? "不支持" : "";
    case "noVpn":
      return getNetworkStatusValue(tool.accessFlags);
    case "cnPayment":
      return tool.accessFlags?.cnPayment === true ? "支持" : tool.accessFlags?.cnPayment === false ? "不支持" : "";
    case "priceRange":
      return formatPriceRange(tool);
    case "summary":
      return tool.summary;
    case "targetAudience":
      return compareValue.targetAudience;
    case "pitfalls":
      return compareValue.pitfalls;
    default:
      return accessBadges.join(" / ");
  }
}

export default function ComparePage({ tools, comparisonSlug }: ComparePageProps) {
  return (
    <div className="page-shell">
      <Header currentPath={`/compare/${comparisonSlug}`} currentRoute={`/compare/${comparisonSlug}`} forceHomeHeader />

      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "工具对比" }]} />

          <section className="panel-base rounded-[32px] p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">工具对比</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">别凭感觉选，放一起更容易看清。</h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                  对比不是看谁功能多，而是看谁更适合你现在的任务。价格、功能、适用人群、上手门槛，摆在一起看，差别会清晰很多。
                </p>
              </div>
              <a href={withPublicPath("/")} className="btn-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium">
                返回首页继续找工具
              </a>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-[28px] border border-white/40 bg-white/80">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80">
                    <th className="min-w-[220px] px-5 py-4 text-left text-sm font-semibold text-slate-500">对比维度</th>
                    {tools.map((tool) => (
                      <th key={tool.slug} className="min-w-[260px] px-5 py-4 text-left">
                        <div className="flex items-center gap-3">
                          <ToolLogo slug={tool.slug} name={tool.name} logoPath={tool.logoPath ?? null} />
                          <div>
                            <p className="text-base font-semibold text-slate-950">{tool.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{tool.category}</p>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.key} className="border-b border-slate-200/60 align-top last:border-b-0">
                      <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">{row.label}</th>
                      {tools.map((tool) => (
                        <td key={`${tool.slug}-${row.key}`} className="px-5 py-4 text-sm leading-7 text-slate-700">
                          {getRowValue(tool, row.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
