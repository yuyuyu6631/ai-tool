import Link from "next/link";
import { TOOL_SUBMISSION_URL } from "../lib/catalog-utils";
import { withPublicPath } from "../lib/public-path";

const footerLinks = [
  { href: withPublicPath("/scenarios"), label: "任务场景" },
  { href: withPublicPath("/experiences"), label: "经验社区" },
  { href: withPublicPath("/benefits"), label: "免费福利" },
  { href: withPublicPath("/tools?mode=search&page=1&page_size=24"), label: "工具库" },
  { href: TOOL_SUBMISSION_URL, label: "提交工具" },
];

export default function Footer() {
  return (
    <footer className="footer-shell mt-10 py-8">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-lg font-semibold text-[var(--text-primary)]">星点评</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              独立运营的 AI 工具目录。收录、价格线索、适用场景和风险提示会持续修订，优先服务真实任务里的选型。
            </p>
          </div>
          <nav aria-label="页脚导航" className="flex flex-wrap gap-2">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 text-xs text-[var(--text-tertiary)] sm:flex-row sm:items-center sm:justify-between">
          <p>数据以官网、公开资料和站内维护记录为准；推荐结果只做选型参考。</p>
          <p>AI Tool Directory · Review Notes · Ranking Signals</p>
        </div>
      </div>
    </footer>
  );
}
