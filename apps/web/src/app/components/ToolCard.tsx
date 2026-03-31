import Link from "next/link";
import { ExternalLink } from "lucide-react";
import ToolLogo from "./ToolLogo";

interface ToolCardProps {
  slug: string;
  name: string;
  summary: string;
  tags: string[];
  url: string;
  logoPath?: string | null;
  status: "published" | "draft" | "archived";
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

export default function ToolCard({
  slug,
  name,
  summary,
  tags,
  url,
  logoPath = null,
  status,
}: ToolCardProps) {
  return (
    <article className="card-base rounded-[28px] p-5">
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start gap-3">
          <ToolLogo slug={slug} name={name} logoPath={logoPath} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/tools/${slug}`} className="block min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-slate-950">{name}</h3>
              </Link>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{summary}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Link href={`/tools/${slug}`} className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline">
            查看详情
          </Link>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-white"
          >
            访问官网
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
