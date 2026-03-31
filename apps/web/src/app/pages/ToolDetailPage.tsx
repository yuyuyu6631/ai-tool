import Link from "next/link";
import { ExternalLink } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import ToolLogo from "../components/ToolLogo";
import ToolCard from "../components/ToolCard";
import type { ToolDetail, ToolSummary } from "../lib/catalog-types";
import { slugifyLabel } from "../lib/catalog-utils";

const STATUS_STYLES = {
  published: "bg-emerald-100 text-emerald-800",
  draft: "bg-amber-100 text-amber-800",
  archived: "bg-slate-200 text-slate-700",
} as const;

const STATUS_LABELS = {
  published: "已发布",
  draft: "草稿",
  archived: "已归档",
} as const;

interface ToolDetailPageProps {
  tool: ToolDetail | null;
  relatedTools: ToolSummary[];
}

export default function ToolDetailPage({ tool, relatedTools }: ToolDetailPageProps) {
  if (!tool) {
    return (
      <div className="page-shell">
        <Header />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold text-slate-950">暂无相关内容</h1>
          <p className="mt-3 text-sm text-slate-600">当前工具信息暂未收录，你可以返回列表继续浏览其他内容。</p>
          <Link href="/tools" className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">
            返回列表
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryHref = `/tools?category=${slugifyLabel(tool.category)}`;
  const infoFields = [
    { label: "开发者", value: tool.developer },
    { label: "地区", value: tool.country },
    { label: "城市", value: tool.city },
    { label: "价格", value: tool.price },
    { label: "支持平台", value: tool.platforms },
    { label: "VPN", value: tool.vpnRequired },
  ].filter((field) => field.value);

  return (
    <div className="page-shell">
      <Header />

      <main className="py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "首页", href: "/" },
              { label: "工具目录", href: "/tools" },
              { label: tool.name },
            ]}
          />

          <section className="panel-base rounded-[32px] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <ToolLogo slug={tool.slug} name={tool.name} size="lg" logoPath={tool.logoPath ?? null} />
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">{tool.name}</h1>
                    <Link href={categoryHref} className="rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-slate-700">
                      {tool.category}
                    </Link>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[tool.status]}`}>
                      {STATUS_LABELS[tool.status]}
                    </span>
                  </div>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">{tool.summary}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href={tool.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium"
                >
                  访问官网
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Link href="/tools" className="btn-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium">
                  返回列表
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div className="panel-base rounded-[28px] p-6">
                <h2 className="text-xl font-semibold text-slate-900">工具简介</h2>
                <p className="mt-4 text-sm leading-8 text-slate-700">{tool.description || tool.summary}</p>
              </div>

              {infoFields.length > 0 ? (
                <div className="panel-base rounded-[28px] p-6">
                  <h2 className="text-xl font-semibold text-slate-900">工具信息</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {infoFields.map((field) => (
                      <div
                        key={`${field.label}-${field.value}`}
                        className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{field.label}</p>
                        <p className="mt-2 text-sm font-medium leading-7 text-slate-700">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {tool.editorComment ? (
                <div className="panel-base rounded-[28px] p-6">
                  <h2 className="text-xl font-semibold text-slate-900">编辑点评</h2>
                  <p className="mt-4 text-sm leading-8 text-slate-700">{tool.editorComment}</p>
                </div>
              ) : null}

              <div className="panel-base rounded-[28px] p-6">
                <h2 className="text-xl font-semibold text-slate-900">标签</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tool.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              {relatedTools.length > 0 ? (
                <div className="panel-base rounded-[28px] p-5">
                  <h2 className="text-lg font-semibold text-slate-900">同类工具</h2>
                  <div className="mt-4 space-y-4">
                    {relatedTools.map((item) => (
                      <ToolCard
                        key={item.slug}
                        slug={item.slug}
                        name={item.name}
                        summary={item.summary}
                        tags={item.tags}
                        url={item.officialUrl}
                        logoPath={item.logoPath}
                        status={item.status}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
