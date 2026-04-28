import Link from "next/link";
import HeaderAuthControls from "./HeaderAuthControls";
import HeaderMobileMenu from "./HeaderMobileMenu";
import PlatformLogo from "./PlatformLogo";
import { TOOL_SUBMISSION_URL } from "../lib/catalog-utils";

interface HeaderProps {
  currentPath: string;
  currentRoute?: string;
}

export default function Header({ currentPath, currentRoute = currentPath }: HeaderProps) {
  const authHref = currentPath === "/auth" ? "/auth" : `/auth?next=${encodeURIComponent(currentRoute)}`;
  const isHome = currentPath === "/";

  return (
    <header className={`site-header sticky top-0 z-50 ${isHome ? "site-header--dark" : ""}`}>
      <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15"
        >
          <PlatformLogo />
          <div className="hidden min-w-0 sm:block">
            <p className={`text-sm font-semibold tracking-tight ${isHome ? "text-white" : "text-slate-950"}`}>星点评</p>
            <p className={`text-[11px] ${isHome ? "text-sky-100/64" : "text-slate-500"}`}>AI 工具发现</p>
          </div>
        </Link>

        <div className="hidden flex-1 md:block" />

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={TOOL_SUBMISSION_URL}
            className={`header-utility-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${isHome ? "text-slate-100" : "text-slate-800"}`}
          >
            提交工具
          </Link>
          <HeaderAuthControls authHref={authHref} />
        </div>

        <HeaderMobileMenu currentPath={currentPath} authHref={authHref} />
      </div>
    </header>
  );
}
