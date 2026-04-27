import Link from "next/link";
import { TOOL_SUBMISSION_URL } from "../lib/catalog-utils";

export default function Footer() {
  return (
    <footer className="footer-shell mt-24 py-12">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">星点评</h3>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
            面向真实工作场景的 AI 工具发现入口。专注搜索、分类与高质量工具发现，不承载资讯流与运营内容。
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">发现</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <Link href="/" className="block hover:text-slate-900">
              首页搜索
            </Link>
            <Link href="/?view=hot" className="block hover:text-slate-900">
              热门推荐
            </Link>
            <Link href="/?view=latest" className="block hover:text-slate-900">
              最新收录
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">平台</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <Link href={TOOL_SUBMISSION_URL} className="block hover:text-slate-900">
              提交工具
            </Link>
            <Link href="/#submit-tool" className="block hover:text-slate-900">
              问题反馈
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
