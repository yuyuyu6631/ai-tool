"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "./auth/AuthProvider";
import { headerNavItems, isHeaderNavActive } from "./header-nav";
import ThemeToggle from "./ThemeToggle";
import { withPublicPath } from "../lib/public-path";

interface HeaderMobileMenuProps {
  currentPath: string;
  authHref: string;
}

export default function HeaderMobileMenu({ currentPath, authHref }: HeaderMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogout() {
    try {
      await logout();
      setOpen(false);
    } catch {
      // Keep the current UI if logout fails.
    }
  }

  const authLabel = mounted && currentUser ? `账户：${currentUser.username}` : "登录";

  return (
    <>
      <button
        type="button"
        className="header-utility-button relative z-[70] grid h-11 w-11 place-items-center rounded-full md:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "关闭导航" : "打开导航"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="site-header-mobile-panel fixed inset-x-0 top-[68px] z-[60] border-t shadow-[var(--home-header-shadow)] backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-4 sm:px-6">
            <div className="mb-1 flex justify-end">
              <ThemeToggle />
            </div>
            {headerNavItems.map((item) => (
              item.href === "/" ? (
                <a
                  key={item.href}
                  href={withPublicPath(item.href)}
                  className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    isHeaderNavActive(currentPath, item.href)
                      ? "home-nav-active"
                      : "home-nav-link"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    isHeaderNavActive(currentPath, item.href)
                      ? "home-nav-active"
                      : "home-nav-link"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              )
            ))}
            <Link
              href={authHref}
              className="home-nav-link rounded-2xl px-3 py-2.5 text-sm font-medium transition"
              onClick={() => setOpen(false)}
            >
              {authLabel}
            </Link>
            {mounted && currentUser?.role === "admin" ? (
              <Link
                href="/admin"
                className="home-nav-link rounded-2xl px-3 py-2.5 text-sm font-medium transition"
                onClick={() => setOpen(false)}
              >
                后台
              </Link>
            ) : null}
            {mounted && currentUser ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="home-nav-link rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition"
              >
                退出
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
