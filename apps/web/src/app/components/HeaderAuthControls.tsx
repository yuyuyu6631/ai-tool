"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "./auth/AuthProvider";

interface HeaderAuthControlsProps {
  authHref: string;
}

function GuestAction({ authHref }: HeaderAuthControlsProps) {
  return (
    <Link href={authHref} className="header-auth-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
      <UserRound className="h-4 w-4" />
      登录
    </Link>
  );
}

export default function HeaderAuthControls({ authHref }: HeaderAuthControlsProps) {
  const { availability, currentUser, status, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Keep the current UI if logout fails.
    }
  }

  if (!mounted || status === "loading" || !currentUser) {
    return (
      <>
        {availability !== "ready" ? <span className="text-xs font-medium text-slate-500">服务未就绪</span> : null}
        <GuestAction authHref={authHref} />
      </>
    );
  }

  return (
    <>
      {currentUser.role === "admin" ? (
        <Link href="/admin" className="header-utility-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-800">
          后台
        </Link>
      ) : null}
      <Link href={authHref} className="user-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-800">
        <UserRound className="h-4 w-4" />
        {currentUser.username}
      </Link>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="header-utility-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-800"
      >
        <LogOut className="h-4 w-4" />
        退出
      </button>
    </>
  );
}
