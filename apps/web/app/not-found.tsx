import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="panel-base rounded-[32px] p-10 text-center">
          <p className="eyebrow text-xs font-medium mb-3">404</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">页面不存在</h1>
          <p className="glass-copy max-w-2xl mx-auto mb-6">
            你访问的页面可能已经移动，或者当前链接无效。
          </p>
          <Link href="/" className="inline-flex items-center px-5 py-3 btn-primary rounded-full transition">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
