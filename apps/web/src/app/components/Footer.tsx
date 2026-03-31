import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/30 bg-white/40 py-10 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">关于星点评</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            收录常见 AI 工具，帮助你按分类、标签和用途快速找到合适的产品。
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">使用说明</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            首页提供推荐内容和常用分类，目录页支持继续筛选，详情页可查看简介并访问官网。
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">协作与反馈</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <a href="https://github.com/yuyuyu6631/Next.js-AI-Tool-Demo" target="_blank" rel="noreferrer" className="block hover:text-slate-900">
              GitHub 仓库
            </a>
            <a href="https://github.com/yuyuyu6631/Next.js-AI-Tool-Demo/issues" target="_blank" rel="noreferrer" className="block hover:text-slate-900">
              问题反馈
            </a>
            <Link href="/tools" className="block hover:text-slate-900">
              返回工具目录
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
