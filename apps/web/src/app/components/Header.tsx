import HeaderAuthControls from "./HeaderAuthControls";
import HeaderMobileMenu from "./HeaderMobileMenu";
import PlatformLogo from "./PlatformLogo";
import ThemeToggle from "./ThemeToggle";
import { Send } from "lucide-react";
import { headerNavItems, isHeaderNavActive } from "./header-nav";
import { TOOL_SUBMISSION_URL } from "../lib/catalog-utils";
import { withPublicPath } from "../lib/public-path";

interface HeaderProps {
  currentPath: string;
  currentRoute?: string;
  forceHomeHeader?: boolean;
}

export default function Header({ currentPath, currentRoute = currentPath, forceHomeHeader }: HeaderProps) {
  const authHref = withPublicPath(currentPath === "/auth" ? "/auth" : `/auth?next=${encodeURIComponent(withPublicPath(currentRoute))}`);
  const isHome = currentPath === "/" || forceHomeHeader;

  return (
    <header className="site-header site-header--home-light sticky top-0 z-50">
      <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href={withPublicPath("/")}
          className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15"
        >
          <PlatformLogo />
          <div className="hidden min-w-0 sm:block">
            <p className="home-header-brand-title text-sm font-semibold tracking-tight">星点评</p>
            <p className="home-header-brand-subtitle text-[11px]">AI 经验社区</p>
          </div>
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="主导航">
          {headerNavItems.map((item) => (
            <a
              key={item.href}
              href={withPublicPath(item.href)}
              aria-current={isHeaderNavActive(currentRoute, item.href) ? "page" : undefined}
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                isHeaderNavActive(currentRoute, item.href)
                  ? "home-nav-active"
                  : "home-nav-link"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <a
            href={TOOL_SUBMISSION_URL}
            className="header-utility-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
          >
            <Send className="h-4 w-4" />
            提交工具
          </a>
          <HeaderAuthControls authHref={authHref} />
        </div>

        <HeaderMobileMenu currentPath={isHome ? currentRoute : currentPath} authHref={authHref} />
      </div>
    </header>
  );
}
