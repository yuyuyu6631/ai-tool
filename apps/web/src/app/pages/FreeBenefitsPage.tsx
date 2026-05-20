import Link from "next/link";
import { BadgePercent, Radar, ShieldAlert, Sparkles } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import ToolLogo from "../components/ToolLogo";
import { fetchDirectory } from "../lib/catalog-api";
import { repairDisplayText } from "../lib/catalog-utils";
import { detectPriceLabel } from "../lib/tool-display";
import { withPublicPath } from "../lib/public-path";

interface FreeBenefitsPageProps {
  currentPath: string;
}

export default async function FreeBenefitsPage({ currentPath }: FreeBenefitsPageProps) {
  const [freeDirectory, hotDirectory] = await Promise.all([
    fetchDirectory("mode=search&price=free&page=1&page_size=8").catch(() => null),
    fetchDirectory("mode=search&view=hot&page=1&page_size=8").catch(() => null),
  ]);
  const dealTools = freeDirectory?.items.length ? freeDirectory.items : hotDirectory?.items ?? [];

  return (
    <div className="page-shell">
      <Header currentPath={currentPath} currentRoute={currentPath} forceHomeHeader />
      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "免费福利" }]} />

          <section className="hero-brand-panel overflow-hidden rounded-[32px] p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div>
                <p className="hero-kicker hero-kicker-accent inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                  <BadgePercent className="h-3.5 w-3.5" />
                  福利雷达
                </p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">今天能领取什么 AI 工具权益</h1>
                <p className="hero-subtitle mt-4 max-w-3xl text-sm leading-7 md:text-base">
                  免费额度、试用、折扣、国内可用和限制风险集中看。先判断值不值得试，再进工具详情。
                </p>
              </div>
              <div className="hero-search-panel rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--color-accent)]">福利态势</p>
                  <Radar className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["免费额度", `${dealTools.length || 0} 条`],
                    ["国内可用", "优先标注"],
                    ["限时活动", "待运营接入"],
                    ["避坑提醒", "详情页核验"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-3">
                      <p className="text-[11px] text-slate-500">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid gap-4 md:grid-cols-2">
              {dealTools.map((tool) => (
                <Link key={tool.slug} href={withPublicPath(`/tools/${tool.slug}`)} className="surface-card group rounded-2xl p-5 transition hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <ToolLogo slug={tool.slug} name={repairDisplayText(tool.name)} logoPath={tool.logoPath} size="md" className="border-slate-100 bg-slate-50" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-slate-950">{repairDisplayText(tool.name)}</h2>
                        <span className={`${detectPriceLabel(tool) === "free" ? "badge-free" : "badge-trial"} rounded-full px-2 py-1 text-xs font-semibold`}>
                          {detectPriceLabel(tool) === "free" ? "免费" : "可试"}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {repairDisplayText(tool.dealSummary || tool.freeAllowanceText || tool.summary || "先用免费版验证核心流程，价格和额度以官网为准。")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <aside className="space-y-4">
              <section className="warning-panel rounded-2xl p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldAlert className="h-4 w-4" />
                  先看限制
                </div>
                <div className="mt-3 space-y-2 text-sm leading-6">
                  <p>免费额度可能有水印、次数、导出、商用授权和地区访问限制。</p>
                  <p>星点评会尽量标注，但最终价格和活动以官网为准。</p>
                </div>
              </section>
              <section className="surface-card rounded-2xl p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Sparkles className="h-4 w-4 text-sky-600" />
                  运营入口
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  后续可接入厂商活动、私域领取、折扣码和专题页。当前版本先把福利心智和工具详情打通。
                </p>
                <Link href={withPublicPath("/tools?price=free&page=1&page_size=24")} className="btn-token-accent mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold">
                  查看全部免费工具
                </Link>
              </section>
            </aside>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
