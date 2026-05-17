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
        className="header-utility-button relative z-[70] grid h-11 w-11 place-items-center rounded-full md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "关闭导航" : "打开导航"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-[68px] z-[60] border-t border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-glass)] backdrop-blur-xl md:hidden">
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
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100/90"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={withPublicPath(item.href)}
                  className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                    isHeaderNavActive(currentPath, item.href)
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100/90"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              )
            ))}
            <Link
              href={authHref}
              className="rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100/90"
              onClick={() => setOpen(false)}
            >
              {authLabel}
            </Link>
            {mounted && currentUser?.role === "admin" ? (
              <Link
                href={withPublicPath("/admin")}
                className="rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100/90"
                onClick={() => setOpen(false)}
              >
                后台
              </Link>
            ) : null}
            {mounted && currentUser ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100/90"
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
