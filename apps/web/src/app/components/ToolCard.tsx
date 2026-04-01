import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import ToolLogo from "./ToolLogo";

interface ToolCardProps {
  slug: string;
  name: string;
  summary: string;
  tags: string[];
  url: string;
  logoPath?: string | null;
  status: "published" | "draft" | "archived";
  score: number;
  priceLabel?: string | null;
}

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

const PRICE_TYPE_COLORS: Record<string, string> = {
  free: "bg-green-100 text-green-800",
  freemium: "bg-blue-100 text-blue-800",
  subscription: "bg-purple-100 text-purple-800",
  "one-time": "bg-orange-100 text-orange-800",
  other: "bg-slate-100 text-slate-700",
};

const PRICE_TYPE_LABELS: Record<string, string> = {
  free: "免费",
  freemium: "免费增值",
  subscription: "订阅",
  "one-time": "一次性付费",
};

export default function ToolCard({
  slug,
  name,
  summary,
  tags,
  url,
  logoPath = null,
  status,
  score,
  priceLabel = null,
}: ToolCardProps) {
  const priceDisplay = priceLabel && PRICE_TYPE_LABELS[priceLabel]
    ? PRICE_TYPE_LABELS[priceLabel]
    : priceLabel;

  return (
    <article className="card-base card-interactive rounded-[28px] p-5" data-testid="tool-card">
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start gap-3">
          <ToolLogo slug={slug} name={name} logoPath={logoPath} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/tools/${slug}`} className="block min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-slate-950 transition group-hover:text-slate-900">{name}</h3>
              </Link>
              <span className="text-amber-500 text-sm font-semibold">⭐ {score.toFixed(1)}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{summary}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {priceDisplay && (
            <span data-testid="price-tag" className={`rounded-full px-3 py-1 text-xs font-semibold ${PRICE_TYPE_COLORS[priceLabel || "other"]}`}>
              {priceDisplay}
            </span>
          )}
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/35 pt-4">
          <Link
            href={`/tools/${slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 underline-offset-4 transition hover:underline"
          >
            查看详情
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-white"
          >
            访问官网
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
